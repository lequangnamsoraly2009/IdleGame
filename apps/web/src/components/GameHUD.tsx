import React, { useState } from 'react';
import { useGameStore } from '../stores/gameStore';
import { PixiGame } from './PixiGame';
import { HeroTab } from './tabs/HeroTab';
import { BagTab } from './tabs/BagTab';
import { QuestTab } from './tabs/QuestTab';
import { GuildTab } from './tabs/GuildTab';
import { ShopTab } from './tabs/ShopTab';
import { SummonTab } from './tabs/SummonTab';

export const GameHUD: React.FC = () => {
  const { 
    saveData, 
    activeTab, 
    setActiveTab, 
    signOut,
    heroHp, 
    heroMaxHp, 
    monsterHp, 
    monsterMaxHp,
    combatLogs,
    onStageChange
  } = useGameStore();

  const [logFilter, setLogFilter] = useState<'all' | 'combat' | 'loot'>('all');

  if (!saveData) return null;

  const { hero, activeStage, stagesCleared } = saveData;

  // Filter combat logs
  const filteredLogs = combatLogs.filter(log => {
    if (logFilter === 'all') return true;
    return log.category === logFilter;
  });

  const getRarityTextClass = (rarity: string) => {
    switch (rarity) {
      case 'uncommon': return 'text-emerald-400 font-semibold';
      case 'rare': return 'text-blue-400 font-semibold';
      case 'epic': return 'text-purple-400 font-bold';
      case 'legendary': return 'text-amber-500 font-extrabold neon-text-gold';
      default: return 'text-slate-300';
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'hero': return <HeroTab />;
      case 'bag': return <BagTab />;
      case 'quest': return <QuestTab />;
      case 'guild': return <GuildTab />;
      case 'shop': return <ShopTab />;
      case 'summon': return <SummonTab />;
      default: return <HeroTab />;
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col justify-between bg-slate-950 text-slate-100 overflow-hidden select-none relative p-3">
      {/* Background glow overlay */}
      <div className="bg-radial-glow" />

      {/* TOP HEADER */}
      <header className="glass-panel rounded-2xl py-3 px-6 flex justify-between items-center relative z-10 border-slate-800 shadow-xl gap-4">
        {/* Profile/Ranks */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center font-bold text-xl shadow">
            🛡️
          </div>
          <div>
            <h2 className="text-sm font-extrabold tracking-tight font-display text-white">Hero Level {hero.level}</h2>
            <div className="w-24 h-1.5 bg-slate-900 border border-slate-800 rounded-full mt-1 overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${Math.min(100, Math.floor((hero.exp / hero.maxExp) * 100))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Stage Selector */}
        <div className="flex items-center bg-slate-950/70 border border-slate-850/80 rounded-xl px-4 py-1.5 shadow-inner">
          <button
            onClick={() => onStageChange(Math.max(1, activeStage - 1))}
            disabled={activeStage <= 1}
            className="text-lg font-bold text-slate-500 hover:text-white px-2 py-0.5 cursor-pointer disabled:opacity-20 disabled:pointer-events-none"
          >
            ◀
          </button>
          
          <div className="text-center px-4 min-w-[120px]">
            <span className="block text-[8px] text-slate-500 font-extrabold uppercase tracking-wider">Battle Stage</span>
            <span className="text-xs font-bold text-blue-400">Stage {activeStage}</span>
          </div>

          <button
            onClick={() => onStageChange(activeStage + 1)}
            disabled={activeStage > stagesCleared}
            className="text-lg font-bold text-slate-500 hover:text-white px-2 py-0.5 cursor-pointer disabled:opacity-20 disabled:pointer-events-none"
            title={activeStage > stagesCleared ? 'Clear current stage first' : ''}
          >
            ▶
          </button>
        </div>

        {/* Currency HUD & Signout */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
            {/* Gold */}
            <div className="flex items-center gap-1.5 bg-slate-950/60 border border-slate-900 px-3 py-1.5 rounded-lg shadow-inner">
              <span className="text-xs">🪙</span>
              <span className="text-xs font-black text-yellow-400 font-display">{hero.gold.toLocaleString()}</span>
            </div>
            {/* Diamonds */}
            <div className="flex items-center gap-1.5 bg-slate-950/60 border border-slate-900 px-3 py-1.5 rounded-lg shadow-inner">
              <span className="text-xs">💎</span>
              <span className="text-xs font-black text-blue-400 font-display">{hero.diamonds}</span>
            </div>
            {/* Prestige Points */}
            {hero.prestigePoints > 0 && (
              <div className="flex items-center gap-1.5 bg-yellow-500/5 border border-yellow-500/20 px-3 py-1.5 rounded-lg shadow-inner" title="Prestige Points">
                <span className="text-xs">✨</span>
                <span className="text-xs font-black text-yellow-500 font-display">{hero.prestigePoints}</span>
              </div>
            )}
          </div>

          <button
            onClick={signOut}
            className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 hover:text-red-300 font-bold px-3.5 py-1.5 rounded-xl text-xs active:scale-[0.96] transition cursor-pointer"
          >
            Exit
          </button>
        </div>
      </header>

      {/* CORE LAYOUT WORKSPACE */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-3 my-3 overflow-hidden relative z-10">
        
        {/* COLUMN 1: Live Combat Log */}
        <section className="lg:col-span-1 glass-panel rounded-2xl p-4 flex flex-col justify-between overflow-hidden shadow-lg border-slate-800">
          <div className="flex flex-col h-full overflow-hidden">
            {/* Log Header Filter */}
            <div className="flex justify-between items-center border-b border-slate-850 pb-2 mb-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                ⚔️ Combat Feed
              </h3>
              <div className="flex gap-1.5 bg-slate-950/70 p-0.5 rounded-lg border border-slate-850">
                {(['all', 'combat', 'loot'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setLogFilter(tab)}
                    className={`text-[9px] font-bold uppercase px-2 py-0.8 rounded-md transition cursor-pointer ${
                      logFilter === tab 
                        ? 'bg-blue-600 text-white shadow shadow-blue-500/10' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable logs area */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 select-text">
              {filteredLogs.length === 0 ? (
                <div className="text-center py-12 text-[10px] text-slate-600 italic">
                  Feed is silent...
                </div>
              ) : (
                filteredLogs.map(log => (
                  <div key={log.id} className="text-[10.5px] leading-relaxed border-b border-slate-900 pb-1 flex gap-2">
                    <span className="text-slate-600 shrink-0 select-none">[{log.time}]</span>
                    <span className={
                      log.category === 'loot' 
                        ? getRarityTextClass(log.text) 
                        : log.category === 'combat' 
                        ? 'text-red-400/90' 
                        : 'text-blue-400/90'
                    }>
                      {log.text}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* COLUMN 2 & 3: Game Scene Screen & Life indicators */}
        <section className="lg:col-span-2 flex flex-col gap-3 overflow-hidden">
          
          {/* Pixi Canvas Viewport Container */}
          <div className="flex-1 relative min-h-[300px]">
            <PixiGame />
          </div>

          {/* Health Indicators Console */}
          <div className="glass-panel rounded-2xl p-4 border-slate-800 shadow-lg grid grid-cols-2 gap-4">
            
            {/* Hero Health */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-emerald-400 flex items-center gap-1">🛡️ Hero HP</span>
                <span className="font-extrabold text-[11px] text-emerald-300 font-display">
                  {heroHp} / {heroMaxHp}
                </span>
              </div>
              <div className="h-2.5 bg-slate-900 border border-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-200"
                  style={{ width: `${Math.min(100, Math.max(0, Math.floor((heroHp / heroMaxHp) * 100)))}%` }}
                />
              </div>
            </div>

            {/* Monster Health */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-red-400 flex items-center gap-1">👹 Monster HP</span>
                <span className="font-extrabold text-[11px] text-red-300 font-display">
                  {monsterHp} / {monsterMaxHp}
                </span>
              </div>
              <div className="h-2.5 bg-slate-900 border border-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-red-500 transition-all duration-200"
                  style={{ width: `${Math.min(100, Math.max(0, Math.floor((monsterHp / monsterMaxHp) * 100)))}%` }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* COLUMN 4: Active Quest Tracker Sidebar */}
        <section className="lg:col-span-1 glass-panel rounded-2xl p-4 flex flex-col overflow-hidden shadow-lg border-slate-800">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-850 pb-2 flex justify-between">
            <span>📜 Active Bounties</span>
            <span className="text-[10px] text-blue-500 normal-case">Right sidebar</span>
          </h3>

          <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
            {saveData.quests.filter(q => !q.claimed).length === 0 ? (
              <div className="text-center py-12 text-[10px] text-slate-600 italic">
                No active quest bounties.
              </div>
            ) : (
              saveData.quests
                .filter(q => !q.claimed)
                .map(q => {
                  const percentage = Math.min(100, Math.floor((q.currentCount / q.targetCount) * 100));
                  return (
                    <div key={q.id} className="p-2.5 bg-slate-950/40 border border-slate-900 rounded-xl space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-200 block truncate max-w-[130px] font-display">
                          {q.title}
                        </span>
                        {q.completed && (
                          <span className="bg-emerald-500/10 text-emerald-400 text-[8px] px-1 py-0.2 rounded font-extrabold uppercase animate-pulse">
                            Claim!
                          </span>
                        )}
                      </div>
                      
                      <div className="flex justify-between items-center text-[9px] text-slate-500 font-medium">
                        <span>Progress: {q.currentCount} / {q.targetCount}</span>
                        <span>{percentage}%</span>
                      </div>
                      <div className="h-1 bg-slate-900 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-350 ${q.completed ? 'bg-emerald-500' : 'bg-blue-500'}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </section>

      </main>

      {/* CORE BOTTOM NAVIGATION & PANEL CONTAINER */}
      <footer className="glass-panel rounded-2xl p-4 flex flex-col justify-between overflow-hidden relative z-10 border-slate-800 shadow-xl min-h-[300px] max-h-[350px]">
        {/* Navigation Tabs Bar */}
        <nav className="flex justify-between items-center border-b border-slate-850 pb-2 mb-4">
          <div className="flex gap-2">
            {(['hero', 'bag', 'quest', 'guild', 'shop', 'summon'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-xs font-extrabold uppercase rounded-xl border tracking-wider transition-all duration-150 cursor-pointer ${
                  activeTab === tab
                    ? 'bg-blue-600 hover:bg-blue-500 border-blue-500 text-white shadow shadow-blue-500/20'
                    : 'bg-slate-950/60 hover:bg-slate-900 border-slate-850 text-slate-400 hover:text-white'
                }`}
              >
                {tab === 'hero' ? '🛡️ Hero' : tab === 'bag' ? '🎒 Bag' : tab === 'quest' ? '📜 Quest' : tab === 'guild' ? '🏰 Guild' : tab === 'shop' ? '🪙 Shop' : '🎁 Summon'}
              </button>
            ))}
          </div>
          
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
            HUD Control Deck
          </div>
        </nav>

        {/* Selected Tab Sheet Content */}
        <div className="flex-1 overflow-hidden relative">
          {renderTabContent()}
        </div>
      </footer>
    </div>
  );
};
