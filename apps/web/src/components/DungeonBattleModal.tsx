import React from 'react';
import { useGameStore } from '../stores/gameStore';
import { useLanguageStore } from '../stores/languageStore';
import { GAME_ICONS } from '@idle-rpg/shared';
import { ItemGraphic } from './ItemGraphic';
import { GemGraphic } from './GemGraphic';
import { useTranslation, getTranslatedItemName } from '../utils/i18n';

const DUNGEON_BOSSES: Record<string, {
  nameVi: string;
  nameEn: string;
  emoji: string;
}> = {
  gem_1: { nameVi: 'Vệ Binh Golem', nameEn: 'Guardian Golem', emoji: '⛰️' },
  gem_2: { nameVi: 'Ma Thần Lửa Efreet', nameEn: 'Fire Demon Efreet', emoji: '🔥' },
  gem_3: { nameVi: 'Rồng Bóng Tối Cổ Đại', nameEn: 'Ancient Shadow Dragon', emoji: '🐉' },
  gold_1: { nameVi: 'Thủ Lĩnh Goblin', nameEn: 'Goblin Chieftain', emoji: '🪙' },
  gold_2: { nameVi: 'Vua Goblin', nameEn: 'Goblin King', emoji: '👑' },
  gold_3: { nameVi: 'Rồng Vàng Hoàng Kim', nameEn: 'Golden Dragon', emoji: '🐉' },
  diamond_1: { nameVi: 'Nhện Tinh Thể', nameEn: 'Crystal Spider', emoji: '🕷️' },
  diamond_2: { nameVi: 'Golem Tinh Thể', nameEn: 'Gemstone Golem', emoji: '🔮' },
  diamond_3: { nameVi: 'Quái Thú Chimera Tinh Thể', nameEn: 'Diamond Chimera', emoji: '🦁' },
  gear_1: { nameVi: 'Hiệp Sĩ Quỷ', nameEn: 'Undead Knight', emoji: '💀' },
  gear_2: { nameVi: 'Cự Ma Phong Ấn', nameEn: 'Sealed Archdemon', emoji: '😈' },
  gear_3: { nameVi: 'Vệ Binh Cổ Tự', nameEn: 'Relic Sentinel', emoji: '🤖' }
};

