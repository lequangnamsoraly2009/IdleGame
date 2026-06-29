import React, { useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { EquipmentItem, ItemRarity } from '@idle-rpg/shared';
import { useTranslation, getTranslatedItemName } from '../../utils/i18n';
import { ItemGraphic } from '../ItemGraphic';

export const BagTab: React.FC = () => {
  const { saveData, equipEquipment, unequipEquipment, upgradeEquipment, sellEquipment } = useGameStore();
  const { t } = useTranslation();
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  if (!saveData) return null;

  const { inventory, hero } = saveData;
  const selectedItem = inventory.find(item => item.id === selectedItemId);

  const getRarityUIStyles = (rarity: ItemRarity) => {
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
              {/* Green corner dots */}
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
              {/* Corner brackets */}
              <div className="absolute top-1.5 left-1.5 border-t border-l border-blue-400/40 w-1.5 h-1.5 rounded-tl-sm pointer-events-none" />
              <div className="absolute bottom-1.5 right-1.5 border-b border-r border-blue-400/40 w-1.5 h-1.5 rounded-br-sm pointer-events-none" />
              {/* Circular light halo */}
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
              {/* Pulse overlay */}
              <div className="absolute inset-1 border border-purple-500/15 rounded-lg animate-pulse pointer-events-none" />
              {/* L brackets */}
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
              {/* SPINNING BORDER LASER EFFECT */}
              <div 
                className="absolute w-[180%] h-[180%] bg-[conic-gradient(from_0deg,transparent_10%,#f59e0b_45%,#fbbf24_55%,transparent_90%)] animate-spin pointer-events-none rounded-full" 
                style={{ animationDuration: '2.5s' }}
              />
              <div className="absolute inset-[1px] bg-slate-950 rounded-[11px] pointer-events-none" />
              
              {/* Inner shiny gold layer */}
              <div className="absolute inset-0.5 bg-gradient-to-br from-amber-500/15 to-orange-600/10 rounded-[10px] pointer-events-none" />
              <div className="absolute w-10 h-10 rounded-full bg-amber-500/15 blur-sm animate-pulse pointer-events-none" />
              
              {/* Sparkles */}
              <div className="absolute top-1 left-1 text-[8px] animate-pulse text-amber-300 pointer-events-none">✨</div>
              <div className="absolute bottom-1 right-1.5 text-[8px] animate-pulse text-amber-300 pointer-events-none" style={{ animationDelay: '0.6s' }}>✨</div>
            </>
          )
        };
    }
  };



  // Standard item sells at 30% of base upgrade cost
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

  // Generate blank inventory slots up to 50
  const totalSlots = 50;
  const blankSlotsCount = Math.max(0, totalSlots - inventory.length);
  const blankSlots = Array.from({ length: blankSlotsCount });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 h-full overflow-y-auto lg:overflow-hidden pr-1">
      {/* Grid List */}
      <div className="lg:col-span-2 flex flex-col justify-between h-[280px] lg:h-full bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 overflow-hidden shrink-0">
        <div>
          <div className="flex justify-between items-center mb-4 border-b border-slate-850 pb-2">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              🎒 {t('tab_bag')}
            </h3>
            <span className="text-xs font-semibold px-2 py-1 bg-slate-950/80 border border-slate-800 rounded-lg text-slate-400">
              {inventory.length} / {totalSlots} {t('inventory_capacity')}
            </span>
          </div>

          {/* Grid View */}
          <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-7 lg:grid-cols-8 gap-2 overflow-y-auto h-[180px] lg:h-[300px] pr-1">
            {inventory.map((item) => {
              const ui = getRarityUIStyles(item.rarity);
              const isSelected = item.id === selectedItemId;

              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedItemId(item.id)}
                  className={`aspect-square relative flex flex-col items-center justify-center border rounded-xl overflow-hidden transition-all cursor-pointer select-none ${ui.border} ${ui.bg} ${ui.glow} ${
                    isSelected ? 'ring-2 ring-blue-500 scale-[0.96] border-transparent' : 'hover:scale-[1.03] hover:bg-slate-800/20'
                  }`}
                >
                  {/* Extra Visual Elements */}
                  {ui.extraElements}

                  {/* Equipped Tag */}
                  {item.equipped && (
                    <span className="absolute top-1 left-1 bg-blue-600 text-[8px] text-white px-1 py-0.5 rounded font-extrabold uppercase leading-none shadow z-10">
                      E
                    </span>
                  )}
                  {/* Item Graphic Illustration */}
                  <ItemGraphic templateId={item.templateId} className="w-10 h-10 mb-1 relative z-10" />
                  {/* Level text */}
                  <span className="absolute bottom-1 right-1 text-[9px] font-extrabold text-slate-400 bg-slate-950/60 px-1 py-0.2 rounded z-10">
                    +{item.level}
                  </span>
                </button>
              );
            })}

            {/* Empty slots placeholders */}
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

      {/* Item Inspector Panel */}
      <div className="lg:col-span-1 bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 flex flex-col justify-between h-auto lg:h-full min-h-[340px] lg:min-h-0 shrink-0">
        {selectedItem ? (
          <div className="flex flex-col justify-between h-full">
            <div>
              {/* Header Rarity info */}
              <div className="flex justify-between items-center mb-3">
                <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded ${getRarityUIStyles(selectedItem.rarity).bg} ${getRarityUIStyles(selectedItem.rarity).text}`}>
                  {t('rarity_' + selectedItem.rarity)}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  Slot: {t('slot_' + selectedItem.slot)}
                </span>
              </div>

              {/* Title & Level */}
              <h4 className={`text-lg font-extrabold flex items-center gap-2.5 font-display ${getRarityUIStyles(selectedItem.rarity).text}`}>
                <ItemGraphic templateId={selectedItem.templateId} className="w-8 h-8" />
                <span>{getTranslatedItemName(t, selectedItem)}</span>
                <span className="text-xs opacity-80">+{selectedItem.level}</span>
              </h4>

              {/* Description */}
              <p className="text-xs text-slate-400 italic mt-1 mb-4 leading-relaxed">
                {selectedItem.rarity === 'legendary' 
                  ? t('item_desc_legendary')
                  : t('item_desc_standard', { slot: t('slot_' + selectedItem.slot).toLowerCase() })
                }
              </p>

              {/* Stats Block */}
              <div className="bg-slate-950/50 border border-slate-900 rounded-xl p-4 space-y-2 mb-4">
                <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">
                  {t('core_attributes')}
                </span>
                {selectedItem.stats.attack > 0 && (
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-400">{t('attack_power')}</span>
                    <span className="text-blue-400">+{selectedItem.stats.attack}</span>
                  </div>
                )}
                {selectedItem.stats.maxHp > 0 && (
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-400">{t('max_health')}</span>
                    <span className="text-emerald-400">+{selectedItem.stats.maxHp}</span>
                  </div>
                )}
                {selectedItem.stats.defense > 0 && (
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-400">{t('defense_rating')}</span>
                    <span className="text-indigo-400">+{selectedItem.stats.defense}</span>
                  </div>
                )}
                {selectedItem.stats.speed > 0 && (
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-400">{t('attack_speed')}</span>
                    <span className="text-cyan-400">+{Math.round(selectedItem.stats.speed * 100) / 100}%</span>
                  </div>
                )}
                {selectedItem.stats.critRate > 0 && (
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-400">{t('critical_rate')}</span>
                    <span className="text-amber-400">+{Math.round(selectedItem.stats.critRate * 100)}%</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions Block */}
            <div className="space-y-2.5 pt-4 border-t border-slate-850">
              <div className="flex gap-2">
                {selectedItem.equipped ? (
                  <button
                    onClick={() => unequipEquipment(selectedItem.id)}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold py-3 px-2 rounded-xl transition active:scale-[0.98] cursor-pointer"
                  >
                    {t('unequip_btn')}
                  </button>
                ) : (
                  <button
                    onClick={() => equipEquipment(selectedItem.id)}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-3 px-2 rounded-xl transition active:scale-[0.98] cursor-pointer"
                  >
                    {t('equip_btn')}
                  </button>
                )}

                <button
                  onClick={() => {
                    sellEquipment(selectedItem.id);
                    setSelectedItemId(null);
                  }}
                  disabled={selectedItem.equipped}
                  className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold py-3 px-3 rounded-xl transition disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                  title={selectedItem.equipped ? t('sell_warn') : ''}
                >
                  {t('sell_btn')} ({calculateSellPrice(selectedItem)}💰)
                </button>
              </div>

              <button
                onClick={() => upgradeEquipment(selectedItem.id)}
                disabled={hero.gold < selectedItem.upgradeCost}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold py-3.5 px-4 rounded-xl border border-emerald-400/20 active:scale-[0.98] transition disabled:opacity-40 disabled:pointer-events-none flex justify-between items-center cursor-pointer"
              >
                <span>🚀 {t('upgrade_btn')}</span>
                <span className="bg-slate-950/40 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/10 font-bold">
                  {selectedItem.upgradeCost} Gold 🪙
                </span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 py-12">
            <span className="text-3xl mb-2">🔍</span>
            <span className="text-xs font-semibold uppercase tracking-wider">{t('no_items')}</span>
            <p className="text-[11px] text-center text-slate-600 mt-1 max-w-[180px]">
              {t('bag_inspect_tip')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
