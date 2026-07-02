import React, { useState, useEffect } from 'react';
import { useGameStore } from '../stores/gameStore';
import { useTranslation, getTranslatedItemName } from '../utils/i18n';
import { ItemGraphic } from './ItemGraphic';

export const SummonResultOverlay: React.FC = () => {
  const { activeSummonResult, setActiveSummonResult } = useGameStore();
  const { t } = useTranslation();
  const [phase, setPhase] = useState<'closed' | 'shaking' | 'flash' | 'reveal' | 'grid'>('closed');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showRarityIntro, setShowRarityIntro] = useState(false);

  useEffect(() => {
    // Reset state when new results are loaded
    if (activeSummonResult) {
      setPhase('closed');
      setCurrentIndex(0);
      setShowRarityIntro(false);
    }
  }, [activeSummonResult]);

  if (!activeSummonResult || activeSummonResult.length === 0) return null;

  const currentItem = activeSummonResult[currentIndex];

  const handleOpenChest = () => {
    setPhase('shaking');
    // Shake for 1.2s then flash
    setTimeout(() => {
      setPhase('flash');
      // Flash for 0.6s then reveal
      setTimeout(() => {
        setPhase('reveal');
        setShowRarityIntro(true);
        // Fade out intro flash after 1s
        setTimeout(() => setShowRarityIntro(false), 1000);
      }, 600);
    }, 1200);
  };

  const handleNext = () => {
    if (currentIndex < activeSummonResult.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setShowRarityIntro(true);
      setTimeout(() => setShowRarityIntro(false), 800);
    } else {
      if (activeSummonResult.length > 1) {
        setPhase('grid');
      } else {
        setActiveSummonResult(null);
      }
    }
  };

  const isLegendary = currentItem?.rarity === 'legendary';
  const isEpic = currentItem?.rarity === 'epic';

  const getRarityBackground = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return 'from-amber-950/60 via-slate-950 to-orange-950/60 border-amber-500/80 shadow-[0_0_60px_rgba(245,158,11,0.35)]';
      case 'epic':
        return 'from-purple-950/60 via-slate-950 to-indigo-950/60 border-purple-500/70 shadow-[0_0_40px_rgba(168,85,247,0.25)]';
      case 'rare':
        return 'from-blue-950/50 via-slate-950 to-slate-900 border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.2)]';
      case 'uncommon':
        return 'from-emerald-950/30 via-slate-950 to-slate-900 border-emerald-500/30';
      default:
        return 'from-slate-900 via-slate-950 to-slate-900 border-slate-800';
    }
  };

  const getRarityTextGlow = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return 'text-amber-400 neon-text-gold font-black';
      case 'epic':
        return 'text-purple-400 font-extrabold';
      case 'rare':
        return 'text-blue-400 font-bold';
      case 'uncommon':
        return 'text-emerald-400 font-semibold';
      default:
        return 'text-slate-400';
    }
  };

  const getRarityLabel = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return '👑 HUYỀN THOẠI';
      case 'epic': return '🟣 SỬ THI';
      case 'rare': return '🔵 HIẾM';
      case 'uncommon': return '🟢 TỐT';
      default: return '⚪ THƯỜNG';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-md select-none overflow-hidden">
      {/* Background Ray Spinner for Legendary/Epic */}
      {phase === 'reveal' && (isLegendary || isEpic) && (
        <div 
          className={`absolute top-1/2 left-1/2 w-[200vw] h-[200vw] rounded-full pointer-events-none opacity-25 animate-ray-spin z-0 ${
            isLegendary 
              ? 'bg-[conic-gradient(from_0deg,transparent_10%,#f59e0b_45%,#fbbf24_55%,transparent_90%)]' 
              : 'bg-[conic-gradient(from_0deg,transparent_10%,#a855f7_45%,#c084fc_55%,transparent_90%)]'
          }`}
        />
      )}

      {/* Screen Shake Shockwave Overlay on Legendary Reveal */}
      {showRarityIntro && isLegendary && (
        <div className="absolute inset-0 bg-white/20 z-40 pointer-events-none animate-ping duration-150" />
      )}
      {showRarityIntro && isEpic && (
        <div className="absolute inset-0 bg-purple-500/10 z-40 pointer-events-none animate-pulse" />
      )}

      {/* PHASE 1 & 2: CLOSED / SHAKING */}
      {(phase === 'closed' || phase === 'shaking') && (
        <div className="text-center relative z-10 flex flex-col items-center max-w-sm px-6">
          <div className="absolute w-[280px] h-[280px] bg-purple-600/15 rounded-full blur-[60px] pointer-events-none animate-pulse" />
          
          <div 
            onClick={phase === 'closed' ? handleOpenChest : undefined}
            className={`text-8xl mb-8 relative cursor-pointer leading-none select-none transition ${
              phase === 'shaking' ? 'animate-chest-shake' : 'hover:scale-[1.08] active:scale-95'
            }`}
          >
            📦
            {phase === 'closed' && (
              <span className="absolute -top-3 -right-3 text-3xl animate-bounce">✨</span>
            )}
          </div>

          <h3 className="text-xl font-extrabold text-white mb-2 font-display uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">
            {activeSummonResult.length > 1 
              ? `HỘP PHÁP TRẬN 10X` 
              : `RƯƠNG THẦN KHÍ AETHER`
            }
          </h3>
          <p className="text-xs text-slate-400 mb-8 leading-relaxed">
            {activeSummonResult.length > 1 
              ? `Chứa 10 trang bị ngẫu nhiên phẩm chất khác nhau. Bấm vào rương để kích hoạt pháp trận mở rương!` 
              : `Chứa bảo vật chưa giám định thuộc thế giới Aether. Hãy chạm vào chiếc rương để giải ấn thần khí!`
            }
          </p>

          {phase === 'closed' && (
            <button
              onClick={handleOpenChest}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black uppercase tracking-widest py-3.5 px-8 rounded-2xl shadow-lg shadow-purple-500/15 active:scale-95 transition cursor-pointer border border-purple-400/20"
            >
              MỞ RƯƠNG THẦN KHÍ
            </button>
          )}
        </div>
      )}

      {/* PHASE 3: FLASH FLARE */}
      {phase === 'flash' && (
        <div className="absolute top-1/2 left-1/2 w-40 h-40 bg-white rounded-full pointer-events-none z-20 animate-open-flare" />
      )}

      {/* PHASE 4: CARD REVEAL */}
      {phase === 'reveal' && currentItem && (
        <div className="relative z-10 flex flex-col items-center max-w-sm w-full px-6 animate-reveal-card">
          {/* Card Frame */}
          <div className={`w-64 aspect-[3/4] rounded-3xl border bg-gradient-to-b p-5 flex flex-col justify-between items-center text-center animate-float-slow transition-all duration-300 ${getRarityBackground(currentItem.rarity)}`}>
            {/* Rarity Tag */}
            <span className={`text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-full bg-slate-950/80 border border-white/5 ${getRarityTextGlow(currentItem.rarity)}`}>
              {getRarityLabel(currentItem.rarity)}
            </span>

            {/* Graphic Icon with high-end glow */}
            <div className="relative my-4 flex items-center justify-center">
              {isLegendary && (
                <div className="absolute w-28 h-28 bg-amber-500/20 rounded-full blur-md animate-ping" />
              )}
              {isEpic && (
                <div className="absolute w-24 h-24 bg-purple-500/20 rounded-full blur-md animate-pulse" />
              )}
              <div className="w-24 h-24 bg-slate-950/60 border border-slate-900 rounded-2xl flex items-center justify-center p-3 relative z-10">
                <ItemGraphic templateId={currentItem.templateId} className="w-16 h-16" />
              </div>
            </div>

            {/* Item Details */}
            <div className="space-y-1.5 w-full">
              <h4 className="text-base font-extrabold text-white font-display tracking-wide leading-tight truncate">
                {getTranslatedItemName(t, currentItem)}
              </h4>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                {t(`slot_${currentItem.slot}`)} | Cấp {currentItem.level}
              </p>

              {/* Stats Preview */}
              <div className="bg-slate-950/80 border border-slate-900/60 rounded-xl p-2.5 grid grid-cols-2 gap-1.5 text-left mt-2">
                {Object.entries(currentItem.stats).map(([statName, val]) => {
                  if (!val) return null;
                  return (
                    <div key={statName} className="text-[9px] font-medium text-slate-400">
                      <span className="text-slate-550 block font-bold capitalize">{statName.replace('magicAttack', 'Atk Phép')}:</span>
                      <strong className="text-slate-200">+{typeof val === 'number' && val < 1 ? `${Math.round(val * 100)}%` : val}</strong>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Reveal Bottom Indicators */}
          <div className="mt-8 text-center space-y-4 w-full">
            {activeSummonResult.length > 1 && (
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">
                Vật phẩm {currentIndex + 1} / {activeSummonResult.length}
              </span>
            )}

            <button
              onClick={handleNext}
              className="w-full max-w-[200px] bg-slate-900 hover:bg-slate-850 text-white text-xs font-black uppercase tracking-widest py-3 px-6 rounded-xl border border-slate-800 active:scale-95 transition cursor-pointer shadow-lg"
            >
              {currentIndex < activeSummonResult.length - 1 ? 'TIẾP TỤC' : 'XÁC NHẬN'}
            </button>
          </div>
        </div>
      )}

      {/* PHASE 5: SUMMARY GRID (Only for 10x Pulls) */}
      {phase === 'grid' && (
        <div className="relative z-10 flex flex-col items-center max-w-lg w-full px-4 animate-reveal-card">
          <h3 className="text-lg font-black text-white uppercase tracking-widest mb-1 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">
            KẾT QUẢ TRIỆU HỒI
          </h3>
          <p className="text-[10px] text-slate-500 tracking-wider mb-6">
            Đã chuyển vào kho trang bị rảnh của bạn
          </p>

          {/* 10-Item Grid */}
          <div className="grid grid-cols-5 gap-2.5 w-full mb-8">
            {activeSummonResult.map((item, idx) => {
              const border = item.rarity === 'legendary' 
                ? 'border-amber-500 bg-amber-950/20' 
                : item.rarity === 'epic'
                ? 'border-purple-500 bg-purple-950/20'
                : item.rarity === 'rare'
                ? 'border-blue-500 bg-blue-950/10'
                : 'border-slate-850 bg-slate-900/60';

              const glow = item.rarity === 'legendary'
                ? 'shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                : item.rarity === 'epic'
                ? 'shadow-[0_0_8px_rgba(168,85,247,0.15)]'
                : '';

              return (
                <div 
                  key={idx} 
                  className={`aspect-square rounded-xl border p-2 flex flex-col items-center justify-center relative overflow-hidden select-none hover:scale-105 transition ${border} ${glow}`}
                >
                  <ItemGraphic templateId={item.templateId} className="w-10 h-10 pointer-events-none z-10" />
                  <span className="absolute bottom-1 right-1 text-[7px] font-mono font-bold text-slate-500 z-20">
                    +{item.level}
                  </span>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => setActiveSummonResult(null)}
            className="bg-gradient-to-r from-purple-650 to-indigo-650 hover:from-purple-600 hover:to-indigo-600 text-white text-xs font-black uppercase tracking-widest py-3 px-8 rounded-xl border border-purple-500/20 active:scale-95 transition cursor-pointer shadow-lg shadow-purple-500/10"
          >
            ĐỒNG Ý (XÁC NHẬN)
          </button>
        </div>
      )}
    </div>
  );
};
