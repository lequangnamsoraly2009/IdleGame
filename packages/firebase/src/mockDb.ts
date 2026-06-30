import { GameSaveData, HeroState, EquipmentItem, QuestState, QuestTemplate } from '@idle-rpg/shared';
import { createItemInstance, DEFAULT_ITEM_TEMPLATES, calculateItemStats, calculateUpgradeCost } from '@idle-rpg/shared';

// Predefined starting stats and equipment
export function generateStarterSave(
  userId: string, 
  heroClass: 'knight' | 'mage' | 'assassin' = 'knight',
  heroName?: string
): GameSaveData {
  let initialStats = {
    maxHp: 100,
    attack: 10,
    defense: 5,
    speed: 100,
    critRate: 0.05,
    critDamage: 1.5
  };

  if (heroClass === 'knight') {
    initialStats = {
      maxHp: 120,
      attack: 8,
      defense: 8,
      speed: 95,
      critRate: 0.05,
      critDamage: 1.5
    };
  } else if (heroClass === 'mage') {
    initialStats = {
      maxHp: 85,
      attack: 14,
      defense: 3,
      speed: 100,
      critRate: 0.08,
      critDamage: 1.7
    };
  } else if (heroClass === 'assassin') {
    initialStats = {
      maxHp: 90,
      attack: 11,
      defense: 4,
      speed: 125,
      critRate: 0.15,
      critDamage: 1.8
    };
  }

  const initialHero: HeroState = {
    name: heroName || 'Hero',
    level: 1,
    exp: 0,
    maxExp: 100, // levelUpExp(1)
    baseStats: { ...initialStats },
    currentStats: { ...initialStats },
    currentHp: initialStats.maxHp,
    gold: 500,
    diamonds: 50,
    prestigePoints: 0,
    prestigeCount: 0,
    aetherShards: 0,
    shardUpgrades: { attack: 0, magicAttack: 0, maxHp: 0 },
    potions: 5,
    autoUsePotion: false,
    heroClass
  };

  // Generate starting equipment based on class
  let wpnId = 't_wpn_rusty';
  let armId = 't_arm_rag';
  let btsId = 't_bts_worn';
  
  if (heroClass === 'mage') {
    wpnId = 't_wpn_rusty_staff';
    armId = 't_arm_rag_robe';
    btsId = 't_bts_worn_mage';
  } else if (heroClass === 'assassin') {
    wpnId = 't_wpn_rusty_dagger';
    armId = 't_arm_rag_cloak';
    btsId = 't_bts_worn_assassin';
  }

  const startingWeapon = DEFAULT_ITEM_TEMPLATES.find(t => t.id === wpnId);
  const startingArmor = DEFAULT_ITEM_TEMPLATES.find(t => t.id === armId);
  const startingBoots = DEFAULT_ITEM_TEMPLATES.find(t => t.id === btsId);

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
      type: 'newbie',
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
      type: 'daily',
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
      type: 'weekly',
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
    lastDailyResetAt: Date.now(),
    lastWeeklyResetAt: Date.now(),
    hero: initialHero,
    inventory,
    quests,
    prestigeBonuses: {
      attackMultiplier: 1.0,
      hpMultiplier: 1.0,
      goldMultiplier: 1.0
    },
    stagesCleared: 0,
    activeStage: 1,
    currentWave: 1,
    autoAdvance: true
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
    const selectedClass = (localStorage.getItem('selected_class') || 'knight') as 'knight' | 'mage' | 'assassin';
    const selectedName = localStorage.getItem('selected_name') || 'Hero';
    if (!data) {
      // New save initialization
      const starterSave = generateStarterSave(userId, selectedClass, selectedName);
      localStorage.removeItem('selected_class'); // clean up
      localStorage.removeItem('selected_name'); // clean up
      await mockDb.saveGame(starterSave);
      return starterSave;
    }
    try {
      const parsed = JSON.parse(data) as GameSaveData;
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
      if (!parsed.inventory) parsed.inventory = starter.inventory;
      if (!parsed.quests) parsed.quests = starter.quests;
      if (parsed.activeStage === undefined) parsed.activeStage = starter.activeStage;
      if (!parsed.prestigeBonuses) parsed.prestigeBonuses = starter.prestigeBonuses;

      // Ensure each item in the inventory is fully formed
      if (Array.isArray(parsed.inventory)) {
        parsed.inventory = parsed.inventory.map(item => {
          if (!item) return item;
          if (!item.stats) {
            const template = DEFAULT_ITEM_TEMPLATES.find(t => t.id === item.templateId);
            if (template) {
              item.stats = calculateItemStats(item.slot, item.rarity, item.level || 1);
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
    } catch {
      const starterSave = generateStarterSave(userId);
      await mockDb.saveGame(starterSave);
      return starterSave;
    }
  },

  loadQuestTemplates: async (): Promise<QuestTemplate[]> => {
    const templatesStr = localStorage.getItem('idle_rpg_quest_templates');
    if (!templatesStr) {
      localStorage.setItem('idle_rpg_quest_templates', JSON.stringify(DEFAULT_QUEST_TEMPLATES));
      return DEFAULT_QUEST_TEMPLATES;
    }
    try {
      return JSON.parse(templatesStr);
    } catch {
      return DEFAULT_QUEST_TEMPLATES;
    }
  },

  saveQuestTemplate: async (template: QuestTemplate): Promise<void> => {
    const templates = await mockDb.loadQuestTemplates();
    const existingIdx = templates.findIndex(t => t.id === template.id);
    if (existingIdx !== -1) {
      templates[existingIdx] = template;
    } else {
      templates.push(template);
    }
    localStorage.setItem('idle_rpg_quest_templates', JSON.stringify(templates));
  },

  deleteQuestTemplate: async (templateId: string): Promise<void> => {
    const templates = await mockDb.loadQuestTemplates();
    const filtered = templates.filter(t => t.id !== templateId);
    localStorage.setItem('idle_rpg_quest_templates', JSON.stringify(filtered));
  }
};

const DEFAULT_QUEST_TEMPLATES: QuestTemplate[] = [
  {
    id: 'q1',
    type: 'newbie',
    titleVi: 'Chiến Công Đầu',
    titleEn: 'First Blood',
    descriptionVi: 'Tiêu diệt 5 quái vật để chứng minh kỹ năng chiến đấu.',
    descriptionEn: 'Defeat 5 monsters to prove your combat skills.',
    targetType: 'defeat_monster',
    targetCount: 5,
    rewardGold: 100,
    rewardDiamonds: 10
  },
  {
    id: 'q2',
    type: 'daily',
    titleVi: 'Tích Lũy Tài Sản',
    titleEn: 'Accumulate Wealth',
    descriptionVi: 'Tích lũy tổng cộng 1.000 Vàng.',
    descriptionEn: 'Gather 1,000 total gold.',
    targetType: 'earn_gold',
    targetCount: 1000,
    rewardGold: 200,
    rewardDiamonds: 15
  },
  {
    id: 'q3',
    type: 'weekly',
    titleVi: 'Sẵn Sàng Chiến Đấu',
    titleEn: 'Ready for Battle',
    descriptionVi: 'Nâng cấp một trang bị bất kỳ lên Cấp 2.',
    descriptionEn: 'Upgrade an equipment item to Level 2.',
    targetType: 'upgrade_equipment',
    targetCount: 1,
    rewardGold: 150,
    rewardDiamonds: 10
  },
  {
    id: 'q4',
    type: 'achievement',
    titleVi: 'Kẻ Diệt Địch',
    titleEn: 'Monster Slayer',
    descriptionVi: 'Tiêu diệt 100 quái vật.',
    descriptionEn: 'Defeat 100 monsters.',
    targetType: 'defeat_monster',
    targetCount: 100,
    rewardGold: 1000,
    rewardDiamonds: 50
  }
];

