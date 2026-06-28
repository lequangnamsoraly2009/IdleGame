import React, { useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { DEFAULT_ITEM_TEMPLATES, createItemInstance } from '@idle-rpg/shared';

interface PullResult {
  name: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

export const SummonTab: React.FC = () => {
  const { saveData, summonEquipment, addLogMessage } = useGameStore();
  const [isOpening, setIsOpening] = useState(false);
  const [recentPulls, setRecentPulls] = useState<PullResult[]>([]);

  if (!saveData) return null;

  const { hero, inventory } = saveData;

  const rollRarity = (): 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' => {
    const rand = Math.random();
    if (rand < 0.012) return 'legendary'; // 1.2%
    if (rand < 0.07) return 'epic';       // 5.8%
    if (rand < 0.25) return 'rare';       // 18%
    if (rand < 0.55) return 'uncommon';   // 30%
    return 'common';                      // 45%
  };

  const executeSummonTen = () => {
    if (hero.diamonds < 90) {
      addLogMessage('Not enough diamonds for 10x Summon!', 'system');
      return;
    }

    const spaceLeft = 50 - inventory.length;
    if (spaceLeft < 10) {
      addLogMessage(`Not enough inventory space! You need at least 10 free slots (Current space: ${spaceLeft}).`, 'system');
      return;
    }

    setIsOpening(true);
    setRecentPulls([]);

    setTimeout(() => {
      const results: PullResult[] = [];
      const newItems: any[] = [];
      
      const counts = { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 };

      for (let i = 0; i < 10; i++) {
        const rarity = rollRarity();
        counts[rarity]++;
        const eligibleTemplates = DEFAULT_ITEM_TEMPLATES.filter(t => t.rarity === rarity);
        const template = eligibleTemplates[Math.floor(Math.random() * eligibleTemplates.length)];
        
        const itemLvl = Math.max(1, Math.floor(saveData.activeStage / 6));
        const newItem = createItemInstance(template, itemLvl);
        
        newItems.push(newItem);
        results.push({ name: newItem.name, rarity: newItem.rarity });
      }

      // Deduct diamonds and append items
      useGameStore.setState(state => {
        if (state.saveData) {
          return {
            saveData: {
              ...state.saveData,
              hero: {
                ...state.saveData.hero,
                diamonds: state.saveData.hero.diamonds - 90
              },
              inventory: [...state.saveData.inventory, ...newItems]
            }
          };
        }
        return {};
      });

      setRecentPulls(results);
      setIsOpening(false);
      
      const summary = `10x SUMMON: ${counts.legendary} Legendary ⭐, ${counts.epic} Epic 💜, ${counts.rare} Rare 💙, ${counts.uncommon} Uncommon 💚, ${counts.common} Common 🪨`;
      addLogMessage(summary, 'loot');

    }, 1200); // 1.2 second shaker animation
  };

  const executeSummonSingle = () => {
    if (hero.diamonds < 10) {
      addLogMessage('Not enough diamonds for Summon!', 'system');
      return;
    }

    if (inventory.length >= 50) {
      addLogMessage('Inventory full! Clear items before summoning.', 'system');
      return;
    }

    setIsOpening(true);
    setRecentPulls([]);

    setTimeout(() => {
      // Execute the store summon action
      summonEquipment();
      
      // Determine what they just pulled to show on screen
      // (look at the last item added to the new inventory)
      setTimeout(() => {
        const currentStore = useGameStore.getState();
        if (currentStore.saveData) {
          const inv = currentStore.saveData.inventory;
          const lastItem = inv[inv.length - 1];
          if (lastItem) {
            setRecentPulls([{ name: lastItem.name, rarity: lastItem.rarity }]);
          }
        }
        setIsOpening(false);
      }, 50);
    }, 1000);
  };

  const getRarityBadgeColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-slate-500/10 text-slate-400 border border-slate-800';
      case 'uncommon': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'rare': return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      case 'epic': return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
      case 'legendary': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold';
      default: return 'bg-slate-500';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full overflow-y-auto pr-1">
      {/* Gacha Portal View */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 flex flex-col items-center justify-center relative overflow-hidden min-h-[340px]">
        {/* Glow behind the chest */}
        <div className="absolute w-[200px] h-[200px] bg-indigo-500/10 rounded-full blur-[50px] pointer-events-none" />

        {/* Chest Visual */}
        <div className={`text-7xl mb-8 relative transition-transform duration-75 select-none ${
          isOpening ? 'animate-bounce scale-110' : 'hover:scale-[1.05]'
        }`}>
          🎁
          {isOpening && (
            <span className="absolute -top-3 -right-3 text-2xl animate-ping">✨</span>
          )}
        </div>

        <h3 className="text-lg font-extrabold text-white mb-1 font-display">
          Aetherial Armory Chest
        </h3>
        <p className="text-xs text-slate-400 text-center max-w-[280px] mb-8 leading-relaxed">
          Unlock high-grade legendary swords, plates, rings, or boots. Rarity ranges from Common to Legendary!
        </p>

        {/* Draw Buttons */}
        <div className="flex gap-4 w-full max-w-sm">
          {/* Summon x1 */}
          <button
            onClick={executeSummonSingle}
            disabled={isOpening || hero.diamonds < 10}
            className="flex-1 bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-slate-700 text-white text-xs font-extrabold py-3 px-3 rounded-xl transition active:scale-[0.98] disabled:opacity-40"
          >
            <span className="block">Summon x1</span>
            <span className="text-[10px] text-blue-400 font-bold">10 Gems 💎</span>
          </button>

          {/* Summon x10 */}
          <button
            onClick={executeSummonTen}
            disabled={isOpening || hero.diamonds < 90}
            className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-extrabold py-3 px-3 rounded-xl border border-indigo-400/20 active:scale-[0.98] shadow shadow-indigo-500/10 transition disabled:opacity-40"
          >
            <span className="block">Summon x10</span>
            <span className="text-[10px] text-yellow-300 font-bold">90 Gems 💎 <span className="text-[9px] text-yellow-400 line-through">100</span></span>
          </button>
        </div>
      </div>

      {/* Pull Results View */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 flex flex-col justify-between h-full min-h-[340px]">
        <div>
          <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-3.5 flex items-center gap-1.5">
            🎁 Draw Results
          </h4>
          
          {recentPulls.length > 0 ? (
            <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
              {recentPulls.map((pull, idx) => (
                <div
                  key={idx}
                  className={`flex justify-between items-center text-xs p-2 rounded-lg ${getRarityBadgeColor(pull.rarity)}`}
                >
                  <span className="font-semibold">{pull.name}</span>
                  <span className="text-[9px] font-extrabold uppercase tracking-wide">
                    {pull.rarity}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500 text-center h-[200px]">
              <span className="text-3xl mb-1.5">💤</span>
              <span className="text-xs uppercase tracking-wider font-semibold">No Draws Yet</span>
              <p className="text-[10px] text-slate-600 max-w-[180px] mt-0.5">
                Pulls will show up here after opening Aetherial chests.
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-slate-850 pt-3 text-[10px] text-slate-500 space-y-1">
          <div className="flex justify-between">
            <span>Rarities Drop Rate:</span>
            <span>Com: 45% | Unc: 30% | Rare: 18% | Epic: 6% | Leg: 1.2%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
