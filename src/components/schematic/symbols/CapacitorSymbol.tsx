import React from 'react';

interface Props {
  x: number;
  y: number;
  voltage: number;
  capacitanceUf: number;
  rippleMv?: number;
  storedJoules?: number;
  isPolarized?: boolean;
  tag?: string;
  orientation?: 'vertical' | 'horizontal';
  badgePosition?: 'left' | 'right';
  selected?: boolean;
  onClick?: () => void;
}

export const CapacitorSymbol: React.FC<Props> = ({
  x,
  y,
  voltage,
  capacitanceUf,
  rippleMv = 15,
  storedJoules = 1.2,
  isPolarized = true,
  tag = 'C_DC (DC-LINK)',
  orientation = 'vertical',
  badgePosition = 'right',
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
          x="-35"
          y="-40"
          width="70"
          height="80"
          rx="6"
          fill="none"
          stroke="#ef4444"
          strokeWidth="2"
          strokeDasharray="3 2"
          className="animate-pulse"
        />
      )}

      {orientation === 'vertical' ? (
        <>
          {/* Top lead (Positive) */}
          <line x1="0" y1="-32" x2="0" y2="-7" stroke="#ef4444" strokeWidth="2.5" />
          <circle cx="0" cy="-32" r="3" fill="#ef4444" />
          
          {/* Top plate */}
          <line x1="-18" y1="-7" x2="18" y2="-7" stroke="#ef4444" strokeWidth="3" strokeLinecap="square" />
          
          {/* Bottom plate */}
          <line x1="-18" y1="7" x2="18" y2="7" stroke="#1d4ed8" strokeWidth="3" strokeLinecap="square" />
          
          {/* Bottom lead (Negative) */}
          <line x1="0" y1="7" x2="0" y2="32" stroke="#1d4ed8" strokeWidth="2.5" />
          <circle cx="0" cy="32" r="3" fill="#1d4ed8" />

          {/* Polarity '+' sign if electrolytic */}
          {isPolarized && (
            <text x="14" y="-12" fill="#ef4444" fontSize="12" fontWeight="bold" fontFamily="monospace">
              +
            </text>
          )}
        </>
      ) : (
        <>
          {/* Horizontal capacitor */}
          <line x1="-32" y1="0" x2="-7" y2="0" stroke="#38bdf8" strokeWidth="2.5" />
          <line x1="-7" y1="-18" x2="-7" y2="18" stroke="#38bdf8" strokeWidth="3" />
          <line x1="7" y1="-18" x2="7" y2="18" stroke="#38bdf8" strokeWidth="3" />
          <line x1="7" y1="0" x2="32" y2="0" stroke="#38bdf8" strokeWidth="2.5" />
        </>
      )}

      {/* Tag */}
      <text
        x="0"
        y="-38"
        textAnchor="middle"
        fill="#94a3b8"
        fontSize="9"
        fontWeight="bold"
        fontFamily="monospace"
      >
        {tag}
      </text>

      {/* Live Measurement Badge */}
      <g transform={badgePosition === 'left' ? 'translate(-96, 0)' : 'translate(36, 0)'}>
        <rect
          x="0"
          y="-18"
          width="82"
          height="36"
          rx="4"
          fill="#020617"
          stroke="#1e293b"
          strokeWidth="1.2"
        />
        <text
          x="41"
          y="-4"
          textAnchor="middle"
          fill="#ef4444"
          fontSize="9.5"
          fontFamily="monospace"
          fontWeight="bold"
        >
          {voltage.toFixed(1)} V
        </text>
        <text
          x="41"
          y="8"
          textAnchor="middle"
          fill="#94a3b8"
          fontSize="8.5"
          fontFamily="monospace"
        >
          {capacitanceUf >= 1000 ? `${(capacitanceUf / 1000).toFixed(1)} mF` : `${capacitanceUf} µF`}
        </text>
        <text
          x="41"
          y="15"
          textAnchor="middle"
          fill="#64748b"
          fontSize="7.5"
          fontFamily="monospace"
        >
          Rip: {rippleMv.toFixed(1)}mV
        </text>
      </g>
    </g>
  );
};
