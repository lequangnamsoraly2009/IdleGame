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
    goldUpgrades: { attack: 0, hp: 0, hpRecovery: 0, critDamage: 0 },
    traits: [
      { id: 1, grade: 'C', stat: 'atk', value: 10, locked: false },
      { id: 2, grade: 'C', stat: 'hp', value: 10, locked: false },
      { id: 3, grade: 'C', stat: 'crit', value: 10, locked: false },
      { id: 4, grade: 'C', stat: 'gold', value: 10, locked: false },
      { id: 5, grade: 'C', stat: 'atk', value: 10, locked: false }
    ],
    potions: 5,
    autoUsePotion: false,
    autoDismantleCommon: false,
    autoDismantleUncommon: false,
    autoDismantleRare: false,
    autoBuyPotions: false,
    gems: {},
    dungeonTickets: 3,
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
        if (!parsed.hero.goldUpgrades) parsed.hero.goldUpgrades = starter.hero.goldUpgrades || { attack: 0, hp: 0, hpRecovery: 0, critDamage: 0 };
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
  },
  {
    id: 'q5',
    type: 'newbie',
    titleVi: 'Bước Đầu Học Hỏi',
    titleEn: 'First Steps',
    descriptionVi: 'Đạt cấp độ 5 để mở khóa các tính năng mới.',
    descriptionEn: 'Reach level 5 to unlock new features.',
    targetType: 'reach_level',
    targetCount: 5,
    rewardGold: 200,
    rewardDiamonds: 10
  },
  {
    id: 'q6',
    type: 'newbie',
    titleVi: 'Thợ Rèn Tập Sự',
    titleEn: 'Apprentice Blacksmith',
    descriptionVi: 'Nâng cấp trang bị 3 lần để gia tăng sức mạnh.',
    descriptionEn: 'Upgrade equipment 3 times to increase power.',
    targetType: 'upgrade_equipment',
    targetCount: 3,
    rewardGold: 300,
    rewardDiamonds: 15
  },
  {
    id: 'q7',
    type: 'newbie',
    titleVi: 'Khởi Đầu Hoàn Hảo',
    titleEn: 'Perfect Start',
    descriptionVi: 'Tiêu diệt 25 quái vật trên đường đi.',
    descriptionEn: 'Defeat 25 monsters along the way.',
    targetType: 'defeat_monster',
    targetCount: 25,
    rewardGold: 500,
    rewardDiamonds: 20
  },
  {
    id: 'q8',
    type: 'daily',
    titleVi: 'Chiến Binh Chăm Chỉ',
    titleEn: 'Diligent Warrior',
    descriptionVi: 'Tiêu diệt 30 quái vật trong ngày.',
    descriptionEn: 'Defeat 30 monsters today.',
    targetType: 'defeat_monster',
    targetCount: 30,
    rewardGold: 300,
    rewardDiamonds: 10
  },
  {
    id: 'q9',
    type: 'daily',
    titleVi: 'Thu Thập Tài Nguyên',
    titleEn: 'Gold Collector',
    descriptionVi: 'Thu hoạch 5.000 Vàng từ ải.',
    descriptionEn: 'Collect 5,000 Gold from stages.',
    targetType: 'earn_gold',
    targetCount: 5000,
    rewardGold: 500,
    rewardDiamonds: 15
  },
  {
    id: 'q10',
    type: 'daily',
    titleVi: 'Rèn Luyện Bản Thân',
    titleEn: 'Self-Improvement',
    descriptionVi: 'Nâng cấp trang bị của bạn 2 lần.',
    descriptionEn: 'Upgrade your equipment 2 times.',
    targetType: 'upgrade_equipment',
    targetCount: 2,
    rewardGold: 400,
    rewardDiamonds: 12
  },
  {
    id: 'q11',
    type: 'daily',
    titleVi: 'Nỗ Lực Không Ngừng',
    titleEn: 'Ceaseless Effort',
    descriptionVi: 'Đạt cấp độ 10.',
    descriptionEn: 'Reach level 10.',
    targetType: 'reach_level',
    targetCount: 10,
    rewardGold: 600,
    rewardDiamonds: 20
  },
  {
    id: 'q12',
    type: 'daily',
    titleVi: 'Diệt Địch Mỗi Ngày',
    titleEn: 'Daily Extermination',
    descriptionVi: 'Tiêu diệt 50 quái vật để giữ vững trật tự.',
    descriptionEn: 'Defeat 50 monsters to keep the peace.',
    targetType: 'defeat_monster',
    targetCount: 50,
    rewardGold: 500,
    rewardDiamonds: 15
  },
  {
    id: 'q13',
    type: 'daily',
    titleVi: 'Nhà Giao Dịch Vàng',
    titleEn: 'Gold Trader',
    descriptionVi: 'Tích lũy tổng cộng 10.000 Vàng trong ngày.',
    descriptionEn: 'Gather 10,000 total gold today.',
    targetType: 'earn_gold',
    targetCount: 10000,
    rewardGold: 800,
    rewardDiamonds: 18
  },
  {
    id: 'q14',
    type: 'weekly',
    titleVi: 'Chiến Dịch Tuần',
    titleEn: 'Weekly Campaign',
    descriptionVi: 'Tiêu diệt 300 quái vật trong tuần này.',
    descriptionEn: 'Defeat 300 monsters this week.',
    targetType: 'defeat_monster',
    targetCount: 300,
    rewardGold: 2000,
    rewardDiamonds: 50
  },
  {
    id: 'q15',
    type: 'weekly',
    titleVi: 'Khát Vọng Giàu Có',
    titleEn: 'Aspiration for Wealth',
    descriptionVi: 'Tích lũy tổng cộng 50.000 Vàng.',
    descriptionEn: 'Gather 50,000 total gold.',
    targetType: 'earn_gold',
    targetCount: 50000,
    rewardGold: 3000,
    rewardDiamonds: 70
  },
  {
    id: 'q16',
    type: 'weekly',
    titleVi: 'Bậc Thầy Cải Tiến',
    titleEn: 'Master of Customization',
    descriptionVi: 'Nâng cấp trang bị của bạn 10 lần.',
    descriptionEn: 'Upgrade your equipment 10 times.',
    targetType: 'upgrade_equipment',
    targetCount: 10,
    rewardGold: 2500,
    rewardDiamonds: 60
  },
  {
    id: 'q17',
    type: 'weekly',
    titleVi: 'Đạt Giới Hạn Mới',
    titleEn: 'New Limit',
    descriptionVi: 'Đạt cấp độ 20.',
    descriptionEn: 'Reach level 20.',
    targetType: 'reach_level',
    targetCount: 20,
    rewardGold: 4000,
    rewardDiamonds: 80
  },
  {
    id: 'q18',
    type: 'weekly',
    titleVi: 'Khai Thác Mỏ Vàng',
    titleEn: 'Gold Mine Extraction',
    descriptionVi: 'Tích lũy tổng cộng 100.000 Vàng trong tuần.',
    descriptionEn: 'Gather 100,000 total gold this week.',
    targetType: 'earn_gold',
    targetCount: 100000,
    rewardGold: 5000,
    rewardDiamonds: 100
  },
  {
    id: 'q19',
    type: 'weekly',
    titleVi: 'Càn Quét Chiến Trường',
    titleEn: 'Sweep the Battlefield',
    descriptionVi: 'Tiêu diệt 500 quái vật để lập chiến công tuần.',
    descriptionEn: 'Defeat 500 monsters to claim weekly glory.',
    targetType: 'defeat_monster',
    targetCount: 500,
    rewardGold: 3500,
    rewardDiamonds: 80
  },
  {
    id: 'q20',
    type: 'achievement',
    titleVi: 'Chinh Phục Thử Thách',
    titleEn: 'Great Conqueror',
    descriptionVi: 'Tiêu diệt tổng cộng 1.000 quái vật.',
    descriptionEn: 'Defeat 1,000 total monsters.',
    targetType: 'defeat_monster',
    targetCount: 1000,
    rewardGold: 8000,
    rewardDiamonds: 150
  },
  {
    id: 'q21',
    type: 'achievement',
    titleVi: 'Triệu Phú Vàng',
    titleEn: 'Gold Millionaire',
    descriptionVi: 'Tích lũy tích lũy tổng cộng 500.000 Vàng.',
    descriptionEn: 'Gather 500,000 total gold.',
    targetType: 'earn_gold',
    targetCount: 500000,
    rewardGold: 10000,
    rewardDiamonds: 200
  },
  {
    id: 'q22',
    type: 'achievement',
    titleVi: 'Anh Hùng Cấp Cao',
    titleEn: 'High Rank Hero',
    descriptionVi: 'Đạt cấp độ 30.',
    descriptionEn: 'Reach level 30.',
    targetType: 'reach_level',
    targetCount: 30,
    rewardGold: 12000,
    rewardDiamonds: 250
  },
  {
    id: 'q23',
    type: 'achievement',
    titleVi: 'Huyền Thoại Nâng Cấp',
    titleEn: 'Legendary Blacksmith',
    descriptionVi: 'Nâng cấp trang bị 30 lần.',
    descriptionEn: 'Upgrade equipment 30 times.',
    targetType: 'upgrade_equipment',
    targetCount: 30,
    rewardGold: 15000,
    rewardDiamonds: 300
  },
  {
    id: 'q24',
    type: 'achievement',
    titleVi: 'Tài Năng Đỉnh Cao',
    titleEn: 'Apex Talent',
    descriptionVi: 'Đạt cấp độ 50.',
    descriptionEn: 'Reach level 50.',
    targetType: 'reach_level',
    targetCount: 50,
    rewardGold: 20000,
    rewardDiamonds: 500
  },
  {
    id: 'q25',
    type: 'achievement',
    titleVi: 'Đế Vương Diệt Địch',
    titleEn: 'Vanquisher of Foes',
    descriptionVi: 'Tiêu diệt tổng cộng 5.000 quái vật.',
    descriptionEn: 'Defeat 5,000 total monsters.',
    targetType: 'defeat_monster',
    targetCount: 5000,
    rewardGold: 25000,
    rewardDiamonds: 600
  },
  {
    id: 'q26',
    type: 'achievement',
    titleVi: 'Đại Phú Hào',
    titleEn: 'Super Rich Magnate',
    descriptionVi: 'Tích lũy tổng cộng 1.000.000 Vàng.',
    descriptionEn: 'Gather 1,000,000 total gold.',
    targetType: 'earn_gold',
    targetCount: 1000000,
    rewardGold: 30000,
    rewardDiamonds: 700
  },
  {
    id: 'q27',
    type: 'achievement',
    titleVi: 'Thần Kỷ Lục Rèn',
    titleEn: 'Blacksmith Deity',
    descriptionVi: 'Nâng cấp trang bị tổng cộng 100 lần.',
    descriptionEn: 'Upgrade equipment 100 times.',
    targetType: 'upgrade_equipment',
    targetCount: 100,
    rewardGold: 35000,
    rewardDiamonds: 800
  },
  {
    id: 'q28',
    type: 'daily',
    titleVi: 'Săn Lùng Tinh Nhuệ',
    titleEn: 'Elite Hunter',
    descriptionVi: 'Tiêu diệt 15 quái vật trên chiến trường.',
    descriptionEn: 'Defeat 15 monsters on the battlefield.',
    targetType: 'defeat_monster',
    targetCount: 15,
    rewardGold: 200,
    rewardDiamonds: 8
  },
  {
    id: 'q29',
    type: 'daily',
    titleVi: 'Thu Thập Nhỏ Lẻ',
    titleEn: 'Scrap Collector',
    descriptionVi: 'Tích lũy 2.500 Vàng.',
    descriptionEn: 'Gather 2,500 Gold.',
    targetType: 'earn_gold',
    targetCount: 2500,
    rewardGold: 250,
    rewardDiamonds: 10
  },
  {
    id: 'q30',
    type: 'daily',
    titleVi: 'Tự Vượt Giới Hạn',
    titleEn: 'Self-Surpassing',
    descriptionVi: 'Đạt cấp độ 8.',
    descriptionEn: 'Reach level 8.',
    targetType: 'reach_level',
    targetCount: 8,
    rewardGold: 450,
    rewardDiamonds: 12
  },
  {
    id: 'q31',
    type: 'weekly',
    titleVi: 'Hành Trình Tuần Mới',
    titleEn: 'New Week Odyssey',
    descriptionVi: 'Nâng cấp trang bị 5 lần.',
    descriptionEn: 'Upgrade equipment 5 times.',
    targetType: 'upgrade_equipment',
    targetCount: 5,
    rewardGold: 1200,
    rewardDiamonds: 30
  },
  {
    id: 'q32',
    type: 'weekly',
    titleVi: 'Thu Thập Tầm Trung',
    titleEn: 'Mid-tier Gatherer',
    descriptionVi: 'Tích lũy 25.000 Vàng.',
    descriptionEn: 'Gather 25,000 Gold.',
    targetType: 'earn_gold',
    targetCount: 25000,
    rewardGold: 1500,
    rewardDiamonds: 40
  },
  {
    id: 'q33',
    type: 'weekly',
    titleVi: 'Thợ Săn Hăng Hái',
    titleEn: 'Eager Hunter',
    descriptionVi: 'Tiêu diệt 150 quái vật.',
    descriptionEn: 'Defeat 150 monsters.',
    targetType: 'defeat_monster',
    targetCount: 150,
    rewardGold: 1000,
    rewardDiamonds: 25
  },
  {
    id: 'q34',
    type: 'weekly',
    titleVi: 'Nỗ Lực Lên Cấp',
    titleEn: 'Levelling Push',
    descriptionVi: 'Đạt cấp độ 15.',
    descriptionEn: 'Reach level 15.',
    targetType: 'reach_level',
    targetCount: 15,
    rewardGold: 1800,
    rewardDiamonds: 35
  }
];

