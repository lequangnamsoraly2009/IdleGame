import React, { useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { useLanguageStore } from '../../stores/languageStore';

interface BestiaryEntry {
  id: string;
  nameVi: string;
  nameEn: string;
  category: 'normal' | 'stage_boss' | 'raid_boss';
  color: string;
  skillVi: string;
  skillEn: string;
  loreVi: string;
  loreEn: string;
  hasCrown?: boolean;
  baseHpMult: number;
  baseAtkMult: number;
  baseDefMult: number;
}

const MONSTER_DATABASE: BestiaryEntry[] = [
  {
    id: 'slime_grass',
    nameVi: 'Slime Thảo Nguyên',
    nameEn: 'Meadow Slime',
    category: 'normal',
    color: '#10b981',
    skillVi: 'Phun Bong Bóng (Cơ bản)',
    skillEn: 'Bubble Splash (Basic)',
    loreVi: 'Loài Slime nguyên bản dẻo dai, sinh sống hòa bình tại các vùng thảo nguyên xanh mát.',
    loreEn: 'The original resilient Slime species, peacefully occupying open grasslands.',
    baseHpMult: 1.0,
    baseAtkMult: 1.0,
    baseDefMult: 1.0
  },
  {
    id: 'slime_stone',
    nameVi: 'Slime Cương Thạch',
    nameEn: 'Granite Slime',
    category: 'normal',
    color: '#78716c',
    skillVi: 'Giáp Đá Hóa Cương (STONE ARMOR)',
    skillEn: 'Stone Shielding (STONE ARMOR)',
    loreVi: 'Lõi đá thạch anh siêu cứng bảo vệ chúng khỏi các đòn chém vật lý nặng.',
    loreEn: 'Encased in heavy crystalline granite shield, protecting against physical thrusts.',
    baseHpMult: 1.3,
    baseAtkMult: 0.9,
    baseDefMult: 1.8
  },
  {
    id: 'slime_fire',
    nameVi: 'Slime Dung Nham',
    nameEn: 'Magma Slime',
    category: 'normal',
    color: '#ef4444',
    skillVi: 'Hỏa Cầu Bộc Phá (FIRE BLAST)',
    skillEn: 'Combustion Bomb (FIRE BLAST)',
    loreVi: 'Hấp thụ địa nhiệt từ nham thạch nung chảy, phóng ra những đốm lửa thiêu đốt đối thủ.',
    loreEn: 'Formed from underground molten magma, shooting explosive searing projectiles.',
    baseHpMult: 0.9,
    baseAtkMult: 1.5,
    baseDefMult: 0.8
  },
  {
    id: 'slime_ice',
    nameVi: 'Slime Tuyết Lạnh',
    nameEn: 'Frost Slime',
    category: 'normal',
    color: '#3b82f6',
    skillVi: 'Hàn Băng Làm Chậm (FROSTBITE)',
    skillEn: 'Freezing Slow (FROSTBITE)',
    loreVi: 'Lớp tuyết lạnh vĩnh cửu bao phủ quanh thân, làm đóng băng và giảm tốc độ đánh mục tiêu.',
    loreEn: 'Coated in eternal freezing frost, slowing targets\' combat speed on contact.',
    baseHpMult: 1.1,
    baseAtkMult: 1.1,
    baseDefMult: 1.1
  },
  {
    id: 'slime_shadow',
    nameVi: 'Slime Hắc Ám',
    nameEn: 'Void Slime',
    category: 'normal',
    color: '#a855f7',
    skillVi: 'Bong Bóng Độc Hư Không',
    skillEn: 'Void Poison Bubble',
    loreVi: 'Sinh vật biến dị do hấp thụ tà khí hắc ám từ cõi hư vô sâu thẳm.',
    loreEn: 'Corrupted lifeforms that fed on dark void particles in deep rifts.',
    baseHpMult: 1.0,
    baseAtkMult: 1.3,
    baseDefMult: 1.0
  },
  {
    id: 'slime_king',
    nameVi: 'Vua Slime Hoàng Gia',
    nameEn: 'Slime King',
    category: 'stage_boss',
    color: '#eab308',
    skillVi: 'Vạn Quân Chấn Động (KING\'S SLAM)',
    skillEn: 'Royal Slam (KING\'S SLAM)',
    loreVi: 'Thủ lĩnh tối cao của đầm lầy Slime. Đội vương miện lấp lánh và nhảy đè bẹp kẻ khiêu khích.',
    loreEn: 'The absolute ruler of slimes, crushing challenges with high-altitude jumps.',
    hasCrown: true,
    baseHpMult: 2.5,
    baseAtkMult: 1.8,
    baseDefMult: 1.4
  },
  {
    id: 'void_behemoth',
    nameVi: 'Cự Thú Hư Không Behemoth',
    nameEn: 'Void Behemoth',
    category: 'raid_boss',
    color: '#581c87',
    skillVi: 'Hư Không Diệt Thế (VOID APOCALYPSE)',
    skillEn: 'Void Apocalypse (VOID APOCALYPSE)',
    loreVi: 'Quái thú khổng lồ cổ đại thức tỉnh từ vết nứt không gian. Một kỹ năng có thể quét sạch toàn bộ bang hội.',
    loreEn: 'Ancient colossal threat awakened from dimensional rifts, striking all active guild allies.',
    hasCrown: true,
    baseHpMult: 10.0,
    baseAtkMult: 3.5,
    baseDefMult: 2.2
  }
];

export const GuideTab: React.FC = () => {
  const { saveData } = useGameStore();
  const { language } = useLanguageStore();
  const [activeCategory, setActiveCategory] = useState<'normal' | 'stage_boss' | 'raid_boss'>('normal');
  const [selectedMonster, setSelectedMonster] = useState<BestiaryEntry>(MONSTER_DATABASE[0]);

  if (!saveData) return null;

  const heroLevel = saveData.hero.level;
  
  // Calculate dynamic stats for the preview based on current hero level
  const calculateDynamicStats = (entry: BestiaryEntry) => {
    // Stage representation base level matching player progression scaling
    const level = Math.max(1, Math.floor(heroLevel * 0.85));
    const baseHp = Math.round(45 * Math.pow(1.15, level - 1));
    const baseAtk = Math.round(8 * Math.pow(1.12, level - 1));
    const baseDef = Math.round(2 * Math.pow(1.09, level - 1));

    return {
      hp: Math.round(baseHp * entry.baseHpMult),
      atk: Math.round(baseAtk * entry.baseAtkMult),
      def: Math.round(baseDef * entry.baseDefMult),
      level
    };
  };

  const filteredMonsters = MONSTER_DATABASE.filter(m => m.category === activeCategory);
  const currentStats = calculateDynamicStats(selectedMonster);

  return (
    <div className="flex flex-col h-full bg-slate-950/40 backdrop-blur-md rounded-2xl border border-slate-800/80 p-4 font-sans text-slate-200">
      {/* Category selector */}
      <div className="flex gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-900 mb-4">
        {(['normal', 'stage_boss', 'raid_boss'] as const).map(cat => (
          <button
            key={cat}
            onClick={() => {
              setActiveCategory(cat);
              const list = MONSTER_DATABASE.filter(m => m.category === cat);
              if (list.length > 0) setSelectedMonster(list[0]);
            }}
            className={`flex-1 text-[10px] sm:text-xs font-bold py-1.5 px-2 rounded-lg cursor-pointer transition-all duration-200 ${
              activeCategory === cat
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
            }`}
          >
            {cat === 'normal'
              ? (language === 'vi' ? 'Quái thường' : 'Normal')
              : cat === 'stage_boss'
              ? (language === 'vi' ? 'Boss Ải' : 'Stage Boss')
              : (language === 'vi' ? 'Boss Bang Hội' : 'Raid Boss')}
          </button>
        ))}
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-4 overflow-hidden">
        {/* Left Side: Monster Grid List */}
        <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-2 gap-2 max-h-[170px] md:max-h-[360px] scrollbar-thin">
          {filteredMonsters.map(monster => {
            const isSelected = selectedMonster.id === monster.id;
            return (
              <button
                key={monster.id}
                onClick={() => setSelectedMonster(monster)}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all duration-250 active:scale-95 flex items-center gap-2.5 ${
                  isSelected
                    ? 'bg-violet-950/30 border-violet-500/50 shadow-[0_0_10px_rgba(139,92,246,0.15)]'
                    : 'bg-slate-900/40 border-slate-800/60 hover:border-slate-700/80 hover:bg-slate-900/70'
                }`}
              >
                {/* Mini CSS Slime Vector Drawing */}
                <div 
                  className="w-7 h-6 rounded-t-full relative flex items-center justify-center border border-slate-900 shadow-inner flex-shrink-0"
                  style={{ backgroundColor: monster.color }}
                >
                  {/* Blushes */}
                  <div className="absolute w-1 h-1 bg-red-400/60 rounded-full left-1 bottom-1.5" />
                  <div className="absolute w-1 h-1 bg-red-400/60 rounded-full right-1 bottom-1.5" />
                  {/* Crown indicator */}
                  {monster.hasCrown && (
                    <div className="absolute -top-1.5 text-[8px] animate-bounce">👑</div>
                  )}
                </div>

                <div className="truncate min-w-0">
                  <h4 className="text-[10px] sm:text-xs font-bold text-slate-100 truncate">
                    {language === 'vi' ? monster.nameVi : monster.nameEn}
                  </h4>
                  <span className="text-[8px] text-slate-500 block uppercase tracking-wider mt-0.5">
                    {monster.category === 'normal' 
                      ? (language === 'vi' ? 'Quái thường' : 'Normal') 
                      : 'BOSS'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Side: Detailed Card View & Dynamic Stats */}
        <div className="w-full md:w-[220px] bg-slate-900/50 border border-slate-800/80 rounded-xl p-4 flex flex-col items-center justify-between min-h-[220px]">
          {/* Main Visual Render */}
          <div className="relative flex flex-col items-center mt-2 w-full">
            {/* Styled Big CSS Slime Vector */}
            <div 
              className="w-24 h-20 rounded-t-full relative flex items-center justify-center shadow-lg border-2 border-slate-950 transition-all duration-300 transform hover:scale-105"
              style={{ backgroundColor: selectedMonster.color }}
            >
              {/* Eye sparkle and details */}
              <div className="absolute w-2 h-2 bg-slate-950 rounded-full left-6 top-8 flex items-center justify-center">
                <div className="w-0.5 h-0.5 bg-white rounded-full -top-0.5 -left-0.5 absolute" />
              </div>
              <div className="absolute w-2 h-2 bg-slate-950 rounded-full right-6 top-8 flex items-center justify-center">
                <div className="w-0.5 h-0.5 bg-white rounded-full -top-0.5 -left-0.5 absolute" />
              </div>
              {/* Blushes */}
              <div className="absolute w-3 h-2 bg-red-400/40 rounded-full left-3 bottom-5" />
              <div className="absolute w-3 h-2 bg-red-400/40 rounded-full right-3 bottom-5" />
              {/* Smiling mouth */}
              <div className="w-2 h-1 border-b border-slate-950 rounded-full absolute bottom-7" />

              {/* Crown indicator */}
              {selectedMonster.hasCrown && (
                <div className="absolute -top-6 text-2xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] animate-pulse">
                  👑
                </div>
              )}
            </div>
            
            <h3 className="text-xs font-bold text-center mt-3 text-white">
              {language === 'vi' ? selectedMonster.nameVi : selectedMonster.nameEn}
            </h3>
            <span className="text-[8px] bg-slate-950 border border-slate-800 text-slate-400 rounded px-1.5 py-0.5 mt-1 select-none">
              {language === 'vi' 
                ? `Cấp Ước Tính: Lvl ${currentStats.level}` 
                : `Simulated Level: Lvl ${currentStats.level}`}
            </span>
          </div>

          {/* Lore description */}
          <p className="text-[9px] text-slate-400 text-center leading-relaxed my-3 border-y border-slate-800/60 py-2">
            {language === 'vi' ? selectedMonster.loreVi : selectedMonster.loreEn}
          </p>

          {/* Dynamic Stats block */}
          <div className="w-full space-y-1.5 text-[9px]">
            <div className="flex justify-between border-b border-slate-800/40 pb-1">
              <span className="text-red-400 font-bold">💖 HP</span>
              <span className="text-slate-300 font-mono font-bold">{currentStats.hp.toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800/40 pb-1">
              <span className="text-orange-400 font-bold">⚔️ ATK</span>
              <span className="text-slate-300 font-mono font-bold">{currentStats.atk.toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800/40 pb-1">
              <span className="text-emerald-400 font-bold">🛡️ DEF</span>
              <span className="text-slate-300 font-mono font-bold">{currentStats.def.toLocaleString()}</span>
            </div>
            <div className="flex justify-between pt-0.5">
              <span className="text-violet-400 font-bold">⭐ SKILL</span>
              <span className="text-slate-300 truncate max-w-[130px] font-bold text-right">
                {language === 'vi' ? selectedMonster.skillVi : selectedMonster.skillEn}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
