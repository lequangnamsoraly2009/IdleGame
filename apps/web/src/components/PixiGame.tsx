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

    // Create the engine
    const engine = new GameEngine((event) => {
      const store = useGameStore.getState();
      
      switch (event.type) {
        case 'BATTLE_TICK':
          store.syncBattleStats(event.heroHp, event.monsterHp, event.maxHeroHp, event.maxMonsterHp);
          break;
        case 'MONSTER_DEFEATED':
          store.onMonsterDefeated(event.exp, event.gold, event.diamonds, event.itemsDropped);
          break;
        case 'STAGE_ADVANCED':
          store.onStageChange(event.nextStage);
          break;
        case 'LOG_MESSAGE':
          store.addLogMessage(event.text, event.category);
          break;
      }
    });

    engineRef.current = engine;

    // Initialize engine on the container
    engine.init(containerRef.current).then(() => {
      const state = useGameStore.getState();
      if (state.saveData) {
        const hero = state.saveData.hero;
        const activeStage = state.saveData.activeStage;
        const equipped = state.saveData.inventory?.filter(i => i?.equipped) || [];
        
        // Sync starting parameters
        if (hero) {
          engine.updateState(hero.level, hero.prestigePoints, equipped, activeStage);
        }
        
        // Generate monster for stage and boot combat
        const monster = generateMonsterForStage(activeStage);
        engine.startBattle(monster);
      }
    }).catch((err) => {
      console.error("PixiJS Engine initialization failed:", err);
      setInitError(err.message || String(err));
    });

    // Keep local tracks of previous values to avoid using deprecated/removed prevState in Zustand subscribe
    const initialStoreState = useGameStore.getState();
    let lastLevel = initialStoreState.saveData?.hero?.level;
    let lastPrestige = initialStoreState.saveData?.hero?.prestigePoints;
    let lastStage = initialStoreState.saveData?.activeStage;
    let lastEquippedIds = (initialStoreState.saveData?.inventory || [])
      .filter(i => i?.equipped)
      .map(i => `${i.id}_${i.level}`)
      .join(',');

    // Subscribe to Zustand store modifications
    const unsubscribe = useGameStore.subscribe((state) => {
      if (!state.saveData) return;

      const currentEquippedIds = (state.saveData.inventory || [])
        .filter(i => i?.equipped)
        .map(i => `${i.id}_${i.level}`)
        .join(',');

      const equippedChanged = currentEquippedIds !== lastEquippedIds;
      const levelChanged = state.saveData.hero?.level !== lastLevel;
      const prestigeChanged = state.saveData.hero?.prestigePoints !== lastPrestige;
      const stageChanged = state.saveData.activeStage !== lastStage;

      if (equippedChanged || levelChanged || prestigeChanged || stageChanged) {
        const hero = state.saveData.hero;
        const activeStage = state.saveData.activeStage;
        const equipped = state.saveData.inventory?.filter(i => i?.equipped) || [];
        
        // Update local cache IMMEDIATELY to prevent recursive re-entrancy via synchronous store updates
        if (hero) {
          lastLevel = hero.level;
          lastPrestige = hero.prestigePoints;
        }
        lastStage = activeStage;
        lastEquippedIds = currentEquippedIds;

        if (hero) {
          engine.updateState(hero.level, hero.prestigePoints, equipped, activeStage);
        }

        if (stageChanged) {
          const monster = generateMonsterForStage(activeStage);
          engine.startBattle(monster);
        }
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
