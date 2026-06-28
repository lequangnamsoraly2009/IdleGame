import React from 'react';
import { useGameStore } from '../../stores/gameStore';
import { calculatePrestigePoints } from '@idle-rpg/shared';

export const HeroTab: React.FC = () => {
  const { saveData, triggerPrestige } = useGameStore();
  
  if (!saveData) return null;

  const { hero, stagesCleared } = saveData;
  const prestigeReward = calculatePrestigePoints(stagesCleared);

  // Prestige multiplier math
  const prestigeDmgBonus = hero.prestigePoints * 2; // +2% per point
  const prestigeHpBonus = hero.prestigePoints * 2;  // +2% per point
  const prestigeDefBonus = hero.prestigePoints * 1;  // +1% per point

  const statItems = [
    { label: '💖 Max Health', value: hero.currentStats.maxHp, desc: `Base: ${hero.baseStats.maxHp}` },
    { label: '⚔️ Attack Power', value: hero.currentStats.attack, desc: `Base: ${hero.baseStats.attack}` },
    { label: '🛡️ Defense Rating', value: hero.currentStats.defense, desc: `Base: ${hero.baseStats.defense}` },
    { label: '⚡ Attack Speed', value: `${hero.currentStats.speed}%`, desc: 'Base: 100%' },
    { label: '🎯 Critical Rate', value: `${Math.round(hero.currentStats.critRate * 100)}%`, desc: 'Cap: 85%' },
    { label: '💥 Critical Damage', value: `${Math.round(hero.currentStats.critDamage * 100)}%`, desc: 'Base: 150%' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full overflow-y-auto pr-1">
      {/* Character Stats Card */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 flex flex-col justify-between">
        <div>
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-xl">🛡️</span> Core Attributes
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
          💡 Equipment, prestige bonuses, and levels are calculated automatically. Upgrade equipment or summon rare weapons to boost stats!
        </div>
      </div>

      {/* Prestige Details Card */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 flex flex-col justify-between">
        <div>
          <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
            <span className="text-xl text-yellow-500">🏆</span> Ascension & Prestige
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed mb-4">
            Perform an Ascension to reset your character level, gold, and stage progress back to 1. In return, you will keep all inventory items and receive **Prestige Points** which grant permanent multiplicative bonuses.
          </p>

          <div className="bg-slate-950/50 border border-slate-900 rounded-xl p-4 space-y-3 mb-6">
            <div className="flex justify-between items-center text-sm border-b border-slate-900 pb-2">
              <span className="text-slate-400">Total Prestige Runs</span>
              <span className="font-bold text-yellow-500">{hero.prestigeCount}</span>
            </div>
            <div className="flex justify-between items-center text-sm border-b border-slate-900 pb-2">
              <span className="text-slate-400">Active Prestige Points</span>
              <span className="font-bold text-yellow-400">{hero.prestigePoints}</span>
            </div>
            
            {hero.prestigePoints > 0 && (
              <div className="pt-1 space-y-1.5">
                <span className="block text-[10px] text-slate-500 uppercase tracking-widest font-semibold mb-1">
                  Active Buffs
                </span>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">⚔️ Damage Modifier</span>
                  <span className="font-semibold text-emerald-400">+{prestigeDmgBonus}%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">💖 HP Modifier</span>
                  <span className="font-semibold text-emerald-400">+{prestigeHpBonus}%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">🛡️ Defense Modifier</span>
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
              className="w-full bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500 text-slate-950 font-extrabold py-3 px-4 rounded-xl shadow-lg shadow-yellow-500/10 active:scale-[0.98] transition-all text-sm tracking-wider uppercase flex items-center justify-center gap-2"
            >
              <span>✨</span> Ascend Now (+{prestigeReward} Points)
            </button>
          ) : (
            <div className="text-center p-3.5 bg-slate-950/80 border border-slate-900 rounded-xl">
              <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Ascension Locked
              </span>
              <p className="text-[11px] text-slate-500">
                You must clear stage 10 to unlock prestige benefits. (Current: Stage {stagesCleared + 1})
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
