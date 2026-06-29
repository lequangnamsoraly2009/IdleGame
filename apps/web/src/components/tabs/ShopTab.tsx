import React, { useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { useTranslation } from '../../utils/i18n';
import { useLanguageStore } from '../../stores/languageStore';
import { SummonTab } from './SummonTab';

// Force HMR reload trigger: v2
export const ShopTab: React.FC = () => {
  const { saveData, buyGoldPack, addLogMessage } = useGameStore();
  const { t } = useTranslation();
  const { language } = useLanguageStore();
  const [subTab, setSubTab] = useState<'shop' | 'summon'>('shop');

  if (!saveData) return null;

  const { hero, inventory } = saveData;

  const handleSellAllCommons = () => {
    const commons = inventory.filter(item => item.rarity === 'common' && !item.equipped);
    if (commons.length === 0) {
      addLogMessage(t('log_shop_no_commons'), 'system');
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

    addLogMessage(t('log_shop_bulk_sold', { count: commons.length, gold: totalGoldGained }), 'system');
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Sub tabs selector */}
      <div className="flex gap-1 bg-slate-950/85 p-1.5 rounded-xl border border-slate-900 mb-4 select-none shrink-0 max-w-fit">
        {([
          { id: 'shop', label: language === 'vi' ? '💰 Cửa Hàng' : '💰 Shop' },
          { id: 'summon', label: language === 'vi' ? '🎁 Triệu Hồi' : '🎁 Summon' }
        ] as const).map(tab => (
          <button
            key={tab.id}
            onClick={() => setSubTab(tab.id)}
            className={`text-[10px] sm:text-xs font-bold py-2 px-4 rounded-lg cursor-pointer transition active:scale-95 ${
              subTab === tab.id
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/10'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Sub tab content */}
      <div className="flex-1 overflow-hidden relative">
        {subTab === 'shop' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full overflow-y-auto pr-1 pb-4 scrollbar-thin">
            {/* Left Column: Diamond Exchange */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-2.5 flex items-center gap-1.5 font-display">
                  💎 {t('gold_market')}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  {t('shop_desc')}
                </p>

                <div className="bg-slate-950/60 border border-slate-900 rounded-xl p-4 text-center">
                  <span className="text-3xl block mb-2">💰</span>
                  <span className="text-sm font-extrabold text-white block">
                    {t('gold_pack_title')}
                  </span>
                  <span className="text-[10px] text-slate-500 block mb-4">
                    {t('gold_pack_desc', { gold: 800 * saveData.activeStage })}
                  </span>

                  <button
                    onClick={buyGoldPack}
                    disabled={hero.diamonds < 15}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold py-2.5 px-4 rounded-xl border border-blue-400/20 active:scale-[0.98] transition flex justify-between items-center disabled:opacity-40 cursor-pointer"
                  >
                    <span>{t('buy_btn')}</span>
                    <span className="bg-slate-950/40 text-blue-300 px-2 py-0.5 rounded font-bold border border-blue-500/20">
                      15 💎
                    </span>
                  </button>
                </div>
              </div>

              <div className="text-[10px] text-slate-500 mt-2 text-center">
                {t('shop_gold_desc_scales')}
              </div>
            </div>

            {/* Center Column: Temporary Buffs */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-2.5 flex items-center gap-1.5 font-display">
                  {t('shop_boosters')}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  {t('shop_boosters_desc')}
                </p>

                <div className="space-y-3">
                  {/* Speed Elixir */}
                  <div className="p-3 bg-slate-950/50 border border-slate-850 rounded-xl flex justify-between items-center">
                    <div className="text-left">
                      <span className="text-xs font-bold text-white block">{t('shop_speed_elixir')}</span>
                      <span className="text-[9px] text-slate-500">{t('shop_speed_elixir_desc')}</span>
                    </div>
                    <button
                      onClick={() => {
                        if (hero.diamonds < 10) {
                          addLogMessage(t('insufficient_diamonds'), 'system');
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
                        addLogMessage(t('log_shop_speed_elixir'), 'system');
                      }}
                      disabled={hero.diamonds < 10}
                      className="bg-blue-900/50 hover:bg-blue-900 border border-blue-800 text-blue-400 text-[10px] font-bold px-2 py-1.5 rounded transition disabled:opacity-30 cursor-pointer"
                    >
                      10 💎
                    </button>
                  </div>

                  {/* EXP Charm */}
                  <div className="p-3 bg-slate-950/50 border border-slate-850 rounded-xl flex justify-between items-center">
                    <div className="text-left">
                      <span className="text-xs font-bold text-white block">{t('shop_exp_charm')}</span>
                      <span className="text-[9px] text-slate-500">{t('shop_exp_charm_desc')}</span>
                    </div>
                    <button
                      onClick={() => {
                        if (hero.diamonds < 10) {
                          addLogMessage(t('insufficient_diamonds'), 'system');
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
                        addLogMessage(t('log_shop_exp_charm'), 'system');
                      }}
                      disabled={hero.diamonds < 10}
                      className="bg-blue-900/50 hover:bg-blue-900 border border-blue-800 text-blue-400 text-[10px] font-bold px-2 py-1.5 rounded transition disabled:opacity-30 cursor-pointer"
                    >
                      10 💎
                    </button>
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-slate-500 mt-2 text-center">
                {t('shop_buff_simulated')}
              </div>
            </div>

            {/* Right Column: Inventory Management */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-2.5 flex items-center gap-1.5 font-display">
                  {t('shop_liquidation')}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  {t('shop_liquidation_desc')}
                </p>

                <div className="bg-slate-950/60 border border-slate-900 rounded-xl p-4 text-center">
                  <span className="text-3xl block mb-2">🗑️</span>
                  <span className="text-xs font-semibold text-slate-400 block mb-1">
                    {t('shop_common_count')}
                  </span>
                  <span className="text-xl font-extrabold text-slate-300 block mb-4">
                    {inventory.filter(item => item.rarity === 'common' && !item.equipped).length} {t('slot_empty')}
                  </span>

                  <button
                    onClick={handleSellAllCommons}
                    disabled={inventory.filter(item => item.rarity === 'common' && !item.equipped).length === 0}
                    className="w-full bg-red-600/10 hover:bg-red-600/20 border border-red-500/30 text-red-400 text-xs font-extrabold py-3 px-4 rounded-xl transition active:scale-[0.98] disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                  >
                    {t('shop_sell_all_commons')}
                  </button>
                </div>
              </div>

              <div className="text-[10px] text-slate-500 mt-2 text-center">
                {t('shop_liquidation_note')}
              </div>
            </div>
          </div>
        )}
        {subTab === 'summon' && <SummonTab />}
      </div>
    </div>
  );
};
