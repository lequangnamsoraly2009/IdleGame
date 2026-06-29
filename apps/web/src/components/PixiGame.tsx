import React, { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../stores/gameStore';
import { GameEngine } from '@idle-rpg/engine';
import { generateMonsterForStage } from '@idle-rpg/shared';

export const PixiGame: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const [initError, setInitError] = useState<string | null>(null);

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
        }
      });
      engineRef.current = engine;
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
          engine.updateState(hero.level, hero.prestigePoints, equipped, activeStage, hero.heroClass);
        }
        
        // Generate monster for stage and boot combat
        const monster = generateMonsterForStage(activeStage, hero?.level || 1, state.saveData.monsterResearch);
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
    let lastBattleMode = initialStoreState.battleMode;
    let lastEquippedIds = (initialStoreState.saveData?.inventory || [])
      .filter(i => i?.equipped)
      .map(i => `${i.id}_${i.level}`)
      .join(',');

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
        const battleModeChanged = state.battleMode !== lastBattleMode;

        if (equippedChanged || levelChanged || prestigeChanged || stageChanged || classChanged || battleModeChanged) {
          const hero = state.saveData.hero;
          const activeStage = state.saveData.activeStage;
          const equipped = state.saveData.inventory?.filter(i => i?.equipped) || [];
          
          // Update local cache IMMEDIATELY to prevent recursive re-entrancy via synchronous store updates
          if (hero) {
            lastLevel = hero.level;
            lastPrestige = hero.prestigePoints;
            lastClass = hero.heroClass;
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
                { name: state.user?.email?.split('@')[0] || 'Player', heroClass: hero?.heroClass || 'knight', level: hero?.level || 1 },
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
              engine.updateState(hero.level, hero.prestigePoints, equipped, activeStage, hero.heroClass);
            }

            if ((stageChanged || levelChanged) && state.battleMode === 'stage') {
              const monster = generateMonsterForStage(activeStage, hero?.level || 1, state.saveData.monsterResearch);
              engine.startBattle(monster);
            }
          }
        }
      } catch (err: any) {
        console.error("PixiJS Engine state update failed:", err);
        setInitError(`Engine Update: ${err.stack || err.message || String(err)}`);
      }
    });

    return () => {
      unsubscribe();
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
    };
  }, []);

  return (
    <div className="w-full h-full relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/60 shadow-inner flex items-center justify-center">
      {/* Absolute canvas container */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />
      
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
    </div>
  );
};
