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
    ring: 1.5,
    gloves: 1.1
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
      base.attack = Math.round(15 * mult);
      base.critRate = 0.05;
      break;
    case 'armor':
      base.maxHp = Math.round(25 * mult);
      base.defense = Math.round(10 * mult);
      break;
    case 'helmet':
      base.maxHp = Math.round(15 * mult);
      base.defense = Math.round(5 * mult);
      break;
    case 'boots':
      base.maxHp = Math.round(10 * mult);
      base.speed = 10;
      break;
    case 'ring':
      base.attack = Math.round(5 * mult);
      base.critRate = 0.02;
      base.critDamage = 0.10;
      break;
    case 'gloves':
      base.attack = Math.round(8 * mult);
      base.speed = 5;
      base.critRate = 0.01;
      break;
  }

  return base;
}

export function getFinalItemStats(item: EquipmentItem): BaseStats {
  if (item.isIdentified === false) {
    return { maxHp: 0, attack: 0, defense: 0, speed: 0, critRate: 0, critDamage: 0, lifesteal: 0, spellVamp: 0, evasion: 0, block: 0 };
  }

  const base = {
    ...item.stats,
    lifesteal: item.stats.lifesteal || 0,
    spellVamp: item.stats.spellVamp || 0,
    evasion: item.stats.evasion || 0,
    block: item.stats.block || 0,
    magicAttack: item.stats.magicAttack || 0,
    magicResist: item.stats.magicResist || 0
  };

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

  // Gem stats (Ruby, Emerald, Sapphire, Amethyst Tiers 1-5)
  if (item.sockets) {
    item.sockets.forEach(gem => {
      if (!gem) return;
      const [type, tierStr] = gem.split('_');
      const tier = parseInt(tierStr) || 1;
      
      if (type === 'ruby') {
        // Attack %: Tier 1: 5%, Tier 2: 10%, Tier 3: 15%, Tier 4: 20%, Tier 5: 25%
        const values = [5, 10, 15, 20, 25];
        base.attack += values[tier - 1] || 5;
      } else if (type === 'topaz') {
        // Magic Attack %: Tier 1: 5%, Tier 2: 10%, Tier 3: 15%, Tier 4: 20%, Tier 5: 25%
        const values = [5, 10, 15, 20, 25];
        base.magicAttack = (base.magicAttack || 0) + (values[tier - 1] || 5);
      } else if (type === 'emerald') {
        // Max HP %: Tier 1: 10%, Tier 2: 20%, Tier 3: 30%, Tier 4: 40%, Tier 5: 50%
        const values = [10, 20, 30, 40, 50];
        base.maxHp += values[tier - 1] || 10;
      } else if (type === 'sapphire') {
        // Defense %: Tier 1: 5%, Tier 2: 10%, Tier 3: 15%, Tier 4: 20%, Tier 5: 25%
        const values = [5, 10, 15, 20, 25];
        base.defense += values[tier - 1] || 5;
      } else if (type === 'amethyst') {
        // Crit Rate: Tier 1: 2%, Tier 2: 4%, Tier 3: 6%, Tier 4: 8%, Tier 5: 10%
        // Crit Damage: Tier 1: 5%, Tier 2: 10%, Tier 3: 15%, Tier 4: 20%, Tier 5: 25%
        const rateValues = [0.02, 0.04, 0.06, 0.08, 0.10];
        const dmgValues = [0.05, 0.10, 0.15, 0.20, 0.25];
        base.critRate += rateValues[tier - 1] || 0.02;
        base.critDamage += dmgValues[tier - 1] || 0.05;
      }
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
        if (affix.stats.lifesteal) base.lifesteal = (base.lifesteal || 0) + affix.stats.lifesteal;
        if (affix.stats.spellVamp) base.spellVamp = (base.spellVamp || 0) + affix.stats.spellVamp;
        if (affix.stats.evasion) base.evasion = (base.evasion || 0) + affix.stats.evasion;
        if (affix.stats.block) base.block = (base.block || 0) + affix.stats.block;
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
  base.lifesteal = Math.max(0, base.lifesteal || 0);
  base.spellVamp = Math.max(0, base.spellVamp || 0);
  base.evasion = Math.max(0, base.evasion || 0);
  base.block = Math.max(0, base.block || 0);
  base.magicAttack = Math.max(0, base.magicAttack || 0);
  base.magicResist = Math.max(0, base.magicResist || 0);
  base.critRate = Math.max(0, base.critRate);
  base.critDamage = Math.max(0, base.critDamage);

  return base;
}

// Formula for calculating prestige points earned based on stage/gold
export function calculatePrestigePoints(stageCleared: number): number {
  if (stageCleared < 10) return 0;
  return Math.floor(Math.pow(stageCleared - 9, 1.5));
}

export function calculateGoldUpgradeCost(stat: 'attack' | 'hp' | 'hpRecovery' | 'critDamage', currentLevel: number): number {
  const baseCosts = {
    attack: 100,
    hp: 100,
    hpRecovery: 120,
    critDamage: 250
  };
  // Scales at 1.15 multiplier to properly align with exponential gold income scaling (1.12 per stage level)
  return Math.floor(baseCosts[stat] * Math.pow(1.15, currentLevel));
}

// Core stats calculation for Hero
export function recalculateHeroStats(
  level: number,
  prestigePoints: number,
  equippedItems: EquipmentItem[],
  heroClass?: 'knight' | 'mage' | 'assassin',
  shardUpgrades?: { attack?: number; magicAttack?: number; maxHp?: number },
  goldUpgrades?: { attack?: number; hp?: number; hpRecovery?: number; critDamage?: number }
): BaseStats {
  // Shard Upgrades (each upgrade level gives +3% bonus)
  const shardHpPct = 1 + (shardUpgrades?.maxHp || 0) * 0.03;
  const shardAtkPct = 1 + (shardUpgrades?.attack || 0) * 0.03;
  const shardMagAtkPct = 1 + (shardUpgrades?.magicAttack || 0) * 0.03;

  let baseHp = 100;
  let hpGrowth = 15;
  let baseAtk = 15;
  let atkGrowth = 2.5;
  let baseDef = 5;
  let defGrowth = 1.0;
  let baseSpd = 100;
  let baseCrit = 0.05;
  let baseCritDmg = 1.5;
  let baseMagAtk = 5;
  let magAtkGrowth = 0.5;
  let baseMagRes = 5;
  let magResGrowth = 1.0;

  if (heroClass === 'knight') {
    baseHp = 140;
    hpGrowth = 22;
    baseAtk = 12;
    atkGrowth = 1.8;
    baseDef = 10;
    defGrowth = 1.5;
    baseMagAtk = 6;
    magAtkGrowth = 0.8;
    baseMagRes = 8;
    magResGrowth = 1.2;
    baseSpd = 90;
    baseCrit = 0.03;
    baseCritDmg = 1.5;
  } else if (heroClass === 'mage') {
    baseHp = 80;
    hpGrowth = 12;
    baseAtk = 5;
    atkGrowth = 0.5;
    baseDef = 3;
    defGrowth = 0.5;
    baseMagAtk = 25;
    magAtkGrowth = 3.2;
    baseMagRes = 12;
    magResGrowth = 1.6;
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
    baseMagAtk = 6;
    magAtkGrowth = 0.6;
    baseMagRes = 5;
    magResGrowth = 0.6;
    baseSpd = 125;
    baseCrit = 0.15;
    baseCritDmg = 1.8;
  }

  const baseStats: BaseStats = {
    maxHp: Math.round(Math.round(baseHp + (level - 1) * hpGrowth + (goldUpgrades?.hp || 0) * 85) * shardHpPct),
    attack: Math.round(Math.round(baseAtk + (level - 1) * atkGrowth + (goldUpgrades?.attack || 0) * 12) * shardAtkPct),
    magicAttack: Math.round(Math.round(baseMagAtk + (level - 1) * magAtkGrowth) * shardMagAtkPct),
    defense: Math.round(baseDef + (level - 1) * defGrowth),
    magicResist: Math.round(baseMagRes + (level - 1) * magResGrowth),
    speed: baseSpd,
    critRate: baseCrit,
    critDamage: baseCritDmg + (goldUpgrades?.critDamage || 0) * 0.02,
    hpRecovery: (goldUpgrades?.hpRecovery || 0) * 3,
    lifesteal: 0,
    spellVamp: 0,
    evasion: 0,
    block: 0
  };

  // Prestige multipliers (1% damage, 1% hp per point)
  const prestigeDmgMult = 1 + prestigePoints * 0.02;
  const prestigeHpMult = 1 + prestigePoints * 0.02;
  const prestigeDefMult = 1 + prestigePoints * 0.01;

  let eqHpPct = 1.0;
  let eqAtkPct = 1.0;
  let eqDefPct = 1.0;
  let eqMagAtkPct = 1.0;
  let eqMagResPct = 1.0;

  let totalSpeed = baseStats.speed;
  let totalCritRate = baseStats.critRate;
  let totalCritDamage = baseStats.critDamage;
  let totalLifesteal = baseStats.lifesteal || 0;
  let totalSpellVamp = baseStats.spellVamp || 0;
  let totalEvasion = baseStats.evasion || 0;
  let totalBlock = baseStats.block || 0;

  // Add equipment bonuses safely using getFinalItemStats helper
  const items = equippedItems || [];
  for (const item of items) {
    if (!item) continue;
    const stats = getFinalItemStats(item);
    eqHpPct += (stats.maxHp || 0) / 100;
    eqAtkPct += (stats.attack || 0) / 100;
    eqDefPct += (stats.defense || 0) / 100;
    eqMagAtkPct += (stats.magicAttack || 0) / 100;
    eqMagResPct += (stats.magicResist || 0) / 100;

    totalSpeed += stats.speed || 0;
    totalCritRate += stats.critRate || 0;
    totalCritDamage += stats.critDamage || 0;
    totalLifesteal += stats.lifesteal || 0;
    totalSpellVamp += stats.spellVamp || 0;
    totalEvasion += stats.evasion || 0;
    totalBlock += stats.block || 0;
  }

  return {
    maxHp: Math.round(baseStats.maxHp * eqHpPct * prestigeHpMult),
    attack: Math.round(baseStats.attack * eqAtkPct * prestigeDmgMult),
    defense: Math.round(baseStats.defense * eqDefPct * prestigeDefMult),
    speed: totalSpeed,
    critRate: Math.min(0.85, totalCritRate), // cap crit rate at 85%
    critDamage: Math.round(totalCritDamage * 100) / 100,
    lifesteal: Math.round(totalLifesteal * 100) / 100,
    spellVamp: Math.round(totalSpellVamp * 100) / 100,
    evasion: Math.round(Math.min(0.75, totalEvasion) * 100) / 100, // cap evasion at 75%
    block: Math.round(Math.min(0.75, totalBlock) * 100) / 100,      // cap block at 75%
    magicAttack: Math.round((baseStats.magicAttack || 0) * eqMagAtkPct * prestigeDmgMult),
    magicResist: Math.round((baseStats.magicResist || 0) * eqMagResPct * prestigeDefMult),
    hpRecovery: baseStats.hpRecovery || 0
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
  { name: 'Vampiric', stats: { maxHp: 30, attack: 10, lifesteal: 0.05 } },
  { name: 'Siphoning', stats: { attack: 15, spellVamp: 0.05 } },
  { name: 'Elusive', stats: { evasion: 0.05 } },
  { name: 'Guarded', stats: { block: 0.05 } }
];

// Suffixes pool
const SUFFIXES = [
  { name: 'of Giant', stats: { maxHp: 45 } },
  { name: 'of Swiftness', stats: { speed: 15 } },
  { name: 'of Phoenix', stats: { maxHp: 30, critRate: 0.01 } },
  { name: 'of Sage', stats: { attack: 5, defense: 5 } },
  { name: 'of the Thief', stats: { goldBonus: 0.10 } },
  { name: 'of Blood', stats: { lifesteal: 0.04 } },
  { name: 'of Leeching', stats: { spellVamp: 0.04 } },
  { name: 'of Wind', stats: { evasion: 0.04 } },
  { name: 'of Shield', stats: { block: 0.04 } }
];

export function rollItemQuality(rarity: ItemRarity): number {
  let min = 100;
  let max = 100;
  switch (rarity) {
    case 'common':
      min = 80; max = 100;
      break;
    case 'uncommon':
      min = 90; max = 110;
      break;
    case 'rare':
      min = 95; max = 120;
      break;
    case 'epic':
      min = 100; max = 135;
      break;
    case 'legendary':
      min = 110; max = 160;
      break;
  }
  return Math.floor(min + Math.random() * (max - min + 1));
}

export function scaleStatsByQuality(stats: BaseStats, quality: number): BaseStats {
  const mult = quality / 100;
  return {
    maxHp: stats.maxHp ? Math.round(stats.maxHp * mult) : 0,
    attack: stats.attack ? Math.round(stats.attack * mult) : 0,
    defense: stats.defense ? Math.round(stats.defense * mult) : 0,
    speed: stats.speed ? Math.round(stats.speed * mult) : 0,
    critRate: stats.critRate ? Math.round(stats.critRate * mult * 1000) / 1000 : 0,
    critDamage: stats.critDamage ? Math.round(stats.critDamage * mult * 100) / 100 : 0,
    lifesteal: stats.lifesteal ? Math.round(stats.lifesteal * mult * 100) / 100 : 0,
    spellVamp: stats.spellVamp ? Math.round(stats.spellVamp * mult * 100) / 100 : 0,
    evasion: stats.evasion ? Math.round(stats.evasion * mult * 100) / 100 : 0,
    block: stats.block ? Math.round(stats.block * mult * 100) / 100 : 0,
    magicAttack: stats.magicAttack ? Math.round(stats.magicAttack * mult) : 0,
    magicResist: stats.magicResist ? Math.round(stats.magicResist * mult) : 0,
    hpRecovery: stats.hpRecovery ? Math.round(stats.hpRecovery * mult) : 0
  };
}

// Generate a random item instance from template
export function createItemInstance(template: ItemTemplate, level = 1): EquipmentItem {
  const quality = rollItemQuality(template.rarity);
  const baseStats = calculateItemStats(template.slot, template.rarity, level);
  const stats = scaleStatsByQuality(baseStats, quality);

  let socketCount = 0;
  if (template.rarity === 'common') {
    socketCount = 0;
  } else if (template.rarity === 'uncommon') {
    socketCount = 1;
  } else if (template.rarity === 'rare') {
    socketCount = 2;
  } else if (template.rarity === 'epic') {
    socketCount = 3;
  } else if (template.rarity === 'legendary') {
    socketCount = 4;
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
    quality,
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
const ITEM_NAMES_DB: Record<string, Record<string, Record<string, string[]>>> = {
  knight: {
    weapon: {
      common: ["Kiếm sắt rỉ", "Rìu tiều phu", "Búa gỗ"],
      uncommon: ["Kiếm thép thô", "Rìu chiến kép", "Búa sắt nặng"],
      rare: ["Đại kiếm khổng lồ", "Rìu xuyên giáp", "Thương Thần sắt"],
      epic: ["Kiếm Hỏa Long", "Rìu chiến phá trời", "Búa chấn động đất"],
      legendary: ["Kiếm Thần Thiên Mệnh", "Rìu Thần Long Phá Trời", "Búa Diệt Quỷ Hủy Thế"]
    },
    helmet: {
      common: ["Mũ sắt trơn", "Mũ chiến binh da thô", "Nía sắt"],
      uncommon: ["Mũ lính pháo đài", "Mũ sắt nạm đồng", "Mũ sừng bò"],
      rare: ["Mũ giáp nặng", "Mũ sừng chiến binh rừng sâu", "Mũ thép chắc chắn"],
      epic: ["Mũ Hỏa Long", "Mũ sừng Quỷ Thép", "Mũ Đại Chiến Thần"],
      legendary: ["Mũ Vua Vàng", "Mũ chiến Thần Long", "Mũ Bất tử Vua Âm phủ"]
    },
    armor: {
      common: ["Giáp da thô", "Đệm ngực sắt", "Giáp xích rách"],
      uncommon: ["Giáp xích lính", "Giáp tấm thép thô", "Giáp vai kim loại"],
      rare: ["Giáp thép nặng tinh chế", "Giáp tấm chắc chắn", "Giáp Sư tử lớn"],
      epic: ["Giáp vảy Hỏa Long", "Giáp Chiến Thần Vô địch", "Giáp nặng thạch anh"],
      legendary: ["Giáp Thánh Vương", "Giáp Thần Long Bất tử", "Giáp Huyền Vũ Cổ đại"]
    },
    boots: {
      common: ["Giày da thô nặng", "Giày vải đế gỗ", "Giày sắt rỉ"],
      uncommon: ["Giày sắt lính", "Giày bảo vệ da bò", "Giày chiến thép nhẹ"],
      rare: ["Giày thép nặng tinh chế", "Giày da gấu chắc chắn", "Giày đinh thép"],
      epic: ["Giày Hỏa Long Bộ", "Giày Kim cương Bất hoại", "Giày Đại Chiến Thần"],
      legendary: ["Giày Sao Thần Vương", "Giày Thần Long Bất tử", "Giày Trấn Địa Cổ đại"]
    },
    ring: {
      common: ["Nhẫn sắt rộng", "Nhẫn đồng thô bạo", "Vòng tay đồng"],
      uncommon: ["Nhẫn thép gia cố", "Nhẫn đá mắt hổ", "Vòng tay chiến binh bạc"],
      rare: ["Nhẫn Sư tử Vương", "Nhẫn phòng thủ đá khổng lồ", "Bông tai Ý chí Chiến tranh"],
      epic: ["Nhẫn mắt Hỏa Long", "Nhẫn bảo vệ cơ thể Kim cương", "Nhẫn Chiến Thần Cuồng nộ"],
      legendary: ["Nhẫn Thần Vương Rung chuyển Trời", "Nhẫn Linh hồn Thần Long Bất tử", "Nhẫn Hoang dã Cổ đại"]
    },
    gloves: {
      common: ["Găng tay da dày", "Băng tay chiến binh vải thô", "Găng tay sắt sứt mẻ"],
      uncommon: ["Găng tay lính thép", "Găng tay da gấu thô", "Găng tay bảo vệ cổ tay"],
      rare: ["Găng tay thép tinh chế", "Găng tay Bão Sư tử", "Găng tay Phá giáp nặng"],
      epic: ["Găng tay móng vuốt Hỏa Long", "Găng tay Kim cương Bất hoại", "Găng tay Sức mạnh Chiến thần"],
      legendary: ["Tay Bá chủ Thần Vương", "Tay móng vuốt Thần Long Bất tử", "Nắm đấm Khai Thiên Cổ đại"]
    }
  },
  mage: {
    weapon: {
      common: ["Gậy sồi cũ", "Sách phép nát", "Gậy tập luyện"],
      uncommon: ["Susty Phép nát", "Dady Phép nát", "Hiding Phép nát"],
      rare: ["Ciame Phép sư", "Biornet Phép nát", "Slime Phép sư"],
      epic: ["Tavuri Slayer", "Blanote Slayer", "Soarmon Slayer"],
      legendary: ["Finpus Slayer", "Gamson Slayer", "Star Slayer"]
    },
    helmet: {
      common: ["Canvas Scarf", "Vastous Scarf", "Dossing Scarf"],
      uncommon: ["Higher Canvy", "Poatrous Scarf", "Dark Emperor Scarf"],
      rare: ["Deely Hats", "Unique Burn Hats", "Dark Genhle Mask"],
      epic: ["Blot Iffuers Mask", "The Warth Mask", "Dark Emperor Mirror Mask"],
      legendary: ["The Isinokls Mask", "Dark Emperor Mirror Mask", "Grand Dark Emperor Mirror Mask"]
    },
    armor: {
      common: ["Torn Cloth Cloak", "Torn Cloth Cloak II", "Dragon Scale Cloak"],
      uncommon: ["Torn Cloth Cloak III", "Torn Cloth Cloak IV", "Dragon Scale Armor"],
      rare: ["Sawidans Armor", "Suvnitflure Armor", "Dragoriosx Dark Armor"],
      epic: ["Dragon Scale Armor II", "Dragon Scale Armor III", "Dragon Scale Dark Armor"],
      legendary: ["The Tavone Armor", "Dragon Scale Dark Armor II", "Ancient Dragon Scale Armor"]
    },
    boots: {
      common: ["Torn Cloth Shoes", "Torn Cloth Shoes II", "Torn Cloth Shoes III"],
      uncommon: ["Torn Cloth Shoes IV", "Torn Cloth Shoes V", "Torn Cloth Shoes VI"],
      rare: ["Torn Cloth Shoes VII", "Detherworld Shoes", "Nine Netherworld Shoes"],
      epic: ["Nelneanworld Shoes", "Hithwauworld Shoes", "Nine Aivay Shoes"],
      legendary: ["Netherworld Steps", "Nine Netherworld Steps", "Cosmic Netherworld Steps"]
    },
    ring: {
      common: ["Plain Copper Ring", "Plain Copper Ring II", "Plain Copper Ring III"],
      uncommon: ["Plain Copper Ring IV", "Plain Copper Ring V", "Gray Copper Ring"],
      rare: ["Epic Copper Ring", "Damn Copper Ring", "Epic Copper Ring II"],
      epic: ["World-Copper Ring", "World-Destroyer Ring", "World-Destroyer Ring II"],
      legendary: ["World-Destroying Ring", "World-Destroying Killing Intent Rings", "Universe-Destroying Ring"]
    },
    gloves: {
      common: ["Thin Cloth Gloves", "Thin Cloth Gloves II", "Blood Cloth Gloves"],
      uncommon: ["Thin Cloth Gloves III", "Thin Cloth Gloves IV", "Stroalownem Gloves"],
      rare: ["Epin Cloth Gloves", "Blsan Cloth Gloves", "Blood Coth Gloves"],
      epic: ["Blood God Water Gloves", "Blood God Slaughter Hand", "Blood God Slaughter Hand II"],
      legendary: ["Blood God Slaughter Hand III", "Blood God Slaughter Hand IV", "Blood God Slaughter Hand V"]
    }
  },
  assassin: {
    weapon: {
      common: ["Dao Găm Gỉ Sét", "Kiếm Ngắn Gỗ", "Shuriken Sắt"],
      uncommon: ["Lưỡi Kép Thép Sắc Bén", "Dao Găm Đồng", "Kiếm Răng Cưa"],
      rare: ["Kim Độc", "Kiếm Ngắn Săn Đêm", "Cây Chùy Gai Ám Sát"],
      epic: ["Lưỡi Trăng Máu", "Móng Vuốt Bóng Tối", "Lưỡi Hái Linh Hồn"],
      legendary: ["Móng Vuốt Phong Ma", "Gương Thảm Họa", "Kẻ Diệt Sao"]
    },
    helmet: {
      common: ["Khăn Quàng Cổ Vải Bố", "Mũ Da Mòn", "Mặt Nạ Vải Thô"],
      uncommon: ["Khăn Quàng Đêm Đen", "Mũ Da Sói", "Mặt Nạ Sắt Nửa Mặt"],
      rare: ["Mũ Trùm Rừng Sâu", "Mặt Nạ Thợ Săn Đêm", "Băng Đeo Đầu Huyết Tộc"],
      epic: ["Mũ Trùm Vô Hình", "Mặt Nạ Quỷ Đêm", "Vương Miện Bóng Đêm"],
      legendary: ["Gương Mắt Thần", "Mặt Nạ Tay Hư Không", "Mặt Nạ Gương Hắc Hoàng Đế"]
    },
    armor: {
      common: ["Áo Choàng Vải Rách", "Giáp Da Thô", "Áo Khoác Ngắn Thợ Săn"],
      uncommon: ["Áo Choàng Người Đi Đêm", "Giáp Da Rừng Nhiệt Đới", "Giáp Sợi Thép"],
      rare: ["Giáp Da Báo Băng", "Áo Choàng Tàng Hình", "Giáp Nhẹ Khảm Bạc"],
      epic: ["Áo Choàng Bóng Huyết", "Giáp Rắn Đêm", "Áo Choàng Bóng Quỷ"],
      legendary: ["Áo Choàng Đêm Ngàn Năm", "Giáp Bóng Ma Thần", "Giáp Vảy Rồng Đen"]
    },
    boots: {
      common: ["Giày Vải Rách", "Băng Quấn Chân Vải", "Giày Da Thô"],
      uncommon: ["Giày Da Thợ Săn", "Giày Vải Gai Bền", "Giày Người Đi Đêm Nhẹ"],
      rare: ["Giày Trăm Bước Chân Nhẹ", "Ủng Tốc Độ Báo Gấm", "Đinh Giày Ám Sát"],
      epic: ["Ủng Bóng Gió", "Bước Chân Ủng Bóng Huyết", "Ủng Đêm Bí Ẩn"],
      legendary: ["Bước Chân Tốc Bầu Trời Sao", "Ủng Gió Nhanh Hư Không", "Chín Bước Chân Địa Ngục"]
    },
    ring: {
      common: ["Nhẫn Đồng Trơn", "Nhẫn Đá Thô", "Nhẫn Sắt Sứt Mẻ"],
      uncommon: ["Nhẫn Khắc Biểu Tượng", "Nhẫn Mã Não", "Nhẫn Sắt Ý Bạc"],
      rare: ["Nhẫn Ngọc Rắn Độc", "Nhẫn Huyết Thạch Thật", "Nhẫn Tốc Độ Ánh Sáng"],
      epic: ["Nhẫn Định Vị Mắt Quỷ", "Nhẫn Sức Mạnh Quỷ Bóng Tối", "Nhẫn Tinh Hoa Trăng Máu"],
      legendary: ["Nhẫn Phước Lành Thần Thánh", "Cõi Hư Không Tối Cao", "Nhẫn Sát Ý Hủy Diệt Thế Giới"]
    },
    gloves: {
      common: ["Găng Tay Vải Mỏng", "Găng Tay Da Thô", "Băng Quấn Tay Vải Gai"],
      uncommon: ["Găng Tay Thợ Săn", "Găng Tay Da Khảm Đồng", "Găng Tay Người Đi Đêm"],
      rare: ["Găng Tay Móng Vuốt Độc", "Găng Tay Nhẹ Khảm Bạc", "Găng Tay Tăng Tốc"],
      epic: ["Găng Tay Móng Vuốt Quỷ", "Găng Tay Đêm Chết Chóc", "Găng Tay Bóng Tối"],
      legendary: ["Móng Vuốt Thần Thánh Bàn Tay Thần", "Bàn Tay Hủy Diệt Hư Không", "Bàn Tay Tàn Sát Huyết Thần"]
    }
  }
};

const LEGACY_ID_MAP: Record<string, string> = {
  "knight_weapon_common_0": "t_wpn_rusty",
  "knight_weapon_uncommon_0": "t_wpn_steel",
  "knight_weapon_rare_0": "t_wpn_knight",
  "knight_weapon_epic_0": "t_wpn_demonic",
  "knight_weapon_legendary_0": "t_wpn_excalibur",
  "mage_weapon_common_0": "t_wpn_rusty_staff",
  "mage_weapon_uncommon_0": "t_wpn_apprentice_staff",
  "mage_weapon_rare_0": "t_wpn_wizard_rod",
  "mage_weapon_epic_0": "t_wpn_archmage_wand",
  "mage_weapon_legendary_0": "t_wpn_cosmos_staff",
  "assassin_weapon_common_0": "t_wpn_rusty_dagger",
  "assassin_weapon_uncommon_0": "t_wpn_steel_daggers",
  "assassin_weapon_rare_0": "t_wpn_poison_dagger",
  "assassin_weapon_epic_0": "t_wpn_death_claws",
  "assassin_weapon_legendary_0": "t_wpn_asura_blades",
  "knight_armor_common_0": "t_arm_rag",
  "knight_armor_uncommon_0": "t_arm_leather",
  "knight_armor_rare_0": "t_arm_plate",
  "knight_armor_epic_0": "t_arm_dragon",
  "knight_armor_legendary_0": "t_arm_god_plate",
  "mage_armor_common_0": "t_arm_rag_robe",
  "mage_armor_uncommon_0": "t_arm_leather_robe",
  "mage_armor_rare_0": "t_arm_silk_robe",
  "mage_armor_epic_0": "t_arm_phoenix_robe",
  "mage_armor_legendary_0": "t_arm_celestial_robe",
  "assassin_armor_common_0": "t_arm_rag_cloak",
  "assassin_armor_uncommon_0": "t_arm_leather_cloak",
  "assassin_armor_rare_0": "t_arm_shadow_vest",
  "assassin_armor_epic_0": "t_arm_nether_cloak",
  "assassin_armor_legendary_0": "t_arm_phantom_garb",
  "knight_helmet_common_0": "t_hel_cap",
  "knight_helmet_uncommon_0": "t_hel_iron",
  "knight_helmet_rare_0": "t_hel_great",
  "knight_helmet_epic_0": "t_hel_dragon_horn",
  "knight_helmet_legendary_0": "t_hel_aegis_visor",
  "mage_helmet_common_0": "t_hel_cap_mage",
  "mage_helmet_uncommon_0": "t_hel_apprentice_hood",
  "mage_helmet_rare_0": "t_hel_wizard_hat",
  "mage_helmet_epic_0": "t_hel_archmage_crown",
  "mage_helmet_legendary_0": "t_hel_cosmos_crown",
  "assassin_helmet_common_0": "t_hel_cap_assassin",
  "assassin_helmet_uncommon_0": "t_hel_leather_mask",
  "assassin_helmet_rare_0": "t_hel_shadow_hood",
  "assassin_helmet_epic_0": "t_hel_death_cowl",
  "assassin_helmet_legendary_0": "t_hel_asura_hood",
  "knight_boots_common_0": "t_bts_worn",
  "knight_boots_uncommon_0": "t_bts_steel_greaves",
  "knight_boots_rare_0": "t_bts_guardian",
  "knight_boots_epic_0": "t_bts_dragonscale",
  "knight_boots_legendary_0": "t_bts_aegis",
  "mage_boots_common_0": "t_bts_worn_mage",
  "mage_boots_uncommon_0": "t_bts_mage_sandals",
  "mage_boots_rare_0": "t_bts_sorcerer_boots",
  "mage_boots_epic_0": "t_bts_archmage_slippers",
  "mage_boots_legendary_0": "t_bts_cosmos",
  "assassin_boots_common_0": "t_bts_worn_assassin",
  "assassin_boots_uncommon_0": "t_bts_leather",
  "assassin_boots_rare_0": "t_bts_stealth_treads",
  "assassin_boots_epic_0": "t_bts_shadow_boots",
  "assassin_boots_legendary_0": "t_bts_asura",
  "knight_ring_common_0": "t_rng_brass",
  "knight_ring_uncommon_0": "t_rng_silver",
  "knight_ring_rare_0": "t_rng_ruby",
  "knight_ring_epic_0": "t_rng_dragon_crest",
  "knight_ring_legendary_0": "t_rng_aegis",
  "mage_ring_common_0": "t_rng_brass_mage",
  "mage_ring_uncommon_0": "t_rng_silver_mage",
  "mage_ring_rare_0": "t_rng_ruby_mage",
  "mage_ring_epic_0": "t_rng_archmage_signet",
  "mage_ring_legendary_0": "t_rng_cosmos",
  "assassin_ring_common_0": "t_rng_brass_assassin",
  "assassin_ring_uncommon_0": "t_rng_silver_assassin",
  "assassin_ring_rare_0": "t_rng_ruby_assassin",
  "assassin_ring_epic_0": "t_rng_death_band",
  "assassin_ring_legendary_0": "t_rng_asura"
};

const getTemplateId = (cls: string, slot: string, rarity: string, idx: number): string => {
  const key = `${cls}_${slot}_${rarity}_${idx}`;
  if (LEGACY_ID_MAP[key]) return LEGACY_ID_MAP[key];
  
  const slotShorthands: Record<string, string> = {
    weapon: "wpn",
    armor: "arm",
    helmet: "hel",
    boots: "bts",
    ring: "rng",
    gloves: "glo"
  };
  const sh = slotShorthands[slot] || slot;
  return `t_${sh}_${cls}_${rarity}_${idx + 1}`;
};

const getLegendaryStats = (cls: string, slot: string, idx: number): Partial<BaseStats> => {
  if (slot === "weapon") {
    if (cls === "knight") {
      if (idx === 0) return { lifesteal: 0.08 };
      if (idx === 1) return { critRate: 0.05 };
      return { critDamage: 0.15 };
    } else if (cls === "mage") {
      if (idx === 0) return { spellVamp: 0.10 };
      if (idx === 1) return { critRate: 0.06 };
      return { critDamage: 0.20 };
    } else {
      if (idx === 0) return { lifesteal: 0.10 };
      if (idx === 1) return { critRate: 0.12 };
      return { critDamage: 0.25 };
    }
  }
  if (slot === "armor") {
    if (cls === "knight") {
      if (idx === 0) return { block: 0.12 };
      if (idx === 1) return { defense: 10 };
      return { maxHp: 50 };
    } else if (cls === "mage") {
      if (idx === 0) return { evasion: 0.08 };
      if (idx === 1) return { block: 0.06 };
      return { evasion: 0.06, block: 0.04 };
    } else {
      if (idx === 0) return { evasion: 0.12 };
      if (idx === 1) return { critRate: 0.05 };
      return { evasion: 0.08, critRate: 0.03 };
    }
  }
  return {};
};

const buildTemplates = (): ItemTemplate[] => {
  const templates: ItemTemplate[] = [];
  const classes: Array<"knight" | "mage" | "assassin"> = ["knight", "mage", "assassin"];
  const slots: EquipmentSlot[] = ["weapon", "helmet", "armor", "boots", "ring", "gloves"];
  const rarities: ItemRarity[] = ["common", "uncommon", "rare", "epic", "legendary"];

  for (const cls of classes) {
    for (const slot of slots) {
      for (const rarity of rarities) {
        const names = ITEM_NAMES_DB[cls]?.[slot]?.[rarity] || [];
        names.forEach((name, idx) => {
          templates.push({
            id: getTemplateId(cls, slot, rarity, idx),
            name,
            slot,
            rarity,
            allowedClass: cls,
            stats: rarity === "legendary" ? getLegendaryStats(cls, slot, idx) : {}
          });
        });
      }
    }
  }
  return templates;
};

export const DEFAULT_ITEM_TEMPLATES: ItemTemplate[] = buildTemplates();

export function generateMonsterForStage(
  stage: number,
  _heroLevel: number = 1,
  monsterResearch?: Record<string, { level: number; exp: number; kills: number }>,
  wave: number = 1
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
  const isMiniBoss = wave === 5 || wave === 10 || wave === 15;
  const isStageBoss = wave === 20;
  const isBossStage = isMiniBoss || isStageBoss;

  if (isStageBoss) {
    if (stage % 50 === 0) rank = 'world_boss';
    else if (stage % 30 === 0) rank = 'ancient';
    else if (stage % 20 === 0) rank = 'mythic';
    else if (stage % 10 === 0) rank = 'legend';
    else rank = 'king';
  } else if (isMiniBoss) {
    rank = wave === 15 ? 'king' : 'champion';
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

  // Scale elite modifier down at low stages to smooth the entry curve
  const stageScale = Math.min(1.0, (stage - 1) / 9); // 0 at stage 1, 1.0 at stage 10
  const scaledEliteModifier = Math.round(eliteModifier * stageScale);

  // Dynamic Level Calculation
  const baseLevel = selectedSpecies.baseLevel;
  const stageModifier = stage === 1 ? 0 : Math.floor((stage - 1) * 1.0) + Math.floor(Math.max(0, stage - 10) * 0.1);
  const worldModifier = Math.floor((stage - 1) / 100) * 20;
  const level = baseLevel + stageModifier + worldModifier + scaledEliteModifier;

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
  let hp = Math.round(120 * Math.pow(1.15, level - 1) * selectedSpecies.baseHpMult);
  let attack = Math.round(6 * Math.pow(1.08, level - 1) * selectedSpecies.baseAtkMult);
  let defense = Math.round(2 * Math.pow(1.05, level - 1) * selectedSpecies.baseDefMult);
  let speed = 80 + Math.min(50, level * 0.5);

  // Exp & Gold reward scaling
  let expReward = Math.round(8 * Math.pow(1.11, stage - 1) * selectedSpecies.baseHpMult);
  let goldMin = Math.round(6 * Math.pow(1.12, stage - 1) * selectedSpecies.baseAtkMult);

  // Elite Rank multiplier bumps scaled down at low stages (100% full scaling at stage 10+)
  const statMultScale = Math.min(1.0, stage / 10);
  let rankStatMultiplier = 1.0;
  switch (rank) {
    case 'normal': rankStatMultiplier = 1 + (3.0 - 1) * statMultScale; break;
    case 'elite': rankStatMultiplier = 1 + (3.5 - 1) * statMultScale; break;
    case 'champion': rankStatMultiplier = 1 + (4.5 - 1) * statMultScale; break;
    case 'king': rankStatMultiplier = 1 + (6.0 - 1) * statMultScale; break;
    case 'legend': rankStatMultiplier = 1 + (8.0 - 1) * statMultScale; break;
    case 'mythic': rankStatMultiplier = 1 + (12.0 - 1) * statMultScale; break;
    case 'ancient': rankStatMultiplier = 1 + (16.0 - 1) * statMultScale; break;
    case 'world_boss': rankStatMultiplier = 1 + (25.0 - 1) * statMultScale; break;
  }

  hp = Math.round(hp * rankStatMultiplier);
  attack = Math.round(attack * (1 + (rankStatMultiplier - 1) * 0.4));
  defense = Math.round(defense * (1 + (rankStatMultiplier - 1) * 0.3));
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
      critDamage: 1.5,
      magicResist: defense
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

export function calculateItemCP(item: EquipmentItem): number {
  if (!item) return 0;
  const stats = getFinalItemStats(item);

  // base stats CP
  let cp = (stats.attack || 0) * 6.0 +
    (stats.magicAttack || 0) * 6.0 +
    (stats.maxHp || 0) * 0.5 +
    (stats.defense || 0) * 4.0 +
    (stats.magicResist || 0) * 4.0 +
    (stats.speed || 0) * 5.0 +
    (stats.critRate || 0) * 100 * 15.0 +
    (stats.critDamage || 0) * 100 * 8.0 +
    (stats.lifesteal || 0) * 100 * 10.0 +
    (stats.spellVamp || 0) * 100 * 10.0 +
    (stats.evasion || 0) * 100 * 12.0 +
    (stats.block || 0) * 100 * 12.0;

  // rarity bonus
  const rarityBonuses: Record<string, number> = {
    common: 0,
    uncommon: 50,
    rare: 150,
    epic: 400,
    legendary: 1000
  };
  cp += rarityBonuses[item.rarity] || 0;

  // gem bonus
  if (item.sockets) {
    const gemCount = item.sockets.filter(Boolean).length;
    cp += gemCount * 100;
  }

  return Math.round(cp);
}

export function calculateHeroCP(
  level: number,
  prestigePoints: number,
  equippedItems: EquipmentItem[],
  heroClass?: 'knight' | 'mage' | 'assassin',
  shardUpgrades?: { attack?: number; magicAttack?: number; maxHp?: number },
  goldUpgrades?: { attack?: number; hp?: number; hpRecovery?: number; critDamage?: number }
): number {
  const stats = recalculateHeroStats(level, prestigePoints, equippedItems, heroClass, shardUpgrades, goldUpgrades);

  // Calculate basic CP based on final stats
  let cp = stats.attack * 6.0 +
    (stats.magicAttack || 0) * 6.0 +
    stats.maxHp * 0.5 +
    stats.defense * 4.0 +
    (stats.magicResist || 0) * 4.0 +
    stats.speed * 5.0 +
    stats.critRate * 100 * 15.0 +
    (stats.critDamage - 1.5) * 100 * 8.0 +
    (stats.lifesteal || 0) * 100 * 10.0 +
    (stats.spellVamp || 0) * 100 * 10.0 +
    (stats.evasion || 0) * 100 * 12.0 +
    (stats.block || 0) * 100 * 12.0;

  // Add equipped items CP
  const items = equippedItems || [];
  for (const item of items) {
    if (item) {
      cp += calculateItemCP(item);
    }
  }

  return Math.round(cp);
}

export function calculateMonsterCP(monster: { baseStats: BaseStats; level: number }): number {
  if (!monster || !monster.baseStats) return 0;
  const stats = monster.baseStats;
  let cp = (stats.attack || 0) * 6.0 +
    (stats.maxHp || 0) * 0.5 +
    (stats.defense || 0) * 4.0 +
    (stats.speed || 0) * 5.0 +
    (stats.critRate || 0) * 100 * 15.0 +
    ((stats.critDamage || 1.5) - 1.5) * 100 * 8.0;
  return Math.round(cp);
}

// Calculate how many Aether Shards dismantling an item gives
export function calculateDismantleRewards(item: EquipmentItem): number {
  let base = 1;
  switch (item.rarity) {
    case 'uncommon': base = 3; break;
    case 'rare': base = 10; break;
    case 'epic': base = 30; break;
    case 'legendary': base = 100; break;
  }
  
  let mult = 1.0;
  if (item.level && item.level > 1) {
    mult += (item.level - 1) * 0.1;
  }
  if (item.kills) {
    if (item.kills >= 100000) mult += 0.5; // ancient bonus
    else if (item.kills >= 10000) mult += 0.2; // veteran bonus
  }
  return Math.round(base * mult);
}
