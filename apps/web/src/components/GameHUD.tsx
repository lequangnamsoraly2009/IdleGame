import React, { useState } from 'react';
import { useGameStore } from '../stores/gameStore';
import { PixiGame } from './PixiGame';
import { HeroTab } from './tabs/HeroTab';
import { BagTab } from './tabs/BagTab';
import { QuestTab } from './tabs/QuestTab';
import { GuildTab } from './tabs/GuildTab';
import { ShopTab } from './tabs/ShopTab';
import { SummonTab } from './tabs/SummonTab';
import { GuideTab } from './tabs/GuideTab';
import { useTranslation, getTranslatedQuestTitle } from '../utils/i18n';
import { useLanguageStore } from '../stores/languageStore';
import { ItemInfoModal } from './ItemInfoModal';
import { SummonResultOverlay } from './SummonResultOverlay';
import { calculateHeroCP } from '@idle-rpg/shared';

const LEVEL_LOCKS = {
  hero: 1,
  quest: 3,
  shop: 5,
  guild: 10
} as const;

interface GameHUDProps {
  onNavigate: (to: string) => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({ onNavigate }) => {
  const {
    user,
    saveData,
    activeTab,
    setActiveTab,
    signOut,
    heroHp,
    heroMaxHp,
    heroRage,
    monsterHp,
    monsterMaxHp,
    monsterRage,
    combatLogs,
    battleMode,
    exitGuildRaid,
    activeInspectItemId,
    challengeBoss,
    renameHero,
    toggleAutoAdvance,
    isDead,
    potionCooldownRemaining,
    usePotion,
    toggleAutoUsePotion,
    toggleAutoDismantleCommon,
    toggleAutoDismantleUncommon,
    toggleAutoDismantleRare,
    toggleAutoBuyPotions
  } = useGameStore();

  const { t } = useTranslation();
  const { language, setLanguage } = useLanguageStore();
  const [logFilter, setLogFilter] = useState<'all' | 'combat' | 'loot'>('all');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(false);
  const [nameInput, setNameInput] = useState('');

  // Sync settings input name
  React.useEffect(() => {
    if (isSettingsOpen && saveData?.hero) {
      setNameInput(saveData.hero.name || 'Hero');
    }
  }, [isSettingsOpen, saveData?.hero?.name]);

  // Redirect to 'hero' tab if the currently active tab is locked (e.g. after prestige)
  React.useEffect(() => {
    if (saveData) {
      const currentLevel = saveData.hero.level || 1;
      const tabKey = activeTab as keyof typeof LEVEL_LOCKS;
      if (LEVEL_LOCKS[tabKey] && currentLevel < LEVEL_LOCKS[tabKey]) {
        setActiveTab('hero');
      }
    }
  }, [saveData?.hero?.level, activeTab, setActiveTab]);

  if (!saveData) return null;

  const { hero, activeStage, currentWave, autoAdvance } = saveData;

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
  const getTabIconOnly = (tab: 'home' | 'hero' | 'bag' | 'quest' | 'guild' | 'shop' | 'summon' | 'guide') => {
    switch (tab) {
      case 'home': return '🏠';
      case 'hero': return '👤';
      case 'bag': return '🎒';
      case 'quest': return '📜';
      case 'guild': return '🏰';
      case 'shop': return '💰';
      case 'summon': return '🎁';
      case 'guide': return '📖';
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
      case 'guide': return <GuideTab />;
      default: return <HeroTab />;
    }
  };
  return (
    <div className="h-screen w-screen flex flex-col justify-between bg-slate-950 text-slate-100 overflow-hidden select-none relative p-2 sm:p-3">
      {/* Background glow overlay */}
      <div className="bg-radial-glow" />

      {/* TOP HEADER */}
      <header className="glass-panel rounded-2xl py-2 px-3 sm:py-3 sm:px-6 flex justify-between items-center relative z-10 border-slate-800 shadow-xl gap-2 sm:gap-4 shrink-0">
        {/* Profile/Ranks */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center font-bold text-base sm:text-xl shadow hover:bg-blue-500/20 active:scale-95 transition cursor-pointer"
            title={language === 'vi' ? 'Cài đặt' : 'Settings'}
          >
            🛡️
          </button>
          <div>
            <div className="flex items-baseline gap-1.5 leading-none">
              <h2 className="text-[10px] sm:text-sm font-extrabold tracking-tight font-display text-white">Lv.{hero.level}</h2>
              <span className="text-[8.5px] sm:text-[10.5px] font-black text-amber-450 font-mono" title={language === 'vi' ? 'Lực chiến' : 'Combat Power'}>
                ⚔️{calculateHeroCP(hero.level, hero.prestigePoints, saveData.inventory.filter(item => item.equipped), hero.heroClass).toLocaleString()}
              </span>
            </div>
            <div className="flex flex-col gap-0.5 mt-1">
              <div className="w-16 sm:w-24 h-1 sm:h-1.5 bg-slate-900 border border-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.floor((hero.exp / hero.maxExp) * 100))}%` }}
                />
              </div>
              <span className="text-[9.5px] sm:text-[11.5px] font-extrabold text-slate-400 font-mono leading-none mt-0.5">
                EXP: {hero.exp}/{hero.maxExp}
              </span>
            </div>
          </div>
        </div>

        {/* Currency HUD & Settings Button */}
        <div className="flex items-center gap-1.5 sm:gap-4">
          <div className="flex items-center gap-1 sm:gap-3">
            {/* Gold */}
            <div className="flex items-center gap-1 bg-slate-950/60 border border-slate-900 px-1.5 py-1 sm:px-3 sm:py-1.5 rounded-lg shadow-inner animate-fade-in">
              <span className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-gradient-to-b from-yellow-400 to-amber-500 border border-yellow-300 flex items-center justify-center text-[8px] sm:text-[9.5px] text-slate-950 font-black shadow-inner select-none shrink-0 leading-none">
                G
              </span>
              <span className="text-[9px] sm:text-xs font-black text-yellow-400 font-display">{hero.gold.toLocaleString()}</span>
            </div>
            {/* Diamonds */}
            <div className="flex items-center gap-1 bg-slate-950/60 border border-slate-900 px-1.5 py-1 sm:px-3 sm:py-1.5 rounded-lg shadow-inner animate-fade-in">
              <span className="text-[10px] sm:text-xs">💎</span>
              <span className="text-[9px] sm:text-xs font-black text-blue-400 font-display">{hero.diamonds}</span>
            </div>
            {/* Prestige Points */}
            {hero.prestigePoints > 0 && (
              <div className="flex items-center gap-1 bg-yellow-500/5 border border-yellow-500/20 px-1.5 py-1 sm:px-3 sm:py-1.5 rounded-lg shadow-inner" title={t('prestige_points')}>
                <span className="text-[10px] sm:text-xs">✨</span>
                <span className="text-[9px] sm:text-xs font-black text-yellow-500 font-display">{hero.prestigePoints}</span>
              </div>
            )}
          </div>

          {/* Settings Button */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-400 hover:text-white p-1.5 sm:p-2 rounded-xl transition active:scale-[0.96] flex items-center justify-center cursor-pointer"
            title={language === 'vi' ? 'Cài đặt' : 'Settings'}
          >
            ⚙️
          </button>
        </div>
      </header>

      {/* CORE LAYOUT WORKSPACE */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-2 sm:gap-3 my-2 sm:my-3 overflow-hidden relative z-10">

        {/* COLUMN 1: Live Combat Log */}
        <section className="hidden lg:flex lg:col-span-1 glass-panel rounded-2xl p-4 flex-col justify-between overflow-hidden shadow-lg border-slate-800">
          <div className="flex flex-col h-full overflow-hidden">
            {/* Log Header Filter */}
            <div className="flex justify-between items-center border-b border-slate-850 pb-2 mb-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                ⚔️ {t('combat_feed')}
              </h3>
              <div className="flex gap-1.5 bg-slate-950/70 p-0.5 rounded-lg border border-slate-850">
                {([
                  { filter: 'all', label: t('log_filter_all') },
                  { filter: 'combat', label: t('log_filter_combat') },
                  { filter: 'loot', label: t('log_filter_loot') }
                ] as const).map(tab => (
                  <button
                    key={tab.filter}
                    onClick={() => setLogFilter(tab.filter)}
                    className={`text-[9px] font-bold uppercase px-2 py-0.8 rounded-md transition cursor-pointer ${logFilter === tab.filter
                      ? 'bg-blue-600 text-white shadow shadow-blue-500/10'
                      : 'text-slate-400 hover:text-white'
                      }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable logs area */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 select-text">
              {filteredLogs.length === 0 ? (
                <div className="text-center py-12 text-[10px] text-slate-600 italic">
                  {t('feed_silent')}
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
        <section className="lg:col-span-2 flex flex-col gap-2 sm:gap-3 overflow-hidden">

          {/* Stage & Wave Panel (Single row below header) */}
          <div className="flex justify-center shrink-0">
            <div className="flex items-center gap-2 bg-slate-950/70 border border-slate-850/80 rounded-xl px-3 py-1.5 text-xs shadow-inner">
              {/* Active Stage Name */}
              <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">{t('stage')}:</span>
                <span className="text-xs font-black text-blue-400">{activeStage}</span>
              </div>

              <div className="w-[1px] h-3.5 bg-slate-850" />

              {/* Wave Progress & Controls */}
              {battleMode === 'stage' ? (
                <>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-slate-300">
                      Wave {(currentWave || 1) <= 20 ? (currentWave || 1) : 20}/20
                    </span>
                    {/* Wave Type Badge */}
                    {(() => {
                      const waveNum = currentWave || 1;
                      if (waveNum === 20) {
                        return (
                          <span className="px-1.5 py-0.5 text-[8px] font-black uppercase bg-red-950/80 border border-red-800 text-red-400 rounded animate-pulse shadow-md">
                            Boss
                          </span>
                        );
                      } else if (waveNum === 5 || waveNum === 10 || waveNum === 15) {
                        return (
                          <span className="px-1.5 py-0.5 text-[8px] font-extrabold uppercase bg-amber-950/80 border border-amber-800 text-amber-400 rounded shadow-md">
                            Mini-Boss
                          </span>
                        );
                      }
                      return (
                        <span className="px-1.5 py-0.5 text-[8px] font-semibold uppercase bg-slate-900 border border-slate-800 text-slate-400 rounded">
                          {language === 'vi' ? 'Farm' : 'Farming'}
                        </span>
                      );
                    })()}
                  </div>

                  <div className="w-[1px] h-3.5 bg-slate-850" />

                  {/* Auto Advance Toggle Button */}
                  <button
                    onClick={() => toggleAutoAdvance()}
                    className={`px-2 py-0.8 text-[9px] font-extrabold uppercase rounded-lg border transition active:scale-95 cursor-pointer ${
                      autoAdvance !== false
                        ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400 hover:bg-emerald-950/60'
                        : 'bg-slate-900/60 border-slate-800 text-slate-450 hover:bg-slate-900'
                    }`}
                    title={language === 'vi' ? 'Tự động vượt ải' : 'Auto Advance'}
                  >
                    {autoAdvance !== false 
                      ? (language === 'vi' ? '🔄 Tự Động: BẬT' : '🔄 Auto: ON') 
                      : (language === 'vi' ? '⏹️ Tự Động: TẮT' : '⏹️ Auto: OFF')
                    }
                  </button>

                  {/* Manual Challenge Boss Button (only when auto-advance is disabled/failed and wave is 19) */}
                  {autoAdvance === false && (currentWave || 1) === 19 && (
                    <>
                      <div className="w-[1px] h-3.5 bg-slate-850" />
                      <button
                        onClick={() => challengeBoss()}
                        className="px-2.5 py-1 text-[10px] font-extrabold uppercase bg-red-950/60 border border-red-500/60 text-red-400 hover:bg-red-900 hover:border-red-400 rounded-lg animate-pulse transition active:scale-95 cursor-pointer"
                      >
                        {language === 'vi' ? '👿 Đấu Boss' : '👿 Fight Boss'}
                      </button>
                    </>
                  )}
                </>
              ) : (
                <span className="font-extrabold text-red-400 animate-pulse uppercase tracking-wider">
                  {language === 'vi' ? '🔥 BOSS BANG HỘI' : '🔥 GUILD RAID'}
                </span>
              )}
            </div>
          </div>

          {/* Pixi Canvas Viewport Container */}
          <div className="flex-1 relative min-h-[160px] sm:min-h-[220px] lg:min-h-[300px] overflow-hidden">
            <PixiGame />

            {/* Guild Raid Exit Overlay Button */}
            {battleMode === 'guild_boss' && (
              <div className="absolute top-2.5 left-2.5 z-20">
                <button
                  onClick={() => exitGuildRaid()}
                  className="bg-red-600/90 hover:bg-red-500 border border-red-500 text-white font-extrabold text-[9px] uppercase tracking-wider py-1.5 px-3.5 rounded-xl shadow-lg active:scale-95 transition cursor-pointer flex items-center gap-1"
                >
                  ⚔️ {language === 'vi' ? 'THOÁT BOSS' : 'EXIT BOSS'}
                </button>
              </div>
            )}

            {/* Mobile battle log overlay (renders only on mobile/tablet viewports) */}
            <div className="lg:hidden absolute bottom-2 left-2 right-2 h-[65px] overflow-y-auto bg-slate-950/70 backdrop-blur-sm border border-slate-900/60 rounded-xl p-2 flex flex-col justify-end pointer-events-none select-none text-[9.5px] sm:text-[10px] space-y-0.5 scrollbar-none shadow-lg">
              {combatLogs.slice(-3).map((log) => (
                <div key={log.id} className="leading-relaxed flex gap-1.5 truncate">
                  <span className="text-slate-500 shrink-0 select-none">[{log.time}]</span>
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
              ))}
            </div>
          </div>

          {/* Health Indicators Console */}
          <div className="glass-panel rounded-2xl p-3 sm:p-4 border border-slate-800/80 shadow-lg flex flex-col gap-3 shrink-0">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">

              {/* Hero Health & Rage */}
              <div className="space-y-2">
                {/* HP Row */}
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-[42px] sm:w-[70px] font-bold text-emerald-400 flex items-center gap-1 shrink-0">
                    🛡️ <span className="hidden sm:inline">{t('max_health')}</span><span className="sm:hidden">HP</span>
                  </div>
                  <div className="flex-1 h-2 bg-slate-900 border border-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-200"
                      style={{ width: `${Math.min(100, Math.max(0, Math.floor((heroHp / heroMaxHp) * 100)))}%` }}
                    />
                  </div>
                  <div className="w-[45px] sm:w-[65px] text-right font-extrabold text-[11px] text-emerald-300 font-display shrink-0 flex justify-end">
                    {heroHp}/{heroMaxHp}
                  </div>
                </div>

                {/* Rage Row */}
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-[42px] sm:w-[70px] font-bold text-orange-400 flex items-center gap-1 shrink-0">
                    ⚡ <span className="hidden sm:inline">{language === 'vi' ? 'Nộ khí' : 'Rage'}</span><span className="sm:hidden">RGE</span>
                  </div>
                  <div className="flex-1 h-1.5 bg-slate-900 border border-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-orange-500 transition-all duration-200 ${heroRage >= 100 ? 'animate-pulse' : ''}`}
                      style={{ width: `${Math.min(100, Math.max(0, Math.floor(heroRage)))}%` }}
                    />
                  </div>
                  <div className={`w-[45px] sm:w-[65px] text-right font-extrabold text-[10px] font-display shrink-0 flex justify-end ${heroRage >= 100 ? 'text-orange-400 animate-pulse font-black' : 'text-slate-500'}`}>
                    {heroRage}%
                  </div>
                </div>
              </div>

              {/* Monster Health & Rage */}
              <div className="space-y-2">
                {/* HP Row */}
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-[42px] sm:w-[70px] font-bold text-red-400 flex items-center gap-1 shrink-0">
                    👹 <span className="hidden sm:inline">{battleMode === 'guild_boss' ? 'Raid Boss' : t('quest_target_defeat')}</span><span className="sm:hidden">{battleMode === 'guild_boss' ? 'BOSS' : 'MOB'}</span>
                  </div>
                  <div className="flex-1 h-2 bg-slate-900 border border-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-500 transition-all duration-200"
                      style={{ width: `${Math.min(100, Math.max(0, Math.floor((monsterHp / monsterMaxHp) * 100)))}%` }}
                    />
                  </div>
                  <div className="w-[45px] sm:w-[65px] text-right font-extrabold text-[11px] text-red-300 font-display shrink-0 flex justify-end">
                    {monsterHp}/{monsterMaxHp}
                  </div>
                </div>

                {/* Rage Row */}
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-[42px] sm:w-[70px] font-bold text-orange-400 flex items-center gap-1 shrink-0">
                    ⚡ <span className="hidden sm:inline">{language === 'vi' ? 'Nộ khí' : 'Rage'}</span><span className="sm:hidden">RGE</span>
                  </div>
                  <div className="flex-1 h-1.5 bg-slate-900 border border-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-orange-500 transition-all duration-200 ${monsterRage >= 100 ? 'animate-pulse' : ''}`}
                      style={{ width: `${Math.min(100, Math.max(0, Math.floor(monsterRage)))}%` }}
                    />
                  </div>
                  <div className={`w-[45px] sm:w-[65px] text-right font-extrabold text-[10px] font-display shrink-0 flex justify-end ${monsterRage >= 100 ? 'text-orange-400 animate-pulse font-black' : 'text-slate-500'}`}>
                    {monsterRage}%
                  </div>
                </div>
              </div>
            </div>

            {/* Potion controls row */}
            <div className="border-t border-slate-850 pt-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => usePotion()}
                  disabled={(hero.potions ?? 0) <= 0 || potionCooldownRemaining > 0 || isDead}
                  className={`relative overflow-hidden px-3.5 py-1.5 rounded-xl font-extrabold uppercase transition select-none flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${
                    potionCooldownRemaining > 0
                      ? 'bg-slate-900 border border-slate-800 text-slate-500'
                      : (hero.potions ?? 0) > 0
                      ? (heroHp / heroMaxHp < 0.4 ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md animate-pulse border border-emerald-500' : 'bg-slate-850 hover:bg-slate-800 text-emerald-400 border border-slate-800')
                      : 'bg-slate-900 border border-slate-950 text-slate-600'
                  }`}
                >
                  {/* Cooldown progress bar overlay */}
                  {potionCooldownRemaining > 0 && (
                    <div 
                      className="absolute inset-y-0 left-0 bg-slate-800/30 transition-all duration-100 ease-linear"
                      style={{ width: `${(potionCooldownRemaining / 15) * 100}%` }}
                    />
                  )}
                  <span className="relative z-10 text-sm">🧪</span>
                  <span className="relative z-10 text-[9px] sm:text-xs">
                    {potionCooldownRemaining > 0 
                      ? (language === 'vi' ? `Hồi chiêu: ${Math.ceil(potionCooldownRemaining)}s` : `CD: ${Math.ceil(potionCooldownRemaining)}s`)
                      : language === 'vi' 
                      ? `Hồi HP (🧪 x${hero.potions ?? 5})` 
                      : `Heal HP (🧪 x${hero.potions ?? 5})`
                    }
                  </span>
                </button>
              </div>

              {/* Auto use checkbox */}
              <label className="flex items-center gap-2 cursor-pointer select-none text-[9.5px] sm:text-xs text-slate-450 hover:text-slate-200">
                <input
                  type="checkbox"
                  checked={hero.autoUsePotion ?? false}
                  onChange={() => toggleAutoUsePotion()}
                  disabled={isDead}
                  className="w-3.5 h-3.5 rounded border border-slate-750 bg-slate-950 text-purple-600 focus:ring-purple-500 focus:ring-offset-slate-900 transition-all accent-purple-600 cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                />
                <span className="font-semibold">
                  {language === 'vi' ? 'Tự dùng bình máu khi HP < 35%' : 'Auto use potion when HP < 35%'}
                </span>
              </label>
            </div>
          </div>
        </section>

        {/* COLUMN 4: Active Quest Tracker Sidebar */}
        <section className="hidden lg:flex lg:col-span-1 glass-panel rounded-2xl p-4 flex-col overflow-hidden shadow-lg border-slate-800">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-850 pb-2 flex justify-between">
            <span>{t('active_bounties')}</span>
          </h3>

          <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
            {saveData.quests.filter(q => !q.claimed).length === 0 ? (
              <div className="text-center py-12 text-[10px] text-slate-600 italic">
                {t('no_quests')}
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
                          {getTranslatedQuestTitle(t, q.id, q.title)}
                        </span>
                        {q.completed && (
                          <span className="bg-emerald-500/10 text-emerald-400 text-[8px] px-1 py-0.2 rounded font-extrabold uppercase animate-pulse font-display">
                            {t('claim_btn')}
                          </span>
                        )}
                      </div>

                      <div className="flex justify-between items-center text-[9px] text-slate-500 font-medium">
                        <span>{t('progress_label')}: {q.currentCount} / {q.targetCount}</span>
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

      {/* CORE BOTTOM NAVIGATION & PANEL CONTAINER (Desktop inline layout) */}
      <footer className={`hidden lg:flex lg:flex-col lg:justify-between glass-panel rounded-2xl p-4 overflow-hidden relative z-10 border-slate-800 shadow-xl shrink-0 transition-all duration-300 ${
        activeTab === 'home' ? 'h-[72px]' : 'h-[350px]'
      }`}>
        {/* Navigation Tabs Bar */}
        <nav className={`flex justify-between items-center gap-2 overflow-hidden shrink-0 ${
          activeTab === 'home' ? '' : 'border-b border-slate-850 pb-2 mb-4'
        }`}>
          <div className="flex gap-2 overflow-x-auto pb-1 max-w-full scrollbar-none shrink-0 snap-x snap-mandatory">
            <button
              onClick={() => setActiveTab('home')}
              className={`shrink-0 snap-start px-4 py-2 text-xs font-extrabold uppercase rounded-xl border tracking-wider transition-all duration-150 cursor-pointer ${
                activeTab === 'home'
                  ? 'bg-blue-600 hover:bg-blue-500 border-blue-500 text-white shadow shadow-blue-500/20'
                  : 'bg-slate-950/60 hover:bg-slate-900 border-slate-850 text-slate-400 hover:text-white'
              }`}
            >
              🏠 {language === 'vi' ? 'Trang chủ' : 'Home'}
            </button>
            {(['hero', 'quest', 'guild', 'shop'] as const).map(tab => {
              const locked = hero.level < LEVEL_LOCKS[tab];
              return (
                <button
                  key={tab}
                  onClick={() => {
                    if (locked) {
                      useGameStore.getState().addLogMessage(
                        language === 'vi'
                          ? `🔒 Tính năng khóa! Đạt cấp ${LEVEL_LOCKS[tab]} để mở khóa.`
                          : `🔒 Feature locked! Reach level ${LEVEL_LOCKS[tab]} to unlock.`,
                        'system'
                      );
                      return;
                    }
                    setActiveTab(tab);
                  }}
                  className={`shrink-0 snap-start px-4 py-2 text-xs font-extrabold uppercase rounded-xl border tracking-wider transition-all duration-150 cursor-pointer ${activeTab === tab
                    ? 'bg-blue-600 hover:bg-blue-500 border-blue-500 text-white shadow shadow-blue-500/20'
                    : locked
                      ? 'bg-slate-950/20 border-slate-900 text-slate-650 opacity-40 cursor-not-allowed'
                      : 'bg-slate-950/60 hover:bg-slate-900 border-slate-850 text-slate-400 hover:text-white'
                    }`}
                  title={locked ? (language === 'vi' ? `Khóa đến cấp ${LEVEL_LOCKS[tab]}` : `Locked until level ${LEVEL_LOCKS[tab]}`) : ''}
                >
                  {locked ? '🔒 ' : ''}
                  {tab === 'hero' ? t('tab_hero') : tab === 'quest' ? t('tab_quest') : tab === 'guild' ? t('tab_guild') : t('tab_shop')}
                </button>
              );
            })}
          </div>

          <div className="hidden md:block text-[10px] text-slate-500 font-bold uppercase tracking-widest shrink-0">
            {t('hud_control_deck')}
          </div>
        </nav>

        {/* Selected Tab Sheet Content */}
        {activeTab !== 'home' && (
          <div className="flex-1 overflow-hidden relative">
            {renderTabContent()}
          </div>
        )}
      </footer>

      {/* MOBILE BOTTOM STICKY NAVIGATION BAR (Hidden on desktop) */}
      <nav className="lg:hidden glass-panel rounded-2xl p-1.5 flex justify-around items-center shrink-0 z-20 border-slate-800 shadow-xl select-none mb-1">
        <button
          onClick={() => {
            setActiveTab('home');
            setIsMobilePanelOpen(false);
          }}
          className={`flex-1 flex justify-center py-2 text-2xl transition cursor-pointer active:scale-90 ${
            activeTab === 'home' && !isMobilePanelOpen
              ? 'text-blue-400 scale-110 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]'
              : 'text-slate-500 opacity-60 grayscale'
          }`}
        >
          🏠
        </button>
        {(['hero', 'quest', 'guild', 'shop'] as const).map(tab => {
          const locked = hero.level < LEVEL_LOCKS[tab];
          return (
            <button
              key={tab}
              onClick={() => {
                if (locked) {
                  useGameStore.getState().addLogMessage(
                    language === 'vi'
                      ? `🔒 Tính năng khóa! Đạt cấp ${LEVEL_LOCKS[tab]} để mở khóa.`
                      : `🔒 Feature locked! Reach level ${LEVEL_LOCKS[tab]} to unlock.`,
                    'system'
                  );
                  return;
                }
                setActiveTab(tab);
                setIsMobilePanelOpen(true);
              }}
              className={`flex-1 flex justify-center py-2 text-2xl transition cursor-pointer active:scale-90 ${activeTab === tab && isMobilePanelOpen
                ? 'text-blue-400 scale-110 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]'
                : locked
                  ? 'text-slate-800 opacity-30 cursor-not-allowed'
                  : 'text-slate-500 opacity-60 grayscale'
                }`}
            >
              {locked ? '🔒' : getTabIconOnly(tab)}
            </button>
          );
        })}
      </nav>

      {/* MOBILE FULL-SCREEN POPUP MODAL OVERLAY */}
      {isMobilePanelOpen && (
        <div className="fixed inset-0 bg-slate-950 z-50 flex flex-col p-4 overflow-hidden animate-fade-in">
          {/* Modal Header */}
          <div className="flex justify-between items-center border-b border-slate-850 pb-3 mb-4 shrink-0">
            <h3 className="text-sm font-black uppercase text-white flex items-center gap-1.5 font-display">
              {activeTab === 'hero' && t('tab_hero')}
              {activeTab === 'bag' && t('tab_bag')}
              {activeTab === 'quest' && t('tab_quest')}
              {activeTab === 'guild' && t('tab_guild')}
              {activeTab === 'shop' && t('tab_shop')}
              {activeTab === 'summon' && t('tab_summon')}
              {activeTab === 'guide' && t('tab_guide')}
            </h3>

            <button
              onClick={() => setIsMobilePanelOpen(false)}
              className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white font-extrabold text-sm active:scale-95 cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Modal Body Tab Content */}
          <div className="flex-1 overflow-hidden relative mb-4">
            {renderTabContent()}
          </div>

          {/* Switcher inside Modal */}
          <nav className="flex justify-around items-center border-t border-slate-850 pt-3 shrink-0 select-none">
            <button
              onClick={() => {
                setActiveTab('home');
                setIsMobilePanelOpen(false);
              }}
              className={`flex-1 flex justify-center py-2 text-2xl transition cursor-pointer active:scale-90 ${
                activeTab === 'home'
                  ? 'text-blue-400 scale-110 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]'
                  : 'text-slate-500 opacity-60 grayscale'
              }`}
            >
              🏠
            </button>
            {(['hero', 'quest', 'guild', 'shop'] as const).map(tab => {
              const locked = hero.level < LEVEL_LOCKS[tab];
              return (
                <button
                  key={tab}
                  onClick={() => {
                    if (locked) {
                      useGameStore.getState().addLogMessage(
                        language === 'vi'
                          ? `🔒 Tính năng khóa! Đạt cấp ${LEVEL_LOCKS[tab]} để mở khóa.`
                          : `🔒 Feature locked! Reach level ${LEVEL_LOCKS[tab]} to unlock.`,
                        'system'
                      );
                      return;
                    }
                    setActiveTab(tab);
                  }}
                  className={`flex-1 flex justify-center py-2 text-2xl transition cursor-pointer active:scale-90 ${activeTab === tab
                    ? 'text-blue-400 scale-110 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]'
                    : locked
                      ? 'text-slate-800 opacity-30 cursor-not-allowed'
                      : 'text-slate-500 opacity-60 grayscale'
                    }`}
                >
                  {locked ? '🔒' : getTabIconOnly(tab)}
                </button>
              );
            })}
          </nav>
        </div>
      )}

      {/* Settings Modal Overlay */}
      {isSettingsOpen && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xs p-5 shadow-2xl space-y-5">
            <div className="flex justify-between items-center border-b border-slate-850 pb-2.5">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-200 flex items-center gap-1.5 font-display">
                ⚙️ {language === 'vi' ? 'Cài Đặt' : 'Settings'}
              </h3>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="text-slate-400 hover:text-white font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Language Settings */}
            <div className="space-y-2">
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">
                {language === 'vi' ? 'Ngôn ngữ' : 'Language'}
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setLanguage('vi')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-[11px] font-extrabold transition cursor-pointer ${language === 'vi'
                    ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                    : 'bg-slate-950/40 border-slate-850 text-slate-400 hover:text-white'
                    }`}
                >
                  <span>🇻🇳</span> Tiếng Việt
                </button>
                <button
                  onClick={() => setLanguage('en')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-[11px] font-extrabold transition cursor-pointer ${language === 'en'
                    ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                    : 'bg-slate-950/40 border-slate-850 text-slate-400 hover:text-white'
                    }`}
                >
                  <span>🇬🇧</span> English
                </button>
              </div>
            </div>
 
            {/* Rename Character Settings */}
            <div className="space-y-2 pt-2.5 border-t border-slate-850">
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">
                {language === 'vi' ? 'Tên Nhân Vật' : 'Character Name'}
              </span>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  maxLength={16}
                  className="flex-1 bg-slate-950/60 border border-slate-850/80 rounded-xl px-2.5 py-1.5 text-[11px] text-slate-200 outline-none focus:border-blue-500/80 transition-all font-bold"
                  placeholder={language === 'vi' ? 'Nhập tên mới...' : 'Enter new name...'}
                />
                <button
                  onClick={() => {
                    const cleaned = nameInput.trim();
                    if (!cleaned) return;
                    renameHero(cleaned);
                  }}
                  disabled={!nameInput.trim() || nameInput.trim() === hero.name}
                  className="bg-blue-600/90 hover:bg-blue-500 disabled:opacity-30 disabled:pointer-events-none text-white text-[10px] font-black uppercase tracking-wider px-3 rounded-xl border border-blue-500/35 active:scale-95 transition cursor-pointer"
                >
                  {language === 'vi' ? 'Lưu' : 'Save'}
                </button>
              </div>
            </div>

            {/* Auto-Farming Settings */}
            <div className="space-y-2.5 pt-2.5 border-t border-slate-850">
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">
                {language === 'vi' ? 'Cài Đặt Treo Máy (Auto)' : 'Auto-Farming Settings'}
              </span>
              <div className="space-y-2 text-xs">
                {/* Auto Potion */}
                <label className="flex items-center justify-between cursor-pointer select-none text-slate-350 hover:text-slate-200 py-0.5">
                  <span className="font-medium text-[11px]">
                    {language === 'vi' ? 'Tự dùng bình HP (< 35%)' : 'Auto-use Potion (< 35%)'}
                  </span>
                  <input
                    type="checkbox"
                    checked={hero.autoUsePotion ?? false}
                    onChange={() => toggleAutoUsePotion()}
                    className="w-3.5 h-3.5 rounded border border-slate-750 bg-slate-950 text-purple-600 focus:ring-purple-500 accent-purple-600 cursor-pointer"
                  />
                </label>

                {/* Auto Dismantle Common */}
                <label className="flex items-center justify-between cursor-pointer select-none text-slate-350 hover:text-slate-200 py-0.5">
                  <span className="font-medium text-[11px]">
                    {language === 'vi' ? 'Tự phân rã đồ Thường (Common)' : 'Auto-dismantle Common items'}
                  </span>
                  <input
                    type="checkbox"
                    checked={hero.autoDismantleCommon ?? false}
                    onChange={() => toggleAutoDismantleCommon()}
                    className="w-3.5 h-3.5 rounded border border-slate-750 bg-slate-950 text-purple-600 focus:ring-purple-500 accent-purple-600 cursor-pointer"
                  />
                </label>

                {/* Auto Dismantle Uncommon */}
                <label className="flex items-center justify-between cursor-pointer select-none text-slate-350 hover:text-slate-200 py-0.5">
                  <span className="font-medium text-[11px]">
                    {language === 'vi' ? 'Tự phân rã đồ Tốt (Uncommon)' : 'Auto-dismantle Uncommon items'}
                  </span>
                  <input
                    type="checkbox"
                    checked={hero.autoDismantleUncommon ?? false}
                    onChange={() => toggleAutoDismantleUncommon()}
                    className="w-3.5 h-3.5 rounded border border-slate-750 bg-slate-950 text-purple-600 focus:ring-purple-500 accent-purple-600 cursor-pointer"
                  />
                </label>

                {/* Auto Dismantle Rare */}
                <label className="flex items-center justify-between cursor-pointer select-none text-slate-350 hover:text-slate-200 py-0.5">
                  <span className="font-medium text-[11px]">
                    {language === 'vi' ? 'Tự phân rã đồ Hiếm (Rare)' : 'Auto-dismantle Rare items'}
                  </span>
                  <input
                    type="checkbox"
                    checked={hero.autoDismantleRare ?? false}
                    onChange={() => toggleAutoDismantleRare()}
                    className="w-3.5 h-3.5 rounded border border-slate-750 bg-slate-950 text-purple-600 focus:ring-purple-500 accent-purple-600 cursor-pointer"
                  />
                </label>

                {/* Auto Buy Potions */}
                <label className="flex items-center justify-between cursor-pointer select-none text-slate-350 hover:text-slate-200 py-0.5 border-t border-slate-850/40 mt-1 pt-1.5">
                  <span className="font-semibold text-[11px] text-amber-400">
                    {language === 'vi' ? '🛒 Tự mua bình HP (200 Vàng) khi hết' : '🛒 Auto-buy Potions (200 Gold)'}
                  </span>
                  <input
                    type="checkbox"
                    checked={hero.autoBuyPotions ?? false}
                    onChange={() => toggleAutoBuyPotions()}
                    className="w-3.5 h-3.5 rounded border border-slate-750 bg-slate-950 text-purple-600 focus:ring-purple-500 accent-purple-600 cursor-pointer"
                  />
                </label>
              </div>
            </div>


            {/* Admin Documents (Only for admin@gmail.com) */}
            {user?.email?.toLowerCase() === 'admin@gmail.com' && (
              <div className="pt-2.5 border-t border-slate-850">
                <button
                  onClick={() => {
                    setIsSettingsOpen(false);
                    onNavigate('/documents');
                  }}
                  className="w-full bg-indigo-600/20 hover:bg-indigo-600/35 border border-indigo-500/30 text-indigo-400 hover:text-indigo-300 font-extrabold py-2 rounded-xl text-[11px] uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>📖</span> {language === 'vi' ? 'Tài liệu Admin (Wiki)' : 'Admin Documents (Wiki)'}
                </button>
              </div>
            )}

            {/* Sign Out */}
            <div className="pt-2.5 border-t border-slate-850">
              <button
                onClick={() => {
                  setIsSettingsOpen(false);
                  signOut();
                }}
                className="w-full bg-red-600/10 hover:bg-red-600/20 border border-red-500/30 text-red-400 hover:text-red-300 font-extrabold py-2 rounded-xl text-[11px] uppercase tracking-wider transition cursor-pointer"
              >
                {language === 'vi' ? 'Đăng xuất tài khoản' : 'Sign Out Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Item Inspect Popup Overlay */}
      {activeInspectItemId && <ItemInfoModal />}

      {/* Gacha Summon Reveal Overlay */}
      <SummonResultOverlay />
    </div>
  );
};
