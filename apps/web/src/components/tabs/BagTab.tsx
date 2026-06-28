import React, { useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { EquipmentItem, EquipmentSlot, ItemRarity } from '@idle-rpg/shared';

export const BagTab: React.FC = () => {
  const { saveData, equipEquipment, unequipEquipment, upgradeEquipment, sellEquipment } = useGameStore();
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  if (!saveData) return null;

  const { inventory, hero } = saveData;
  const selectedItem = inventory.find(item => item.id === selectedItemId);

  const getRarityColors = (rarity: ItemRarity) => {
    switch (rarity) {
      case 'common': return { border: 'border-slate-800', bg: 'bg-slate-500/10', text: 'text-slate-400', glow: '' };
      case 'uncommon': return { border: 'border-emerald-500/30', bg: 'bg-emerald-500/5', text: 'text-emerald-400', glow: '' };
      case 'rare': return { border: 'border-blue-500/30', bg: 'bg-blue-500/5', text: 'text-blue-400', glow: 'shadow-blue-500/5' };
      case 'epic': return { border: 'border-purple-500/30', bg: 'bg-purple-500/5', text: 'text-purple-400', glow: 'shadow-purple-500/10 shadow-lg' };
      case 'legendary': return { border: 'border-amber-500/40', bg: 'bg-amber-500/5', text: 'text-amber-400', glow: 'shadow-amber-500/15 shadow-xl animate-pulse' };
    }
  };

  const getSlotIcon = (slot: EquipmentSlot) => {
    switch (slot) {
      case 'weapon': return '⚔️';
      case 'armor': return '🛡️';
      case 'helmet': return '🪖';
      case 'boots': return '🥾';
      case 'ring': return '💍';
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full overflow-hidden">
      {/* Grid List */}
      <div className="lg:col-span-2 flex flex-col justify-between h-full bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 overflow-hidden">
        <div>
          <div className="flex justify-between items-center mb-4 border-b border-slate-850 pb-2">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              🎒 Equipment Bag
            </h3>
            <span className="text-xs font-semibold px-2 py-1 bg-slate-950/80 border border-slate-800 rounded-lg text-slate-400">
              {inventory.length} / {totalSlots} Slots
            </span>
          </div>

          {/* Grid View */}
          <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-7 lg:grid-cols-8 gap-2 overflow-y-auto max-h-[340px] pr-1">
            {inventory.map((item) => {
              const colors = getRarityColors(item.rarity);
              const isSelected = item.id === selectedItemId;

              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedItemId(item.id)}
                  className={`aspect-square relative flex flex-col items-center justify-center border rounded-xl transition-all cursor-pointer select-none ${colors.border} ${colors.bg} ${colors.glow} ${
                    isSelected ? 'ring-2 ring-blue-500 scale-[0.96] border-transparent' : 'hover:scale-[1.03] hover:bg-slate-800/20'
                  }`}
                >
                  {/* Equipped Tag */}
                  {item.equipped && (
                    <span className="absolute top-1 left-1 bg-blue-600 text-[8px] text-white px-1 py-0.5 rounded font-extrabold uppercase leading-none shadow">
                      E
                    </span>
                  )}
                  {/* Slot Icon */}
                  <span className="text-xl mb-1">{getSlotIcon(item.slot)}</span>
                  {/* Level text */}
                  <span className="absolute bottom-1 right-1 text-[9px] font-extrabold text-slate-400 bg-slate-950/60 px-1 py-0.2 rounded">
                    +{item.level}
                  </span>
                </button>
              );
            })}

            {/* Empty slots placeholders */}
            {blankSlots.map((_, i) => (
              <div
                key={`empty-${i}`}
                className="aspect-square border border-dashed border-slate-900 bg-slate-950/20 rounded-xl flex items-center justify-center text-slate-800/40 text-xs"
              >
                empty
              </div>
            ))}
          </div>
        </div>

        <div className="text-[10px] text-slate-500 mt-2">
          ⚔️ Click on any item in your bag to inspect, equip, sell or upgrade it.
        </div>
      </div>

      {/* Item Inspector Panel */}
      <div className="lg:col-span-1 bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 flex flex-col justify-between h-full min-h-[380px]">
        {selectedItem ? (
          <div className="flex flex-col justify-between h-full">
            <div>
              {/* Header Rarity info */}
              <div className="flex justify-between items-center mb-3">
                <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded ${getRarityColors(selectedItem.rarity).bg} ${getRarityColors(selectedItem.rarity).text}`}>
                  {selectedItem.rarity}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  Slot: {selectedItem.slot.toUpperCase()}
                </span>
              </div>

              {/* Title & Level */}
              <h4 className="text-lg font-extrabold text-white flex items-center gap-2 font-display">
                {getSlotIcon(selectedItem.slot)} {selectedItem.name}
                <span className="text-xs text-blue-400">+{selectedItem.level}</span>
              </h4>

              {/* Description */}
              <p className="text-xs text-slate-400 italic mt-1 mb-4 leading-relaxed">
                {selectedItem.rarity === 'legendary' 
                  ? 'A legendary item forged in dragon fire, carrying supreme bonuses.'
                  : `A standard issue ${selectedItem.slot} suited for combat adventures.`
                }
              </p>

              {/* Stats Block */}
              <div className="bg-slate-950/50 border border-slate-900 rounded-xl p-4 space-y-2 mb-4">
                <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">
                  Item Attribute Bonuses
                </span>
                {selectedItem.stats.attack > 0 && (
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-400">⚔️ Attack Power</span>
                    <span className="text-blue-400">+{selectedItem.stats.attack}</span>
                  </div>
                )}
                {selectedItem.stats.maxHp > 0 && (
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-400">💖 Max HP</span>
                    <span className="text-emerald-400">+{selectedItem.stats.maxHp}</span>
                  </div>
                )}
                {selectedItem.stats.defense > 0 && (
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-400">🛡️ Defense</span>
                    <span className="text-indigo-400">+{selectedItem.stats.defense}</span>
                  </div>
                )}
                {selectedItem.stats.speed > 0 && (
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-400">⚡ Attack Speed</span>
                    <span className="text-cyan-400">+{Math.round(selectedItem.stats.speed * 100) / 100}%</span>
                  </div>
                )}
                {selectedItem.stats.critRate > 0 && (
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-400">🎯 Crit Chance</span>
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
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold py-3 px-2 rounded-xl transition active:scale-[0.98]"
                  >
                    Unequip Item
                  </button>
                ) : (
                  <button
                    onClick={() => equipEquipment(selectedItem.id)}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-3 px-2 rounded-xl transition active:scale-[0.98]"
                  >
                    Equip Item
                  </button>
                )}

                <button
                  onClick={() => {
                    sellEquipment(selectedItem.id);
                    setSelectedItemId(null);
                  }}
                  disabled={selectedItem.equipped}
                  className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold py-3 px-3 rounded-xl transition disabled:opacity-30 disabled:pointer-events-none"
                  title={selectedItem.equipped ? 'Unequip item first to sell' : ''}
                >
                  Sell ({calculateSellPrice(selectedItem)}💰)
                </button>
              </div>

              <button
                onClick={() => upgradeEquipment(selectedItem.id)}
                disabled={hero.gold < selectedItem.upgradeCost}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold py-3.5 px-4 rounded-xl border border-emerald-400/20 active:scale-[0.98] transition disabled:opacity-40 disabled:pointer-events-none flex justify-between items-center"
              >
                <span>🚀 Upgrade Level</span>
                <span className="bg-slate-950/40 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/10 font-bold">
                  {selectedItem.upgradeCost} Gold 🪙
                </span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 py-12">
            <span className="text-3xl mb-2">🔍</span>
            <span className="text-xs font-semibold uppercase tracking-wider">No Item Selected</span>
            <p className="text-[11px] text-center text-slate-600 mt-1 max-w-[180px]">
              Tap on any item in your bag to inspect details and upgrade.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
