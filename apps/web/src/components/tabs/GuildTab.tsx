import React, { useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { useTranslation } from '../../utils/i18n';
import { useLanguageStore } from '../../stores/languageStore';
import { calculateHeroCP } from '@idle-rpg/shared';

export const GuildTab: React.FC = () => {
  const { saveData, addLogMessage, startGuildRaid, battleMode } = useGameStore();
  const { language } = useLanguageStore();
  const { t } = useTranslation();
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [contributionPoints, setContributionPoints] = useState(120);

  if (!saveData) return null;

  const { hero, inventory } = saveData;

  const handleGoldDonation = () => {
    if (hero.gold < 500) {
      addLogMessage(t('insufficient_gold'), 'system');
      return;
    }
    // Deduct gold
    useGameStore.setState(state => {
      if (state.saveData) {
        return {
          saveData: {
            ...state.saveData,
            hero: {
              ...state.saveData.hero,
              gold: state.saveData.hero.gold - 500
            }
          }
        };
      }
      return {};
    });

    setContributionPoints(prev => prev + 25);
    setHasCheckedIn(true);
    addLogMessage(t('log_guild_gold_donate'), 'system');
  };

  const handleDiamondDonation = () => {
    if (hero.diamonds < 25) {
      addLogMessage(t('insufficient_diamonds'), 'system');
      return;
    }
    // Deduct diamonds
    useGameStore.setState(state => {
      if (state.saveData) {
        return {
          saveData: {
            ...state.saveData,
            hero: {
              ...state.saveData.hero,
              diamonds: state.saveData.hero.diamonds - 25
            }
          }
        };
      }
      return {};
    });

    setContributionPoints(prev => prev + 100);
    setHasCheckedIn(true);
    addLogMessage(t('log_guild_diamond_donate'), 'system');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full overflow-y-auto pr-1">
      {/* Left Column: Guild Details Banner */}
      <div className="md:col-span-1 bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="text-center p-4 bg-slate-950/60 border border-slate-900 rounded-xl">
            <span className="text-4xl block mb-2">🏰</span>
            <h4 className="text-md font-extrabold text-white font-display">Vanguard Order</h4>
            <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">{t('guild_level')} 4</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between border-b border-slate-850 pb-1.5 text-slate-400">
              <span>{t('guild_leader')}</span>
              <span className="font-semibold text-white">LordVanguard</span>
            </div>
            <div className="flex justify-between border-b border-slate-850 pb-1.5 text-slate-400">
              <span>{t('guild_members')}</span>
              <span className="font-semibold text-white">24 / 30</span>
            </div>
            <div className="flex justify-between border-b border-slate-850 pb-1.5 text-slate-400">
              <span>{t('guild_contrib')}</span>
              <span className="font-semibold text-blue-400">{contributionPoints} GP</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>{t('guild_rank')}</span>
              <span className="font-semibold text-yellow-500">Gold Tier (Rank #18)</span>
            </div>
          </div>
        </div>

        <div className="mt-5 space-y-2 flex-1">
          <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2 border-t border-slate-850/80 pt-3">
            👥 {language === 'vi' ? 'THÀNH VIÊN ĐỘI RAID' : 'RAID TEAM MEMBERS'}
          </span>
          <div className="space-y-1.5 overflow-y-auto max-h-[160px] pr-1 scrollbar-none">
            {/* You */}
            <div className="flex justify-between items-center bg-slate-950/40 border border-slate-900/60 p-2 rounded-lg text-[11px]">
              <div className="flex flex-col">
                <span className="font-extrabold text-blue-400 block truncate max-w-[100px]">{hero.name || 'Hero'} (Bạn)</span>
                <span className="text-[9px] text-slate-500">{hero.heroClass === 'knight' ? '🛡️ Hiệp Sĩ' : hero.heroClass === 'mage' ? '🔮 Pháp Sư' : '🗡️ Sát Thủ'} • Lv.{hero.level}</span>
              </div>
              <span className="font-extrabold text-amber-450 font-mono">
                ⚔️{calculateHeroCP(hero.level, hero.prestigePoints, inventory.filter(item => item.equipped), hero.heroClass).toLocaleString()}
              </span>
            </div>

            {/* Vanguard Order */}
            <div className="flex justify-between items-center bg-slate-950/20 border border-slate-900/30 p-2 rounded-lg text-[11px]">
              <div className="flex flex-col">
                <span className="font-extrabold text-slate-300 block">Vanguard Order</span>
                <span className="text-[9px] text-slate-500">🛡️ Hiệp Sĩ • Lv.{Math.max(1, hero.level - 2)}</span>
              </div>
              <span className="font-extrabold text-slate-400 font-mono">
                ⚔️{calculateHeroCP(Math.max(1, hero.level - 2), 0, [], 'knight').toLocaleString()}
              </span>
            </div>

            {/* Spellweaver */}
            <div className="flex justify-between items-center bg-slate-950/20 border border-slate-900/30 p-2 rounded-lg text-[11px]">
              <div className="flex flex-col">
                <span className="font-extrabold text-slate-300 block">Spellweaver</span>
                <span className="text-[9px] text-slate-500">🔮 Pháp Sư • Lv.{hero.level + 1}</span>
              </div>
              <span className="font-extrabold text-slate-400 font-mono">
                ⚔️{calculateHeroCP(hero.level + 1, 0, [], 'mage').toLocaleString()}
              </span>
            </div>

            {/* Silent Blade */}
            <div className="flex justify-between items-center bg-slate-950/20 border border-slate-900/30 p-2 rounded-lg text-[11px]">
              <div className="flex flex-col">
                <span className="font-extrabold text-slate-300 block">Silent Blade</span>
                <span className="text-[9px] text-slate-500">🗡️ Sát Thủ • Lv.{Math.max(1, hero.level - 1)}</span>
              </div>
              <span className="font-extrabold text-slate-400 font-mono">
                ⚔️{calculateHeroCP(Math.max(1, hero.level - 1), 0, [], 'assassin').toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <div className="w-full bg-slate-950/80 border border-slate-900 p-3 rounded-lg text-[10px] text-slate-500 leading-relaxed text-center">
            {t('guild_announcement')}
          </div>
        </div>
      </div>

      {/* Center Column: Check-in / Contribution */}
      <div className="md:col-span-1 bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 flex flex-col justify-between">
        <div>
          <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-1.5 font-display">
            🙌 {t('guild_checkin')}
          </h4>
          <p className="text-xs text-slate-400 leading-relaxed mb-4">
            {t('guild_desc')}
          </p>

          <div className="space-y-3">
            {/* Gold Check-In */}
            <button
              onClick={handleGoldDonation}
              disabled={hasCheckedIn || hero.gold < 500}
              className="w-full p-3 bg-slate-950/50 hover:bg-slate-950 border border-slate-850 hover:border-slate-700 rounded-xl transition flex justify-between items-center text-xs disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            >
              <div className="text-left">
                <span className="font-bold text-white block">{t('guild_gold_donate')}</span>
                <span className="text-[10px] text-slate-500">{t('guild_yield_xp', { xp: 25 })}</span>
              </div>
              <span className="bg-slate-900 border border-slate-800 text-yellow-400 font-bold px-2 py-1 rounded">
                500 Gold 💰
              </span>
            </button>

            {/* Diamond Check-In */}
            <button
              onClick={handleDiamondDonation}
              disabled={hasCheckedIn || hero.diamonds < 25}
              className="w-full p-3 bg-slate-950/50 hover:bg-slate-950 border border-slate-850 hover:border-slate-700 rounded-xl transition flex justify-between items-center text-xs disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            >
              <div className="text-left">
                <span className="font-bold text-white block">{t('guild_diamond_donate')}</span>
                <span className="text-[10px] text-slate-500">{t('guild_yield_xp', { xp: 100 })}</span>
              </div>
              <span className="bg-slate-900 border border-slate-800 text-blue-400 font-bold px-2 py-1 rounded">
                25 Gems 💎
              </span>
            </button>
          </div>
        </div>

        {hasCheckedIn ? (
          <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-center rounded-xl text-xs font-bold uppercase tracking-wider font-display">
            ✔️ {t('guild_donated_today')}
          </div>
        ) : (
          <div className="mt-4 text-[10px] text-slate-500 text-center italic">
            {t('guild_donation_limit')}
          </div>
        )}
      </div>

      {/* Right Column: Guild Raid Boss */}
      <div className="md:col-span-1 bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 flex flex-col justify-between">
        <div>
          <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-2.5 flex items-center gap-1.5 font-display">
            👹 {t('guild_raid_boss')}
          </h4>
          <span className="inline-flex px-2 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded text-[9px] font-extrabold uppercase tracking-widest mb-3 font-display">
            {t('guild_upcoming')}
          </span>

          <div className="bg-slate-950/60 border border-slate-900 rounded-xl p-4 text-center">
            <span className="text-3xl block animate-pulse">🐉</span>
            <span className="text-xs font-extrabold text-white block mt-2">
              Void Behemoth
            </span>
            <span className="text-[10px] text-slate-500 block mb-3">
              Boss HP: 25,000,000
            </span>

            {/* Timer Countdown Display */}
            <div className="grid grid-cols-3 gap-1 max-w-[180px] mx-auto bg-slate-900 border border-slate-850 p-1.5 rounded-lg text-center">
              <div>
                <span className="font-extrabold text-xs text-white font-display block">04</span>
                <span className="text-[8px] text-slate-500 uppercase">{t('hours')}</span>
              </div>
              <div className="border-x border-slate-850">
                <span className="font-extrabold text-xs text-white font-display block">12</span>
                <span className="text-[8px] text-slate-500 uppercase">{t('mins')}</span>
              </div>
              <div>
                <span className="font-extrabold text-xs text-white font-display block">35</span>
                <span className="text-[8px] text-slate-500 uppercase">{t('secs')}</span>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            if (battleMode === 'guild_boss') {
              addLogMessage(language === 'vi' ? 'Đang trong trận đấu Raid Boss!' : 'Already challenging Raid Boss!', 'system');
              return;
            }
            startGuildRaid();
          }}
          className={`w-full mt-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold py-2.5 px-4 rounded-xl active:scale-[0.97] transition uppercase tracking-wider font-display cursor-pointer flex justify-center items-center shadow-lg border border-red-500/25 ${
            battleMode === 'guild_boss' ? 'opacity-50 pointer-events-none' : ''
          }`}
        >
          ⚔️ {battleMode === 'guild_boss' ? (language === 'vi' ? 'ĐANG CHIẾN BOSS' : 'BATTLING BOSS') : (language === 'vi' ? 'THÁCH ĐẤU BOSS' : 'CHALLENGE BOSS')}
        </button>
      </div>
    </div>
  );
};
