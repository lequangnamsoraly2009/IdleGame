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
import { DungeonTab } from './tabs/DungeonTab';
import { ForgeTab } from './tabs/ForgeTab';
import { DungeonBattleModal } from './DungeonBattleModal';
import { useTranslation, getTranslatedQuestTitle } from '../utils/i18n';
import { useLanguageStore } from '../stores/languageStore';
import { ItemInfoModal } from './ItemInfoModal';
import { SummonResultOverlay } from './SummonResultOverlay';
import { calculateHeroCP, calculateGoldUpgradeCost, GAME_ICONS } from '@idle-rpg/shared';

const LEVEL_LOCKS = {
  hero: 1,
  dungeon: 5,
  forge: 5,
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
    combatLogs,
    battleMode,
    activeInspectItemId,
    renameHero,
    toggleAutoUsePotion,
    toggleAutoDismantleCommon,
    toggleAutoDismantleUncommon,
    toggleAutoDismantleRare,
    toggleAutoBuyPotions,
    toastMessage,
    dungeonLoading,
    buyGoldUpgrade,
    claimQuestReward,
    buyDungeonTicket
  } = useGameStore();

  const { t } = useTranslation();
  const { language, setLanguage } = useLanguageStore();
  const [logFilter, setLogFilter] = useState<'all' | 'combat' | 'loot'>('all');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAutoSkills, setIsAutoSkills] = useState(true);
  const [nameInput, setNameInput] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<string>('character');
  const [traits, setTraits] = useState<any[]>([
    { id: 1, grade: 'SS', stat: 'atk', value: 300, locked: false },
    { id: 2, grade: 'SS', stat: 'atk', value: 300, locked: false },
    { id: 3, grade: 'S', stat: 'atk', value: 150, locked: false },
    { id: 4, grade: 'A', stat: 'hp', value: 50, locked: false },
    { id: 5, grade: 'C', stat: 'gold', value: 10, locked: false },
  ]);

  // Sync sub-tab when main tab changes
  React.useEffect(() => {
    if (activeTab === 'hero') {
      setActiveSubTab('character');
    } else if (activeTab === 'dungeon') {
      setActiveSubTab('dungeon');
    } else if (activeTab === 'forge') {
      setActiveSubTab('forge');
    } else if (activeTab === 'shop') {
      setActiveSubTab('summon');
    }
  }, [activeTab]);

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

  // Redirect to Home tab when dungeon battle begins
  React.useEffect(() => {
    if (battleMode === 'dungeon') {
      setActiveTab('home');
    }
  }, [battleMode, setActiveTab]);

  if (!saveData) return null;

  const { hero, activeStage, currentWave } = saveData;

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
  const getTabIconOnly = (tab: 'home' | 'hero' | 'bag' | 'quest' | 'guild' | 'shop' | 'summon' | 'guide' | 'dungeon' | 'forge') => {
    switch (tab) {
      case 'home': return '🏠';
      case 'hero': return '👤';
      case 'bag': return '🎒';
      case 'quest': return '📜';
      case 'guild': return '🏰';
      case 'shop': return '💰';
      case 'summon': return '🎁';
      case 'guide': return '📖';
      case 'dungeon': return '💀';
      case 'forge': return '⚒️';
    }
  };

  const renderGoldUpgradesSheet = () => {
    const hero = saveData?.hero;
    if (!hero) return null;

    const stats = ['attack', 'hp', 'hpRecovery', 'critDamage'] as const;

    const getStatInfo = (stat: typeof stats[number]) => {
      const level = hero.goldUpgrades?.[stat] || 0;
      const cost = calculateGoldUpgradeCost(stat, level);

      let name = '';
      let currentValStr = '';
      let nextValStr = '';
      let icon = '';

      if (stat === 'attack') {
        name = language === 'vi' ? 'Sức Mạnh Tấn Công' : 'Attack Power';
        icon = '⚔️';
        currentValStr = `${hero.currentStats.attack}`;
        nextValStr = `+12`;
      } else if (stat === 'hp') {
        name = language === 'vi' ? 'Sinh Mệnh HP' : 'Max HP';
        icon = '❤️';
        currentValStr = `${hero.currentStats.maxHp}`;
        nextValStr = `+85`;
      } else if (stat === 'hpRecovery') {
        name = language === 'vi' ? 'Hồi Phục HP/giây' : 'HP Regen/sec';
        icon = '🩸';
        currentValStr = `${hero.currentStats.hpRecovery || 0}`;
        nextValStr = `+3`;
      } else if (stat === 'critDamage') {
        name = language === 'vi' ? 'Sát Thương Chí Mạng' : 'Critical Damage';
        icon = '💥';
        currentValStr = `${Math.round(hero.currentStats.critDamage * 100)}%`;
        nextValStr = `+2%`;
      }

      return { name, level, cost, currentValStr, nextValStr, icon };
    };

    return (
      <div className="h-full flex flex-col overflow-hidden select-none">
        <div className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5 shrink-0">
          ⭐ {language === 'vi' ? 'CƯỜNG HÓA CHỈ SỐ BẰNG VÀNG' : 'GOLD STATS ENHANCEMENT'}
        </div>
        <div className="flex-grow overflow-y-auto space-y-2 pr-1 pb-4">
          {stats.map(stat => {
            const info = getStatInfo(stat);
            const isLevelLocked = info.level >= hero.level;
            const canAfford = hero.gold >= info.cost && !isLevelLocked;

            return (
              <div key={stat} className="bg-slate-950/60 border border-slate-900/60 p-2.5 rounded-2xl flex items-center justify-between transition-all hover:bg-slate-950/90">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl shrink-0">{info.icon}</span>
                  <div>
                    <div className="text-xs font-extrabold text-white flex items-center gap-1.5 leading-none">
                      {info.name}
                      <span className="text-[9px] bg-slate-900 border border-slate-805 text-amber-500 px-1 py-0.2 rounded font-extrabold font-mono">Lv.{info.level}</span>
                    </div>
                    <div className="text-[10.5px] text-slate-400 font-mono mt-1.5 leading-none">
                      {info.currentValStr} <span className="text-emerald-400 font-bold">({info.nextValStr})</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => buyGoldUpgrade(stat)}
                  disabled={!canAfford}
                  className={`px-3 py-2 rounded-xl font-black uppercase font-display text-[10px] tracking-wide flex items-center gap-1 cursor-pointer active:scale-95 transition-all select-none ${canAfford
                    ? 'bg-gradient-to-r from-yellow-500 to-amber-600 border border-yellow-400 text-slate-950 shadow hover:brightness-110'
                    : isLevelLocked
                      ? 'bg-red-950/20 border border-red-900/20 text-red-400/90 cursor-not-allowed text-[8.5px]'
                      : 'bg-slate-900 border border-slate-950 text-slate-655 opacity-55 cursor-not-allowed'
                    }`}
                >
                  {isLevelLocked ? (language === 'vi' ? 'ĐẠT GIỚI HẠN' : 'MAX LEVEL') : <>{GAME_ICONS.GOLD} {info.cost.toLocaleString()}</>}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const getPopupTitle = () => {
    switch (activeTab) {
      case 'hero':
        if (activeSubTab === 'character') return language === 'vi' ? 'Nhân Vật' : 'Character';
        if (activeSubTab === 'bag') return language === 'vi' ? 'Hành Trang' : 'Inventory';
        if (activeSubTab === 'trait') return language === 'vi' ? 'Thiên Phú' : 'Traits';
        return '';
      case 'dungeon':
        if (activeSubTab === 'dungeon') return language === 'vi' ? 'Phụ Bản' : 'Dungeons';
        if (activeSubTab === 'guild') return language === 'vi' ? 'Khiêu Chiến Bang Hội' : 'Guild Boss Raid';
        return '';
      case 'forge':
        if (activeSubTab === 'forge') return language === 'vi' ? 'Lò Rèn' : 'Forge';
        if (activeSubTab === 'guide') return language === 'vi' ? 'Cẩm Nang Wiki' : 'Wiki Guide';
        return '';
      case 'shop':
        if (activeSubTab === 'summon') return language === 'vi' ? 'Triệu Hồi' : 'Summons';
        if (activeSubTab === 'shop') return language === 'vi' ? 'Cửa Hàng' : 'Store';
        return '';
      case 'quest':
        return language === 'vi' ? 'Nhiệm Vụ Tuần Hoàn' : 'Bounty Quests';
      default:
        return '';
    }
  };

  const hasSubTabs = (tab: string) => {
    return ['hero', 'dungeon', 'forge', 'shop'].includes(tab);
  };

  const getSubTabsForTab = (tab: string) => {
    switch (tab) {
      case 'hero':
        return [
          { id: 'character', label: language === 'vi' ? 'Trạng Thái' : 'Slime' },
          { id: 'bag', label: language === 'vi' ? 'Kho Đồ' : 'Bag' },
          { id: 'trait', label: language === 'vi' ? 'Thiên Phú' : 'Trait' }
        ];
      case 'dungeon':
        return [
          { id: 'dungeon', label: language === 'vi' ? 'Phụ Bản' : 'Dungeon' },
          { id: 'guild', label: language === 'vi' ? 'Bang Hội' : 'Guild' }
        ];
      case 'forge':
        return [
          { id: 'forge', label: language === 'vi' ? 'Rèn Đồ' : 'Forge' },
          { id: 'guide', label: language === 'vi' ? 'Sổ Tay' : 'Wiki' }
        ];
      case 'shop':
        return [
          { id: 'summon', label: language === 'vi' ? 'Triệu Hồi' : 'Summon' },
          { id: 'shop', label: language === 'vi' ? 'Cửa Hàng' : 'Store' }
        ];
      default:
        return [];
    }
  };

  const renderPopupContent = () => {
    switch (activeTab) {
      case 'hero':
        if (activeSubTab === 'character') return <HeroTab />;
        if (activeSubTab === 'bag') return <BagTab />;
        if (activeSubTab === 'trait') return renderTraitTab();
        return null;
      case 'dungeon':
        if (activeSubTab === 'dungeon') return <DungeonTab />;
        if (activeSubTab === 'guild') return <GuildTab />;
        return null;
      case 'forge':
        if (activeSubTab === 'forge') return <ForgeTab />;
        if (activeSubTab === 'guide') return <GuideTab />;
        return null;
      case 'shop':
        if (activeSubTab === 'summon') return <SummonTab />;
        if (activeSubTab === 'shop') return <ShopTab />;
        return null;
      case 'quest':
        return <QuestTab />;
      default:
        return null;
    }
  };

  const renderTraitTab = () => {
    const cost = traits.filter(t => t.locked).length * 15 + 30; // base 30, +15 per lock
    const canRoll = hero.diamonds >= cost;

    const rollTraits = () => {
      if (!canRoll) return;

      // Deduct diamonds
      useGameStore.setState(state => {
        if (state.saveData) {
          state.saveData.hero.diamonds -= cost;
        }
        return { ...state };
      });

      // Roll unlocked traits
      setTraits(prev => prev.map(t => {
        if (t.locked) return t;

        const roll = Math.random();
        let grade: 'C' | 'B' | 'A' | 'S' | 'SS' = 'C';
        if (roll < 0.01) grade = 'SS';
        else if (roll < 0.05) grade = 'S';
        else if (roll < 0.15) grade = 'A';
        else if (roll < 0.40) grade = 'B';

        const statsPool = ['atk', 'hp', 'crit', 'gold'] as const;
        const stat = statsPool[Math.floor(Math.random() * statsPool.length)];

        let value = 10;
        if (grade === 'SS') value = stat === 'crit' ? 300 : 300;
        else if (grade === 'S') value = stat === 'crit' ? 150 : 150;
        else if (grade === 'A') value = stat === 'crit' ? 50 : 50;
        else if (grade === 'B') value = stat === 'crit' ? 25 : 25;

        return {
          ...t,
          grade,
          stat,
          value
        };
      }));
    };

    const toggleLock = (id: number) => {
      setTraits(prev => prev.map(t => {
        if (t.id === id) {
          return { ...t, locked: !t.locked };
        }
        return t;
      }));
    };

    return (
      <div className="flex flex-col h-full overflow-hidden select-none">
        <div className="bg-slate-950/60 border border-slate-900 px-3 py-2 rounded-2xl flex items-center justify-between shrink-0 mb-3">
          <div className="text-[10px] font-extrabold text-slate-350 flex items-center gap-1.5 leading-none">
            🧬 {language === 'vi' ? 'Hiệu Ứng Cộng Hưởng' : 'Synergy Effect'}
          </div>
          <div className="flex gap-2">
            <span className="text-[8px] bg-blue-650/20 border border-blue-500/30 text-blue-400 px-2 py-0.5 rounded font-black">SS Lv.3</span>
            <span className="text-[8px] bg-purple-650/20 border border-purple-500/30 text-purple-400 px-2 py-0.5 rounded font-black">S Lv.1</span>
          </div>
        </div>

        <div className="flex-grow overflow-y-auto space-y-2 pr-1 pb-4">
          {traits.map(t => {
            const statLabel = t.stat === 'atk' ? (language === 'vi' ? 'Tấn Công ATK' : 'ATK Power')
              : t.stat === 'hp' ? (language === 'vi' ? 'Sinh Mệnh HP' : 'Max HP')
                : t.stat === 'crit' ? (language === 'vi' ? 'Sát Thương Chí Mạng' : 'Critical Damage')
                  : (language === 'vi' ? 'Vàng Nhận Thêm' : 'Gold Obtain');
            const gradeColor = t.grade === 'SS' ? 'text-red-500 bg-red-950/20 border-red-500/40'
              : t.grade === 'S' ? 'text-orange-400 bg-orange-950/20 border-orange-500/30'
                : t.grade === 'A' ? 'text-purple-400 bg-purple-950/20 border-purple-500/30'
                  : t.grade === 'B' ? 'text-blue-400 bg-blue-950/20 border-blue-500/30'
                    : 'text-slate-400 bg-slate-950/20 border-slate-800';

            return (
              <div key={t.id} className="bg-slate-950/40 border border-slate-900/60 p-2.5 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`w-8 h-8 rounded-xl border flex items-center justify-center font-black text-xs font-display shadow-inner shrink-0 ${gradeColor}`}>
                    {t.grade}
                  </span>
                  <div>
                    <span className="text-xs font-black text-slate-200 block leading-tight">{statLabel}</span>
                    <span className="text-[10px] text-slate-400 font-mono mt-1.5 block leading-none">
                      {language === 'vi' ? `Tăng thêm +${t.value}%` : `Increase value by +${t.value}%`}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => toggleLock(t.id)}
                  className={`w-7 h-7 rounded-lg border flex items-center justify-center text-xs transition cursor-pointer active:scale-90 shrink-0 ${t.locked
                    ? 'bg-amber-600/20 border-amber-500 text-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.2)]'
                    : 'bg-slate-950 border-slate-850 text-slate-500 hover:text-slate-350'
                    }`}
                >
                  {t.locked ? '🔒' : '🔓'}
                </button>
              </div>
            );
          })}
        </div>

        <div className="pt-2 border-t border-slate-850 bg-slate-900 flex gap-2 shrink-0 select-none pb-1">
          <button
            onClick={rollTraits}
            disabled={!canRoll}
            className={`flex-1 py-2 rounded-xl font-black uppercase text-[10px] tracking-wider flex items-center justify-center gap-1.5 active:scale-[0.98] transition cursor-pointer ${canRoll
              ? 'bg-gradient-to-r from-slate-800 to-slate-750 border border-slate-700 text-slate-200 shadow hover:brightness-110'
              : 'bg-slate-950 border border-slate-905 text-slate-600 cursor-not-allowed'
              }`}
          >
            {GAME_ICONS.AETHER} {language === 'vi' ? 'Thay Đổi' : 'Change'} <span className="font-mono text-[9px] bg-slate-950/80 px-1.5 py-0.5 rounded text-amber-500">{GAME_ICONS.DIAMOND} {cost}</span>
          </button>

          <button
            onClick={rollTraits}
            disabled={!canRoll}
            className={`flex-1 py-2 rounded-xl font-black uppercase text-[10px] tracking-wider flex items-center justify-center gap-1.5 active:scale-[0.98] transition cursor-pointer ${canRoll
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 border border-amber-400 text-slate-950 shadow hover:brightness-110'
              : 'bg-slate-950 border border-slate-905 text-slate-600 cursor-not-allowed'
              }`}
          >
            ⏩ {language === 'vi' ? 'Tự Thay Đổi' : 'Auto-change'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen w-screen flex flex-col justify-between bg-slate-950 text-slate-100 overflow-hidden select-none relative">
      {/* Toast Notification Popup (Centered Premium RPG Card) */}
      {toastMessage && (
        <>
          {/* Subtle backdrop dim */}
          <div className="fixed inset-0 bg-slate-950/40 z-[95] backdrop-blur-[1px] pointer-events-none" />

          <div className="fixed top-1/2 left-1/2 z-[100] bg-slate-950/90 backdrop-blur-md border-2 border-amber-500/50 shadow-[0_0_50px_rgba(245,158,11,0.25)] p-6 rounded-3xl flex flex-col items-center justify-center text-center w-[280px] sm:w-[340px] select-none animate-success-pop pointer-events-auto">
            {/* Close Button X in top right corner */}
            <button
              onClick={() => useGameStore.setState({ toastMessage: null })}
              className="absolute top-3 right-3 w-6 h-6 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-[10px] transition cursor-pointer active:scale-90 font-bold z-20 shadow-md"
              title="Close"
            >
              ✕
            </button>

            {/* Spinning rays background glow */}
            <div className="absolute inset-0 w-full h-full rounded-3xl overflow-hidden opacity-30 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[radial-gradient(circle,rgba(245,158,11,0.2)_0%,transparent_70%)] animate-pulse" />
            </div>

            {/* Glowing Icon */}
            <div className="relative z-10 w-14 h-14 rounded-full bg-gradient-to-b from-amber-400/20 to-yellow-600/10 border-2 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.35)] flex items-center justify-center text-2xl mb-3">
              ✨
            </div>

            {/* Title */}
            <h4 className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 font-black text-xs sm:text-sm tracking-[0.2em] uppercase mb-1 drop-shadow-[0_0_6px_rgba(245,158,11,0.25)]">
              {language === 'vi' ? 'THÀNH CÔNG' : 'SUCCESS'}
            </h4>

            {/* Glowing decorative underline */}
            <div className="relative z-10 w-20 h-0.5 bg-gradient-to-r from-transparent via-amber-500/60 to-transparent mb-3" />

            {/* Message Description */}
            <p className="relative z-10 text-slate-200 text-[11px] sm:text-xs font-semibold leading-relaxed max-w-[90%]">
              {toastMessage}
            </p>
          </div>
        </>
      )}

      {/* Background glow overlay */}
      <div className="bg-radial-glow" />

      {/* TOP HEADER */}
      <header className="glass-panel rounded-b-2xl py-2 px-3 sm:py-3 sm:px-6 flex justify-between items-center relative z-10 border-slate-800 shadow-xl gap-2 sm:gap-4 shrink-0">
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
                ⚔️{calculateHeroCP(hero.level, hero.prestigePoints, saveData.inventory.filter(item => item.equipped), hero.heroClass, hero.shardUpgrades, hero.goldUpgrades).toLocaleString()}
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
              <span className="text-[10px] sm:text-xs select-none">{GAME_ICONS.GOLD}</span>
              <span className="text-[9px] sm:text-xs font-black text-yellow-400 font-display">{hero.gold.toLocaleString()}</span>
            </div>
            {/* Diamonds */}
            <div className="flex items-center gap-1 bg-slate-950/60 border border-slate-900 px-1.5 py-1 sm:px-3 sm:py-1.5 rounded-lg shadow-inner animate-fade-in">
              <span className="text-[10px] sm:text-xs">{GAME_ICONS.DIAMOND}</span>
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
      <main className="flex-1 flex justify-center items-stretch overflow-hidden relative z-10 w-full h-[calc(100vh-64px)] gap-4 my-2">

        {/* COLUMN 1: Live Combat Log (Desktop only, outside the frame) */}
        <section className="hidden lg:flex lg:w-[280px] xl:w-[320px] shrink-0 glass-panel rounded-2xl p-4 flex-col overflow-hidden shadow-lg border-slate-800 bg-slate-950/20">
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

        {/* COLUMN 2 & 3: Main Centered Portrait viewport (Game frame) */}
        <section className="w-full max-w-[480px] h-full flex flex-col justify-between overflow-hidden relative border-x border-slate-800/80 bg-slate-950/30 shadow-[0_0_60px_rgba(0,0,0,0.85)] rounded-2xl">

          {/* Battle Canvas Screen Container */}
          <div className="w-full h-1/2 relative shrink-0 overflow-hidden bg-slate-950">
            <PixiGame />

             {/* Floating Quest Tracker Overlay (Ultra-compact styling) */}
            {(() => {
              const activeQuest = saveData.quests.find(q => !q.claimed);
              if (!activeQuest) return null;
              const percentage = Math.min(100, Math.floor((activeQuest.currentCount / activeQuest.targetCount) * 100));

              return (
                <div className="absolute top-1.5 left-1/2 -translate-x-1/2 bg-slate-950/40 backdrop-blur-[2px] border border-slate-900/40 rounded-xl px-2 py-1 flex items-center gap-2 z-30 shadow-md w-[85%] max-w-[280px] animate-fade-in select-none">
                  <div className="flex-grow min-w-0">
                    <div className="flex justify-between items-center text-[7.5px] font-black text-amber-500/80 uppercase tracking-widest leading-none mb-0.5">
                      <span>{language === 'vi' ? 'NHIỆM VỤ HIỆN TẠI' : 'CURRENT BOUNTY'}</span>
                      <span className="font-mono font-bold text-slate-350">{activeQuest.currentCount}/{activeQuest.targetCount} ({percentage}%)</span>
                    </div>
                    <div className="text-[10px] font-black text-white truncate leading-tight">
                      {getTranslatedQuestTitle(t, activeQuest.id, activeQuest.title)}
                    </div>
                    <div className="h-0.5 bg-slate-950/60 rounded-full overflow-hidden mt-1">
                      <div
                        className={`h-full rounded-full transition-all duration-350 ${activeQuest.completed ? 'bg-emerald-500' : 'bg-blue-500'}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>

                  {activeQuest.completed && (
                    <button
                      onClick={() => claimQuestReward(activeQuest.id)}
                      className="bg-emerald-650 hover:bg-emerald-600 border border-emerald-500/50 text-white font-black text-[8px] uppercase px-1.5 py-1 rounded-md cursor-pointer active:scale-95 shadow-sm shrink-0 leading-none"
                    >
                      {t('claim_btn')}
                    </button>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Health & Life details (Top HUD area inside mobile panel) */}
          <div className="px-4 py-2.5 bg-slate-950/80 border-y border-slate-900/80 flex flex-col gap-2 shrink-0">
            {/* Stage Info inside Game Frame for Mobile View */}
            <div className="flex justify-between items-center text-xs pb-1.5 border-b border-slate-900/60 select-none">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">{t('stage')}:</span>
                <span className="font-extrabold text-blue-400">{activeStage}</span>
                <span className="text-slate-750 mx-1">|</span>
                <span className="font-extrabold text-slate-300">
                  Wave {(currentWave || 1) <= 20 ? (currentWave || 1) : 20}/20
                </span>
                {battleMode === 'stage' && (currentWave || 1) >= 20 && (
                  <span className="bg-red-500/10 text-red-400 border border-red-500/20 text-[8px] px-1 py-0.2 rounded font-extrabold uppercase animate-pulse ml-1.5 font-display">
                    BOSS
                  </span>
                )}
              </div>


            </div>



            {/* Legend of Slime Skill Action Bar */}
            <div className="pt-2 pb-1.5 px-3 flex items-center justify-between gap-1 w-full bg-slate-950/40 border-t border-slate-900/40 shrink-0 select-none">

              {/* AUTO TOGGLE */}
              <button
                onClick={() => setIsAutoSkills(prev => !prev)}
                className={`w-[42px] h-[42px] rounded-full border-2 flex flex-col items-center justify-center text-[9px] font-black leading-none uppercase tracking-tighter cursor-pointer active:scale-95 transition-all shadow-[0_0_12px_rgba(245,158,11,0.2)] shrink-0 ${isAutoSkills
                  ? 'bg-gradient-to-b from-amber-400 via-yellow-500 to-amber-600 border-yellow-300 text-slate-950 animate-pulse'
                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                  }`}
              >
                <span>AUTO</span>
                <span className="text-[7.5px] mt-0.5">{isAutoSkills ? 'ON' : 'OFF'}</span>
              </button>

              {/* SKILL 1: Active Companion (Equipped/Ready) */}
              <div className="relative group cursor-pointer active:scale-95 transition-all shrink-0">
                <div className="w-[38px] h-[38px] rounded-full bg-slate-900 border-2 border-yellow-500 flex items-center justify-center text-base shadow-[0_0_10px_rgba(234,179,8,0.15)] overflow-hidden">
                  <span>💧</span>
                </div>
                <div className="absolute inset-0 rounded-full border border-yellow-300/40 pointer-events-none scale-105" />
              </div>

              {/* SKILL 2: Cooldown state */}
              <div className="relative group cursor-pointer active:scale-95 transition-all shrink-0">
                <div className="w-[38px] h-[38px] rounded-full bg-slate-900 border-2 border-slate-700 flex items-center justify-center text-base overflow-hidden relative">
                  <span className="opacity-40">🐱</span>
                  <div className="absolute inset-0 bg-slate-950/70 flex items-center justify-center rounded-full">
                    <span className="text-[8.5px] font-black text-amber-500 font-mono">2.5s</span>
                  </div>
                </div>
              </div>

              {/* SKILL 3: Scythe Skill */}
              <div className="relative group cursor-pointer active:scale-95 transition-all shrink-0">
                <div className="w-[38px] h-[38px] rounded-full bg-slate-900 border-2 border-slate-750 flex items-center justify-center text-base overflow-hidden">
                  <span>💀</span>
                </div>
              </div>

              {/* SKILL 4: Egg Skill */}
              <div className="relative group cursor-pointer active:scale-95 transition-all shrink-0">
                <div className="w-[38px] h-[38px] rounded-full bg-slate-900 border-2 border-slate-750 flex items-center justify-center text-base overflow-hidden">
                  <span>🥚</span>
                </div>
              </div>

              {/* SKILL 5: Lightning Skill */}
              <div className="relative group cursor-pointer active:scale-95 transition-all shrink-0">
                <div className="w-[38px] h-[38px] rounded-full bg-slate-900 border-2 border-slate-750 flex items-center justify-center text-base overflow-hidden">
                  <span>⚡</span>
                </div>
              </div>

              {/* SKILL 6: Empty Slot (+) */}
              <button className="w-[38px] h-[38px] rounded-full bg-slate-950 hover:bg-slate-900 border-2 border-dashed border-amber-500/50 flex items-center justify-center text-xs text-amber-500/70 font-black cursor-pointer active:scale-95 transition-all select-none shadow-inner shrink-0">
                ➕
              </button>

            </div>
          </div>

          {/* Active Panel Sheet Content (always render bottom half inside main portrait frame) */}
          <div className="flex-1 overflow-hidden relative bg-slate-900/60 p-3 select-none flex flex-col justify-stretch min-h-0">
            {activeTab === 'home' ? renderGoldUpgradesSheet() : null}
          </div>

          {/* Legend of Slime Style Popup Modal Panel */}
          {activeTab !== 'home' && (
            <div className="absolute inset-x-0 bottom-[56px] top-[0px] bg-slate-900 border-slate-800 rounded-t-3xl flex flex-col z-30 shadow-2xl overflow-hidden animate-fade-in duration-150">
              
              {/* Popup Header */}
              <div className="px-4 py-2 flex justify-between items-center border-b border-slate-850 bg-slate-900 shrink-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-200 font-display">
                    {getPopupTitle()}
                  </h3>
                  <button className="w-4 h-4 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-[10px] text-slate-400 font-bold hover:text-white" title="Info">
                    ℹ️
                  </button>

                  {/* Dungeon Ticket quick actions in header (nested right next to title) */}
                  {activeTab === 'dungeon' && activeSubTab === 'dungeon' && saveData && (
                    <div className="flex items-center gap-1.5 ml-2.5">
                      {/* Tickets count indicator */}
                      <div className="flex items-center gap-1 text-[10px] font-black text-white font-mono bg-slate-950/60 border border-slate-850 px-1.5 py-0.5 rounded-lg select-none">
                        <span>🎫</span>
                        <span>{saveData.hero.dungeonTickets ?? 3}</span>
                      </div>

                      {/* Buy Ticket quick action */}
                      <button
                        onClick={() => buyDungeonTicket()}
                        disabled={saveData.hero.gold < 1000}
                        className="px-1.5 py-0.5 bg-yellow-600/15 hover:bg-yellow-600/25 border border-yellow-500/30 disabled:opacity-40 disabled:pointer-events-none text-yellow-450 text-[8px] font-black uppercase rounded-lg transition active:scale-95 cursor-pointer flex items-center gap-1 shadow-sm leading-none"
                      >
                        <span>🛒</span>
                        <span className="flex items-center gap-0.5 text-[8px] font-extrabold">
                          1.000 {GAME_ICONS.GOLD}
                        </span>
                      </button>
                    </div>
                  )}

                  {/* Shop Tab Aether in Header */}
                  {activeTab === 'shop' && saveData && (
                    <div className="flex items-center gap-1 ml-2.5 text-[10px] font-black text-purple-400 font-mono bg-slate-950/60 border border-slate-850 px-2 py-0.5 rounded-lg select-none">
                      <span>🌀</span>
                      <span>{saveData.hero.aetherShards ?? 0}</span>
                    </div>
                  )}

                  {/* Forge Tab Materials in Header */}
                  {activeTab === 'forge' && saveData && (
                    <div className="flex items-center gap-1 ml-2.5 text-[10px] font-black text-emerald-400 font-mono bg-slate-950/60 border border-slate-850 px-2 py-0.5 rounded-lg select-none">
                      <span>♻️</span>
                      <span>{saveData.hero.aetherShards ?? 0}</span>
                    </div>
                  )}
                </div>
                
                {/* Close Button with rounded border */}
                <button
                  onClick={() => setActiveTab('home')}
                  className="w-6 h-6 rounded-full bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-[11px] transition cursor-pointer active:scale-90 font-bold shadow-md"
                  title={language === 'vi' ? 'Đóng' : 'Close'}
                >
                  ✕
                </button>
              </div>

              {/* Popup Content Area */}
              <div className="flex-grow flex-1 overflow-y-auto p-3 bg-slate-900/40 relative">
                {renderPopupContent()}
              </div>

              {/* Popup Sub-Menu Nav (Hexagonal/Angled tabs right at the bottom edge) */}
              {hasSubTabs(activeTab) && (
                <div className="px-3 py-2 bg-slate-950 border-t border-slate-900/80 flex justify-center items-center gap-1.5 shrink-0 z-20">
                  {getSubTabsForTab(activeTab).map(sub => {
                    const isSelected = activeSubTab === sub.id;
                    return (
                      <button
                        key={sub.id}
                        onClick={() => setActiveSubTab(sub.id)}
                        className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-wider select-none cursor-pointer transition-all ${isSelected
                          ? 'bg-purple-650 border-2 border-purple-400 text-white shadow-[0_0_8px_rgba(147,51,234,0.5)] rounded-xl z-10 scale-105'
                          : 'bg-slate-900 border border-slate-800/80 text-slate-400 hover:text-white rounded-lg'
                          }`}
                      >
                        {sub.label}
                      </button>
                    );
                  })}
                </div>
              )}

            </div>
          )}

          {/* Portrait Sticky Bottom Tab Navigation */}
          <nav className="border-t border-slate-850 p-2 flex justify-around items-center bg-slate-950 shrink-0 z-20 shadow-2xl select-none">
            {activeTab === 'home' ? (
              <button
                onClick={() => setActiveTab('home')}
                className={`flex-grow flex-1 flex justify-center py-2 text-2xl transition cursor-pointer active:scale-90 ${activeTab === 'home'
                  ? 'text-blue-400 scale-110 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]'
                  : 'text-slate-500 opacity-60 grayscale'
                  }`}
              >
                🏠
              </button>
            ) : (
              <button
                onClick={() => setActiveTab('home')}
                className="w-10 h-10 rounded-full bg-red-650 border-2 border-white flex items-center justify-center text-lg text-white font-black cursor-pointer active:scale-95 transition-all select-none shadow-[0_0_10px_rgba(239,68,68,0.4)] shrink-0 z-20"
              >
                ✕
              </button>
            )}
            {(['hero', 'dungeon', 'forge', 'shop', 'quest'] as const).map(tab => {
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
                  className={`flex-grow flex-1 flex justify-center py-2 text-2xl transition cursor-pointer active:scale-90 ${activeTab === tab
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
        </section>

        {/* COLUMN 4: Active Quest Tracker Sidebar (Desktop only, outside the frame) */}
        <section className="hidden lg:flex lg:w-[280px] xl:w-[320px] shrink-0 glass-panel rounded-2xl p-4 flex-col overflow-hidden shadow-lg border-slate-800 bg-slate-950/20">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-850 pb-2 flex justify-between">
            <span>{t('active_bounties')}</span>
          </h3>

          <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
            {saveData.quests.filter(q => !q.claimed).length === 0 ? (
              <div className="text-center py-12 text-[10px] text-slate-650 italic">
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

      {/* Dungeon Arena Battle Overlay */}
      {battleMode === 'dungeon' && <DungeonBattleModal />}

      {/* Dungeon Teleport Loading Screen */}
      {dungeonLoading && (
        <div className="fixed inset-0 bg-slate-950/95 z-[99] flex flex-col items-center justify-center select-none animate-fade-in">
          <div className="absolute w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[100px] animate-pulse pointer-events-none" />

          <div className="text-center relative z-10 space-y-6">
            {/* Animated warp portal effect */}
            <div className="inline-block p-6 bg-indigo-500/10 border-2 border-indigo-500/35 rounded-3xl animate-spin duration-[6s] relative">
              <span className="text-5xl block">🌀</span>
              <div className="absolute inset-0 border border-dashed border-indigo-400 rounded-3xl animate-ping opacity-35" />
            </div>

            <div>
              <h2 className="text-xl font-black tracking-[0.25em] text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-indigo-400 to-purple-400 uppercase font-display drop-shadow-[0_0_8px_rgba(99,102,241,0.25)]">
                {language === 'vi' ? 'ĐANG VÀO PHÓ BẢN...' : 'ENTERING DUNGEON...'}
              </h2>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black mt-2">
                {language === 'vi' ? 'Đang dịch chuyển đến sảnh khiêu chiến...' : 'Teleporting to challenge chambers...'}
              </p>
            </div>

            {/* Progress slider bar */}
            <div className="w-56 h-1 bg-slate-900 border border-slate-850 rounded-full overflow-hidden mx-auto relative">
              <div className="h-full bg-indigo-500 rounded-full animate-pulse w-full" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
