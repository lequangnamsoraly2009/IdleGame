import { create } from 'zustand';
import { GameSaveData, EquipmentItem, QuestState, MONSTER_SPECIES_DATABASE } from '@idle-rpg/shared';
import { tStore, translateEngineLog } from '../utils/i18n';
import { 
  recalculateHeroStats, 
  calculateLevelUpExp, 
  calculateUpgradeCost, 
  calculateItemStats,
  createItemInstance, 
  DEFAULT_ITEM_TEMPLATES, 
  calculatePrestigePoints,
  generateMonsterForStage,
  calculateDismantleRewards,
  calculateGoldUpgradeCost,
  scaleStatsByQuality
} from '@idle-rpg/shared';
import { authService, dbService, UserSession, generateStarterSave } from '@idle-rpg/firebase';
import { useLanguageStore } from './languageStore';

interface CombatLogEntry {
  id: string;
  time: string;
  text: string;
  category: 'combat' | 'loot' | 'system';
}

interface GameState {
  user: UserSession | null;
  saveData: GameSaveData | null;
  activeTab: 'home' | 'hero' | 'bag' | 'quest' | 'guild' | 'shop' | 'summon' | 'guide' | 'dungeon' | 'forge';
  activeDungeonId: string | null;
  dungeonRewardGems: Record<string, number> | null;
  dungeonRewardGold: number | null;
  dungeonRewardDiamonds: number | null;
  dungeonRewardItems: EquipmentItem[] | null;
  isLoading: boolean;
  activeInspectItemId: string | null;
  activeSummonResult: EquipmentItem[] | null;
  toastMessage: string | null;
  dungeonLoading: boolean;
  dungeonResult: 'victory' | 'defeat' | null;
  
  // Realtime Battle HUD healths (synced with Pixi tick updates)
  heroHp: number;
  heroMaxHp: number;
  heroRage: number;
  monsterHp: number;
  monsterMaxHp: number;
  monsterRage: number;
  monsterName: string;
  battleMode: 'stage' | 'guild_boss' | 'dungeon';

  // Hero Revival System State
  isDead: boolean;
  reviveCostGold: number;
  reviveCostDiamonds: number;
  engineInstance: any | null;

  // Combat Log List
  combatLogs: CombatLogEntry[];

  // Actions
  registerEngine: (engine: any) => void;
  triggerHeroDefeated: () => void;
  reviveHero: (method: 'gold' | 'diamonds' | 'time') => boolean;
  initializeAuth: () => () => void;
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string) => Promise<void>;
  signOut: () => Promise<void>;
  saveGame: () => Promise<void>;
  
  // Combat Loops
  syncBattleStats: (heroHp: number, monsterHp: number, maxHeroHp: number, maxMonsterHp: number, heroRage: number, monsterRage: number, potionCd?: number) => void;
  onMonsterDefeated: (expGained: number, goldGained: number, diamondsGained: number, itemsDropped: EquipmentItem[], monsterId?: string, isMutated?: boolean, durationMs?: number) => void;
  onStageChange: (newStage: number) => void;
  toggleAutoAdvance: () => void;
  challengeBoss: () => void;
  startNextBattle: () => void;
  
  // Gameplay Actions
  setActiveTab: (tab: 'home' | 'hero' | 'bag' | 'quest' | 'guild' | 'shop' | 'summon' | 'guide' | 'dungeon' | 'forge') => void;
  setActiveInspectItemId: (itemId: string | null) => void;
  upgradeEquipment: (itemId: string) => void;
  equipEquipment: (itemId: string) => void;
  unequipEquipment: (itemId: string) => void;
  dismantleEquipment: (itemId: string) => void;
  dismantleMultipleEquipment: (itemIds: string[]) => void;
  buyShardUpgrade: (stat: 'attack' | 'magicAttack' | 'maxHp') => void;
  buyGoldUpgrade: (stat: 'attack' | 'hp' | 'hpRecovery' | 'critDamage') => void;
  buyAetherChest: () => void;
  buyAetherDiamonds: () => void;
  claimQuestReward: (questId: string) => void;
  buyGoldPack: () => void;
  summonEquipment: () => void;
  summonTenEquipment: () => void;
  setActiveSummonResult: (items: EquipmentItem[] | null) => void;
  triggerPrestige: () => void;
  changeHeroClass: (newClass: 'knight' | 'mage' | 'assassin') => void;
  renameHero: (newName: string) => void;
  identifyEquipment: (itemId: string) => void;
  startGuildRaid: () => void;
  exitGuildRaid: () => void;
  insertGem: (itemId: string, gemKey: string, socketIdx: number) => void;
  removeGem: (itemId: string, socketIdx: number) => void;
  enterDungeon: (dungeonId: string) => void;
  combineGems: (gemType: string, tier: number) => void;
  buyDungeonTicket: () => void;
  onDungeonVictory: (dungeonId: string) => void;
  onDungeonDefeat: () => void;
  claimDungeonRewards: () => void;
  rollHeroTraits: () => void;
  toggleHeroTraitLock: (id: number) => void;
  triggerDungeonDefeat: () => void;
  usePotionInDungeon: () => boolean;
  addLogMessage: (text: string, category: 'combat' | 'loot' | 'system') => void;
  potionCooldownRemaining: number;
  setPotionCooldownRemaining: (sec: number) => void;
  onPotionUsedByEngine: (amount: number, didAutoBuy?: boolean) => void;
  usePotion: () => void;
  buyPotion: (quantity: number, currency: 'gold' | 'diamonds') => void;
  toggleAutoUsePotion: () => void;
  toggleAutoDismantleCommon: () => void;
  toggleAutoDismantleUncommon: () => void;
  toggleAutoDismantleRare: () => void;
  toggleAutoBuyPotions: () => void;
  clearLogs: () => void;
  showToast: (msg: string) => void;
}

function migrateMonsterResearch(monsterResearch: any): any {
  if (!monsterResearch) return {};
  const migrated: any = {};
  
  for (const [key, value] of Object.entries(monsterResearch)) {
    if (!value || typeof value !== 'object') continue;
    
    // Strip suffix like _0, _1
    const cleanId = key.replace(/_\d+$/, '');
    const val = value as any;
    
    if (!migrated[cleanId]) {
      const entry: any = {
        level: val.level ?? 1,
        exp: val.exp ?? 0,
        kills: val.kills ?? 0
      };
      if (val.firstKillTime !== undefined && val.firstKillTime !== null) {
        entry.firstKillTime = val.firstKillTime;
      }
      if (val.fastestKillMs !== undefined && val.fastestKillMs !== null) {
        entry.fastestKillMs = val.fastestKillMs;
      }
      if (val.highestDamage !== undefined && val.highestDamage !== null) {
        entry.highestDamage = val.highestDamage;
      }
      migrated[cleanId] = entry;
    } else {
      // Merge kills and exp, choose max level, first/fastest kills
      const existing = migrated[cleanId];
      existing.kills += val.kills ?? 0;
      existing.exp += val.exp ?? 0;
      existing.level = Math.max(existing.level, val.level ?? 1);
      
      if (val.firstKillTime !== undefined && val.firstKillTime !== null) {
        existing.firstKillTime = existing.firstKillTime !== undefined && existing.firstKillTime !== null
          ? Math.min(existing.firstKillTime, val.firstKillTime)
          : val.firstKillTime;
      }
      if (val.fastestKillMs !== undefined && val.fastestKillMs !== null) {
        existing.fastestKillMs = existing.fastestKillMs !== undefined && existing.fastestKillMs !== null
          ? Math.min(existing.fastestKillMs, val.fastestKillMs)
          : val.fastestKillMs;
      }
      if (val.highestDamage !== undefined && val.highestDamage !== null) {
        existing.highestDamage = existing.highestDamage !== undefined && existing.highestDamage !== null
          ? Math.max(existing.highestDamage, val.highestDamage)
          : val.highestDamage;
      }
    }
  }
  
  // Re-evaluate level up for the merged exp if needed
  for (const [_, res] of Object.entries(migrated)) {
    const r = res as any;
    while (r.level < 50) {
      const expNeeded = r.level * 100;
      if (r.exp >= expNeeded) {
        r.exp -= expNeeded;
        r.level += 1;
      } else {
        break;
      }
    }
  }
  
  return migrated;
}

