import React from 'react';
import { useGameStore } from '../../stores/gameStore';

export const ShopTab: React.FC = () => {
  const { saveData, buyGoldPack, addLogMessage } = useGameStore();

  if (!saveData) return null;

  const { hero, inventory } = saveData;

  const handleSellAllCommons = () => {
    const commons = inventory.filter(item => item.rarity === 'common' && !item.equipped);
    if (commons.length === 0) {
      addLogMessage('No unequipped common items in bag to sell.', 'system');
      return;
    }

    let totalGoldGained = 0;
    commons.forEach(item => {
      // 30% of base upgrade cost
      const baseCost = 50; // common base cost
      const sellPrice = Math.floor(baseCost * 0.3 * (1 + (item.level - 1) * 0.1));
      totalGoldGained += sellPrice;
    });

    // Bulk delete from inventory and add gold
    useGameStore.setState(state => {
      if (state.saveData) {
        return {
          saveData: {
            ...state.saveData,
            hero: {
              ...state.saveData.hero,
              gold: state.saveData.hero.gold + totalGoldGained
            },
            inventory: state.saveData.inventory.filter(item => !(item.rarity === 'common' && !item.equipped))
          }
        };
      }
      return {};
    });

    addLogMessage(`Bulk Sold: Cleared ${commons.length} common items for ${totalGoldGained} Gold 🪙!`, 'system');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full overflow-y-auto pr-1">
      {/* Left Column: Diamond Exchange */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 flex flex-col justify-between">
        <div>
          <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            💎 Diamond Exchange
          </h4>
          <p className="text-xs text-slate-400 leading-relaxed mb-4">
            Convert premium diamonds into massive amounts of immediate gold to accelerate equipment level-ups.
          </p>

          <div className="bg-slate-950/60 border border-slate-900 rounded-xl p-4 text-center">
            <span className="text-3xl block mb-2">🪙</span>
            <span className="text-sm font-extrabold text-white block">
              Bag of Gold
            </span>
            <span className="text-[10px] text-slate-500 block mb-4">
              Yields: {800 * saveData.activeStage} Gold (scales with Stage)
            </span>

            <button
              onClick={buyGoldPack}
              disabled={hero.diamonds < 15}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold py-2.5 px-4 rounded-xl border border-blue-400/20 active:scale-[0.98] transition flex justify-between items-center disabled:opacity-40"
            >
              <span>Buy Pack</span>
              <span className="bg-slate-950/40 text-blue-300 px-2 py-0.5 rounded font-bold border border-blue-500/20">
                15 Gems 💎
              </span>
            </button>
          </div>
        </div>

        <div className="text-[10px] text-slate-500 mt-2 text-center">
          Gold drops and pack values increase as you clear higher stages.
        </div>
      </div>

      {/* Center Column: Temporary Buffs */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 flex flex-col justify-between">
        <div>
          <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            ⚡ Combat Boosters
          </h4>
          <p className="text-xs text-slate-400 leading-relaxed mb-4">
            Spend diamonds to activate magical buffs that increase your combat efficiency.
          </p>

          <div className="space-y-3">
            {/* Speed Elixir */}
            <div className="p-3 bg-slate-950/50 border border-slate-850 rounded-xl flex justify-between items-center">
              <div className="text-left">
                <span className="text-xs font-bold text-white block">Speed Elixir</span>
                <span className="text-[9px] text-slate-500">+50% attack speed for 5m</span>
              </div>
              <button
                onClick={() => {
                  if (hero.diamonds < 10) {
                    addLogMessage('Not enough diamonds!', 'system');
                    return;
                  }
                  useGameStore.setState(state => {
                    if (state.saveData) {
                      return {
                        saveData: { ...state.saveData, hero: { ...state.saveData.hero, diamonds: state.saveData.hero.diamonds - 10 } }
                      };
                    }
                    return {};
                  });
                  addLogMessage('Purchased Speed Elixir! Hero is moving with double speed (visual effect mock).', 'system');
                }}
                disabled={hero.diamonds < 10}
                className="bg-blue-900/50 hover:bg-blue-900 border border-blue-800 text-blue-400 text-[10px] font-bold px-2 py-1.5 rounded transition disabled:opacity-30"
              >
                10 Gems
              </button>
            </div>

            {/* EXP Charm */}
            <div className="p-3 bg-slate-950/50 border border-slate-850 rounded-xl flex justify-between items-center">
              <div className="text-left">
                <span className="text-xs font-bold text-white block">EXP Charm</span>
                <span className="text-[9px] text-slate-500">+100% monster EXP for 5m</span>
              </div>
              <button
                onClick={() => {
                  if (hero.diamonds < 10) {
                    addLogMessage('Not enough diamonds!', 'system');
                    return;
                  }
                  useGameStore.setState(state => {
                    if (state.saveData) {
                      return {
                        saveData: { ...state.saveData, hero: { ...state.saveData.hero, diamonds: state.saveData.hero.diamonds - 10 } }
                      };
                    }
                    return {};
                  });
                  addLogMessage('Purchased EXP Charm! Monster EXP reward doubled (visual effect mock).', 'system');
                }}
                disabled={hero.diamonds < 10}
                className="bg-blue-900/50 hover:bg-blue-900 border border-blue-800 text-blue-400 text-[10px] font-bold px-2 py-1.5 rounded transition disabled:opacity-30"
              >
                10 Gems
              </button>
            </div>
          </div>
        </div>

        <div className="text-[10px] text-slate-500 mt-2 text-center">
          Buff timers are simulated. Multiple buffs can accumulate.
        </div>
      </div>

      {/* Right Column: Inventory Management */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 flex flex-col justify-between">
        <div>
          <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            🧹 Liquidation Service
          </h4>
          <p className="text-xs text-slate-400 leading-relaxed mb-4">
            Running out of inventory space? Instantly sell all unequipped **Common (Gray)** items in your bag for immediate gold.
          </p>

          <div className="bg-slate-950/60 border border-slate-900 rounded-xl p-4 text-center">
            <span className="text-3xl block mb-2">🗑️</span>
            <span className="text-xs font-semibold text-slate-400 block mb-1">
              Common Items count:
            </span>
            <span className="text-xl font-extrabold text-slate-300 block mb-4">
              {inventory.filter(item => item.rarity === 'common' && !item.equipped).length} Items
            </span>

            <button
              onClick={handleSellAllCommons}
              disabled={inventory.filter(item => item.rarity === 'common' && !item.equipped).length === 0}
              className="w-full bg-red-600/10 hover:bg-red-600/20 border border-red-500/30 text-red-400 text-xs font-extrabold py-3 px-4 rounded-xl transition active:scale-[0.98] disabled:opacity-30 disabled:pointer-events-none"
            >
              🧹 Sell All Commons
            </button>
          </div>
        </div>

        <div className="text-[10px] text-slate-500 mt-2 text-center">
          Equipped items are never sold. Rare, Epic and Legendary items must be sold individually.
        </div>
      </div>
    </div>
  );
};
