import React, { useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { useTranslation, getTranslatedQuestTitle, getTranslatedQuestDesc } from '../../utils/i18n';
import { GAME_ICONS } from '@idle-rpg/shared';

export const QuestTab: React.FC = () => {
  const { saveData, claimQuestReward } = useGameStore();
  const { t, language } = useTranslation();
  const [activeSubTab, setActiveSubTab] = useState<'all' | 'newbie_achieve' | 'daily_weekly' | 'event'>('all');

  if (!saveData) return null;

  const { quests = [] } = saveData;

  // Filter player quests based on active subtab
  const filteredQuests = quests.filter((q) => {
    // Legacy quests that don't have a type should fall back to newbie
    const type = q.type || 'newbie';

    if (activeSubTab === 'newbie_achieve') {
      return type === 'newbie' || type === 'achievement';
    }
    if (activeSubTab === 'daily_weekly') {
      return type === 'daily' || type === 'weekly';
    }
    if (activeSubTab === 'event') {
      return type === 'event';
    }
    return true; // 'all'
  });

  // Helper to render type badge
  const renderTypeBadge = (type?: string) => {
    const tVal = type || 'newbie';
    let style = '';
    let label = '';

    switch (tVal) {
      case 'newbie':
        style = 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
        label = language === 'vi' ? 'Tân Thủ' : 'Newbie';
        break;
      case 'daily':
        style = 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400';
        label = language === 'vi' ? 'Hàng Ngày' : 'Daily';
        break;
      case 'weekly':
        style = 'bg-blue-500/10 border-blue-500/30 text-blue-400';
        label = language === 'vi' ? 'Hàng Tuần' : 'Weekly';
        break;
      case 'event':
        style = 'bg-pink-500/10 border-pink-500/30 text-pink-400';
        label = language === 'vi' ? 'Sự Kiện' : 'Event';
        break;
      case 'achievement':
        style = 'bg-purple-500/10 border-purple-500/30 text-purple-400';
        label = language === 'vi' ? 'Thành Tựu' : 'Achievement';
        break;
      default:
        style = 'bg-slate-500/10 border-slate-500/30 text-slate-400';
        label = tVal;
    }

    return (
      <span className={`px-2 py-0.5 text-[8px] font-extrabold uppercase rounded border tracking-wider font-mono ${style}`}>
        {label}
      </span>
    );
  };

  const formatTimestamp = (ts?: number) => {
    if (!ts) return '';
    const date = new Date(ts);
    const time = date.toTimeString().split(' ')[0].substring(0, 5);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${time} ${day}/${month}/${year}`;
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/60  overflow-hidden">
      {/* Title */}
      {/* <div className="flex justify-between items-center mb-4 border-b border-slate-850 pb-2 flex-wrap gap-2">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          {t('active_bounties')}
        </h3>
        <span className="text-xs font-semibold px-2.5 py-1 bg-slate-950/80 border border-slate-800 rounded-lg text-slate-400">
          {language === 'vi' ? 'Chưa nhận' : 'Unclaimed'}: {quests.filter(q => !q.claimed).length}
        </span>
      </div> */}

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto scrollbar-none mb-4 pb-1 border-b border-slate-850/40">
        {([
          { value: 'all', vi: 'Tất cả', en: 'All' },
          { value: 'newbie_achieve', vi: 'Tân thủ & Thành tựu', en: 'Newbie & Achievements' },
          { value: 'daily_weekly', vi: 'Hàng ngày & Hàng tuần', en: 'Daily & Weekly' },
          { value: 'event', vi: 'Sự kiện', en: 'Events' }
        ] as { value: typeof activeSubTab; vi: string; en: string }[]).map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveSubTab(tab.value)}
            className={`px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider rounded-lg transition whitespace-nowrap cursor-pointer border ${activeSubTab === tab.value
              ? 'bg-indigo-600/15 border-indigo-500/30 text-indigo-300 shadow shadow-indigo-600/5'
              : 'bg-slate-950/20 border-slate-850/60 hover:bg-slate-900/40 text-slate-450 hover:text-slate-300'
              }`}
          >
            {language === 'vi' ? tab.vi : tab.en}
          </button>
        ))}
      </div>

      {/* Quest Cards List */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {filteredQuests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <span className="text-3xl mb-2">🕊️</span>
            <span className="text-xs uppercase tracking-wider font-semibold">
              {language === 'vi' ? 'Không có nhiệm vụ nào thuộc mục này' : t('no_quests')}
            </span>
          </div>
        ) : (
          (() => {
            const sortedQuests = [...filteredQuests].sort((a, b) => {
              const aClaimed = a.claimed ? 1 : 0;
              const bClaimed = b.claimed ? 1 : 0;
              if (aClaimed !== bClaimed) {
                return aClaimed - bClaimed;
              }
              const aReady = a.completed ? 1 : 0;
              const bReady = b.completed ? 1 : 0;
              if (aReady !== bReady) {
                return bReady - aReady;
              }
              return a.id.localeCompare(b.id);
            });

            return sortedQuests.map((quest) => {
              const percentage = Math.min(100, Math.floor((quest.currentCount / quest.targetCount) * 100));

              return (
                <div
                  key={quest.id}
                  className={`border rounded-xl p-4 transition-all flex flex-col sm:flex-row justify-between sm:items-center gap-4 ${quest.claimed
                    ? 'border-slate-950 bg-slate-950/20 opacity-60'
                    : quest.completed
                      ? 'border-emerald-500/30 bg-emerald-500/5 shadow-md shadow-emerald-500/5'
                      : 'border-slate-800 bg-slate-950/40'
                    }`}
                >
                  {/* Details */}
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-extrabold text-white font-display">
                        {getTranslatedQuestTitle(t, quest.id, quest.title)}
                      </span>
                      {renderTypeBadge(quest.type)}
                      {quest.completed && !quest.claimed && (
                        <span className="bg-emerald-500/20 text-emerald-400 text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider animate-pulse font-display">
                          {t('quest_ready')}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">
                      {getTranslatedQuestDesc(t, quest.id, quest.description)}
                    </p>

                    {/* Completion or Claim Date/Time */}
                    {quest.claimed && quest.claimedAt ? (
                      <div className="text-[9.5px] text-slate-500 font-bold flex items-center gap-1.5 mt-1 select-none">
                        <span>✔️</span>
                        <span>
                          {language === 'vi'
                            ? `Đã nhận quà: ${formatTimestamp(quest.claimedAt)}`
                            : `Claimed: ${formatTimestamp(quest.claimedAt)}`}
                        </span>
                      </div>
                    ) : quest.completed && quest.completedAt ? (
                      <div className="text-[9.5px] text-emerald-400/90 font-bold flex items-center gap-1.5 mt-1 select-none">
                        <span>🎉</span>
                        <span>
                          {language === 'vi'
                            ? `Hoàn thành: ${formatTimestamp(quest.completedAt)}`
                            : `Completed: ${formatTimestamp(quest.completedAt)}`}
                        </span>
                      </div>
                    ) : null}

                    {/* Progress Bar */}
                    {!quest.claimed && (
                      <div className="pt-2.5 w-full max-w-md">
                        <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold mb-1">
                          <span>{t('progress_label')}: {quest.currentCount} / {quest.targetCount}</span>
                          <span>{percentage}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-900 border border-slate-850 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${quest.completed ? 'bg-emerald-500' : 'bg-blue-500'
                              }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Dates for events */}
                    {quest.type === 'event' && quest.endDate && !quest.claimed && (
                      <div className="text-[9px] text-slate-500 font-mono">
                        ⏱️ {language === 'vi' ? 'Hạn cuối:' : 'Expires:'} {new Date(quest.endDate).toLocaleString()}
                      </div>
                    )}
                  </div>

                  {/* Rewards & Action */}
                  <div className="flex sm:flex-col items-end gap-3 justify-between sm:justify-center border-t sm:border-t-0 border-slate-900 pt-3 sm:pt-0">
                    {/* Reward Tags */}
                    {!quest.claimed && (
                      <div className="flex gap-2">
                        <div className="bg-slate-900 border border-slate-850 rounded px-2 py-1 text-[10px] font-extrabold text-yellow-400 flex items-center gap-1">
                          <span>{GAME_ICONS.GOLD}</span> {quest.rewardGold}
                        </div>
                        <div className="bg-slate-900 border border-slate-850 rounded px-2 py-1 text-[10px] font-extrabold text-blue-400 flex items-center gap-1">
                          <span>{GAME_ICONS.DIAMOND}</span> {quest.rewardDiamonds}
                        </div>
                      </div>
                    )}

                    {/* Button */}
                    {quest.claimed ? (
                      <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5 py-1 px-3 bg-slate-950 border border-slate-900 rounded-lg">
                        ✔️ {t('quest_claimed')}
                      </span>
                    ) : quest.completed ? (
                      <button
                        onClick={() => claimQuestReward(quest.id)}
                        className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold py-2 px-4 rounded-xl border border-emerald-400/20 shadow shadow-emerald-500/10 active:scale-[0.98] transition cursor-pointer font-display"
                      >
                        🎁 {t('claim_btn')}
                      </button>
                    ) : (
                      <button
                        disabled
                        className="bg-slate-950 border border-slate-900 text-slate-650 text-xs font-bold py-2 px-4 rounded-xl cursor-not-allowed font-display"
                      >
                        🔒 {t('quest_in_progress')}
                      </button>
                    )}
                  </div>
                </div>
              );
            });
          })()
        )}
      </div>
    </div>
  );
};

