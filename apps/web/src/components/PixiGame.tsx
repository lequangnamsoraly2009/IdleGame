import React, { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../stores/gameStore';
import { GameEngine } from '@idle-rpg/engine';
import { generateMonsterForStage } from '@idle-rpg/shared';
import { useTranslation } from '../utils/i18n';
import { useLanguageStore } from '../stores/languageStore';

export const PixiGame: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const [initError, setInitError] = useState<string | null>(null);
  
  const activeStage = useGameStore(state => state.saveData?.activeStage || 1);
  const { isDead, reviveCostGold, reviveCostDiamonds, reviveHero, saveData } = useGameStore();

  const getBackgroundUrl = (stage: number) => {
    const blockIndex = Math.floor((stage - 1) / 5);
    const cycle = blockIndex % 6;
    
    switch (cycle) {
      case 0:
        return '/battle_forest.png';  // Block 1: Stages 1-5 (Forest)
      case 1:
        return '/battle_cave.png';    // Block 2: Stages 6-10 (Crystal Cave)
      case 2:
        return '/battle_garden.png';  // Block 3: Stages 11-15 (Mythical Garden)
      case 3:
        return '/battle_volcano.png'; // Block 4: Stages 16-20 (Volcano Lava)
      case 4:
        return '/battle_sky.png';     // Block 5: Stages 21-25 (Sky Castle)
      case 5:
        return '/battle_ruins.png';   // Block 6: Stages 26-30 (Dark Ruins)
      default:
        return '/battle_forest.png';
    }
  };

  const { t } = useTranslation();
  const [reviveCountdown, setReviveCountdown] = useState(30);

  useEffect(() => {
    if (!isDead) return;
    setReviveCountdown(30);
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
            store.syncBattleStats(event.heroHp, event.monsterHp, event.maxHeroHp, event.maxMonsterHp, event.heroRage, event.monsterRage);
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
            hero.gold
          );
        }
        
        // Generate monster for stage and boot combat
        const monster = generateMonsterForStage(activeStage, hero?.level || 1, state.saveData.monsterResearch, state.saveData.currentWave || 1);
        engine.startBattle(monster);
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

     // Subscribe to Zustand store modifications
     const unsubscribe = useGameStore.subscribe((state) => {
       try {
         if (!state.saveData) return;

         const currentEquippedIds = (state.saveData.inventory || [])
           .filter(i => i?.equipped)
           .map(i => `${i.id}_${i.level}`)
           .join(',');

         const equippedChanged = currentEquippedIds !== lastEquippedIds;
         const levelChanged = state.saveData.hero?.level !== lastLevel;
         const prestigeChanged = state.saveData.hero?.prestigePoints !== lastPrestige;
         const stageChanged = state.saveData.activeStage !== lastStage;
         const classChanged = state.saveData.hero?.heroClass !== lastClass;
         const nameChanged = state.saveData.hero?.name !== lastName;
         const battleModeChanged = state.battleMode !== lastBattleMode;

         if (equippedChanged || levelChanged || prestigeChanged || stageChanged || classChanged || nameChanged || battleModeChanged) {
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
                hero.gold
              );
            }

            if ((stageChanged || levelChanged) && state.battleMode === 'stage') {
              const monster = generateMonsterForStage(activeStage, hero?.level || 1, state.saveData.monsterResearch, state.saveData.currentWave || 1);
              engine.startBattle(monster);
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
          hero.autoUsePotion
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
    <div className="w-full h-full relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/90 shadow-inner flex items-center justify-center">
      {/* Dynamic Environment Background Image */}
      <div 
        className="absolute inset-0 w-full h-full bg-cover bg-bottom transition-all duration-700 ease-in-out opacity-55 pointer-events-none"
        style={{ backgroundImage: `url(${getBackgroundUrl(activeStage)})` }}
      />
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
            {t('revive_subtitle')}
          </p>

          {/* Options deck */}
          <div className="flex flex-col gap-2 w-full max-w-[280px] sm:max-w-[310px] px-2">
            
            {/* OPTION 1: Revive with Gold */}
            <button
              onClick={() => reviveHero('gold')}
              disabled={saveData.hero.gold < reviveCostGold}
              className="group relative flex flex-col items-center justify-center bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-450 hover:to-yellow-400 disabled:from-slate-800 disabled:to-slate-800 text-slate-950 disabled:text-slate-500 font-black py-1.5 px-3 sm:py-2 sm:px-4 rounded-xl shadow-lg hover:shadow-yellow-500/10 active:scale-[0.98] transition cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
            >
              <div className="flex items-center gap-1.5 text-xs sm:text-sm">
                <span>💰</span>
                <span>{t('revive_gold')}</span>
              </div>
              <div className="text-[9px] font-bold opacity-80 mt-0.5">
                {reviveCostGold.toLocaleString()} G
              </div>
            </button>

            {/* OPTION 2: Revive with Diamonds */}
            <button
              onClick={() => reviveHero('diamonds')}
              disabled={saveData.hero.diamonds < reviveCostDiamonds}
              className="group relative flex flex-col items-center justify-center bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-slate-800 disabled:to-slate-800 text-white disabled:text-slate-500 font-bold py-1.5 px-3 sm:py-2 sm:px-4 rounded-xl shadow-lg hover:shadow-blue-500/10 active:scale-[0.98] transition cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
            >
              <div className="flex items-center gap-1.5 text-xs sm:text-sm">
                <span>💎</span>
                <span>{t('revive_diamonds')}</span>
              </div>
              <div className="text-[9px] font-medium opacity-95 mt-0.5">
                {reviveCostDiamonds} 💎
              </div>
            </button>

            {/* divider line */}
            <div className="flex items-center my-0.5">
              <div className="flex-1 h-[1px] bg-slate-900" />
              <span className="px-3 text-[9px] text-slate-600 uppercase tracking-widest font-mono">or</span>
              <div className="flex-1 h-[1px] bg-slate-900" />
            </div>

            {/* OPTION 3: Free revive immediately */}
            <button
              onClick={() => reviveHero('time')}
              className="flex flex-col items-center justify-center border border-slate-800 bg-slate-900/60 hover:bg-slate-850 hover:border-slate-700 text-slate-300 font-bold py-2.5 px-3 sm:px-4 rounded-xl active:scale-[0.98] transition cursor-pointer"
            >
              <div className="text-xs">
                {t('revive_time')}
              </div>
            </button>

          </div>

          {/* Countdown display */}
          <div className="mt-4 text-[10px] sm:text-xs text-rose-400 font-bold font-mono tracking-wide bg-rose-950/20 border border-rose-900/30 px-3.5 py-1.5 rounded-full shadow-inner animate-pulse">
            ⏳ {t('revive_countdown', { seconds: reviveCountdown })}
          </div>
        </div>
      )}
    </div>
  );
};
