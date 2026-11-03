import React from 'react';

interface Props {
  x: number;
  y: number;
  isActive: boolean;
  selected?: boolean;
  onClick?: () => void;
}

export const ReverseLedSymbol: React.FC<Props> = ({
  x,
  y,
  isActive,
  selected,
  onClick,
}) => {
  const ledColor = isActive ? '#10b981' : '#334155';
  const glowColor = isActive ? '#10b981' : 'transparent';

  return (
    <g
      transform={`translate(${x}, ${y})`}
      className="cursor-pointer group"
      onClick={onClick}
    >
      {/* Radiant Glow Aura when Active (Regeneration) */}
      {isActive && (
        <circle
          cx="0"
          cy="0"
          r="24"
          fill="#10b981"
          fillOpacity="0.25"
          className="animate-pulse"
        />
      )}

      {selected && (
        <rect
          x="-35"
          y="-30"
          width="70"
          height="60"
          rx="6"
          fill="none"
          stroke="#10b981"
          strokeWidth="2"
          strokeDasharray="3 2"
        />
      )}

      {/* Terminal Leads (Vertical) */}
      {/* Anode (Top +) */}
      <line x1="0" y1="-28" x2="0" y2="-12" stroke="#ef4444" strokeWidth="2.5" />
      <circle cx="0" cy="-28" r="2.5" fill="#ef4444" />
      <text x="8" y="-18" fill="#ef4444" fontSize="9" fontWeight="bold" fontFamily="monospace">+</text>

      {/* Cathode (Bottom -) */}
      <line x1="0" y1="12" x2="0" y2="28" stroke="#1d4ed8" strokeWidth="2.5" />
      <circle cx="0" cy="28" r="2.5" fill="#1d4ed8" />
      <text x="8" y="24" fill="#60a5fa" fontSize="9" fontWeight="bold" fontFamily="monospace">-</text>

      {/* LED Diode Triangle (Pointing Down from + to -) */}
      <polygon
        points="-10,-12 10,-12 0,6"
        fill={isActive ? '#10b981' : '#0f172a'}
        stroke={ledColor}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Cathode Bar */}
      <line x1="-12" y1="6" x2="12" y2="6" stroke={ledColor} strokeWidth="2.5" strokeLinecap="round" />

      {/* Light Emission Rays (Pointing Up/Right) */}
      <line x1="8" y1="-4" x2="16" y2="-12" stroke={ledColor} strokeWidth="1.5" strokeLinecap="round" />
      <polygon points="17,-13 13,-10 15,-8" fill={ledColor} />
      
      <line x1="12" y1="2" x2="20" y2="-6" stroke={ledColor} strokeWidth="1.5" strokeLinecap="round" />
      <polygon points="21,-7 17,-4 19,-2" fill={ledColor} />

      {/* Tag Label from user drawing */}
      <text
        x="0"
        y="-34"
        textAnchor="middle"
        fill={isActive ? '#34d399' : '#94a3b8'}
        fontSize="8"
        fontWeight="bold"
        fontFamily="monospace"
      >
        LED (REVERSE STORED ENERGY)
      </text>

      {/* Status Readout Badge */}
      <g transform="translate(24, 0)">
        <rect
          x="0"
          y="-8"
          width="64"
          height="16"
          rx="3"
          fill="#020617"
          stroke={isActive ? '#10b981' : '#1e293b'}
          strokeWidth="1.2"
        />
        <text
          x="32"
          y="3.5"
          textAnchor="middle"
          fill={isActive ? '#10b981' : '#64748b'}
          fontSize="7.5"
          fontWeight="bold"
          fontFamily="monospace"
        >
          {isActive ? 'ACTIVE (REGEN)' : 'OFF (STANDBY)'}
        </text>
      </g>
    </g>
  );
};
