import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut as fbSignOut, onAuthStateChanged as fbOnAuthStateChanged } from 'firebase/auth';
import { getDatabase, ref, get, set, remove } from 'firebase/database';
import { GameSaveData, DEFAULT_ITEM_TEMPLATES, calculateItemStats, calculateUpgradeCost, QuestTemplate, EquipmentItem, QuestState, scaleStatsByQuality } from '@idle-rpg/shared';
import { mockAuth, mockDb, generateStarterSave } from './mockDb';

export interface UserSession {
  id: string;
  email: string;
}

export interface AuthService {
  signIn: (email: string, pass: string) => Promise<UserSession>;
  createUser: (email: string, pass: string) => Promise<UserSession>;
  signOut: () => Promise<void>;
  onAuthStateChanged: (callback: (user: UserSession | null) => void) => () => void;
  getCurrentUser: () => UserSession | null;
}

export interface DbService {
  saveGame: (data: GameSaveData) => Promise<void>;
  loadGame: (userId: string) => Promise<GameSaveData | null>;
  loadQuestTemplates: () => Promise<QuestTemplate[]>;
  saveQuestTemplate: (template: QuestTemplate) => Promise<void>;
  deleteQuestTemplate: (templateId: string) => Promise<void>;
}

// Check environment variables (supports standard Vite import.meta.env prefixes or process.env fallback)
const firebaseConfig = {
  apiKey: typeof process !== 'undefined' ? process.env.VITE_FIREBASE_API_KEY : undefined,
  authDomain: typeof process !== 'undefined' ? process.env.VITE_FIREBASE_AUTH_DOMAIN : undefined,
  projectId: typeof process !== 'undefined' ? process.env.VITE_FIREBASE_PROJECT_ID : undefined,
  storageBucket: typeof process !== 'undefined' ? process.env.VITE_FIREBASE_STORAGE_BUCKET : undefined,
  messagingSenderId: typeof process !== 'undefined' ? process.env.VITE_FIREBASE_MESSAGING_SENDER_ID : undefined,
  appId: typeof process !== 'undefined' ? process.env.VITE_FIREBASE_APP_ID : undefined,
  databaseURL: typeof process !== 'undefined' ? process.env.VITE_FIREBASE_DATABASE_URL : undefined
};

// Check if window or environment has VITE environment variables (Vite-specific)
const getViteEnv = (key: string): string | undefined => {
  try {
    // @ts-ignore
    return import.meta.env[key];
  } catch {
    return undefined;
  }
};

const apiKey = getViteEnv('VITE_FIREBASE_API_KEY') || firebaseConfig.apiKey;
const authDomain = getViteEnv('VITE_FIREBASE_AUTH_DOMAIN') || firebaseConfig.authDomain;
const projectId = getViteEnv('VITE_FIREBASE_PROJECT_ID') || firebaseConfig.projectId;

const forceMock = typeof sessionStorage !== 'undefined' && sessionStorage.getItem('idle_rpg_force_mock') === 'true';
const isFirebaseConfigured = !!(apiKey && authDomain && projectId) && !forceMock;

export let authService: AuthService;
export let dbService: DbService;
export let isUsingMock = true;

