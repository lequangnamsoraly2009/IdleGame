import React, { useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { DEFAULT_ITEM_TEMPLATES, createItemInstance } from '@idle-rpg/shared';
import { useTranslation, getTranslatedItemName } from '../../utils/i18n';
import { ItemGraphic } from '../ItemGraphic';

interface PullResult {
  templateId: string;
  name: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  slot: 'weapon' | 'armor' | 'helmet' | 'boots' | 'ring';
}

export const SummonTab: React.FC = () => {
  const { saveData, summonEquipment, addLogMessage } = useGameStore();
  const { t } = useTranslation();
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
      addLogMessage(t('insufficient_diamonds'), 'system');
      return;
    }

    const spaceLeft = 50 - inventory.length;
    if (spaceLeft < 10) {
      addLogMessage(t('summon_inventory_10x', { space: spaceLeft }), 'system');
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
        results.push({ 
          templateId: newItem.templateId, 
          name: newItem.name, 
          rarity: newItem.rarity,
          slot: newItem.slot
        });
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
      
      const summary = t('log_summon_ten', {
        legendary: counts.legendary,
        epic: counts.epic,
        rare: counts.rare,
        uncommon: counts.uncommon,
        common: counts.common
      });
      addLogMessage(summary, 'loot');

    }, 1200); // 1.2 second shaker animation
  };

  const executeSummonSingle = () => {
    if (hero.diamonds < 10) {
      addLogMessage(t('insufficient_diamonds'), 'system');
      return;
    }

    if (inventory.length >= 50) {
      addLogMessage(t('summon_inventory_warning'), 'system');
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
            setRecentPulls([{ 
              templateId: lastItem.templateId, 
              name: lastItem.name, 
              rarity: lastItem.rarity,
              slot: lastItem.slot
            }]);
          }
        }
        setIsOpening(false);
      }, 50);
    }, 1000);
  };



  const getRarityUIStyles = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return {
          border: 'border-slate-800/80',
          bg: 'bg-slate-950/60',
          glow: '',
          text: 'text-slate-400',
          extraElements: null
        };
      case 'uncommon':
        return {
          border: 'border-emerald-500/35',
          bg: 'bg-emerald-950/20',
          glow: '',
          text: 'text-emerald-400',
          extraElements: (
            <>
              <div className="absolute top-1 left-1 w-1 h-1 bg-emerald-500/60 rounded-full pointer-events-none" />
              <div className="absolute top-1 right-1 w-1 h-1 bg-emerald-500/60 rounded-full pointer-events-none" />
              <div className="absolute bottom-1 left-1 w-1 h-1 bg-emerald-500/60 rounded-full pointer-events-none" />
              <div className="absolute bottom-1 right-1 w-1 h-1 bg-emerald-500/60 rounded-full pointer-events-none" />
            </>
          )
        };
      case 'rare':
        return {
          border: 'border-blue-500/40',
          bg: 'bg-blue-950/25',
          glow: 'shadow-[0_0_8px_rgba(59,130,246,0.2)]',
          text: 'text-blue-400',
          extraElements: (
            <>
              <div className="absolute top-1 left-1 border-t border-l border-blue-400/40 w-1.5 h-1.5 rounded-tl-sm pointer-events-none" />
              <div className="absolute bottom-1 right-1 border-b border-r border-blue-400/40 w-1.5 h-1.5 rounded-br-sm pointer-events-none" />
              <div className="absolute w-6 h-6 rounded-full border border-blue-500/5 bg-blue-500/5 pointer-events-none" />
            </>
          )
        };
      case 'epic':
        return {
          border: 'border-purple-500/70',
          bg: 'bg-purple-950/30',
          glow: 'shadow-[0_0_12px_rgba(168,85,247,0.35)]',
          text: 'text-purple-400',
          extraElements: (
            <>
              <div className="absolute inset-0.5 border border-purple-500/15 rounded-lg animate-pulse pointer-events-none" />
              <div className="absolute top-1 left-1 border-t border-l border-purple-400 w-1.5 h-1.5 rounded-tl-sm pointer-events-none" />
              <div className="absolute top-1 right-1 border-t border-r border-purple-400 w-1.5 h-1.5 rounded-tr-sm pointer-events-none" />
              <div className="absolute bottom-1 left-1 border-b border-l border-purple-400 w-1.5 h-1.5 rounded-bl-sm pointer-events-none" />
              <div className="absolute bottom-1 right-1 border-b border-r border-purple-400 w-1.5 h-1.5 rounded-br-sm pointer-events-none" />
              <div className="absolute w-8 h-8 rounded-full bg-purple-500/10 blur-sm animate-pulse pointer-events-none" />
            </>
          )
        };
      case 'legendary':
        return {
          border: 'border-transparent',
          bg: 'bg-gradient-to-br from-amber-500/30 via-yellow-600/15 to-orange-500/30',
          glow: 'shadow-[0_0_18px_rgba(245,158,11,0.55)] ring-1 ring-amber-400/20',
          text: 'text-amber-500 font-extrabold neon-text-gold',
          extraElements: (
            <>
              <div 
                className="absolute w-[180%] h-[180%] bg-[conic-gradient(from_0deg,transparent_10%,#f59e0b_45%,#fbbf24_55%,transparent_90%)] animate-spin pointer-events-none rounded-full" 
                style={{ animationDuration: '2.5s' }}
              />
              <div className="absolute inset-[1px] bg-slate-950 rounded-[11px] pointer-events-none" />
              
              <div className="absolute inset-0.5 bg-gradient-to-br from-amber-500/15 to-orange-600/10 rounded-[10px] pointer-events-none" />
              <div className="absolute w-8 h-8 rounded-full bg-amber-500/15 blur-sm animate-pulse pointer-events-none" />
              
              <div className="absolute top-0.5 left-0.5 text-[6px] animate-pulse text-amber-300 pointer-events-none">✨</div>
              <div className="absolute bottom-0.5 right-1 text-[6px] animate-pulse text-amber-300 pointer-events-none" style={{ animationDelay: '0.6s' }}>✨</div>
            </>
          )
        };
      default:
        return { border: 'border-slate-800', bg: 'bg-slate-900', glow: '', text: 'text-slate-400', extraElements: null };
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
          {t('summon_chest_title')}
        </h3>
        <p className="text-xs text-slate-400 text-center max-w-[280px] mb-8 leading-relaxed">
          {t('summon_desc')}
        </p>

        {/* Draw Buttons */}
        <div className="flex gap-4 w-full max-w-sm">
          {/* Summon x1 */}
          <button
            onClick={executeSummonSingle}
            disabled={isOpening || hero.diamonds < 10}
            className="flex-1 bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-slate-700 text-white text-xs font-extrabold py-3 px-3 rounded-xl transition active:scale-[0.98] disabled:opacity-40 cursor-pointer"
          >
            <span className="block">{t('summon_x1')}</span>
            <span className="text-[10px] text-blue-400 font-bold">10 💎</span>
          </button>

          {/* Summon x10 */}
          <button
            onClick={executeSummonTen}
            disabled={isOpening || hero.diamonds < 90}
            className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-extrabold py-3 px-3 rounded-xl border border-indigo-400/20 active:scale-[0.98] shadow shadow-indigo-500/10 transition disabled:opacity-40 cursor-pointer"
          >
            <span className="block">{t('summon_x10')}</span>
            <span className="text-[10px] text-yellow-300 font-bold">90 💎 <span className="text-[9px] text-yellow-400 line-through">100</span></span>
          </button>
        </div>
      </div>

      {/* Pull Results View */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 flex flex-col justify-between h-full min-h-[340px]">
        <div>
          <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-3.5 flex items-center gap-1.5 font-display">
            🎁 {t('summon_results')}
          </h4>
          
          {recentPulls.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[230px] overflow-y-auto pr-1 py-1">
              {recentPulls.map((pull, idx) => {
                const ui = getRarityUIStyles(pull.rarity);
                const shortName = getTranslatedItemName(t, pull);
                return (
                  <div
                    key={idx}
                    className={`aspect-square relative flex flex-col items-center justify-center border rounded-xl overflow-hidden shadow transition-all hover:scale-[1.03] select-none ${ui.border} ${ui.bg} ${ui.glow}`}
                    title={shortName}
                  >
                    {/* Rarity Specific Visuals */}
                    {ui.extraElements}

                    {/* Item Graphic Illustration */}
                    <ItemGraphic templateId={pull.templateId} className="w-11 h-11 mb-1 relative z-10" />

                    {/* Name Badge */}
                    <span className="text-[7px] font-bold uppercase tracking-tight relative z-10 bg-slate-950/70 px-1 py-0.5 rounded text-slate-300 max-w-[90%] truncate">
                      {shortName}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500 text-center h-[200px]">
              <span className="text-3xl mb-1.5">💤</span>
              <span className="text-xs uppercase tracking-wider font-semibold">{t('summon_no_draws')}</span>
              <p className="text-[10px] text-slate-600 max-w-[180px] mt-0.5">
                {t('summon_no_draws_desc')}
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-slate-850 pt-3 text-[10px] text-slate-500 space-y-1">
          <div className="flex justify-between">
            <span>{t('summon_drop_rates')}</span>
            <span>{t('summon_rate_info')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
