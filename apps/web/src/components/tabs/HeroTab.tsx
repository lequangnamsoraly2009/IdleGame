import React, { useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { useLanguageStore } from '../../stores/languageStore';
import { calculatePrestigePoints, calculateHeroCP } from '@idle-rpg/shared';
import { useTranslation, getTranslatedItemName } from '../../utils/i18n';
import { ItemGraphic } from '../ItemGraphic';
import { BagTab } from './BagTab';
import { GuideTab } from './GuideTab';

export const HeroTab: React.FC = () => {
  const { saveData, triggerPrestige, setActiveInspectItemId } = useGameStore();
  const { language } = useLanguageStore();
  const { t } = useTranslation();
  const [subTab, setSubTab] = useState<'stats' | 'bag' | 'guide'>('stats');

  if (!saveData) return null;

  const { hero, stagesCleared, inventory } = saveData;
  const prestigeReward = calculatePrestigePoints(stagesCleared);

  // Prestige multiplier math
  const prestigeDmgBonus = hero.prestigePoints * 2; // +2% per point
  const prestigeHpBonus = hero.prestigePoints * 2;  // +2% per point
  const prestigeDefBonus = hero.prestigePoints * 1;  // +1% per point

  const getHeroClassDetails = () => {
    switch (hero.heroClass || 'knight') {
      case 'mage':
        return {
          titleVi: 'Pháp Sư',
          titleEn: 'Mage',
          icon: '🔮',
          bgClass: 'from-violet-900/40 to-indigo-950/20 border-violet-500/30 shadow-violet-500/5',
          description: language === 'vi' ? 'Bậc thầy ma pháp, sát thương nguyên tố.' : 'Master of elements and elemental spells.'
        };
      case 'assassin':
        return {
          titleVi: 'Sát Thủ',
          titleEn: 'Assassin',
          icon: '🗡️',
          bgClass: 'from-emerald-900/40 to-teal-950/20 border-emerald-500/30 shadow-emerald-500/5',
          description: language === 'vi' ? 'Nhanh nhẹn, sát thương chí mạng cực mạnh.' : 'Swift and lethal critical hit specialist.'
        };
      default: // knight
        return {
          titleVi: 'Hiệp Sĩ',
          titleEn: 'Knight',
          icon: '🛡️',
          bgClass: 'from-amber-900/40 to-orange-950/20 border-amber-500/30 shadow-amber-500/5',
          description: language === 'vi' ? 'Hộ vệ kiên cường, HP và thủ cao.' : 'Indomitable shield with high health and defense.'
        };
    }
  };

  const classDetails = getHeroClassDetails();

  const statItems = [
    { label: language === 'vi' ? '🔮 Lớp Nhân Vật' : '🔮 Class', value: language === 'vi' ? classDetails.titleVi : classDetails.titleEn, desc: classDetails.description },
    { label: language === 'vi' ? '🌟 Cấp Độ' : '🌟 Level', value: `Lv.${hero.level}`, desc: `${language === 'vi' ? 'Cấp độ hiện tại' : 'Current level'}` },
    { label: t('max_health'), value: hero.currentStats.maxHp, desc: `${t('stat_base')}: ${hero.baseStats.maxHp}` },
    { label: t('attack_power'), value: hero.currentStats.attack, desc: `${t('stat_base')}: ${hero.baseStats.attack}` },
    { label: t('magic_attack'), value: hero.currentStats.magicAttack || 0, desc: `${t('stat_base')}: ${hero.baseStats.magicAttack || 0}` },
    { label: t('defense_rating'), value: hero.currentStats.defense, desc: `${t('stat_base')}: ${hero.baseStats.defense}` },
    { label: t('magic_resist'), value: hero.currentStats.magicResist || 0, desc: `${t('stat_base')}: ${hero.baseStats.magicResist || 0}` },
    { label: t('attack_speed'), value: `${hero.currentStats.speed}%`, desc: `${t('stat_base')}: 100%` },
    { label: t('critical_rate'), value: `${Math.round(hero.currentStats.critRate * 100)}%`, desc: `${t('stat_cap')}: 85%` },
    { label: t('critical_damage'), value: `${Math.round(hero.currentStats.critDamage * 100)}%`, desc: `${t('stat_base')}: 150%` },
    { label: t('lifesteal'), value: `${Math.round((hero.currentStats.lifesteal || 0) * 100)}%`, desc: language === 'vi' ? 'Hồi máu đòn đánh' : 'Heal on basic hit' },
    { label: t('spell_vamp'), value: `${Math.round((hero.currentStats.spellVamp || 0) * 100)}%`, desc: language === 'vi' ? 'Hồi máu kỹ năng' : 'Heal on spells' },
    { label: t('evasion'), value: `${Math.round((hero.currentStats.evasion || 0) * 100)}%`, desc: `${t('stat_cap')}: 75%` },
    { label: t('block'), value: `${Math.round((hero.currentStats.block || 0) * 100)}%`, desc: `${t('stat_cap')}: 75%` },
  ];

  const renderCharacterSVG = (heroClass: string) => {
    const cls = heroClass || 'knight';

    if (cls === 'knight') {
      return (
        <svg viewBox="0 0 100 110" className="w-24 h-24 sm:w-28 sm:h-28 drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
          <path d="M 50 15 Q 65 0 75 12 Q 60 16 50 15" fill="#ef4444" stroke="#991b1b" strokeWidth="0.8" />
          <circle cx="28" cy="74" r="6" fill="#94a3b8" stroke="#334155" strokeWidth="1.5" />
          <circle cx="72" cy="74" r="6" fill="#94a3b8" stroke="#334155" strokeWidth="1.5" />
          <circle cx="50" cy="76" r="18" fill="#cbd5e1" stroke="#334155" strokeWidth="1.8" />
          <rect x="48" y="66" width="4" height="20" fill="#f59e0b" />
          <rect x="40" y="74" width="20" height="4" fill="#f59e0b" />
          <circle cx="41" cy="94" r="5" fill="#475569" stroke="#1e293b" strokeWidth="1.5" />
          <circle cx="59" cy="94" r="5" fill="#475569" stroke="#1e293b" strokeWidth="1.5" />
          <circle cx="50" cy="42" r="22" fill="#94a3b8" stroke="#334155" strokeWidth="2" />
          <rect x="34" y="34" width="32" height="9" rx="3.5" fill="#1e293b" />
          <circle cx="43" cy="38.5" r="2.5" fill="#60a5fa" className="animate-pulse" />
          <circle cx="57" cy="38.5" r="2.5" fill="#60a5fa" className="animate-pulse" />
          <rect x="42" y="46" width="1.5" height="7" fill="#475569" />
          <rect x="47" y="46" width="1.5" height="7" fill="#475569" />
          <rect x="52" y="46" width="1.5" height="7" fill="#475569" />
          <rect x="57" y="46" width="1.5" height="7" fill="#475569" />
        </svg>
      );
    }

    if (cls === 'mage') {
      return (
        <svg viewBox="0 0 100 110" className="w-24 h-24 sm:w-28 sm:h-28 drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
          <rect x="70" y="32" width="3.5" height="55" rx="1" fill="#78350f" />
          <circle cx="72" cy="27" r="5.5" fill="#22d3ee" className="animate-pulse" />
          <circle cx="50" cy="76" r="18" fill="#6b21a8" stroke="#3b0764" strokeWidth="1.8" />
          <circle cx="44" cy="74" r="1.8" fill="#facc15" />
          <circle cx="54" cy="80" r="1.8" fill="#facc15" />
          <circle cx="48" cy="84" r="1.2" fill="#facc15" />
          <circle cx="41" cy="94" r="5" fill="#475569" stroke="#1e293b" strokeWidth="1.5" />
          <circle cx="59" cy="94" r="5" fill="#475569" stroke="#1e293b" strokeWidth="1.5" />
          <rect x="22" y="43" width="56" height="4.5" rx="2" fill="#581c87" stroke="#3b0764" strokeWidth="1.5" />
          <path d="M 30 43 L 70 43 L 50 12 Z" fill="#581c87" stroke="#3b0764" strokeWidth="1.5" />
          <rect x="31.5" y="39" width="37" height="4" fill="#eab308" />
          <circle cx="43" cy="53" r="2.5" fill="#c084fc" className="animate-pulse" />
          <circle cx="57" cy="53" r="2.5" fill="#c084fc" className="animate-pulse" />
        </svg>
      );
    }

    return (
      <svg viewBox="0 0 100 110" className="w-24 h-24 sm:w-28 sm:h-28 drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
        <rect x="22" y="65" width="2.5" height="6" fill="#78350f" />
        <rect x="21" y="71" width="4.5" height="12" fill="#94a3b8" stroke="#334155" strokeWidth="0.5" />
        <rect x="75.5" y="65" width="2.5" height="6" fill="#78350f" />
        <rect x="74.5" y="71" width="4.5" height="12" fill="#94a3b8" stroke="#334155" strokeWidth="0.5" />
        <circle cx="50" cy="76" r="18" fill="#374151" stroke="#111827" strokeWidth="1.8" />
        <rect x="40" y="73" width="20" height="3.5" fill="#ef4444" />
        <circle cx="41" cy="94" r="5" fill="#475569" stroke="#1e293b" strokeWidth="1.5" />
        <circle cx="59" cy="94" r="5" fill="#475569" stroke="#1e293b" strokeWidth="1.5" />
        <circle cx="50" cy="42" r="21" fill="#111827" stroke="#1f2937" strokeWidth="1.8" />
        <ellipse cx="50" cy="44.5" rx="12" ry="9" fill="#ffedd5" />
        <path d="M 38 45 A 12 12 0 0 0 62 45 Z" fill="#1f2937" />
        <circle cx="44" cy="43" r="2.2" fill="#ef4444" className="animate-pulse" />
        <circle cx="56" cy="43" r="2.2" fill="#ef4444" className="animate-pulse" />
      </svg>
    );
  };

  // Helper to fetch equipped items
  const getItemInSlot = (slot: string) => {
    return inventory.find(item => item.equipped && item.slot === slot);
  };

  const getRarityBorderClass = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-slate-700 bg-slate-900/50 hover:border-slate-600';
      case 'uncommon': return 'border-emerald-500/50 bg-emerald-950/20 hover:border-emerald-400';
      case 'rare': return 'border-blue-500/50 bg-blue-950/20 hover:border-blue-400';
      case 'epic': return 'border-purple-500/50 bg-purple-950/20 hover:border-purple-400';
      case 'legendary': return 'border-amber-500/50 bg-amber-950/20 shadow-[0_0_8px_rgba(245,158,11,0.2)] hover:border-amber-400';
      default: return 'border-slate-800 bg-slate-950/40';
    }
  };

  const leftSlots = [
    { slot: 'helmet', label: language === 'vi' ? 'Mũ' : 'Helmet', icon: '🪖' },
    { slot: 'weapon', label: language === 'vi' ? 'Vũ Khí' : 'Weapon', icon: '⚔️' },
    { slot: 'gloves', label: language === 'vi' ? 'Găng Tay' : 'Gloves', icon: '🧤' }
  ];

  const rightSlots = [
    { slot: 'ring', label: language === 'vi' ? 'Nhẫn' : 'Ring', icon: '💍' },
    { slot: 'armor', label: language === 'vi' ? 'Giáp' : 'Armor', icon: '👕' },
    { slot: 'boots', label: language === 'vi' ? 'Giày' : 'Boots', icon: '🥾' }
  ];



  const renderEquippedSlot = (slot: string, placeholderIcon: string, label: string) => {
    const item = getItemInSlot(slot);
    if (item) {
      const borderClass = getRarityBorderClass(item.rarity);
      return (
        <div
          key={slot}
          onClick={() => setActiveInspectItemId(item.id)}
          className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl border-2 flex flex-col items-center justify-center relative cursor-pointer group hover:scale-[1.03] transition duration-200 select-none ${borderClass}`}
        >
          <ItemGraphic
            templateId={item.templateId}
            isCorrupted={item.isCorrupted}
            isCursed={item.isCursed}
            isIdentified={item.isIdentified}
            className="w-10 h-10 mb-1 relative z-10"
          />
          <span className="absolute bottom-0.5 right-1 text-[8px] bg-slate-950/90 border border-slate-800 text-amber-400 font-extrabold px-1 rounded">
            +{item.level}
          </span>
          {/* Tooltip Hover card */}
          <div className="hidden group-hover:block absolute bottom-full mb-2 w-32 sm:w-40 bg-slate-950 border border-slate-850 p-2 rounded-xl text-[9px] text-slate-300 z-30 shadow-2xl pointer-events-none font-sans">
            <span className="font-extrabold text-white block truncate">{getTranslatedItemName(t, item)}</span>
            <span className="text-slate-500 uppercase tracking-widest text-[7px] block mb-1 font-semibold">{item.rarity}</span>
            {Object.entries(item.stats).map(([k, v]) => (
              <div key={k} className="flex justify-between font-mono text-[8px] border-b border-slate-900 pb-0.5">
                <span className="text-slate-450">{k.toUpperCase()}</span>
                <span className="font-bold text-slate-100">+{v}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div
        key={slot}
        className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl border border-dashed border-slate-800 bg-slate-950/20 flex flex-col items-center justify-center relative select-none opacity-50"
      >
        <span className="text-lg sm:text-xl filter grayscale opacity-30">{placeholderIcon}</span>
        <span className="text-[7.5px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">{label}</span>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Sub tabs selector */}
      <div className="flex gap-1 bg-slate-950/85 p-1.5 rounded-xl border border-slate-900 mb-4 select-none shrink-0 max-w-fit">
        {([
          { id: 'stats', label: language === 'vi' ? '🛡️ Chỉ Số' : '🛡️ Stats' },
          { id: 'bag', label: language === 'vi' ? '🎒 Kho Đồ' : '🎒 Bag' },
          { id: 'guide', label: language === 'vi' ? '📖 Sổ Tay' : '📖 Bestiary' }
        ] as const).map(tab => (
          <button
            key={tab.id}
            onClick={() => setSubTab(tab.id)}
            className={`text-[10px] sm:text-xs font-bold py-2 px-4 rounded-lg cursor-pointer transition active:scale-95 ${subTab === tab.id
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/10'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Sub tab content */}
      <div className="flex-1 overflow-hidden relative">
        {subTab === 'stats' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full overflow-y-auto pr-1 pb-4 scrollbar-thin">
            {/* COLUMN 1: Character Equipment Doll & Statistics Grid */}
            <div className="space-y-4">
              {/* Gear slots around Avatar */}
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between gap-4">
                {/* Left slots */}
                <div className="flex flex-col gap-2">
                  {leftSlots.map(s => renderEquippedSlot(s.slot, s.icon, s.label))}
                </div>

                {/* Center Class Doll */}
                <div className={`flex-1 flex flex-col items-center justify-center py-2 px-3 rounded-2xl border bg-gradient-to-b relative overflow-hidden h-44 sm:h-52 ${classDetails.bgClass}`}>
                  <div className="absolute w-24 h-24 bg-white/5 rounded-full blur-xl -top-6 -left-6" />
                  <div className="absolute w-24 h-24 bg-white/5 rounded-full blur-xl -bottom-6 -right-6" />

                  <div className="relative z-10 flex items-center justify-center">
                    {renderCharacterSVG(hero.heroClass || 'knight')}
                  </div>

                  <span className="text-xs sm:text-sm font-black text-white mt-3 relative z-10 tracking-wide uppercase">
                    {hero.name || 'Hero'}
                  </span>
                  <span className="text-[9px] bg-slate-950/90 border border-slate-850 text-amber-450 font-black px-2 py-0.5 rounded-full mt-1.5 relative z-10 font-mono shadow flex items-center gap-0.5">
                    ⚔️ {calculateHeroCP(hero.level, hero.prestigePoints, inventory.filter(item => item.equipped), hero.heroClass).toLocaleString()}
                  </span>
                </div>

                {/* Right slots */}
                <div className="flex flex-col gap-2">
                  {rightSlots.map(s => renderEquippedSlot(s.slot, s.icon, s.label))}
                </div>
              </div>

              {/* Character stats display */}
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-850 pb-1.5 flex items-center gap-1.5">
                  <span>🛡️</span> {t('core_attributes')}
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {statItems.map((stat, i) => (
                    <div key={i} className="bg-slate-950/40 border border-slate-900/60 rounded-xl p-2.5 flex justify-between items-center gap-2">
                      <div className="flex-1 min-w-0 pr-1">
                        <span className="block text-[8.5px] text-slate-450 font-bold uppercase tracking-wider truncate">
                          {stat.label}
                        </span>
                        <span className="block text-[8px] text-slate-500 font-semibold mt-0.5 leading-tight">
                          {stat.desc}
                        </span>
                      </div>
                      <span className="text-[11px] sm:text-xs font-black text-blue-400 font-display shrink-0 text-right whitespace-nowrap">
                        {stat.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* COLUMN 2: Prestige Ascension Panel */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 flex flex-col justify-between h-fit md:h-full">
              <div>
                <h3 className="text-sm font-black text-white mb-2 flex items-center gap-2 border-b border-slate-850 pb-2">
                  <span className="text-yellow-500">🏆</span> {t('ascension_prestige')}
                </h3>
                <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
                  {t('prestige_desc')}
                </p>

                <div className="bg-slate-950/50 border border-slate-900 rounded-xl p-4 space-y-3 mb-6">
                  <div className="flex justify-between items-center text-xs border-b border-slate-900 pb-2">
                    <span className="text-slate-450">{t('total_prestige_runs')}</span>
                    <span className="font-bold text-yellow-500">{hero.prestigeCount}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs border-b border-slate-900 pb-2">
                    <span className="text-slate-450">{t('active_prestige_points')}</span>
                    <span className="font-bold text-yellow-400">{hero.prestigePoints}</span>
                  </div>

                  {hero.prestigePoints > 0 && (
                    <div className="pt-1 space-y-1.5">
                      <span className="block text-[8px] text-slate-500 uppercase tracking-widest font-semibold mb-1">
                        {t('active_buffs')}
                      </span>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-450">{t('damage_modifier')}</span>
                        <span className="font-bold text-emerald-400">+{prestigeDmgBonus}%</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-450">{t('hp_modifier')}</span>
                        <span className="font-bold text-emerald-400">+{prestigeHpBonus}%</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-450">{t('defense_modifier')}</span>
                        <span className="font-bold text-emerald-400">+{prestigeDefBonus}%</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                {prestigeReward > 0 ? (
                  <button
                    onClick={triggerPrestige}
                    className="w-full bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500 text-slate-950 font-extrabold py-3 px-4 rounded-xl shadow-lg shadow-yellow-500/10 active:scale-[0.98] transition-all text-[11px] tracking-wider uppercase flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>✨</span> {t('ascend_now')} (+{prestigeReward} {t('prestige_points')})
                  </button>
                ) : (
                  <div className="text-center p-3.5 bg-slate-950/80 border border-slate-900 rounded-xl">
                    <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      {t('ascension_locked')}
                    </span>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      {t('ascension_locked_desc', { stage: stagesCleared + 1 })}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {subTab === 'bag' && <BagTab />}
        {subTab === 'guide' && <GuideTab />}
      </div>
    </div>
  );
};
