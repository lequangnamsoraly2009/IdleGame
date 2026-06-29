import React from 'react';
import { useGameStore } from '../../stores/gameStore';
import { calculatePrestigePoints } from '@idle-rpg/shared';
import { useTranslation } from '../../utils/i18n';

export const HeroTab: React.FC = () => {
  const { saveData, triggerPrestige } = useGameStore();
  const { t } = useTranslation();
  
  if (!saveData) return null;

  const { hero, stagesCleared } = saveData;
  const prestigeReward = calculatePrestigePoints(stagesCleared);

  // Prestige multiplier math
  const prestigeDmgBonus = hero.prestigePoints * 2; // +2% per point
  const prestigeHpBonus = hero.prestigePoints * 2;  // +2% per point
  const prestigeDefBonus = hero.prestigePoints * 1;  // +1% per point

  const statItems = [
    { label: t('max_health'), value: hero.currentStats.maxHp, desc: `${t('stat_base')}: ${hero.baseStats.maxHp}` },
    { label: t('attack_power'), value: hero.currentStats.attack, desc: `${t('stat_base')}: ${hero.baseStats.attack}` },
    { label: t('defense_rating'), value: hero.currentStats.defense, desc: `${t('stat_base')}: ${hero.baseStats.defense}` },
    { label: t('attack_speed'), value: `${hero.currentStats.speed}%`, desc: `${t('stat_base')}: 100%` },
    { label: t('critical_rate'), value: `${Math.round(hero.currentStats.critRate * 100)}%`, desc: `${t('stat_cap')}: 85%` },
    { label: t('critical_damage'), value: `${Math.round(hero.currentStats.critDamage * 100)}%`, desc: `${t('stat_base')}: 150%` },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full overflow-y-auto pr-1">
      {/* Character Stats Card */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 flex flex-col justify-between">
        <div>
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-xl">🛡️</span> {t('core_attributes')}
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {statItems.map((stat, i) => (
              <div key={i} className="bg-slate-950/50 border border-slate-900 rounded-lg p-3">
                <span className="block text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">
                  {stat.label}
                </span>
                <span className="text-lg font-extrabold text-blue-400 font-display">
                  {stat.value}
                </span>
                <span className="block text-[10px] text-slate-500 font-medium">
                  {stat.desc}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-500/5 border border-blue-500/10 rounded-lg text-xs text-slate-400">
          {t('hero_tip')}
        </div>
      </div>

      {/* Prestige Details Card */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 flex flex-col justify-between">
        <div>
          <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
            <span className="text-xl text-yellow-500">🏆</span> {t('ascension_prestige')}
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed mb-4">
            {t('prestige_desc')}
          </p>

          <div className="bg-slate-950/50 border border-slate-900 rounded-xl p-4 space-y-3 mb-6">
            <div className="flex justify-between items-center text-sm border-b border-slate-900 pb-2">
              <span className="text-slate-400">{t('total_prestige_runs')}</span>
              <span className="font-bold text-yellow-500">{hero.prestigeCount}</span>
            </div>
            <div className="flex justify-between items-center text-sm border-b border-slate-900 pb-2">
              <span className="text-slate-400">{t('active_prestige_points')}</span>
              <span className="font-bold text-yellow-400">{hero.prestigePoints}</span>
            </div>
            
            {hero.prestigePoints > 0 && (
              <div className="pt-1 space-y-1.5">
                <span className="block text-[10px] text-slate-500 uppercase tracking-widest font-semibold mb-1">
                  {t('active_buffs')}
                </span>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">{t('damage_modifier')}</span>
                  <span className="font-semibold text-emerald-400">+{prestigeDmgBonus}%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">{t('hp_modifier')}</span>
                  <span className="font-semibold text-emerald-400">+{prestigeHpBonus}%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">{t('defense_modifier')}</span>
                  <span className="font-semibold text-emerald-400">+{prestigeDefBonus}%</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div>
          {prestigeReward > 0 ? (
            <button
              onClick={triggerPrestige}
              className="w-full bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500 text-slate-950 font-extrabold py-3 px-4 rounded-xl shadow-lg shadow-yellow-500/10 active:scale-[0.98] transition-all text-sm tracking-wider uppercase flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>✨</span> {t('ascend_now')} (+{prestigeReward} {t('prestige_points')})
            </button>
          ) : (
            <div className="text-center p-3.5 bg-slate-950/80 border border-slate-900 rounded-xl">
              <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                {t('ascension_locked')}
              </span>
              <p className="text-[11px] text-slate-500">
                {t('ascension_locked_desc', { stage: stagesCleared + 1 })}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
