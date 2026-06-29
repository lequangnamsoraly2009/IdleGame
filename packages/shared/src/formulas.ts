import { 
  ItemRarity, 
  EquipmentSlot, 
  BaseStats, 
  EquipmentItem, 
  ItemTemplate, 
  MonsterTemplate, 
  ItemAffix,
  MonsterRank,
  MonsterAffix
} from './types/game';
import { MONSTER_SPECIES_DATABASE } from './bestiary';

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
    critDamage: 1.5
  };

  switch (slot) {
    case 'weapon':
      base.attack = Math.round(15 * mult);
      base.critRate = 0.05;
      break;
    case 'armor':
      base.maxHp = Math.round(80 * mult);
      base.defense = Math.round(8 * mult);
      break;
    case 'helmet':
      base.maxHp = Math.round(45 * mult);
      base.defense = Math.round(4 * mult);
      break;
    case 'boots':
      base.maxHp = Math.round(35 * mult);
      base.speed = 10;
      break;
    case 'ring':
      base.attack = Math.round(5 * mult);
      base.critRate = 0.02;
      base.critDamage = 1.6;
      break;
  }

  return base;
}

export function getFinalItemStats(item: EquipmentItem): BaseStats {
  if (item.isIdentified === false) {
    return { maxHp: 0, attack: 0, defense: 0, speed: 0, critRate: 0, critDamage: 0 };
  }

  const base = { ...item.stats };

  // Item Memory evolution
  let evolutionMult = 1.0;
  if (item.kills !== undefined) {
    if (item.kills >= 100000) {
      evolutionMult = 1.6; // Ancient: +60% base stats
    } else if (item.kills >= 10000) {
      evolutionMult = 1.25; // Veteran: +25% base stats
    }
  }
  base.maxHp = Math.round(base.maxHp * evolutionMult);
  base.attack = Math.round(base.attack * evolutionMult);
  base.defense = Math.round(base.defense * evolutionMult);

  // Gem stats
  if (item.sockets) {
    item.sockets.forEach(gem => {
      if (gem === 'ruby') {
        base.attack += 15;
      } else if (gem === 'emerald') {
        base.critRate += 0.04;
      }
      // Topaz is +gold, which is combat-independent and processed in gameStore
    });
  }

  // Affixes stats
  if (item.affixes) {
    item.affixes.forEach(affix => {
      if (affix.stats) {
        if (affix.stats.maxHp) base.maxHp += affix.stats.maxHp;
        if (affix.stats.attack) base.attack += affix.stats.attack;
        if (affix.stats.defense) base.defense += affix.stats.defense;
        if (affix.stats.speed) base.speed += affix.stats.speed;
        if (affix.stats.critRate) base.critRate += affix.stats.critRate;
        if (affix.stats.critDamage) base.critDamage += affix.stats.critDamage;
      }
    });
  }

  // Corrupted multiplier (x2 stats)
  if (item.isCorrupted) {
    base.attack = base.attack * 2;
    base.maxHp = base.maxHp * 2;
    base.defense = base.defense * 2;
  }

  // Cursed constraints (+150 Attack, -80 Defense, -20% HP)
  if (item.isCursed) {
    base.attack += 150;
    base.defense -= 80;
    base.maxHp = Math.round(base.maxHp * 0.8);
  }

  // Ensure stats don't drop below 0 (especially defense)
  base.maxHp = Math.max(0, base.maxHp);
  base.attack = Math.max(0, base.attack);
  base.defense = Math.max(0, base.defense);
  base.speed = Math.max(0, base.speed);
  base.critRate = Math.max(0, base.critRate);
  base.critDamage = Math.max(0, base.critDamage);

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
  equippedItems: EquipmentItem[],
  heroClass?: 'knight' | 'mage' | 'assassin'
): BaseStats {
  let baseHp = 100;
  let hpGrowth = 15;
  let baseAtk = 15;
  let atkGrowth = 2.5;
  let baseDef = 5;
  let defGrowth = 1.0;
  let baseSpd = 100;
  let baseCrit = 0.05;
  let baseCritDmg = 1.5;

  if (heroClass === 'knight') {
    baseHp = 140;
    hpGrowth = 22;
    baseAtk = 12;
    atkGrowth = 1.8;
    baseDef = 10;
    defGrowth = 1.5;
    baseSpd = 90;
    baseCrit = 0.03;
    baseCritDmg = 1.5;
  } else if (heroClass === 'mage') {
    baseHp = 80;
    hpGrowth = 12;
    baseAtk = 25;
    atkGrowth = 3.2;
    baseDef = 3;
    defGrowth = 0.5;
    baseSpd = 110;
    baseCrit = 0.08;
    baseCritDmg = 1.6;
  } else if (heroClass === 'assassin') {
    baseHp = 90;
    hpGrowth = 14;
    baseAtk = 18;
    atkGrowth = 2.2;
    baseDef = 4;
    defGrowth = 0.8;
    baseSpd = 125;
    baseCrit = 0.15;
    baseCritDmg = 1.8;
  }

  const baseStats: BaseStats = {
    maxHp: Math.round(baseHp + (level - 1) * hpGrowth),
    attack: Math.round(baseAtk + (level - 1) * atkGrowth),
    defense: Math.round(baseDef + (level - 1) * defGrowth),
    speed: baseSpd,
    critRate: baseCrit,
    critDamage: baseCritDmg
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

  // Add equipment bonuses safely using getFinalItemStats helper
  const items = equippedItems || [];
  for (const item of items) {
    if (!item) continue;
    const stats = getFinalItemStats(item);
    totalMaxHp += stats.maxHp || 0;
    totalAttack += stats.attack || 0;
    totalDefense += stats.defense || 0;
    totalSpeed += stats.speed || 0;
    totalCritRate += stats.critRate || 0;
    totalCritDamage += (stats.critDamage - 1.5) > 0 ? (stats.critDamage - 1.5) : 0;
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

// Prefixes pool
const PREFIXES = [
  { name: 'Flaming', stats: { attack: 20 } },
  { name: 'Lucky', stats: { goldBonus: 0.08 } },
  { name: 'Frozen', stats: { defense: 15 } },
  { name: 'Swift', stats: { speed: 12 } },
  { name: 'Sharp', stats: { critRate: 0.04 } },
  { name: 'Heavy', stats: { maxHp: 40 } },
  { name: 'Brutal', stats: { critDamage: 0.15 } },
  { name: 'Vampiric', stats: { maxHp: 30, attack: 10 } }
];

// Suffixes pool
const SUFFIXES = [
  { name: 'of Giant', stats: { maxHp: 45 } },
  { name: 'of Swiftness', stats: { speed: 15 } },
  { name: 'of Phoenix', stats: { maxHp: 30, critRate: 0.01 } },
  { name: 'of Sage', stats: { attack: 5, defense: 5 } },
  { name: 'of the Thief', stats: { goldBonus: 0.10 } }
];

// Generate a random item instance from template
export function createItemInstance(template: ItemTemplate, level = 1): EquipmentItem {
  const stats = calculateItemStats(template.slot, template.rarity, level);
  
  // Sockets roll
  let socketCount = 0;
  const socketRoll = Math.random();
  if (template.rarity === 'common') {
    if (socketRoll < 0.15) socketCount = 1;
  } else if (template.rarity === 'uncommon') {
    if (socketRoll < 0.2) socketCount = 2;
    else if (socketRoll < 0.6) socketCount = 1;
  } else if (template.rarity === 'rare') {
    if (socketRoll < 0.25) socketCount = 3;
    else if (socketRoll < 0.6) socketCount = 2;
    else if (socketRoll < 0.9) socketCount = 1;
  } else if (template.rarity === 'epic') {
    if (socketRoll < 0.3) socketCount = 4;
    else if (socketRoll < 0.7) socketCount = 3;
    else socketCount = 2;
  } else if (template.rarity === 'legendary') {
    if (socketRoll < 0.4) socketCount = 5;
    else if (socketRoll < 0.8) socketCount = 4;
    else socketCount = 3;
  }
  const sockets: Array<string | null> = Array(socketCount).fill(null);

  // Unidentified roll (5% chance)
  const isIdentified = Math.random() >= 0.05;

  // Corrupted roll (0.2% chance)
  const isCorrupted = Math.random() < 0.002;

  // Cursed roll (1% chance)
  const isCursed = !isCorrupted && Math.random() < 0.01;

  // Affixes roll based on rarity
  const affixes: ItemAffix[] = [];
  let affixCount = 0;
  if (template.rarity === 'common') {
    if (Math.random() < 0.2) affixCount = 1;
  } else if (template.rarity === 'uncommon') {
    affixCount = Math.random() < 0.15 ? 2 : 1;
  } else if (template.rarity === 'rare') {
    affixCount = Math.random() < 0.35 ? 2 : 1;
  } else if (template.rarity === 'epic') {
    affixCount = 2;
  } else if (template.rarity === 'legendary') {
    affixCount = Math.random() < 0.4 ? 3 : 2;
  }

  // Roll scaling factor based on level
  const scale = Math.max(1, Math.floor(level * 0.5));

  // Keep track of rolled categories to avoid duplicates
  let rolledPrefix = false;
  let rolledSuffix = false;
  
  for (let i = 0; i < affixCount; i++) {
    // 50% chance to roll prefix or suffix
    if (Math.random() < 0.5 && !rolledPrefix || rolledSuffix && !rolledPrefix) {
      const rolled = PREFIXES[Math.floor(Math.random() * PREFIXES.length)];
      // Scale numerical stats
      const scaledStats: any = {};
      Object.entries(rolled.stats).forEach(([k, v]) => {
        scaledStats[k] = k === 'goldBonus' || k === 'critRate' || k === 'critDamage' ? v : Math.round(v * scale);
      });
      affixes.push({
        name: rolled.name,
        type: 'prefix',
        stats: scaledStats
      });
      rolledPrefix = true;
    } else if (!rolledSuffix) {
      const rolled = SUFFIXES[Math.floor(Math.random() * SUFFIXES.length)];
      const scaledStats: any = {};
      Object.entries(rolled.stats).forEach(([k, v]) => {
        scaledStats[k] = k === 'goldBonus' || k === 'critRate' || k === 'critDamage' ? v : Math.round(v * scale);
      });
      affixes.push({
        name: rolled.name,
        type: 'suffix',
        stats: scaledStats
      });
      rolledSuffix = true;
    }
  }

  // Name construction
  const prefixObj = affixes.find(a => a.type === 'prefix');
  const suffixObj = affixes.find(a => a.type === 'suffix');
  
  let finalName = template.name;
  if (prefixObj) finalName = `${prefixObj.name} ${finalName}`;
  if (suffixObj) finalName = `${finalName} ${suffixObj.name}`;
  
  if (isCorrupted) finalName = `[CORRUPTED] ${finalName}`;
  if (isCursed) finalName = `${finalName} [Cursed]`;

  return {
    id: `item_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`,
    templateId: template.id,
    name: finalName,
    slot: template.slot,
    rarity: template.rarity,
    stats,
    level,
    upgradeCost: calculateUpgradeCost(template.slot, template.rarity, level),
    equipped: false,
    allowedClass: template.allowedClass,
    affixes,
    isIdentified,
    isCorrupted,
    isCursed,
    kills: 0,
    sockets
  };
}

// Default static templates for testing / database init
export const DEFAULT_ITEM_TEMPLATES: ItemTemplate[] = [
  // === WEAPONS ===
  // Common
  { id: 't_wpn_rusty', name: 'Rusty Sword', slot: 'weapon', rarity: 'common', allowedClass: 'knight', stats: {} },
  { id: 't_wpn_rusty_staff', name: 'Rusty Staff', slot: 'weapon', rarity: 'common', allowedClass: 'mage', stats: {} },
  { id: 't_wpn_rusty_dagger', name: 'Rusty Dagger', slot: 'weapon', rarity: 'common', allowedClass: 'assassin', stats: {} },
  // Uncommon
  { id: 't_wpn_steel', name: 'Steel Sword', slot: 'weapon', rarity: 'uncommon', allowedClass: 'knight', stats: {} },
  { id: 't_wpn_apprentice_staff', name: 'Apprentice Staff', slot: 'weapon', rarity: 'uncommon', allowedClass: 'mage', stats: {} },
  { id: 't_wpn_steel_daggers', name: 'Steel Daggers', slot: 'weapon', rarity: 'uncommon', allowedClass: 'assassin', stats: {} },
  // Rare
  { id: 't_wpn_knight', name: 'Knightly Claymore', slot: 'weapon', rarity: 'rare', allowedClass: 'knight', stats: {} },
  { id: 't_wpn_wizard_rod', name: 'Wizard Rod', slot: 'weapon', rarity: 'rare', allowedClass: 'mage', stats: {} },
  { id: 't_wpn_poison_dagger', name: 'Silent Poison Dagger', slot: 'weapon', rarity: 'rare', allowedClass: 'assassin', stats: {} },
  // Epic
  { id: 't_wpn_demonic', name: 'Demonic Reaver', slot: 'weapon', rarity: 'epic', allowedClass: 'knight', stats: {} },
  { id: 't_wpn_archmage_wand', name: 'Archmage Wand', slot: 'weapon', rarity: 'epic', allowedClass: 'mage', stats: {} },
  { id: 't_wpn_death_claws', name: 'Death Mark Claws', slot: 'weapon', rarity: 'epic', allowedClass: 'assassin', stats: {} },
  // Legendary
  { id: 't_wpn_excalibur', name: 'Excalibur', slot: 'weapon', rarity: 'legendary', allowedClass: 'knight', stats: {} },
  { id: 't_wpn_cosmos_staff', name: 'Staff of Infinite Cosmos', slot: 'weapon', rarity: 'legendary', allowedClass: 'mage', stats: {} },
  { id: 't_wpn_asura_blades', name: 'Asura Double Blades', slot: 'weapon', rarity: 'legendary', allowedClass: 'assassin', stats: {} },

  // === ARMOR ===
  // Common
  { id: 't_arm_rag', name: 'Ragged Mail', slot: 'armor', rarity: 'common', allowedClass: 'knight', stats: {} },
  { id: 't_arm_rag_robe', name: 'Torn Robe', slot: 'armor', rarity: 'common', allowedClass: 'mage', stats: {} },
  { id: 't_arm_rag_cloak', name: 'Shadow Cloak', slot: 'armor', rarity: 'common', allowedClass: 'assassin', stats: {} },
  // Uncommon
  { id: 't_arm_leather', name: 'Reinforced Jerkin', slot: 'armor', rarity: 'uncommon', allowedClass: 'knight', stats: {} },
  { id: 't_arm_leather_robe', name: 'Apprentice Vestments', slot: 'armor', rarity: 'uncommon', allowedClass: 'mage', stats: {} },
  { id: 't_arm_leather_cloak', name: 'Hunter Cape', slot: 'armor', rarity: 'uncommon', allowedClass: 'assassin', stats: {} },
  // Rare
  { id: 't_arm_plate', name: 'Iron Platebody', slot: 'armor', rarity: 'rare', allowedClass: 'knight', stats: {} },
  { id: 't_arm_silk_robe', name: 'Mystic Silk Robe', slot: 'armor', rarity: 'rare', allowedClass: 'mage', stats: {} },
  { id: 't_arm_shadow_vest', name: 'Shadow Assassin Vest', slot: 'armor', rarity: 'rare', allowedClass: 'assassin', stats: {} },
  // Epic
  { id: 't_arm_dragon', name: 'Dragonscale Armor', slot: 'armor', rarity: 'epic', allowedClass: 'knight', stats: {} },
  { id: 't_arm_phoenix_robe', name: 'Phoenix Flame Robe', slot: 'armor', rarity: 'epic', allowedClass: 'mage', stats: {} },
  { id: 't_arm_nether_cloak', name: 'Nether Shadow Shroud', slot: 'armor', rarity: 'epic', allowedClass: 'assassin', stats: {} },
  // Legendary
  { id: 't_arm_god_plate', name: 'God Warlord Plate', slot: 'armor', rarity: 'legendary', allowedClass: 'knight', stats: {} },
  { id: 't_arm_celestial_robe', name: 'Celestial Archmage Robes', slot: 'armor', rarity: 'legendary', allowedClass: 'mage', stats: {} },
  { id: 't_arm_phantom_garb', name: 'Phantom Assassin Garb', slot: 'armor', rarity: 'legendary', allowedClass: 'assassin', stats: {} },

  // === HELMETS ===
  // Common
  { id: 't_hel_cap', name: 'Rusty Skullcap', slot: 'helmet', rarity: 'common', allowedClass: 'knight', stats: {} },
  { id: 't_hel_cap_mage', name: 'Cloth Cowl', slot: 'helmet', rarity: 'common', allowedClass: 'mage', stats: {} },
  { id: 't_hel_cap_assassin', name: 'Ragged Hood', slot: 'helmet', rarity: 'common', allowedClass: 'assassin', stats: {} },
  // Uncommon
  { id: 't_hel_iron', name: 'Iron Barbute', slot: 'helmet', rarity: 'uncommon', allowedClass: 'knight', stats: {} },
  { id: 't_hel_apprentice_hood', name: 'Mage Hood', slot: 'helmet', rarity: 'uncommon', allowedClass: 'mage', stats: {} },
  { id: 't_hel_leather_mask', name: 'Leather Mask', slot: 'helmet', rarity: 'uncommon', allowedClass: 'assassin', stats: {} },
  // Rare
  { id: 't_hel_great', name: 'Steel Greathelm', slot: 'helmet', rarity: 'rare', allowedClass: 'knight', stats: {} },
  { id: 't_hel_wizard_hat', name: 'Wizard Hat', slot: 'helmet', rarity: 'rare', allowedClass: 'mage', stats: {} },
  { id: 't_hel_shadow_hood', name: 'Shadow Mask', slot: 'helmet', rarity: 'rare', allowedClass: 'assassin', stats: {} },
  // Epic
  { id: 't_hel_dragon_horn', name: 'Dragon Horn Helm', slot: 'helmet', rarity: 'epic', allowedClass: 'knight', stats: {} },
  { id: 't_hel_archmage_crown', name: 'Archmage Crown', slot: 'helmet', rarity: 'epic', allowedClass: 'mage', stats: {} },
  { id: 't_hel_death_cowl', name: 'Death Mark Cowl', slot: 'helmet', rarity: 'epic', allowedClass: 'assassin', stats: {} },
  // Legendary
  { id: 't_hel_aegis_visor', name: 'Aegis Helmet', slot: 'helmet', rarity: 'legendary', allowedClass: 'knight', stats: {} },
  { id: 't_hel_cosmos_crown', name: 'Crown of Infinite Cosmos', slot: 'helmet', rarity: 'legendary', allowedClass: 'mage', stats: {} },
  { id: 't_hel_asura_hood', name: 'Hood of Asura', slot: 'helmet', rarity: 'legendary', allowedClass: 'assassin', stats: {} },

  // === BOOTS ===
  // Common
  { id: 't_bts_worn', name: 'Heavy Iron Boots', slot: 'boots', rarity: 'common', allowedClass: 'knight', stats: {} },
  { id: 't_bts_worn_mage', name: 'Cloth Slippers', slot: 'boots', rarity: 'common', allowedClass: 'mage', stats: {} },
  { id: 't_bts_worn_assassin', name: 'Light Wraps', slot: 'boots', rarity: 'common', allowedClass: 'assassin', stats: {} },
  // Uncommon
  { id: 't_bts_steel_greaves', name: 'Steel Greaves', slot: 'boots', rarity: 'uncommon', allowedClass: 'knight', stats: {} },
  { id: 't_bts_mage_sandals', name: 'Mage Sandals', slot: 'boots', rarity: 'uncommon', allowedClass: 'mage', stats: {} },
  { id: 't_bts_leather', name: 'Swift Leather Boots', slot: 'boots', rarity: 'uncommon', allowedClass: 'assassin', stats: {} },
  // Rare
  { id: 't_bts_guardian', name: 'Guardian Sabatons', slot: 'boots', rarity: 'rare', allowedClass: 'knight', stats: {} },
  { id: 't_bts_sorcerer_boots', name: 'Sorcerer Boots', slot: 'boots', rarity: 'rare', allowedClass: 'mage', stats: {} },
  { id: 't_bts_stealth_treads', name: 'Stealth Treads', slot: 'boots', rarity: 'rare', allowedClass: 'assassin', stats: {} },
  // Epic
  { id: 't_bts_dragonscale', name: 'Dragonscale Greaves', slot: 'boots', rarity: 'epic', allowedClass: 'knight', stats: {} },
  { id: 't_bts_archmage_slippers', name: 'Archmage Slippers', slot: 'boots', rarity: 'epic', allowedClass: 'mage', stats: {} },
  { id: 't_bts_shadow_boots', name: 'Shadow Dancer Boots', slot: 'boots', rarity: 'epic', allowedClass: 'assassin', stats: {} },
  // Legendary
  { id: 't_bts_aegis', name: 'Sabatons of Aegis', slot: 'boots', rarity: 'legendary', allowedClass: 'knight', stats: {} },
  { id: 't_bts_cosmos', name: 'Cosmos Treads', slot: 'boots', rarity: 'legendary', allowedClass: 'mage', stats: {} },
  { id: 't_bts_asura', name: 'Asura Greaves', slot: 'boots', rarity: 'legendary', allowedClass: 'assassin', stats: {} },

  // === RINGS ===
  // Common
  { id: 't_rng_brass', name: 'Brass Signet', slot: 'ring', rarity: 'common', allowedClass: 'knight', stats: {} },
  { id: 't_rng_brass_mage', name: 'Quartz Ring', slot: 'ring', rarity: 'common', allowedClass: 'mage', stats: {} },
  { id: 't_rng_brass_assassin', name: 'Copper Band', slot: 'ring', rarity: 'common', allowedClass: 'assassin', stats: {} },
  // Uncommon
  { id: 't_rng_silver', name: 'Silver Ring', slot: 'ring', rarity: 'uncommon', allowedClass: 'knight', stats: {} },
  { id: 't_rng_silver_mage', name: 'Opal Ring', slot: 'ring', rarity: 'uncommon', allowedClass: 'mage', stats: {} },
  { id: 't_rng_silver_assassin', name: 'Obsidian Band', slot: 'ring', rarity: 'uncommon', allowedClass: 'assassin', stats: {} },
  // Rare
  { id: 't_rng_ruby', name: 'Ruby Signet Ring', slot: 'ring', rarity: 'rare', allowedClass: 'knight', stats: {} },
  { id: 't_rng_ruby_mage', name: 'Sapphire Band', slot: 'ring', rarity: 'rare', allowedClass: 'mage', stats: {} },
  { id: 't_rng_ruby_assassin', name: 'Emerald Ring', slot: 'ring', rarity: 'rare', allowedClass: 'assassin', stats: {} },
  // Epic
  { id: 't_rng_dragon_crest', name: 'Dragon Crest Ring', slot: 'ring', rarity: 'epic', allowedClass: 'knight', stats: {} },
  { id: 't_rng_archmage_signet', name: 'Archmage Signet', slot: 'ring', rarity: 'epic', allowedClass: 'mage', stats: {} },
  { id: 't_rng_death_band', name: 'Death Mark Band', slot: 'ring', rarity: 'epic', allowedClass: 'assassin', stats: {} },
  // Legendary
  { id: 't_rng_aegis', name: 'Ring of Aegis', slot: 'ring', rarity: 'legendary', allowedClass: 'knight', stats: {} },
  { id: 't_rng_cosmos', name: 'Ring of Cosmos', slot: 'ring', rarity: 'legendary', allowedClass: 'mage', stats: {} },
  { id: 't_rng_asura', name: 'Ring of Asura', slot: 'ring', rarity: 'legendary', allowedClass: 'assassin', stats: {} }
];

export function generateMonsterForStage(
  stage: number, 
  _heroLevel: number = 1, 
  monsterResearch?: Record<string, { level: number; exp: number; kills: number }>
): MonsterTemplate {
  // 1. Time / Weather cycle
  const currentHour = new Date().getHours();
  const isNight = currentHour < 6 || currentHour > 18;
  const isRaining = (Date.now() % 60000) < 15000; // 15 seconds rain every minute

  // 2. Extinction / Ecology weights
  // Get all active candidates for this stage
  let candidates = MONSTER_SPECIES_DATABASE.filter(s => 
    stage >= s.spawnMinStage && stage <= s.spawnMaxStage && s.id !== 's_ancient_slime_god'
  );

  // If no candidates matched, use first slime as fallback
  if (candidates.length === 0) {
    candidates = [MONSTER_SPECIES_DATABASE[0]];
  }

  // Check secret boss trigger: Primordial Slime God (extinct species s_ancient_slime_god)
  // Condition: Meadow slime kills >= 999
  const meadowSlimeKills = monsterResearch?.['s_meadow_slime']?.kills || 0;
  if (meadowSlimeKills >= 999 && stage % 10 === 0 && Math.random() < 0.20) {
    const god = MONSTER_SPECIES_DATABASE.find(s => s.id === 's_ancient_slime_god');
    if (god) {
      candidates = [god];
    }
  }

  // Check ecology weights adjustments:
  // If we have research logs, we calculate relative weights based on how many have been killed.
  // Ecology rule: if a species has high kills, its spawn chance drops, allowing other candidates to spawn!
  const weightedCandidates = candidates.map(c => {
    const kills = monsterResearch?.[c.id]?.kills || 0;
    // Reduce weight if kills are high (min weight factor 0.1)
    const ecologyWeight = 1 / (1 + kills / 300);
    
    // Time/Weather bonuses
    let weatherBonus = 1.0;
    if (c.category === 'mystery') {
      if (isNight) weatherBonus += 2.0; // Mystery monsters spawn more at night
      if (isRaining) weatherBonus += 2.0; // Mystery monsters spawn more in rain
    }

    return {
      species: c,
      weight: ecologyWeight * weatherBonus
    };
  });

  // Weighted random selection
  const totalWeight = weightedCandidates.reduce((sum, item) => sum + item.weight, 0);
  let randomValue = Math.random() * totalWeight;
  let selectedSpecies = candidates[0];

  for (const item of weightedCandidates) {
    randomValue -= item.weight;
    if (randomValue <= 0) {
      selectedSpecies = item.species;
      break;
    }
  }

  // Rare Spawn upgrade: Golden Slime (1/500 chance)
  // If a normal slime spawned, it has a 1/500 chance to become a Golden Slime instead!
  if (selectedSpecies.family === 'slime' && selectedSpecies.category === 'normal' && Math.random() < 0.002) {
    const goldSlime = MONSTER_SPECIES_DATABASE.find(s => s.id === 's_golden_slime');
    if (goldSlime) {
      selectedSpecies = goldSlime;
    }
  }

  // 3. Rank & Mutation Calculations
  let rank: MonsterRank = 'normal';
  const roll = Math.random();
  const isBossStage = stage % 5 === 0;

  if (isBossStage) {
    if (stage % 50 === 0) rank = 'world_boss';
    else if (stage % 30 === 0) rank = 'ancient';
    else if (stage % 20 === 0) rank = 'mythic';
    else if (stage % 10 === 0) rank = 'legend';
    else rank = 'king';
  } else {
    if (roll < 0.0005) rank = 'ancient';
    else if (roll < 0.002) rank = 'mythic';
    else if (roll < 0.01) rank = 'legend';
    else if (roll < 0.04) rank = 'king';
    else if (roll < 0.12) rank = 'champion';
    else if (roll < 0.30) rank = 'elite';
  }

  // Rank modifier level offset
  let eliteModifier = 0;
  switch (rank) {
    case 'elite': eliteModifier = 3; break;
    case 'champion': eliteModifier = 6; break;
    case 'king': eliteModifier = 10; break;
    case 'legend': eliteModifier = 15; break;
    case 'mythic': eliteModifier = 20; break;
    case 'ancient': eliteModifier = 30; break;
    case 'world_boss': eliteModifier = 50; break;
  }

  // Dynamic Level Calculation
  const baseLevel = selectedSpecies.baseLevel;
  const stageModifier = stage === 1 ? 0 : Math.floor((stage - 1) * 1.0) + Math.floor(Math.max(0, stage - 10) * 0.1);
  const worldModifier = Math.floor((stage - 1) / 100) * 20;
  const level = baseLevel + stageModifier + worldModifier + eliteModifier;

  // 4. Combat Affixes selection
  const affixes: MonsterAffix[] = [];
  const affixPool: MonsterAffix[] = ['swift', 'berserk', 'vampire', 'explosive'];
  let numAffixes = 0;
  if (['mythic', 'ancient', 'world_boss'].includes(rank)) numAffixes = 3;
  else if (['king', 'legend'].includes(rank)) numAffixes = 2;
  else if (['elite', 'champion'].includes(rank)) numAffixes = 1;

  const shuffledPool = [...affixPool].sort(() => Math.random() - 0.5);
  for (let i = 0; i < Math.min(numAffixes, shuffledPool.length); i++) {
    affixes.push(shuffledPool[i]);
  }

  // 5. Mutation check (0.5% chance)
  const isMutated = Math.random() < 0.005;

  // Base Stats Scaling (from selected species multipliers)
  let hp = Math.round(45 * Math.pow(1.15, level - 1) * selectedSpecies.baseHpMult);
  let attack = Math.round(8 * Math.pow(1.12, level - 1) * selectedSpecies.baseAtkMult);
  let defense = Math.round(2 * Math.pow(1.09, level - 1) * selectedSpecies.baseDefMult);
  let speed = 80 + Math.min(50, level * 0.5);

  // Exp & Gold reward scaling
  let expReward = Math.round(8 * Math.pow(1.11, stage - 1) * selectedSpecies.baseHpMult);
  let goldMin = Math.round(6 * Math.pow(1.12, stage - 1) * selectedSpecies.baseAtkMult);

  // Elite Rank multiplier bumps
  let rankStatMultiplier = 1.0;
  switch (rank) {
    case 'elite': rankStatMultiplier = 1.25; break;
    case 'champion': rankStatMultiplier = 1.6; break;
    case 'king': rankStatMultiplier = 2.2; break;
    case 'legend': rankStatMultiplier = 3.0; break;
    case 'mythic': rankStatMultiplier = 4.2; break;
    case 'ancient': rankStatMultiplier = 6.0; break;
    case 'world_boss': rankStatMultiplier = 10.0; break;
  }

  hp = Math.round(hp * rankStatMultiplier);
  attack = Math.round(attack * (1 + (rankStatMultiplier - 1) * 0.5));
  defense = Math.round(defense * (1 + (rankStatMultiplier - 1) * 0.4));
  expReward = Math.round(expReward * rankStatMultiplier);
  goldMin = Math.round(goldMin * rankStatMultiplier);

  // Mutation Stat multipliers (+200% HP, +100% Damage, +300% Gold)
  if (isMutated) {
    hp = hp * 3;
    attack = attack * 2;
    goldMin = goldMin * 4;
  }

  const goldMax = Math.round(goldMin * 1.3);
  const dropChance = isBossStage ? 1.0 : Math.min(0.35, 0.10 + (stage * 0.005) + (isMutated ? 0.20 : 0));

  // Drop pool resolution
  const dropPool: string[] = [];
  DEFAULT_ITEM_TEMPLATES.forEach(t => {
    if (t.rarity === 'common') {
      dropPool.push(t.id);
    } else if (t.rarity === 'uncommon' && stage >= 5) {
      dropPool.push(t.id);
    } else if ((t.rarity === 'rare' || t.rarity === 'epic') && stage >= 15) {
      dropPool.push(t.id);
    } else if (t.rarity === 'legendary' && stage >= 30) {
      dropPool.push(t.id);
    }
  });

  // Assemble full template name
  let finalName = selectedSpecies.nameEn;
  if (isMutated) {
    finalName = `Mutated ${finalName}`;
  }
  if (rank !== 'normal') {
    const rankTitle = rank.charAt(0).toUpperCase() + rank.slice(1);
    finalName = `[${rankTitle}] ${finalName}`;
  }
  if (affixes.length > 0) {
    const affixString = affixes.map(a => a.charAt(0).toUpperCase() + a.slice(1)).join(' ');
    finalName = `${finalName} (${affixString})`;
  }

  return {
    id: selectedSpecies.id, // Keep the species identifier so it maps to Bestiary!
    name: finalName,
    level,
    baseStats: {
      maxHp: hp,
      attack,
      defense,
      speed,
      critRate: isBossStage ? 0.08 : 0.03,
      critDamage: 1.5
    },
    expReward,
    goldRewardRange: [goldMin, goldMax],
    dropChance,
    dropPool,
    rank,
    affixes,
    isMutated,
    weaknesses: selectedSpecies.weaknesses
  };
}