export const DungeonBattleModal: React.FC = () => {
  const {
    saveData,
    activeDungeonId,
    dungeonResult,
    claimDungeonRewards,
    onDungeonDefeat,
    dungeonRewardGems,
    dungeonRewardGold,
    dungeonRewardDiamonds,
    dungeonRewardItems
  } = useGameStore();
  
  const { language } = useLanguageStore();
  const { t } = useTranslation();

  if (!saveData || !activeDungeonId || !dungeonResult) return null;

  const bossConfig = DUNGEON_BOSSES[activeDungeonId] || DUNGEON_BOSSES.gem_1;
  const bossName = language === 'vi' ? bossConfig.nameVi : bossConfig.nameEn;

  const handleVictoryClaim = () => {
    claimDungeonRewards();
  };

  const handleDefeatClose = () => {
    onDungeonDefeat();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4 select-none">
      {/* Background themed neon glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Main Container Card */}
      <div className="w-full max-w-lg bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-2xl relative flex flex-col items-center justify-center text-center overflow-hidden">
        
        {/* Victory Screen */}
        {dungeonResult === 'victory' && (
          <div className="w-full flex flex-col items-center animate-fade-in">
            {/* Spinning rays background glow */}
            <div className="absolute w-80 h-80 bg-[radial-gradient(circle,rgba(245,158,11,0.18)_0%,transparent_75%)] animate-pulse pointer-events-none" />

            <div className="w-16 h-16 rounded-full bg-gradient-to-b from-amber-400/20 to-yellow-600/10 border-2 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.35)] flex items-center justify-center text-3xl mb-4 animate-bounce">
              🏆
            </div>

            <h2 className="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 uppercase tracking-[0.2em] drop-shadow-[0_0_10px_rgba(245,158,11,0.25)]">
              {language === 'vi' ? 'VƯỢT ẢI CHIẾN THẮNG' : 'DUNGEON CLEARED'}
            </h2>
            <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-amber-500/60 to-transparent mt-1 mb-4" />
            
            <p className="text-xs text-slate-400 max-w-sm mb-6 leading-relaxed font-semibold">
              {language === 'vi' 
                ? `Chúc mừng! Bạn đã chinh phục thành công [${bossName}] và bảo vệ được kho báu cổ xưa.`
                : `Congratulations! You conquered [${bossName}] and secured the ancient chest.`}
            </p>

            {/* Rewards Display Card */}
            <div className="bg-slate-900 border border-slate-850 p-4 rounded-2xl w-full mb-8 flex flex-col items-center gap-2.5">
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                {language === 'vi' ? 'VẬT PHẨM NHẬN ĐƯỢC' : 'REWARDS OBTAINED'}
              </span>
              <div className="flex gap-2.5 flex-wrap justify-center mt-1 w-full">
                {/* Gems */}
                {dungeonRewardGems && 
                  Object.entries(dungeonRewardGems).map(([key, count]) => {
                    const [type, tier] = key.split('_');
                    const name = type === 'ruby' ? 'Hồng Ngọc' : type === 'topaz' ? 'Hoàng Ngọc' : type === 'emerald' ? 'Lục Bảo' : type === 'sapphire' ? 'Lam Bảo' : 'Thạch Anh';
                    return (
                      <span key={key} className="bg-slate-950 border border-slate-900 rounded-xl px-2.5 py-1.5 text-xs font-black text-white flex items-center gap-2 shadow">
                        <GemGraphic type={type} tier={parseInt(tier)} className="w-5 h-5" />
                        <span>{name} C.{tier}</span>
                        <span className="text-[10px] text-amber-500 ml-1">x{count}</span>
                      </span>
                    );
                  })
                }

                {/* Gold */}
                {dungeonRewardGold && (
                  <span className="bg-slate-950 border border-slate-900 rounded-xl px-3 py-1.5 text-xs font-black text-white flex items-center gap-2 shadow">
                    <span className="text-sm">{GAME_ICONS.GOLD}</span>
                    <span>+{dungeonRewardGold.toLocaleString()} Vàng</span>
                  </span>
                )}

                {/* Diamonds */}
                {dungeonRewardDiamonds && (
                  <span className="bg-slate-950 border border-slate-900 rounded-xl px-3 py-1.5 text-xs font-black text-white flex items-center gap-2 shadow">
                    <span className="text-sm">{GAME_ICONS.DIAMOND}</span>
                    <span>+{dungeonRewardDiamonds.toLocaleString()} Kim Cương</span>
                  </span>
                )}

                {/* Equipment Items */}
                {dungeonRewardItems && 
                  dungeonRewardItems.map((item) => (
                    <div key={item.id} className="bg-slate-950 border border-slate-900 rounded-xl p-2.5 flex items-center gap-2.5 shadow w-full max-w-xs justify-between">
                      <div className="flex items-center gap-2">
                        <ItemGraphic templateId={item.templateId} className="w-8 h-8 shrink-0" />
                        <div className="text-[10px] text-left">
                          <span className={`font-black uppercase block leading-tight ${
                            item.rarity === 'uncommon' ? 'text-emerald-400' :
                            item.rarity === 'rare' ? 'text-blue-400' :
                            item.rarity === 'epic' ? 'text-purple-400' :
                            'text-amber-500 font-extrabold'
                          }`}>
                            {getTranslatedItemName(t, item)}
                          </span>
                          <span className="text-[8px] text-slate-500 font-bold block mt-0.5 uppercase tracking-wide">
                            {item.slot}
                          </span>
                        </div>
                      </div>
                      <span className="text-[8px] bg-slate-900 border border-slate-800 text-slate-400 rounded px-1.5 py-0.5 uppercase font-black">
                        NEW
                      </span>
                    </div>
                  ))
                }
              </div>
            </div>

            <button
              onClick={handleVictoryClaim}
              className="px-8 py-3.5 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 border border-yellow-500/30 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition shadow-lg shadow-yellow-600/10 active:scale-[0.98] cursor-pointer relative z-10"
            >
              {language === 'vi' ? 'NHẬN THƯỞNG & ĐÓNG' : 'CLAIM REWARDS & CLOSE'}
            </button>
          </div>
        )}

        {/* Defeat Screen */}
        {dungeonResult === 'defeat' && (
          <div className="w-full flex flex-col items-center animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-red-950/20 border-2 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.25)] flex items-center justify-center text-3xl mb-4">
              💀
            </div>

            <h2 className="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-rose-600 uppercase tracking-[0.2em] drop-shadow-[0_0_10px_rgba(239,68,68,0.2)]">
              {language === 'vi' ? 'THẤT BẠI TRONG PHÓ BẢN' : 'CHALLENGE FAILED'}
            </h2>
            <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-red-500/60 to-transparent mt-1 mb-4" />
            
            <p className="text-xs text-slate-400 max-w-sm mb-8 leading-relaxed font-semibold">
              {language === 'vi' 
                ? 'Bạn đã bị hạ gục bởi sức mạnh quá lớn của Boss phó bản. Hãy nâng cấp trang bị, ghép ngọc và thử lại!'
                : 'You were defeated by the boss. Reforge your equipment, fuse gems and try again!'}
            </p>

            <button
              onClick={handleDefeatClose}
              className="px-8 py-3.5 bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-350 hover:text-white font-black text-xs uppercase tracking-widest rounded-2xl transition active:scale-[0.98] cursor-pointer"
            >
              {language === 'vi' ? 'QUAY LẠI ẢI CHÍNH' : 'RETURN TO MAIN STAGE'}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
