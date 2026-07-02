import React from 'react';
import { useGameStore } from '../stores/gameStore';
import { getFinalItemStats, EquipmentItem, calculateItemCP, calculateDismantleRewards, GAME_ICONS } from '@idle-rpg/shared';
import { useTranslation, getTranslatedItemName } from '../utils/i18n';
import { useLanguageStore } from '../stores/languageStore';
import { ItemGraphic } from './ItemGraphic';
import { GemGraphic } from './GemGraphic';

export const ItemInfoModal: React.FC = () => {
  const {
    saveData,
    activeInspectItemId,
    setActiveInspectItemId,
    equipEquipment,
    unequipEquipment,
    upgradeEquipment,
    dismantleEquipment,
    identifyEquipment,
    insertGem,
    removeGem
  } = useGameStore();

  const { t } = useTranslation();
  const { language } = useLanguageStore();

  if (!saveData || !activeInspectItemId) return null;

  const item = saveData.inventory.find(i => i.id === activeInspectItemId);
  if (!item) return null;

  const stats = getFinalItemStats(item);
  const hero = saveData.hero;

  const renderStatValue = (key: string, colorClass = "text-blue-400") => {
    if (!stats || !item) return null;
    const finalVal = (stats as any)[key] || 0;
    const baseVal = (item.stats as any)?.[key] || 0;
    const addedVal = finalVal - baseVal;

    const format = (v: number) => {
      if (['critRate', 'critDamage', 'lifesteal', 'spellVamp', 'evasion', 'block'].includes(key)) {
        return `${Math.round(v * 100)}%`;
      }
      return `${Math.round(v * 100) / 100}%`;
    };

    if (addedVal !== 0) {
      const sign = addedVal > 0 ? '+' : '-';
      const absAdded = Math.abs(addedVal);
      const mainSign = finalVal >= 0 ? '+' : '';
      
      return (
        <span className={colorClass}>
          {mainSign}{format(finalVal)}{' '}
          <span className="text-slate-550 text-[10px] font-semibold font-mono">
            ({baseVal >= 0 ? '' : '-'}{format(Math.abs(baseVal))} {sign} <span className={addedVal > 0 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>{format(absAdded)}</span>)
          </span>
        </span>
      );
    }

    const mainSign = finalVal >= 0 ? '+' : '';
    return <span className={colorClass}>{mainSign}{format(finalVal)}</span>;
  };

  const getRarityUIStyles = (item: EquipmentItem) => {
    if (item.isCorrupted) {
      return {
        border: 'border-red-600/90 ring-1 ring-red-600/50',
        bg: 'bg-gradient-to-br from-red-950/40 via-red-900/10 to-red-950/40',
        glow: 'shadow-[0_0_15px_rgba(239,68,68,0.7)] animate-pulse',
        text: 'text-red-500 font-extrabold',
        extraElements: (
          <div className="absolute top-1 right-1 text-[8px] animate-pulse text-red-400 pointer-events-none">👿</div>
        )
      };
    }
    if (item.isCursed) {
      return {
        border: 'border-purple-600/80 ring-1 ring-purple-600/40',
        bg: 'bg-gradient-to-br from-purple-950/40 via-slate-900 to-purple-950/40',
        glow: 'shadow-[0_0_12px_rgba(147,51,234,0.5)]',
        text: 'text-purple-400 font-extrabold',
        extraElements: (
          <div className="absolute top-1 right-1 text-[8px] animate-pulse text-purple-400 pointer-events-none">💀</div>
        )
      };
    }

    switch (item.rarity) {
      case 'common':
        return {
          border: 'border-slate-850',
          bg: 'bg-slate-950/90',
          glow: '',
          text: 'text-slate-400',
          extraElements: null
        };
      case 'uncommon':
        return {
          border: 'border-emerald-500/35',
          bg: 'bg-emerald-950/20',
          glow: '',
          text: 'text-emerald-400',
          extraElements: (
            <>
              <div className="absolute top-1.5 left-1.5 w-1 h-1 bg-emerald-500/70 rounded-full pointer-events-none" />
              <div className="absolute top-1.5 right-1.5 w-1 h-1 bg-emerald-500/70 rounded-full pointer-events-none" />
              <div className="absolute bottom-1.5 left-1.5 w-1 h-1 bg-emerald-500/70 rounded-full pointer-events-none" />
              <div className="absolute bottom-1.5 right-1.5 w-1 h-1 bg-emerald-500/70 rounded-full pointer-events-none" />
            </>
          )
        };
      case 'rare':
        return {
          border: 'border-blue-500/40',
          bg: 'bg-blue-950/25',
          glow: 'shadow-[0_0_8px_rgba(59,130,246,0.2)]',
          text: 'text-blue-400',
          extraElements: (
            <>
              <div className="absolute top-1.5 left-1.5 border-t border-l border-blue-400/40 w-1.5 h-1.5 rounded-tl-sm pointer-events-none" />
              <div className="absolute bottom-1.5 right-1.5 border-b border-r border-blue-400/40 w-1.5 h-1.5 rounded-br-sm pointer-events-none" />
              <div className="absolute w-7 h-7 rounded-full border border-blue-500/5 bg-blue-500/5 pointer-events-none" />
            </>
          )
        };
      case 'epic':
        return {
          border: 'border-purple-500/70',
          bg: 'bg-purple-950/30',
          glow: 'shadow-[0_0_12px_rgba(168,85,247,0.35)]',
          text: 'text-purple-400',
          extraElements: (
            <>
              <div className="absolute inset-1 border border-purple-500/15 rounded-lg animate-pulse pointer-events-none" />
              <div className="absolute top-1 left-1 border-t border-l border-purple-400 w-2 h-2 rounded-tl-md pointer-events-none" />
              <div className="absolute top-1 right-1 border-t border-r border-purple-400 w-2 h-2 rounded-tr-md pointer-events-none" />
              <div className="absolute bottom-1 left-1 border-b border-l border-purple-400 w-2 h-2 rounded-bl-md pointer-events-none" />
              <div className="absolute bottom-1 right-1 border-b border-r border-purple-400 w-2 h-2 rounded-br-md pointer-events-none" />
              <div className="absolute w-9 h-9 rounded-full bg-purple-500/10 blur-sm animate-pulse pointer-events-none" />
            </>
          )
        };
      case 'legendary':
        return {
          border: 'border-transparent',
          bg: 'bg-gradient-to-br from-amber-500/30 via-yellow-600/15 to-orange-500/30',
          glow: 'shadow-[0_0_18px_rgba(245,158,11,0.55)] ring-1 ring-amber-400/20',
          text: 'text-amber-500 font-extrabold neon-text-gold',
          extraElements: (
            <>
              <div
                className="absolute w-[180%] h-[180%] bg-[conic-gradient(from_0deg,transparent_10%,#f59e0b_45%,#fbbf24_55%,transparent_90%)] animate-spin pointer-events-none rounded-full"
                style={{ animationDuration: '2.5s' }}
              />
              <div className="absolute inset-[1px] bg-slate-950 rounded-[11px] pointer-events-none" />
              <div className="absolute inset-0.5 bg-gradient-to-br from-amber-500/15 to-orange-600/10 rounded-[10px] pointer-events-none" />
              <div className="absolute w-10 h-10 rounded-full bg-amber-500/15 blur-sm animate-pulse pointer-events-none" />
              <div className="absolute top-1 left-1 text-[8px] animate-pulse text-amber-300 pointer-events-none">✨</div>
              <div className="absolute bottom-1 right-1.5 text-[8px] animate-pulse text-amber-300 pointer-events-none" style={{ animationDelay: '0.6s' }}>✨</div>
            </>
          )
        };
    }
  };



  const ui = getRarityUIStyles(item);

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      {/* Modal Card container */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-2xl w-full max-w-sm p-5 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-fade-in relative">

        {/* Header Block */}
        <div className="flex justify-between items-start border-b border-slate-850 pb-3 mb-4 shrink-0 pr-6">
          <div className="space-y-1">
            <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded ${ui.bg} ${ui.text}`}>
              {t('rarity_' + item.rarity)}
            </span>
            <span className="text-[10px] text-slate-500 font-bold block mt-1">
              Slot: {t('slot_' + item.slot)}
            </span>
          </div>

          <button
            onClick={() => setActiveInspectItemId(null)}
            className="absolute top-4 right-4 w-7 h-7 rounded-full bg-slate-950 hover:bg-slate-800 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white font-extrabold text-xs active:scale-95 cursor-pointer z-10"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content wrapper - Hidden scrollbar, still scrollable! */}
        <div className="flex-1 overflow-y-auto scrollbar-none space-y-4 pr-1 pb-4">

          {/* Visual card */}
          <div className={`p-4 rounded-xl border relative flex flex-col items-center justify-center select-none ${ui.border} ${ui.bg} ${ui.glow}`}>
            {ui.extraElements}
            {item.equipped && (
              <span className="absolute top-2 left-2 bg-blue-600 text-[8px] text-white px-2 py-0.5 rounded font-extrabold uppercase leading-none shadow z-10">
                {language === 'vi' ? 'ĐANG DÙNG' : 'EQUIPPED'}
              </span>
            )}

            <ItemGraphic templateId={item.templateId} isCorrupted={item.isCorrupted} isCursed={item.isCursed} isIdentified={item.isIdentified} className="w-14 h-14 mb-2 relative z-10" />
            <h4 className={`text-base font-extrabold flex items-center gap-1.5 font-display ${ui.text}`}>
              <span>{item.isIdentified === false ? `??? [${t('slot_' + item.slot)}]` : getTranslatedItemName(t, item)}</span>
              <span className="text-xs opacity-90">+{item.level}</span>
            </h4>
            {item.isIdentified !== false && (
              <span className="mt-1 text-[10px] font-extrabold bg-slate-950/80 px-2 py-0.5 rounded-full border border-slate-800 text-yellow-450 tracking-wider relative z-10 font-mono shadow">
                ⚔️ {language === 'vi' ? 'Lực chiến: ' : 'CP: '}{calculateItemCP(item).toLocaleString()}
              </span>
            )}
          </div>

          {/* Class Restriction */}
          {item.allowedClass && (
            <div className="text-[10px] font-bold bg-slate-950/60 p-2.5 rounded-xl border border-slate-900">
              <span className="text-slate-450">{language === 'vi' ? 'Yêu cầu Lớp: ' : 'Required Class: '}</span>
              <span className={hero.heroClass === item.allowedClass ? "text-emerald-400" : "text-red-400 font-extrabold animate-pulse"}>
                {item.allowedClass === 'knight' ? (language === 'vi' ? 'Hiệp Sĩ 🛡️' : 'Knight 🛡️') : item.allowedClass === 'mage' ? (language === 'vi' ? 'Pháp Sư 🔮' : 'Mage 🔮') : (language === 'vi' ? 'Sát Thủ 🗡️' : 'Assassin 🗡️')}
                {hero.heroClass !== item.allowedClass && (language === 'vi' ? ' (Không tương thích)' : ' (Incompatible)')}
              </span>
            </div>
          )}

          {/* Description */}
          <p className="text-xs text-slate-400 italic leading-relaxed bg-slate-950/40 p-3 rounded-xl border border-slate-900/60">
            {item.isCorrupted ? (
              <span className="text-red-400 font-extrabold uppercase tracking-wide">👿 {language === 'vi' ? 'Vật Phẩm Hư Hỏng: Không thể nâng cấp. Sát thương x2, nhưng rút 0.5% máu tối đa mỗi giây trong chiến đấu.' : 'Corrupted Item: Cannot upgrade. x2 Dmg, but drains 0.5% max HP per second in battle.'}</span>
            ) : item.isCursed ? (
              <span className="text-purple-400 font-extrabold uppercase tracking-wide">💀 {language === 'vi' ? 'Vật Phẩm Bị Nguyền Rủa: Tăng 150 Công nhưng trừ 80 Thủ, giảm 20% HP tối đa.' : 'Cursed Item: +150 Atk but -80 Def, -20% max HP.'}</span>
            ) : item.rarity === 'legendary'
              ? t('item_desc_legendary')
              : t('item_desc_standard', { slot: t('slot_' + item.slot).toLowerCase() })
            }
          </p>

          {/* Kills Evolution */}
          {item.kills !== undefined && item.isIdentified !== false && (
            <div className="flex justify-between items-center text-[10px] text-slate-500 bg-slate-950/40 border border-slate-900/60 px-3 py-2 rounded-xl">
              <span>🎯 Kills: <strong className="text-slate-350 font-extrabold">{item.kills.toLocaleString()}</strong></span>
              <span className="px-1.5 py-0.2 rounded bg-slate-950/80 text-slate-300 border border-slate-800 text-[8px] font-extrabold uppercase font-mono">
                {language === 'vi' ? 'BẬC: ' : 'TIER: '}{item.kills >= 100000 ? 'Ancient 🔥' : item.kills >= 10000 ? 'Veteran ⚡' : 'Standard'}
              </span>
            </div>
          )}

          {/* Quality Indicator */}
          {item.isIdentified !== false && (
            <div className="bg-slate-950/60 border border-slate-900 rounded-xl p-3 space-y-1.5">
              <div className="flex justify-between items-center text-[10px] font-bold">
                <span className="text-slate-450">{language === 'vi' ? 'Chất lượng đúc (Quality):' : 'Forge Quality:'}</span>
                <span className={`font-black font-display px-2 py-0.5 rounded text-[10px] tracking-wide ${(item.quality || 100) >= 140
                    ? 'text-amber-400 bg-amber-950/20 border border-amber-900/30'
                    : (item.quality || 100) >= 120
                      ? 'text-purple-400 bg-purple-950/20 border border-purple-900/30'
                      : (item.quality || 100) >= 100
                        ? 'text-blue-400 bg-blue-950/20 border border-blue-900/30'
                        : (item.quality || 100) >= 90
                          ? 'text-emerald-400 bg-emerald-950/20 border border-emerald-900/30'
                          : 'text-slate-400 bg-slate-950 border border-slate-800'
                  }`}>
                  {(item.quality || 100)}%
                  {language === 'vi' ? ' (' + (
                    (item.quality || 100) >= 140 ? 'Huyền Thoại' : (item.quality || 100) >= 120 ? 'Hoàn Mỹ' : (item.quality || 100) >= 100 ? 'Tinh Xảo' : (item.quality || 100) >= 90 ? 'Bình Thường' : 'Thô Sơ'
                  ) + ')' : ' (' + (
                    (item.quality || 100) >= 140 ? 'Mythic' : (item.quality || 100) >= 120 ? 'Perfect' : (item.quality || 100) >= 100 ? 'Fine' : (item.quality || 100) >= 90 ? 'Normal' : 'Crude'
                  ) + ')'}
                </span>
              </div>
              <div className="relative w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-900">
                {(() => {
                  const q = item.quality || 100;
                  // Quality range bounds based on rarity
                  let min = 80;
                  let max = 160;
                  switch (item.rarity) {
                    case 'common': min = 80; max = 100; break;
                    case 'uncommon': min = 90; max = 110; break;
                    case 'rare': min = 95; max = 120; break;
                    case 'epic': min = 100; max = 135; break;
                    case 'legendary': min = 110; max = 160; break;
                  }
                  const pct = Math.max(0, Math.min(100, ((q - min) / (max - min)) * 100));

                  let barColor = 'bg-slate-500';
                  if (q >= 140) barColor = 'bg-gradient-to-r from-amber-600 to-yellow-400';
                  else if (q >= 120) barColor = 'bg-gradient-to-r from-purple-600 to-fuchsia-400';
                  else if (q >= 100) barColor = 'bg-gradient-to-r from-blue-600 to-cyan-400';
                  else if (q >= 90) barColor = 'bg-gradient-to-r from-emerald-600 to-teal-400';

                  return (
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                      style={{ width: `${pct}%` }}
                    />
                  );
                })()}
              </div>
              <div className="flex justify-between text-[8px] text-slate-500 font-semibold font-mono">
                {(() => {
                  let min = 80;
                  let max = 100;
                  switch (item.rarity) {
                    case 'common': min = 80; max = 100; break;
                    case 'uncommon': min = 90; max = 110; break;
                    case 'rare': min = 95; max = 120; break;
                    case 'epic': min = 100; max = 135; break;
                    case 'legendary': min = 110; max = 160; break;
                  }
                  return (
                    <>
                      <span>Min: {min}%</span>
                      <span className="text-slate-550">{language === 'vi' ? 'Khoảng chỉ số của phẩm chất này' : 'Stat range for this rarity'}</span>
                      <span>Max: {max}%</span>
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Stats Attributes */}
          <div className="bg-slate-950/60 border border-slate-900 rounded-xl p-3.5 space-y-2">
            <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider border-b border-slate-900 pb-1">
              {t('core_attributes')}
            </span>

            {item.isIdentified === false ? (
              <div className="text-center py-2 text-amber-500/80 text-[10px] font-bold italic animate-pulse">
                ✨ {language === 'vi' ? 'Vật phẩm chưa giám định. Hãy giám định để khai phá sức mạnh ẩn!' : 'Unidentified item. Identify to unlock attributes!'}
              </div>
            ) : (
              <div className="space-y-1.5">
                {stats && stats.attack > 0 && (
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-450">{t('attack_power')}</span>
                    {renderStatValue('attack', 'text-blue-400')}
                  </div>
                )}
                {stats && stats.magicAttack !== undefined && stats.magicAttack > 0 && (
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-450">{t('magic_attack')}</span>
                    {renderStatValue('magicAttack', 'text-violet-400')}
                  </div>
                )}
                {stats && stats.maxHp > 0 && (
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-455">{t('max_health')}</span>
                    {renderStatValue('maxHp', 'text-emerald-400')}
                  </div>
                )}
                {stats && stats.defense !== 0 && (
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-455">{t('defense_rating')}</span>
                    {renderStatValue('defense', stats.defense > 0 ? 'text-indigo-400' : 'text-purple-400')}
                  </div>
                )}
                {stats && stats.magicResist !== undefined && stats.magicResist !== 0 && (
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-455">{t('magic_resist')}</span>
                    {renderStatValue('magicResist', stats.magicResist > 0 ? 'text-fuchsia-400' : 'text-purple-400')}
                  </div>
                )}
                {stats && stats.speed > 0 && (
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-455">{t('attack_speed')}</span>
                    {renderStatValue('speed', 'text-cyan-400')}
                  </div>
                )}
                {stats && stats.critRate > 0 && (
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-455">{t('critical_rate')}</span>
                    {renderStatValue('critRate', 'text-amber-400')}
                  </div>
                )}
                {stats && stats.lifesteal !== undefined && stats.lifesteal > 0 && (
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-455">{t('lifesteal')}</span>
                    {renderStatValue('lifesteal', 'text-red-400')}
                  </div>
                )}
                {stats && stats.spellVamp !== undefined && stats.spellVamp > 0 && (
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-455">{t('spell_vamp')}</span>
                    {renderStatValue('spellVamp', 'text-violet-400')}
                  </div>
                )}
                {stats && stats.evasion !== undefined && stats.evasion > 0 && (
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-455">{t('evasion')}</span>
                    {renderStatValue('evasion', 'text-sky-400')}
                  </div>
                )}
                {stats && stats.block !== undefined && stats.block > 0 && (
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-455">{t('block')}</span>
                    {renderStatValue('block', 'text-amber-500')}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sockets khảm ngọc */}
          {item.isIdentified !== false && item.sockets && item.sockets.length > 0 && (
            <div className="bg-slate-950/60 border border-slate-900 rounded-xl p-3.5">
              <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2.5 border-b border-slate-900 pb-1">
                💎 {language === 'vi' ? 'Ô KHẢM NGỌC' : 'GEMS/SOCKETS'} ({item.sockets.filter(Boolean).length} / {item.sockets.length})
              </span>
              {hero.level < 5 ? (
                <div className="flex flex-col items-center justify-center p-4 bg-slate-900/10 border border-dashed border-slate-800/60 rounded-lg select-none">
                  <span className="text-base mb-1">🔒</span>
                  <span className="text-[9px] font-extrabold uppercase text-slate-500 tracking-wider text-center">
                    {language === 'vi' ? 'Khóa đến Cấp 5' : 'Locked until Level 5'}
                  </span>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {item.sockets.map((gem, idx) => {
                    // Calculate owned gems
                    const ownedGemsList = Object.entries(hero.gems || {})
                      .filter(([_, qty]) => qty > 0)
                      .map(([key, qty]) => {
                        const [type, tierStr] = key.split('_');
                        const tier = parseInt(tierStr) || 1;
                        const emoji = type === 'ruby' ? '🔴' : type === 'topaz' ? '🟡' : type === 'emerald' ? '🟢' : type === 'sapphire' ? '🔵' : '🔮';
                        const name = type === 'ruby' ? 'Hồng Ngọc' : type === 'topaz' ? 'Hoàng Ngọc' : type === 'emerald' ? 'Lục Bảo' : type === 'sapphire' ? 'Lam Bảo' : 'Thạch Anh';
                        return { key, type, tier, qty, emoji, name };
                      });

                    let gemType = '';
                    let gemTier = 1;
                    let gemName = '';
                    let statsDesc = '';

                    if (gem) {
                      const [t, tierStr] = gem.split('_');
                      gemType = t;
                      gemTier = parseInt(tierStr) || 1;
                      gemName = gemType === 'ruby' ? 'Hồng Ngọc' : gemType === 'topaz' ? 'Hoàng Ngọc' : gemType === 'emerald' ? 'Lục Bảo' : gemType === 'sapphire' ? 'Lam Bảo' : 'Thạch Anh';

                      if (gemType === 'ruby') {
                        const vals = [5, 10, 15, 20, 25];
                        statsDesc = `+${vals[gemTier - 1] || 5}% ATK`;
                      } else if (gemType === 'topaz') {
                        const vals = [5, 10, 15, 20, 25];
                        statsDesc = `+${vals[gemTier - 1] || 5}% M.ATK`;
                      } else if (gemType === 'emerald') {
                        const vals = [10, 20, 30, 40, 50];
                        statsDesc = `+${vals[gemTier - 1] || 10}% HP`;
                      } else if (gemType === 'sapphire') {
                        const vals = [5, 10, 15, 20, 25];
                        statsDesc = `+${vals[gemTier - 1] || 5}% DEF`;
                      } else if (gemType === 'amethyst') {
                        const rates = [2, 4, 6, 8, 10];
                        const dmgs = [5, 10, 15, 20, 25];
                        statsDesc = `+${rates[gemTier - 1]}% CRIT, +${dmgs[gemTier - 1]}% CRIT DMG`;
                      }
                    }

                    return (
                      <div key={idx} className="flex flex-col gap-1 w-full">
                        <span className="text-[8px] text-slate-500 font-extrabold block">
                          {language === 'vi' ? `Ô KHẢM #${idx + 1}:` : `SOCKET #${idx + 1}:`}
                        </span>
                        {gem ? (
                          <div className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-950/80 border border-slate-900 shadow-inner gap-2">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded bg-slate-900 flex items-center justify-center p-1 border border-slate-850/60 shadow-inner">
                                <GemGraphic type={gemType} tier={gemTier} className="w-6 h-6" />
                              </div>
                              <div className="text-[10px]">
                                <span className="font-extrabold text-slate-200 block leading-tight">
                                  {gemName} Cấp {gemTier}
                                </span>
                                <span className="text-slate-400 font-semibold text-[8px] mt-0.5 block">
                                  {statsDesc}
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => removeGem(item.id, idx)}
                              disabled={hero.gold < 50}
                              className="px-2.5 py-1 bg-red-950/20 hover:bg-red-900/35 border border-red-500/20 hover:border-red-500/50 disabled:opacity-40 disabled:pointer-events-none text-[8.5px] font-black text-red-400 rounded-lg transition active:scale-95 cursor-pointer shrink-0"
                            >
                              {language === 'vi' ? `Tháo (50 ${GAME_ICONS.GOLD})` : `Remove (50 ${GAME_ICONS.GOLD})`}
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-1.5 w-full bg-slate-900/20 p-2.5 rounded-xl border border-slate-950">
                            <span className="text-[8.5px] text-slate-400 font-black uppercase tracking-wider block">
                              {language === 'vi' ? `Khảm ngọc (Phí: 100 Vàng ${GAME_ICONS.GOLD}):` : `Slot Gem (Fee: 100 Gold ${GAME_ICONS.GOLD}):`}
                            </span>

                            {ownedGemsList.length === 0 ? (
                              <div className="text-center py-2 text-[8.5px] text-slate-550 font-bold italic select-none">
                                {language === 'vi' ? '⚠️ Không có ngọc sẵn có trong kho!' : '⚠️ No gems available in inventory!'}
                              </div>
                            ) : (
                              <div className="grid grid-cols-2 gap-1.5 max-h-[120px] overflow-y-auto pr-0.5">
                                {ownedGemsList.map((g) => (
                                  <button
                                    key={g.key}
                                    onClick={() => insertGem(item.id, g.key, idx)}
                                    disabled={hero.gold < 100}
                                    className="flex justify-between items-center p-1.5 rounded-lg bg-slate-950/70 border border-slate-900 hover:bg-slate-900 hover:border-slate-800 transition text-[9px] active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none cursor-pointer text-left gap-2"
                                  >
                                    <span className="font-extrabold text-slate-200 flex items-center gap-1.5">
                                      <GemGraphic type={g.type} tier={g.tier} className="w-4 h-4 shrink-0" />
                                      <span>{g.name} C.{g.tier}</span>
                                    </span>
                                    <span className="text-[8.5px] font-black text-slate-500 bg-slate-950 px-1 rounded border border-slate-900 ml-1">
                                      x{g.qty}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Action buttons */}
        <div className="pt-3 border-t border-slate-850 shrink-0 space-y-2">
          <div className="flex justify-between items-center px-1 text-[10px] text-slate-400 font-extrabold uppercase mb-1">
            <span>{language === 'vi' ? 'Vàng hiện có:' : 'Current Gold:'}</span>
            <span className="text-yellow-450 font-black font-mono">
              {hero.gold.toLocaleString()} {GAME_ICONS.GOLD}
            </span>
          </div>
          {item.isIdentified === false ? (
            <button
              onClick={() => identifyEquipment(item.id)}
              disabled={hero.gold < 200}
              className="w-full bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-slate-950 text-xs font-extrabold py-3 px-4 rounded-xl border border-amber-400/20 active:scale-[0.98] transition disabled:opacity-40 disabled:pointer-events-none flex justify-between items-center cursor-pointer"
            >
              <span>✨ {language === 'vi' ? 'GIÁM ĐỊNH VẬT PHẨM' : 'IDENTIFY EQUIPMENT'}</span>
              <span className="bg-slate-950/40 text-amber-950 px-2 py-0.5 rounded border border-amber-500/10 font-bold font-mono">
                200 {GAME_ICONS.GOLD}
              </span>
            </button>
          ) : (
            <>
              <div className="flex gap-2">
                {item.equipped ? (
                  <button
                    onClick={() => {
                      unequipEquipment(item.id);
                    }}
                    className="flex-1 bg-slate-800 hover:bg-slate-750 text-white text-xs font-bold py-2.5 rounded-xl border border-slate-700 transition active:scale-[0.98] cursor-pointer"
                  >
                    {t('unequip_btn')}
                  </button>
                ) : (
                  (() => {
                    const isClassIncompatible = item.allowedClass && hero.heroClass && item.allowedClass !== hero.heroClass;
                    return (
                      <button
                        onClick={() => {
                          equipEquipment(item.id);
                        }}
                        disabled={!!isClassIncompatible}
                        className={`flex-1 text-xs font-bold py-2.5 rounded-xl transition active:scale-[0.98] cursor-pointer ${isClassIncompatible
                            ? 'bg-slate-800 text-slate-500 border border-slate-900/60 cursor-not-allowed opacity-50'
                            : 'bg-blue-600 hover:bg-blue-500 text-white border border-blue-500/20'
                          }`}
                      >
                        {isClassIncompatible ? (language === 'vi' ? 'Sai Class 🔒' : 'Class Locked 🔒') : t('equip_btn')}
                      </button>
                    );
                  })()
                )}

              </div>

              {!item.equipped && (
                <button
                  onClick={() => {
                    dismantleEquipment(item.id);
                  }}
                  className="w-full bg-purple-650/15 hover:bg-purple-650/25 border border-purple-500/30 text-purple-300 text-xs font-extrabold py-2.5 rounded-xl transition cursor-pointer active:scale-95 flex justify-between items-center px-4"
                >
                  <span>♻️ {language === 'vi' ? 'PHÂN RÃ TRANG BỊ' : 'SALVAGE EQUIPMENT'}</span>
                  <span className="bg-slate-950/40 text-purple-300 px-2 py-0.5 rounded border border-purple-500/10 font-bold font-mono">
                    +{calculateDismantleRewards(item)} {GAME_ICONS.AETHER}
                  </span>
                </button>
              )}

              <button
                onClick={() => upgradeEquipment(item.id)}
                disabled={hero.gold < item.upgradeCost || item.isCorrupted}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold py-3 px-4 rounded-xl border border-emerald-400/20 active:scale-[0.98] transition disabled:opacity-40 disabled:pointer-events-none flex justify-between items-center cursor-pointer"
              >
                <span>🚀 {t('upgrade_btn')}</span>
                <span className="bg-slate-950/40 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/10 font-bold font-mono">
                  {item.upgradeCost} {GAME_ICONS.GOLD}
                </span>
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
};
