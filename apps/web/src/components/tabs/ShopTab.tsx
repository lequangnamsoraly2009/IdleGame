import React, { useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { useTranslation } from '../../utils/i18n';
import { useLanguageStore } from '../../stores/languageStore';
import { SummonTab } from './SummonTab';
import { ItemGraphic } from '../ItemGraphic';
import { calculateDismantleRewards, GAME_ICONS } from '@idle-rpg/shared';

const PotionIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" className={`${className} drop-shadow-[0_0_6px_rgba(239,68,68,0.7)]`} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Liquid inside */}
    <path d="M6 14L8 9H16L18 14C19.2 16.5 18 20 15 20H9C6 20 4.8 16.5 6 14Z" fill="url(#potionLiquidShop)" />
    {/* Bottle outline */}
    <path d="M9 3H15V6H9V3Z" fill="#b45309" stroke="#78350f" strokeWidth="1.5" />
    <path d="M8 6H16L20 15C21.5 18.5 19 21 15.5 21H8.5C5 21 2.5 18.5 4 15L8 6Z" stroke="#94a3b8" strokeWidth="2" strokeLinejoin="round" />
    {/* Highlights */}
    <path d="M7.5 11C7 9.5 8.5 7.5 8.5 7.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
    <defs>
      <linearGradient id="potionLiquidShop" x1="12" y1="9" x2="12" y2="20" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#fca5a5" />
        <stop offset="35%" stopColor="#ef4444" />
        <stop offset="100%" stopColor="#991b1b" />
      </linearGradient>
    </defs>
  </svg>
);

const GoldPackIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" className="w-[22px] h-[22px] drop-shadow-[0_0_8px_rgba(234,179,8,0.85)]" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 16C5 12 5 7 12 5C19 7 19 12 18 16C17 20 7 20 6 16Z" fill="url(#goldLiquid)" stroke="#d97706" strokeWidth="2" />
    <path d="M10 5C10 4 11 3 12 3C13 3 14 4 14 5" stroke="#d97706" strokeWidth="2" />
    <path d="M8 8C10 9.5 14 9.5 16 8" stroke="#f59e0b" strokeWidth="1.5" />
    <text x="12" y="15" fill="#fef08a" fontSize="8" fontWeight="black" textAnchor="middle" fontFamily="sans-serif">G</text>
    <defs>
      <linearGradient id="goldLiquid" x1="12" y1="5" x2="12" y2="20" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#fef08a" />
        <stop offset="50%" stopColor="#f59e0b" />
        <stop offset="100%" stopColor="#b45309" />
      </linearGradient>
    </defs>
  </svg>
);

const PotionChestIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" className="w-[22px] h-[22px] drop-shadow-[0_0_8px_rgba(168,85,247,0.85)]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 14h18" stroke="#a855f7" />
    <path d="M12 14v4" stroke="#a855f7" />
    <path d="M3 10V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4M21 14v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="#a855f7" />
    <circle cx="12" cy="14" r="2.5" fill="#ef4444" stroke="#f87171" strokeWidth="1" />
  </svg>
);

const SpeedElixirIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" className="w-[22px] h-[22px] drop-shadow-[0_0_8px_rgba(59,130,246,0.85)]" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 14L8 9H16L18 14C19.2 16.5 18 20 15 20H9C6 20 4.8 16.5 6 14Z" fill="url(#speedLiquid)" />
    <path d="M9 3H15V6H9V3Z" fill="#b45309" stroke="#78350f" strokeWidth="1.5" />
    <path d="M8 6H16L20 15C21.5 18.5 19 21 15.5 21H8.5C5 21 2.5 18.5 4 15L8 6Z" stroke="#3b82f6" strokeWidth="2" strokeLinejoin="round" />
    <path d="M11 10L9 14H13L11 18" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <defs>
      <linearGradient id="speedLiquid" x1="12" y1="9" x2="12" y2="20" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#93c5fd" />
        <stop offset="40%" stopColor="#3b82f6" />
        <stop offset="100%" stopColor="#1e3a8a" />
      </linearGradient>
    </defs>
  </svg>
);

const ExpCharmIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" className="w-[20px] h-[20px] drop-shadow-[0_0_8px_rgba(168,85,247,0.85)]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="#a855f7" />
    <path d="M14 2v6h6" stroke="#a855f7" />
    <path d="M16 13H8" stroke="#a855f7" />
    <path d="M16 17H8" stroke="#a855f7" />
    <path d="M10 9H8" stroke="#a855f7" />
  </svg>
);

