export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export type EquipmentSlot = 'weapon' | 'armor' | 'helmet' | 'boots' | 'ring';

export interface BaseStats {
  maxHp: number;
  attack: number;
  defense: number;
  speed: number; // attack speed/cooldown factor
  critRate: number; // 0 to 1
  critDamage: number; // e.g. 1.5 for 150%
}

export interface ItemAffix {
  name: string;
  type: 'prefix' | 'suffix';
  stats: Partial<BaseStats> & {
    goldBonus?: number;
  };
}

export interface ItemTemplate {
  id: string;
  name: string;
  slot: EquipmentSlot;
  rarity: ItemRarity;
  stats: Partial<BaseStats>;
  description?: string;
  allowedClass?: 'knight' | 'mage' | 'assassin';
}

export interface EquipmentItem {
  id: string; // unique instance ID
  templateId: string;
  name: string;
  slot: EquipmentSlot;
  rarity: ItemRarity;
  stats: BaseStats;
  level: number;
  upgradeCost: number;
  equipped: boolean;
  allowedClass?: 'knight' | 'mage' | 'assassin';
  affixes?: ItemAffix[];
  isIdentified?: boolean;
  isCorrupted?: boolean;
  isCursed?: boolean;
  kills?: number;
  sockets?: Array<string | null>;
}

export interface HeroState {
  level: number;
  exp: number;
  maxExp: number;
  baseStats: BaseStats;
  currentStats: BaseStats; // baseStats + equipment stats + prestige bonuses
  currentHp: number;
  gold: number;
  diamonds: number;
  prestigePoints: number;
  prestigeCount: number;
  heroClass?: 'knight' | 'mage' | 'assassin';
}

export interface MonsterTemplate {
  id: string;
  name: string;
  level: number;
  baseStats: BaseStats;
  expReward: number;
  goldRewardRange: [number, number];
  dropChance: number; // e.g. 0.25 (25%)
  dropPool: string[]; // List of item templates
}

export interface MonsterState {
  templateId: string;
  name: string;
  level: number;
  stats: BaseStats;
  currentHp: number;
}

export type QuestTargetType = 'defeat_monster' | 'earn_gold' | 'reach_level' | 'upgrade_equipment';

export interface QuestState {
  id: string;
  title: string;
  description: string;
  targetType: QuestTargetType;
  targetCount: number;
  currentCount: number;
  rewardGold: number;
  rewardDiamonds: number;
  completed: boolean;
  claimed: boolean;
}

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  costType: 'gold' | 'diamonds';
  costAmount: number;
  actionType: 'buy_item' | 'buy_buff' | 'gold_pack';
  itemTemplateId?: string;
  durationSeconds?: number;
}

export interface GameSaveData {
  userId: string;
  lastSavedAt: number;
  hero: HeroState;
  inventory: EquipmentItem[];
  quests: QuestState[];
  prestigeBonuses: {
    attackMultiplier: number;
    hpMultiplier: number;
    goldMultiplier: number;
  };
  stagesCleared: number;
  activeStage: number;
}
