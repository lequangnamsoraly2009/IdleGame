import React, { useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { useLanguageStore } from '../../stores/languageStore';
import { getTranslatedItemName, useTranslation } from '../../utils/i18n';
import { getFinalItemStats, calculateUpgradeCost } from '@idle-rpg/shared';
import { ItemGraphic } from '../ItemGraphic';

export const ForgeTab: React.FC = () => {
  const { saveData, combineGems, upgradeEquipment } = useGameStore();
  const { language } = useLanguageStore();
  const { t } = useTranslation();
  const [subTab, setSubTab] = useState<'gems' | 'upgrade'>('gems');

  if (!saveData) return null;

  const { hero, inventory } = saveData;
  const gems = hero.gems || {};

  // Filters equipped items for reforge upgrades
  const equippedItems = inventory.filter(item => item.equipped);

  const gemTypes = [
    { type: 'ruby', nameVi: 'Hồng Ngọc (Tăng Công)', nameEn: 'Ruby (+ATK)', emoji: '🔴' },
    { type: 'emerald', nameVi: 'Lục Bảo (Tăng Máu)', nameEn: 'Emerald (+HP)', emoji: '🟢' },
    { type: 'sapphire', nameVi: 'Lam Bảo (Tăng Giáp)', nameEn: 'Sapphire (+DEF)', emoji: '🔵' },
    { type: 'amethyst', nameVi: 'Thạch Anh (Tăng CM)', nameEn: 'Amethyst (+CRIT)', emoji: '🔮' }
  ];

  const getRarityTextClass = (rarity: string) => {
    switch (rarity) {
      case 'uncommon': return 'text-emerald-400 font-semibold';
      case 'rare': return 'text-blue-400 font-semibold';
      case 'epic': return 'text-purple-400 font-bold';
      case 'legendary': return 'text-amber-500 font-extrabold neon-text-gold';
      default: return 'text-slate-350';
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden text-slate-350">
      {/* Header Stat Info */}
      <div className="flex justify-between items-center bg-slate-950/40 border-b border-slate-900/60 p-3 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs font-bold">
            <span>💰</span>
            <span className="text-yellow-400 font-mono">{hero.gold.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold">
            <span>💎</span>
            <span className="text-blue-400 font-mono">{hero.diamonds.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold">
            <span>♻️</span>
            <span className="text-emerald-400 font-mono">{(hero as any).aetherShards ?? 0}</span>
          </div>
        </div>
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          {language === 'vi' ? '⚒️ LÒ RÈN CỔ ĐẠI' : '⚒️ ANCIENT FORGE'}
        </span>
      </div>

      {/* Sub tabs selector */}
      <div className="flex bg-slate-950/20 border-b border-slate-900 p-2 shrink-0 gap-2">
        <button
          onClick={() => setSubTab('gems')}
          className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-xl border transition ${
            subTab === 'gems'
              ? 'bg-purple-600/15 border-purple-500/30 text-purple-300 shadow'
              : 'bg-slate-950/45 border-slate-850 hover:bg-slate-900/40 text-slate-450 hover:text-slate-300'
          }`}
        >
          💎 {language === 'vi' ? 'Lò Ghép Ngọc' : 'Gem Crafting'}
        </button>
        <button
          onClick={() => setSubTab('upgrade')}
          className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-xl border transition ${
            subTab === 'upgrade'
              ? 'bg-amber-600/15 border-amber-500/30 text-amber-300 shadow'
              : 'bg-slate-950/45 border-slate-850 hover:bg-slate-900/40 text-slate-450 hover:text-slate-300'
          }`}
        >
          ⚒️ {language === 'vi' ? 'Cường Hóa Nhanh' : 'Quick Reforge'}
        </button>
      </div>

      {/* Workshop scroll box */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {subTab === 'gems' ? (
          <div className="space-y-4">
            {/* Instruction Banner */}
            <div className="p-3 bg-purple-950/15 border border-purple-500/20 rounded-2xl text-xs space-y-1 leading-relaxed">
              <span className="font-black text-purple-400 uppercase tracking-wider block">
                ⚒️ {language === 'vi' ? 'CÔNG THỨC GHÉP NGỌC' : 'GEM CRAFTING FORMULA'}
              </span>
              <p className="text-slate-400 font-medium text-[11px]">
                {language === 'vi'
                  ? 'Ghép 3 viên Ngọc cùng hệ và cùng Cấp độ để tạo ra 1 viên Ngọc cấp cao hơn (+1 Cấp). Chi phí ghép là 500 Vàng cho mỗi lần thử. Tỷ lệ thành công là 100%!'
                  : 'Combine 3 Gems of the same type and Tier to craft 1 Gem of the next higher Tier. Cost: 500 Gold per fusion. Success rate: 100%!'}
              </p>
            </div>

            {/* Gems lists by type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {gemTypes.map((gt) => (
                <div key={gt.type} className="bg-slate-900/50 border border-slate-850 rounded-2xl p-4 space-y-3 shadow">
                  <div className="flex items-center gap-2 border-b border-slate-850 pb-2">
                    <span className="text-xl">{gt.emoji}</span>
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">
                      {language === 'vi' ? gt.nameVi : gt.nameEn}
                    </h4>
                  </div>

                  <div className="space-y-2.5">
                    {([1, 2, 3, 4] as const).map((tier) => {
                      const gemKey = `${gt.type}_${tier}`;
                      const count = gems[gemKey] || 0;
                      const hasEnough = count >= 3;

                      return (
                        <div key={tier} className="flex justify-between items-center p-2 rounded-xl bg-slate-950/30 border border-slate-950/65 text-xs">
                          <div>
                            <span className="font-bold text-slate-350 block">
                              {language === 'vi' ? `Ngọc Cấp ${tier}` : `Tier ${tier} Gem`}
                            </span>
                            <span className="text-[10px] font-medium text-slate-500">
                              {language === 'vi' ? `Sở hữu: ${count}` : `Owned: ${count}`}
                            </span>
                          </div>

                          <button
                            onClick={() => combineGems(gt.type, tier)}
                            disabled={!hasEnough || hero.gold < 500}
                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition cursor-pointer ${
                              hasEnough && hero.gold >= 500
                                ? 'bg-purple-600 hover:bg-purple-500 border border-purple-500/35 text-white active:scale-95 shadow'
                                : 'bg-slate-950/60 border border-slate-900 text-slate-600 cursor-not-allowed'
                            }`}
                          >
                            {language === 'vi' ? 'Ghép (3 ➡️ 1)' : 'Fuse (3 ➡️ 1)'}
                          </button>
                        </div>
                      );
                    })}

                    {/* Tier 5 Gem count view */}
                    <div className="flex justify-between items-center p-2 rounded-xl bg-slate-950/20 border border-slate-950/30 text-xs">
                      <div>
                        <span className="font-black text-amber-400 block">
                          ⭐ {language === 'vi' ? 'Ngọc Cấp 5 (Tối đa)' : 'Tier 5 Gem (Max)'}
                        </span>
                        <span className="text-[10px] font-medium text-slate-500">
                          {language === 'vi' ? `Sở hữu: ${gems[`${gt.type}_5`] || 0}` : `Owned: ${gems[`${gt.type}_5`] || 0}`}
                        </span>
                      </div>
                      <span className="text-[9px] font-extrabold uppercase text-slate-550 tracking-wider">
                        MAX TIER
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Quick upgrade intro */}
            <div className="p-3 bg-amber-950/10 border border-amber-500/20 rounded-2xl text-xs leading-relaxed">
              <span className="font-black text-amber-400 uppercase tracking-wider block">
                ⚒️ {language === 'vi' ? 'CƯỜNG HÓA TRANG BỊ ĐANG MẶC' : 'REFORGE EQUIPPED EQUIPMENT'}
              </span>
              <p className="text-slate-400 font-medium text-[11px] mt-0.5">
                {language === 'vi'
                  ? 'Cường hóa trực tiếp các trang bị đang mặc trên người nhân vật để tăng mạnh các chỉ số cơ bản. Giá trị vàng nâng cấp tăng theo cấp độ trang bị.'
                  : 'Upgrade equipment slotted on your character to immediately boost core stats. Cost increases based on equipment level.'}
              </p>
            </div>

            {equippedItems.length === 0 ? (
              <div className="text-center py-16 bg-slate-900/10 border border-slate-900 border-dashed rounded-3xl text-slate-500 select-none">
                <span className="text-4xl block mb-2">🛡️</span>
                <span className="text-xs uppercase tracking-widest font-black block">
                  {language === 'vi' ? 'Chưa mặc trang bị nào!' : 'No Equipment Equipped!'}
                </span>
                <span className="text-[10px] text-slate-650 mt-1 block">
                  {language === 'vi' ? 'Hãy vào Hòm Đồ để mặc trang bị trước.' : 'Please equip items in your bag tab first.'}
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {equippedItems.map((item) => {
                  const finalStats = getFinalItemStats(item);
                  const cost = calculateUpgradeCost(item.slot, item.rarity, item.level);
                  const hasGold = hero.gold >= cost;

                  return (
                    <div
                      key={item.id}
                      className="bg-slate-900/60 backdrop-blur-xl border border-slate-850 rounded-2xl p-4 flex items-center justify-between gap-4 shadow"
                    >
                      <div className="flex items-center gap-3">
                        <ItemGraphic templateId={item.templateId} isCorrupted={item.isCorrupted} isCursed={item.isCursed} isIdentified={item.isIdentified} className="w-12 h-12" />
                        <div>
                          <h4 className={`text-xs font-black uppercase leading-tight ${getRarityTextClass(item.rarity)}`}>
                            {getTranslatedItemName(t, item)}
                          </h4>
                          <div className="text-[9px] font-bold text-slate-500 mt-1 uppercase tracking-wide">
                            {language === 'vi' ? `Cấp độ: +${item.level}` : `Level: +${item.level}`}
                          </div>
                          
                          {/* Display main stat comparison */}
                          <div className="text-[10px] text-slate-400 font-semibold mt-1">
                            {item.slot === 'weapon' && (
                              <span>⚔️ {language === 'vi' ? 'Tấn công' : 'Attack'}: {finalStats.attack}</span>
                            )}
                            {item.slot === 'armor' && (
                              <span>🛡️ {language === 'vi' ? 'Phòng thủ' : 'Defense'}: {finalStats.defense}</span>
                            )}
                            {item.slot === 'helmet' && (
                              <span>💖 HP: {finalStats.maxHp}</span>
                            )}
                            {item.slot === 'boots' && (
                              <span>⚡ {language === 'vi' ? 'Tốc độ' : 'Speed'}: {finalStats.speed}</span>
                            )}
                            {item.slot === 'ring' && (
                              <span>🎯 Crit: {Math.round(finalStats.critRate * 100)}%</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right flex flex-col justify-between h-full py-0.5 gap-2 items-end">
                        <div className="text-right">
                          <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wider leading-none">
                            {language === 'vi' ? 'PHÍ NÂNG' : 'REFINE COST'}
                          </span>
                          <span className={`text-[11px] font-bold font-mono mt-0.5 block ${hasGold ? 'text-yellow-450' : 'text-rose-500'}`}>
                            {cost.toLocaleString()} 💰
                          </span>
                        </div>

                        <button
                          onClick={() => upgradeEquipment(item.id)}
                          disabled={!hasGold}
                          className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition cursor-pointer ${
                            hasGold
                              ? 'bg-amber-600 hover:bg-amber-500 border border-amber-500/35 text-white active:scale-95 shadow shadow-amber-600/10'
                              : 'bg-slate-950/60 border border-slate-900 text-slate-650 cursor-not-allowed'
                          }`}
                        >
                          {language === 'vi' ? 'Cường hóa (+1)' : 'Upgrade (+1)'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
