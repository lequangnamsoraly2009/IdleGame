import React, { useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { EquipmentItem } from '@idle-rpg/shared';
import { useTranslation } from '../../utils/i18n';
import { ItemGraphic } from '../ItemGraphic';

export const BagTab: React.FC = () => {
  const { saveData, sellMultipleEquipment, setActiveInspectItemId } = useGameStore();
  const { t } = useTranslation();

  // Bulk sell states
  const [isBulkSellMode, setIsBulkSellMode] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);

  if (!saveData) return null;

  const { inventory } = saveData;

  const getRarityUIStyles = (item: EquipmentItem) => {
    // Corrupted overrides outline color with glowing red
    if (item.isCorrupted) {
      return {
        border: 'border-red-600/90 ring-1 ring-red-600/50',
        bg: 'bg-gradient-to-br from-red-950/40 via-red-900/10 to-red-950/40',
        glow: 'shadow-[0_0_15px_rgba(239,68,68,0.7)] animate-pulse',
        text: 'text-red-500 font-extrabold',
        extraElements: (
          <div className="absolute top-1 right-1 text-[8px] animate-pulse text-red-400 pointer-events-none">👿</div>
        )
      };
    }
    // Cursed overrides outline color with glowing purple/void
    if (item.isCursed) {
      return {
        border: 'border-purple-600/80 ring-1 ring-purple-600/40',
        bg: 'bg-gradient-to-br from-purple-950/40 via-slate-900 to-purple-950/40',
        glow: 'shadow-[0_0_12px_rgba(147,51,234,0.5)]',
        text: 'text-purple-400 font-extrabold',
        extraElements: (
          <div className="absolute top-1 right-1 text-[8px] animate-pulse text-purple-400 pointer-events-none">💀</div>
        )
      };
    }

    switch (item.rarity) {
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
              <div className="absolute top-1.5 left-1.5 w-1 h-1 bg-emerald-500/70 rounded-full pointer-events-none" />
              <div className="absolute top-1.5 right-1.5 w-1 h-1 bg-emerald-500/70 rounded-full pointer-events-none" />
              <div className="absolute bottom-1.5 left-1.5 w-1 h-1 bg-emerald-500/70 rounded-full pointer-events-none" />
              <div className="absolute bottom-1.5 right-1.5 w-1 h-1 bg-emerald-500/70 rounded-full pointer-events-none" />
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
              <div className="absolute top-1.5 left-1.5 border-t border-l border-blue-400/40 w-1.5 h-1.5 rounded-tl-sm pointer-events-none" />
              <div className="absolute bottom-1.5 right-1.5 border-b border-r border-blue-400/40 w-1.5 h-1.5 rounded-br-sm pointer-events-none" />
              <div className="absolute w-7 h-7 rounded-full border border-blue-500/5 bg-blue-500/5 pointer-events-none" />
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
              <div className="absolute inset-1 border border-purple-500/15 rounded-lg animate-pulse pointer-events-none" />
              <div className="absolute top-1 left-1 border-t border-l border-purple-400 w-2 h-2 rounded-tl-md pointer-events-none" />
              <div className="absolute top-1 right-1 border-t border-r border-purple-400 w-2 h-2 rounded-tr-md pointer-events-none" />
              <div className="absolute bottom-1 left-1 border-b border-l border-purple-400 w-2 h-2 rounded-bl-md pointer-events-none" />
              <div className="absolute bottom-1 right-1 border-b border-r border-purple-400 w-2 h-2 rounded-br-md pointer-events-none" />
              <div className="absolute w-9 h-9 rounded-full bg-purple-500/10 blur-sm animate-pulse pointer-events-none" />
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
              <div className="absolute w-10 h-10 rounded-full bg-amber-500/15 blur-sm animate-pulse pointer-events-none" />
              <div className="absolute top-1 left-1 text-[8px] animate-pulse text-amber-300 pointer-events-none">✨</div>
              <div className="absolute bottom-1 right-1.5 text-[8px] animate-pulse text-amber-300 pointer-events-none" style={{ animationDelay: '0.6s' }}>✨</div>
            </>
          )
        };
    }
  };

  const calculateSellPrice = (item: EquipmentItem) => {
    const baseCost = {
      common: 50,
      uncommon: 75,
      rare: 110,
      epic: 175,
      legendary: 300
    }[item.rarity];
    return Math.floor(baseCost * 0.3 * (1 + (item.level - 1) * 0.1));
  };

  // Total price calculation for bulk sell
  const totalEstimatedGold = selectedItemIds.reduce((sum, id) => {
    const item = inventory.find(i => i.id === id);
    return sum + (item ? calculateSellPrice(item) : 0);
  }, 0);

  const selectAllByRarity = (rarity: 'common' | 'uncommon' | 'rare' | 'epic') => {
    const matches = inventory.filter(i => i.rarity === rarity && !i.equipped);
    const matchIds = matches.map(i => i.id);
    setSelectedItemIds(prev => Array.from(new Set([...prev, ...matchIds])));
  };

  const handleBulkSellConfirm = () => {
    sellMultipleEquipment(selectedItemIds);
    setSelectedItemIds([]);
    setIsBulkSellMode(false);
  };

  const totalSlots = 50;
  const blankSlotsCount = Math.max(0, totalSlots - inventory.length);
  const blankSlots = Array.from({ length: blankSlotsCount });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 h-full overflow-hidden pr-1">
      {/* Grid List */}
      <div className={`${isBulkSellMode ? 'lg:col-span-2 h-1/2 lg:h-full' : 'lg:col-span-3 h-full'} flex flex-col justify-between bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 overflow-hidden shrink-0`}>
        <div>
          <div className="flex justify-between items-center mb-4 border-b border-slate-850 pb-2 gap-2 flex-wrap">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              {t('tab_bag')}
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setIsBulkSellMode(!isBulkSellMode);
                  setSelectedItemIds([]);
                }}
                className={`text-xs font-extrabold px-3 py-1.5 rounded-lg border transition active:scale-[0.98] cursor-pointer ${isBulkSellMode
                    ? 'bg-red-500/20 border-red-500/40 text-red-400 hover:bg-red-500/30'
                    : 'bg-amber-600/25 border-amber-600/40 text-amber-300 hover:bg-amber-600/40'
                  }`}
              >
                {isBulkSellMode ? '❌ Hủy Thanh Lý' : '🧹 Thanh Lý Hàng Loạt'}
              </button>
              <span className="text-xs font-semibold px-2 py-1.5 bg-slate-950/80 border border-slate-800 rounded-lg text-slate-400">
                {inventory.length} / {totalSlots} {t('inventory_capacity')}
              </span>
            </div>
          </div>

          {/* Grid View */}
          <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-7 lg:grid-cols-8 gap-2 overflow-y-auto flex-1 min-h-0 lg:h-[300px] pr-1">
            {inventory.map((item) => {
              const ui = getRarityUIStyles(item);
              const isSelected = isBulkSellMode && selectedItemIds.includes(item.id);

              const handleItemClick = () => {
                if (isBulkSellMode) {
                  if (item.equipped) return;
                  if (selectedItemIds.includes(item.id)) {
                    setSelectedItemIds(selectedItemIds.filter(id => id !== item.id));
                  } else {
                    setSelectedItemIds([...selectedItemIds, item.id]);
                  }
                } else {
                  setActiveInspectItemId(item.id);
                }
              };

              return (
                <div key={item.id} className="aspect-square w-full">
                  <button
                    onClick={handleItemClick}
                    disabled={isBulkSellMode && item.equipped}
                    className={`w-full h-full relative flex flex-col items-center justify-center border rounded-xl overflow-hidden transition-all cursor-pointer select-none ${isSelected
                        ? (isBulkSellMode ? 'ring-2 ring-red-500 scale-[0.96] border-transparent' : 'ring-2 ring-blue-500 scale-[0.96] border-transparent')
                        : ui.border
                      } ${ui.bg} ${ui.glow} ${isSelected
                        ? ''
                        : (isBulkSellMode && item.equipped ? 'opacity-30 pointer-events-none' : 'hover:scale-[1.03] hover:bg-slate-800/20')
                      }`}
                  >
                    {ui.extraElements}

                    {item.equipped && (
                      <span className="absolute top-1 left-1 bg-blue-600 text-[8px] text-white px-1 py-0.5 rounded font-extrabold uppercase leading-none shadow z-10">
                        E
                      </span>
                    )}

                    {isBulkSellMode && !item.equipped && (
                      isSelected ? (
                        <span className="absolute top-1 right-1 bg-red-600 text-[10px] text-white w-4 h-4 rounded-full flex items-center justify-center font-extrabold shadow z-10 animate-pulse">
                          ✓
                        </span>
                      ) : (
                        <span className="absolute top-1 right-1 bg-slate-950/80 border border-slate-700 text-[8px] text-slate-500 w-3.5 h-3.5 rounded-full flex items-center justify-center font-bold z-10">
                        </span>
                      )
                    )}

                    {!isBulkSellMode && item.isIdentified === false && (
                      <span className="absolute top-1 right-1 bg-amber-600 text-[8px] text-white px-1 py-0.5 rounded font-extrabold uppercase leading-none shadow z-10 animate-pulse">
                        ?
                      </span>
                    )}

                    <ItemGraphic templateId={item.templateId} isCorrupted={item.isCorrupted} isCursed={item.isCursed} isIdentified={item.isIdentified} className="w-10 h-10 mb-1 relative z-10" />
                    <span className="absolute bottom-1 right-1 text-[9px] font-extrabold text-slate-400 bg-slate-950/60 px-1 py-0.2 rounded z-10">
                      +{item.level}
                    </span>
                  </button>
                </div>
              );
            })}

            {blankSlots.map((_, i) => (
              <div
                key={`empty-${i}`}
                className="aspect-square border border-dashed border-slate-900 bg-slate-950/20 rounded-xl flex items-center justify-center text-slate-800/40 text-[10px] uppercase font-bold tracking-wider"
              >
                {t('slot_empty')}
              </div>
            ))}
          </div>
        </div>

        <div className="text-[10px] text-slate-500 mt-2">
          {t('bag_tip')}
        </div>
      </div>

      {/* Item Inspector Panel (Bulk Sell Mode only) */}
      {isBulkSellMode && (
        <div className="lg:col-span-1 h-1/2 lg:h-full bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 flex flex-col justify-between shrink-0">
          <div className="flex flex-col justify-between h-full">
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/10">
                  Bulk Sell Mode
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  Chế độ thanh lý
                </span>
              </div>

              <h4 className="text-base font-extrabold flex items-center gap-2 font-display text-slate-200">
                🧹 THANH LÝ HÀNG LOẠT
              </h4>
              <p className="text-xs text-slate-400 mt-2 mb-4 leading-relaxed">
                Nhấp chọn các trang bị muốn thanh lý trong danh sách bên trái hoặc sử dụng các nút chọn nhanh dưới đây. Trang bị đang sử dụng sẽ không được chọn.
              </p>

              {/* Quick Select Buttons */}
              <div className="space-y-2 mb-4">
                <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  Chọn nhanh theo phẩm chất
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => selectAllByRarity('common')}
                    className="bg-slate-800/60 hover:bg-slate-700 text-slate-300 text-[11px] font-bold py-2.5 px-1 rounded-lg border border-slate-700 transition cursor-pointer active:scale-95"
                  >
                    ⚪ Đồ Thường (Common)
                  </button>
                  <button
                    onClick={() => selectAllByRarity('uncommon')}
                    className="bg-emerald-950/30 hover:bg-emerald-900/40 text-emerald-400 text-[11px] font-bold py-2.5 px-1 rounded-lg border border-emerald-500/20 transition cursor-pointer active:scale-95"
                  >
                    🟢 Đồ Tốt (Uncommon)
                  </button>
                  <button
                    onClick={() => selectAllByRarity('rare')}
                    className="bg-blue-950/30 hover:bg-blue-900/40 text-blue-400 text-[11px] font-bold py-2.5 px-1 rounded-lg border border-blue-500/20 transition cursor-pointer active:scale-95"
                  >
                    🔵 Đồ Hiếm (Rare)
                  </button>
                  <button
                    onClick={() => selectAllByRarity('epic')}
                    className="bg-purple-950/30 hover:bg-purple-900/40 text-purple-400 text-[11px] font-bold py-2.5 px-1 rounded-lg border border-purple-500/20 transition cursor-pointer active:scale-95"
                  >
                    🟣 Đồ Sử Thi (Epic)
                  </button>
                </div>
                <button
                  onClick={() => setSelectedItemIds([])}
                  className="w-full bg-slate-900 hover:bg-slate-850 text-slate-400 text-[11px] font-bold py-2 rounded-lg border border-slate-800 transition cursor-pointer active:scale-95"
                >
                  ❌ Bỏ chọn tất cả
                </button>
              </div>

              {/* Stats Block */}
              <div className="bg-slate-950/50 border border-slate-900 rounded-xl p-4 space-y-2 mb-4">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-400">Đã chọn thanh lý:</span>
                  <span className="text-slate-200 font-extrabold">{selectedItemIds.length} món</span>
                </div>
                <div className="flex justify-between text-xs font-semibold border-t border-slate-900 pt-2">
                  <span className="text-slate-450 font-bold">Tổng Vàng nhận lại:</span>
                  <span className="text-amber-400 font-extrabold">{totalEstimatedGold.toLocaleString()} Vàng 💰</span>
                </div>
              </div>
            </div>

            <div className="space-y-2.5 pt-4 border-t border-slate-850">
              <button
                onClick={handleBulkSellConfirm}
                disabled={selectedItemIds.length === 0}
                className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-extrabold py-3.5 px-4 rounded-xl shadow-lg active:scale-[0.98] transition disabled:opacity-40 disabled:pointer-events-none flex justify-between items-center cursor-pointer"
              >
                <span>🧹 XÁC NHẬN THANH LÝ</span>
                <span className="bg-slate-950/40 text-rose-300 px-2 py-0.5 rounded border border-rose-500/10 font-bold">
                  {selectedItemIds.length} món đồ
                </span>
              </button>
              <button
                onClick={() => {
                  setIsBulkSellMode(false);
                  setSelectedItemIds([]);
                }}
                className="w-full bg-slate-850 hover:bg-slate-800 text-white text-xs font-bold py-3 rounded-xl transition cursor-pointer active:scale-[0.98]"
              >
                HỦY BỎ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
