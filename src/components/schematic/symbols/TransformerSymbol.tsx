import React from 'react';

interface Props {
  x: number;
  y: number;
  vPrimary: number;
  vSecondary: number;
  iSecondary: number;
  efficiency: number;
  selected?: boolean;
  onClick?: () => void;
}

export const TransformerSymbol: React.FC<Props> = ({
  x,
  y,
  vPrimary,
  vSecondary,
  iSecondary,
  efficiency,
  selected,
  onClick,
}) => {
  return (
    <g
      transform={`translate(${x}, ${y})`}
      className="cursor-pointer group"
      onClick={onClick}
    >
      {/* Selection Glow */}
      {selected && (
        <rect
          x="-50"
          y="-60"
          width="100"
          height="120"
          rx="8"
          fill="none"
          stroke="#38bdf8"
          strokeWidth="2"
          strokeDasharray="4 2"
          className="animate-pulse"
        />
      )}

      {/* Terminal Leads Primary (Left side) */}
      <line x1="-42" y1="-30" x2="-22" y2="-30" stroke="#38bdf8" strokeWidth="2.5" />
      <line x1="-42" y1="30" x2="-22" y2="30" stroke="#38bdf8" strokeWidth="2.5" />
      <circle cx="-42" cy="-30" r="3" fill="#38bdf8" />
      <circle cx="-42" cy="30" r="3" fill="#38bdf8" />

      {/* Primary Coil Inductor Loops (Left) */}
      <path
        d="M -22,-30 
           A 10,10 0 0,1 -22,-10 
           A 10,10 0 0,1 -22,10 
           A 10,10 0 0,1 -22,30"
        fill="none"
        stroke="#60a5fa"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Iron Magnetic Core (Double parallel lines) */}
      <line x1="-5" y1="-36" x2="-5" y2="36" stroke="#94a3b8" strokeWidth="2" strokeDasharray="none" />
      <line x1="5" y1="-36" x2="5" y2="36" stroke="#94a3b8" strokeWidth="2" strokeDasharray="none" />

      {/* Secondary Coil Inductor Loops (Right) */}
      <path
        d="M 22,-30 
           A 10,10 0 0,0 22,-10 
           A 10,10 0 0,0 22,10 
           A 10,10 0 0,0 22,30"
        fill="none"
        stroke="#60a5fa"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Terminal Leads Secondary (Right side) */}
      <line x1="22" y1="-30" x2="42" y2="-30" stroke="#38bdf8" strokeWidth="2.5" />
      <line x1="22" y1="30" x2="42" y2="30" stroke="#38bdf8" strokeWidth="2.5" />
      <circle cx="42" cy="-30" r="3" fill="#38bdf8" />
      <circle cx="42" cy="30" r="3" fill="#38bdf8" />

      {/* Labels */}
      <text
        x="0"
        y="-44"
        textAnchor="middle"
        fill="#94a3b8"
        fontSize="11"
        fontWeight="bold"
        fontFamily="monospace"
      >
        T1 (STEP-DOWN)
      </text>

      {/* Winding Ratings */}
      <text
        x="-30"
        y="-37"
        textAnchor="middle"
        fill="#64748b"
        fontSize="8.5"
        fontFamily="monospace"
      >
        PRI
      </text>
      <text
        x="30"
        y="-37"
        textAnchor="middle"
        fill="#64748b"
        fontSize="8.5"
        fontFamily="monospace"
      >
        SEC
      </text>

      {/* Live Measurement Box */}
      <g transform="translate(0, 48)">
        <rect
          x="-65"
          y="-6"
          width="130"
          height="34"
          rx="4"
          fill="#090d16"
          stroke="#1e293b"
          strokeWidth="1.2"
        />
        <text
          x="0"
          y="6"
          textAnchor="middle"
          fill="#38bdf8"
          fontSize="9.5"
          fontFamily="monospace"
          fontWeight="bold"
        >
          PRI: {vPrimary.toFixed(0)}V | SEC: {vSecondary.toFixed(1)}V
        </text>
        <text
          x="0"
          y="20"
          textAnchor="middle"
          fill="#94a3b8"
          fontSize="9"
          fontFamily="monospace"
        >
          I_sec: {iSecondary.toFixed(2)}A | η: {efficiency.toFixed(1)}%
        </text>
      </g>
    </g>
  );
};
