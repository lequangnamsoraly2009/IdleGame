import { create } from 'zustand';
import { GameSaveData, EquipmentItem, QuestState } from '@idle-rpg/shared';
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
  activeTab: 'hero' | 'bag' | 'quest' | 'guild' | 'shop' | 'summon';
  isLoading: boolean;
  
  // Realtime Battle HUD healths (synced with Pixi tick updates)
  heroHp: number;
  heroMaxHp: number;
  monsterHp: number;
  monsterMaxHp: number;
  monsterName: string;

  // Combat Log List
  combatLogs: CombatLogEntry[];

  // Actions
  initializeAuth: () => () => void;
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string) => Promise<void>;
  signOut: () => Promise<void>;
  saveGame: () => Promise<void>;
  
  // Combat Loops
  syncBattleStats: (heroHp: number, monsterHp: number, maxHeroHp: number, maxMonsterHp: number) => void;
  onMonsterDefeated: (expGained: number, goldGained: number, diamondsGained: number, itemsDropped: EquipmentItem[]) => void;
  onStageChange: (newStage: number) => void;
  
  // Gameplay Actions
  setActiveTab: (tab: 'hero' | 'bag' | 'quest' | 'guild' | 'shop' | 'summon') => void;
  upgradeEquipment: (itemId: string) => void;
  equipEquipment: (itemId: string) => void;
  unequipEquipment: (itemId: string) => void;
  sellEquipment: (itemId: string) => void;
  claimQuestReward: (questId: string) => void;
  buyGoldPack: () => void;
  summonEquipment: () => void;
  triggerPrestige: () => void;
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
    monsterHp: 50,
    monsterMaxHp: 50,
    monsterName: 'Loading monster...',

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
              heroHp: data ? data.hero.currentHp : 100,
              heroMaxHp: data ? data.hero.currentStats.maxHp : 100,
              isLoading: false
            });
            get().addLogMessage(`Welcome back, ${sessionUser.email}! Game data loaded.`, 'system');
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

    syncBattleStats: (heroHp, monsterHp, maxHeroHp, maxMonsterHp) => {
      set({ heroHp, monsterHp, heroMaxHp: maxHeroHp, monsterMaxHp: maxMonsterHp });
    },

    onMonsterDefeated: (expGained, goldGained, diamondsGained, itemsDropped) => {
      const { saveData } = get();
      if (!saveData) return;

      const hero = { ...saveData.hero };
      let newInventory = [...saveData.inventory];
      let quests = [...saveData.quests];
      
      // Update gold, diamonds, exp
      hero.gold += goldGained;
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
        get().addLogMessage(`LEVEL UP! Hero reached Level ${hero.level}!`, 'system');
        // Recalculate stats
        const equipped = newInventory.filter(i => i.equipped);
        hero.currentStats = recalculateHeroStats(hero.level, hero.prestigePoints, equipped);
        hero.currentHp = hero.currentStats.maxHp;
        
        // Audit Level Up quests
        quests = checkQuests(quests, 'reach_level', 0, hero.level);
      }

      // Add dropped items to inventory if there is space (limit: 50 items)
      for (const item of itemsDropped) {
        if (newInventory.length < 50) {
          newInventory.push(item);
        } else {
          get().addLogMessage(`Inventory full! Loot lost: [${item.name}]`, 'system');
        }
      }

      // Audit Defeat Monster and Earn Gold quests
      quests = checkQuests(quests, 'defeat_monster', 1);
      quests = checkQuests(quests, 'earn_gold', goldGained);

      // Save updated state
      const updatedSave: GameSaveData = {
        ...saveData,
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

        // Upgrade item
        if (saveData.hero.gold < item.upgradeCost) {
          get().addLogMessage(`Insufficient gold to upgrade ${item.name}`, 'system');
          return item;
        }

        const nextLevel = item.level + 1;
        const deductedGold = saveData.hero.gold - item.upgradeCost;
        
        // Deduct gold in state
        saveData.hero.gold = deductedGold;

        const updatedStats = calculateItemStats(item.slot, item.rarity, nextLevel);
        const nextUpgradeCost = calculateUpgradeCost(item.slot, item.rarity, nextLevel);

        get().addLogMessage(`Upgraded [${item.name}] to +${nextLevel}!`, 'system');

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
      hero.currentStats = recalculateHeroStats(hero.level, hero.prestigePoints, equipped);
      hero.currentHp = Math.min(hero.currentStats.maxHp, get().heroHp);

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
      hero.currentStats = recalculateHeroStats(hero.level, hero.prestigePoints, equipped);
      hero.currentHp = hero.currentStats.maxHp; // Refill HP on equip change

      get().addLogMessage(`Equipped [${itemToEquip.name}]`, 'system');

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
      hero.currentStats = recalculateHeroStats(hero.level, hero.prestigePoints, equipped);
      hero.currentHp = Math.min(hero.currentHp, hero.currentStats.maxHp);

      const item = saveData.inventory.find(i => i.id === itemId);
      if (item) get().addLogMessage(`Unequipped [${item.name}]`, 'system');

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
        get().addLogMessage(`Cannot sell equipped item: [${item.name}]`, 'system');
        return;
      }

      // Sell price is 30% of standard level-1 upgrade cost
      const sellPrice = Math.floor(calculateUpgradeCost(item.slot, item.rarity, 1) * 0.3);
      
      const inventory = saveData.inventory.filter(i => i.id !== itemId);
      const hero = { ...saveData.hero };
      hero.gold += sellPrice;

      get().addLogMessage(`Sold [${item.name}] for ${sellPrice} Gold`, 'system');

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

      get().addLogMessage(`Claimed quest [${quest.title}]: Gained ${quest.rewardGold} Gold, ${quest.rewardDiamonds} Diamonds.`, 'system');

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
        get().addLogMessage('Insufficient diamonds to buy Gold Pack!', 'system');
        return;
      }

      const goldGained = 800 * saveData.activeStage;
      const hero = { ...saveData.hero };
      hero.diamonds -= cost;
      hero.gold += goldGained;

      get().addLogMessage(`Bought Gold Pack: Spent ${cost} Diamonds, gained ${goldGained} Gold.`, 'loot');

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
        get().addLogMessage('Insufficient diamonds to Summon Equipment!', 'system');
        return;
      }

      if (saveData.inventory.length >= 50) {
        get().addLogMessage('Inventory full! Clear items before summoning.', 'system');
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

      get().addLogMessage(`SUMMON SUCCESS! Pulled [${newItem.name}] (${newItem.rarity.toUpperCase()})!`, 'loot');

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
        get().addLogMessage('You need to clear at least Stage 10 to prestige!', 'system');
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
      hero.currentStats = recalculateHeroStats(1, hero.prestigePoints, []);
      hero.currentHp = hero.currentStats.maxHp;

      // Reset Quests to starter set
      const initialSaveTemplate = generateStarterSave(saveData.userId);
      const quests = initialSaveTemplate.quests;

      get().addLogMessage(`PRESTIGE COMPLETE! Reset level to 1, earned +${pointsEarned} Prestige Points.`, 'system');

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

    addLogMessage: (text, category) => {
      const timestamp = new Date();
      const timeStr = timestamp.toTimeString().split(' ')[0];
      const entry: CombatLogEntry = {
        id: `log_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`,
        time: timeStr,
        text,
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
