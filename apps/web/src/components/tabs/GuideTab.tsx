import React, { useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { useLanguageStore } from '../../stores/languageStore';
import { MONSTER_SPECIES_DATABASE, BestiarySpecies, DamageType } from '@idle-rpg/shared';

type BestiaryTab = 'normal' | 'boss' | 'king' | 'mutated' | 'mystery' | 'extinct';

export const GuideTab: React.FC = () => {
  const { saveData } = useGameStore();
  const { language } = useLanguageStore();
  const [activeTab, setActiveTab] = useState<BestiaryTab>('normal');
  const [selectedId, setSelectedId] = useState<string>(MONSTER_SPECIES_DATABASE[0].id);

  if (!saveData) return null;

  const { monsterResearch = {}, hero } = saveData;

  // Filter candidates for selected tab
  const getFilteredSpecies = (): BestiarySpecies[] => {
    switch (activeTab) {
      case 'normal':
        return MONSTER_SPECIES_DATABASE.filter(s => s.category === 'normal');
      case 'boss':
        return MONSTER_SPECIES_DATABASE.filter(s => s.category === 'boss');
      case 'king':
        return MONSTER_SPECIES_DATABASE.filter(s => s.category === 'king');
      case 'mutated':
        // Display normal slimes/greenskins but with mutated context
        return MONSTER_SPECIES_DATABASE.filter(s => s.category === 'normal');
      case 'mystery':
        return MONSTER_SPECIES_DATABASE.filter(s => s.category === 'mystery');
      case 'extinct':
        return MONSTER_SPECIES_DATABASE.filter(s => s.category === 'extinct');
    }
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
    const isMutatedMode = activeTab === 'mutated';
    // Match player stage level scaling approximate level
    const level = Math.max(1, Math.floor(hero.level * 0.85)) + (species.category === 'king' ? 10 : 0);
    let hp = Math.round(45 * Math.pow(1.15, level - 1) * species.baseHpMult);
    let attack = Math.round(8 * Math.pow(1.12, level - 1) * species.baseAtkMult);
    let defense = Math.round(2 * Math.pow(1.09, level - 1) * species.baseDefMult);
    let goldEst = Math.round(6 * Math.pow(1.12, level - 1) * species.baseHpMult);

    if (isMutatedMode) {
      hp = hp * 3;
      attack = attack * 2;
      goldEst = goldEst * 4;
    }

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

  return (
    <div className="flex flex-col h-full bg-slate-950/40 backdrop-blur-md rounded-2xl border border-slate-800/80 p-4 font-sans text-slate-200">
      
      {/* Tab selectors */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 bg-slate-950/80 p-1.5 rounded-xl border border-slate-900 mb-4 select-none">
        {(['normal', 'boss', 'king', 'mutated', 'mystery', 'extinct'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              const list = MONSTER_SPECIES_DATABASE.filter(s => {
                if (tab === 'mutated') return s.category === 'normal';
                return s.category === tab;
              });
              if (list.length > 0) setSelectedId(list[0].id);
            }}
            className={`text-[9px] sm:text-xs font-bold py-2 rounded-lg cursor-pointer transition active:scale-95 ${
              activeTab === tab
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/10'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
            }`}
          >
            {tab === 'normal' ? (language === 'vi' ? 'Quái Thường' : 'Normal') :
             tab === 'boss' ? (language === 'vi' ? 'Thủ Lĩnh' : 'Boss') :
             tab === 'king' ? (language === 'vi' ? 'Thiên Vương' : 'King') :
             tab === 'mutated' ? (language === 'vi' ? 'Biến Dị 🧬' : 'Mutated 🧬') :
             tab === 'mystery' ? (language === 'vi' ? 'Bí Ẩn ❓' : 'Mystery ❓') :
             (language === 'vi' ? 'Tuyệt Chủng' : 'Extinct')}
          </button>
        ))}
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-4 overflow-hidden">
        {/* Left column: grid view species list */}
        <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[160px] md:max-h-none scrollbar-thin">
          {filteredList.map(monster => {
            const isSelected = currentMonster.id === monster.id;
            const mRes = monsterResearch[monster.id] || { level: 0, exp: 0, kills: 0 };
            const isDiscovered = mRes.level > 0 || mRes.kills > 0;

            return (
              <button
                key={monster.id}
                onClick={() => setSelectedId(monster.id)}
                className={`p-3 rounded-xl border text-left cursor-pointer transition active:scale-95 flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-violet-950/30 border-violet-500/60 shadow-[0_0_12px_rgba(139,92,246,0.2)]'
                    : 'bg-slate-900/40 border-slate-850 hover:border-slate-800/80 hover:bg-slate-900/70'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Slime micro indicator */}
                  <div
                    className="w-6 h-5 rounded-t-full border border-slate-950 flex-shrink-0 flex items-center justify-center relative shadow-inner"
                    style={{ backgroundColor: isDiscovered ? monster.color : '#334155' }}
                  >
                    {monster.hasCrown && isDiscovered && (
                      <span className="absolute -top-2.5 text-[8px] animate-bounce">👑</span>
                    )}
                    {!isDiscovered && <span className="text-[7px] font-extrabold text-slate-500">?</span>}
                  </div>

                  <div className="truncate min-w-0">
                    <h4 className="text-[11px] font-extrabold text-slate-100 truncate">
                      {isDiscovered ? (language === 'vi' ? monster.nameVi : monster.nameEn) : '???'}
                    </h4>
                    <span className="text-[8px] text-slate-500 block uppercase tracking-wider">
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

        {/* Right column: detailed species details & research levels */}
        <div className="w-full md:w-[280px] bg-slate-900/60 border border-slate-850 rounded-xl p-4 flex flex-col justify-between overflow-y-auto max-h-[300px] md:max-h-none scrollbar-thin shrink-0">
          
          <div>
            {/* Visual element and metadata */}
            <div className="flex flex-col items-center border-b border-slate-850 pb-3 mb-3">
              <div
                className={`w-20 h-16 rounded-t-full border-2 border-slate-950 flex items-center justify-center relative shadow-lg transition duration-300 transform hover:scale-105 ${
                  activeTab === 'mutated' ? 'animate-pulse' : ''
                }`}
                style={{
                  backgroundColor: isUnlockedName ? currentMonster.color : '#334155',
                  filter: activeTab === 'mutated' ? 'hue-rotate(90deg) saturate(1.5)' : ''
                }}
              >
                {/* Face specs */}
                {isUnlockedName && (
                  <>
                    <div className="absolute w-1.5 h-1.5 bg-slate-950 rounded-full left-5 top-6" />
                    <div className="absolute w-1.5 h-1.5 bg-slate-950 rounded-full right-5 top-6" />
                    <div className="w-2.5 h-1.5 border-b-2 border-slate-950 rounded-full absolute bottom-5" />
                  </>
                )}

                {currentMonster.hasCrown && isUnlockedName && (
                  <span className="absolute -top-6 text-2xl animate-bounce">👑</span>
                )}
                {!isUnlockedName && <span className="text-lg font-bold text-slate-500">?</span>}
              </div>

              <h3 className="text-sm font-extrabold text-white mt-3 text-center">
                {isUnlockedName ? (language === 'vi' ? currentMonster.nameVi : currentMonster.nameEn) : '???'}
                {activeTab === 'mutated' && isUnlockedName && <span className="text-purple-400 text-[10px] ml-1 font-bold">🧬 [Mutated]</span>}
              </h3>
              
              <div className="flex gap-2 mt-1">
                <span className="text-[8px] bg-slate-950 border border-slate-800 text-slate-400 rounded px-1.5 py-0.5">
                  {language === 'vi' ? `Lực chiến Ải: Lvl ${currentStats.level}` : `Simulated Lvl: ${currentStats.level}`}
                </span>
                <span className="text-[8px] bg-slate-950 border border-slate-800 text-slate-400 rounded px-1.5 py-0.5 uppercase tracking-wide">
                  {currentMonster.family}
                </span>
              </div>
            </div>

            {/* Research EXP tracker */}
            <div className="space-y-1.5 mb-3.5 bg-slate-950/60 p-2.5 rounded-xl border border-slate-900">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-slate-400 font-bold">
                  {language === 'vi' ? 'Mức Nghiên Cứu' : 'Research Level'}
                </span>
                <span className="text-amber-400 font-extrabold">Lv.{research.level} / 50</span>
              </div>

              <div className="h-2.5 bg-slate-900 border border-slate-850 rounded-full overflow-hidden relative">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-300"
                  style={{ width: `${researchProgress}%` }}
                />
                <span className="absolute inset-0 text-[8px] font-extrabold flex items-center justify-center text-white select-none">
                  {research.exp} / {nextExpNeeded} EXP
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1.5 pt-1 text-[8px] font-bold">
                <div className={`flex justify-between items-center px-1.5 py-0.5 rounded ${isUnlockedBuff10 ? 'bg-emerald-950/40 text-emerald-400' : 'bg-slate-900 text-slate-650'}`}>
                  <span>⚔️ Công +2%:</span>
                  <span>{isUnlockedBuff10 ? '✔️ On' : 'Off'}</span>
                </div>
                <div className={`flex justify-between items-center px-1.5 py-0.5 rounded ${isUnlockedBuff20 ? 'bg-emerald-950/40 text-emerald-400' : 'bg-slate-900 text-slate-650'}`}>
                  <span>🎁 Rơi Đồ +5%:</span>
                  <span>{isUnlockedBuff20 ? '✔️ On' : 'Off'}</span>
                </div>
              </div>
            </div>

            {/* Core Stats Block */}
            <div className="space-y-1.5 mb-3 bg-slate-950/30 p-3 border border-slate-900 rounded-xl">
              <span className="block text-[8px] text-slate-500 font-bold uppercase tracking-wider mb-1">
                {language === 'vi' ? 'Thông Số Lực Chiến' : 'Simulated Combat Stats'}
              </span>

              {isUnlockedStats ? (
                <div className="space-y-1.5 text-[10px]">
                  <div className="flex justify-between border-b border-slate-900/60 pb-1">
                    <span className="text-slate-400">💖 HP</span>
                    <span className="text-slate-200 font-bold font-mono">{currentStats.hp.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-900/60 pb-1">
                    <span className="text-slate-400">⚔️ ATK</span>
                    <span className="text-slate-200 font-bold font-mono">{currentStats.attack.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-900/60 pb-1">
                    <span className="text-slate-400">🛡️ DEF</span>
                    <span className="text-slate-200 font-bold font-mono">{currentStats.defense.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-900/60 pb-1">
                    <span className="text-slate-400">🎯 {language === 'vi' ? 'Điểm Yếu' : 'Weaknesses'}</span>
                    <div className="flex gap-1.5">
                      {currentMonster.weaknesses.map(w => {
                        const style = getElementTag(w);
                        return (
                          <span key={w} className={`text-[8px] px-1 py-0.2 rounded font-extrabold uppercase ${style.color}`}>
                            {style.tag}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-2 text-slate-600 text-[10px] italic">
                  🔒 Đạt Cấp Nghiên Cứu 1 để giải khóa thông số
                </div>
              )}
            </div>

            {/* Boss Records Memory */}
            {(currentMonster.category === 'boss' || currentMonster.category === 'king' || currentMonster.category === 'extinct') && (
              <div className="space-y-1.5 mb-3 bg-violet-950/10 p-3 border border-violet-950/20 rounded-xl">
                <span className="block text-[8px] text-violet-400 font-extrabold uppercase tracking-wider mb-1">
                  🏆 {language === 'vi' ? 'KỶ LỤC DIỆT BOSS' : 'BOSS TRIAL RECORDS'}
                </span>
                <div className="space-y-1 text-[10px]">
                  <div className="flex justify-between border-b border-violet-950/5 pb-1">
                    <span className="text-slate-400">{language === 'vi' ? 'Hạ Lần Đầu' : 'First Kill'}</span>
                    <span className="text-slate-200 font-semibold font-mono">
                      {research.firstKillTime ? new Date(research.firstKillTime).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-violet-950/5 pb-1">
                    <span className="text-slate-400">{language === 'vi' ? 'Tốc Độ Kỷ Lục' : 'Fastest Kill'}</span>
                    <span className="text-amber-400 font-bold font-mono">
                      {research.fastestKillMs ? `${(research.fastestKillMs / 1000).toFixed(2)}s ⏱️` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between pb-0.5">
                    <span className="text-slate-400">{language === 'vi' ? 'Sát Thương Max' : 'Max Hit'}</span>
                    <span className="text-red-400 font-bold font-mono">
                      {research.highestDamage ? `${research.highestDamage.toLocaleString()} 💥` : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Skills & Description */}
            <div className="space-y-2 mb-3">
              <div className="bg-slate-950/20 border border-slate-900 rounded-xl p-3">
                <span className="block text-[8px] text-slate-500 font-bold uppercase tracking-wider mb-1">
                  ⭐ {language === 'vi' ? 'KỸ NĂNG ĐẶC TRƯNG' : 'SIGNATURE SKILL'}
                </span>
                {isUnlockedDrops ? (
                  <span className="text-[10px] text-slate-300 font-bold block">
                    {language === 'vi' ? currentMonster.skillVi : currentMonster.skillEn}
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-600 italic block">
                    🔒 Đạt Cấp Nghiên Cứu 5 để xem kỹ năng
                  </span>
                )}
              </div>

              <div className="bg-slate-950/20 border border-slate-900 rounded-xl p-3">
                <span className="block text-[8px] text-slate-500 font-bold uppercase tracking-wider mb-1">
                  📖 {language === 'vi' ? 'GIẢI THOẠI & LORE' : 'SPECIES LORE'}
                </span>
                {isUnlockedLore ? (
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    {language === 'vi' ? currentMonster.loreVi : currentMonster.loreEn}
                  </p>
                ) : (
                  <p className="text-[10px] text-slate-600 italic leading-relaxed">
                    🔒 Đạt Cấp Nghiên Cứu 30 để giải mã giai thoại quái vật
                  </p>
                )}
              </div>
            </div>

            {/* Drop tables preview */}
            <div className="bg-slate-950/20 border border-slate-900 rounded-xl p-3 mb-2">
              <span className="block text-[8px] text-slate-500 font-bold uppercase tracking-wider mb-1.5">
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

          <div className="text-[9px] text-slate-500 border-t border-slate-850 pt-2 text-center">
            {language === 'vi' 
              ? `Gia đình Slime hoàn thành: ${familyCompletion.discovered} / ${familyCompletion.total} thành viên`
              : `${currentMonster.family.toUpperCase()} completion: ${familyCompletion.discovered} / ${familyCompletion.total}`}
          </div>
        </div>
      </div>
    </div>
  );
};
