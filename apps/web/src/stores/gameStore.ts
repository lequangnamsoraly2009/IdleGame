import { create } from 'zustand';
import { GameSaveData, EquipmentItem, QuestState } from '@idle-rpg/shared';
import { tStore, translateEngineLog } from '../utils/i18n';
import { 
  recalculateHeroStats, 
  calculateLevelUpExp, 
  calculateUpgradeCost, 
  calculateItemStats,
  createItemInstance, 
  DEFAULT_ITEM_TEMPLATES, 
  calculatePrestigePoints
} from '@idle-rpg/shared';
import { authService, dbService, UserSession, generateStarterSave } from '@idle-rpg/firebase';

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
  
  // Realtime Battle HUD healths (synced with Pixi tick updates)
  heroHp: number;
  heroMaxHp: number;
  heroRage: number;
  monsterHp: number;
  monsterMaxHp: number;
  monsterRage: number;
  monsterName: string;
  battleMode: 'stage' | 'guild_boss';

  // Combat Log List
  combatLogs: CombatLogEntry[];

  // Actions
  initializeAuth: () => () => void;
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string) => Promise<void>;
  signOut: () => Promise<void>;
  saveGame: () => Promise<void>;
  
  // Combat Loops
  syncBattleStats: (heroHp: number, monsterHp: number, maxHeroHp: number, maxMonsterHp: number, heroRage: number, monsterRage: number) => void;
  onMonsterDefeated: (expGained: number, goldGained: number, diamondsGained: number, itemsDropped: EquipmentItem[]) => void;
  onStageChange: (newStage: number) => void;
  
  // Gameplay Actions
  setActiveTab: (tab: 'hero' | 'bag' | 'quest' | 'guild' | 'shop' | 'summon' | 'guide') => void;
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
  identifyEquipment: (itemId: string) => void;
  insertGem: (itemId: string, gemType: string, socketIdx: number) => void;
  startGuildRaid: () => void;
  exitGuildRaid: () => void;
  addLogMessage: (text: string, category: 'combat' | 'loot' | 'system') => void;
  clearLogs: () => void;
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

    // Combat HUD state
    heroHp: 100,
    heroMaxHp: 100,
    heroRage: 0,
    monsterHp: 50,
    monsterMaxHp: 50,
    monsterRage: 0,
    monsterName: 'Loading monster...',
    battleMode: 'stage',

    combatLogs: [],

    initializeAuth: () => {
      set({ isLoading: true });
      const unsubscribe = authService.onAuthStateChanged(async (sessionUser) => {
        if (sessionUser) {
          try {
            const data = await dbService.loadGame(sessionUser.id);
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

    syncBattleStats: (heroHp, monsterHp, maxHeroHp, maxMonsterHp, heroRage, monsterRage) => {
      set({ heroHp, monsterHp, heroMaxHp: maxHeroHp, monsterMaxHp: maxMonsterHp, heroRage, monsterRage });
    },

    onMonsterDefeated: (expGained, goldGained, diamondsGained, itemsDropped) => {
      const { saveData } = get();
      if (!saveData) return;

      const hero = { ...saveData.hero };
      let newInventory = [...saveData.inventory];
      let quests = [...saveData.quests];
      
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
      const nextStage = isGuildBoss ? saveData.activeStage : saveData.activeStage + 1;
      const stagesCleared = isGuildBoss ? saveData.stagesCleared : Math.max(saveData.stagesCleared, saveData.activeStage);

      // Save updated state
      const updatedSave: GameSaveData = {
        ...saveData,
        activeStage: nextStage,
        stagesCleared,
        hero,
        inventory: newInventory,
        quests,
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
      const initialSaveTemplate = generateStarterSave(saveData.userId, hero.heroClass);
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

    clearLogs: () => set({ combatLogs: [] })
  };
});
