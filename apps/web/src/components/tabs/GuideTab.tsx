import React, { useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { useLanguageStore } from '../../stores/languageStore';
import { MONSTER_SPECIES_DATABASE, BestiarySpecies, DamageType, GAME_ICONS } from '@idle-rpg/shared';

type BestiaryTab = 'tier1' | 'tier2' | 'tier3' | 'tier4' | 'tier5' | 'tier6' | 'tier7' | 'tier8';

const TIER_CONFIG = [
  { id: 'tier1', labelVi: 'Quái Thường', labelEn: 'Normal', tierVal: 'normal', activeClass: 'bg-gradient-to-r from-slate-600 to-slate-700 shadow-slate-500/10' },
  { id: 'tier2', labelVi: 'Tinh Anh', labelEn: 'Elite', tierVal: 'elite', activeClass: 'bg-gradient-to-r from-violet-600 to-indigo-600 shadow-violet-500/10' },
  { id: 'tier3', labelVi: 'Quán Quân', labelEn: 'Champion', tierVal: 'champion', activeClass: 'bg-gradient-to-r from-emerald-600 to-teal-600 shadow-emerald-500/10' },
  { id: 'tier4', labelVi: 'Vua / Hoàng Gia', labelEn: 'King', tierVal: 'king', activeClass: 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-amber-500/10' },
  { id: 'tier5', labelVi: 'Truyền Thuyết', labelEn: 'Legend', tierVal: 'legend', activeClass: 'bg-gradient-to-r from-rose-600 to-red-600 shadow-rose-500/10' },
  { id: 'tier6', labelVi: 'Thần Thoại', labelEn: 'Mythic', tierVal: 'mythic', activeClass: 'bg-gradient-to-r from-fuchsia-600 to-pink-600 shadow-fuchsia-500/10' },
  { id: 'tier7', labelVi: 'Cổ Đại', labelEn: 'Ancient', tierVal: 'ancient', activeClass: 'bg-gradient-to-r from-cyan-600 to-sky-600 shadow-cyan-500/10' },
  { id: 'tier8', labelVi: 'Boss Thế Giới', labelEn: 'World Boss', tierVal: 'world-boss', activeClass: 'bg-gradient-to-r from-yellow-500 to-amber-500 shadow-yellow-500/10' }
] as const;

const REGIONS = [
  { id: 'grassland', labelVi: 'Thảo Nguyên', labelEn: 'Grassland', minStage: 1, maxStage: 15 },
  { id: 'temple', labelVi: 'Đền Đá Cổ', labelEn: 'Stone Temple', minStage: 16, maxStage: 35 },
  { id: 'frost', labelVi: 'Đỉnh Tuyết Lạnh', labelEn: 'Frost Peaks', minStage: 36, maxStage: 55 },
  { id: 'lava', labelVi: 'Vực Sâu Lửa', labelEn: 'Lava Rift', minStage: 56, maxStage: 75 },
  { id: 'void', labelVi: 'Hư Không Hắc Ám', labelEn: 'Abyssal Void', minStage: 76, maxStage: 95 },
  { id: 'titan', labelVi: 'Thượng Giới Titan', labelEn: 'Titan Realm', minStage: 96, maxStage: 1000 }
] as const;

const getMonsterImageUrl = (nameVi: string, nameEn: string) => {
  const lower = (nameVi + ' ' + nameEn).toLowerCase();
  if (lower.includes('golem') || lower.includes('vệ binh') || lower.includes('sentinel') || lower.includes('cổ tự')) {
    return '/boss_golem.png';
  } else if (lower.includes('demon') || lower.includes('quỷ') || lower.includes('archdemon') || lower.includes('mực') || lower.includes('hỏa')) {
    return '/boss_demon.png';
  } else if (lower.includes('dragon') || lower.includes('rồng') || lower.includes('behemoth')) {
    return '/boss_dragon.png';
  } else if (lower.includes('goblin') || lower.includes('thủ lĩnh')) {
    return '/boss_goblin.png';
  } else if (lower.includes('spider') || lower.includes('nhện')) {
    return '/boss_spider.png';
  } else if (lower.includes('chimera') || lower.includes('octopus') || lower.includes('leviathan') || lower.includes('quái thú') || lower.includes('thần thoại')) {
    return '/boss_octopus.png';
  } else if (lower.includes('knight') || lower.includes('hiệp sĩ')) {
    return '/boss_knight.png';
  }
  return '';
};

export const GuideTab: React.FC = () => {
  const { saveData } = useGameStore();
  const { language } = useLanguageStore();
  const [subTab, setSubTab] = useState<'bestiary' | 'map'>('bestiary');
  const [activeTab, setActiveTab] = useState<BestiaryTab>('tier1');
  const [activeRegion, setActiveRegion] = useState<string>('grassland');
  const [selectedId, setSelectedId] = useState<string>(MONSTER_SPECIES_DATABASE[0].id);
  const [previewMonster, setPreviewMonster] = useState<BestiarySpecies | null>(null);
  const [showDetailOnMobile, setShowDetailOnMobile] = useState<boolean>(false);

  if (!saveData) return null;

  const { monsterResearch = {}, hero } = saveData;

  // Filter candidates for selected tab based on our tier configuration
  const getFilteredSpecies = (): BestiarySpecies[] => {
    const config = TIER_CONFIG.find(c => c.id === activeTab) || TIER_CONFIG[0];
    return MONSTER_SPECIES_DATABASE.filter(s => s.tier === config.tierVal);
  };

  const filteredList = getFilteredSpecies();
  // Ensure the selected monster is in the filtered list
  const currentMonster = filteredList.find(m => m.id === selectedId) || filteredList[0] || MONSTER_SPECIES_DATABASE[0];

  const research = monsterResearch[currentMonster.id] || { level: 0, exp: 0, kills: 0 };
  const nextExpNeeded = research.level === 0 ? 100 : research.level * 100;
  const researchProgress = Math.min(100, Math.floor((research.exp / nextExpNeeded) * 100));

  // Determine unlocked metrics based on research level
  const isUnlockedName = research.level >= 1 || research.kills > 0;
  const isUnlockedStats = research.level >= 1;
  const isUnlockedDrops = research.level >= 5;
  const isUnlockedBuff10 = research.level >= 10;
  const isUnlockedBuff20 = research.level >= 20;
  const isUnlockedLore = research.level >= 30;

  // Estimate simulated stats for display card
  const getMonsterSimulatedStats = (species: BestiarySpecies) => {
    // Match player stage level scaling approximate level
    const level = Math.max(1, Math.floor(hero.level * 0.85)) + (species.category === 'king' ? 10 : 0);
    const hp = Math.round(45 * Math.pow(1.15, level - 1) * species.baseHpMult);
    const attack = Math.round(8 * Math.pow(1.12, level - 1) * species.baseAtkMult);
    const defense = Math.round(2 * Math.pow(1.09, level - 1) * species.baseDefMult);
    const goldEst = Math.round(6 * Math.pow(1.12, level - 1) * species.baseHpMult);

    return { level, hp, attack, defense, goldEst };
  };

  const currentStats = getMonsterSimulatedStats(currentMonster);

  const getElementTag = (element: DamageType) => {
    const mapping: Record<DamageType, { tag: string; color: string }> = {
      physical: { tag: language === 'vi' ? 'Vật lý' : 'Physical', color: 'bg-slate-800 text-slate-300' },
      fire: { tag: language === 'vi' ? 'Hỏa 🔥' : 'Fire 🔥', color: 'bg-red-950/60 border border-red-500/20 text-red-400 font-extrabold' },
      ice: { tag: language === 'vi' ? 'Băng ❄️' : 'Ice ❄️', color: 'bg-blue-950/60 border border-blue-500/20 text-blue-400 font-extrabold' },
      poison: { tag: language === 'vi' ? 'Độc 🤢' : 'Poison 🤢', color: 'bg-emerald-950/60 border border-emerald-500/20 text-emerald-400 font-extrabold' },
      holy: { tag: language === 'vi' ? 'Quang ☀️' : 'Holy ☀️', color: 'bg-amber-950/60 border border-yellow-500/20 text-amber-400 font-extrabold' },
      dark: { tag: language === 'vi' ? 'Ám 🌑' : 'Dark 🌑', color: 'bg-purple-950/60 border border-purple-500/20 text-purple-400 font-extrabold' }
    };
    return mapping[element] || { tag: element, color: 'bg-slate-900 text-slate-400' };
  };

  // Get species list matching a family to show completion
  const getFamilyCompletion = (family: string) => {
    const familyMembers = MONSTER_SPECIES_DATABASE.filter(m => m.family === family);
    const discovered = familyMembers.filter(m => (monsterResearch[m.id]?.kills || 0) > 0).length;
    return { discovered, total: familyMembers.length };
  };

  const familyCompletion = getFamilyCompletion(currentMonster.family);

  // Filter monsters by stage overlaps
  const getRegionMonsters = (min: number, max: number): BestiarySpecies[] => {
    return MONSTER_SPECIES_DATABASE.filter(m => m.spawnMinStage <= max && m.spawnMaxStage >= min);
  };

  const activeRegionConfig = REGIONS.find(r => r.id === activeRegion) || REGIONS[0];
  const regionMonsters = getRegionMonsters(activeRegionConfig.minStage, activeRegionConfig.maxStage);

  // Render Preview Modal for spawn map row selection
  const renderPreviewModal = () => {
    if (!previewMonster) return null;

    const mRes = monsterResearch[previewMonster.id] || { level: 0, exp: 0, kills: 0 };
    const isDiscovered = mRes.level > 0 || mRes.kills > 0;

    const mStats = getMonsterSimulatedStats(previewMonster);
    const researchProgress = Math.min(100, Math.floor((mRes.exp / (mRes.level === 0 ? 100 : mRes.level * 100)) * 100));

    const isUnlockedName = mRes.level >= 1 || mRes.kills > 0;
    const isUnlockedStats = mRes.level >= 1;
    const isUnlockedLore = mRes.level >= 30;

    const famCompletion = getFamilyCompletion(previewMonster.family);

    return (
      <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 w-full max-w-[320px] max-h-[85%] overflow-y-auto relative animate-success-pop scrollbar-thin shadow-2xl flex flex-col justify-between">
          
          <button
            onClick={() => setPreviewMonster(null)}
            className="absolute top-4 right-4 w-7 h-7 rounded-full bg-slate-950 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-xs transition cursor-pointer active:scale-90 font-bold shadow-md"
          >
            ✕
          </button>

          <div>
            <div className="text-center pb-3 border-b border-slate-850 select-none">
              <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1">
                {language === 'vi' ? `Xem Trước Lực Chiến: Lvl ${mStats.level}` : `Simulated Lvl: ${mStats.level}`}
              </span>
              
              <div className="w-12 h-12 flex items-center justify-center relative bg-slate-950 border border-slate-850 rounded-2xl mx-auto my-2.5 overflow-hidden shadow-inner select-none">
                {isDiscovered ? (
                  (() => {
                    const imgUrl = getMonsterImageUrl(previewMonster.nameVi, previewMonster.nameEn);
                    return imgUrl ? (
                      <img 
                        src={imgUrl} 
                        alt={previewMonster.nameEn} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div
                        className="w-7 h-6 rounded-t-full border border-slate-950"
                        style={{ backgroundColor: previewMonster.color }}
                      />
                    );
                  })()
                ) : (
                  <span className="text-xs font-extrabold text-slate-500">?</span>
                )}
                {previewMonster.hasCrown && isDiscovered && (
                  <span className="absolute top-0 right-0 text-[8px] bg-slate-950/80 p-0.5 rounded-bl">👑</span>
                )}
              </div>

              <h2 className="text-lg font-black tracking-wide text-slate-100 leading-tight">
                {isUnlockedName ? (language === 'vi' ? previewMonster.nameVi : previewMonster.nameEn) : '???'}
              </h2>
              
              {isUnlockedName && (
                <span className={`inline-block mt-1.5 px-2 py-0.5 rounded text-[8.5px] font-extrabold uppercase tracking-wide border ${
                  previewMonster.tier === 'normal' ? 'bg-slate-950/80 border-slate-800 text-slate-300' :
                  previewMonster.tier === 'elite' ? 'bg-indigo-950/80 border-indigo-500/20 text-indigo-300' :
                  previewMonster.tier === 'champion' ? 'bg-emerald-950/80 border-emerald-500/20 text-emerald-300' :
                  previewMonster.tier === 'king' ? 'bg-amber-950/80 border-amber-500/20 text-amber-300' :
                  previewMonster.tier === 'legend' ? 'bg-rose-950/80 border-rose-500/20 text-rose-300' :
                  previewMonster.tier === 'mythic' ? 'bg-fuchsia-950/80 border-fuchsia-500/20 text-fuchsia-300' :
                  previewMonster.tier === 'ancient' ? 'bg-cyan-950/80 border-cyan-500/20 text-cyan-300' :
                  'bg-yellow-950/80 border-yellow-500/20 text-yellow-300'
                }`}>
                  {language === 'vi' 
                    ? (previewMonster.tier === 'normal' ? 'Quái Thường' :
                       previewMonster.tier === 'elite' ? 'Tinh Anh' :
                       previewMonster.tier === 'champion' ? 'Quán Quân' :
                       previewMonster.tier === 'king' ? 'Vua / Hoàng Gia' :
                       previewMonster.tier === 'legend' ? 'Truyền Thuyết' :
                       previewMonster.tier === 'mythic' ? 'Thần Thoại' :
                       previewMonster.tier === 'ancient' ? 'Cổ Đại' : 'Boss Thế Giới')
                    : previewMonster.tier.replace('-', ' ')}
                </span>
              )}
            </div>

            {/* Research stats */}
            <div className="py-3 border-b border-slate-850">
              <div className="flex justify-between items-center text-[10.5px] font-extrabold select-none mb-2">
                <span className="text-slate-500 uppercase tracking-wider">
                  {language === 'vi' ? 'Cấp Nghiên Cứu' : 'Research Level'}
                </span>
                <span className="text-amber-400 font-extrabold">Lv.{mRes.level} / 50</span>
              </div>
              <div className="relative w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-900 mb-1.5">
                <div
                  className="h-full bg-gradient-to-r from-amber-600 to-yellow-400 rounded-full transition-all duration-300"
                  style={{ width: `${researchProgress}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[8.5px] text-slate-500 font-bold uppercase tracking-wider font-mono">
                <span>Exp: {mRes.exp} / {mRes.level === 0 ? 100 : mRes.level * 100}</span>
                <span>Kills: {mRes.kills}</span>
              </div>
            </div>

            {/* Attributes stats info */}
            <div className="py-3 border-b border-slate-850 space-y-2">
              <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">
                ⚔️ {language === 'vi' ? 'THUỘC TÍNH MÔ PHỎNG' : 'SIMULATED ATTRIBUTES'}
              </span>
              {isUnlockedStats ? (
                <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold">
                  <div className="flex flex-col bg-slate-950/40 p-2 rounded-lg border border-slate-900/60">
                    <span className="text-slate-500 text-[8px] uppercase tracking-wider">HP</span>
                    <strong className="text-emerald-400 mt-0.5">{mStats.hp.toLocaleString()}</strong>
                  </div>
                  <div className="flex flex-col bg-slate-950/40 p-2 rounded-lg border border-slate-900/60">
                    <span className="text-slate-500 text-[8px] uppercase tracking-wider">{language === 'vi' ? 'Tấn Công' : 'Attack'}</span>
                    <strong className="text-blue-400 mt-0.5">{mStats.attack.toLocaleString()}</strong>
                  </div>
                  <div className="flex flex-col bg-slate-950/40 p-2 rounded-lg border border-slate-900/60">
                    <span className="text-slate-500 text-[8px] uppercase tracking-wider">{language === 'vi' ? 'Phòng Thủ' : 'Defense'}</span>
                    <strong className="text-indigo-400 mt-0.5">{mStats.defense.toLocaleString()}</strong>
                  </div>
                  <div className="flex flex-col bg-slate-950/40 p-2 rounded-lg border border-slate-900/60">
                    <span className="text-slate-500 text-[8px] uppercase tracking-wider">{language === 'vi' ? 'Điểm Vàng (Ước lượng)' : 'Gold Yield (Est)'}</span>
                    <strong className="text-yellow-450 mt-0.5">~{mStats.goldEst.toLocaleString()} {GAME_ICONS.GOLD}</strong>
                  </div>
                </div>
              ) : (
                <span className="text-[10px] text-slate-600 italic block">
                  🔒 Đạt Cấp Nghiên Cứu 1 để xem thuộc tính
                </span>
              )}
            </div>

            {/* Element tags */}
            <div className="py-3 border-b border-slate-850 space-y-2">
              <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider select-none">
                🎯 {language === 'vi' ? 'ĐIỂM YẾU HỆ' : 'ELEMENTAL WEAKNESSES'}
              </span>
              {isUnlockedStats ? (
                <div className="flex flex-wrap gap-1">
                  {previewMonster.weaknesses.map(el => {
                    const tagObj = getElementTag(el);
                    return (
                      <span
                        key={el}
                        className={`text-[8.5px] font-black uppercase px-2 py-0.5 rounded-md ${tagObj.color}`}
                      >
                        {tagObj.tag}
                      </span>
                    );
                  })}
                </div>
              ) : (
                <span className="text-[10px] text-slate-600 italic block">
                  🔒 Đạt Cấp Nghiên Cứu 1 để xem điểm yếu
                </span>
              )}
            </div>

            {/* Lore and Details description */}
            <div className="py-3 border-b border-slate-850 space-y-2">
              <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider select-none">
                📜 {language === 'vi' ? 'TRUYỀN THUYẾT & KỸ NĂNG' : 'LORE & SKILLS'}
              </span>
              {isUnlockedLore ? (
                <div className="space-y-2">
                  <div className="bg-slate-950/50 p-2 rounded-lg border border-slate-900/80">
                    <span className="text-[8px] text-violet-400 font-extrabold uppercase block tracking-wider mb-0.5">
                      {language === 'vi' ? 'KỸ NĂNG' : 'MONSTER SKILL'}
                    </span>
                    <span className="text-[10px] font-black text-slate-200 block">
                      {language === 'vi' ? previewMonster.skillVi : previewMonster.skillEn}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed italic bg-slate-950/20 p-2 rounded-lg border border-slate-900/40">
                    {language === 'vi' ? previewMonster.loreVi : previewMonster.loreEn}
                  </p>
                </div>
              ) : (
                <span className="text-[10px] text-slate-650 italic block">
                  🔒 Đạt Cấp Nghiên Cứu 30 để mở khóa truyền thuyết
                </span>
              )}
            </div>
          </div>

          <div className="text-[9px] text-slate-500 border-t border-slate-850 pt-2 text-center select-none mt-4">
            {language === 'vi' 
              ? `${previewMonster.family.toUpperCase()} hoàn thành: ${famCompletion.discovered} / ${famCompletion.total}`
              : `${previewMonster.family.toUpperCase()} completion: ${famCompletion.discovered} / ${famCompletion.total}`}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-950/40 backdrop-blur-md rounded-2xl border border-slate-800/80 p-4 font-sans text-slate-200 relative overflow-hidden">
      
      {/* Sub tabs switcher */}
      <div className="flex gap-1.5 mb-3 shrink-0 select-none">
        <button
          onClick={() => setSubTab('bestiary')}
          className={`flex-1 py-1.5 text-[10px] font-black rounded-lg border transition cursor-pointer active:scale-95 text-center ${
            subTab === 'bestiary'
              ? 'bg-slate-900 border-slate-700 text-white shadow-lg shadow-black/45'
              : 'bg-slate-950/20 border-slate-900 text-slate-450 hover:text-slate-200'
          }`}
        >
          📖 {language === 'vi' ? 'SỔ TAY QUÁI VẬT' : 'BESTIARY'}
        </button>
        <button
          onClick={() => setSubTab('map')}
          className={`flex-1 py-1.5 text-[10px] font-black rounded-lg border transition cursor-pointer active:scale-95 text-center ${
            subTab === 'map'
              ? 'bg-slate-900 border-slate-700 text-white shadow-lg shadow-black/45'
              : 'bg-slate-950/20 border-slate-900 text-slate-450 hover:text-slate-200'
          }`}
        >
          🗺️ {language === 'vi' ? 'BẢN ĐỒ PHÂN BỐ' : 'SPAWN DISTRIBUTION MAP'}
        </button>
      </div>

      {subTab === 'bestiary' ? (
        <>
          {/* Tab selectors for 8 Tiers */}
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-1 bg-slate-950/80 p-1.5 rounded-xl border border-slate-900 mb-4 select-none shrink-0">
            {TIER_CONFIG.map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as BestiaryTab);
                  const list = MONSTER_SPECIES_DATABASE.filter(s => s.tier === tab.tierVal);
                  if (list.length > 0) setSelectedId(list[0].id);
                  setShowDetailOnMobile(false);
                }}
                className={`text-[9px] sm:text-xs font-bold py-2 rounded-lg cursor-pointer transition active:scale-95 text-center ${
                  activeTab === tab.id
                    ? `${tab.activeClass} text-white shadow-md`
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                }`}
              >
                {language === 'vi' ? tab.labelVi : tab.labelEn}
              </button>
            ))}
          </div>

          <div className="flex-1 flex flex-col md:flex-row gap-4 overflow-hidden relative">
            {/* Left column: grid view species list */}
            <div className={`flex-1 overflow-y-auto pr-1 grid grid-cols-1 sm:grid-cols-2 gap-2 scrollbar-thin content-start ${
              showDetailOnMobile ? 'hidden md:grid' : 'grid'
            }`}>
              {filteredList.map(monster => {
                const isSelected = currentMonster.id === monster.id;
                const mRes = monsterResearch[monster.id] || { level: 0, exp: 0, kills: 0 };
                const isDiscovered = mRes.level > 0 || mRes.kills > 0;

                return (
                  <button
                    key={monster.id}
                    onClick={() => {
                      setSelectedId(monster.id);
                      setShowDetailOnMobile(true);
                    }}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition active:scale-95 flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-violet-950/30 border-violet-500/60 shadow-[0_0_12px_rgba(139,92,246,0.2)]'
                        : 'bg-slate-900/40 border-slate-850 hover:border-slate-800/80 hover:bg-slate-900/70'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center relative bg-slate-950 border border-slate-850 rounded-lg overflow-hidden shadow-inner select-none">
                        {isDiscovered ? (
                          (() => {
                            const imgUrl = getMonsterImageUrl(monster.nameVi, monster.nameEn);
                            return imgUrl ? (
                              <img 
                                src={imgUrl} 
                                alt={monster.nameEn} 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div
                                className="w-5 h-4 rounded-t-full border border-slate-950"
                                style={{ backgroundColor: monster.color }}
                              />
                            );
                          })()
                        ) : (
                          <span className="text-[7.5px] font-extrabold text-slate-550">?</span>
                        )}
                        {monster.hasCrown && isDiscovered && (
                          <span className="absolute top-0 right-0 text-[6px] bg-slate-950/80 p-0.2 rounded-bl">👑</span>
                        )}
                      </div>

                      <div className="truncate min-w-0">
                        <h4 className="text-[11px] font-extrabold text-slate-100 truncate">
                          {isDiscovered ? (language === 'vi' ? monster.nameVi : monster.nameEn) : '???'}
                        </h4>
                        <span className="text-[8px] text-slate-500 block uppercase tracking-wider font-semibold">
                          Kills: <strong className="text-slate-400">{mRes.kills.toLocaleString()}</strong>
                        </span>
                      </div>
                    </div>

                    {isDiscovered && (
                      <span className="bg-slate-950 border border-slate-800 px-1.5 py-0.5 rounded text-[8px] text-amber-400 font-extrabold shrink-0">
                        Lv.{mRes.level}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Right column: detailed description */}
            <div className={`w-full h-full md:w-[280px] bg-slate-900/60 border border-slate-850 rounded-xl p-4 flex flex-col justify-between overflow-y-auto scrollbar-thin shrink-0 ${
              !showDetailOnMobile ? 'hidden md:flex' : 'flex'
            }`}>
              
              <div>
                {/* Mobile Back Button */}
                <button
                  onClick={() => setShowDetailOnMobile(false)}
                  className="md:hidden w-full mb-4 bg-slate-950 hover:bg-slate-900 border border-slate-850 text-slate-300 hover:text-white text-[10px] font-extrabold py-2 px-4 rounded-xl transition cursor-pointer active:scale-95 flex items-center justify-center gap-1.5 shadow"
                >
                  ⬅️ {language === 'vi' ? 'QUAY LẠI DANH SÁCH' : 'BACK TO LIST'}
                </button>

                {/* Simulated level info */}
                <div className="text-center py-2.5 border-b border-slate-850 select-none">
                  <span className="text-[10px] font-bold text-slate-550 block uppercase tracking-wider mb-1">
                    {language === 'vi' ? `Lực chiến Ải: Lvl ${currentStats.level}` : `Simulated Lvl: ${currentStats.level}`}
                  </span>
                  <h2 className="text-lg font-black tracking-wide text-slate-100 leading-tight">
                    {isUnlockedName ? (language === 'vi' ? currentMonster.nameVi : currentMonster.nameEn) : '???'}
                  </h2>
                  {/* Monster Tier Badge */}
                  {isUnlockedName && (
                    <span className={`inline-block mt-1.5 px-2 py-0.5 rounded text-[8.5px] font-extrabold uppercase tracking-wide border ${
                      currentMonster.tier === 'normal' ? 'bg-slate-950/80 border-slate-800 text-slate-300' :
                      currentMonster.tier === 'elite' ? 'bg-indigo-950/80 border-indigo-500/20 text-indigo-300' :
                      currentMonster.tier === 'champion' ? 'bg-emerald-950/80 border-emerald-500/20 text-emerald-300' :
                      currentMonster.tier === 'king' ? 'bg-amber-950/80 border-amber-500/20 text-amber-300' :
                      currentMonster.tier === 'legend' ? 'bg-rose-950/80 border-rose-500/20 text-rose-300' :
                      currentMonster.tier === 'mythic' ? 'bg-fuchsia-950/80 border-fuchsia-500/20 text-fuchsia-300' :
                      currentMonster.tier === 'ancient' ? 'bg-cyan-950/80 border-cyan-500/20 text-cyan-300' :
                      'bg-yellow-950/80 border-yellow-500/20 text-yellow-300'
                    }`}>
                      {language === 'vi' 
                        ? (currentMonster.tier === 'normal' ? 'Quái Thường' :
                           currentMonster.tier === 'elite' ? 'Tinh Anh' :
                           currentMonster.tier === 'champion' ? 'Quán Quân' :
                           currentMonster.tier === 'king' ? 'Vua / Hoàng Gia' :
                           currentMonster.tier === 'legend' ? 'Truyền Thuyết' :
                           currentMonster.tier === 'mythic' ? 'Thần Thoại' :
                           currentMonster.tier === 'ancient' ? 'Cổ Đại' : 'Boss Thế Giới')
                        : currentMonster.tier.replace('-', ' ')}
                    </span>
                  )}
                  <span className="text-[9px] text-slate-450 uppercase tracking-widest font-semibold block mt-1">
                    {currentMonster.family.toUpperCase()} FAMILY
                  </span>
                </div>

                {/* Research stats */}
                <div className="py-3.5 border-b border-slate-850">
                  <div className="flex justify-between items-center text-[10.5px] font-extrabold select-none mb-2">
                    <span className="text-slate-500 uppercase tracking-wider">
                      {language === 'vi' ? 'Mức Nghiên Cứu' : 'Research Level'}
                    </span>
                    <span className="text-amber-400 font-extrabold">Lv.{research.level} / 50</span>
                  </div>
                  <div className="relative w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-900 mb-2">
                    <div
                      className="h-full bg-gradient-to-r from-amber-600 to-yellow-400 rounded-full transition-all duration-300"
                      style={{ width: `${researchProgress}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[8.5px] text-slate-500 font-bold uppercase tracking-wider font-mono">
                    <span>Exp: {research.exp} / {nextExpNeeded}</span>
                    <span>Kills: {research.kills}</span>
                  </div>
                </div>

                {/* Attributes stats info */}
                <div className="py-4 border-b border-slate-850 space-y-2">
                  <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">
                    ⚔️ {language === 'vi' ? 'THUỘC TÍNH MÔ PHỎNG' : 'SIMULATED ATTRIBUTES'}
                  </span>
                  {isUnlockedStats ? (
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold">
                      <div className="flex flex-col bg-slate-950/40 p-2 rounded-lg border border-slate-900/60">
                        <span className="text-slate-500 text-[8px] uppercase tracking-wider">HP</span>
                        <strong className="text-emerald-400 mt-0.5">{currentStats.hp.toLocaleString()}</strong>
                      </div>
                      <div className="flex flex-col bg-slate-950/40 p-2 rounded-lg border border-slate-900/60">
                        <span className="text-slate-500 text-[8px] uppercase tracking-wider">{language === 'vi' ? 'Tấn Công' : 'Attack'}</span>
                        <strong className="text-blue-400 mt-0.5">{currentStats.attack.toLocaleString()}</strong>
                      </div>
                      <div className="flex flex-col bg-slate-950/40 p-2 rounded-lg border border-slate-900/60">
                        <span className="text-slate-500 text-[8px] uppercase tracking-wider">{language === 'vi' ? 'Phòng Thủ' : 'Defense'}</span>
                        <strong className="text-indigo-400 mt-0.5">{currentStats.defense.toLocaleString()}</strong>
                      </div>
                      <div className="flex flex-col bg-slate-950/40 p-2 rounded-lg border border-slate-900/60">
                        <span className="text-slate-500 text-[8px] uppercase tracking-wider">{language === 'vi' ? 'Điểm Vàng (Ước lượng)' : 'Gold Yield (Est)'}</span>
                        <strong className="text-yellow-450 mt-0.5">~{currentStats.goldEst.toLocaleString()} {GAME_ICONS.GOLD}</strong>
                      </div>
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-600 italic block">
                      🔒 Đạt Cấp Nghiên Cứu 1 để xem thuộc tính
                    </span>
                  )}
                </div>

                {/* Element tags */}
                <div className="py-4 border-b border-slate-850 space-y-2">
                  <span className="block text-[10px] text-slate-550 font-bold uppercase tracking-wider mb-2 select-none">
                    🎯 {language === 'vi' ? 'ĐIỂM YẾU HỆ' : 'ELEMENTAL WEAKNESSES'}
                  </span>
                  {isUnlockedStats ? (
                    <div className="flex flex-wrap gap-1.5">
                      {currentMonster.weaknesses.map(el => {
                        const tagObj = getElementTag(el);
                        return (
                          <span
                            key={el}
                            className={`text-[8.5px] font-black uppercase px-2 py-0.5 rounded-md ${tagObj.color}`}
                          >
                            {tagObj.tag}
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-600 italic block">
                      🔒 Đạt Cấp Nghiên Cứu 1 để xem điểm yếu
                    </span>
                  )}
                </div>

                {/* Buff effects */}
                <div className="py-4 border-b border-slate-850 space-y-2 select-none">
                  <span className="block text-[10px] text-slate-550 font-bold uppercase tracking-wider mb-2">
                    📈 {language === 'vi' ? 'HIỆU ỨNG CHI VIỆN' : 'BESTIARY RESEARCH BUFFS'}
                  </span>
                  <div className="space-y-1.5 text-[9px] font-semibold">
                    <div className={`flex items-center justify-between p-1.5 rounded-lg border ${
                      isUnlockedBuff10 ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400' : 'bg-slate-950/20 border-slate-900 text-slate-600'
                    }`}>
                      <span>Lv.10: {language === 'vi' ? 'Hồi phục máu +2/giây' : 'HP Regen +2/sec'}</span>
                      <span>{isUnlockedBuff10 ? '✓' : '🔒'}</span>
                    </div>
                    <div className={`flex items-center justify-between p-1.5 rounded-lg border ${
                      isUnlockedBuff20 ? 'bg-amber-950/20 border-yellow-500/20 text-amber-400' : 'bg-slate-950/20 border-slate-900 text-slate-600'
                    }`}>
                      <span>Lv.20: {language === 'vi' ? 'Sát thương lên quái +5%' : 'Atk vs monster +5%'}</span>
                      <span>{isUnlockedBuff20 ? '✓' : '🔒'}</span>
                    </div>
                  </div>
                </div>

                {/* Lore and Details description */}
                <div className="py-4 border-b border-slate-850 space-y-2">
                  <span className="block text-[10px] text-slate-550 font-bold uppercase tracking-wider select-none">
                    📜 {language === 'vi' ? 'TRUYỀN THUYẾT & KỸ NĂNG' : 'LORE & SKILLS'}
                  </span>
                  {isUnlockedLore ? (
                    <div className="space-y-2">
                      <div className="bg-slate-950/50 p-2.5 rounded-lg border border-slate-900/80">
                        <span className="text-[8px] text-violet-400 font-extrabold uppercase block tracking-wider mb-1">
                          {language === 'vi' ? 'KỸ NĂNG' : 'MONSTER SKILL'}
                        </span>
                        <span className="text-[10px] font-black text-slate-200 block">
                          {language === 'vi' ? currentMonster.skillVi : currentMonster.skillEn}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-relaxed italic bg-slate-950/20 p-2.5 rounded-lg border border-slate-900/40">
                        {language === 'vi' ? currentMonster.loreVi : currentMonster.loreEn}
                      </p>
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-600 italic block">
                      🔒 Đạt Cấp Nghiên Cứu 30 để mở khóa truyền thuyết
                    </span>
                  )}
                </div>

                {/* Drop pool preview */}
                <div className="py-4 space-y-2">
                  <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider select-none">
                    💎 {language === 'vi' ? 'DANH SÁCH RƠI ĐỒ' : 'MONSTER DROP PREVIEW'}
                  </span>
                  {isUnlockedDrops ? (
                    <div className="space-y-1 text-[9px]">
                      <div className="flex justify-between text-slate-400 pb-0.5 border-b border-slate-900/60 mb-1">
                        <span>Vật phẩm</span>
                        <span>Tỉ lệ</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>Thiết Bị Phổ Thông (Common Gear)</span>
                        <span className="font-mono text-emerald-400">100%</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>Đá Khảm Ngọc (Sockets/Gems)</span>
                        <span className="font-mono text-blue-400">10%</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>Trang Bị Sử Thi (Epic/Legendary)</span>
                        <span className="font-mono text-purple-400">{(0.1 * currentMonster.baseHpMult).toFixed(2)}%</span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-600 italic block">
                      🔒 Đạt Cấp Nghiên Cứu 5 để xem tỉ lệ rơi đồ
                    </span>
                  )}
                </div>
              </div>

              <div className="text-[9px] text-slate-500 border-t border-slate-850 pt-2 text-center select-none">
                {language === 'vi' 
                  ? `Nhóm ${currentMonster.family === 'slime' ? 'Slime' : currentMonster.family === 'greenskin' ? 'Da Xanh' : currentMonster.family === 'undead' ? 'Xác Sống' : currentMonster.family === 'elemental' ? 'Nguyên Tố' : 'Rồng'} hoàn thành: ${familyCompletion.discovered} / ${familyCompletion.total} thành viên`
                  : `${currentMonster.family.toUpperCase()} completion: ${familyCompletion.discovered} / ${familyCompletion.total}`}
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Region selectors */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 bg-slate-950/80 p-1.5 rounded-xl border border-slate-900 mb-4 select-none shrink-0 text-center">
            {REGIONS.map(reg => (
              <button
                key={reg.id}
                onClick={() => setActiveRegion(reg.id)}
                className={`text-[9.5px] sm:text-xs font-black py-2 rounded-lg cursor-pointer transition active:scale-95 ${
                  activeRegion === reg.id
                    ? 'bg-slate-900 border border-slate-800 text-white shadow-md shadow-black/45'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
                }`}
              >
                {language === 'vi' ? reg.labelVi : reg.labelEn}
              </button>
            ))}
          </div>

          {/* Table view */}
          <div className="flex-grow overflow-y-auto bg-slate-900/40 border border-slate-850 rounded-xl p-3 scrollbar-thin">
            <table className="w-full text-left text-[10.5px] border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 font-extrabold select-none">
                  <th className="py-2 pl-2">{language === 'vi' ? 'Hình ảnh' : 'Icon'}</th>
                  <th className="py-2">{language === 'vi' ? 'Tên quái vật' : 'Monster Name'}</th>
                  <th className="py-2">{language === 'vi' ? 'Cấp độ sức mạnh' : 'Tier'}</th>
                  <th className="py-2">{language === 'vi' ? 'Khung Ải Xuất Hiện' : 'Spawn Range'}</th>
                </tr>
              </thead>
              <tbody>
                {regionMonsters.map(monster => {
                  const mRes = monsterResearch[monster.id] || { level: 0, exp: 0, kills: 0 };
                  const isDiscovered = mRes.level > 0 || mRes.kills > 0;

                  return (
                    <tr 
                      key={monster.id}
                      onClick={() => setPreviewMonster(monster)}
                      className="border-b border-slate-900 hover:bg-slate-950/40 transition cursor-pointer select-none group"
                    >
                      <td className="py-2 pl-2 shrink-0">
                        <div className="w-8 h-8 flex items-center justify-center relative bg-slate-950 border border-slate-850 rounded-lg overflow-hidden shadow-inner group-hover:scale-105 transition select-none">
                          {isDiscovered ? (
                            (() => {
                              const imgUrl = getMonsterImageUrl(monster.nameVi, monster.nameEn);
                              return imgUrl ? (
                                <img 
                                  src={imgUrl} 
                                  alt={monster.nameEn} 
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div
                                  className="w-5 h-4 rounded-t-full border border-slate-950"
                                  style={{ backgroundColor: monster.color }}
                                />
                              );
                            })()
                          ) : (
                            <span className="text-[7.5px] font-extrabold text-slate-550">?</span>
                          )}
                          {monster.hasCrown && isDiscovered && (
                            <span className="absolute top-0 right-0 text-[6px] bg-slate-950/80 p-0.2 rounded-bl">👑</span>
                          )}
                        </div>
                      </td>

                      {/* Column 2: Monster Name */}
                      <td className="py-2.5 pr-2 font-black text-slate-100 group-hover:text-violet-400 transition">
                        {isDiscovered ? (language === 'vi' ? monster.nameVi : monster.nameEn) : '???'}
                      </td>

                      {/* Column 3: Tier Badge */}
                      <td className="py-2.5 pr-2">
                        {isDiscovered ? (
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wide border ${
                            monster.tier === 'normal' ? 'bg-slate-950/80 border-slate-800 text-slate-400' :
                            monster.tier === 'elite' ? 'bg-indigo-950/80 border-indigo-500/20 text-indigo-400' :
                            monster.tier === 'champion' ? 'bg-emerald-950/80 border-emerald-500/20 text-emerald-450' :
                            monster.tier === 'king' ? 'bg-amber-950/80 border-amber-500/20 text-amber-450' :
                            monster.tier === 'legend' ? 'bg-rose-950/80 border-rose-500/20 text-rose-450' :
                            monster.tier === 'mythic' ? 'bg-fuchsia-950/80 border-fuchsia-500/20 text-fuchsia-400' :
                            monster.tier === 'ancient' ? 'bg-cyan-950/80 border-cyan-500/20 text-cyan-400' :
                            'bg-yellow-950/80 border-yellow-500/20 text-yellow-450'
                          }`}>
                            {language === 'vi' 
                              ? (monster.tier === 'normal' ? 'Quái Thường' :
                                 monster.tier === 'elite' ? 'Tinh Anh' :
                                 monster.tier === 'champion' ? 'Quán Quân' :
                                 monster.tier === 'king' ? 'Vua / Hoàng Gia' :
                                 monster.tier === 'legend' ? 'Truyền Thuyết' :
                                 monster.tier === 'mythic' ? 'Thần Thoại' :
                                 monster.tier === 'ancient' ? 'Cổ Đại' : 'Boss Thế Giới')
                              : monster.tier.replace('-', ' ')}
                          </span>
                        ) : (
                          <span className="text-slate-650 italic">🔒 Khóa</span>
                        )}
                      </td>

                      {/* Column 4: Spawn Range */}
                      <td className="py-2.5 font-mono text-[10px] text-slate-450">
                        {monster.spawnMinStage === 999 
                          ? (language === 'vi' ? 'Cổng Bí Ẩn' : 'Special Hidden') 
                          : `${language === 'vi' ? 'Ải' : 'Stage'} ${monster.spawnMinStage} - ${monster.spawnMaxStage}`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Preview Modal for row click or icon click */}
      {renderPreviewModal()}
    </div>
  );
};