if (isFirebaseConfigured) {
  // Initialize Real Firebase
  const config = {
    apiKey,
    authDomain,
    projectId,
    storageBucket: getViteEnv('VITE_FIREBASE_STORAGE_BUCKET') || firebaseConfig.storageBucket,
    messagingSenderId: getViteEnv('VITE_FIREBASE_MESSAGING_SENDER_ID') || firebaseConfig.messagingSenderId,
    appId: getViteEnv('VITE_FIREBASE_APP_ID') || firebaseConfig.appId,
    databaseURL: getViteEnv('VITE_FIREBASE_DATABASE_URL') || firebaseConfig.databaseURL
  };

  const app = getApps().length === 0 ? initializeApp(config) : getApps()[0];
  const fbAuth = getAuth(app);
  const fbDb = getDatabase(app);
  isUsingMock = false;

  authService = {
    signIn: async (email, pass) => {
      const credential = await signInWithEmailAndPassword(fbAuth, email, pass);
      return {
        id: credential.user.uid,
        email: credential.user.email || email
      };
    },
    createUser: async (email, pass) => {
      const credential = await createUserWithEmailAndPassword(fbAuth, email, pass);
      return {
        id: credential.user.uid,
        email: credential.user.email || email
      };
    },
    signOut: async () => {
      await fbSignOut(fbAuth);
    },
    onAuthStateChanged: (callback) => {
      return fbOnAuthStateChanged(fbAuth, (user) => {
        if (user) {
          callback({
            id: user.uid,
            email: user.email || ''
          });
        } else {
          callback(null);
        }
      });
    },
    getCurrentUser: () => {
      const user = fbAuth.currentUser;
      return user ? { id: user.uid, email: user.email || '' } : null;
    }
  };

  dbService = {
    saveGame: async (data) => {
      try {
        const dbRef = ref(fbDb, `idleRpg/users/${data.userId}`);
        const sanitized = JSON.parse(JSON.stringify(data));
        await set(dbRef, sanitized);
      } catch (err) {
        console.warn('Firebase Realtime Database save failed, falling back to LocalStorage:', err);
        await mockDb.saveGame(data);
      }
    },
    loadGame: async (userId) => {
      try {
        const dbRef = ref(fbDb, `idleRpg/users/${userId}`);
        const snapshot = await get(dbRef);
        const selectedClass = (localStorage.getItem('selected_class') || 'knight') as 'knight' | 'mage' | 'assassin';
        const selectedName = localStorage.getItem('selected_name') || 'Hero';

        const normalizeArray = <T>(val: any): T[] => {
          if (!val) return [];
          if (Array.isArray(val)) return val.filter(Boolean);
          if (typeof val === 'object') {
            return Object.values(val).filter(Boolean) as T[];
          }
          return [];
        };

        if (snapshot.exists()) {
          const parsed = snapshot.val() as GameSaveData;
          // Self-heal corrupted or outdated schemas by merging template defaults
          const starter = generateStarterSave(userId, selectedClass, selectedName);
          if (!parsed.hero) {
            parsed.hero = starter.hero;
          } else {
            parsed.hero = { ...starter.hero, ...parsed.hero };
            if (!parsed.hero.name) parsed.hero.name = starter.hero.name || 'Hero';
            if (!parsed.hero.baseStats) parsed.hero.baseStats = starter.hero.baseStats;
            if (!parsed.hero.currentStats) parsed.hero.currentStats = starter.hero.currentStats;
            if (!parsed.hero.heroClass) parsed.hero.heroClass = 'knight';
          }
          parsed.inventory = normalizeArray<EquipmentItem>(parsed.inventory || starter.inventory);
          parsed.quests = normalizeArray<QuestState>(parsed.quests || starter.quests);
          if (parsed.hero.traits) {
            parsed.hero.traits = normalizeArray<any>(parsed.hero.traits);
          }
          if (parsed.activeStage === undefined) parsed.activeStage = starter.activeStage;
          if (!parsed.prestigeBonuses) parsed.prestigeBonuses = starter.prestigeBonuses;

          // Ensure each item in the inventory is fully formed
          if (Array.isArray(parsed.inventory)) {
            parsed.inventory = parsed.inventory.map(item => {
              if (!item) return item;
              if (!item.stats) {
                const template = DEFAULT_ITEM_TEMPLATES.find(t => t.id === item.templateId);
                if (template) {
                  const baseStats = calculateItemStats(item.slot, item.rarity, item.level || 1);
                  item.stats = scaleStatsByQuality(baseStats, item.quality || 100);
                } else {
                  item.stats = { maxHp: 0, attack: 0, defense: 0, speed: 0, critRate: 0, critDamage: 1.5 };
                }
              }
              if (item.upgradeCost === undefined) {
                item.upgradeCost = calculateUpgradeCost(item.slot, item.rarity, item.level || 1);
              }
              return item;
            }).filter(Boolean);
          }

          return parsed;
        }
        // New save initialization
        const starterSave = generateStarterSave(userId, selectedClass, selectedName);
        localStorage.removeItem('selected_class'); // clean up
        localStorage.removeItem('selected_name'); // clean up
        await set(dbRef, starterSave);
        return starterSave;
      } catch (err) {
        console.warn('Firebase Realtime Database load failed, falling back to LocalStorage:', err);
        return await mockDb.loadGame(userId);
      }
    },
    loadQuestTemplates: async (): Promise<QuestTemplate[]> => {
      try {
        const dbRef = ref(fbDb, 'idleRpg/config/quests');
        const snapshot = await get(dbRef);
        if (snapshot.exists()) {
          const val = snapshot.val();
          return Object.values(val) as QuestTemplate[];
        }
        return [];
      } catch (err) {
        console.warn('Firebase Realtime Database loadQuestTemplates failed, falling back to mockDb:', err);
        return await mockDb.loadQuestTemplates();
      }
    },
    saveQuestTemplate: async (template: QuestTemplate): Promise<void> => {
      try {
        const dbRef = ref(fbDb, `idleRpg/config/quests/${template.id}`);
        const sanitized = JSON.parse(JSON.stringify(template));
        await set(dbRef, sanitized);
      } catch (err) {
        console.warn('Firebase Realtime Database saveQuestTemplate failed, falling back to mockDb:', err);
        await mockDb.saveQuestTemplate(template);
      }
    },
    deleteQuestTemplate: async (templateId: string): Promise<void> => {
      try {
        const dbRef = ref(fbDb, `idleRpg/config/quests/${templateId}`);
        await remove(dbRef);
      } catch (err) {
        console.warn('Firebase Realtime Database deleteQuestTemplate failed, falling back to mockDb:', err);
        await mockDb.deleteQuestTemplate(templateId);
      }
    }
  };
} else {
  // Initialize Local Mock services
  authService = {
    signIn: mockAuth.signIn,
    createUser: mockAuth.createUser,
    signOut: mockAuth.signOut,
    onAuthStateChanged: mockAuth.onAuthStateChanged,
    getCurrentUser: mockAuth.getCurrentUser
  };

  dbService = {
    saveGame: mockDb.saveGame,
    loadGame: mockDb.loadGame,
    loadQuestTemplates: mockDb.loadQuestTemplates,
    saveQuestTemplate: mockDb.saveQuestTemplate,
    deleteQuestTemplate: mockDb.deleteQuestTemplate
  };
}