export const useGameStore = create<GameState>((set, get) => {
  // Helper to trigger save to DB/local
  const autoSave = async (updatedSave: GameSaveData) => {
    set({ saveData: updatedSave });
    try {
      await dbService.saveGame(updatedSave);
    } catch (err) {
      console.error('Failed to auto-save:', err);
    }
  };

  // Helper to audit and advance quest progression
  const checkQuests = (quests: QuestState[], type: string, amount: number, currentLevel?: number): QuestState[] => {
    return quests.map(q => {
      if (q.claimed || q.targetType !== type) return q;
      
      let newCount = q.currentCount;
      if (type === 'reach_level' && currentLevel) {
        newCount = Math.max(q.currentCount, currentLevel);
      } else {
        newCount += amount;
      }

      const wasCompleted = q.completed;
      const completed = newCount >= q.targetCount;
      const completedAt = (completed && !wasCompleted) ? Date.now() : q.completedAt;

      return {
        ...q,
        currentCount: Math.min(q.targetCount, newCount),
        completed,
        completedAt
      };
    });
  };

  return {
    user: null,
    saveData: null,
    activeTab: 'hero',
    activeDungeonId: null,
    dungeonRewardGems: null,
    dungeonRewardGold: null,
    dungeonRewardDiamonds: null,
    dungeonRewardItems: null,
    isLoading: true,
    activeInspectItemId: null,
    activeSummonResult: null,
    toastMessage: null,
    dungeonLoading: false,
    dungeonResult: null,

    // Combat HUD state
    heroHp: 100,
    heroMaxHp: 100,
    heroRage: 0,
    monsterHp: 50,
    monsterMaxHp: 50,
    monsterRage: 0,
    monsterName: 'Loading monster...',
    battleMode: 'stage',

    // Hero Revival System State
    isDead: false,
    reviveCostGold: 0,
    reviveCostDiamonds: 0,
    engineInstance: null,

    combatLogs: [],

    initializeAuth: () => {
      set({ isLoading: true });
      const unsubscribe = authService.onAuthStateChanged(async (sessionUser) => {
        if (sessionUser) {
          try {
            let data = await dbService.loadGame(sessionUser.id);
            if (data && data.monsterResearch) {
              const originalKeys = Object.keys(data.monsterResearch);
              const hasSuffixedKeys = originalKeys.some(k => /_\d+$/.test(k));
              if (hasSuffixedKeys) {
                const migratedResearch = migrateMonsterResearch(data.monsterResearch);
                data = {
                  ...data,
                  monsterResearch: migratedResearch
                };
                await dbService.saveGame(data);
              }
            }
            if (data) {
              if (data.currentWave === undefined) data.currentWave = 1;
              if (data.autoAdvance === undefined) data.autoAdvance = true;
              if (data.hero.aetherShards === undefined) data.hero.aetherShards = 0;
              if (!data.hero.shardUpgrades) {
                data.hero.shardUpgrades = { attack: 0, magicAttack: 0, maxHp: 0 };
              }
              if (data.hero.potions === undefined) data.hero.potions = 5;
              if (data.hero.autoUsePotion === undefined) data.hero.autoUsePotion = false;
              if (data.hero.autoDismantleCommon === undefined) data.hero.autoDismantleCommon = false;
              if (data.hero.autoDismantleUncommon === undefined) data.hero.autoDismantleUncommon = false;
              if (data.hero.autoDismantleRare === undefined) data.hero.autoDismantleRare = false;
              if (data.hero.autoBuyPotions === undefined) data.hero.autoBuyPotions = false;
              if (data.hero.gems === undefined) data.hero.gems = {};
              if (data.hero.dungeonTickets === undefined) data.hero.dungeonTickets = 3;
              if (data.hero.traits === undefined || !Array.isArray(data.hero.traits)) {
                data.hero.traits = [
                  { id: 1, grade: 'C', stat: 'atk', value: 10, locked: false },
                  { id: 2, grade: 'C', stat: 'hp', value: 10, locked: false },
                  { id: 3, grade: 'C', stat: 'crit', value: 10, locked: false },
                  { id: 4, grade: 'C', stat: 'gold', value: 10, locked: false },
                  { id: 5, grade: 'C', stat: 'atk', value: 10, locked: false }
                ];
              }

              // Synchronize quests from templates
              try {
                const templates = await dbService.loadQuestTemplates();
                const now = Date.now();
                const lastDaily = data.lastDailyResetAt || 0;
                const lastWeekly = data.lastWeeklyResetAt || 0;

                const isDifferentDay = (ts1: number, ts2: number): boolean => {
                  const d1 = new Date(ts1);
                  const d2 = new Date(ts2);
                  return d1.getFullYear() !== d2.getFullYear() || d1.getMonth() !== d2.getMonth() || d1.getDate() !== d2.getDate();
                };

                const isDifferentWeek = (ts1: number, ts2: number): boolean => {
                  if (ts1 === 0) return true;
                  const d1 = new Date(ts1);
                  const d2 = new Date(ts2);
                  const getMondayMidnight = (d: Date) => {
                    const temp = new Date(d);
                    const day = temp.getDay();
                    const diff = temp.getDate() - day + (day === 0 ? -6 : 1);
                    temp.setDate(diff);
                    temp.setHours(0, 0, 0, 0);
                    return temp.getTime();
                  };
                  return getMondayMidnight(d1) !== getMondayMidnight(d2);
                };

                const dailyResetNeeded = isDifferentDay(lastDaily, now);
                const weeklyResetNeeded = isDifferentWeek(lastWeekly, now);

                let playerQuests = data.quests ? [...data.quests] : [];

                 // Heal legacy quests to ensure all required fields are present
                playerQuests = playerQuests.map(q => {
                  const id = q.id || '';
                  const type = q.type || 'newbie';
                  const title = q.title || '';
                  const description = q.description || '';
                  const targetType = q.targetType || 'defeat_monster';
                  const targetCount = q.targetCount || 1;
                  const currentCount = q.currentCount || 0;
                  const rewardGold = q.rewardGold || 0;
                  const rewardDiamonds = q.rewardDiamonds || 0;
                  const completed = q.completed || false;
                  const claimed = q.claimed || false;
                  return {
                    ...q,
                    id,
                    type,
                    title,
                    description,
                    targetType,
                    targetCount,
                    currentCount,
                    rewardGold,
                    rewardDiamonds,
                    completed,
                    claimed
                  };
                });

                if (dailyResetNeeded) {
                  playerQuests = playerQuests.filter(q => q.type !== 'daily');
                }
                if (weeklyResetNeeded) {
                  playerQuests = playerQuests.filter(q => q.type !== 'weekly');
                }

                playerQuests = playerQuests.filter(q => {
                  if (q.type !== 'event') return true;
                  if (q.endDate && now > q.endDate) return false;
                  return true;
                });

                const currentLang = useLanguageStore.getState().language;

                for (const t of templates) {
                  if (t.startDate && now < t.startDate) continue;
                  if (t.endDate && now > t.endDate) continue;

                  const existingIdx = playerQuests.findIndex(q => q.id === t.id);
                  if (existingIdx !== -1) {
                    const eq = playerQuests[existingIdx];
                    eq.type = t.type; // Explicitly update type
                    eq.title = currentLang === 'vi' ? t.titleVi : t.titleEn;
                    eq.description = currentLang === 'vi' ? t.descriptionVi : t.descriptionEn;
                    eq.targetCount = t.targetCount;
                    eq.rewardGold = t.rewardGold;
                    eq.rewardDiamonds = t.rewardDiamonds;
                    eq.startDate = t.startDate;
                    eq.endDate = t.endDate;
                    eq.completed = eq.currentCount >= t.targetCount;
                  } else {
                    playerQuests.push({
                      id: t.id,
                      type: t.type,
                      title: currentLang === 'vi' ? t.titleVi : t.titleEn,
                      description: currentLang === 'vi' ? t.descriptionVi : t.descriptionEn,
                      targetType: t.targetType,
                      targetCount: t.targetCount,
                      currentCount: 0,
                      rewardGold: t.rewardGold,
                      rewardDiamonds: t.rewardDiamonds,
                      completed: false,
                      claimed: false,
                      startDate: t.startDate,
                      endDate: t.endDate
                    });
                  }
                }

                data.quests = playerQuests;
                data.lastDailyResetAt = dailyResetNeeded ? now : lastDaily;
                data.lastWeeklyResetAt = weeklyResetNeeded ? now : lastWeekly;

                await dbService.saveGame(data);
              } catch (questErr) {
                console.error("Failed to sync quests on load:", questErr);
              }
            }
            set({
              user: sessionUser,
              saveData: data,
              heroHp: (data && data.hero) ? (data.hero.currentHp ?? 100) : 100,
              heroMaxHp: (data && data.hero && data.hero.currentStats) ? (data.hero.currentStats.maxHp ?? 100) : 100,
              isLoading: false
            });
            get().addLogMessage(tStore('log_welcome', { email: sessionUser.email }), 'system');
          } catch (err) {
            console.error('Error loading game save:', err);
            set({ user: sessionUser, isLoading: false });
          }
        } else {
          set({ user: null, saveData: null, isLoading: false });
        }
      });
      return unsubscribe;
    },

    signIn: async (email: string, pass: string) => {
      set({ isLoading: true });
      try {
        await authService.signIn(email, pass);
      } catch (err: any) {
        set({ isLoading: false });
        throw err;
      }
    },

    signUp: async (email: string, pass: string) => {
      set({ isLoading: true });
      try {
        await authService.createUser(email, pass);
      } catch (err: any) {
        set({ isLoading: false });
        throw err;
      }
    },

    signOut: async () => {
      set({ isLoading: true });
      try {
        await authService.signOut();
        set({ user: null, saveData: null, isLoading: false, combatLogs: [] });
      } catch (err) {
        set({ isLoading: false });
        throw err;
      }
    },

    saveGame: async () => {
      const { saveData } = get();
      if (saveData) {
        await autoSave({
          ...saveData,
          lastSavedAt: Date.now()
        });
      }
    },

    setActiveTab: (tab) => set({ activeTab: tab }),

    setActiveInspectItemId: (itemId) => set({ activeInspectItemId: itemId }),

    syncBattleStats: (heroHp, monsterHp, maxHeroHp, maxMonsterHp, heroRage, monsterRage, potionCd) => {
      const updates: any = { heroHp, monsterHp, heroMaxHp: maxHeroHp, monsterMaxHp: maxMonsterHp, heroRage, monsterRage };
      if (potionCd !== undefined) {
        updates.potionCooldownRemaining = potionCd;
      }
      set(updates);
    },

    onMonsterDefeated: (expGained, goldGained, diamondsGained, itemsDropped, monsterId, _isMutated, durationMs) => {
      const { saveData } = get();
      if (!saveData) return;

      const hero = { ...saveData.hero };
      let newInventory = [...saveData.inventory];
      let quests = [...saveData.quests];
      const monsterResearch = { ...(saveData.monsterResearch || {}) };

      // Update monster research if monsterId is provided
      if (monsterId) {
        const cleanMonsterId = monsterId.replace(/_\d+$/, '');
        const currentRes = monsterResearch[cleanMonsterId] || { level: 1, exp: 0, kills: 0 };
        const nextKills = currentRes.kills + 1;
        let nextExp = currentRes.exp + 10; // 10 exp per kill
        let nextLevel = currentRes.level;

        // Level up exp curve for research (level * 100)
        const expNeeded = nextLevel * 100;
        if (nextExp >= expNeeded && nextLevel < 50) {
          nextExp -= expNeeded;
          nextLevel += 1;
          get().addLogMessage(`📚 NGHIÊN CỨU: Nghiên cứu của bạn về [${cleanMonsterId.replace('s_', '').replace('g_', '').replace('u_', '').replace('e_', '').replace('d_', '').replace('_', ' ').toUpperCase()}] đã đạt Cấp ${nextLevel}!`, 'system');
        }

        // Check boss record memories
        const species = MONSTER_SPECIES_DATABASE.find(s => s.id === cleanMonsterId);
        let firstKillTime = currentRes.firstKillTime;
        let fastestKillMs = currentRes.fastestKillMs;
        let highestDamage = currentRes.highestDamage;

        if (species && (species.category === 'boss' || species.category === 'king' || species.category === 'extinct')) {
          if (!firstKillTime) {
            firstKillTime = Date.now();
            get().addLogMessage(`🏆 CHIẾN TÍCH: Tiêu diệt Boss [${species.nameVi}] lần đầu tiên!`, 'loot');
          }
          if (durationMs !== undefined) {
            if (fastestKillMs === undefined || durationMs < fastestKillMs) {
              fastestKillMs = durationMs;
              get().addLogMessage(`⏱️ KỶ LỤC TỐC ĐỘ: Hạ gục [${species.nameVi}] trong ${Math.round(durationMs / 10) / 100} giây!`, 'system');
            }
          }
          const estimatedHit = Math.round(hero.currentStats.attack * (hero.currentStats.critRate > 0 ? hero.currentStats.critDamage : 1.0));
          highestDamage = Math.max(highestDamage || 0, estimatedHit);
        }

        const researchUpdate: any = {
          level: nextLevel,
          exp: nextExp,
          kills: nextKills
        };
        if (firstKillTime !== undefined) researchUpdate.firstKillTime = firstKillTime;
        if (fastestKillMs !== undefined) researchUpdate.fastestKillMs = fastestKillMs;
        if (highestDamage !== undefined) researchUpdate.highestDamage = highestDamage;

        monsterResearch[cleanMonsterId] = researchUpdate;
      }

      // Track item kills & evolution milestones
      newInventory = newInventory.map(item => {
        if (item.equipped) {
          const currentKills = item.kills || 0;
          const nextKills = currentKills + 1; // 1 kill per wave monster
          
          if (currentKills < 10000 && nextKills >= 10000) {
            get().addLogMessage(tStore('log_item_evolved', { name: item.name, stage: 'Veteran' }), 'system');
          } else if (currentKills < 100000 && nextKills >= 100000) {
            get().addLogMessage(tStore('log_item_evolved', { name: item.name, stage: 'Ancient' }), 'system');
          }
          return { ...item, kills: nextKills };
        }
        return item;
      });

      // Calculate Gold Bonus multiplier from equipped gear (Lucky affix + Topaz gems) + traits
      let goldBonus = 0;
      const equipped = newInventory.filter(i => i.equipped && i.isIdentified !== false);
      equipped.forEach(item => {
        if (item.sockets) {
          item.sockets.forEach(gem => {
            if (gem === 'topaz') goldBonus += 0.15; // Topaz gives +15% Gold
          });
        }
        if (item.affixes) {
          item.affixes.forEach(affix => {
            if (affix.stats && affix.stats.goldBonus) {
              goldBonus += affix.stats.goldBonus;
            }
          });
        }
      });

      if (hero.traits) {
        let traitGoldBonus = 0;
        let goldCount = 0;
        hero.traits.forEach(t => {
          if (t && t.stat === 'gold') {
            traitGoldBonus += t.value / 100;
            goldCount++;
          }
        });
        
        let synergyGold = 0;
        if (goldCount >= 5) synergyGold = 1.5;
        else if (goldCount >= 3) synergyGold = 0.5;
        
        goldBonus += traitGoldBonus + synergyGold;
      }

      const finalGoldGained = Math.round(goldGained * (1 + goldBonus));

      // Update gold, diamonds, exp
      hero.gold += finalGoldGained;
      hero.diamonds += diamondsGained;
      hero.exp += expGained;

      // Handle level up logic
      let levelUps = 0;
      while (hero.exp >= hero.maxExp) {
        hero.exp -= hero.maxExp;
        hero.level += 1;
        hero.maxExp = calculateLevelUpExp(hero.level);
        levelUps++;
      }

      if (levelUps > 0) {
        get().addLogMessage(tStore('log_level_up', { level: hero.level }), 'system');
        // Recalculate stats
        const equippedNow = newInventory.filter(i => i.equipped);
        hero.currentStats = recalculateHeroStats(hero.level, hero.prestigePoints, equippedNow, hero.heroClass, hero.shardUpgrades, hero.goldUpgrades, hero.traits);
        hero.currentHp = hero.currentStats.maxHp;
        
        // Audit Level Up quests
        quests = checkQuests(quests, 'reach_level', 0, hero.level);
      }

      // Add dropped items to inventory if there is space (limit: 50 items)
      for (const item of itemsDropped) {
        const isCommonAuto = item.rarity === 'common' && (hero.autoDismantleCommon ?? false);
        const isUncommonAuto = item.rarity === 'uncommon' && (hero.autoDismantleUncommon ?? false);
        const isRareAuto = item.rarity === 'rare' && (hero.autoDismantleRare ?? false);

        if (isCommonAuto || isUncommonAuto || isRareAuto) {
          const rewardShards = calculateDismantleRewards(item);
          hero.aetherShards = (hero.aetherShards || 0) + rewardShards;
          get().addLogMessage(
            useLanguageStore.getState().language === 'vi'
              ? `♻️ TỰ PHÂN RÃ: Nhặt [${item.name}] phẩm chất ${item.rarity === 'common' ? 'Thường' : item.rarity === 'uncommon' ? 'Tốt' : 'Hiếm'} -> Tự động phân rã nhận +${rewardShards} Mảnh Aether!`
              : `♻️ AUTO-DISMANTLE: Looted [${item.name}] (${item.rarity.toUpperCase()}) -> Auto-dismantled for +${rewardShards} Aether Shards!`,
            'loot'
          );
        } else {
          if (newInventory.length < 50) {
            newInventory.push(item);
          } else {
            get().addLogMessage(tStore('log_inventory_full', { name: item.name }), 'system');
          }
        }
      }

      // Audit Defeat Monster and Earn Gold quests
      quests = checkQuests(quests, 'defeat_monster', 1);
      quests = checkQuests(quests, 'earn_gold', finalGoldGained);

      const isGuildBoss = get().battleMode === 'guild_boss';
      let nextStage = saveData.activeStage;
      let stagesCleared = saveData.stagesCleared;
      let nextWave = saveData.currentWave || 1;

      if (!isGuildBoss) {
        if (nextWave < 19) {
          nextWave += 1;
        } else if (nextWave === 19) {
          nextWave = 20; // Stage Boss Wave reached automatically
        } else if (nextWave === 20) {
          // Stage Boss wave cleared -> Advance stage!
          nextStage = saveData.activeStage + 1;
          nextWave = 1;
          stagesCleared = Math.max(saveData.stagesCleared, saveData.activeStage);
          get().addLogMessage(`🎉 VƯỢT ẢI THÀNH CÔNG: Chúc mừng! Bạn đã hoàn thành Ải ${saveData.activeStage} và bước sang Ải ${nextStage}!`, 'system');
        }
      }

      // Save updated state
      const updatedSave: GameSaveData = {
        ...saveData,
        activeStage: nextStage,
        currentWave: nextWave,
        autoAdvance: true,
        stagesCleared,
        hero,
        inventory: newInventory,
        quests,
        monsterResearch,
        lastSavedAt: Date.now()
      };

      autoSave(updatedSave);
    },

    onStageChange: (newStage) => {
      const { saveData } = get();
      if (!saveData) return;

      const updatedSave: GameSaveData = {
        ...saveData,
        activeStage: newStage,
        stagesCleared: Math.max(saveData.stagesCleared, newStage - 1),
        lastSavedAt: Date.now()
      };

      autoSave(updatedSave);
    },

    toggleAutoAdvance: () => {
      const { saveData } = get();
      if (!saveData) return;
      const nextAuto = saveData.autoAdvance === false; // toggle
      const updatedSave: GameSaveData = {
        ...saveData,
        autoAdvance: nextAuto
      };
      set({ saveData: updatedSave });
      autoSave(updatedSave);

      get().addLogMessage(
        nextAuto ? "⚔️ Chế độ: CÀY ẢI (Tự động vượt ải)" : "🌾 Chế độ: TREO FARM (Lặp lại wave cày cấp & vàng)",
        'system'
      );
    },

    challengeBoss: () => {
      const { saveData, engineInstance } = get();
      if (!saveData || !engineInstance) return;

      if ((saveData.currentWave || 1) < 19) return;

      // Force currentWave to 20 (Boss wave) and challenge Boss immediately
      const updatedSave: GameSaveData = {
        ...saveData,
        currentWave: 20
      };
      set({ saveData: updatedSave });
      autoSave(updatedSave);

      const hero = updatedSave.hero;
      const monster = generateMonsterForStage(updatedSave.activeStage, hero.level, updatedSave.monsterResearch, 20);
      engineInstance.startBattle(monster, 20);

      get().addLogMessage(`⚔️ KHIÊU CHIẾN: Đang khiêu chiến Boss Ải ${updatedSave.activeStage}!`, 'system');
    },

    startNextBattle: () => {
      const { saveData, engineInstance } = get();
      if (!saveData || !engineInstance) return;

      const hero = saveData.hero;
      const monster = generateMonsterForStage(saveData.activeStage, hero.level, saveData.monsterResearch, saveData.currentWave || 1);
      engineInstance.startBattle(monster, saveData.currentWave || 1);
    },

    upgradeEquipment: (itemId) => {
      const { saveData } = get();
      if (!saveData) return;

      const inventory = saveData.inventory.map(item => {
        if (item.id !== itemId) return item;

        // Block corrupted items from upgrade
        if (item.isCorrupted) {
          get().addLogMessage(tStore('corrupted_upgrade_error', { name: item.name }), 'system');
          return item;
        }

        // Upgrade item
        if (saveData.hero.gold < item.upgradeCost) {
          get().addLogMessage(tStore('insufficient_gold') + ` ${item.name}`, 'system');
          return item;
        }

        const nextLevel = item.level + 1;
        const deductedGold = saveData.hero.gold - item.upgradeCost;
        
        // Deduct gold in state
        saveData.hero.gold = deductedGold;

        const standardStats = calculateItemStats(item.slot, item.rarity, nextLevel);
        const updatedStats = scaleStatsByQuality(standardStats, item.quality || 100);
        const nextUpgradeCost = calculateUpgradeCost(item.slot, item.rarity, nextLevel);

        get().addLogMessage(tStore('log_upgraded_item', { name: item.name, level: nextLevel }), 'system');

        return {
          ...item,
          level: nextLevel,
          stats: updatedStats,
          upgradeCost: nextUpgradeCost
        };
      });

      // Recalculate Hero stats in case item is equipped
      const equipped = inventory.filter(i => i.equipped);
      const hero = { ...saveData.hero };
      hero.currentStats = recalculateHeroStats(hero.level, hero.prestigePoints, equipped, hero.heroClass, hero.shardUpgrades, hero.goldUpgrades, hero.traits);
      hero.currentHp = get().battleMode === 'guild_boss' ? hero.currentHp : Math.min(hero.currentStats.maxHp, get().heroHp);

      // Audit upgrade equipment quests
      const quests = checkQuests(saveData.quests, 'upgrade_equipment', 1);

      const updatedSave: GameSaveData = {
        ...saveData,
        hero,
        inventory,
        quests,
        lastSavedAt: Date.now()
      };

      autoSave(updatedSave);
    },

    equipEquipment: (itemId) => {
      const { saveData } = get();
      if (!saveData) return;

      const itemToEquip = saveData.inventory.find(i => i.id === itemId);
      if (!itemToEquip) return;

      // Check class restrictions
      if (itemToEquip.allowedClass && saveData.hero.heroClass && itemToEquip.allowedClass !== saveData.hero.heroClass) {
        const className = itemToEquip.allowedClass === 'knight' 
          ? tStore('class_knight') 
          : itemToEquip.allowedClass === 'mage' 
            ? tStore('class_mage') 
            : tStore('class_assassin');
        get().addLogMessage(tStore('class_restriction_error', { class: className }), 'system');
        return;
      }

      const slot = itemToEquip.slot;

      const inventory = saveData.inventory.map(item => {
        // Unequip items in same slot
        if (item.slot === slot && item.equipped) {
          return { ...item, equipped: false };
        }
        // Equip target item
        if (item.id === itemId) {
          return { ...item, equipped: true };
        }
        return item;
      });

      // Recalculate stats
      const equipped = inventory.filter(i => i.equipped);
      const hero = { ...saveData.hero };
      hero.currentStats = recalculateHeroStats(hero.level, hero.prestigePoints, equipped, hero.heroClass, hero.shardUpgrades, hero.goldUpgrades, hero.traits);
      hero.currentHp = hero.currentStats.maxHp; // Refill HP on equip change

      get().addLogMessage(tStore('log_equipped_item', { name: itemToEquip.name }), 'system');

      const updatedSave: GameSaveData = {
        ...saveData,
        hero,
        inventory,
        lastSavedAt: Date.now()
      };

      autoSave(updatedSave);
    },

    unequipEquipment: (itemId) => {
      const { saveData } = get();
      if (!saveData) return;

      const inventory = saveData.inventory.map(item => {
        if (item.id === itemId) {
          return { ...item, equipped: false };
        }
        return item;
      });

      // Recalculate stats
      const equipped = inventory.filter(i => i.equipped);
      const hero = { ...saveData.hero };
      hero.currentStats = recalculateHeroStats(hero.level, hero.prestigePoints, equipped, hero.heroClass, hero.shardUpgrades, hero.goldUpgrades, hero.traits);
      hero.currentHp = Math.min(hero.currentHp, hero.currentStats.maxHp);

      const item = saveData.inventory.find(i => i.id === itemId);
      if (item) get().addLogMessage(tStore('log_unequipped_item', { name: item.name }), 'system');

      const updatedSave: GameSaveData = {
        ...saveData,
        hero,
        inventory,
        lastSavedAt: Date.now()
      };

      autoSave(updatedSave);
    },

    dismantleEquipment: (itemId) => {
      const { saveData } = get();
      if (!saveData) return;

      const item = saveData.inventory.find(i => i.id === itemId);
      if (!item) return;

      if (item.equipped) {
        get().addLogMessage(tStore('equipped_label') + ` [${item.name}]`, 'system');
        return;
      }

      const rewardShards = calculateDismantleRewards(item);
      const inventory = saveData.inventory.filter(i => i.id !== itemId);
      const hero = { ...saveData.hero };
      hero.aetherShards = (hero.aetherShards || 0) + rewardShards;

      get().addLogMessage(`♻️ PHÂN RÃ: Phân rã [${item.name}] nhận được +${rewardShards} Mảnh Aether!`, 'loot');

      const updatedSave: GameSaveData = {
        ...saveData,
        hero,
        inventory,
        lastSavedAt: Date.now()
      };

      autoSave(updatedSave);
    },

    dismantleMultipleEquipment: (itemIds) => {
      const { saveData } = get();
      if (!saveData) return;

      let totalShardsEarned = 0;
      const itemsToDismantle = saveData.inventory.filter(i => itemIds.includes(i.id) && !i.equipped);
      if (itemsToDismantle.length === 0) return;

      itemsToDismantle.forEach(item => {
        totalShardsEarned += calculateDismantleRewards(item);
      });

      const inventory = saveData.inventory.filter(i => !itemsToDismantle.some(d => d.id === i.id));
      const hero = { ...saveData.hero };
      hero.aetherShards = (hero.aetherShards || 0) + totalShardsEarned;

      get().addLogMessage(`♻️ PHÂN RÃ: Phân rã hàng loạt ${itemsToDismantle.length} vật phẩm, nhận được +${totalShardsEarned} Mảnh Aether!`, 'loot');

      const updatedSave: GameSaveData = {
        ...saveData,
        hero,
        inventory,
        lastSavedAt: Date.now()
      };

      autoSave(updatedSave);
    },

    buyShardUpgrade: (stat) => {
      const { saveData } = get();
      if (!saveData) return;

      const hero = { ...saveData.hero };
      if (!hero.shardUpgrades) {
        hero.shardUpgrades = { attack: 0, magicAttack: 0, maxHp: 0 };
      }

      const currentLvl = hero.shardUpgrades[stat] || 0;
      const cost = 50 * (currentLvl + 1);

      if ((hero.aetherShards || 0) < cost) {
        get().addLogMessage(`❌ KHÔNG ĐỦ MẢNH AETHER: Cần ${cost} Mảnh Aether để nâng cấp!`, 'system');
        return;
      }

      hero.aetherShards = (hero.aetherShards || 0) - cost;
      hero.shardUpgrades[stat] = currentLvl + 1;

      // Recalculate stats
      const equipped = saveData.inventory.filter(i => i.equipped);
      hero.currentStats = recalculateHeroStats(hero.level, hero.prestigePoints, equipped, hero.heroClass, hero.shardUpgrades, hero.goldUpgrades, hero.traits);
      hero.currentHp = hero.currentStats.maxHp; // Heal to full

      const statName = stat === 'attack' ? 'Công Vật Lý' : stat === 'magicAttack' ? 'Công Phép Thuật' : 'HP Tối Đa';
      get().addLogMessage(`🌟 NÂNG CẤP AETHER: Nâng cấp thành công ${statName} lên Cấp ${currentLvl + 1}!`, 'system');
      get().showToast(
        useLanguageStore.getState().language === 'vi'
          ? `🎉 Nâng cấp thành công ${statName} lên Cấp ${currentLvl + 1}!`
          : `🎉 Successfully upgraded ${statName === 'Công Vật Lý' ? 'Physical Attack' : statName === 'Công Phép Thuật' ? 'Magic Attack' : 'Max HP'} to Lv ${currentLvl + 1}!`
      );

      // Update Pixi engine if running
      if (get().engineInstance) {
        get().engineInstance.updateState(hero.level, hero.prestigePoints, equipped, saveData.activeStage, hero.heroClass, hero.name || 'Hero', useLanguageStore.getState().language, hero.shardUpgrades, hero.potions, hero.autoUsePotion, hero.autoBuyPotions, hero.gold, hero.goldUpgrades, hero.traits);
      }

      const updatedSave: GameSaveData = {
        ...saveData,
        hero,
        lastSavedAt: Date.now()
      };

      autoSave(updatedSave);
    },

    buyGoldUpgrade: (stat) => {
      const { saveData } = get();
      if (!saveData) return;

      const hero = { ...saveData.hero };
      if (!hero.goldUpgrades) {
        hero.goldUpgrades = { attack: 0, hp: 0, hpRecovery: 0, critDamage: 0 };
      }

      const currentLvl = hero.goldUpgrades[stat] || 0;

      if (currentLvl >= hero.level) {
        get().addLogMessage(
          useLanguageStore.getState().language === 'vi'
            ? `❌ GIỚI HẠN CẤP ĐỘ: Cấp cường hóa không được vượt quá cấp anh hùng (Cấp ${hero.level})!`
            : `❌ LEVEL LIMIT: Enhancement level cannot exceed hero level (Lv.${hero.level})!`,
          'system'
        );
        return;
      }

      const cost = calculateGoldUpgradeCost(stat, currentLvl);

      if (hero.gold < cost) {
        get().addLogMessage(
          useLanguageStore.getState().language === 'vi'
            ? `❌ KHÔNG ĐỦ VÀNG: Cần ${cost} Vàng để nâng cấp!`
            : `❌ INSUFFICIENT GOLD: Need ${cost} Gold to upgrade!`,
          'system'
        );
        return;
      }

      hero.gold -= cost;
      hero.goldUpgrades[stat] = currentLvl + 1;

      // Recalculate stats
      const equipped = saveData.inventory.filter(i => i.equipped);
      hero.currentStats = recalculateHeroStats(hero.level, hero.prestigePoints, equipped, hero.heroClass, hero.shardUpgrades, hero.goldUpgrades, hero.traits);
      hero.currentHp = Math.min(hero.currentStats.maxHp, get().heroHp); // don't exceed new max hp

      const statName = stat === 'attack' ? 'Tấn Công' : stat === 'hp' ? 'HP' : stat === 'hpRecovery' ? 'Hồi Phục HP' : 'Sát Thương Chí Mạng';
      get().addLogMessage(
        useLanguageStore.getState().language === 'vi'
          ? `🌟 NÂNG CẤP VÀNG: Nâng cấp thành công ${statName} lên Cấp ${currentLvl + 1}!`
          : `🌟 GOLD UPGRADE: Upgraded ${stat} to Level ${currentLvl + 1}!`,
        'system'
      );

      // Update Pixi engine if running
      if (get().engineInstance) {
        get().engineInstance.updateState(
          hero.level,
          hero.prestigePoints,
          equipped,
          saveData.activeStage,
          hero.heroClass,
          hero.name || 'Hero',
          useLanguageStore.getState().language,
          hero.shardUpgrades,
          hero.potions,
          hero.autoUsePotion,
          hero.autoBuyPotions,
          hero.gold,
          hero.goldUpgrades,
          hero.traits
        );
      }

      const updatedSave: GameSaveData = {
        ...saveData,
        hero,
        lastSavedAt: Date.now()
      };

      set({ saveData: updatedSave, heroHp: hero.currentHp });
      autoSave(updatedSave);
    },

    buyAetherChest: () => {
      const { saveData } = get();
      if (!saveData) return;

      const hero = { ...saveData.hero };
      const cost = 300;

      if ((hero.aetherShards || 0) < cost) {
        get().addLogMessage(`❌ KHÔNG ĐỦ MẢNH AETHER: Cần ${cost} Mảnh Aether để đổi rương!`, 'system');
        return;
      }

      if (saveData.inventory.length >= 50) {
        get().addLogMessage(`❌ HÀNH LÝ ĐẦY: Hãy phân rã hoặc bán bớt đồ trước khi đổi rương!`, 'system');
        return;
      }

      hero.aetherShards = (hero.aetherShards || 0) - cost;

      // Generate a random Rare, Epic or Legendary equipment
      const pool = DEFAULT_ITEM_TEMPLATES.filter(t => ['rare', 'epic', 'legendary'].includes(t.rarity));
      const randTemplate = pool[Math.floor(Math.random() * pool.length)];
      const item = createItemInstance(randTemplate);
      item.isIdentified = false; // needs identification!

      const inventory = [...saveData.inventory, item];

      get().addLogMessage(`🎁 AETHER CHEST: Đổi rương thành công, nhận được [${item.name}] chưa giám định!`, 'loot');
      get().showToast(
        useLanguageStore.getState().language === 'vi'
          ? `🎁 Đổi Rương Thần Khí thành công!`
          : `🎁 Aether Chest exchanged successfully!`
      );

      const updatedSave: GameSaveData = {
        ...saveData,
        hero,
        inventory,
        lastSavedAt: Date.now()
      };

      autoSave(updatedSave);
      set({ activeSummonResult: [item] });
    },

    buyAetherDiamonds: () => {
      const { saveData } = get();
      if (!saveData) return;

      const hero = { ...saveData.hero };
      const cost = 100;

      if ((hero.aetherShards || 0) < cost) {
        get().addLogMessage(`❌ KHÔNG ĐỦ MẢNH AETHER: Cần ${cost} Mảnh Aether để đổi Kim Cương!`, 'system');
        return;
      }

      hero.aetherShards = (hero.aetherShards || 0) - cost;
      hero.diamonds += 200;

      get().addLogMessage(`💎 KIM CƯƠNG AETHER: Đổi thành công +200 Kim Cương!`, 'loot');
      get().showToast(
        useLanguageStore.getState().language === 'vi'
          ? `💎 Đổi thành công +200 Kim Cương!`
          : `💎 Exchanged +200 Diamonds successfully!`
      );

      const updatedSave: GameSaveData = {
        ...saveData,
        hero,
        lastSavedAt: Date.now()
      };

      autoSave(updatedSave);
    },

    potionCooldownRemaining: 0,
    setPotionCooldownRemaining: (sec) => set({ potionCooldownRemaining: sec }),
    
    onPotionUsedByEngine: (_amount, didAutoBuy) => {
      set(state => {
        if (state.saveData) {
          const hero = state.saveData.hero;
          let nextPotions = hero.potions ?? 5;
          let nextGold = hero.gold;

          if (didAutoBuy) {
            // Deduct 200 gold and keep potions count net unchanged
            nextGold = Math.max(0, nextGold - 200);
            
            // Log auto-buy message safely
            setTimeout(() => {
              get().addLogMessage(
                useLanguageStore.getState().language === 'vi'
                  ? `💸 TỰ MUA MÁU: Hết bình HP, tự động mua 1 bình bằng 200 Vàng và sử dụng!`
                  : `💸 AUTO-BUY HP: Out of potions, auto-purchased 1 for 200 Gold and consumed!`,
                'system'
              );
            }, 10);
          } else {
            nextPotions = Math.max(0, nextPotions - 1);
          }

          const nextSave = {
            ...state.saveData,
            hero: {
              ...hero,
              potions: nextPotions,
              gold: nextGold
            }
          };
          dbService.saveGame(nextSave).catch(err => console.error("Save error:", err));
          return { saveData: nextSave, potionCooldownRemaining: 15 };
        }
        return {};
      });
    },

    usePotion: () => {
      const state = get();
      if (!state.saveData) return;
      
      const hero = state.saveData.hero;
      const currentPotions = hero.potions ?? 5;
      
      if (currentPotions <= 0) {
        state.addLogMessage(useLanguageStore.getState().language === 'vi' ? '❌ Hết bình máu! Hãy mua thêm ở Cửa Hàng.' : '❌ Out of health potions! Purchase more in the Shop.', 'system');
        return;
      }
      
      if (state.potionCooldownRemaining > 0) {
        state.addLogMessage(useLanguageStore.getState().language === 'vi' ? '⏳ Bình máu đang hồi chiêu!' : '⏳ Health potion is on cooldown!', 'system');
        return;
      }
      
      const maxHp = hero.currentStats.maxHp;
      if (hero.currentHp >= maxHp) {
        state.addLogMessage(useLanguageStore.getState().language === 'vi' ? '💖 Máu đã đầy, không cần sử dụng!' : '💖 Health is already full!', 'system');
        return;
      }

      const healAmount = Math.round(maxHp * 0.3);
      const nextHp = Math.min(maxHp, hero.currentHp + healAmount);
      
      const nextSave = {
        ...state.saveData,
        hero: {
          ...hero,
          currentHp: nextHp,
          potions: currentPotions - 1
        }
      };

      set({
        saveData: nextSave,
        heroHp: nextHp,
        potionCooldownRemaining: 15
      });

      dbService.saveGame(nextSave).catch(err => console.error("Save error:", err));
      
      if (state.engineInstance) {
        state.engineInstance.healHero(healAmount);
      }
    },

    buyPotion: (quantity: number, currency: 'gold' | 'diamonds') => {
      const state = get();
      if (!state.saveData) return;
      
      const hero = state.saveData.hero;
      let cost = 0;
      
      if (currency === 'gold') {
        if (quantity === 1) cost = 200;
        else if (quantity === 5) cost = 900;
        else cost = quantity * 180;
        
        if (hero.gold < cost) {
          state.addLogMessage(useLanguageStore.getState().language === 'vi' ? '❌ Không đủ Vàng!' : '❌ Insufficient Gold!', 'system');
          return;
        }
      } else {
        if (quantity === 10) cost = 15;
        else if (quantity === 30) cost = 40;
        else cost = Math.ceil(quantity * 1.5);
        
        if (hero.diamonds < cost) {
          state.addLogMessage(useLanguageStore.getState().language === 'vi' ? '❌ Không đủ Kim Cương!' : '❌ Insufficient Diamonds!', 'system');
          return;
        }
      }
      
      const nextSave = {
        ...state.saveData,
        hero: {
          ...hero,
          gold: currency === 'gold' ? hero.gold - cost : hero.gold,
          diamonds: currency === 'diamonds' ? hero.diamonds - cost : hero.diamonds,
          potions: (hero.potions ?? 5) + quantity
        }
      };
      
      autoSave(nextSave);
      state.addLogMessage(
        useLanguageStore.getState().language === 'vi' 
          ? `🧪 Đã mua +${quantity} Bình Máu (-${cost} ${currency === 'gold' ? 'Vàng' : 'Kim Cương'})` 
          : `🧪 Purchased +${quantity} Health Potions (-${cost} ${currency === 'gold' ? 'Gold' : 'Diamonds'})`,
        'system'
      );
      state.showToast(
        useLanguageStore.getState().language === 'vi'
          ? `🎉 Đã mua thành công +${quantity} Bình HP!`
          : `🎉 Purchased +${quantity} Health Potions!`
      );
    },

    toggleAutoUsePotion: () => {
      const state = get();
      if (!state.saveData) return;
      
      const hero = state.saveData.hero;
      const nextVal = !(hero.autoUsePotion ?? false);
      
      const nextSave = {
        ...state.saveData,
        hero: {
          ...hero,
          autoUsePotion: nextVal
        }
      };
      
      set({ saveData: nextSave });
      dbService.saveGame(nextSave).catch(err => console.error("Save error:", err));
      
      state.addLogMessage(
        useLanguageStore.getState().language === 'vi'
          ? `🧪 Đã ${nextVal ? 'BẬT' : 'TẮT'} tự động dùng Bình Máu (HP < 35%).`
          : `🧪 ${nextVal ? 'ENABLED' : 'DISABLED'} auto-use Health Potion (HP < 35%).`,
        'system'
      );
    },

    toggleAutoDismantleCommon: () => {
      const state = get();
      if (!state.saveData) return;

      const hero = state.saveData.hero;
      const nextVal = !(hero.autoDismantleCommon ?? false);

      const nextSave = {
        ...state.saveData,
        hero: {
          ...hero,
          autoDismantleCommon: nextVal
        }
      };

      set({ saveData: nextSave });
      dbService.saveGame(nextSave).catch(err => console.error("Save error:", err));
      
      state.addLogMessage(
        useLanguageStore.getState().language === 'vi'
          ? `♻️ Đã ${nextVal ? 'BẬT' : 'TẮT'} tự động phân rã Trang bị Thường.`
          : `♻️ ${nextVal ? 'ENABLED' : 'DISABLED'} auto-dismantle Common equipment.`,
        'system'
      );
    },

    toggleAutoDismantleUncommon: () => {
      const state = get();
      if (!state.saveData) return;

      const hero = state.saveData.hero;
      const nextVal = !(hero.autoDismantleUncommon ?? false);

      const nextSave = {
        ...state.saveData,
        hero: {
          ...hero,
          autoDismantleUncommon: nextVal
        }
      };

      set({ saveData: nextSave });
      dbService.saveGame(nextSave).catch(err => console.error("Save error:", err));
      
      state.addLogMessage(
        useLanguageStore.getState().language === 'vi'
          ? `♻️ Đã ${nextVal ? 'BẬT' : 'TẮT'} tự động phân rã Trang bị Tốt.`
          : `♻️ ${nextVal ? 'ENABLED' : 'DISABLED'} auto-dismantle Uncommon equipment.`,
        'system'
      );
    },

    toggleAutoDismantleRare: () => {
      const state = get();
      if (!state.saveData) return;

      const hero = state.saveData.hero;
      const nextVal = !(hero.autoDismantleRare ?? false);

      const nextSave = {
        ...state.saveData,
        hero: {
          ...hero,
          autoDismantleRare: nextVal
        }
      };

      set({ saveData: nextSave });
      dbService.saveGame(nextSave).catch(err => console.error("Save error:", err));
      
      state.addLogMessage(
        useLanguageStore.getState().language === 'vi'
          ? `♻️ Đã ${nextVal ? 'BẬT' : 'TẮT'} tự động phân rã Trang bị Hiếm.`
          : `♻️ ${nextVal ? 'ENABLED' : 'DISABLED'} auto-dismantle Rare equipment.`,
        'system'
      );
    },

    toggleAutoBuyPotions: () => {
      const state = get();
      if (!state.saveData) return;

      const hero = state.saveData.hero;
      const nextVal = !(hero.autoBuyPotions ?? false);

      const nextSave = {
        ...state.saveData,
        hero: {
          ...hero,
          autoBuyPotions: nextVal
        }
      };

      set({ saveData: nextSave });
      dbService.saveGame(nextSave).catch(err => console.error("Save error:", err));
      
      state.addLogMessage(
        useLanguageStore.getState().language === 'vi'
          ? `💸 Đã ${nextVal ? 'BẬT' : 'TẮT'} tự động mua bình HP khi hết.`
          : `💸 ${nextVal ? 'ENABLED' : 'DISABLED'} auto-purchase HP potions when out.`,
        'system'
      );
    },

    showToast: (msg) => {
      set({ toastMessage: msg });
      const currentTimeout = (window as any)._toastTimeout;
      if (currentTimeout) clearTimeout(currentTimeout);
      (window as any)._toastTimeout = setTimeout(() => {
        set({ toastMessage: null });
      }, 2500);
    },

    setActiveSummonResult: (items) => set({ activeSummonResult: items }),

    claimQuestReward: (questId) => {
      const { saveData } = get();
      if (!saveData) return;

      const quest = saveData.quests.find(q => q.id === questId);
      if (!quest || !quest.completed || quest.claimed) return;

      const quests = saveData.quests.map(q => {
        if (q.id === questId) {
          return { ...q, claimed: true, claimedAt: Date.now() };
        }
        return q;
      });

      const hero = { ...saveData.hero };
      hero.gold += quest.rewardGold;
      hero.diamonds += quest.rewardDiamonds;

      get().addLogMessage(tStore('log_claimed_quest', { title: quest.title, gold: quest.rewardGold, diamonds: quest.rewardDiamonds }), 'system');

      const updatedSave: GameSaveData = {
        ...saveData,
        hero,
        quests,
        lastSavedAt: Date.now()
      };

      autoSave(updatedSave);
    },

    buyGoldPack: () => {
      const { saveData } = get();
      if (!saveData) return;

      const cost = 15; // 15 diamonds
      if (saveData.hero.diamonds < cost) {
        get().addLogMessage(tStore('insufficient_diamonds'), 'system');
        return;
      }

      const goldGained = 800 * saveData.activeStage;
      const hero = { ...saveData.hero };
      hero.diamonds -= cost;
      hero.gold += goldGained;

      get().addLogMessage(tStore('log_bought_gold', { cost, gold: goldGained }), 'loot');
      get().showToast(
        useLanguageStore.getState().language === 'vi'
          ? `🎉 Mua thành công +${goldGained.toLocaleString()} Vàng!`
          : `🎉 Purchased +${goldGained.toLocaleString()} Gold!`
      );

      // Audit gold quests
      const quests = checkQuests(saveData.quests, 'earn_gold', goldGained);

      const updatedSave: GameSaveData = {
        ...saveData,
        hero,
        quests,
        lastSavedAt: Date.now()
      };

      autoSave(updatedSave);
    },

    summonEquipment: () => {
      const { saveData } = get();
      if (!saveData) return;

      const cost = 10; // 10 diamonds
      if (saveData.hero.diamonds < cost) {
        get().addLogMessage(tStore('insufficient_diamonds'), 'system');
        return;
      }

      if (saveData.inventory.length >= 50) {
        get().addLogMessage(tStore('summon_inventory_warning'), 'system');
        return;
      }

      // Rarity chances: common 45%, uncommon 30%, rare 18%, epic 6%, legendary 1%
      const rand = Math.random();
      let rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' = 'common';
      if (rand < 0.01) rarity = 'legendary';
      else if (rand < 0.07) rarity = 'epic';
      else if (rand < 0.25) rarity = 'rare';
      else if (rand < 0.55) rarity = 'uncommon';

      const eligibleTemplates = DEFAULT_ITEM_TEMPLATES.filter(t => t.rarity === rarity);
      const template = eligibleTemplates[Math.floor(Math.random() * eligibleTemplates.length)];

      const itemLvl = Math.max(1, Math.floor(saveData.activeStage / 6));
      const newItem = createItemInstance(template, itemLvl);

      const hero = { ...saveData.hero };
      hero.diamonds -= cost;

      const inventory = [...saveData.inventory, newItem];

      get().addLogMessage(tStore('log_summon_success', { name: newItem.name, rarity: newItem.rarity.toUpperCase() }), 'loot');
      get().showToast(
        useLanguageStore.getState().language === 'vi'
          ? `🎁 Triệu hồi thành công [${newItem.name}]!`
          : `🎁 Summoned [${newItem.name}]!`
      );

      const updatedSave: GameSaveData = {
        ...saveData,
        hero,
        inventory,
        lastSavedAt: Date.now()
      };

      autoSave(updatedSave);
      set({ activeSummonResult: [newItem] });
    },

    summonTenEquipment: () => {
      const { saveData } = get();
      if (!saveData) return;

      const hero = { ...saveData.hero };
      const cost = 90;

      if (hero.diamonds < cost) {
        get().addLogMessage(tStore('insufficient_diamonds'), 'system');
        return;
      }

      const spaceLeft = 50 - saveData.inventory.length;
      if (spaceLeft < 10) {
        get().addLogMessage(useLanguageStore.getState().language === 'vi' ? `❌ Hành lý đầy! Cần ít nhất 10 ô trống để triệu hồi 10x (còn trống: ${spaceLeft} ô).` : `❌ Inventory full! Need at least 10 empty slots for 10x summon (empty: ${spaceLeft}).`, 'system');
        return;
      }

      const rollRarity = (): 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' => {
        const rand = Math.random();
        if (rand < 0.012) return 'legendary';
        if (rand < 0.07) return 'epic';
        if (rand < 0.25) return 'rare';
        if (rand < 0.55) return 'uncommon';
        return 'common';
      };

      const newItems: EquipmentItem[] = [];
      const counts = { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 };

      for (let i = 0; i < 10; i++) {
        const rarity = rollRarity();
        counts[rarity]++;
        const eligibleTemplates = DEFAULT_ITEM_TEMPLATES.filter(t => t.rarity === rarity);
        const template = eligibleTemplates[Math.floor(Math.random() * eligibleTemplates.length)];
        
        const itemLvl = Math.max(1, Math.floor(saveData.activeStage / 6));
        const newItem = createItemInstance(template, itemLvl);
        newItems.push(newItem);
      }

      hero.diamonds -= cost;
      const inventory = [...saveData.inventory, ...newItems];

      const summary = useLanguageStore.getState().language === 'vi'
        ? `🎁 TRIỆU HỒI 10X: Nhận thành công ${counts.legendary} Huyền Thoại, ${counts.epic} Sử Thi, ${counts.rare} Hiếm, ${counts.uncommon} Tốt, ${counts.common} Thường!`
        : `🎁 10X SUMMON: Received ${counts.legendary} Legendary, ${counts.epic} Epic, ${counts.rare} Rare, ${counts.uncommon} Uncommon, ${counts.common} Common!`;
        
      get().addLogMessage(summary, 'loot');

      const updatedSave: GameSaveData = {
        ...saveData,
        hero,
        inventory,
        lastSavedAt: Date.now()
      };

      autoSave(updatedSave);
      set({ activeSummonResult: newItems });
      get().showToast(
        useLanguageStore.getState().language === 'vi'
          ? '🎁 Triệu hồi x10 thành công!'
          : '🎁 Summoned 10x successfully!'
      );
    },

    triggerPrestige: () => {
      const { saveData } = get();
      if (!saveData) return;

      const pointsEarned = calculatePrestigePoints(saveData.stagesCleared);
      if (pointsEarned <= 0) {
        get().addLogMessage(tStore('ascension_locked'), 'system');
        return;
      }

      const hero = { ...saveData.hero };
      hero.level = 1;
      hero.exp = 0;
      hero.maxExp = calculateLevelUpExp(1);
      hero.gold = 500; // Reset gold to starting
      hero.prestigePoints += pointsEarned;
      hero.prestigeCount += 1;

      // Reset stage to 1
      const activeStage = 1;
      const stagesCleared = 0;

      // Keep inventory but unequip items
      const inventory = saveData.inventory.map(item => ({
        ...item,
        equipped: false
      }));

      // Recalculate stats with prestige points, no items equipped
      hero.currentStats = recalculateHeroStats(1, hero.prestigePoints, [], hero.heroClass, hero.shardUpgrades, hero.goldUpgrades, hero.traits);
      hero.currentHp = hero.currentStats.maxHp;

      // Reset Quests to starter set
      const initialSaveTemplate = generateStarterSave(saveData.userId, hero.heroClass, hero.name || 'Hero');
      const quests = initialSaveTemplate.quests;

      get().addLogMessage(tStore('log_prestige_complete', { points: pointsEarned }), 'system');

      const updatedSave: GameSaveData = {
        ...saveData,
        hero,
        inventory,
        quests,
        activeStage,
        stagesCleared,
        lastSavedAt: Date.now()
      };

      autoSave(updatedSave);
    },

    changeHeroClass: (newClass) => {
      const { saveData } = get();
      if (!saveData) return;

      const hero = { ...saveData.hero };
      hero.heroClass = newClass;
      
      // Auto-unequip items of other classes
      const inventory = saveData.inventory.map(item => {
        if (item.equipped && item.allowedClass && item.allowedClass !== newClass) {
          get().addLogMessage(tStore('log_unequipped_item', { name: item.name }), 'system');
          return { ...item, equipped: false };
        }
        return item;
      });

      const equipped = inventory.filter(i => i.equipped);
      hero.currentStats = recalculateHeroStats(hero.level, hero.prestigePoints, equipped, newClass, hero.shardUpgrades, hero.goldUpgrades, hero.traits);
      hero.currentHp = Math.min(hero.currentStats.maxHp, hero.currentHp);

      get().addLogMessage(
        tStore('log_class_changed', { class: newClass === 'knight' ? tStore('class_knight') : newClass === 'mage' ? tStore('class_mage') : tStore('class_assassin') }), 
        'system'
      );

      const updatedSave: GameSaveData = {
        ...saveData,
        hero,
        inventory,
        lastSavedAt: Date.now()
      };

      autoSave(updatedSave);
    },

    renameHero: (newName) => {
      const { saveData } = get();
      if (!saveData) return;

      const cleanedName = newName.trim().substring(0, 16);
      if (!cleanedName) return;

      const hero = { ...saveData.hero, name: cleanedName };
      const updatedSave = {
        ...saveData,
        hero,
        lastSavedAt: Date.now()
      };

      set({ saveData: updatedSave });
      autoSave(updatedSave);

      get().addLogMessage(
        useLanguageStore.getState().language === 'vi'
          ? `✏️ Đổi tên nhân vật thành công: [${cleanedName}]`
          : `✏️ Character renamed successfully: [${cleanedName}]`,
        'system'
      );
    },

    identifyEquipment: (itemId) => {
      const { saveData } = get();
      if (!saveData) return;

      const item = saveData.inventory.find(i => i.id === itemId);
      if (!item) return;

      const cost = 200; // Identify costs 200 gold
      if (saveData.hero.gold < cost) {
        get().addLogMessage(tStore('insufficient_gold') + ` (${cost} Vàng)`, 'system');
        return;
      }

      const hero = { ...saveData.hero };
      hero.gold -= cost;

      const inventory = saveData.inventory.map(i => {
        if (i.id === itemId) {
          return { ...i, isIdentified: true };
        }
        return i;
      });

      get().addLogMessage(tStore('log_identified', { name: item.name }), 'system');

      const updatedSave: GameSaveData = {
        ...saveData,
        hero,
        inventory,
        lastSavedAt: Date.now()
      };

      autoSave(updatedSave);
    },

    insertGem: (itemId, gemKey, socketIdx) => {
      const { saveData } = get();
      if (!saveData) return;

      const item = saveData.inventory.find(i => i.id === itemId);
      if (!item) return;

      if (!item.sockets || socketIdx < 0 || socketIdx >= item.sockets.length) return;

      const hero = { ...saveData.hero };
      const heroGems = { ...(hero.gems || {}) };

      // Check if player actually owns this gem
      const quantity = heroGems[gemKey] || 0;
      if (quantity < 1) {
        get().addLogMessage(
          useLanguageStore.getState().language === 'vi'
            ? '❌ KHÔNG ĐỦ NGỌC: Bạn không sở hữu ngọc này trong kho!'
            : '❌ INSUFFICIENT GEMS: You do not own this gem in your inventory!',
          'system'
        );
        return;
      }

      // Cost to slot a gem is 100 gold
      const cost = 100;
      if (hero.gold < cost) {
        get().addLogMessage(
          useLanguageStore.getState().language === 'vi'
            ? `❌ KHÔNG ĐỦ VÀNG: Cần ${cost} Vàng để khảm!`
            : `❌ INSUFFICIENT GOLD: Need ${cost} Gold to slot!`,
          'system'
        );
        return;
      }

      hero.gold -= cost;
      
      // Deduct gem from inventory
      heroGems[gemKey] = quantity - 1;

      // If socket already had a gem, return it to the inventory
      const oldGem = item.sockets[socketIdx];
      if (oldGem) {
        heroGems[oldGem] = (heroGems[oldGem] || 0) + 1;
      }

      hero.gems = heroGems;

      const inventory = saveData.inventory.map(i => {
        if (i.id === itemId) {
          const newSockets = [...(i.sockets || [])];
          newSockets[socketIdx] = gemKey;
          return { ...i, sockets: newSockets };
        }
        return i;
      });

      // Recalculate stats
      const equipped = inventory.filter(i => i.equipped);
      hero.currentStats = recalculateHeroStats(hero.level, hero.prestigePoints, equipped, hero.heroClass, hero.shardUpgrades, hero.goldUpgrades, hero.traits);
      hero.currentHp = Math.min(hero.currentHp, hero.currentStats.maxHp);

      const [type, tier] = gemKey.split('_');
      const gemName = type === 'ruby' ? 'Hồng Ngọc' : type === 'emerald' ? 'Lục Bảo' : type === 'sapphire' ? 'Lam Bảo' : 'Thạch Anh';
      get().addLogMessage(
        useLanguageStore.getState().language === 'vi'
          ? `💎 KHẢM NGỌC: Khảm thành công ${gemName} Cấp ${tier} vào trang bị!`
          : `💎 GEM SLOT: Successfully slotted ${type.toUpperCase()} Gem Tier ${tier}!`,
        'system'
      );

      get().showToast(
        useLanguageStore.getState().language === 'vi'
          ? `🎉 Khảm ${gemName} Cấp ${tier} thành công!`
          : `🎉 Slotted ${type.toUpperCase()} Gem Tier ${tier} successfully!`
      );

      const updatedSave: GameSaveData = {
        ...saveData,
        hero,
        inventory,
        lastSavedAt: Date.now()
      };

      autoSave(updatedSave);
    },

    removeGem: (itemId, socketIdx) => {
      const { saveData } = get();
      if (!saveData) return;

      const item = saveData.inventory.find(i => i.id === itemId);
      if (!item) return;

      if (!item.sockets || socketIdx < 0 || socketIdx >= item.sockets.length) return;

      const oldGem = item.sockets[socketIdx];
      if (!oldGem) return;

      // Fee is free or 50 Gold, let's make it 50 Gold
      const cost = 50;
      const hero = { ...saveData.hero };
      if (hero.gold < cost) {
        get().addLogMessage(
          useLanguageStore.getState().language === 'vi'
            ? `❌ KHÔNG ĐỦ VÀNG: Cần ${cost} Vàng để tháo ngọc!`
            : `❌ INSUFFICIENT GOLD: Need ${cost} Gold to unsocket!`,
          'system'
        );
        return;
      }

      hero.gold -= cost;

      // Return gem to inventory
      const heroGems = { ...(hero.gems || {}) };
      heroGems[oldGem] = (heroGems[oldGem] || 0) + 1;
      hero.gems = heroGems;

      const inventory = saveData.inventory.map(i => {
        if (i.id === itemId) {
          const newSockets = [...(i.sockets || [])];
          newSockets[socketIdx] = null;
          return { ...i, sockets: newSockets };
        }
        return i;
      });

      // Recalculate stats
      const equipped = inventory.filter(i => i.equipped);
      hero.currentStats = recalculateHeroStats(hero.level, hero.prestigePoints, equipped, hero.heroClass, hero.shardUpgrades, hero.goldUpgrades, hero.traits);
      hero.currentHp = Math.min(hero.currentHp, hero.currentStats.maxHp);

      const [type, tier] = oldGem.split('_');
      const gemName = type === 'ruby' ? 'Hồng Ngọc' : type === 'emerald' ? 'Lục Bảo' : type === 'sapphire' ? 'Lam Bảo' : 'Thạch Anh';
      
      get().addLogMessage(
        useLanguageStore.getState().language === 'vi'
          ? `💎 THÁO NGỌC: Tháo thành công ${gemName} Cấp ${tier} khỏi trang bị.`
          : `💎 GEM REMOVED: Successfully unsocketed ${type.toUpperCase()} Gem Tier ${tier}.`,
        'system'
      );

      get().showToast(
        useLanguageStore.getState().language === 'vi'
          ? `🎉 Đã tháo ${gemName} Cấp ${tier}!`
          : `🎉 Unsocketed ${type.toUpperCase()} Gem Tier ${tier}!`
      );

      const updatedSave: GameSaveData = {
        ...saveData,
        hero,
        inventory,
        lastSavedAt: Date.now()
      };

      autoSave(updatedSave);
    },

    enterDungeon: (dungeonId) => {
      const { saveData } = get();
      if (!saveData) return;

      const hero = { ...saveData.hero };
      const currentTickets = hero.dungeonTickets ?? 3;

      if (currentTickets <= 0) {
        get().addLogMessage(
          useLanguageStore.getState().language === 'vi'
            ? '❌ HẾT VÉ PHÓ BẢN: Hãy mua thêm vé bằng Vàng!'
            : '❌ NO DUNGEON TICKETS: Purchase more tickets with Gold!',
          'system'
        );
        return;
      }

      // Check level lock dynamically
      let levelReq = 5;
      if (dungeonId.endsWith('_2')) {
        if (dungeonId.startsWith('gear_')) levelReq = 18;
        else if (dungeonId.startsWith('diamond_')) levelReq = 20;
        else levelReq = 15;
      } else if (dungeonId.endsWith('_3')) {
        if (dungeonId.startsWith('gear_')) levelReq = 32;
        else if (dungeonId.startsWith('diamond_')) levelReq = 35;
        else levelReq = 30;
      } else if (dungeonId.startsWith('diamond_1')) {
        levelReq = 10;
      }

      if (hero.level < levelReq) {
        get().addLogMessage(
          useLanguageStore.getState().language === 'vi'
            ? `🔒 PHÓ BẢN KHÓA: Yêu cầu Cấp ${levelReq} để vào!`
            : `🔒 DUNGEON LOCKED: Requires Level ${levelReq} to enter!`,
          'system'
        );
        return;
      }

      // Spend 1 ticket
      hero.dungeonTickets = currentTickets - 1;

      // Update state to loading transition and clear previous rewards
      set({
        activeDungeonId: dungeonId,
        dungeonLoading: true,
        dungeonRewardGems: null,
        dungeonRewardGold: null,
        dungeonRewardDiamonds: null,
        dungeonRewardItems: null,
        dungeonResult: null
      });

      const updatedSave: GameSaveData = {
        ...saveData,
        hero,
        lastSavedAt: Date.now()
      };
      autoSave(updatedSave);

      // Transition to dungeon battle interface after 1.5 seconds loading
      setTimeout(() => {
        set({
          dungeonLoading: false,
          battleMode: 'dungeon'
        });
      }, 1500);
    },

    onDungeonVictory: (dungeonId) => {
      const { saveData } = get();
      if (!saveData) return;

      const hero = { ...saveData.hero };
      const language = useLanguageStore.getState().language;

      let rolledGems: Record<string, number> | null = null;
      let rolledGold: number | null = null;
      let rolledDiamonds: number | null = null;
      let rolledItems: EquipmentItem[] | null = null;
      let finalInventory = [...saveData.inventory];

      if (dungeonId.startsWith('gem_') || dungeonId.startsWith('dungeon_')) {
        // Roll gem drops
        let minTier = 1;
        let maxTier = 1;
        let rollCount = 1;
        
        const isDungeon3 = dungeonId === 'dungeon_3' || dungeonId === 'gem_3';
        const isDungeon2 = dungeonId === 'dungeon_2' || dungeonId === 'gem_2';
        
        if (dungeonId === 'dungeon_1' || dungeonId === 'gem_1') {
          minTier = 1;
          maxTier = 2;
          rollCount = Math.random() < 0.35 ? 2 : 1;
        } else if (isDungeon2) {
          minTier = 2;
          maxTier = 3;
          rollCount = Math.random() < 0.4 ? 2 : 1;
        } else if (isDungeon3) {
          minTier = 3;
          maxTier = 4;
          rollCount = Math.random() < 0.5 ? 3 : 2;
          if (Math.random() < 0.15) {
            maxTier = 5;
          }
        }
        
        const gemTypes = ['ruby', 'topaz', 'emerald', 'sapphire', 'amethyst'];
        const rewardsGems: Record<string, number> = {};
        
        for (let i = 0; i < rollCount; i++) {
          const type = gemTypes[Math.floor(Math.random() * gemTypes.length)];
          const tier = Math.floor(Math.random() * (maxTier - minTier + 1)) + minTier;
          const key = `${type}_${tier}`;
          rewardsGems[key] = (rewardsGems[key] || 0) + 1;
        }
        
        const heroGems = { ...(hero.gems || {}) };
        Object.entries(rewardsGems).forEach(([key, count]) => {
          heroGems[key] = (heroGems[key] || 0) + count;
        });
        hero.gems = heroGems;
        rolledGems = rewardsGems;

        Object.entries(rewardsGems).forEach(([key, count]) => {
          const [type, tier] = key.split('_');
          const gemName = type === 'ruby' ? 'Hồng Ngọc' : type === 'topaz' ? 'Hoàng Ngọc' : type === 'emerald' ? 'Lục Bảo' : type === 'sapphire' ? 'Lam Bảo' : 'Thạch Anh';
          get().addLogMessage(
            language === 'vi'
              ? `💎 PHÓ BẢN: Vượt ải thành công! Nhận được +${count} ${gemName} Cấp ${tier}!`
              : `💎 DUNGEON: Victory! Received +${count} ${type.toUpperCase()} Gem Tier ${tier}!`,
            'loot'
          );
        });
      } else if (dungeonId.startsWith('gold_')) {
        if (dungeonId === 'gold_1') rolledGold = 10000;
        else if (dungeonId === 'gold_2') rolledGold = 35000;
        else if (dungeonId === 'gold_3') rolledGold = 120000;

        if (rolledGold) {
          hero.gold += rolledGold;
          get().addLogMessage(
            language === 'vi'
              ? `💰 PHÓ BẢN: Vượt ải thành công! Nhận được +${rolledGold.toLocaleString()} Vàng!`
              : `💰 DUNGEON: Victory! Received +${rolledGold.toLocaleString()} Gold!`,
            'loot'
          );
        }
      } else if (dungeonId.startsWith('diamond_')) {
        if (dungeonId === 'diamond_1') rolledDiamonds = 100;
        else if (dungeonId === 'diamond_2') rolledDiamonds = 300;
        else if (dungeonId === 'diamond_3') rolledDiamonds = 1000;

        if (rolledDiamonds) {
          hero.diamonds += rolledDiamonds;
          get().addLogMessage(
            language === 'vi'
              ? `💎 PHÓ BẢN: Vượt ải thành công! Nhận được +${rolledDiamonds.toLocaleString()} Kim Cương!`
              : `💎 DUNGEON: Victory! Received +${rolledDiamonds.toLocaleString()} Diamonds!`,
            'loot'
          );
        }
      } else if (dungeonId.startsWith('gear_')) {
        let count = 1;
        let rarities: string[] = ['rare'];
        if (dungeonId === 'gear_1') {
          rarities = ['rare', 'epic'];
        } else if (dungeonId === 'gear_2') {
          rarities = ['epic', 'legendary'];
        } else if (dungeonId === 'gear_3') {
          rarities = ['legendary'];
          count = Math.random() < 0.4 ? 2 : 1;
        }

        const pool = DEFAULT_ITEM_TEMPLATES.filter(t => rarities.includes(t.rarity));
        const rolled: EquipmentItem[] = [];
        for (let i = 0; i < count; i++) {
          if (pool.length > 0) {
            const randTemplate = pool[Math.floor(Math.random() * pool.length)];
            const item = createItemInstance(randTemplate);
            item.isIdentified = false; // Needs identification
            rolled.push(item);
          }
        }

        if (rolled.length > 0) {
          if (saveData.inventory.length + rolled.length > 50) {
            const shardsGained = rolled.length * 100;
            hero.aetherShards = ((hero as any).aetherShards || 0) + shardsGained;
            get().addLogMessage(
              language === 'vi'
                ? `🎒 HÀNH LÝ ĐẦY: Quy đổi ${rolled.length} trang bị phó bản thành +${shardsGained} Mảnh Aether!`
                : `🎒 BAG FULL: Converted ${rolled.length} dungeon gear into +${shardsGained} Aether Shards!`,
              'system'
            );
          } else {
            finalInventory = [...finalInventory, ...rolled];
            rolled.forEach(item => {
              get().addLogMessage(
                language === 'vi'
                  ? `⚔️ PHÓ BẢN: Vượt ải thành công! Nhận được [${item.name}] chưa giám định!`
                  : `⚔️ DUNGEON: Victory! Received unidentified [${item.name}]!`,
                'loot'
              );
            });
            rolledItems = rolled;
          }
        }
      }

      // Restore health
      hero.currentHp = hero.currentStats.maxHp;

      // Set reward values so they are visible on the victory screen
      set({
        dungeonRewardGems: rolledGems,
        dungeonRewardGold: rolledGold,
        dungeonRewardDiamonds: rolledDiamonds,
        dungeonRewardItems: rolledItems,
        dungeonResult: 'victory',
        heroHp: hero.currentHp
      });

      const updatedSave: GameSaveData = {
        ...saveData,
        hero,
        inventory: finalInventory,
        lastSavedAt: Date.now()
      };
      autoSave(updatedSave);
    },

    claimDungeonRewards: () => {
      const { saveData } = get();
      if (!saveData) return;

      const hero = { ...saveData.hero };
      hero.currentHp = hero.currentStats.maxHp;

      set({
        battleMode: 'stage',
        activeDungeonId: null,
        dungeonRewardGems: null,
        dungeonRewardGold: null,
        dungeonRewardDiamonds: null,
        dungeonRewardItems: null,
        dungeonResult: null,
        heroHp: hero.currentHp
      });
    },

    onDungeonDefeat: () => {
      const { saveData } = get();
      if (!saveData) return;

      const hero = { ...saveData.hero };
      hero.currentHp = hero.currentStats.maxHp;

      set({
        battleMode: 'stage',
        activeDungeonId: null,
        dungeonRewardGems: null,
        dungeonRewardGold: null,
        dungeonRewardDiamonds: null,
        dungeonRewardItems: null,
        dungeonResult: null,
        heroHp: hero.currentHp
      });

      const updatedSave: GameSaveData = {
        ...saveData,
        hero,
        lastSavedAt: Date.now()
      };
      autoSave(updatedSave);
    },

    triggerDungeonDefeat: () => {
      set({ dungeonResult: 'defeat' });
    },

    usePotionInDungeon: () => {
      const { saveData } = get();
      if (!saveData) return false;

      const hero = { ...saveData.hero };
      if (hero.potions === undefined || hero.potions <= 0) return false;
      hero.potions -= 1;

      set({
        saveData: { ...saveData, hero }
      });

      const updatedSave: GameSaveData = {
        ...saveData,
        hero,
        lastSavedAt: Date.now()
      };
      autoSave(updatedSave);
      return true;
    },

    combineGems: (gemType, tier) => {
      const { saveData } = get();
      if (!saveData) return;

      if (tier >= 5) {
        get().addLogMessage(
          useLanguageStore.getState().language === 'vi'
            ? '❌ CẤP ĐỘ TỐI ĐA: Ngọc đã đạt Cấp 5 tối đa!'
            : '❌ MAX TIER: Gem is already at maximum Tier 5!',
          'system'
        );
        return;
      }

      const hero = { ...saveData.hero };
      const heroGems = { ...(hero.gems || {}) };
      const sourceKey = `${gemType}_${tier}`;
      const targetKey = `${gemType}_${tier + 1}`;

      const count = heroGems[sourceKey] || 0;
      if (count < 3) {
        get().addLogMessage(
          useLanguageStore.getState().language === 'vi'
            ? `❌ KHÔNG ĐỦ NGỌC: Cần ít nhất 3 viên Cấp ${tier} để ghép!`
            : `❌ INSUFFICIENT GEMS: Need at least 3 Tier ${tier} gems to combine!`,
          'system'
        );
        return;
      }

      const cost = 500;
      if (hero.gold < cost) {
        get().addLogMessage(
          useLanguageStore.getState().language === 'vi'
            ? `❌ KHÔNG ĐỦ VÀNG: Cần ${cost} Vàng để ghép ngọc!`
            : `❌ INSUFFICIENT GOLD: Need ${cost} Gold to fuse gems!`,
          'system'
        );
        return;
      }

      // Fulfill fusion
      hero.gold -= cost;
      heroGems[sourceKey] = count - 3;

      const rates: Record<number, number> = {
        1: 1.0,
        2: 0.5,
        3: 0.1,
        4: 0.01
      };
      const successRate = rates[tier] ?? 1.0;
      const isSuccess = Math.random() < successRate;

      const gemName = gemType === 'ruby' ? 'Hồng Ngọc' : gemType === 'topaz' ? 'Hoàng Ngọc' : gemType === 'emerald' ? 'Lục Bảo' : gemType === 'sapphire' ? 'Lam Bảo' : 'Thạch Anh';
      
      if (isSuccess) {
        heroGems[targetKey] = (heroGems[targetKey] || 0) + 1;
        hero.gems = heroGems;

        get().addLogMessage(
          useLanguageStore.getState().language === 'vi'
            ? `💎 GHÉP NGỌC: Ghép thành công 3x ${gemName} Cấp ${tier} -> 1x Cấp ${tier + 1} (-500 Vàng)`
            : `💎 GEM FUSION: Successfully combined 3x ${gemType.toUpperCase()} Tier ${tier} -> 1x Tier ${tier + 1} (-500 Gold)`,
          'system'
        );

        get().showToast(
          useLanguageStore.getState().language === 'vi'
            ? `🎉 Ghép thành công 1x ${gemName} Cấp ${tier + 1}!`
            : `🎉 Successfully fused 1x ${gemType.toUpperCase()} Gem Tier ${tier + 1}!`
        );
      } else {
        hero.gems = heroGems;

        get().addLogMessage(
          useLanguageStore.getState().language === 'vi'
            ? `💥 GHÉP THẤT BẠI: Ghép 3x ${gemName} Cấp ${tier} thất bại! Hao tổn tài nguyên (-500 Vàng)`
            : `💥 FUSION FAILED: Failed to combine 3x ${gemType.toUpperCase()} Tier ${tier}! Resources lost (-500 Gold)`,
          'system'
        );

        get().showToast(
          useLanguageStore.getState().language === 'vi'
            ? `💥 Ghép ngọc thất bại! (Tỷ lệ: ${successRate * 100}%)`
            : `💥 Gem fusion failed! (Success rate: ${successRate * 100}%)`
        );
      }

      const updatedSave: GameSaveData = {
        ...saveData,
        hero,
        lastSavedAt: Date.now()
      };

      autoSave(updatedSave);
    },

    buyDungeonTicket: () => {
      const { saveData } = get();
      if (!saveData) return;

      const hero = { ...saveData.hero };
      const cost = 1000;

      if (hero.gold < cost) {
        get().addLogMessage(
          useLanguageStore.getState().language === 'vi'
            ? `❌ KHÔNG ĐỦ VÀNG: Cần ${cost} Vàng để mua Vé Phó Bản!`
            : `❌ INSUFFICIENT GOLD: Need ${cost} Gold to buy Dungeon Ticket!`,
          'system'
        );
        return;
      }

      hero.gold -= cost;
      hero.dungeonTickets = (hero.dungeonTickets ?? 3) + 1;

      get().addLogMessage(
        useLanguageStore.getState().language === 'vi'
          ? `🎫 MUA VÉ: Đã mua +1 Vé Phó Bản (-${cost} Vàng)`
          : `🎫 TICKET BOUGHT: Purchased +1 Dungeon Ticket (-${cost} Gold)`,
        'system'
      );

      get().showToast(
        useLanguageStore.getState().language === 'vi'
          ? '🎉 Đã mua thành công +1 Vé Phó Bản!'
          : '🎉 Purchased +1 Dungeon Ticket!'
      );

      const updatedSave: GameSaveData = {
        ...saveData,
        hero,
        lastSavedAt: Date.now()
      };

      autoSave(updatedSave);
    },

    startGuildRaid: () => {
      set({ battleMode: 'guild_boss', monsterName: 'Void Behemoth' });
    },

    exitGuildRaid: () => {
      const { saveData } = get();
      if (saveData) {
        const hero = { ...saveData.hero };
        hero.currentHp = hero.currentStats.maxHp;
        
        const updatedSave: GameSaveData = {
          ...saveData,
          hero,
          lastSavedAt: Date.now()
        };
        autoSave(updatedSave);
      }
      set({ battleMode: 'stage' });
    },

    addLogMessage: (text, category) => {
      const timestamp = new Date();
      const timeStr = timestamp.toTimeString().split(' ')[0];
      const entry: CombatLogEntry = {
        id: `log_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`,
        time: timeStr,
        text: translateEngineLog(text),
        category
      };

      set(state => {
        // Cap logs at 50 to prevent memory blowup
        const logs = [entry, ...state.combatLogs].slice(0, 50);
        return { combatLogs: logs };
      });
    },

    registerEngine: (engine) => {
      set({ engineInstance: engine });
    },

    triggerHeroDefeated: () => {
      const { saveData, battleMode } = get();
      if (!saveData) return;

      if (battleMode === 'dungeon') {
        get().addLogMessage(
          useLanguageStore.getState().language === 'vi'
            ? '❌ PHÓ BẢN THẤT BẠI: Bạn đã bị hạ gục trong phó bản!'
            : '❌ DUNGEON DEFEAT: You were defeated in the dungeon!',
          'system'
        );
        
        set({
          dungeonResult: 'defeat'
        });
        return;
      }

      const stage = saveData.activeStage;
      const goldCost = Math.max(500, stage * 300);
      const diamondCost = Math.max(5, Math.floor(stage / 10));
      set({
        isDead: true,
        reviveCostGold: goldCost,
        reviveCostDiamonds: diamondCost
      });
    },

    reviveHero: (method) => {
      const { saveData, reviveCostGold, reviveCostDiamonds, engineInstance } = get();
      if (!saveData) return false;

      const hero = { ...saveData.hero };
      let sameStage = true;

      if (method === 'gold') {
        if (hero.gold < reviveCostGold) {
          get().addLogMessage(tStore('insufficient_gold'), 'system');
          return false;
        }
        hero.gold -= reviveCostGold;
      } else if (method === 'diamonds') {
        if (hero.diamonds < reviveCostDiamonds) {
          get().addLogMessage(tStore('insufficient_diamonds'), 'system');
          return false;
        }
        hero.diamonds -= reviveCostDiamonds;
      }

      // Restore health
      hero.currentHp = hero.currentStats.maxHp;

      const updatedSave: GameSaveData = {
        ...saveData,
        hero,
        activeStage: saveData.activeStage,
        currentWave: 1,
        autoAdvance: true,
        lastSavedAt: Date.now()
      };

      set({ isDead: false, heroHp: hero.currentStats.maxHp });

      if (engineInstance) {
        engineInstance.reviveHero(sameStage);
      }

      get().addLogMessage(tStore('log_hero_revived'), 'system');
      autoSave(updatedSave);
      return true;
    },

    clearLogs: () => set({ combatLogs: [] }),

    rollHeroTraits: () => {
      const { saveData } = get();
      if (!saveData) return;

      const hero = { ...saveData.hero };
      if (!hero.traits) {
        hero.traits = [
          { id: 1, grade: 'C', stat: 'atk', value: 10, locked: false },
          { id: 2, grade: 'C', stat: 'hp', value: 10, locked: false },
          { id: 3, grade: 'C', stat: 'crit', value: 10, locked: false },
          { id: 4, grade: 'C', stat: 'gold', value: 10, locked: false },
          { id: 5, grade: 'C', stat: 'atk', value: 10, locked: false }
        ];
      }

      const lockedCount = hero.traits.filter(t => t.locked).length;
      const cost = lockedCount * 15 + 30; // base 30, +15 per lock

      if (hero.diamonds < cost) {
        get().addLogMessage(
          useLanguageStore.getState().language === 'vi'
            ? `❌ KHÔNG ĐỦ KIM CƯƠNG: Cần ${cost} Kim Cương để thay đổi thiên phú!`
            : `❌ INSUFFICIENT DIAMONDS: Need ${cost} Diamonds to change traits!`,
          'system'
        );
        return;
      }

      hero.diamonds -= cost;

      // Roll traits with ranges
      hero.traits = hero.traits.map(t => {
        if (t.locked) return t;

        const roll = Math.random();
        let grade: 'C' | 'B' | 'A' | 'S' | 'SS' = 'C';
        if (roll < 0.01) grade = 'SS';
        else if (roll < 0.05) grade = 'S';
        else if (roll < 0.15) grade = 'A';
        else if (roll < 0.40) grade = 'B';

        const statsPool = ['atk', 'hp', 'crit', 'gold'] as const;
        const stat = statsPool[Math.floor(Math.random() * statsPool.length)];

        let min = 5;
        let max = 15;
        let step = 1;
        if (grade === 'SS') { min = 250; max = 400; step = 5; }
        else if (grade === 'S') { min = 100; max = 200; step = 5; }
        else if (grade === 'A') { min = 50; max = 95; step = 5; }
        else if (grade === 'B') { min = 20; max = 45; step = 5; }
        else { min = 5; max = 15; step = 1; }

        const possibleSteps = Math.floor((max - min) / step);
        const value = min + Math.floor(Math.random() * (possibleSteps + 1)) * step;

        return {
          ...t,
          grade,
          stat,
          value
        };
      });

      // Recalculate stats
      const equipped = saveData.inventory.filter(i => i.equipped);
      hero.currentStats = recalculateHeroStats(hero.level, hero.prestigePoints, equipped, hero.heroClass, hero.shardUpgrades, hero.goldUpgrades, hero.traits);
      hero.currentHp = Math.min(hero.currentStats.maxHp, hero.currentHp);

      get().addLogMessage(
        useLanguageStore.getState().language === 'vi'
          ? `🧬 THIÊN PHÚ: Đã thay đổi thiên phú thành công (Tiêu hao ${cost} 💎).`
          : `🧬 TRAITS: Successfully changed traits (Cost ${cost} 💎).`,
        'system'
      );

      // Update Pixi engine if running
      if (get().engineInstance) {
        get().engineInstance.updateState(
          hero.level,
          hero.prestigePoints,
          equipped,
          saveData.activeStage,
          hero.heroClass,
          hero.name || 'Hero',
          useLanguageStore.getState().language,
          hero.shardUpgrades,
          hero.potions,
          hero.autoUsePotion,
          hero.autoBuyPotions,
          hero.gold,
          hero.goldUpgrades,
          hero.traits
        );
      }

      const updatedSave: GameSaveData = {
        ...saveData,
        hero,
        lastSavedAt: Date.now()
      };

      set({ saveData: updatedSave });
      autoSave(updatedSave);
    },

    toggleHeroTraitLock: (id: number) => {
      const { saveData } = get();
      if (!saveData) return;

      const hero = { ...saveData.hero };
      if (!hero.traits) return;

      hero.traits = hero.traits.map(t => {
        if (t.id === id) {
          return { ...t, locked: !t.locked };
        }
        return t;
      });

      const updatedSave: GameSaveData = {
        ...saveData,
        hero,
        lastSavedAt: Date.now()
      };

      set({ saveData: updatedSave });
      autoSave(updatedSave);
    }
  };
});
