import { ItemRarity, EquipmentSlot, BaseStats, EquipmentItem, ItemTemplate, MonsterTemplate, ItemAffix } from './types/game';

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

export function generateMonsterForStage(stage: number, heroLevel: number = 1): MonsterTemplate {
  const prefixes = ['Stone', 'Iron', 'Shadow', 'Flame', 'Frost', 'Void', 'Chaos', 'Abyssal', 'Undead', 'Spectral'];
  const baseNames = ['Slime', 'Goblin', 'Skeleton', 'Orc', 'Golem', 'Wraith', 'Demon', 'Drake', 'Dragon', 'Titan'];
  
  const nameIndex = Math.min(baseNames.length - 1, Math.floor((stage - 1) / 5));
  const prefixIndex = Math.min(prefixes.length - 1, Math.floor(stage / 10));
  
  const isBoss = stage > 0 && stage % 10 === 0;
  let monsterName = '';
  
  if (isBoss) {
    const bossNames: Record<number, string> = {
      10: 'Slime King',
      20: 'Goblin Emperor',
      30: 'Skeleton Warlord',
      40: 'Orc Chieftain',
      50: 'Golem Guardian',
      60: 'Wraith Lord',
      70: 'Demon Commander',
      80: 'Drake Sovereign',
      90: 'Ancient Dragon',
      100: 'Titan Overlord'
    };
    monsterName = `👑 BOSS: ${bossNames[stage] || (prefixes[prefixIndex] || 'Void') + ' ' + (baseNames[nameIndex] || 'Overlord')}`;
  } else {
    const prefix = stage >= 10 ? prefixes[prefixIndex] + ' ' : '';
    monsterName = prefix + baseNames[nameIndex];
  }

  // Blended Level: dynamic difficulty scaling based on stage and current hero progression
  const level = Math.max(stage, Math.floor(heroLevel * 0.85));
  
  // Base scaling stats using combined monster level
  let hp = Math.round(45 * Math.pow(1.15, level - 1));
  let attack = Math.round(8 * Math.pow(1.12, level - 1));
  let defense = Math.round(2 * Math.pow(1.09, level - 1));
  let speed = 80 + Math.min(50, level * 0.5); // attacks get slightly faster

  // Reward scaling based on stage progression
  let expReward = Math.round(8 * Math.pow(1.11, stage - 1));
  let goldMin = Math.round(6 * Math.pow(1.12, stage - 1));
  
  // Apply boss scaling modifiers
  if (isBoss) {
    hp = Math.round(hp * 3.5);
    attack = Math.round(attack * 1.5);
    defense = Math.round(defense * 1.5);
    speed = Math.round(speed * 1.1);
    expReward = Math.round(expReward * 3.0);
    goldMin = Math.round(goldMin * 3.0);
  }

  const goldMax = Math.round(goldMin * 1.3);

  // Drop chances: 10% base drop chance, caps at 25%. Bosses are 100% guaranteed!
  const dropChance = isBoss ? 1.0 : Math.min(0.25, 0.10 + (stage * 0.005));

  // Determine drop pool based on stage dynamically from default templates
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

  return {
    id: `m_${stage}_${Date.now()}`,
    name: monsterName,
    level,
    baseStats: {
      maxHp: hp,
      attack,
      defense,
      speed,
      critRate: isBoss ? 0.05 : 0.02, // bosses crit slightly more
      critDamage: 1.5
    },
    expReward,
    goldRewardRange: [goldMin, goldMax],
    dropChance,
    dropPool
  };
}
