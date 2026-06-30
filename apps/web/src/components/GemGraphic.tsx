import React from 'react';

interface GemGraphicProps {
  type: string; // 'ruby', 'topaz', 'emerald', 'sapphire', 'amethyst'
  tier?: number; // 1 to 5
  className?: string;
  showBadge?: boolean;
}

export const GemGraphic: React.FC<GemGraphicProps> = ({
  type,
  tier = 1,
  className = "w-10 h-10",
  showBadge = false
}) => {
  const normType = type.toLowerCase();

  // Define glow colors and offsets based on gem type and tier
  const getGemConfig = (gType: string) => {
    switch (gType) {
      case 'ruby':
        return {
          glow: '#ef4444',
          startColor: '#fca5a5',
          midColor: '#ef4444',
          endColor: '#7f1d1d',
          shadow: 'rgba(239, 68, 68, 0.45)',
          emoji: '🔴'
        };
      case 'topaz':
        return {
          glow: '#eab308',
          startColor: '#fef08a',
          midColor: '#eab308',
          endColor: '#78350f',
          shadow: 'rgba(234, 179, 8, 0.45)',
          emoji: '🟡'
        };
      case 'emerald':
        return {
          glow: '#10b981',
          startColor: '#a7f3d0',
          midColor: '#10b981',
          endColor: '#064e3b',
          shadow: 'rgba(16, 185, 129, 0.45)',
          emoji: '🟢'
        };
      case 'sapphire':
        return {
          glow: '#3b82f6',
          startColor: '#bfdbfe',
          midColor: '#3b82f6',
          endColor: '#1e3a8a',
          shadow: 'rgba(59, 130, 246, 0.45)',
          emoji: '🔵'
        };
      case 'amethyst':
        return {
          glow: '#a855f7',
          startColor: '#e9d5ff',
          midColor: '#a855f7',
          endColor: '#4c1d95',
          shadow: 'rgba(168, 85, 247, 0.45)',
          emoji: '🔮'
        };
      default:
        return {
          glow: '#94a3b8',
          startColor: '#cbd5e1',
          midColor: '#94a3b8',
          endColor: '#334155',
          shadow: 'rgba(148, 163, 184, 0.2)',
          emoji: '💎'
        };
    }
  };

  const config = getGemConfig(normType);
  const glowRadius = Math.min(12, tier * 2.5); // Tier 1: 2.5px, Tier 5: 12.5px
  const dropShadow = `drop-shadow(0 0 ${glowRadius}px ${config.glow})`;

  // Render SVG Paths
  const renderGemSvg = () => {
    const gradId = `gemGrad-${normType}-${tier}`;

    const defs = (
      <defs>
        <linearGradient id={gradId} x1="30%" y1="10%" x2="70%" y2="90%">
          <stop offset="0%" stopColor={config.startColor} />
          <stop offset="50%" stopColor={config.midColor} />
          <stop offset="100%" stopColor={config.endColor} />
        </linearGradient>
      </defs>
    );

    // Sparkle coordinates based on Tier (Tier 4 & 5 get extra sparkles)
    const sparkles = tier >= 4 ? (
      <>
        {/* Sparkle 1 */}
        <path d="M44,16 L46,20 L50,22 L46,24 L44,28 L42,24 L38,22 L42,20 Z" fill="#ffffff" opacity="0.9" className="animate-pulse" />
        {/* Sparkle 2 */}
        <path d="M18,36 L19,38 L21,39 L19,40 L18,42 L17,40 L15,39 L17,38 Z" fill="#ffffff" opacity="0.8" />
      </>
    ) : tier >= 3 ? (
      <path d="M42,18 L43.5,21 L46.5,22.5 L43.5,24 L42,27 L40.5,24 L37.5,22.5 L40.5,21 Z" fill="#ffffff" opacity="0.8" />
    ) : null;

    switch (normType) {
      case 'ruby':
        // Diamond Cut
        return (
          <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            {defs}
            {/* Base Shape */}
            <path d="M22 14 L42 14 L52 28 L32 52 L12 28 Z" fill={`url(#${gradId})`} stroke="#ffffff" strokeWidth="0.5" strokeOpacity="0.2" />
            {/* Facets for 3D look */}
            <path d="M26 14 L38 14 L32 24 Z" fill={config.startColor} fillOpacity="0.5" />
            <path d="M22 14 L26 14 L32 24 L12 28 Z" fill="#ffffff" fillOpacity="0.25" />
            <path d="M42 14 L38 14 L32 24 L52 28 Z" fill={config.endColor} fillOpacity="0.3" />
            <path d="M12 28 L32 24 L32 52 Z" fill="#000000" fillOpacity="0.15" />
            <path d="M52 28 L32 24 L32 52 Z" fill={config.midColor} fillOpacity="0.2" />
            {sparkles}
          </svg>
        );

      case 'topaz':
        // Kite shape
        return (
          <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            {defs}
            {/* Base Shape */}
            <path d="M32 10 L48 30 L32 54 L16 30 Z" fill={`url(#${gradId})`} stroke="#ffffff" strokeWidth="0.5" strokeOpacity="0.2" />
            {/* Facets */}
            <path d="M32 18 L38 30 L32 38 L26 30 Z" fill={config.startColor} fillOpacity="0.5" />
            <path d="M32 10 L16 30 L26 30 L32 18 Z" fill="#ffffff" fillOpacity="0.25" />
            <path d="M32 10 L48 30 L38 30 L32 18 Z" fill={config.endColor} fillOpacity="0.3" />
            <path d="M16 30 L26 30 L32 38 L32 54 Z" fill="#000000" fillOpacity="0.15" />
            <path d="M48 30 L38 30 L32 38 L32 54 Z" fill={config.midColor} fillOpacity="0.2" />
            {sparkles}
          </svg>
        );

      case 'emerald':
        // Octagonal Emerald Cut
        return (
          <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            {defs}
            {/* Base Shape */}
            <path d="M20 14 L44 14 L52 22 L52 42 L44 50 L20 50 L12 42 L12 22 Z" fill={`url(#${gradId})`} stroke="#ffffff" strokeWidth="0.5" strokeOpacity="0.2" />
            {/* Facets */}
            <path d="M24 20 L40 20 L40 44 L24 44 Z" fill={config.startColor} fillOpacity="0.45" />
            <path d="M20 14 L44 14 L40 20 L24 20 Z" fill="#ffffff" fillOpacity="0.25" />
            <path d="M52 22 L52 42 L40 44 L40 20 Z" fill={config.endColor} fillOpacity="0.3" />
            <path d="M44 50 L20 50 L24 44 L40 44 Z" fill="#000000" fillOpacity="0.2" />
            <path d="M12 42 L12 22 L24 20 L24 44 Z" fill="#ffffff" fillOpacity="0.1" />
            {sparkles}
          </svg>
        );

      case 'sapphire':
        // Tear drop teardrop/pear cut
        return (
          <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            {defs}
            {/* Base Shape */}
            <path d="M32 10 C46 22, 52 34, 48 48 C44 54, 20 54, 16 48 C12 34, 18 22, 32 10 Z" fill={`url(#${gradId})`} stroke="#ffffff" strokeWidth="0.5" strokeOpacity="0.2" />
            {/* Facets */}
            <path d="M32 20 C36 26, 40 34, 32 42 C24 34, 28 26, 32 20 Z" fill={config.startColor} fillOpacity="0.5" />
            <path d="M32 10 C24 20, 20 28, 20 36 C25 32, 28 26, 32 20 Z" fill="#ffffff" fillOpacity="0.25" />
            <path d="M32 10 C40 20, 44 28, 44 36 C39 32, 36 26, 32 20 Z" fill={config.endColor} fillOpacity="0.3" />
            <path d="M20 36 C20 48, 24 50, 32 42 Z" fill="#000000" fillOpacity="0.15" />
            <path d="M44 36 C44 48, 40 50, 32 42 Z" fill={config.midColor} fillOpacity="0.2" />
            {sparkles}
          </svg>
        );

      case 'amethyst':
        // Pointed Hexagon Crystal
        return (
          <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            {defs}
            {/* Base Hexagon */}
            <path d="M32 8 L48 18 L48 44 L32 56 L16 44 L16 18 Z" fill={`url(#${gradId})`} stroke="#ffffff" strokeWidth="0.5" strokeOpacity="0.2" />
            {/* Facets */}
            <path d="M32 8 L32 28 L48 18 Z" fill={config.startColor} fillOpacity="0.55" />
            <path d="M32 8 L32 28 L16 18 Z" fill="#ffffff" fillOpacity="0.2" />
            <path d="M32 28 L32 56 L48 44 L48 18 Z" fill={config.endColor} fillOpacity="0.3" />
            <path d="M32 28 L32 56 L16 44 L16 18 Z" fill={config.midColor} fillOpacity="0.2" />
            {sparkles}
          </svg>
        );

      default:
        // Generic Gem Octahedron
        return (
          <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            {defs}
            <path d="M32 10 L48 26 L32 54 L16 26 Z" fill={`url(#${gradId})`} />
            <path d="M32 10 L32 26 L16 26 Z" fill="#ffffff" fillOpacity="0.2" />
            <path d="M32 10 L32 26 L48 26 Z" fill={config.endColor} fillOpacity="0.2" />
            <path d="M16 26 L32 26 L32 54 Z" fill="#000000" fillOpacity="0.1" />
            <path d="M48 26 L32 26 L32 54 Z" fill={config.midColor} fillOpacity="0.1" />
          </svg>
        );
    }
  };

  return (
    <div 
      className="relative flex items-center justify-center select-none"
      style={{ 
        width: 'inherit', 
        height: 'inherit',
        filter: dropShadow
      }}
    >
      <div className={`${className} flex items-center justify-center`}>
        {renderGemSvg()}
      </div>

      {/* Optional Overlay Badge to show Tier */}
      {showBadge && (
        <span 
          className="absolute -bottom-1 -right-1 bg-slate-950/90 border border-slate-800 text-[8px] font-black text-amber-400 rounded-md px-1 py-0.5 leading-none select-none shadow font-mono"
          style={{ textShadow: '0 0 2px rgba(245, 158, 11, 0.4)' }}
        >
          T{tier}
        </span>
      )}
    </div>
  );
};
