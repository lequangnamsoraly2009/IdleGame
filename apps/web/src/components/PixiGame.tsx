import React, { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../stores/gameStore';
import { GameEngine } from '@idle-rpg/engine';
import { generateMonsterForStage } from '@idle-rpg/shared';
import { useTranslation } from '../utils/i18n';
import { useLanguageStore } from '../stores/languageStore';

const DUNGEON_BOSSES_TEMPLATES: Record<string, {
  nameVi: string;
  nameEn: string;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
}> = {
  gem_1: { nameVi: 'Vệ Binh Golem', nameEn: 'Guardian Golem', maxHp: 1200, attack: 22, defense: 12, speed: 80 },
  gem_2: { nameVi: 'Ma Thần Lửa Efreet', nameEn: 'Fire Demon Efreet', maxHp: 4500, attack: 56, defense: 26, speed: 105 },
  gem_3: { nameVi: 'Rồng Bóng Tối Cổ Đại', nameEn: 'Ancient Shadow Dragon', maxHp: 18000, attack: 175, defense: 75, speed: 110 },
  gold_1: { nameVi: 'Thủ Lĩnh Goblin', nameEn: 'Goblin Chieftain', maxHp: 1000, attack: 20, defense: 10, speed: 85 },
  gold_2: { nameVi: 'Vua Goblin', nameEn: 'Goblin King', maxHp: 4000, attack: 50, defense: 22, speed: 95 },
  gold_3: { nameVi: 'Rồng Vàng Hoàng Kim', nameEn: 'Golden Dragon', maxHp: 16000, attack: 160, defense: 70, speed: 105 },
  diamond_1: { nameVi: 'Nhện Tinh Thể', nameEn: 'Crystal Spider', maxHp: 1500, attack: 28, defense: 15, speed: 90 },
  diamond_2: { nameVi: 'Golem Tinh Thể', nameEn: 'Gemstone Golem', maxHp: 5500, attack: 68, defense: 32, speed: 95 },
  diamond_3: { nameVi: 'Quái Thú Chimera Tinh Thể', nameEn: 'Diamond Chimera', maxHp: 22000, attack: 210, defense: 90, speed: 105 },
  gear_1: { nameVi: 'Hiệp Sĩ Quỷ', nameEn: 'Undead Knight', maxHp: 1400, attack: 24, defense: 16, speed: 75 },
  gear_2: { nameVi: 'Cự Ma Phong Ấn', nameEn: 'Sealed Archdemon', maxHp: 5000, attack: 60, defense: 30, speed: 85 },
  gear_3: { nameVi: 'Vệ Binh Cổ Tự', nameEn: 'Relic Sentinel', maxHp: 20000, attack: 190, defense: 80, speed: 95 }
};

export const PixiGame: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const [initError, setInitError] = useState<string | null>(null);
  const { isDead, reviveHero, saveData } = useGameStore();

  const { t } = useTranslation();
  const [reviveCountdown, setReviveCountdown] = useState(3);

  useEffect(() => {
    if (!isDead) return;
    setReviveCountdown(3);
    const timer = setInterval(() => {
      setReviveCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          reviveHero('time');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isDead, reviveHero]);

  useEffect(() => {
    if (!containerRef.current) return;

    let engine: GameEngine;
    try {
      // Create the engine
      engine = new GameEngine((event) => {
        const store = useGameStore.getState();
        
        switch (event.type) {
          case 'BATTLE_TICK':
            store.syncBattleStats(event.heroHp, event.monsterHp, event.maxHeroHp, event.maxMonsterHp, event.heroRage, event.monsterRage, event.potionCd);
            break;
          case 'MONSTER_DEFEATED':
            store.onMonsterDefeated(event.exp, event.gold, event.diamonds, event.itemsDropped, event.monsterId, event.isMutated, event.durationMs);
            setTimeout(() => {
              const currentState = useGameStore.getState();
              if (currentState.battleMode === 'stage' && !currentState.isDead) {
                currentState.startNextBattle();
              }
            }, 1200);
            break;
          case 'STAGE_ADVANCED':
            store.onStageChange(event.nextStage);
            break;
          case 'LOG_MESSAGE':
            store.addLogMessage(event.text, event.category);
            break;
          case 'GUILD_RAID_ENDED':
            store.exitGuildRaid();
            break;
          case 'HERO_DEFEATED':
            store.triggerHeroDefeated();
            break;
          case 'POTION_USED':
            store.onPotionUsedByEngine(event.amount, event.didAutoBuy);
            break;
          case 'DUNGEON_VICTORY':
            store.onDungeonVictory(event.dungeonId);
            break;
          case 'DUNGEON_DEFEAT':
            store.triggerDungeonDefeat();
            break;
        }
      });
      engineRef.current = engine;
      useGameStore.getState().registerEngine(engine);
    } catch (err: any) {
      console.error("PixiJS Engine creation failed:", err);
      setInitError(`Engine Creation: ${err.stack || err.message || String(err)}`);
      return;
    }

    // Initialize engine on the container
    engine.init(containerRef.current).then(() => {
      const state = useGameStore.getState();
      if (state.saveData) {
        const hero = state.saveData.hero;
        const activeStage = state.saveData.activeStage;
        const equipped = state.saveData.inventory?.filter(i => i?.equipped) || [];
        
        // Sync starting parameters
        if (hero) {
          engine.updateState(
            hero.level,
            hero.prestigePoints,
            equipped,
            activeStage,
            hero.heroClass,
            hero.name || 'Hero',
            useLanguageStore.getState().language,
            hero.shardUpgrades,
            hero.potions,
            hero.autoUsePotion,
            hero.autoBuyPotions,
            hero.gold,
            hero.goldUpgrades
          );
        }
        
        // Generate monster for stage and boot combat
        const monster = generateMonsterForStage(activeStage, hero?.level || 1, state.saveData.monsterResearch, state.saveData.currentWave || 1);
        engine.startBattle(monster, state.saveData.currentWave || 1);
      }
    }).catch((err) => {
      console.error("PixiJS Engine initialization failed:", err);
      setInitError(`Engine Init: ${err.message || String(err)}`);
    });

    // Keep local tracks of previous values to avoid using deprecated/removed prevState in Zustand subscribe
     const initialStoreState = useGameStore.getState();
     let lastLevel = initialStoreState.saveData?.hero?.level;
     let lastPrestige = initialStoreState.saveData?.hero?.prestigePoints;
     let lastStage = initialStoreState.saveData?.activeStage;
     let lastClass = initialStoreState.saveData?.hero?.heroClass;
     let lastName = initialStoreState.saveData?.hero?.name;
     let lastBattleMode = initialStoreState.battleMode;
     const lastEquippedIdsVal = (initialStoreState.saveData?.inventory || [])
       .filter(i => i?.equipped)
       .map(i => `${i.id}_${i.level}`)
       .join(',');
     let lastEquippedIds = lastEquippedIdsVal;
     let lastGoldUpgrades = JSON.stringify(initialStoreState.saveData?.hero?.goldUpgrades || {});
     let lastShardUpgrades = JSON.stringify(initialStoreState.saveData?.hero?.shardUpgrades || {});

     // Subscribe to Zustand store modifications
     const unsubscribe = useGameStore.subscribe((state) => {
       try {
         if (!state.saveData) return;

         const currentEquippedIds = (state.saveData.inventory || [])
           .filter(i => i?.equipped)
           .map(i => `${i.id}_${i.level}`)
           .join(',');

         const currentGoldUpgrades = JSON.stringify(state.saveData.hero?.goldUpgrades || {});
         const currentShardUpgrades = JSON.stringify(state.saveData.hero?.shardUpgrades || {});

         const equippedChanged = currentEquippedIds !== lastEquippedIds;
         const levelChanged = state.saveData.hero?.level !== lastLevel;
         const prestigeChanged = state.saveData.hero?.prestigePoints !== lastPrestige;
         const stageChanged = state.saveData.activeStage !== lastStage;
         const classChanged = state.saveData.hero?.heroClass !== lastClass;
         const nameChanged = state.saveData.hero?.name !== lastName;
         const battleModeChanged = state.battleMode !== lastBattleMode;
         const goldUpgradesChanged = currentGoldUpgrades !== lastGoldUpgrades;
         const shardUpgradesChanged = currentShardUpgrades !== lastShardUpgrades;

         if (equippedChanged || levelChanged || prestigeChanged || stageChanged || classChanged || nameChanged || battleModeChanged || goldUpgradesChanged || shardUpgradesChanged) {
           const hero = state.saveData.hero;
           const activeStage = state.saveData.activeStage;
           const equipped = state.saveData.inventory?.filter(i => i?.equipped) || [];
           
           // Update local cache IMMEDIATELY to prevent recursive re-entrancy via synchronous store updates
           if (hero) {
             lastLevel = hero.level;
             lastPrestige = hero.prestigePoints;
             lastClass = hero.heroClass;
             lastName = hero.name;
           }
           lastStage = activeStage;
           lastEquippedIds = currentEquippedIds;
           lastGoldUpgrades = currentGoldUpgrades;
           lastShardUpgrades = currentShardUpgrades;
           lastBattleMode = state.battleMode;

          if (battleModeChanged) {
            if (state.battleMode === 'guild_boss') {
              const voidBehemothTemplate = {
                id: 'void_behemoth',
                name: 'Void Behemoth',
                level: 80,
                baseStats: {
                  maxHp: 50000,
                  attack: 85,
                  defense: 35,
                  speed: 90,
                  critRate: 0.1,
                  critDamage: 1.5
                },
                expReward: 5000,
                goldRewardRange: [10000, 15000] as [number, number],
                dropChance: 1.0,
                dropPool: ['knight_sword_legendary', 'mage_staff_legendary', 'assassin_dagger_legendary']
              };

              const guildMembers = [
                { name: hero?.name || 'Player', heroClass: hero?.heroClass || 'knight', level: hero?.level || 1 },
                { name: 'Vanguard Order', heroClass: 'knight' as const, level: Math.max(1, (hero?.level || 1) - 2) },
                { name: 'Spellweaver', heroClass: 'mage' as const, level: Math.max(1, (hero?.level || 1) + 1) },
                { name: 'Silent Blade', heroClass: 'assassin' as const, level: Math.max(1, (hero?.level || 1) - 1) }
              ];

              engine.startGuildRaid(voidBehemothTemplate, guildMembers);
            } else if (state.battleMode === 'dungeon') {
              const dungeonId = state.activeDungeonId || 'gem_1';
              const bossInfo = DUNGEON_BOSSES_TEMPLATES[dungeonId] || DUNGEON_BOSSES_TEMPLATES.gem_1;
              const currentLang = useLanguageStore.getState().language;
              
              const bossTemplate = {
                id: dungeonId,
                name: currentLang === 'vi' ? bossInfo.nameVi : bossInfo.nameEn,
                level: dungeonId.endsWith('_3') ? 45 : dungeonId.endsWith('_2') ? 25 : 10,
                baseStats: {
                  maxHp: bossInfo.maxHp,
                  attack: bossInfo.attack,
                  defense: bossInfo.defense,
                  speed: bossInfo.speed,
                  critRate: 0.1,
                  critDamage: 1.5
                },
                expReward: 100,
                goldRewardRange: [0, 0] as [number, number],
                dropChance: 0,
                dropPool: []
              };
              engine.startDungeonBattle(bossTemplate);
            } else if (lastBattleMode === 'dungeon' && state.battleMode === 'stage') {
              engine.exitDungeonMode();
            } else {
              engine.exitGuildRaid();
            }
          } else {
            if (hero) {
              engine.updateState(
                hero.level,
                hero.prestigePoints,
                equipped,
                activeStage,
                hero.heroClass,
                hero.name || 'Hero',
                useLanguageStore.getState().language,
                hero.shardUpgrades,
                hero.potions,
                hero.autoUsePotion,
                hero.autoBuyPotions,
                hero.gold,
                hero.goldUpgrades
              );
            }

            if ((stageChanged || levelChanged) && state.battleMode === 'stage') {
              const monster = generateMonsterForStage(activeStage, hero?.level || 1, state.saveData.monsterResearch, state.saveData.currentWave || 1);
              engine.startBattle(monster, state.saveData.currentWave || 1);
            }
          }
        }
      } catch (err: any) {
        console.error("PixiJS Engine state update failed:", err);
        setInitError(`Engine Update: ${err.stack || err.message || String(err)}`);
      }
    });

    const unsubscribeLang = useLanguageStore.subscribe((langState) => {
      const state = useGameStore.getState();
      if (state.saveData && state.saveData.hero && engineRef.current) {
        const hero = state.saveData.hero;
        const equipped = state.saveData.inventory?.filter(i => i?.equipped) || [];
        engineRef.current.updateState(
          hero.level,
          hero.prestigePoints,
          equipped,
          state.saveData.activeStage,
          hero.heroClass,
          hero.name || 'Hero',
          langState.language,
          hero.shardUpgrades,
          hero.potions,
          hero.autoUsePotion,
          hero.autoBuyPotions,
          hero.gold,
          hero.goldUpgrades
        );
      }
    });

    return () => {
      unsubscribe();
      unsubscribeLang();
      useGameStore.getState().registerEngine(null);
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
    };
  }, []);

  return (
    <div className="w-full h-full relative overflow-hidden bg-slate-950 flex items-center justify-center">
      {/* Dark overlay for contrast */}
      <div className="absolute inset-0 bg-slate-950/20 pointer-events-none" />

      {/* Absolute canvas container */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full z-10" />
      
      {/* Graceful Canvas Error Overlay */}
      {initError && (
        <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center z-20">
          <span className="text-3xl mb-3">⚠️</span>
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
            Canvas Graphics Failure
          </h4>
          <p className="text-[10px] text-slate-400 max-w-xs leading-relaxed mb-4">
            WebGL is not supported or failed to start in your environment. The game will run in log-only mode.
          </p>
          <div className="text-[9px] bg-red-950/30 border border-red-500/20 text-red-400 rounded-lg p-2 max-w-xs break-all font-mono">
            {initError}
          </div>
        </div>
      )}
      
      {/* Gradient Vignette overlay for RPG mood */}
      <div className="absolute inset-0 pointer-events-none bg-radial-vignette opacity-20 border border-slate-900 rounded-2xl" />

      {/* Hero Defeated Revival Modal Overlay */}
      {isDead && saveData && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-4 text-center z-30 select-none animate-fade-in">
          {/* Gravestone logo */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-red-950/50 border border-red-500/30 flex items-center justify-center text-3xl sm:text-4xl shadow-[0_0_25px_rgba(239,68,68,0.3)] animate-pulse mb-3 sm:mb-4">
            ☠️
          </div>
          
          <h3 className="text-base sm:text-xl font-black text-rose-500 tracking-wider uppercase drop-shadow-[0_0_10px_rgba(244,63,94,0.4)] mb-1">
            {t('revive_title')}
          </h3>
          <p className="text-[10px] sm:text-xs text-slate-400 max-w-sm mb-4 sm:mb-5 px-4 leading-normal">
            {useLanguageStore.getState().language === 'vi' 
              ? 'Anh hùng ngã xuống! Đang hồi sinh về Wave 1 để tiếp tục rèn luyện chỉ số...' 
              : 'Hero defeated! Reviving at Wave 1 to continue training stats...'}
          </p>

          {/* Countdown display */}
          <div className="mt-2 text-[10.5px] sm:text-xs text-rose-455 font-bold font-mono tracking-wide bg-rose-950/35 border border-rose-900/40 px-4 py-2 rounded-full shadow-inner animate-pulse">
            ⏳ {useLanguageStore.getState().language === 'vi' ? `Tự động hồi sinh sau ${reviveCountdown} giây...` : `Auto-reviving in ${reviveCountdown}s...`}
          </div>
        </div>
      )}
    </div>
  );
};
