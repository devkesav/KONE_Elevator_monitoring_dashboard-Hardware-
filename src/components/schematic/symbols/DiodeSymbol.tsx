import React from 'react';

interface Props {
  x: number;
  y: number;
  isConducting?: boolean;
  orientation?: 'horizontal' | 'vertical';
  tag?: string;
  selected?: boolean;
  onClick?: () => void;
}

export const DiodeSymbol: React.FC<Props> = ({
  x,
  y,
  isConducting = false,
  orientation = 'horizontal',
  tag = 'D_STEER (10A)',
  selected,
  onClick,
}) => {
  const isVert = orientation === 'vertical';
  const diodeColor = isConducting ? '#10b981' : '#38bdf8';

  return (
    <g
      transform={`translate(${x}, ${y})`}
      className="cursor-pointer group"
      onClick={onClick}
    >
      {/* Selection Glow */}
      {selected && (
        <rect
          x="-24"
          y="-18"
          width="48"
          height="36"
          rx="4"
          fill="none"
          stroke="#38bdf8"
          strokeWidth="2"
          strokeDasharray="3 2"
        />
      )}

      {/* Leads */}
      {!isVert ? (
        <>
          <line x1="-24" y1="0" x2="-10" y2="0" stroke="#38bdf8" strokeWidth="2.5" />
          <line x1="10" y1="0" x2="24" y2="0" stroke="#38bdf8" strokeWidth="2.5" />
          
          {/* Anode to Cathode Triangle (pointing Right) */}
          <polygon
            points="-10,-10 -10,10 10,0"
            fill={isConducting ? '#10b981' : '#090d16'}
            stroke={diodeColor}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          {/* Cathode Vertical Bar */}
          <line x1="10" y1="-10" x2="10" y2="10" stroke={diodeColor} strokeWidth="2.5" strokeLinecap="round" />
        </>
      ) : (
        <>
          <line x1="0" y1="-24" x2="0" y2="-10" stroke="#38bdf8" strokeWidth="2.5" />
          <line x1="0" y1="10" x2="0" y2="24" stroke="#38bdf8" strokeWidth="2.5" />
          
          {/* Anode to Cathode Triangle (pointing Down) */}
          <polygon
            points="-10,-10 10,-10 0,10"
            fill={isConducting ? '#10b981' : '#090d16'}
            stroke={diodeColor}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          {/* Cathode Horizontal Bar */}
          <line x1="-10" y1="10" x2="10" y2="10" stroke={diodeColor} strokeWidth="2.5" strokeLinecap="round" />
        </>
      )}

      {/* Tag Label */}
      <text
        x="0"
        y={isVert ? 24 : -14}
        textAnchor="middle"
        fill="#94a3b8"
        fontSize="7.5"
        fontWeight="bold"
        fontFamily="monospace"
      >
        {tag}
      </text>
    </g>
  );
};
