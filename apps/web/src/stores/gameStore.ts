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
  generateMonsterForStage
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
  activeTab: 'hero' | 'bag' | 'quest' | 'guild' | 'shop' | 'summon' | 'guide';
  isLoading: boolean;
  activeInspectItemId: string | null;
  
  // Realtime Battle HUD healths (synced with Pixi tick updates)
  heroHp: number;
  heroMaxHp: number;
  heroRage: number;
  monsterHp: number;
  monsterMaxHp: number;
  monsterRage: number;
  monsterName: string;
  battleMode: 'stage' | 'guild_boss';

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
  syncBattleStats: (heroHp: number, monsterHp: number, maxHeroHp: number, maxMonsterHp: number, heroRage: number, monsterRage: number) => void;
  onMonsterDefeated: (expGained: number, goldGained: number, diamondsGained: number, itemsDropped: EquipmentItem[], monsterId?: string, isMutated?: boolean, durationMs?: number) => void;
  onStageChange: (newStage: number) => void;
  toggleAutoAdvance: () => void;
  challengeBoss: () => void;
  startNextBattle: () => void;
  
  // Gameplay Actions
  setActiveTab: (tab: 'hero' | 'bag' | 'quest' | 'guild' | 'shop' | 'summon' | 'guide') => void;
  setActiveInspectItemId: (itemId: string | null) => void;
  upgradeEquipment: (itemId: string) => void;
  equipEquipment: (itemId: string) => void;
  unequipEquipment: (itemId: string) => void;
  sellEquipment: (itemId: string) => void;
  sellMultipleEquipment: (itemIds: string[]) => void;
  claimQuestReward: (questId: string) => void;
  buyGoldPack: () => void;
  summonEquipment: () => void;
  triggerPrestige: () => void;
  changeHeroClass: (newClass: 'knight' | 'mage' | 'assassin') => void;
  renameHero: (newName: string) => void;
  identifyEquipment: (itemId: string) => void;
  insertGem: (itemId: string, gemType: string, socketIdx: number) => void;
  startGuildRaid: () => void;
  exitGuildRaid: () => void;
  addLogMessage: (text: string, category: 'combat' | 'loot' | 'system') => void;
  clearLogs: () => void;
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

      const completed = newCount >= q.targetCount;
      return {
        ...q,
        currentCount: Math.min(q.targetCount, newCount),
        completed
      };
    });
  };

  return {
    user: null,
    saveData: null,
    activeTab: 'hero',
    isLoading: true,
    activeInspectItemId: null,

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

    syncBattleStats: (heroHp, monsterHp, maxHeroHp, maxMonsterHp, heroRage, monsterRage) => {
      set({ heroHp, monsterHp, heroMaxHp: maxHeroHp, monsterMaxHp: maxMonsterHp, heroRage, monsterRage });
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

      // Calculate Gold Bonus multiplier from equipped gear (Lucky affix + Topaz gems)
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
        hero.currentStats = recalculateHeroStats(hero.level, hero.prestigePoints, equippedNow, hero.heroClass);
        hero.currentHp = hero.currentStats.maxHp;
        
        // Audit Level Up quests
        quests = checkQuests(quests, 'reach_level', 0, hero.level);
      }

      // Add dropped items to inventory if there is space (limit: 50 items)
      for (const item of itemsDropped) {
        if (newInventory.length < 50) {
          newInventory.push(item);
        } else {
          get().addLogMessage(tStore('log_inventory_full', { name: item.name }), 'system');
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
        const autoAdvance = saveData.autoAdvance !== false;
        if (nextWave < 19) {
          nextWave += 1;
        } else if (nextWave === 19) {
          if (autoAdvance) {
            nextWave = 20; // Stage Boss Wave
          } else {
            nextWave = 1; // Loop back to wave 1 of current stage in farming mode
          }
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
        autoAdvance: nextWave === 1 && nextStage !== saveData.activeStage ? true : saveData.autoAdvance,
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
        nextAuto ? "🔄 Tự động vượt ải: BẬT" : "⏹️ Tự động vượt ải: TẮT (Chế độ Farm)",
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
      engineInstance.startBattle(monster);

      get().addLogMessage(`⚔️ KHIÊU CHIẾN: Đang khiêu chiến Boss Ải ${updatedSave.activeStage}!`, 'system');
    },

    startNextBattle: () => {
      const { saveData, engineInstance } = get();
      if (!saveData || !engineInstance) return;

      const hero = saveData.hero;
      const monster = generateMonsterForStage(saveData.activeStage, hero.level, saveData.monsterResearch, saveData.currentWave || 1);
      engineInstance.startBattle(monster);
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

        const updatedStats = calculateItemStats(item.slot, item.rarity, nextLevel);
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
      hero.currentStats = recalculateHeroStats(hero.level, hero.prestigePoints, equipped, hero.heroClass);
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
      hero.currentStats = recalculateHeroStats(hero.level, hero.prestigePoints, equipped, hero.heroClass);
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
      hero.currentStats = recalculateHeroStats(hero.level, hero.prestigePoints, equipped, hero.heroClass);
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

    sellEquipment: (itemId) => {
      const { saveData } = get();
      if (!saveData) return;

      const item = saveData.inventory.find(i => i.id === itemId);
      if (!item) return;

      if (item.equipped) {
        get().addLogMessage(tStore('equipped_label') + ` [${item.name}]`, 'system');
        return;
      }

      // Sell price is 30% of standard level-1 upgrade cost
      const sellPrice = Math.floor(calculateUpgradeCost(item.slot, item.rarity, 1) * 0.3);
      
      const inventory = saveData.inventory.filter(i => i.id !== itemId);
      const hero = { ...saveData.hero };
      hero.gold += sellPrice;

      get().addLogMessage(tStore('log_sold_item', { name: item.name, gold: sellPrice }), 'system');

      const updatedSave: GameSaveData = {
        ...saveData,
        hero,
        inventory,
        lastSavedAt: Date.now()
      };

      autoSave(updatedSave);
    },

    sellMultipleEquipment: (itemIds) => {
      const { saveData } = get();
      if (!saveData) return;

      let totalGoldEarned = 0;
      const itemsToSell = saveData.inventory.filter(i => itemIds.includes(i.id) && !i.equipped);
      if (itemsToSell.length === 0) return;

      itemsToSell.forEach(item => {
        // Sell price is 30% of standard level-1 upgrade cost
        const sellPrice = Math.floor(calculateUpgradeCost(item.slot, item.rarity, 1) * 0.3);
        totalGoldEarned += sellPrice;
      });

      const inventory = saveData.inventory.filter(i => !itemsToSell.some(sold => sold.id === i.id));
      const hero = { ...saveData.hero };
      hero.gold += totalGoldEarned;

      get().addLogMessage(tStore('log_sold_multiple', { count: itemsToSell.length, gold: totalGoldEarned }), 'system');

      const updatedSave: GameSaveData = {
        ...saveData,
        hero,
        inventory,
        lastSavedAt: Date.now()
      };

      autoSave(updatedSave);
    },

    claimQuestReward: (questId) => {
      const { saveData } = get();
      if (!saveData) return;

      const quest = saveData.quests.find(q => q.id === questId);
      if (!quest || !quest.completed || quest.claimed) return;

      const quests = saveData.quests.map(q => {
        if (q.id === questId) {
          return { ...q, claimed: true };
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

      const updatedSave: GameSaveData = {
        ...saveData,
        hero,
        inventory,
        lastSavedAt: Date.now()
      };

      autoSave(updatedSave);
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
      hero.currentStats = recalculateHeroStats(1, hero.prestigePoints, [], hero.heroClass);
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
      hero.currentStats = recalculateHeroStats(hero.level, hero.prestigePoints, equipped, newClass);
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

    insertGem: (itemId, gemType, socketIdx) => {
      const { saveData } = get();
      if (!saveData) return;

      const item = saveData.inventory.find(i => i.id === itemId);
      if (!item) return;

      if (!item.sockets || socketIdx < 0 || socketIdx >= item.sockets.length) return;

      // Cost to slot a gem is 100 gold
      const cost = 100;
      if (saveData.hero.gold < cost) {
        get().addLogMessage(tStore('insufficient_gold') + ` (${cost} Vàng)`, 'system');
        return;
      }

      const hero = { ...saveData.hero };
      hero.gold -= cost;

      const inventory = saveData.inventory.map(i => {
        if (i.id === itemId) {
          const newSockets = [...(i.sockets || [])];
          newSockets[socketIdx] = gemType;
          return { ...i, sockets: newSockets };
        }
        return i;
      });

      // Recalculate hero stats if the item is equipped!
      const equipped = inventory.filter(i => i.equipped);
      hero.currentStats = recalculateHeroStats(hero.level, hero.prestigePoints, equipped, hero.heroClass);
      hero.currentHp = Math.min(hero.currentHp, hero.currentStats.maxHp);

      const gemName = gemType === 'ruby' ? 'Ruby' : gemType === 'emerald' ? 'Emerald' : 'Topaz';
      get().addLogMessage(tStore('log_gem_inserted', { gem: gemName }), 'system');

      const updatedSave: GameSaveData = {
        ...saveData,
        hero,
        inventory,
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
      const { saveData } = get();
      if (!saveData) return;
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
      } else if (method === 'time') {
        sameStage = false;
      }

      // Restore health
      hero.currentHp = hero.currentStats.maxHp;

      let updatedStage = saveData.activeStage;
      if (!sameStage) {
        updatedStage = Math.max(1, saveData.activeStage - 1);
      }

      const wasBossDeath = saveData.currentWave === 20;

      const updatedSave: GameSaveData = {
        ...saveData,
        hero,
        activeStage: updatedStage,
        currentWave: 1,
        autoAdvance: wasBossDeath ? false : (saveData.autoAdvance !== false),
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

    clearLogs: () => set({ combatLogs: [] })
  };
});
