import React from 'react';
import { useGameStore } from '../../stores/gameStore';
import { useLanguageStore } from '../../stores/languageStore';

export const DungeonTab: React.FC = () => {
  const { saveData, enterDungeon, buyDungeonTicket, battleMode, activeDungeonId } = useGameStore();
  const { language } = useLanguageStore();

  if (!saveData) return null;

  const { hero } = saveData;
  const tickets = hero.dungeonTickets ?? 3;

  const dungeonList = [
    {
      id: 'dungeon_1',
      nameVi: 'Hầm Ngục Đá Cổ',
      nameEn: 'Ancient Stone Dungeon',
      levelReq: 5,
      bossVi: 'Vệ Binh Golem (Cấp 10)',
      bossEn: 'Guardian Golem (Lv.10)',
      descVi: 'Khám phá hầm ngục đá cổ ngàn năm. Đánh bại Vệ Binh Đá để thu thập Ngọc Cấp 1 & 2.',
      descEn: 'Explore the ancient stone ruins. Defeat the Stone Guardian to harvest Tier 1 & 2 Gems.',
      rewardsVi: 'Ngọc Cấp 1 ~ 2 (Hồng, Lục, Lam, Tím)',
      rewardsEn: 'Tier 1 ~ 2 Gems (Ruby, Emerald, Sapphire, Amethyst)',
      bgClass: 'from-slate-900 via-slate-850 to-blue-950/30 border-blue-500/20 shadow-blue-500/5',
      icon: '⛰️'
    },
    {
      id: 'dungeon_2',
      nameVi: 'Đền Thờ Ma Hỏa',
      nameEn: 'Fire Demon Temple',
      levelReq: 15,
      bossVi: 'Ma Thần Lửa Efreet (Cấp 25)',
      bossEn: 'Fire Demon Efreet (Lv.25)',
      descVi: 'Tiến sâu vào dòng nham thạch rực cháy. Tiêu diệt Ma Thần Lửa để săn Ngọc Cấp 2 & 3.',
      descEn: 'Venture deep into the blazing magma halls. Vanquish the Fire Demon for Tier 2 & 3 Gems.',
      rewardsVi: 'Ngọc Cấp 2 ~ 3 (Hồng, Lục, Lam, Tím)',
      rewardsEn: 'Tier 2 ~ 3 Gems (Ruby, Emerald, Sapphire, Amethyst)',
      bgClass: 'from-slate-900 via-slate-850 to-orange-950/30 border-orange-500/20 shadow-orange-500/5',
      icon: '🔥'
    },
    {
      id: 'dungeon_3',
      nameVi: 'Vực Thẳm Vô Tận',
      nameEn: 'Void Shadow Abyss',
      levelReq: 30,
      bossVi: 'Rồng Bóng Tối Cổ Đại (Cấp 45)',
      bossEn: 'Ancient Shadow Dragon (Lv.45)',
      descVi: 'Đế chế bóng tối đầy rẫy hiểm họa. Đồ sát Rồng Bóng Tối để giành lấy Ngọc Cấp 3 & 4 (Có tỷ lệ nhận Ngọc Cấp 5).',
      descEn: 'The ultimate realm of darkness. Slay the Dragon for Tier 3 & 4 Gems, and a chance for Tier 5!',
      rewardsVi: 'Ngọc Cấp 3 ~ 4 (15% nhận Cấp 5 Cực phẩm)',
      rewardsEn: 'Tier 3 ~ 4 Gems (15% chance for Tier 5 Relics)',
      bgClass: 'from-slate-900 via-slate-850 to-purple-950/30 border-purple-500/20 shadow-purple-500/5',
      icon: '🌌'
    }
  ];

  return (
    <div className="h-full flex flex-col overflow-hidden text-slate-350">
      {/* Header bar */}
      <div className="flex justify-between items-center bg-slate-950/40 border-b border-slate-900/60 p-3 shrink-0 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">🎫</span>
          <div>
            <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider leading-none">
              {language === 'vi' ? 'VÉ KHIÊU CHIẾN' : 'DUNGEON TICKETS'}
            </span>
            <span className="text-sm font-black text-white font-mono mt-0.5 block">
              {tickets}
            </span>
          </div>
        </div>

        <button
          onClick={() => buyDungeonTicket()}
          disabled={hero.gold < 1000}
          className="px-3 py-1.5 bg-yellow-600/15 hover:bg-yellow-600/25 border border-yellow-500/30 disabled:opacity-40 disabled:pointer-events-none text-yellow-400 text-[10px] font-black uppercase tracking-wider rounded-xl transition active:scale-95 cursor-pointer flex items-center gap-1.5"
        >
          <span>🛒</span>
          <span>{language === 'vi' ? 'Mua vé (+1 🎫 = 1,000 💰)' : 'Buy Ticket (+1 🎫 = 1K 💰)'}</span>
        </button>
      </div>

      {/* Content scroll box */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {battleMode === 'dungeon' && (
          <div className="p-3 bg-red-950/15 border border-red-500/25 rounded-2xl text-center space-y-1">
            <span className="text-xs font-extrabold text-red-400 block uppercase tracking-widest animate-pulse">
              ⚔️ {language === 'vi' ? 'ĐANG KHIÊU CHIẾN PHÓ BẢN' : 'DUNGEON CHALLENGE ACTIVE'}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">
              {language === 'vi' ? 'Hãy đợi trận đấu hiện tại kết thúc để nhận phần thưởng!' : 'Please wait for the current battle to finish!'}
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {dungeonList.map((dungeon) => {
            const locked = hero.level < dungeon.levelReq;
            const isActive = battleMode === 'dungeon' && activeDungeonId === dungeon.id;
            
            return (
              <div
                key={dungeon.id}
                className={`bg-gradient-to-b ${dungeon.bgClass} border rounded-2xl p-4 flex flex-col justify-between gap-4 transition duration-200 relative overflow-hidden group shadow-lg ${
                  isActive ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-950' : ''
                }`}
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-black text-white font-display group-hover:text-blue-400 transition">
                        {language === 'vi' ? dungeon.nameVi : dungeon.nameEn}
                      </h4>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        {language === 'vi' ? `Yêu cầu Cấp ${dungeon.levelReq}` : `Requires Lv.${dungeon.levelReq}`}
                      </span>
                    </div>
                    <span className="text-3xl filter drop-shadow">{dungeon.icon}</span>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed font-medium">
                    {language === 'vi' ? dungeon.descVi : dungeon.descEn}
                  </p>

                  <div className="pt-2 border-t border-slate-850/60 space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="font-bold text-slate-500 uppercase tracking-wide">
                        BOSS:
                      </span>
                      <span className="font-bold text-rose-400">
                        {language === 'vi' ? dungeon.bossVi : dungeon.bossEn}
                      </span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="font-bold text-slate-500 uppercase tracking-wide">
                        {language === 'vi' ? 'PHẦN THƯỞNG:' : 'REWARDS:'}
                      </span>
                      <span className="font-extrabold text-emerald-400">
                        {language === 'vi' ? dungeon.rewardsVi : dungeon.rewardsEn}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => enterDungeon(dungeon.id)}
                  disabled={locked || tickets <= 0 || battleMode === 'dungeon'}
                  className={`w-full py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition cursor-pointer ${
                    locked
                      ? 'bg-slate-950/60 border border-slate-900 text-slate-600 cursor-not-allowed'
                      : tickets <= 0
                      ? 'bg-slate-950/60 border border-slate-900 text-slate-600 cursor-not-allowed'
                      : battleMode === 'dungeon'
                      ? 'bg-slate-950/60 border border-slate-900 text-slate-500 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-500 border border-blue-500/30 text-white shadow-md active:scale-[0.98]'
                  }`}
                >
                  {locked
                    ? (language === 'vi' ? `Khóa (Y/C Cấp ${dungeon.levelReq})` : `Locked (Req Lv.${dungeon.levelReq})`)
                    : tickets <= 0
                    ? (language === 'vi' ? 'Hết vé vào' : 'No Tickets')
                    : battleMode === 'dungeon'
                    ? (language === 'vi' ? 'Đang chiến đấu...' : 'In Combat...')
                    : (language === 'vi' ? 'VÀO THỬ THÁCH' : 'CHALLENGE')}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