export const ShopTab: React.FC = () => {
  const { saveData, buyGoldPack, buyShardUpgrade, buyAetherChest, buyAetherDiamonds, dismantleMultipleEquipment, addLogMessage, buyPotion, buyBooster } = useGameStore();
  const { t } = useTranslation();
  const { language } = useLanguageStore();
  const [subTab, setSubTab] = useState<'gold_shop' | 'diamond_shop' | 'summon' | 'aether'>('gold_shop');
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [bulkItem, setBulkItem] = useState<{
    id: 'potion_gold' | 'potion_diamonds' | 'speed_elixir' | 'exp_charm' | 'gold_pack';
    name: string;
    unitPrice: number;
    currency: 'gold' | 'diamonds';
    icon: React.ReactNode;
  } | null>(null);
  const [bulkQty, setBulkQty] = useState<number>(10);

  const openBulkModal = (
    id: 'potion_gold' | 'potion_diamonds' | 'speed_elixir' | 'exp_charm' | 'gold_pack',
    name: string,
    unitPrice: number,
    currency: 'gold' | 'diamonds',
    icon: React.ReactNode
  ) => {
    setBulkItem({ id, name, unitPrice, currency, icon });
    setBulkQty(10);
  };

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
      <div className="flex gap-1 bg-slate-950/85 p-1.5 rounded-xl border border-slate-900 mb-4 select-none shrink-0 max-w-fit overflow-x-auto scrollbar-none">
        {([
          { id: 'gold_shop', label: language === 'vi' ? '💰 Shop Vàng' : '💰 Gold Shop' },
          { id: 'diamond_shop', label: language === 'vi' ? '💎 Shop Kim Cương' : '💎 Diamond Shop' },
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
              className={`text-[10px] sm:text-xs font-bold py-2 px-3 sm:px-4 rounded-lg cursor-pointer transition active:scale-95 whitespace-nowrap ${subTab === tab.id
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/10'
                : isSummonLocked
                  ? 'text-slate-655 opacity-40 cursor-not-allowed'
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
        {subTab === 'gold_shop' && (
          <div className="flex flex-col h-full overflow-hidden select-none">
            {/* Top info bar */}
            {/* <div className="bg-slate-950/45 border border-slate-900/60 rounded-2xl p-3.5 flex justify-between items-center mb-4 shrink-0 select-none">
              <div>
                <h4 className="text-xs font-black uppercase text-slate-350 tracking-wider">
                  {language === 'vi' ? 'Dược Phẩm Bằng Vàng' : 'Gold Consumables'}
                </h4>
                <p className="text-[10px] text-slate-500 mt-0.5 leading-normal">
                  {language === 'vi'
                    ? 'Bình HP tự động dùng khi máu xuống dưới 35%.'
                    : 'HP potions are automatically consumed when HP drops below 35%.'}
                </p>
              </div>
              <span className="text-[10.5px] px-2.5 py-1.5 bg-emerald-950/70 border border-emerald-500/25 text-emerald-300 font-extrabold rounded-xl flex items-center gap-1.5 shadow-sm">
                {language === 'vi' ? 'Đang có:' : 'Owned:'} <strong className="text-white font-mono">{hero.potions ?? 5}</strong> <PotionIcon className="w-4 h-4" />
              </span>
            </div> */}
            <div className="flex-grow overflow-y-auto pr-1 pb-4 scrollbar-none">
              <div className="grid grid-cols-3 gap-2">
                {/* Card 1: 1 Potion */}
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-2.5 flex flex-col justify-between hover:bg-slate-900/80 hover:border-slate-700/60 transition duration-200">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-11 h-11 rounded-xl bg-slate-950/80 border border-slate-850 flex items-center justify-center text-xl shadow-inner mb-2 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-b from-red-500/5 to-transparent opacity-60" />
                      <PotionIcon className="w-5 h-5 shrink-0" />
                    </div>
                    <h5 className="text-[10px] sm:text-[10.5px] font-black text-white uppercase tracking-wider font-display mb-1 leading-tight">
                      {language === 'vi' ? '1 Bình Máu' : '1 Health Potion'}
                    </h5>
                    <span className="text-[7.5px] px-1.5 py-0.2 bg-slate-950 border border-slate-850 text-slate-450 font-extrabold rounded mb-2 uppercase tracking-wide">
                      {language === 'vi' ? 'Giá Gốc' : 'Standard Price'}
                    </span>
                    <p className="text-[9px] text-slate-400 leading-snug mb-3 font-medium">
                      {language === 'vi' ? 'Hồi phục 30% HP tối đa.' : 'Recover 30% max HP.'}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1.5 mt-auto w-full select-none">
                    <button
                      onClick={() => openBulkModal('potion_gold', language === 'vi' ? 'Bình Máu' : 'Health Potion', 200, 'gold', <PotionIcon className="w-5 h-5" />)}
                      disabled={hero.gold < 200}
                      className="w-full bg-slate-850 hover:bg-slate-800 text-slate-350 hover:text-white font-bold h-8 px-2 rounded-lg border border-slate-750/50 flex items-center justify-center text-[8.5px] sm:text-[9.5px] disabled:opacity-40 disabled:pointer-events-none cursor-pointer transition active:scale-95 whitespace-nowrap animate-green-glow"
                    >
                      {language === 'vi' ? 'MUA NHIỀU' : 'BUY BULK'}
                    </button>
                    <button
                      onClick={() => buyPotion(1, 'gold')}
                      disabled={hero.gold < 200}
                      className="w-full bg-gradient-to-r from-slate-800 to-slate-700 hover:brightness-110 active:scale-[0.98] transition-all text-white font-black h-10 px-2.5 rounded-lg border border-slate-750/70 flex justify-between items-center text-[9px] sm:text-[10px] disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                    >
                      <span>{language === 'vi' ? 'MUA' : 'BUY'}</span>
                      <span className="text-yellow-450 font-black font-mono">200 {GAME_ICONS.GOLD}</span>
                    </button>
                  </div>
                </div>
 
                {/* Card 2: 5 Potions */}
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-2.5 flex flex-col justify-between hover:bg-slate-900/80 hover:border-slate-700/60 transition duration-200">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-11 h-11 rounded-xl bg-slate-950/80 border border-slate-850 flex items-center justify-center text-xl shadow-inner mb-2 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent opacity-60" />
                      <div className="relative flex w-5 h-6 shrink-0">
                        <PotionIcon className="w-4.5 h-4.5 absolute left-0 top-0 z-10" />
                        <PotionIcon className="w-4.5 h-4.5 absolute right-0 bottom-0 opacity-80" />
                      </div>
                    </div>
                    <h5 className="text-[10px] sm:text-[10.5px] font-black text-white uppercase tracking-wider font-display mb-1 leading-tight">
                      {language === 'vi' ? 'Gói 5 Bình Máu' : '5 Potions Pack'}
                    </h5>
                    <span className="text-[7.5px] px-1.5 py-0.2 bg-amber-500/10 border border-amber-500/20 text-amber-400 font-extrabold rounded mb-2 uppercase tracking-wide">
                      {language === 'vi' ? 'Tiết Kiệm 100' : 'Save 100 G'}
                    </span>
                    <p className="text-[9px] text-slate-400 leading-snug mb-3 font-medium">
                      {language === 'vi' ? 'Cho người chơi cắm máy rảnh tay.' : 'Great value package for longer runs.'}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1.5 mt-auto w-full select-none">
                    <div className="flex justify-end select-none w-full">
                      <span className="text-[9px] text-slate-400 font-mono font-medium">
                        {language === 'vi' ? 'Còn: ' : 'Left: '}{100 - (hero.dailyPurchases?.potion_5 || 0)}/100
                      </span>
                    </div>
                    <div className="h-8" />
                    <button
                      onClick={() => buyPotion(5, 'gold')}
                      disabled={hero.gold < 900 || (hero.dailyPurchases?.potion_5 || 0) + 5 > 100}
                      className="w-full bg-gradient-to-r from-amber-600 to-yellow-600 hover:brightness-110 active:scale-[0.98] transition-all text-slate-950 font-black h-10 px-2.5 rounded-lg border border-amber-450/30 flex justify-between items-center text-[9px] sm:text-[10px] disabled:opacity-40 disabled:pointer-events-none cursor-pointer animate-green-glow"
                    >
                      <span>{language === 'vi' ? 'MUA' : 'BUY'}</span>
                      <span className="text-amber-955 font-black font-mono">900 {GAME_ICONS.GOLD}</span>
                    </button>
                  </div>
                </div>
 
                {/* Card 3: 10 Potions */}
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-2.5 flex flex-col justify-between hover:bg-slate-900/80 hover:border-slate-700/60 transition duration-200">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-11 h-11 rounded-xl bg-slate-950/80 border border-slate-850 flex items-center justify-center text-xl shadow-inner mb-2 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent opacity-60" />
                      <div className="relative flex w-5 h-6 shrink-0">
                        <PotionIcon className="w-4.5 h-4.5 absolute left-0 top-0 z-10" />
                        <PotionIcon className="w-4.5 h-4.5 absolute right-0 bottom-0 opacity-80" />
                        <span className="absolute -top-1.5 -right-0.5 text-[7px] animate-pulse">✨</span>
                      </div>
                    </div>
                    <h5 className="text-[10px] sm:text-[10.5px] font-black text-white uppercase tracking-wider font-display mb-1 leading-tight">
                      {language === 'vi' ? 'Thùng 10 Bình' : '10 Potions Chest'}
                    </h5>
                    <span className="text-[7.5px] px-1.5 py-0.2 bg-purple-500/15 border border-purple-500/20 text-purple-400 font-extrabold rounded mb-2 uppercase tracking-wide">
                      {language === 'vi' ? 'Tiết Kiệm 300' : 'Save 300 G'}
                    </span>
                    <p className="text-[9px] text-slate-400 leading-snug mb-3 font-medium">
                      {language === 'vi' ? 'Tốt nhất để cày ải qua đêm.' : 'Best bulk deal for farming.'}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1.5 mt-auto w-full select-none">
                    <div className="flex justify-end select-none w-full">
                      <span className="text-[9px] text-slate-400 font-mono font-medium">
                        {language === 'vi' ? 'Còn: ' : 'Left: '}{100 - (hero.dailyPurchases?.potion_10 || 0)}/100
                      </span>
                    </div>
                    <div className="h-8" />
                    <button
                      onClick={() => buyPotion(10, 'gold')}
                      disabled={hero.gold < 1700 || (hero.dailyPurchases?.potion_10 || 0) + 10 > 100}
                      className="w-full bg-gradient-to-r from-purple-650 to-indigo-650 hover:brightness-110 active:scale-[0.98] transition-all text-white font-black h-10 px-2.5 rounded-lg border border-purple-500/25 flex justify-between items-center text-[9px] sm:text-[10px] disabled:opacity-40 disabled:pointer-events-none cursor-pointer animate-green-glow"
                    >
                      <span>{language === 'vi' ? 'MUA' : 'BUY'}</span>
                      <span className="text-purple-300 font-black font-mono">1,700 {GAME_ICONS.GOLD}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {subTab === 'diamond_shop' && (
          <div className="flex flex-col h-full overflow-hidden select-none">
            {/* Top info bar */}
            {/* <div className="bg-slate-950/45 border border-slate-900/60 rounded-2xl p-3.5 flex justify-between items-center mb-4 shrink-0 select-none">
              <div>
                <h4 className="text-xs font-black uppercase text-slate-350 tracking-wider">
                  {language === 'vi' ? 'Chợ Kim Cương' : 'Diamond Market'}
                </h4>
                <p className="text-[10px] text-slate-500 mt-0.5 leading-normal">
                  {language === 'vi'
                    ? 'Quy đổi Kim Cương lấy tiền tệ, rương lớn hoặc bùa tăng tốc.'
                    : 'Exchange diamonds for packages, chests, and boosters.'}
                </p>
              </div>
              <span className="text-[10.5px] px-2.5 py-1.5 bg-blue-950/70 border border-blue-500/25 text-blue-300 font-extrabold rounded-xl flex items-center gap-1.5 shadow-sm">
                {language === 'vi' ? 'Số dư:' : 'Balance:'} <strong className="text-white font-mono">{hero.diamonds}</strong> 💎
              </span>
            </div> */}

            {/* Grid list of cards */}
            <div className="flex-grow overflow-y-auto pr-1 pb-4 scrollbar-none">
              <div className="grid grid-cols-3 gap-2">
                {/* Card 1: Gold Pack */}
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-2.5 flex flex-col justify-between hover:bg-slate-900/80 hover:border-slate-700/60 transition duration-200">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-11 h-11 rounded-xl bg-slate-950/80 border border-slate-850 flex items-center justify-center text-xl shadow-inner mb-2 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-b from-yellow-500/5 to-transparent opacity-60" />
                      <GoldPackIcon />
                    </div>
                    <h5 className="text-[10px] sm:text-[10.5px] font-black text-white uppercase tracking-wider font-display mb-1 leading-tight">
                      {t('gold_pack_title')}
                    </h5>
                    <span className="text-[7.5px] px-1 py-0.2 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 font-extrabold rounded mb-2 uppercase tracking-wide">
                      {language === 'vi' ? 'Tăng Theo Stage' : 'Scale with Stage'}
                    </span>
                    <p className="text-[9px] text-slate-400 leading-snug mb-3 font-medium">
                      {t('gold_pack_desc', { gold: 800 * saveData.activeStage })}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1.5 mt-auto w-full select-none">
                    <button
                      onClick={() => openBulkModal('gold_pack', language === 'vi' ? 'Gói Vàng' : 'Gold Pack', 15, 'diamonds', <GoldPackIcon />)}
                      disabled={hero.diamonds < 15}
                      className="w-full bg-slate-850 hover:bg-slate-800 text-slate-350 hover:text-white font-bold h-8 px-2 rounded-lg border border-slate-750/50 flex items-center justify-center text-[8.5px] sm:text-[9.5px] disabled:opacity-40 disabled:pointer-events-none cursor-pointer transition active:scale-95 whitespace-nowrap animate-green-glow"
                    >
                      {language === 'vi' ? 'MUA NHIỀU' : 'BUY BULK'}
                    </button>
                    <button
                      onClick={() => buyGoldPack(1)}
                      disabled={hero.diamonds < 15}
                      className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 hover:brightness-110 active:scale-[0.98] transition-all text-slate-950 font-black h-10 px-2.5 rounded-lg border border-yellow-455/30 flex justify-between items-center text-[9px] sm:text-[10px] disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                    >
                      <span>{language === 'vi' ? 'ĐỔI' : 'BUY'}</span>
                      <span className="text-amber-955 font-black font-mono">15 {GAME_ICONS.DIAMOND}</span>
                    </button>
                  </div>
                </div>

                {/* Card 2: Potion Chest */}
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-2.5 flex flex-col justify-between hover:bg-slate-900/80 hover:border-slate-700/60 transition duration-200">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-11 h-11 rounded-xl bg-slate-950/80 border border-slate-850 flex items-center justify-center text-xl shadow-inner mb-2 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent opacity-60" />
                      <PotionChestIcon />
                    </div>
                    <h5 className="text-[10px] sm:text-[10.5px] font-black text-white uppercase tracking-wider font-display mb-1 leading-tight">
                      {language === 'vi' ? 'Rương Bình Máu' : 'Potion Chest'}
                    </h5>
                    <span className="text-[7.5px] px-1 py-0.2 bg-purple-500/15 border border-purple-500/20 text-purple-400 font-extrabold rounded mb-2 uppercase tracking-wide">
                      {language === 'vi' ? 'Tiết Kiệm 20%' : 'Save 20%'}
                    </span>
                    <p className="text-[9px] text-slate-400 leading-snug mb-3 font-medium">
                      {language === 'vi' ? 'Nhận ngay 30 Bình HP cắm máy.' : 'Get 30 HP potions for auto runs.'}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1.5 mt-auto w-full select-none">
                    <div className="flex justify-end select-none w-full">
                      <span className="text-[9px] text-slate-400 font-mono font-medium">
                        {language === 'vi' ? 'Còn: ' : 'Left: '}{100 - (hero.dailyPurchases?.potion_30 || 0)}/100
                      </span>
                    </div>
                    <button
                      onClick={() => openBulkModal('potion_diamonds', language === 'vi' ? 'Rương Bình Máu' : 'Potion Chest', 40, 'diamonds', <PotionChestIcon />)}
                      disabled={hero.diamonds < 40 || (hero.dailyPurchases?.potion_30 || 0) >= 100}
                      className="w-full bg-slate-850 hover:bg-slate-800 text-slate-350 hover:text-white font-bold h-8 px-2 rounded-lg border border-slate-750/50 flex items-center justify-center text-[8.5px] sm:text-[9.5px] disabled:opacity-40 disabled:pointer-events-none cursor-pointer transition active:scale-95 whitespace-nowrap animate-green-glow"
                    >
                      {language === 'vi' ? 'MUA NHIỀU' : 'BUY BULK'}
                    </button>
                    <button
                      onClick={() => buyPotion(30, 'diamonds')}
                      disabled={hero.diamonds < 40 || (hero.dailyPurchases?.potion_30 || 0) + 1 > 100}
                      className="w-full bg-gradient-to-r from-purple-650 to-indigo-650 hover:brightness-110 active:scale-[0.98] transition-all text-white font-black h-10 px-2.5 rounded-lg border border-purple-500/25 flex justify-between items-center text-[9px] sm:text-[10px] disabled:opacity-40 disabled:pointer-events-none cursor-pointer animate-green-glow"
                    >
                      <span>{language === 'vi' ? 'MỞ' : 'OPEN'}</span>
                      <span className="text-purple-300 font-black font-mono">40 {GAME_ICONS.DIAMOND}</span>
                    </button>
                  </div>
                </div>

                {/* Card 3: Speed Elixir */}
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-2.5 flex flex-col justify-between hover:bg-slate-900/80 hover:border-slate-700/60 transition duration-200">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-11 h-11 rounded-xl bg-slate-950/80 border border-slate-850 flex items-center justify-center text-xl shadow-inner mb-2 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent opacity-60" />
                      <SpeedElixirIcon />
                    </div>
                    <h5 className="text-[10px] sm:text-[10.5px] font-black text-white uppercase tracking-wider font-display mb-1 leading-tight">
                      {t('shop_speed_elixir')}
                    </h5>
                    <span className="text-[7.5px] px-1 py-0.2 bg-blue-500/10 border border-blue-500/20 text-blue-400 font-extrabold rounded mb-2 uppercase tracking-wide">
                      {language === 'vi' ? 'Bổ Trợ' : 'Booster'} • {language === 'vi' ? 'Đang có:' : 'Owned:'} {hero.speedElixirs ?? 0}
                    </span>
                    <p className="text-[9px] text-slate-400 leading-snug mb-3 font-medium">
                      {t('shop_speed_elixir_desc')}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1.5 mt-auto w-full select-none">
                    <button
                      onClick={() => openBulkModal('speed_elixir', language === 'vi' ? 'Thuốc Tốc Độ' : 'Speed Elixir', 10, 'diamonds', <SpeedElixirIcon />)}
                      disabled={hero.diamonds < 10}
                      className="w-full bg-slate-850 hover:bg-slate-800 text-slate-350 hover:text-white font-bold h-8 px-2 rounded-lg border border-slate-750/50 flex items-center justify-center text-[8.5px] sm:text-[9.5px] disabled:opacity-40 disabled:pointer-events-none cursor-pointer transition active:scale-95 whitespace-nowrap animate-green-glow"
                    >
                      {language === 'vi' ? 'MUA NHIỀU' : 'BUY BULK'}
                    </button>
                    <button
                      onClick={() => buyBooster('speed_elixir', 1)}
                      disabled={hero.diamonds < 10}
                      className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:brightness-110 active:scale-[0.98] transition-all text-white font-black h-10 px-2.5 rounded-lg border border-blue-500/25 flex justify-between items-center text-[9px] sm:text-[10px] disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                    >
                      <span>{language === 'vi' ? 'MUA' : 'BUY'}</span>
                      <span className="text-blue-300 font-black font-mono">10 {GAME_ICONS.DIAMOND}</span>
                    </button>
                  </div>
                </div>

                {/* Card 4: EXP Charm */}
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-2.5 flex flex-col justify-between hover:bg-slate-900/80 hover:border-slate-700/60 transition duration-200">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-11 h-11 rounded-xl bg-slate-950/80 border border-slate-850 flex items-center justify-center text-xl shadow-inner mb-2 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent opacity-60" />
                      <ExpCharmIcon />
                    </div>
                    <h5 className="text-[10px] sm:text-[10.5px] font-black text-white uppercase tracking-wider font-display mb-1 leading-tight">
                      {t('shop_exp_charm')}
                    </h5>
                    <span className="text-[7.5px] px-1 py-0.2 bg-purple-500/10 border border-purple-500/20 text-purple-400 font-extrabold rounded mb-2 uppercase tracking-wide">
                      {language === 'vi' ? 'Bổ Trợ' : 'Booster'} • {language === 'vi' ? 'Đang có:' : 'Owned:'} {hero.expCharms ?? 0}
                    </span>
                    <p className="text-[9px] text-slate-400 leading-snug mb-3 font-medium">
                      {t('shop_exp_charm_desc')}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1.5 mt-auto w-full select-none">
                    <button
                      onClick={() => openBulkModal('exp_charm', language === 'vi' ? 'Bùa EXP' : 'EXP Charm', 10, 'diamonds', <ExpCharmIcon />)}
                      disabled={hero.diamonds < 10}
                      className="w-full bg-slate-850 hover:bg-slate-800 text-slate-350 hover:text-white font-bold h-8 px-2 rounded-lg border border-slate-750/50 flex items-center justify-center text-[8.5px] sm:text-[9.5px] disabled:opacity-40 disabled:pointer-events-none cursor-pointer transition active:scale-95 whitespace-nowrap animate-green-glow"
                    >
                      {language === 'vi' ? 'MUA NHIỀU' : 'BUY BULK'}
                    </button>
                    <button
                      onClick={() => buyBooster('exp_charm', 1)}
                      disabled={hero.diamonds < 10}
                      className="w-full bg-gradient-to-r from-purple-650 to-pink-650 hover:brightness-110 active:scale-[0.98] transition-all text-white font-black h-10 px-2.5 rounded-lg border border-purple-500/25 flex justify-between items-center text-[9px] sm:text-[10px] disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                    >
                      <span>{language === 'vi' ? 'MUA' : 'BUY'}</span>
                      <span className="text-purple-300 font-black font-mono">10 {GAME_ICONS.DIAMOND}</span>
                    </button>
                  </div>
                </div>
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
                              <span className="absolute bottom-0.5 right-0.5 text-[7px] font-black text-slate-400 bg-slate-950/50 px-0.5 rounded leading-none z-20">
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
                          : 'bg-slate-850 hover:bg-slate-800 text-slate-350 border-slate-750';
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
                          : 'bg-emerald-950/20 hover:bg-emerald-900/35 text-emerald-405 border-emerald-500/10';
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
                          : 'bg-blue-950/20 hover:bg-blue-900/35 text-blue-405 border-blue-500/10';
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
                          : 'bg-purple-950/20 hover:bg-purple-900/35 text-purple-405 border-purple-500/10';
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
                      disabled={(hero.aetherShards || 0) < 300 || inventory.length >= 50}
                      className="w-full bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-slate-950 text-xs font-extrabold py-2.5 px-4 rounded-xl border border-amber-500/20 active:scale-[0.98] transition flex justify-between items-center disabled:opacity-40 cursor-pointer"
                    >
                      <span>{inventory.length >= 50 ? 'Hành lý đầy' : 'Mở Rương'}</span>
                      <span className="bg-slate-950/40 text-amber-950 px-2 py-0.5 rounded border border-amber-500/10 font-bold">
                        300 {GAME_ICONS.AETHER}
                      </span>
                    </button>
                  </div>

                  {/* Diamond Pack */}
                  <div className="p-4 bg-slate-950/60 border border-slate-900 hover:border-slate-850 rounded-xl transition-all duration-200">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className="text-xs font-extrabold text-blue-400 block">{GAME_ICONS.DIAMOND} ĐỔI KIM CƯƠNG (Diamonds)</span>
                        <span className="text-[10px] text-slate-500 block mt-0.5">Đổi 100 Mảnh Aether lấy +200 Kim Cương phục vụ các giao dịch khác.</span>
                      </div>
                    </div>
                    <button
                      onClick={buyAetherDiamonds}
                      disabled={(hero.aetherShards || 0) < 100}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold py-2.5 px-4 rounded-xl border border-blue-400/20 active:scale-[0.98] transition flex justify-between items-center disabled:opacity-40 cursor-pointer"
                    >
                      <span>Đổi +200 {GAME_ICONS.DIAMOND}</span>
                      <span className="bg-slate-950/40 text-blue-300 px-2 py-0.5 rounded border border-blue-500/10 font-bold">
                        100 {GAME_ICONS.AETHER}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-slate-550 mt-4 text-center">
                * Hành lý cần có nhất 1 chỗ trống khi mở Rương Thần Khí Aether.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Purchase Modal */}
      {bulkItem && (() => {
        const dailyPurchases = hero.dailyPurchases || {};
        let limitKey = '';
        if (bulkItem.id === 'potion_diamonds') {
          limitKey = 'potion_30';
        }

        const currentCount = limitKey ? (dailyPurchases[limitKey] || 0) : 0;
        const isLimitExceeded = limitKey ? (currentCount + bulkQty > 100) : false;

        return (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 w-80 max-w-full shadow-2xl relative select-none animate-in fade-in zoom-in-95 duration-150">
              {/* Close Button */}
              <button
                onClick={() => setBulkItem(null)}
                className="absolute top-2.5 right-2.5 text-slate-500 hover:text-white cursor-pointer w-6 h-6 flex items-center justify-center rounded-full hover:bg-slate-800 transition font-bold"
              >
                ✕
              </button>

              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-950/95 border border-slate-850 flex items-center justify-center text-xl shadow-inner mb-3">
                  {bulkItem.icon}
                </div>
                <h4 className="text-xs font-black uppercase text-slate-200 tracking-wider mb-0.5 leading-none">
                  {language === 'vi' ? 'Mua Nhiều' : 'Buy Bulk'}
                </h4>
                <p className="text-[11px] font-black text-amber-500 mt-1.5 uppercase tracking-wide">
                  {bulkItem.name}
                </p>
              </div>

              {/* Input & Adjuster Buttons */}
              <div className="mt-4 flex items-center justify-between bg-slate-950 border border-slate-850 rounded-xl p-1.5 w-full">
                <button
                  onClick={() => setBulkQty(prev => Math.max(1, prev - 1))}
                  className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white font-extrabold flex items-center justify-center cursor-pointer active:scale-90 transition select-none"
                >
                  -
                </button>
                <input
                  type="number"
                  value={bulkQty}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setBulkQty(isNaN(val) ? 1 : Math.max(1, val));
                  }}
                  className="bg-transparent text-center font-mono font-black text-sm text-white w-20 outline-none focus:ring-0"
                />
                <button
                  onClick={() => setBulkQty(prev => prev + 1)}
                  className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white font-extrabold flex items-center justify-center cursor-pointer active:scale-90 transition select-none"
                >
                  +
                </button>
              </div>

              {/* Presets Row */}
              <div className="mt-3.5 flex justify-between gap-1.5">
                {[10, 20, 50, 100].map(qty => (
                  <button
                    key={qty}
                    onClick={() => setBulkQty(qty)}
                    className={`flex-1 py-1.5 text-[10px] font-extrabold rounded-lg border transition cursor-pointer active:scale-95 ${bulkQty === qty
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                        : 'bg-slate-950/60 border-slate-850 text-slate-450 hover:text-slate-200'
                      }`}
                  >
                    +{qty}
                  </button>
                ))}
              </div>

              {/* Cost & Submit Button */}
              <div className="mt-5 pt-3.5 border-t border-slate-850/60 flex flex-col gap-2.5">
                <div className="flex justify-between items-center text-[10.5px] font-black uppercase text-slate-400">
                  <span>{language === 'vi' ? 'Tổng Chi Phí:' : 'Total Cost:'}</span>
                  <span className="text-white font-mono font-extrabold text-xs">
                    {Number(bulkItem.unitPrice * bulkQty).toLocaleString()}{' '}
                    {bulkItem.currency === 'gold' ? 'G' : '💎'}
                  </span>
                </div>

                <button
                  disabled={isLimitExceeded}
                  onClick={() => {
                    const cost = bulkItem.unitPrice * bulkQty;
                    if (bulkItem.currency === 'gold') {
                      if (hero.gold < cost) {
                        addLogMessage(language === 'vi' ? '❌ Không đủ Vàng!' : '❌ Insufficient Gold!', 'system');
                        return;
                      }
                    } else {
                      if (hero.diamonds < cost) {
                        addLogMessage(language === 'vi' ? '❌ Không đủ Kim Cương!' : '❌ Insufficient Diamonds!', 'system');
                        return;
                      }
                    }

                    if (bulkItem.id === 'potion_gold') {
                      buyPotion(bulkQty, 'gold');
                    } else if (bulkItem.id === 'potion_diamonds') {
                      buyPotion(bulkQty * 30, 'diamonds');
                    } else if (bulkItem.id === 'speed_elixir') {
                      buyBooster('speed_elixir', bulkQty);
                    } else if (bulkItem.id === 'exp_charm') {
                      buyBooster('exp_charm', bulkQty);
                    } else if (bulkItem.id === 'gold_pack') {
                      buyGoldPack(bulkQty);
                    }
                    setBulkItem(null);
                  }}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 active:scale-98 transition-all text-white font-black py-2.5 rounded-xl border border-emerald-500/20 text-xs shadow-md cursor-pointer flex flex-col items-center justify-center gap-0.5 disabled:opacity-40 disabled:pointer-events-none"
                >
                  <span>{language === 'vi' ? 'XÁC NHẬN MUA' : 'CONFIRM PURCHASE'}</span>
                  {limitKey && (
                    <span className="text-[8.5px] opacity-75 font-mono">
                      {language === 'vi'
                        ? `Giới hạn hôm nay: ${currentCount + bulkQty}/100`
                        : `Daily Limit: ${currentCount + bulkQty}/100`}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
