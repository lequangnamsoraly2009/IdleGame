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

  const imgPath = `/assets/items/${templateId}.png`;

  return (
    <img
      src={imgPath}
      alt={template.name}
      className={`${className} select-none pointer-events-none object-contain`}
      style={{ filter: filterStyle }}
    />
  );
};
