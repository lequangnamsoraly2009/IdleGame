import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../stores/gameStore';
import { useLanguageStore } from '../stores/languageStore';
import { ItemGraphic } from './ItemGraphic';

interface DamageNumber {
  id: string;
  text: string;
  type: 'hero_deal' | 'boss_deal' | 'heal' | 'ult';
  x: number;
  y: number;
}

export const DungeonBattleModal: React.FC = () => {
  const { saveData, activeDungeonId, onDungeonVictory, onDungeonDefeat, usePotionInDungeon } = useGameStore();
  const { language } = useLanguageStore();

  if (!saveData || !activeDungeonId) return null;

  const { hero } = saveData;
  const maxHeroHp = hero.currentStats.maxHp;
  
  // Set Boss properties
  let bossName = 'Vệ Binh Golem';
  let bossMaxHp = 1200;
  let bossAttack = 22;
  let bossDefense = 12;
  let bossSpeed = 80;
  let bossEmoji = '⛰️';
  let bossColor = 'border-blue-500/30 text-blue-400';

  if (activeDungeonId === 'dungeon_2') {
    bossName = 'Ma Thần Lửa Efreet';
    bossMaxHp = 4500;
    bossAttack = 56;
    bossDefense = 26;
    bossSpeed = 105;
    bossEmoji = '🔥';
    bossColor = 'border-orange-500/30 text-orange-400';
  } else if (activeDungeonId === 'dungeon_3') {
    bossName = 'Ancient Shadow Dragon';
    bossMaxHp = 18000;
    bossAttack = 175;
    bossDefense = 75;
    bossSpeed = 110;
    bossEmoji = '🐉';
    bossColor = 'border-purple-500/30 text-purple-400';
  }

  // Combat States
  const [heroHp, setHeroHp] = useState(maxHeroHp);
  const [bossHp, setBossHp] = useState(bossMaxHp);
  const [heroRage, setHeroRage] = useState(0);
  const [potionCd, setPotionCd] = useState(0);
  const [battleLogs, setBattleLogs] = useState<string[]>([]);
  const [damageNumbers, setDamageNumbers] = useState<DamageNumber[]>([]);
  const [isEnded, setIsEnded] = useState<'victory' | 'defeat' | null>(null);
  const [activeEffect, setActiveEffect] = useState<'hero_hit' | 'boss_hit' | 'ult_knight' | 'ult_mage' | 'ult_assassin' | null>(null);

  // References for tickers
  const battleEndTriggered = useRef(false);
  const logsContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs
  useEffect(() => {
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [battleLogs]);

  // Cooldown timers
  useEffect(() => {
    if (potionCd > 0) {
      const timer = setTimeout(() => setPotionCd(potionCd - 1), 100);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [potionCd]);

  // Main combat logic simulation loop
  useEffect(() => {
    if (isEnded) return;

    // Speeds and cooldowns
    const heroSpeed = hero.currentStats.speed;
    const heroCooldown = Math.max(1000, 30000 / heroSpeed); // cooldown in ms (e.g. 100 speed -> 300ms)
    const bossCooldown = Math.max(1000, 30000 / bossSpeed);

    let heroTimer = 0;
    let bossTimer = 0;

    // Log match start
    addLog(
      language === 'vi'
        ? `⚔️ Trận chiến bắt đầu! Đối đầu với [${bossName}] (HP: ${bossMaxHp})`
        : `⚔️ Match started! Facing [${bossName}] (HP: ${bossMaxHp})`
    );

    const mainInterval = setInterval(() => {
      if (isEnded || battleEndTriggered.current) return;

      heroTimer += 100;
      bossTimer += 100;

      // --- AUTO POTION AUDIT ---
      if (heroHp < maxHeroHp * 0.35 && hero.autoUsePotion && hero.potions && hero.potions > 0 && potionCd === 0) {
        triggerPotion();
      }

      // --- HERO ATTACK ---
      if (heroTimer >= heroCooldown) {
        heroTimer = 0;
        
        // Check if Rage is full for Ultimate
        if (heroRage >= 100) {
          setHeroRage(0);
          
          // Ultimate Skill activation
          const ultMult = hero.heroClass === 'mage' ? 4.0 : hero.heroClass === 'assassin' ? 5.0 : 3.5;
          const rawDmg = Math.round(hero.currentStats.attack * ultMult);
          const isCrit = Math.random() < (hero.currentStats.critRate + 0.1);
          const finalDmg = isCrit ? Math.round(rawDmg * hero.currentStats.critDamage) : rawDmg;
          
          const nextHp = Math.max(0, bossHp - finalDmg);
          setBossHp(nextHp);

          const ultName = hero.heroClass === 'mage' 
            ? 'BÃO THIÊN THẠCH' 
            : hero.heroClass === 'assassin' 
            ? 'VÔ ẢNH BỘ' 
            : 'THẦN KIẾM TRẢM';

          addLog(
            language === 'vi'
              ? `🔥 KỸ NĂNG NỘ: [${hero.name || 'Anh Hùng'}] kích hoạt [${ultName}] gây ${finalDmg} Sát thương${isCrit ? ' (CHÍ MẠNG!)' : ''}!`
              : `🔥 ULTIMATE: [${hero.name || 'Hero'}] unleashes [${ultName}] dealing ${finalDmg} damage${isCrit ? ' (CRITICAL!)' : ''}!`
          );

          triggerEffect(hero.heroClass === 'mage' ? 'ult_mage' : hero.heroClass === 'assassin' ? 'ult_assassin' : 'ult_knight');
          spawnDamageNumber(finalDmg.toString(), 'boss', true);

          if (nextHp <= 0) {
            handleVictory();
            clearInterval(mainInterval);
            return;
          }
        } else {
          // Standard Strike
          const isCrit = Math.random() < hero.currentStats.critRate;
          const rawDmg = Math.round(hero.currentStats.attack * (0.95 + Math.random() * 0.1));
          const finalDmg = isCrit ? Math.round(rawDmg * hero.currentStats.critDamage) : rawDmg;

          const nextHp = Math.max(0, bossHp - finalDmg);
          setBossHp(nextHp);

          // Add rage
          setHeroRage(prev => Math.min(100, prev + 20));

          addLog(
            language === 'vi'
              ? `⚔️ Anh Hùng chém thường gây ${finalDmg} Sát thương${isCrit ? ' (CHÍ MẠNG!)' : ''}`
              : `⚔️ Hero strikes dealing ${finalDmg} damage${isCrit ? ' (CRITICAL!)' : ''}`
          );

          triggerEffect('boss_hit');
          spawnDamageNumber(finalDmg.toString(), 'boss', isCrit);

          if (nextHp <= 0) {
            handleVictory();
            clearInterval(mainInterval);
            return;
          }
        }
      }

      // --- BOSS ATTACK ---
      if (bossTimer >= bossCooldown) {
        bossTimer = 0;

        // Boss Strike (Deduct defense)
        const finalDmg = Math.max(5, Math.round(bossAttack - hero.currentStats.defense * 0.5));
        const nextHp = Math.max(0, heroHp - finalDmg);
        setHeroHp(nextHp);

        addLog(
          language === 'vi'
            ? `💥 [${bossName}] quật đuôi húc mạnh mất ${finalDmg} HP.`
            : `💥 [${bossName}] slams Hero losing ${finalDmg} HP.`
        );

        triggerEffect('hero_hit');
        spawnDamageNumber(finalDmg.toString(), 'hero', false);

        if (nextHp <= 0) {
          handleDefeat();
          clearInterval(mainInterval);
          return;
        }
      }

    }, 100);

    return () => clearInterval(mainInterval);
  }, [heroHp, bossHp, heroRage, isEnded]);

  const addLog = (msg: string) => {
    setBattleLogs(prev => [...prev, msg]);
  };

  const triggerEffect = (eff: typeof activeEffect) => {
    setActiveEffect(eff);
    setTimeout(() => setActiveEffect(null), 550);
  };

  const spawnDamageNumber = (dmgText: string, target: 'hero' | 'boss', isSpecial: boolean) => {
    const id = Math.random().toString();
    const x = target === 'hero' ? 25 + Math.random() * 20 : 60 + Math.random() * 20; // percentages
    const y = 35 + Math.random() * 15;
    const type = isSpecial ? 'ult' : target === 'hero' ? 'boss_deal' : 'hero_deal';
    
    setDamageNumbers(prev => [...prev, { id, text: dmgText, type, x, y }]);
    setTimeout(() => {
      setDamageNumbers(prev => prev.filter(num => num.id !== id));
    }, 950);
  };

  const triggerPotion = () => {
    if (potionCd > 0 || (hero.potions ?? 0) <= 0) return;
    
    const success = usePotionInDungeon();
    if (success) {
      setPotionCd(100); // 10 seconds (100 * 100ms)
      const healValue = Math.round(maxHeroHp * 0.3);
      setHeroHp(prev => Math.min(maxHeroHp, prev + healValue));
      
      addLog(
        language === 'vi'
          ? `🧪 BƠM MÁU: Sử dụng bình HP, hồi phục +${healValue} HP!`
          : `🧪 POTION USE: Used potion, recovered +${healValue} HP!`
      );

      const id = Math.random().toString();
      setDamageNumbers(prev => [...prev, { id, text: `+${healValue}`, type: 'heal', x: 35, y: 40 }]);
      setTimeout(() => {
        setDamageNumbers(prev => prev.filter(num => num.id !== id));
      }, 950);
    }
  };

  const handleVictory = () => {
    if (battleEndTriggered.current) return;
    battleEndTriggered.current = true;
    setIsEnded('victory');
  };

  const handleDefeat = () => {
    if (battleEndTriggered.current) return;
    battleEndTriggered.current = true;
    setIsEnded('defeat');
  };

  // Close modals inside victory or defeat wrappers
  const handleVictoryClaim = () => {
    onDungeonVictory(activeDungeonId);
  };

  const handleDefeatClose = () => {
    onDungeonDefeat();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4 select-none">
      
      {/* Background themed neon glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Main Container Card */}
      <div className="w-full max-w-3xl bg-slate-900/60 border border-slate-800 rounded-3xl p-5 md:p-6 shadow-2xl relative flex flex-col h-[90vh] max-h-[750px] overflow-hidden">
        
        {/* Floating animated particles / Damage Numbers */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-25">
          {damageNumbers.map((num) => (
            <div
              key={num.id}
              className={`absolute font-black tracking-wider text-sm md:text-xl animate-float-up transition-all duration-1000 ${
                num.type === 'heal' 
                  ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]'
                  : num.type === 'ult'
                  ? 'text-yellow-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.8)] scale-125'
                  : num.type === 'boss_deal'
                  ? 'text-rose-500 drop-shadow-[0_0_6px_rgba(244,63,94,0.5)]'
                  : 'text-slate-100'
              }`}
              style={{ left: `${num.x}%`, top: `${num.y}%` }}
            >
              {num.type === 'heal' ? '💚' : ''} {num.text}
            </div>
          ))}

          {/* Flash overlays */}
          {activeEffect === 'hero_hit' && <div className="absolute inset-0 bg-red-600/10 z-30 animate-pulse pointer-events-none" />}
          {activeEffect === 'boss_hit' && <div className="absolute inset-0 bg-blue-600/5 z-30 pointer-events-none" />}
          {activeEffect?.startsWith('ult') && (
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/15 via-white/10 to-yellow-500/15 z-35 flex items-center justify-center pointer-events-none">
              <span className="text-xl md:text-3xl font-black text-yellow-400 uppercase tracking-[0.2em] animate-ping">
                {activeEffect === 'ult_mage' && '☄️ METEOR EXPLOSION'}
                {activeEffect === 'ult_assassin' && '🗡️ PHANTOM EXECUTION'}
                {activeEffect === 'ult_knight' && '⚔️ HOLY SWORD SLASH'}
              </span>
            </div>
          )}
        </div>

        {/* Modal Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4 shrink-0 z-10">
          <div className="flex items-center gap-2">
            <span className="text-lg">⚔️</span>
            <div>
              <h2 className="text-xs md:text-sm font-black text-white uppercase tracking-wider">
                {language === 'vi' ? 'ĐIỆN THỬ THÁCH PHÓ BẢN' : 'CHALLENGE ARENA'}
              </h2>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                {language === 'vi' ? 'Không thể thoát giữa trận đấu' : 'Cannot escape during active combat'}
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 bg-red-500/15 border border-red-500/25 rounded-lg text-[9px] font-extrabold text-red-400 uppercase tracking-wider animate-pulse">
            LIVE BATTLE
          </span>
        </div>

        {/* BATTLEGROUND GRID */}
        <div className="grid grid-cols-2 gap-4 shrink-0 relative z-10">
          {/* HERO PANEL */}
          <div className={`p-3 bg-slate-950/50 border rounded-2xl flex flex-col items-center text-center relative overflow-hidden transition-all ${
            activeEffect === 'hero_hit' ? 'border-red-500 bg-red-950/10' : 'border-slate-850'
          }`}>
            <div className="relative w-12 h-12 md:w-16 md:h-16 flex items-center justify-center bg-slate-900 border border-slate-800 rounded-2xl mb-2">
              <ItemGraphic 
                templateId={
                  hero.heroClass === 'mage' 
                    ? 't_wpn_apprentice_staff' 
                    : hero.heroClass === 'assassin' 
                    ? 't_wpn_steel_daggers' 
                    : 't_wpn_steel'
                } 
                className="w-8 h-8 md:w-12 md:h-12" 
              />
              <span className="absolute bottom-1 right-1 text-sm">
                {hero.heroClass === 'mage' ? '🔮' : hero.heroClass === 'assassin' ? '🗡️' : '🛡️'}
              </span>
            </div>
            
            <h3 className="text-xs font-black text-slate-200 uppercase truncate max-w-full">
              {hero.name || 'Anh Hùng'}
            </h3>
            <span className="text-[9.5px] font-bold text-slate-500 mt-0.5">Lv.{hero.level}</span>

            {/* HP Bar */}
            <div className="w-full mt-3 space-y-1">
              <div className="flex justify-between text-[8px] font-bold text-slate-400">
                <span>HP</span>
                <span>{heroHp.toLocaleString()} / {maxHeroHp.toLocaleString()}</span>
              </div>
              <div className="h-2 bg-slate-950 rounded-full border border-slate-900 overflow-hidden relative">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-600 to-teal-500 rounded-full transition-all duration-150"
                  style={{ width: `${(heroHp / maxHeroHp) * 100}%` }}
                />
              </div>
            </div>

            {/* Rage Bar (Ultimate Charge) */}
            <div className="w-full mt-2.5 space-y-1">
              <div className="flex justify-between text-[8px] font-bold text-slate-400">
                <span>{language === 'vi' ? 'NỘ KHÍ' : 'RAGE'}</span>
                <span>{heroRage}%</span>
              </div>
              <div className="h-1.5 bg-slate-950 rounded-full border border-slate-900 overflow-hidden relative">
                <div 
                  className={`h-full bg-amber-500 rounded-full transition-all duration-300 ${
                    heroRage >= 100 ? 'animate-pulse bg-gradient-to-r from-yellow-400 to-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]' : ''
                  }`}
                  style={{ width: `${heroRage}%` }}
                />
              </div>
            </div>
          </div>

          {/* BOSS PANEL */}
          <div className={`p-3 bg-slate-950/50 border rounded-2xl flex flex-col items-center text-center relative overflow-hidden transition-all ${
            activeEffect === 'boss_hit' ? 'border-blue-500' : bossColor
          }`}>
            <div className="relative w-12 h-12 md:w-16 md:h-16 flex items-center justify-center bg-slate-900 border border-slate-800 rounded-2xl mb-2 text-3xl filter drop-shadow">
              {bossEmoji}
            </div>

            <h3 className="text-xs font-black text-slate-200 uppercase truncate max-w-full">
              {bossName}
            </h3>
            <span className="text-[9.5px] font-bold text-red-400 mt-0.5">BOSS REALM</span>

            {/* HP Bar */}
            <div className="w-full mt-3 space-y-1">
              <div className="flex justify-between text-[8px] font-bold text-slate-400">
                <span>HP</span>
                <span>{bossHp.toLocaleString()} / {bossMaxHp.toLocaleString()}</span>
              </div>
              <div className="h-2 bg-slate-950 rounded-full border border-slate-900 overflow-hidden relative">
                <div 
                  className="h-full bg-gradient-to-r from-rose-600 to-red-500 rounded-full transition-all duration-150"
                  style={{ width: `${(bossHp / bossMaxHp) * 100}%` }}
                />
              </div>
            </div>

            {/* Boss combat stats badges */}
            <div className="flex gap-1.5 mt-3">
              <span className="bg-slate-900 border border-slate-950 px-1 rounded text-[8px] text-rose-400 font-bold">
                ⚔️ {bossAttack} ATK
              </span>
              <span className="bg-slate-900 border border-slate-950 px-1 rounded text-[8px] text-blue-400 font-bold">
                🛡️ {bossDefense} DEF
              </span>
            </div>
          </div>
        </div>

        {/* ACTION PANEL (POTIONS & INTERACTION) */}
        <div className="mt-4 flex gap-3 shrink-0 relative z-10">
          <button
            onClick={triggerPotion}
            disabled={potionCd > 0 || (hero.potions ?? 0) <= 0 || isEnded !== null}
            className={`flex-1 py-3 rounded-2xl border font-black text-xs uppercase tracking-widest transition flex items-center justify-center gap-2 cursor-pointer ${
              potionCd > 0 || (hero.potions ?? 0) <= 0
                ? 'bg-slate-950/60 border-slate-900 text-slate-600 cursor-not-allowed'
                : 'bg-emerald-600/15 border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-400 active:scale-[0.98]'
            }`}
          >
            <span>🧪</span>
            <span>
              {potionCd > 0 
                ? (language === 'vi' ? `HỒI: ${Math.ceil(potionCd / 10)}s` : `CD: ${Math.ceil(potionCd / 10)}s`) 
                : (language === 'vi' ? `Bơm Máu (🧪 x${hero.potions ?? 0})` : `Use Potion (🧪 x${hero.potions ?? 0})`)}
            </span>
          </button>
          
          <label className="flex items-center justify-center gap-2 px-4 bg-slate-950/40 border border-slate-850 rounded-2xl cursor-pointer hover:bg-slate-900/40 transition">
            <input 
              type="checkbox"
              checked={hero.autoUsePotion ?? false}
              disabled={true} // bound to settings profile
              className="w-3.5 h-3.5 accent-emerald-500 rounded border border-slate-800 bg-slate-950"
            />
            <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">
              {language === 'vi' ? 'HP < 35% Auto' : 'HP < 35% Auto'}
            </span>
          </label>
        </div>

        {/* COMBAT FEED LOG */}
        <div className="mt-4 flex-1 bg-slate-950/80 border border-slate-900 rounded-2xl p-3 overflow-hidden flex flex-col relative z-10">
          <span className="block text-[8.5px] text-slate-500 font-extrabold uppercase tracking-widest border-b border-slate-900 pb-1.5 shrink-0">
            📰 {language === 'vi' ? 'BÁO CÁO CHIẾN ĐẦU' : 'COMBAT TRANSCRIPT'}
          </span>
          <div 
            ref={logsContainerRef}
            className="flex-1 overflow-y-auto mt-2 space-y-1.5 pr-1 font-mono text-[9.5px] md:text-[10.5px] leading-relaxed"
          >
            {battleLogs.map((log, index) => {
              let textClass = 'text-slate-400';
              if (log.includes('🔥 KỸ NĂNG NỘ') || log.includes('🔥 ULTIMATE')) {
                textClass = 'text-yellow-450 font-bold';
              } else if (log.includes('⚔️')) {
                textClass = 'text-slate-200';
              } else if (log.includes('💥')) {
                textClass = 'text-rose-450';
              } else if (log.includes('🧪')) {
                textClass = 'text-emerald-400 font-semibold';
              }
              return (
                <div key={index} className={textClass}>
                  {log}
                </div>
              );
            })}
          </div>
        </div>

        {/* END SCREEN OVERLAYS */}
        {isEnded === 'victory' && (
          <div className="absolute inset-0 bg-slate-950/95 z-40 rounded-3xl flex flex-col items-center justify-center p-6 text-center animate-fade-in">
            {/* Spinning rays background glow */}
            <div className="absolute w-80 h-80 bg-[radial-gradient(circle,rgba(245,158,11,0.18)_0%,transparent_75%)] animate-pulse pointer-events-none" />

            <div className="w-16 h-16 rounded-full bg-gradient-to-b from-amber-400/20 to-yellow-600/10 border-2 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.35)] flex items-center justify-center text-3xl mb-4 animate-bounce">
              🏆
            </div>

            <h2 className="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 uppercase tracking-[0.2em] drop-shadow-[0_0_10px_rgba(245,158,11,0.25)]">
              {language === 'vi' ? 'VIỆT ẢI CHIẾN THẮNG' : 'DUNGEON CLEARED'}
            </h2>
            <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-amber-500/60 to-transparent mt-1 mb-4" />
            
            <p className="text-xs text-slate-400 max-w-sm mb-6 leading-relaxed font-semibold">
              {language === 'vi' 
                ? `Chúc mừng! Bạn đã chinh phục thành công [${bossName}] và bảo vệ được kho báu cổ xưa.`
                : `Congratulations! You conquered [${bossName}] and secured the ancient chest.`}
            </p>

            {/* Gems Reward Display Card */}
            <div className="bg-slate-900 border border-slate-850 p-4 rounded-2xl w-full max-w-xs mb-8 flex flex-col items-center gap-2.5">
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                {language === 'vi' ? 'VẬT PHẨM NHẬN ĐƯỢC' : 'REWARDS OBTAINED'}
              </span>
              <div className="flex gap-2.5 flex-wrap justify-center mt-1">
                {useGameStore.getState().dungeonRewardGems && 
                  Object.entries(useGameStore.getState().dungeonRewardGems || {}).map(([key, count]) => {
                    const [type, tier] = key.split('_');
                    const emoji = type === 'ruby' ? '🔴' : type === 'topaz' ? '🟡' : type === 'emerald' ? '🟢' : type === 'sapphire' ? '🔵' : '🔮';
                    const name = type === 'ruby' ? 'Hồng Ngọc' : type === 'topaz' ? 'Hoàng Ngọc' : type === 'emerald' ? 'Lục Bảo' : type === 'sapphire' ? 'Lam Bảo' : 'Thạch Anh';
                    return (
                      <span key={key} className="bg-slate-950 border border-slate-900 rounded-xl px-2.5 py-1 text-xs font-black text-white flex items-center gap-1.5 shadow">
                        <span>{emoji}</span>
                        <span>{name} C.{tier}</span>
                        <span className="text-[10px] text-amber-500 ml-1">x{count}</span>
                      </span>
                    );
                  })
                }
              </div>
            </div>

            <button
              onClick={handleVictoryClaim}
              className="px-8 py-3.5 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 border border-yellow-500/30 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition shadow-lg shadow-yellow-600/10 active:scale-[0.98] cursor-pointer relative z-10"
            >
              {language === 'vi' ? 'NHẬN THƯỞNG & ĐÓNG' : 'CLAIM REWARDS & CLOSE'}
            </button>
          </div>
        )}

        {isEnded === 'defeat' && (
          <div className="absolute inset-0 bg-slate-950/95 z-40 rounded-3xl flex flex-col items-center justify-center p-6 text-center animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-red-950/20 border-2 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.25)] flex items-center justify-center text-3xl mb-4">
              💀
            </div>

            <h2 className="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-rose-600 uppercase tracking-[0.2em] drop-shadow-[0_0_10px_rgba(239,68,68,0.2)]">
              {language === 'vi' ? 'THẤT BẠI TRONG PHÓ BẢN' : 'CHALLENGE FAILED'}
            </h2>
            <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-red-500/60 to-transparent mt-1 mb-4" />
            
            <p className="text-xs text-slate-400 max-w-sm mb-8 leading-relaxed font-semibold">
              {language === 'vi' 
                ? 'Bạn đã bị hạ gục bởi sức mạnh quá lớn của Boss phó bản. Hãy nâng cấp trang bị, ghép ngọc và thử lại!'
                : 'You were defeated by the boss. Reforge your equipment, fuse gems and try again!'}
            </p>

            <button
              onClick={handleDefeatClose}
              className="px-8 py-3.5 bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-350 hover:text-white font-black text-xs uppercase tracking-widest rounded-2xl transition active:scale-[0.98] cursor-pointer"
            >
              {language === 'vi' ? 'QUAY LẠI ẢI CHÍNH' : 'RETURN TO MAIN STAGE'}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
