import React, { useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { useLanguageStore } from '../../stores/languageStore';

export const DungeonTab: React.FC = () => {
  const { saveData, enterDungeon, combineGems, buyDungeonTicket, battleMode, activeDungeonId } = useGameStore();
  const { language } = useLanguageStore();
  const [subTab, setSubTab] = useState<'challenge' | 'fuse'>('challenge');

  if (!saveData) return null;

  const { hero } = saveData;
  const tickets = hero.dungeonTickets ?? 3;
  const gems = hero.gems || {};

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

  const gemTypes = [
    { type: 'ruby', nameVi: 'Hồng Ngọc (Tăng Công)', nameEn: 'Ruby (+ATK)', emoji: '🔴' },
    { type: 'emerald', nameVi: 'Lục Bảo (Tăng Máu)', nameEn: 'Emerald (+HP)', emoji: '🟢' },
    { type: 'sapphire', nameVi: 'Lam Bảo (Tăng Giáp)', nameEn: 'Sapphire (+DEF)', emoji: '🔵' },
    { type: 'amethyst', nameVi: 'Thạch Anh (Tăng CM)', nameEn: 'Amethyst (+CRIT)', emoji: '🔮' }
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

      {/* Sub tabs selector */}
      <div className="flex bg-slate-950/20 border-b border-slate-900 p-2 shrink-0 gap-2">
        <button
          onClick={() => setSubTab('challenge')}
          className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-xl border transition ${
            subTab === 'challenge'
              ? 'bg-blue-600/15 border-blue-500/30 text-blue-300 shadow'
              : 'bg-slate-950/45 border-slate-850 hover:bg-slate-900/40 text-slate-450 hover:text-slate-300'
          }`}
        >
          🏰 {language === 'vi' ? 'Khiêu chiến Phó bản' : 'Challenge Dungeons'}
        </button>
        <button
          onClick={() => setSubTab('fuse')}
          className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-xl border transition ${
            subTab === 'fuse'
              ? 'bg-purple-600/15 border-purple-500/30 text-purple-300 shadow'
              : 'bg-slate-950/45 border-slate-850 hover:bg-slate-900/40 text-slate-450 hover:text-slate-300'
          }`}
        >
          ⚒️ {language === 'vi' ? 'Lò Ghép Ngọc' : 'Gem Crafting Workshop'}
        </button>
      </div>

      {/* Content scroll box */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {subTab === 'challenge' ? (
          <div className="space-y-4">
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
        ) : (
          <div className="space-y-6">
            {/* Instruction Banner */}
            <div className="p-3 bg-purple-950/15 border border-purple-500/20 rounded-2xl text-xs space-y-1 leading-relaxed">
              <span className="font-black text-purple-400 uppercase tracking-wider block">
                ⚒️ {language === 'vi' ? 'CÔNG THỨC GHÉP NGỌC' : 'GEM CRAFTING FORMULA'}
              </span>
              <p className="text-slate-400 font-medium">
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
        )}
      </div>
    </div>
  );
};
