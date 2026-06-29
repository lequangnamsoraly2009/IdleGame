import React from 'react';
import { DEFAULT_ITEM_TEMPLATES } from '@idle-rpg/shared';

interface ItemGraphicProps {
  templateId: string;
  className?: string;
  isCorrupted?: boolean;
  isCursed?: boolean;
  isIdentified?: boolean;
}

export const ItemGraphic: React.FC<ItemGraphicProps> = ({ 
  templateId, 
  className = "w-10 h-10",
  isCorrupted = false,
  isCursed = false,
  isIdentified = true
}) => {
  const template = DEFAULT_ITEM_TEMPLATES.find(t => t.id === templateId);
  
  const filterStyle = isIdentified === false 
    ? 'brightness(0) invert(0.25) opacity(0.6)' 
    : isCorrupted 
      ? 'drop-shadow(0 0 4px #ef4444)' 
      : isCursed 
        ? 'drop-shadow(0 0 3px #a855f7)' 
        : 'none';

  const svgProps = {
    viewBox: "0 0 64 64",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    className: `${className} select-none pointer-events-none`,
    style: { filter: filterStyle }
  };

  if (!template) {
    // Standard Fallback SVG
    return (
      <svg {...svgProps}>
        <circle cx="32" cy="32" r="16" stroke="#475569" strokeWidth="4" />
        <path d="M24 32H40M32 24V40" stroke="#475569" strokeWidth="4" strokeLinecap="round" />
      </svg>
    );
  }

  const { slot, allowedClass = 'knight', rarity } = template;

  // Custom Colors based on Rarity
  const getRarityColors = (itemRarity: string) => {
    switch (itemRarity) {
      case 'common':
        return {
          primary: '#94a3b8',      // slate gray
          secondary: '#475569',    // dark slate
          accent: '#cbd5e1',       // bright gray
          glow: 'transparent',
          glowOpacity: 0
        };
      case 'uncommon':
        return {
          primary: '#10b981',      // emerald green
          secondary: '#065f46',    // deep emerald
          accent: '#34d399',       // light emerald
          glow: '#10b981',
          glowOpacity: 0.3
        };
      case 'rare':
        return {
          primary: '#3b82f6',      // blue
          secondary: '#1e3a8a',    // navy
          accent: '#60a5fa',       // sky blue
          glow: '#3b82f6',
          glowOpacity: 0.4
        };
      case 'epic':
        return {
          primary: '#8b5cf6',      // purple
          secondary: '#4c1d95',    // dark purple
          accent: '#a78bfa',       // violet
          glow: '#8b5cf6',
          glowOpacity: 0.5
        };
      case 'legendary':
        return {
          primary: '#f59e0b',      // gold
          secondary: '#78350f',    // bronze/brown
          accent: '#fef08a',       // light yellow
          glow: '#fbbf24',
          glowOpacity: 0.65
        };
      default:
        return { primary: '#94a3b8', secondary: '#475569', accent: '#cbd5e1', glow: 'transparent', glowOpacity: 0 };
    }
  };

  const colors = getRarityColors(rarity);

  // RENDER DYNAMIC SHAPES BASED ON SLOT AND CLASS
  switch (slot) {
    case 'weapon':
      if (allowedClass === 'mage') {
        // Mage Staff / Wand
        return (
          <svg {...svgProps}>
            <defs>
              <radialGradient id={`orbGlow-${templateId}`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={colors.accent} stopOpacity="1" />
                <stop offset="60%" stopColor={colors.primary} stopOpacity="0.4" />
                <stop offset="100%" stopColor={colors.glow} stopOpacity="0" />
              </radialGradient>
            </defs>
            {/* Staff Shaft */}
            <path d="M14 50L40 24" stroke={colors.secondary} strokeWidth="5.5" strokeLinecap="round" />
            <path d="M14 50L40 24" stroke="#78350f" strokeWidth="2.5" strokeLinecap="round" />
            {/* Grip bindings */}
            <path d="M18 46L22 42" stroke={colors.primary} strokeWidth="3" />
            {/* Staff Headpiece Wings */}
            <path d="M38 26C35 20 42 14 46 18C44 22 40 24 38 26Z" fill={colors.secondary} stroke={colors.primary} strokeWidth="1.5" />
            <path d="M42 22C48 20 50 27 46 29C44 27 42 24 42 22Z" fill={colors.secondary} stroke={colors.primary} strokeWidth="1.5" />
            {/* Glowing Magic Orb */}
            <circle cx="45" cy="19" r="9" fill={`url(#orbGlow-${templateId})`} className={rarity === 'legendary' || rarity === 'epic' ? 'animate-pulse' : ''} />
            <circle cx="45" cy="19" r="4.5" fill={colors.accent} />
          </svg>
        );
      } else if (allowedClass === 'assassin') {
        // Assassin Daggers / Claws
        return (
          <svg {...svgProps}>
            {/* Main curved daggers crossing or double claw */}
            {/* Claw/Dagger Blade 1 */}
            <path d="M12 48C18 36 28 26 46 18" stroke={colors.primary} strokeWidth="5" strokeLinecap="round" />
            <path d="M14 46C20 36 28 28 44 20" stroke={colors.accent} strokeWidth="1.5" strokeLinecap="round" />
            {/* Spike 2 */}
            <path d="M18 52C22 42 32 34 48 28" stroke={colors.secondary} strokeWidth="4" strokeLinecap="round" />
            {/* Guard / Knuckle hilt */}
            <path d="M14 42L8 48C6 50 10 54 12 52L18 46Z" fill={colors.secondary} stroke={colors.primary} strokeWidth="1.5" />
            {/* Glowing Poison Tip */}
            <circle cx="46" cy="18" r="2.5" fill={colors.accent} className="animate-ping" style={{ animationDuration: '3s' }} />
          </svg>
        );
      } else {
        // Knight Sword
        return (
          <svg {...svgProps}>
            {/* Sword Blade */}
            <path d="M12 48L46 14" stroke={colors.primary} strokeWidth="6.5" strokeLinecap="round" />
            <path d="M13 47L45 15" stroke={colors.accent} strokeWidth="2.5" strokeLinecap="round" strokeDasharray={rarity === 'common' ? '4 8' : 'none'} />
            {/* Hilt Guard */}
            <path d="M19 41L9 51" stroke={colors.secondary} strokeWidth="5.5" strokeLinecap="round" />
            <circle cx="14" cy="46" r="2" fill={colors.accent} />
            {/* Grip handle */}
            <path d="M11 49L6 54" stroke="#78350f" strokeWidth="6" strokeLinecap="round" />
            {/* Pommel */}
            <circle cx="5" cy="55" r="4.5" fill={colors.secondary} />
          </svg>
        );
      }

    case 'armor':
      if (allowedClass === 'mage') {
        // Mage Robe
        return (
          <svg {...svgProps}>
            {/* Robe Gown */}
            <path d="M20 18H44L48 48H16L20 18Z" fill={colors.secondary} stroke={colors.primary} strokeWidth="2.5" />
            {/* Sashes & Neck Collar */}
            <path d="M24 18V48M40 18V48" stroke={colors.accent} strokeWidth="2" />
            <path d="M20 28H44" stroke={colors.accent} strokeWidth="1.5" />
            {/* Center Gem medallion */}
            <rect x="30" y="25" width="4" height="6" rx="1.5" fill={colors.accent} className="animate-pulse" />
            {/* Shoulders flares */}
            <path d="M14 18C14 24 20 24 20 18ZM44 18C44 24 50 24 50 18Z" fill={colors.primary} />
          </svg>
        );
      } else if (allowedClass === 'assassin') {
        // Assassin Cloak
        return (
          <svg {...svgProps}>
            {/* Dark Hooded Vest */}
            <path d="M22 18H42L48 48H16L22 18Z" fill="#1e293b" stroke={colors.secondary} strokeWidth="2.5" />
            {/* Leather harness straps */}
            <path d="M22 26L42 34M42 26L22 34" stroke={colors.primary} strokeWidth="2" strokeLinecap="round" />
            {/* Cloak folds */}
            <path d="M16 48L24 18M48 48L40 18" stroke={colors.accent} strokeWidth="1.5" strokeOpacity="0.7" />
            {/* Shoulder cape wraps */}
            <path d="M18 18H24V24H18V18ZM40 18H46V24H40V18Z" fill={colors.secondary} />
          </svg>
        );
      } else {
        // Knight Plate
        return (
          <svg {...svgProps}>
            {/* Solid metal breastplate */}
            <path d="M18 18C18 14 46 14 46 18V48H18V18Z" fill={colors.primary} stroke={colors.secondary} strokeWidth="3" />
            {/* Ridge alignments */}
            <path d="M24 18V48M40 18V48" stroke={colors.secondary} strokeWidth="1.5" />
            <path d="M32 18V48" stroke={colors.accent} strokeWidth="2" />
            {/* Gold trim around collar */}
            <path d="M26 18C26 22 38 22 38 18" stroke={colors.accent} strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        );
      }

    case 'helmet':
      if (allowedClass === 'mage') {
        // Mage Crown / Hooded hat
        return (
          <svg {...svgProps}>
            {/* Crown base */}
            <path d="M20 40H44V44H20V40Z" fill={colors.secondary} stroke={colors.primary} strokeWidth="1.5" />
            {/* Crown spikes */}
            <path d="M20 40L24 24L29 34L32 20L35 34L40 24L44 40H20Z" fill={colors.primary} stroke={colors.accent} strokeWidth="2" strokeLinecap="round" />
            {/* Crown central gems */}
            <circle cx="32" cy="28" r="2.5" fill={colors.accent} />
            <circle cx="26" cy="32" r="1.5" fill={colors.accent} />
            <circle cx="38" cy="32" r="1.5" fill={colors.accent} />
          </svg>
        );
      } else if (allowedClass === 'assassin') {
        // Assassin Mask / Cowl
        return (
          <svg {...svgProps}>
            {/* Face wrap hood */}
            <path d="M20 38C20 20 44 20 44 38V42H20V38Z" fill="#0f172a" stroke={colors.secondary} strokeWidth="2" />
            {/* Eyes opening */}
            <path d="M25 28H39V32H25V28Z" fill="#1e293b" />
            {/* Glowing assassin eyes */}
            <circle cx="28" cy="30" r="1.5" fill={colors.accent} className="animate-pulse" />
            <circle cx="36" cy="30" r="1.5" fill={colors.accent} className="animate-pulse" />
            {/* Fabric scarf wrap */}
            <path d="M18 42H46L43 46H21L18 42Z" fill={colors.primary} />
          </svg>
        );
      } else {
        // Knight Greathelm
        return (
          <svg {...svgProps}>
            {/* Knight Visor Helm */}
            <path d="M20 24C20 16 44 16 44 24V44L32 48L20 44V24Z" fill={colors.primary} stroke={colors.secondary} strokeWidth="3" />
            {/* Visor shield plate */}
            <path d="M22 28H42V35L32 38L22 35V28Z" fill={colors.secondary} stroke={colors.accent} strokeWidth="1" />
            {/* Horizontal visor line */}
            <path d="M25 31H39" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
            {/* Crest Plume Feather */}
            {(rarity === 'rare' || rarity === 'epic' || rarity === 'legendary') && (
              <path d="M24 14C24 6 18 6 16 12" stroke={colors.accent} strokeWidth="4.5" strokeLinecap="round" className="animate-bounce" />
            )}
          </svg>
        );
      }

    case 'boots':
      if (allowedClass === 'mage') {
        // Mage Sandals
        return (
          <svg {...svgProps}>
            {/* Light fabric slipper boot */}
            <path d="M22 20V42L15 44V48H32V42L28 20H22Z" fill={colors.secondary} stroke={colors.primary} strokeWidth="2" />
            <path d="M15 44H32" stroke={colors.accent} strokeWidth="4.5" strokeLinecap="round" />
            {/* Crossed silk laces */}
            <path d="M22 24L28 28M28 24L22 28M22 32L28 36" stroke={colors.accent} strokeWidth="2" strokeLinecap="round" />
          </svg>
        );
      } else if (allowedClass === 'assassin') {
        // Assassin Boots
        return (
          <svg {...svgProps}>
            {/* Light wraps boots */}
            <path d="M22 18V40L14 42V46H32V40L28 18H22Z" fill="#1e293b" stroke={colors.secondary} strokeWidth="2" />
            <path d="M14 44H32" stroke={colors.primary} strokeWidth="4.5" strokeLinecap="round" />
            {/* Buckles and straps */}
            <path d="M20 24H30M20 32H30" stroke={colors.accent} strokeWidth="2" />
          </svg>
        );
      } else {
        // Knight Heavy Sabatons
        return (
          <svg {...svgProps}>
            {/* Armored boots */}
            <path d="M22 16V40L14 42V46H33V40L28 16H22Z" fill={colors.primary} stroke={colors.secondary} strokeWidth="2.5" />
            <path d="M14 44H33" stroke={colors.secondary} strokeWidth="4.5" strokeLinecap="round" />
            {/* Segmentation lines */}
            <path d="M20 24H30M18 32H30" stroke={colors.accent} strokeWidth="2" strokeLinecap="round" />
            <circle cx="21" cy="20" r="1" fill={colors.accent} />
            <circle cx="29" cy="20" r="1" fill={colors.accent} />
          </svg>
        );
      }

    case 'ring':
      // Rings have a base band and a gemstone matching class/rarity
      return (
        <svg {...svgProps}>
          {/* Base Ring Loop */}
          <ellipse cx="32" cy="34" rx="16" ry="8" stroke={allowedClass === 'mage' ? '#cbd5e1' : '#d97706'} strokeWidth="5.5" />
          <ellipse cx="32" cy="34" rx="12" ry="5" stroke={colors.accent} strokeWidth="1.5" />
          {/* Gemstone shape based on class */}
          {allowedClass === 'mage' ? (
            // Floating magical sphere
            <>
              <circle cx="32" cy="20" r="6" fill={colors.primary} stroke={colors.accent} strokeWidth="1.5" className="animate-pulse" />
              <circle cx="30" cy="18" r="1.5" fill="#ffffff" />
            </>
          ) : allowedClass === 'assassin' ? (
            // Sharp emerald / poison crescent stone
            <polygon points="32,12 37,20 32,28 27,20" fill={colors.primary} stroke={colors.accent} strokeWidth="1.5" />
          ) : (
            // Solid ruby shield signet
            <polygon points="28,14 36,14 38,22 32,28 26,22" fill={colors.primary} stroke={colors.accent} strokeWidth="1.5" />
          )}
        </svg>
      );

    default:
      return (
        <svg {...svgProps}>
          <circle cx="32" cy="32" r="16" stroke="#475569" strokeWidth="4" />
          <path d="M24 32H40M32 24V40" stroke="#475569" strokeWidth="4" strokeLinecap="round" />
        </svg>
      );
  }
};
