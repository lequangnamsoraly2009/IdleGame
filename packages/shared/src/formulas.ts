import { ItemRarity, EquipmentSlot, BaseStats, EquipmentItem, ItemTemplate, MonsterTemplate } from './types/game';

// Experience curve: 100, 115, 132, 152, 174, etc.
export function calculateLevelUpExp(level: number): number {
  return Math.floor(100 * Math.pow(1.18, level - 1));
}

// Upgrade cost based on slot, rarity and level
export function calculateUpgradeCost(slot: EquipmentSlot, rarity: ItemRarity, currentLevel: number): number {
  const rarityMultiplier = {
    common: 1.0,
    uncommon: 1.5,
    rare: 2.2,
    epic: 3.5,
    legendary: 6.0
  }[rarity];

  const slotMultiplier = {
    weapon: 1.2,
    armor: 1.0,
    helmet: 0.9,
    boots: 0.8,
    ring: 1.5
  }[slot];

  return Math.floor(50 * slotMultiplier * rarityMultiplier * Math.pow(1.22, currentLevel - 1));
}

// Stats generation formulas
export function getRarityMultiplier(rarity: ItemRarity): number {
  switch (rarity) {
    case 'common': return 1.0;
    case 'uncommon': return 1.3;
    case 'rare': return 1.8;
    case 'epic': return 2.6;
    case 'legendary': return 4.0;
  }
}

// Calculate the item stats base + level upgrades
export function calculateItemStats(slot: EquipmentSlot, rarity: ItemRarity, level: number): BaseStats {
  const mult = getRarityMultiplier(rarity) * (1 + (level - 1) * 0.1); // +10% per level
  
  const base: BaseStats = {
    maxHp: 0,
    attack: 0,
    defense: 0,
    speed: 0,
    critRate: 0,
    critDamage: 0
  };

  switch (slot) {
    case 'weapon':
      base.attack = Math.round(10 * mult);
      base.critRate = 0.05 + (rarity === 'legendary' ? 0.05 : 0);
      base.critDamage = 1.5;
      break;
    case 'armor':
      base.maxHp = Math.round(50 * mult);
      base.defense = Math.round(5 * mult);
      break;
    case 'helmet':
      base.maxHp = Math.round(30 * mult);
      base.defense = Math.round(3 * mult);
      break;
    case 'boots':
      base.maxHp = Math.round(20 * mult);
      base.defense = Math.round(2 * mult);
      base.speed = 0.05 * mult; // increase cooldown speed
      break;
    case 'ring':
      base.attack = Math.round(4 * mult);
      base.critRate = 0.02 * mult;
      base.critDamage = 1.5 + (0.1 * mult);
      break;
  }

  return base;
}

// Formula for calculating prestige points earned based on stage/gold
export function calculatePrestigePoints(stageCleared: number): number {
  if (stageCleared < 10) return 0;
  return Math.floor(Math.pow(stageCleared - 9, 1.5));
}

// Core stats calculation for Hero
export function recalculateHeroStats(
  level: number,
  prestigePoints: number,
  equippedItems: EquipmentItem[]
): BaseStats {
  // Base stats at level 1
  const baseStats: BaseStats = {
    maxHp: 100 + (level - 1) * 15,
    attack: 10 + (level - 1) * 2,
    defense: 5 + (level - 1) * 1,
    speed: 100, // percentage base speed (e.g. 100%)
    critRate: 0.05,
    critDamage: 1.5
  };

  // Prestige multipliers (1% damage, 1% hp per point)
  const prestigeDmgMult = 1 + prestigePoints * 0.02;
  const prestigeHpMult = 1 + prestigePoints * 0.02;
  const prestigeDefMult = 1 + prestigePoints * 0.01;

  let totalMaxHp = baseStats.maxHp;
  let totalAttack = baseStats.attack;
  let totalDefense = baseStats.defense;
  let totalSpeed = baseStats.speed;
  let totalCritRate = baseStats.critRate;
  let totalCritDamage = baseStats.critDamage;

  // Add equipment bonuses
  for (const item of equippedItems) {
    totalMaxHp += item.stats.maxHp;
    totalAttack += item.stats.attack;
    totalDefense += item.stats.defense;
    totalSpeed += item.stats.speed;
    totalCritRate += item.stats.critRate;
    totalCritDamage += (item.stats.critDamage - 1.5) > 0 ? (item.stats.critDamage - 1.5) : 0;
  }

  return {
    maxHp: Math.round(totalMaxHp * prestigeHpMult),
    attack: Math.round(totalAttack * prestigeDmgMult),
    defense: Math.round(totalDefense * prestigeDefMult),
    speed: totalSpeed,
    critRate: Math.min(0.85, totalCritRate), // cap crit rate at 85%
    critDamage: Math.round(totalCritDamage * 100) / 100
  };
}

// Generate a random item instance from template
export function createItemInstance(template: ItemTemplate, level = 1): EquipmentItem {
  const stats = calculateItemStats(template.slot, template.rarity, level);
  return {
    id: `item_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`,
    templateId: template.id,
    name: template.name,
    slot: template.slot,
    rarity: template.rarity,
    stats,
    level,
    upgradeCost: calculateUpgradeCost(template.slot, template.rarity, level),
    equipped: false
  };
}

