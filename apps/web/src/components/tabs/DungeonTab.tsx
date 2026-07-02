import React, { useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { useLanguageStore } from '../../stores/languageStore';
import { GAME_ICONS } from '@idle-rpg/shared';

export const DungeonTab: React.FC = () => {
  const {
    saveData,
    enterDungeon,
    battleMode: battleModeRaw,
    activeDungeonId,
    heroHp,
    heroMaxHp,
    monsterHp,
    monsterMaxHp,
    combatLogs,
    onDungeonDefeat
  } = useGameStore();
  const battleMode = battleModeRaw as any;
  const { language } = useLanguageStore();
  const [activeCategory, setActiveCategory] = useState<'gems' | 'gold' | 'diamonds' | 'gear'>('gems');

  if (!saveData) return null;

  const { hero } = saveData;
  const tickets = hero.dungeonTickets ?? 3;

  const dungeonsByCategory = {
    gems: [
      {
        id: 'gem_1',
        nameVi: 'Hầm Ngục Đá Cổ (Dễ)',
        nameEn: 'Ancient Stone Dungeon (Easy)',
        levelReq: 5,
        bossVi: 'Vệ Binh Golem (Cấp 10)',
        bossEn: 'Guardian Golem (Lv.10)',
        descVi: 'Hầm ngục ngàn năm chứa các tinh thể đá cổ. Đánh bại Vệ Binh Đá để thu thập Ngọc Cấp 1 & 2.',
        descEn: 'Venture into the ancient stone ruins. Defeat the Stone Guardian to harvest Tier 1 & 2 Gems.',
        rewardsVi: 'Ngọc Cấp 1 ~ 2 (Hồng, Hoàng, Lục, Lam, Tím)',
        rewardsEn: 'Tier 1 ~ 2 Gems (Ruby, Topaz, Emerald, Sapphire, Amethyst)',
        bgClass: 'from-slate-900 via-slate-850 to-blue-950/30 border-blue-500/20 shadow-blue-500/5',
        icon: '⛰️'
      },
      {
        id: 'gem_2',
        nameVi: 'Đền Thờ Ma Hỏa (Thường)',
        nameEn: 'Fire Demon Temple (Normal)',
        levelReq: 15,
        bossVi: 'Ma Thần Lửa Efreet (Cấp 25)',
        bossEn: 'Fire Demon Efreet (Lv.25)',
        descVi: 'Tiến sâu vào dòng nham thạch rực cháy. Tiêu diệt Ma Thần Lửa để săn Ngọc Cấp 2 & 3.',
        descEn: 'Venture deep into the blazing magma halls. Vanquish the Fire Demon for Tier 2 & 3 Gems.',
        rewardsVi: 'Ngọc Cấp 2 ~ 3 (Hồng, Hoàng, Lục, Lam, Tím)',
        rewardsEn: 'Tier 2 ~ 3 Gems (Ruby, Topaz, Emerald, Sapphire, Amethyst)',
        bgClass: 'from-slate-900 via-slate-850 to-orange-950/30 border-orange-500/20 shadow-orange-500/5',
        icon: '🔥'
      },
      {
        id: 'gem_3',
        nameVi: 'Vực Thẳm Vô Tận (Khó)',
        nameEn: 'Void Shadow Abyss (Hard)',
        levelReq: 30,
        bossVi: 'Rồng Bóng Tối Cổ Đại (Cấp 45)',
        bossEn: 'Ancient Shadow Dragon (Lv.45)',
        descVi: 'Đế chế bóng tối đầy rẫy hiểm họa. Đồ sát Rồng Bóng Tối để giành lấy Ngọc Cấp 3 & 4 (Có 15% nhận Cấp 5).',
        descEn: 'The ultimate realm of darkness. Slay the Dragon for Tier 3 & 4 Gems, and a 15% chance for Tier 5!',
        rewardsVi: 'Ngọc Cấp 3 ~ 4 (15% nhận Cấp 5)',
        rewardsEn: 'Tier 3 ~ 4 Gems (15% Tier 5)',
        bgClass: 'from-slate-900 via-slate-850 to-purple-950/30 border-purple-500/20 shadow-purple-500/5',
        icon: '🌌'
      }
    ],
    gold: [
      {
        id: 'gold_1',
        nameVi: 'Hang Goblin Thường (Dễ)',
        nameEn: 'Goblin Cave (Easy)',
        levelReq: 5,
        bossVi: 'Thủ Lĩnh Goblin (Cấp 10)',
        bossEn: 'Goblin Chieftain (Lv.10)',
        descVi: 'Nơi cư ngụ của lũ tay sai Goblin. Tiêu diệt chúng để cướp lấy kho tiền đồng cất giấu.',
        descEn: 'Infiltrate the local goblin hideout. Plunder their copper stash for quick wealth.',
        rewardsVi: `+10,000 Vàng ${GAME_ICONS.GOLD}`,
        rewardsEn: `+10,000 Gold ${GAME_ICONS.GOLD}`,
        bgClass: 'from-slate-900 via-slate-850 to-amber-950/30 border-amber-500/20 shadow-amber-500/5',
        icon: '🪙'
      },
      {
        id: 'gold_2',
        nameVi: 'Hầm Vàng Hoàng Gia (Thường)',
        nameEn: 'Royal Treasury (Normal)',
        levelReq: 15,
        bossVi: 'Vua Goblin (Cấp 25)',
        bossEn: 'Goblin King (Lv.25)',
        descVi: 'Ngân khố hoàng gia bị tước đoạt bởi Vua Goblin. Đoạt lại số tiền vàng tích trữ khổng lồ.',
        descEn: 'Venture into the vaults occupied by the Goblin King. Retrieve the royal gold reserves.',
        rewardsVi: `+35,000 Vàng ${GAME_ICONS.GOLD}`,
        rewardsEn: `+35,000 Gold ${GAME_ICONS.GOLD}`,
        bgClass: 'from-slate-900 via-slate-850 to-yellow-950/30 border-yellow-500/20 shadow-yellow-500/5',
        icon: '👑'
      },
      {
        id: 'gold_3',
        nameVi: 'Kho Báu Cổ Đại (Khó)',
        nameEn: 'Ancient Vault (Hard)',
        levelReq: 30,
        bossVi: 'Rồng Vàng Hoàng Kim (Cấp 45)',
        bossEn: 'Golden Dragon (Lv.45)',
        descVi: 'Ngủ sâu dưới lòng đất là kho báu khổng lồ được canh giữ bởi Rồng Vàng. Phần thưởng là cực kỳ xứng đáng.',
        descEn: 'Deep underground lies a mountain of ancient gold guarded by a Golden Dragon.',
        rewardsVi: `+120,000 Vàng ${GAME_ICONS.GOLD}`,
        rewardsEn: `+120,000 Gold ${GAME_ICONS.GOLD}`,
        bgClass: 'from-slate-900 via-slate-850 to-yellow-800/20 border-yellow-400/20 shadow-yellow-400/5',
        icon: GAME_ICONS.GOLD
      }
    ],
    diamonds: [
      {
        id: 'diamond_1',
        nameVi: 'Mỏ Tinh Thể (Dễ)',
        nameEn: 'Crystal Mine (Easy)',
        levelReq: 10,
        bossVi: 'Nhện Tinh Thể (Cấp 15)',
        bossEn: 'Crystal Spider (Lv.15)',
        descVi: 'Khai thác các quặng pha lê thô quý hiếm. Đồ sát Nhện Tinh Thể để lấy Kim Cương.',
        descEn: 'Harvest raw gemstone clusters. Slay the Crystal Spider to claim precious diamonds.',
        rewardsVi: `+100 Kim Cương ${GAME_ICONS.DIAMOND}`,
        rewardsEn: `+100 Diamonds ${GAME_ICONS.DIAMOND}`,
        bgClass: 'from-slate-900 via-slate-850 to-cyan-950/30 border-cyan-500/20 shadow-cyan-500/5',
        icon: GAME_ICONS.DIAMOND
      },
      {
        id: 'diamond_2',
        nameVi: 'Động Pha Lê Lớn (Thường)',
        nameEn: 'Crystal Grotto (Normal)',
        levelReq: 20,
        bossVi: 'Golem Tinh Thể (Cấp 30)',
        bossEn: 'Gemstone Golem (Lv.30)',
        descVi: 'Thế giới pha lê đầy màu sắc rực rỡ. Đập tan Golem Pha Lê để thu về nguồn năng lượng kim cương dồi dào.',
        descEn: 'Enter the colorful crystal caves. Shatter the Golem to mine crystal diamonds.',
        rewardsVi: `+300 Kim Cương ${GAME_ICONS.DIAMOND}`,
        rewardsEn: `+300 Diamonds ${GAME_ICONS.DIAMOND}`,
        bgClass: 'from-slate-900 via-slate-850 to-teal-950/30 border-teal-500/20 shadow-teal-500/5',
        icon: '🔮'
      },
      {
        id: 'diamond_3',
        nameVi: 'Thánh Địa Pha Lê (Khó)',
        nameEn: 'Crystal Sanctuary (Hard)',
        levelReq: 35,
        bossVi: 'Quái Thú Chimera Tinh Thể (Cấp 50)',
        bossEn: 'Diamond Chimera (Lv.50)',
        descVi: 'Vương quốc của những quặng kim cương thuần khiết nhất. Đánh bại Chimera Tinh Thể để giành lấy kho báu tối thượng.',
        descEn: 'Venture into the heart of the crystal sanctuary. Defeat the Chimera for major diamond rewards.',
        rewardsVi: `+1,000 Kim Cương ${GAME_ICONS.DIAMOND}`,
        rewardsEn: `+1,000 Diamonds ${GAME_ICONS.DIAMOND}`,
        bgClass: 'from-slate-900 via-slate-850 to-emerald-950/30 border-emerald-500/20 shadow-emerald-500/5',
        icon: '✨'
      }
    ],
    gear: [
      {
        id: 'gear_1',
        nameVi: 'Lăng Mộ Hiệp Sĩ (Dễ)',
        nameEn: 'Knight Tomb (Easy)',
        levelReq: 5,
        bossVi: 'Hiệp Sĩ Quỷ (Cấp 10)',
        bossEn: 'Undead Knight (Lv.10)',
        descVi: 'Lăng mộ của các hiệp sĩ cổ xưa. Đánh bại Hiệp Sĩ Quỷ để tìm kiếm Trang bị Rare & Epic.',
        descEn: 'Explore the crypt of ancient warriors. Slay the Undead Knight for Rare & Epic gear.',
        rewardsVi: 'Trang Bị Rare ~ Epic chưa giám định 🎒',
        rewardsEn: 'Unidentified Rare ~ Epic Gear 🎒',
        bgClass: 'from-slate-900 via-slate-850 to-indigo-950/30 border-indigo-500/20 shadow-indigo-500/5',
        icon: '🛡️'
      },
      {
        id: 'gear_2',
        nameVi: 'Cổ Thành Phong Ấn (Thường)',
        nameEn: 'Sealed Citadel (Normal)',
        levelReq: 18,
        bossVi: 'Cự Ma Phong Ấn (Cấp 28)',
        bossEn: 'Sealed Archdemon (Lv.28)',
        descVi: 'Pháo đài cổ xưa giam giữ Cự Ma. Diệt Ma để lấy Trang bị Epic & Legendary cực xịn.',
        descEn: 'Breach the sealed fortress. Vanquish the Archdemon for Epic & Legendary equipment.',
        rewardsVi: 'Trang Bị Epic ~ Legendary chưa giám định 🎒',
        rewardsEn: 'Unidentified Epic ~ Legendary Gear 🎒',
        bgClass: 'from-slate-900 via-slate-850 to-red-950/30 border-red-500/20 shadow-red-500/5',
        icon: '⚔️'
      },
      {
        id: 'gear_3',
        nameVi: 'Điện Thờ Cổ Tự (Khó)',
        nameEn: 'Relic Shrine (Hard)',
        levelReq: 32,
        bossVi: 'Vệ Binh Cổ Tự (Cấp 48)',
        bossEn: 'Relic Sentinel (Lv.48)',
        descVi: 'Đền thờ lưu giữ các thần khí thất lạc. Tiêu diệt Vệ Binh Cổ Tự để săn trang bị phẩm chất Legendary.',
        descEn: 'The sacred altar of lost relics. Defeat the Sentinel for guaranteed Legendary gear drops.',
        rewardsVi: '1-2x Trang Bị Legendary chưa giám định 🎒',
        rewardsEn: '1-2x Unidentified Legendary Gear 🎒',
        bgClass: 'from-slate-900 via-slate-850 to-fuchsia-950/30 border-fuchsia-500/20 shadow-fuchsia-500/5',
        icon: '👑'
      }
    ]
  };

  const activeDungeons = dungeonsByCategory[activeCategory];

  return (
    <div className="h-full flex flex-col overflow-hidden text-slate-350">
      {/* Category selector tabs */}
      <div className="flex bg-slate-950/20 border-b border-slate-900 p-2 shrink-0 gap-2 overflow-x-auto scrollbar-none">
        {([
          { key: 'gems', vi: `${GAME_ICONS.DIAMOND} Ngọc Thuộc Tính`, en: `${GAME_ICONS.DIAMOND} Gems` },
          { key: 'gold', vi: `${GAME_ICONS.GOLD} Phó Bản Vàng`, en: `${GAME_ICONS.GOLD} Gold` },
          { key: 'diamonds', vi: `${GAME_ICONS.DIAMOND} Phó Bản Kim Cương`, en: `${GAME_ICONS.DIAMOND} Diamonds` },
          { key: 'gear', vi: `${GAME_ICONS.CP} Phó Bản Trang Bị`, en: `${GAME_ICONS.CP} Gear` }
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveCategory(tab.key)}
            className={`flex-1 min-w-[125px] py-2 text-[10px] font-black uppercase tracking-wider rounded-xl border transition cursor-pointer select-none whitespace-nowrap ${activeCategory === tab.key
              ? 'bg-blue-600/15 border-blue-500/30 text-blue-300 shadow shadow-blue-500/5'
              : 'bg-slate-950/45 border-slate-850 hover:bg-slate-900/40 text-slate-450 hover:text-slate-300'
              }`}
          >
            {language === 'vi' ? tab.vi : tab.en}
          </button>
        ))}
      </div>

      {/* Content scroll box */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {(() => {
          const allDungeons = [
            ...dungeonsByCategory.gems,
            ...dungeonsByCategory.gold,
            ...dungeonsByCategory.diamonds,
            ...dungeonsByCategory.gear
          ];
          const activeDungeon = allDungeons.find(d => d.id === activeDungeonId);
          const dungeonName = activeDungeon ? activeDungeon.nameVi : 'Hầm Ngục';
          const dungeonNameEn = activeDungeon ? activeDungeon.nameEn : 'Dungeon';

          if (battleMode === 'dungeon') {
            const dungeonLogs = combatLogs
              .filter(log => log.category === 'combat' || log.category === 'system')
              .slice(0, 15)
              .reverse();

            return (
              <div className="flex flex-col gap-4 w-full animate-fade-in text-slate-300">
                {/* Active Dungeon Header Card */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-2xl">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-500/5 rounded-full blur-[80px] pointer-events-none" />

                  <span className="text-4xl filter drop-shadow mb-3 animate-bounce">
                    {activeDungeon?.icon || '🏰'}
                  </span>

                  <h3 className="text-xs font-black text-blue-400 uppercase tracking-widest mb-1.5">
                    {language === 'vi' ? 'ĐANG KHIÊU CHIẾN PHÓ BẢN' : 'DUNGEON CHALLENGE ACTIVE'}
                  </h3>

                  <span className="text-xs text-white font-extrabold px-3 py-1 bg-slate-950 border border-slate-850 rounded-xl">
                    {language === 'vi' ? dungeonName : dungeonNameEn}
                  </span>
                </div>

                {/* Health Bars Comparison Panel */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Hero Status */}
                  <div className="bg-slate-900/50 border border-slate-850 p-4 rounded-2xl flex flex-col gap-2 shadow-lg">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                      👤 {language === 'vi' ? 'ANH HÙNG' : 'HERO'}
                    </span>
                    <div className="flex justify-between items-baseline mt-1">
                      <span className="text-sm font-black text-emerald-400 font-mono">{heroHp}</span>
                      <span className="text-[10px] text-slate-500 font-extrabold font-mono">/ {heroMaxHp} HP</span>
                    </div>
                    <div className="w-full h-2 bg-slate-950 border border-slate-850 rounded-full overflow-hidden mt-1 shadow-inner">
                      <div
                        className="h-full bg-emerald-500 transition-all duration-105"
                        style={{ width: `${Math.min(100, Math.max(0, Math.floor((heroHp / heroMaxHp) * 100)))}%` }}
                      />
                    </div>
                  </div>

                  {/* Boss Status */}
                  <div className="bg-slate-900/50 border border-slate-850 p-4 rounded-2xl flex flex-col gap-2 shadow-lg">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                      👹 {language === 'vi' ? 'BOSS PHÓ BẢN' : 'DUNGEON BOSS'}
                    </span>
                    <div className="flex justify-between items-baseline mt-1">
                      <span className="text-sm font-black text-red-400 font-mono">{monsterHp}</span>
                      <span className="text-[10px] text-slate-500 font-extrabold font-mono">/ {monsterMaxHp} HP</span>
                    </div>
                    <div className="w-full h-2 bg-slate-950 border border-slate-850 rounded-full overflow-hidden mt-1 shadow-inner">
                      <div
                        className="h-full bg-red-500 transition-all duration-105"
                        style={{ width: `${Math.min(100, Math.max(0, Math.floor((monsterHp / monsterMaxHp) * 100)))}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Live Combat Log Feed */}
                <div className="bg-slate-950/80 border border-slate-900 rounded-3xl p-4 flex flex-col h-48 overflow-hidden shadow-inner">
                  <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-3 select-none">
                    📜 {language === 'vi' ? 'NHẬT KÝ BẢN TIN' : 'BATTLE FEED'}
                  </span>
                  <div className="flex-1 overflow-y-auto space-y-2 pr-1 select-text scrollbar-none">
                    {dungeonLogs.length === 0 ? (
                      <div className="text-center py-12 text-[10px] text-slate-600 italic">
                        {language === 'vi' ? 'Đang vào tư thế chiến đấu...' : 'Preparing for visual combat...'}
                      </div>
                    ) : (
                      dungeonLogs.map((log) => (
                        <div key={log.id} className="text-[10.5px] leading-relaxed border-b border-slate-900/40 pb-1.5 text-slate-350 flex gap-2">
                          <span className="text-slate-600 shrink-0 select-none">[{log.time}]</span>
                          <span className={log.text.includes(' strikes ') || log.text.includes(' deals ') || log.text.includes(' strikes ') || log.text.includes(' casts ') || log.text.includes(' bị ') || log.text.includes(' tấn công ') ? 'text-red-400' : 'text-blue-400'}>
                            {log.text}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Retreat Button */}
                <button
                  onClick={() => onDungeonDefeat()}
                  className="w-full py-3.5 bg-red-950/30 hover:bg-red-900 border border-red-800 text-red-400 hover:text-white font-black text-xs uppercase tracking-widest rounded-2xl transition active:scale-95 cursor-pointer shadow-lg mt-2 animate-pulse hover:animate-none"
                >
                  🏳️ {language === 'vi' ? 'RÚT LUI KHỎI PHÓ BẢN' : 'RETREAT FROM DUNGEON'}
                </button>
              </div>
            );
          }

          return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {activeDungeons.map((dungeon) => {
                let levelReq = dungeon.levelReq;
                const locked = hero.level < levelReq;
                const isActive = battleMode === 'dungeon' && activeDungeonId === dungeon.id;

                return (
                  <div
                    key={dungeon.id}
                    className={`bg-gradient-to-b ${dungeon.bgClass} border rounded-2xl p-4 flex flex-col justify-between gap-4 transition duration-200 relative overflow-hidden group shadow-lg ${isActive ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-950' : ''
                      }`}
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-sm font-black text-white font-display group-hover:text-blue-400 transition">
                            {language === 'vi' ? dungeon.nameVi : dungeon.nameEn}
                          </h4>
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            {language === 'vi' ? `Yêu cầu Cấp ${levelReq}` : `Requires Lv.${levelReq}`}
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
                            {language === 'vi' ? 'PHẦN THƯỞORNG:' : 'REWARDS:'}
                          </span>
                          <span className="font-extrabold text-emerald-450">
                            {language === 'vi' ? dungeon.rewardsVi : dungeon.rewardsEn}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => enterDungeon(dungeon.id)}
                      disabled={locked || tickets <= 0 || battleMode === 'dungeon'}
                      className={`w-full py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition cursor-pointer ${locked
                        ? 'bg-slate-950/60 border border-slate-900 text-slate-600 cursor-not-allowed'
                        : tickets <= 0
                          ? 'bg-slate-950/60 border border-slate-900 text-slate-600 cursor-not-allowed'
                          : battleMode === 'dungeon'
                            ? 'bg-slate-950/60 border border-slate-900 text-slate-500 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-500 border border-blue-500/30 text-white shadow-md active:scale-[0.98]'
                        }`}
                    >
                      {locked
                        ? (language === 'vi' ? `Khóa (Y/C Cấp ${levelReq})` : `Locked (Req Lv.${levelReq})`)
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
          );
        })()}
      </div>
    </div>
  );
};
