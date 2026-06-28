import { GameSaveData, HeroState, EquipmentItem, QuestState } from '@idle-rpg/shared';
import { createItemInstance, DEFAULT_ITEM_TEMPLATES } from '@idle-rpg/shared';

// Predefined starting stats and equipment
export function generateStarterSave(userId: string): GameSaveData {
  const initialHero: HeroState = {
    level: 1,
    exp: 0,
    maxExp: 100, // levelUpExp(1)
    baseStats: {
      maxHp: 100,
      attack: 10,
      defense: 5,
      speed: 100,
      critRate: 0.05,
      critDamage: 1.5
    },
    currentStats: {
      maxHp: 100,
      attack: 10,
      defense: 5,
      speed: 100,
      critRate: 0.05,
      critDamage: 1.5
    },
    currentHp: 100,
    gold: 500,
    diamonds: 50,
    prestigePoints: 0,
    prestigeCount: 0
  };

  // Generate starting equipment
  const startingWeapon = DEFAULT_ITEM_TEMPLATES.find(t => t.id === 't_wpn_rusty');
  const startingArmor = DEFAULT_ITEM_TEMPLATES.find(t => t.id === 't_arm_rag');
  const startingBoots = DEFAULT_ITEM_TEMPLATES.find(t => t.id === 't_bts_worn');

  const inventory: EquipmentItem[] = [];
  if (startingWeapon) {
    const item = createItemInstance(startingWeapon);
    item.equipped = true;
    inventory.push(item);
  }
  if (startingArmor) {
    const item = createItemInstance(startingArmor);
    item.equipped = true;
    inventory.push(item);
  }
  if (startingBoots) {
    const item = createItemInstance(startingBoots);
    item.equipped = true;
    inventory.push(item);
  }

  const quests: QuestState[] = [
    {
      id: 'q1',
      title: 'First Blood',
      description: 'Defeat 5 monsters to prove your combat skills.',
      targetType: 'defeat_monster',
      targetCount: 5,
      currentCount: 0,
      rewardGold: 100,
      rewardDiamonds: 10,
      completed: false,
      claimed: false
    },
    {
      id: 'q2',
      title: 'Accumulate Wealth',
      description: 'Gather 1,000 total gold.',
      targetType: 'earn_gold',
      targetCount: 1000,
      currentCount: 500,
      rewardGold: 200,
      rewardDiamonds: 15,
      completed: false,
      claimed: false
    },
    {
      id: 'q3',
      title: 'Ready for Battle',
      description: 'Upgrade an equipment item to Level 2.',
      targetType: 'upgrade_equipment',
      targetCount: 1,
      currentCount: 0,
      rewardGold: 150,
      rewardDiamonds: 10,
      completed: false,
      claimed: false
    }
  ];

  return {
    userId,
    lastSavedAt: Date.now(),
    hero: initialHero,
    inventory,
    quests,
    prestigeBonuses: {
      attackMultiplier: 1.0,
      hpMultiplier: 1.0,
      goldMultiplier: 1.0
    },
    stagesCleared: 0,
    activeStage: 1
  };
}

// Simulated Local Database State
const STORAGE_KEYS = {
  USERS: 'idle_rpg_users',
  CURRENT_USER: 'idle_rpg_current_user',
  SAVED_GAME: 'idle_rpg_save_'
};

interface MockUser {
  id: string;
  email: string;
  password?: string; // in mock we keep it simple
}

type AuthCallback = (user: MockUser | null) => void;
const authListeners = new Set<AuthCallback>();

function getMockUsers(): MockUser[] {
  const users = localStorage.getItem(STORAGE_KEYS.USERS);
  return users ? JSON.parse(users) : [];
}

function saveMockUsers(users: MockUser[]) {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
}

function getLoggedInUser(): MockUser | null {
  const user = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  return user ? JSON.parse(user) : null;
}

function notifyAuthListeners(user: MockUser | null) {
  authListeners.forEach(listener => listener(user));
}

export const mockAuth = {
  createUser: async (email: string, _pass: string): Promise<MockUser> => {
    await new Promise(resolve => setTimeout(resolve, 500)); // simulate latency
    const users = getMockUsers();
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('Email already in use.');
    }
    const newUser: MockUser = {
      id: 'usr_' + Math.random().toString(36).substr(2, 9),
      email
    };
    users.push(newUser);
    saveMockUsers(users);
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(newUser));
    notifyAuthListeners(newUser);
    return newUser;
  },

  signIn: async (email: string, _pass: string): Promise<MockUser> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const users = getMockUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      // For convenience in mock mode, auto-create account if it doesn't exist
      const newUser: MockUser = {
        id: 'usr_' + Math.random().toString(36).substr(2, 9),
        email
      };
      users.push(newUser);
      saveMockUsers(users);
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(newUser));
      notifyAuthListeners(newUser);
      return newUser;
    }
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    notifyAuthListeners(user);
    return user;
  },

  signOut: async (): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    notifyAuthListeners(null);
  },

  onAuthStateChanged: (callback: AuthCallback) => {
    authListeners.add(callback);
    // Execute immediately with current state
    callback(getLoggedInUser());
    return () => {
      authListeners.delete(callback);
    };
  },

  getCurrentUser: (): MockUser | null => {
    return getLoggedInUser();
  }
};

export const mockDb = {
  saveGame: async (data: GameSaveData): Promise<void> => {
    localStorage.setItem(STORAGE_KEYS.SAVED_GAME + data.userId, JSON.stringify(data));
  },

  loadGame: async (userId: string): Promise<GameSaveData | null> => {
    const data = localStorage.getItem(STORAGE_KEYS.SAVED_GAME + userId);
    if (!data) {
      // New save initialization
      const starterSave = generateStarterSave(userId);
      await mockDb.saveGame(starterSave);
      return starterSave;
    }
    try {
      const parsed = JSON.parse(data) as GameSaveData;
      // Self-heal corrupted or outdated schemas by merging template defaults
      const starter = generateStarterSave(userId);
      if (!parsed.hero) parsed.hero = starter.hero;
      if (!parsed.inventory) parsed.inventory = starter.inventory;
      if (!parsed.quests) parsed.quests = starter.quests;
      if (parsed.activeStage === undefined) parsed.activeStage = starter.activeStage;
      if (!parsed.prestigeBonuses) parsed.prestigeBonuses = starter.prestigeBonuses;
      return parsed;
    } catch {
      const starterSave = generateStarterSave(userId);
      await mockDb.saveGame(starterSave);
      return starterSave;
    }
  }
};
