import React, { useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { useTranslation } from '../../utils/i18n';
import { useLanguageStore } from '../../stores/languageStore';
import { SummonTab } from './SummonTab';
import { ItemGraphic } from '../ItemGraphic';
import { calculateDismantleRewards } from '@idle-rpg/shared';

export const ShopTab: React.FC = () => {
  const { saveData, buyGoldPack, buyShardUpgrade, buyAetherChest, buyAetherDiamonds, dismantleMultipleEquipment, addLogMessage } = useGameStore();
  const { t } = useTranslation();
  const { language } = useLanguageStore();
  const [subTab, setSubTab] = useState<'shop' | 'summon' | 'aether'>('shop');
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);

  if (!saveData) return null;

  const { hero, inventory } = saveData;

  const handleDismantleSelected = () => {
    dismantleMultipleEquipment(selectedItemIds);
    setSelectedItemIds([]);
  };

  const getRaritySelectionState = (rarity: 'common' | 'uncommon' | 'rare' | 'epic') => {
    const targetItems = inventory.filter(i => i.rarity === rarity && !i.equipped);
    if (targetItems.length === 0) return 'empty';
    
    const targetIds = targetItems.map(i => i.id);
    const allSelected = targetIds.every(id => selectedItemIds.includes(id));
    return allSelected ? 'all' : 'none';
  };

  const selectAllByRarity = (rarity: 'common' | 'uncommon' | 'rare' | 'epic') => {
    const unequipped = inventory.filter(i => i.rarity === rarity && !i.equipped);
    if (unequipped.length === 0) return;
    const targetIds = unequipped.map(i => i.id);
    
    const allSelected = targetIds.every(id => selectedItemIds.includes(id));
    if (allSelected) {
      setSelectedItemIds(prev => prev.filter(id => !targetIds.includes(id)));
    } else {
      setSelectedItemIds(prev => Array.from(new Set([...prev, ...targetIds])));
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Sub tabs selector */}
      <div className="flex gap-1 bg-slate-950/85 p-1.5 rounded-xl border border-slate-900 mb-4 select-none shrink-0 max-w-fit">
        {([
          { id: 'shop', label: language === 'vi' ? '💰 Cửa Hàng' : '💰 Shop' },
          { id: 'summon', label: language === 'vi' ? '🎁 Triệu Hồi' : '🎁 Summon' },
          { id: 'aether', label: language === 'vi' ? '🌀 Đền Aether' : '🌀 Aether Shrine' }
        ] as const).map(tab => {
          const isSummonLocked = tab.id === 'summon' && hero.level < 7;
          return (
            <button
              key={tab.id}
              onClick={() => {
                if (isSummonLocked) {
                  addLogMessage(
                    language === 'vi' 
                      ? '🔒 Tính năng khóa! Đạt cấp 7 để mở khóa Triệu Hồi.' 
                      : '🔒 Feature locked! Reach level 7 to unlock Summon.', 
                    'system'
                  );
                  return;
                }
                setSubTab(tab.id);
              }}
              className={`text-[10px] sm:text-xs font-bold py-2 px-4 rounded-lg cursor-pointer transition active:scale-95 ${
                subTab === tab.id
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/10'
                  : isSummonLocked
                  ? 'text-slate-650 opacity-40 cursor-not-allowed'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              }`}
              title={isSummonLocked ? (language === 'vi' ? 'Khóa đến cấp 7' : 'Locked until level 7') : ''}
            >
              {isSummonLocked ? '🔒 Triệu Hồi' : tab.label}
            </button>
          );
        })}
      </div>

      {/* Sub tab content */}
      <div className="flex-1 overflow-hidden relative">
        {subTab === 'shop' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full overflow-y-auto pr-1 pb-4 scrollbar-thin">
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

            {/* Right Column: Temporary Buffs */}
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
          </div>
        )}

        {subTab === 'summon' && <SummonTab />}

        {subTab === 'aether' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full overflow-y-auto pr-1 pb-4 scrollbar-thin">
            {/* Left Column: Shard Enhancements */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5 font-display">
                    🌀 THẦN KHÍ ANH HÙNG
                  </h4>
                  <span className="text-xs px-2.5 py-1 bg-purple-950/80 border border-purple-500/20 text-purple-300 font-extrabold rounded-lg">
                    {hero.aetherShards || 0} 🌀
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed mb-6">
                  Sử dụng Mảnh Aether nhận được từ việc phân rã trang bị để kích hoạt sức mạnh thần khí vĩnh viễn (+3%/cấp).
                </p>

                <div className="space-y-3">
                  {/* Attack Upgrade */}
                  {(() => {
                    const level = hero.shardUpgrades?.attack || 0;
                    const cost = 50 * (level + 1);
                    return (
                      <div className="bg-slate-950/60 border border-slate-900 hover:border-slate-850 rounded-xl p-3 flex justify-between items-center transition-all duration-200">
                        <div className="text-left">
                          <span className="text-xs font-black text-slate-200 block">⚔️ Sức Mạnh Vật Lý</span>
                          <span className="text-[10px] text-slate-500 font-medium block">Cấp: {level} | Hiệu ứng: +{level * 3}%</span>
                        </div>
                        <button
                          onClick={() => buyShardUpgrade('attack')}
                          disabled={(hero.aetherShards || 0) < cost}
                          className="bg-blue-600/10 hover:bg-blue-600/35 border border-blue-500/30 text-blue-300 text-[10px] font-bold px-3 py-1.5 rounded transition disabled:opacity-40"
                        >
                          {cost} 🌀
                        </button>
                      </div>
                    );
                  })()}

                  {/* Magic Attack Upgrade */}
                  {(() => {
                    const level = hero.shardUpgrades?.magicAttack || 0;
                    const cost = 50 * (level + 1);
                    return (
                      <div className="bg-slate-950/60 border border-slate-900 hover:border-slate-850 rounded-xl p-3 flex justify-between items-center transition-all duration-200">
                        <div className="text-left">
                          <span className="text-xs font-black text-slate-200 block">🔮 Sức Mạnh Phép Thuật</span>
                          <span className="text-[10px] text-slate-500 font-medium block">Cấp: {level} | Hiệu ứng: +{level * 3}%</span>
                        </div>
                        <button
                          onClick={() => buyShardUpgrade('magicAttack')}
                          disabled={(hero.aetherShards || 0) < cost}
                          className="bg-violet-600/10 hover:bg-violet-600/35 border border-violet-500/30 text-violet-300 text-[10px] font-bold px-3 py-1.5 rounded transition disabled:opacity-40"
                        >
                          {cost} 🌀
                        </button>
                      </div>
                    );
                  })()}

                  {/* Max HP Upgrade */}
                  {(() => {
                    const level = hero.shardUpgrades?.maxHp || 0;
                    const cost = 50 * (level + 1);
                    return (
                      <div className="bg-slate-950/60 border border-slate-900 hover:border-slate-850 rounded-xl p-3 flex justify-between items-center transition-all duration-200">
                        <div className="text-left">
                          <span className="text-xs font-black text-slate-200 block">💖 HP Tối Đa</span>
                          <span className="text-[10px] text-slate-500 font-medium block">Cấp: {level} | Hiệu ứng: +{level * 3}%</span>
                        </div>
                        <button
                          onClick={() => buyShardUpgrade('maxHp')}
                          disabled={(hero.aetherShards || 0) < cost}
                          className="bg-rose-600/10 hover:bg-rose-600/35 border border-rose-500/30 text-rose-300 text-[10px] font-bold px-3 py-1.5 rounded transition disabled:opacity-40"
                        >
                          {cost} 🌀
                        </button>
                      </div>
                    );
                  })()}
                </div>
              </div>

              <div className="text-[9px] text-slate-550 mt-4 text-center">
                * Nâng cấp lập tức cộng thêm chỉ số vĩnh viễn và tự động hồi đầy máu.
              </div>
            </div>

            {/* Center Column: Aether Altar (Dismantle Inventory) */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 flex flex-col justify-between min-h-[480px] lg:h-full">
              <div className="flex flex-col h-full justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-2.5 flex items-center gap-1.5 font-display">
                    ♻️ LÒ PHÂN RÃ AETHER
                  </h4>
                  <p className="text-[10px] text-slate-400 mb-3 leading-relaxed">
                    Chọn các trang bị trong kho để phân rã lấy Mảnh Aether. Click để chọn nhiều món.
                  </p>

                  {/* Unequipped Items Grid */}
                  {(() => {
                    const unequippedItems = inventory.filter(item => !item.equipped);
                    if (unequippedItems.length === 0) {
                      return (
                        <div className="h-40 border border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center text-slate-650 bg-slate-950/20">
                          <span className="text-2xl mb-1">📦</span>
                          <span className="text-[9px] uppercase font-bold tracking-wider">Không có trang bị rảnh</span>
                        </div>
                      );
                    }

                    return (
                      <div className="grid grid-cols-4 gap-1.5 overflow-y-auto max-h-[160px] pr-1 scrollbar-thin">
                        {unequippedItems.map(item => {
                          const isSelected = selectedItemIds.includes(item.id);
                          // Determine border/bg color based on rarity
                          const borderClass = isSelected 
                            ? 'border-purple-500 ring-1 ring-purple-500/50 bg-purple-950/20' 
                            : item.rarity === 'legendary' 
                            ? 'border-amber-500/40 bg-amber-950/10'
                            : item.rarity === 'epic'
                            ? 'border-purple-500/30 bg-purple-950/10'
                            : item.rarity === 'rare'
                            ? 'border-blue-500/20 bg-blue-950/10'
                            : item.rarity === 'uncommon'
                            ? 'border-emerald-500/10 bg-emerald-950/5'
                            : 'border-slate-850 bg-slate-950/40';

                          return (
                            <button
                              key={item.id}
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedItemIds(selectedItemIds.filter(id => id !== item.id));
                                } else {
                                  setSelectedItemIds([...selectedItemIds, item.id]);
                                }
                              }}
                              className={`aspect-square relative flex flex-col items-center justify-center border rounded-lg transition active:scale-95 cursor-pointer overflow-hidden ${borderClass}`}
                            >
                              {isSelected && (
                                <span className="absolute top-1 right-1 bg-purple-600 text-[8px] text-white w-3.5 h-3.5 rounded-full flex items-center justify-center font-black z-10 animate-pulse">
                                  ✓
                                </span>
                              )}
                              <ItemGraphic templateId={item.templateId} isCorrupted={item.isCorrupted} isCursed={item.isCursed} isIdentified={item.isIdentified} className="w-8 h-8 pointer-events-none" />
                              <span className="absolute bottom-0.5 right-0.5 text-[7px] font-black text-slate-400 bg-slate-950/50 px-0.5 rounded leading-none">
                                +{item.level}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    );
                  })()}

                  {/* Quick select buttons */}
                  <div className="mt-3">
                    <span className="block text-[8px] text-slate-550 font-bold uppercase tracking-wider mb-1">Chọn nhanh:</span>
                    <div className="grid grid-cols-4 gap-1">
                      {(() => {
                        const state = getRaritySelectionState('common');
                        const activeClass = state === 'all' 
                          ? 'bg-slate-700 border-slate-400 text-white ring-1 ring-slate-450/40' 
                          : 'bg-slate-850 hover:bg-slate-800 text-slate-300 border-slate-750';
                        return (
                          <button
                            onClick={() => selectAllByRarity('common')}
                            disabled={state === 'empty'}
                            className={`text-[8px] font-bold py-1.5 px-0.5 rounded border transition cursor-pointer disabled:opacity-30 disabled:pointer-events-none ${activeClass}`}
                          >
                            Thường
                          </button>
                        );
                      })()}
                      {(() => {
                        const state = getRaritySelectionState('uncommon');
                        const activeClass = state === 'all' 
                          ? 'bg-emerald-600/40 border-emerald-450 text-emerald-200 ring-1 ring-emerald-450/40' 
                          : 'bg-emerald-950/20 hover:bg-emerald-900/35 text-emerald-400 border-emerald-500/10';
                        return (
                          <button
                            onClick={() => selectAllByRarity('uncommon')}
                            disabled={state === 'empty'}
                            className={`text-[8px] font-bold py-1.5 px-0.5 rounded border transition cursor-pointer disabled:opacity-30 disabled:pointer-events-none ${activeClass}`}
                          >
                            Tốt
                          </button>
                        );
                      })()}
                      {(() => {
                        const state = getRaritySelectionState('rare');
                        const activeClass = state === 'all' 
                          ? 'bg-blue-600/40 border-blue-450 text-blue-200 ring-1 ring-blue-450/40' 
                          : 'bg-blue-950/20 hover:bg-blue-900/35 text-blue-400 border-blue-500/10';
                        return (
                          <button
                            onClick={() => selectAllByRarity('rare')}
                            disabled={state === 'empty'}
                            className={`text-[8px] font-bold py-1.5 px-0.5 rounded border transition cursor-pointer disabled:opacity-30 disabled:pointer-events-none ${activeClass}`}
                          >
                            Hiếm
                          </button>
                        );
                      })()}
                      {(() => {
                        const state = getRaritySelectionState('epic');
                        const activeClass = state === 'all' 
                          ? 'bg-purple-600/40 border-purple-450 text-purple-200 ring-1 ring-purple-450/40' 
                          : 'bg-purple-950/20 hover:bg-purple-900/35 text-purple-400 border-purple-500/10';
                        return (
                          <button
                            onClick={() => selectAllByRarity('epic')}
                            disabled={state === 'empty'}
                            className={`text-[8px] font-bold py-1.5 px-0.5 rounded border transition cursor-pointer disabled:opacity-30 disabled:pointer-events-none ${activeClass}`}
                          >
                            Sử Thi
                          </button>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-850 space-y-2">
                  <div className="flex justify-between text-[11px] font-bold text-slate-400">
                    <span>Đã chọn: <strong className="text-slate-200">{selectedItemIds.length} món</strong></span>
                    <span>Nhận: <strong className="text-purple-450">+{selectedItemIds.reduce((sum, id) => sum + (inventory.find(i => i.id === id) ? calculateDismantleRewards(inventory.find(i => i.id === id)!) : 0), 0)} 🌀</strong></span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedItemIds([])}
                      disabled={selectedItemIds.length === 0}
                      className="flex-1 bg-slate-850 hover:bg-slate-800 text-slate-450 text-[10px] font-bold py-2 rounded-lg transition active:scale-95 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                    >
                      Bỏ chọn
                    </button>
                    <button
                      onClick={handleDismantleSelected}
                      disabled={selectedItemIds.length === 0}
                      className="flex-[2] bg-gradient-to-r from-purple-650 to-indigo-650 hover:from-purple-600 hover:to-indigo-600 text-white text-[10px] font-extrabold py-2 rounded-lg transition active:scale-95 disabled:opacity-40 disabled:pointer-events-none cursor-pointer shadow-md"
                    >
                      PHÂN RÃ ♻️
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Aether Exchange */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-2.5 flex items-center gap-1.5 font-display">
                  🎁 ĐỔI VẬT PHẨM AETHER
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed mb-6">
                  Quy đổi Mảnh Aether tích lũy để đổi lấy tài nguyên quý hiếm hoặc rương vật phẩm cao cấp.
                </p>

                <div className="space-y-4">
                  {/* Aether Chest */}
                  <div className="p-4 bg-slate-950/60 border border-slate-900 hover:border-slate-850 rounded-xl transition-all duration-200">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className="text-xs font-extrabold text-amber-400 block">👑 RƯƠNG TRANG BỊ CAO CẤP</span>
                        <span className="text-[10px] text-slate-500 block mt-0.5">Nhận ngẫu nhiên trang bị Hiếm, Sử Thi, hoặc Huyền Thoại chưa giám định.</span>
                      </div>
                    </div>
                    <button
                      onClick={buyAetherChest}
                      disabled={(hero.aetherShards || 0) < 300}
                      className="w-full bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-slate-950 text-xs font-extrabold py-2.5 px-4 rounded-xl border border-amber-500/20 active:scale-[0.98] transition flex justify-between items-center disabled:opacity-40 cursor-pointer"
                    >
                      <span>Mở Rương</span>
                      <span className="bg-slate-950/40 text-amber-950 px-2 py-0.5 rounded border border-amber-500/10 font-bold">
                        300 🌀
                      </span>
                    </button>
                  </div>

                  {/* Diamond Pack */}
                  <div className="p-4 bg-slate-950/60 border border-slate-900 hover:border-slate-850 rounded-xl transition-all duration-200">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className="text-xs font-extrabold text-blue-400 block">💎 ĐỔI KIM CƯƠNG (Diamonds)</span>
                        <span className="text-[10px] text-slate-500 block mt-0.5">Đổi 100 Mảnh Aether lấy +200 Kim Cương phục vụ các giao dịch khác.</span>
                      </div>
                    </div>
                    <button
                      onClick={buyAetherDiamonds}
                      disabled={(hero.aetherShards || 0) < 100}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold py-2.5 px-4 rounded-xl border border-blue-400/20 active:scale-[0.98] transition flex justify-between items-center disabled:opacity-40 cursor-pointer"
                    >
                      <span>Đổi +200 💎</span>
                      <span className="bg-slate-950/40 text-blue-300 px-2 py-0.5 rounded border border-blue-500/10 font-bold">
                        100 🌀
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-slate-500 mt-4 text-center">
                * Hành lý cần có ít nhất 1 chỗ trống khi mở Rương Thần Khí Aether.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
