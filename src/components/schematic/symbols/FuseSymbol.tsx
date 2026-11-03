import React from 'react';

interface FuseProps {
  x: number;
  y: number;
  blown?: boolean;
  selected?: boolean;
  onClick?: () => void;
}

export const FuseSymbol: React.FC<FuseProps> = ({
  x,
  y,
  blown = false,
  selected,
  onClick,
}) => {
  return (
    <g
      transform={`translate(${x}, ${y})`}
      className="cursor-pointer group"
      onClick={onClick}
    >
      {selected && (
        <rect
          x="-28"
          y="-18"
          width="56"
          height="36"
          rx="4"
          fill="none"
          stroke="#ef4444"
          strokeWidth="2"
          strokeDasharray="3 2"
        />
      )}

      {/* Leads */}
      <line x1="-25" y1="0" x2="-16" y2="0" stroke="#38bdf8" strokeWidth="2.5" />
      <line x1="16" y1="0" x2="25" y2="0" stroke="#38bdf8" strokeWidth="2.5" />

      {/* IEC Fuse Rectangle Body */}
      <rect
        x="-16"
        y="-8"
        width="32"
        height="16"
        fill="#0f172a"
        stroke={blown ? '#ef4444' : '#38bdf8'}
        strokeWidth="2"
      />

      {/* Fuse Element wire through the middle */}
      {blown ? (
        // Blown fuse broken path
        <g stroke="#ef4444" strokeWidth="2">
          <line x1="-16" y1="0" x2="-4" y2="0" />
          <line x1="4" y1="0" x2="16" y2="0" />
          <line x1="-4" y1="-4" x2="4" y2="4" strokeWidth="1.5" />
          <line x1="-4" y1="4" x2="4" y2="-4" strokeWidth="1.5" />
        </g>
      ) : (
        // Intact fuse wire passing straight through
        <line x1="-16" y1="0" x2="16" y2="0" stroke="#38bdf8" strokeWidth="2" />
      )}

      <text
        x="0"
        y="-12"
        textAnchor="middle"
        fill={blown ? '#ef4444' : '#94a3b8'}
        fontSize="9"
        fontWeight="bold"
        fontFamily="monospace"
      >
        {blown ? 'F1 [BLOWN]' : 'F1 (10A)'}
      </text>
    </g>
  );
};
