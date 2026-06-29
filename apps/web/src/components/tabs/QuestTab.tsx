import React from 'react';
import { useGameStore } from '../../stores/gameStore';
import { useTranslation, getTranslatedQuestTitle, getTranslatedQuestDesc } from '../../utils/i18n';

export const QuestTab: React.FC = () => {
  const { saveData, claimQuestReward } = useGameStore();
  const { t } = useTranslation();

  if (!saveData) return null;

  const { quests } = saveData;

  return (
    <div className="flex flex-col h-full bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 overflow-hidden">
      <div className="flex justify-between items-center mb-4 border-b border-slate-850 pb-2">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          📜 {t('active_bounties')}
        </h3>
        <span className="text-xs font-semibold px-2.5 py-1 bg-slate-950/80 border border-slate-800 rounded-lg text-slate-400">
          Active: {quests.filter(q => !q.claimed).length}
        </span>
      </div>

      {/* Quest Cards List */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {quests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <span className="text-3xl mb-2">🕊️</span>
            <span className="text-xs uppercase tracking-wider font-semibold">{t('no_quests')}</span>
          </div>
        ) : (
          quests.map((quest) => {
            const percentage = Math.min(100, Math.floor((quest.currentCount / quest.targetCount) * 100));
            
            return (
              <div
                key={quest.id}
                className={`border rounded-xl p-4 transition-all flex flex-col sm:flex-row justify-between sm:items-center gap-4 ${
                  quest.claimed
                    ? 'border-slate-950 bg-slate-950/20 opacity-60'
                    : quest.completed
                    ? 'border-emerald-500/30 bg-emerald-500/5 shadow-md shadow-emerald-500/5'
                    : 'border-slate-800 bg-slate-950/40'
                }`}
              >
                {/* Details */}
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-white font-display">
                      {getTranslatedQuestTitle(t, quest.id, quest.title)}
                    </span>
                    {quest.completed && !quest.claimed && (
                      <span className="bg-emerald-500/20 text-emerald-400 text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider animate-pulse font-display">
                        {t('quest_ready')}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">
                    {getTranslatedQuestDesc(t, quest.id, quest.description)}
                  </p>
                  
                  {/* Progress Bar */}
                  {!quest.claimed && (
                    <div className="pt-2 w-full max-w-md">
                      <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold mb-1">
                        <span>{t('progress_label')}: {quest.currentCount} / {quest.targetCount}</span>
                        <span>{percentage}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-900 border border-slate-850 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            quest.completed ? 'bg-emerald-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Rewards & Action */}
                <div className="flex sm:flex-col items-end gap-3 justify-between sm:justify-center border-t sm:border-t-0 border-slate-900 pt-3 sm:pt-0">
                  {/* Reward Tags */}
                  {!quest.claimed && (
                    <div className="flex gap-2">
                      <div className="bg-slate-900 border border-slate-850 rounded px-2 py-1 text-[10px] font-extrabold text-yellow-400 flex items-center gap-1">
                        <span>💰</span> {quest.rewardGold}
                      </div>
                      <div className="bg-slate-900 border border-slate-850 rounded px-2 py-1 text-[10px] font-extrabold text-blue-400 flex items-center gap-1">
                        <span>💎</span> {quest.rewardDiamonds}
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
                      className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold py-2 px-4 rounded-xl border border-emerald-400/20 shadow shadow-emerald-500/10 active:scale-[0.98] transition cursor-pointer"
                    >
                      🎁 {t('claim_btn')}
                    </button>
                  ) : (
                    <button
                      disabled
                      className="bg-slate-950 border border-slate-900 text-slate-600 text-xs font-bold py-2 px-4 rounded-xl cursor-not-allowed"
                    >
                      🔒 {t('quest_in_progress')}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