// Default static templates for testing / database init
export const DEFAULT_ITEM_TEMPLATES: ItemTemplate[] = [
  { id: 't_wpn_rusty', name: 'Rusty Sword', slot: 'weapon', rarity: 'common', stats: {} },
  { id: 't_wpn_steel', name: 'Steel Sword', slot: 'weapon', rarity: 'uncommon', stats: {} },
  { id: 't_wpn_knight', name: 'Knightly Claymore', slot: 'weapon', rarity: 'rare', stats: {} },
  { id: 't_wpn_demonic', name: 'Demonic Reaver', slot: 'weapon', rarity: 'epic', stats: {} },
  { id: 't_wpn_excalibur', name: 'Excalibur', slot: 'weapon', rarity: 'legendary', stats: {} },
  
  { id: 't_arm_rag', name: 'Ragged Tunic', slot: 'armor', rarity: 'common', stats: {} },
  { id: 't_arm_leather', name: 'Leather Jerkin', slot: 'armor', rarity: 'uncommon', stats: {} },
  { id: 't_arm_plate', name: 'Iron Platebody', slot: 'armor', rarity: 'rare', stats: {} },
  { id: 't_arm_dragon', name: 'Dragonscale Armor', slot: 'armor', rarity: 'epic', stats: {} },
  
  { id: 't_hel_cap', name: 'Leather Cap', slot: 'helmet', rarity: 'common', stats: {} },
  { id: 't_hel_iron', name: 'Iron Barbute', slot: 'helmet', rarity: 'uncommon', stats: {} },
  { id: 't_hel_great', name: 'Steel Greathelm', slot: 'helmet', rarity: 'rare', stats: {} },
  
  { id: 't_bts_worn', name: 'Worn Boots', slot: 'boots', rarity: 'common', stats: {} },
  { id: 't_bts_leather', name: 'Swift Leather Boots', slot: 'boots', rarity: 'uncommon', stats: {} },
  { id: 't_bts_guardian', name: 'Guardian Sabatons', slot: 'boots', rarity: 'rare', stats: {} },

  { id: 't_rng_brass', name: 'Brass Ring', slot: 'ring', rarity: 'common', stats: {} },
  { id: 't_rng_silver', name: 'Silver Ring', slot: 'ring', rarity: 'uncommon', stats: {} },
  { id: 't_rng_ruby', name: 'Ruby Signet Ring', slot: 'ring', rarity: 'rare', stats: {} }
];

export function generateMonsterForStage(stage: number): MonsterTemplate {
  const prefixes = ['Stone', 'Iron', 'Shadow', 'Flame', 'Frost', 'Void', 'Chaos', 'Abyssal', 'Undead', 'Spectral'];
  const baseNames = ['Slime', 'Goblin', 'Skeleton', 'Orc', 'Golem', 'Wraith', 'Demon', 'Drake', 'Dragon', 'Titan'];
  
  const nameIndex = Math.min(baseNames.length - 1, Math.floor((stage - 1) / 5));
  const prefixIndex = Math.min(prefixes.length - 1, Math.floor(stage / 10));
  
  const prefix = stage >= 10 ? prefixes[prefixIndex] + ' ' : '';
  const monsterName = prefix + baseNames[nameIndex];

  // Base scaling stats
  const level = stage;
  const hp = Math.round(45 * Math.pow(1.15, stage - 1));
  const attack = Math.round(8 * Math.pow(1.12, stage - 1));
  const defense = Math.round(2 * Math.pow(1.09, stage - 1));
  const speed = 80 + Math.min(50, stage * 0.5); // attacks get slightly faster

  // Reward scaling
  const expReward = Math.round(8 * Math.pow(1.11, stage - 1));
  const goldMin = Math.round(6 * Math.pow(1.12, stage - 1));
  const goldMax = Math.round(goldMin * 1.3);

  // Drop chances: 10% base drop chance, caps at 25%
  const dropChance = Math.min(0.25, 0.10 + (stage * 0.005));

  // Determine drop pool based on stage
  const dropPool: string[] = [];
  if (stage < 5) {
    dropPool.push('t_wpn_rusty', 't_arm_rag', 't_hel_cap', 't_bts_worn', 't_rng_brass');
  } else if (stage < 15) {
    dropPool.push('t_wpn_steel', 't_arm_leather', 't_hel_iron', 't_bts_leather', 't_rng_silver');
  } else {
    dropPool.push('t_wpn_knight', 't_arm_plate', 't_hel_great', 't_bts_guardian', 't_rng_ruby', 't_wpn_demonic', 't_arm_dragon');
    if (stage >= 30) {
      dropPool.push('t_wpn_excalibur');
    }
  }

  return {
    id: `m_${stage}_${Date.now()}`,
    name: monsterName,
    level,
    baseStats: {
      maxHp: hp,
      attack,
      defense,
      speed,
      critRate: 0.02,
      critDamage: 1.5
    },
    expReward,
    goldRewardRange: [goldMin, goldMax],
    dropChance,
    dropPool
  };
}
