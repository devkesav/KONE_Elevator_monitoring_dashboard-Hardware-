import React from 'react';

interface Props {
  x: number;
  y: number;
  voltage: number;
  frequency: number;
  current: number;
  selected?: boolean;
  onClick?: () => void;
}

export const ACSourceSymbol: React.FC<Props> = ({
  x,
  y,
  voltage,
  frequency,
  current,
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
        <circle
          cx="0"
          cy="0"
          r="34"
          fill="none"
          stroke="#38bdf8"
          strokeWidth="3"
          strokeDasharray="4 2"
          className="animate-pulse"
        />
      )}

      {/* Terminal connection leads */}
      <line x1="-38" y1="0" x2="-26" y2="0" stroke="#38bdf8" strokeWidth="2.5" />
      <line x1="26" y1="0" x2="38" y2="0" stroke="#38bdf8" strokeWidth="2.5" />
      
      {/* Terminal Dots */}
      <circle cx="-38" cy="0" r="3" fill="#38bdf8" />
      <circle cx="38" cy="0" r="3" fill="#38bdf8" />

      {/* Outer Symbol Circle */}
      <circle
        cx="0"
        cy="0"
        r="26"
        fill="#0f172a"
        stroke={selected ? '#38bdf8' : '#60a5fa'}
        strokeWidth="2.5"
        className="transition-colors group-hover:stroke-sky-300"
      />

      {/* Sinusoidal Wave inside circle (IEC Standard) */}
      <path
        d="M -15,0 C -10,-14 -5,-14 0,0 C 5,14 10,14 15,0"
        fill="none"
        stroke="#38bdf8"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Component Reference Tag */}
      <text
        x="0"
        y="-32"
        textAnchor="middle"
        fill="#94a3b8"
        fontSize="11"
        fontWeight="bold"
        fontFamily="monospace"
        className="select-none"
      >
        V_GRID (AC SOURCE)
      </text>

      {/* Live Measurement Badge */}
      <g transform="translate(0, 42)">
        <rect
          x="-55"
          y="-8"
          width="110"
          height="34"
          rx="4"
          fill="#090d16"
          stroke="#1e293b"
          strokeWidth="1.2"
        />
        <text
          x="0"
          y="4"
          textAnchor="middle"
          fill="#38bdf8"
          fontSize="10.5"
          fontFamily="monospace"
          fontWeight="bold"
        >
          {voltage.toFixed(1)} V | {frequency.toFixed(1)} Hz
        </text>
        <text
          x="0"
          y="18"
          textAnchor="middle"
          fill="#94a3b8"
          fontSize="9.5"
          fontFamily="monospace"
        >
          I: {current.toFixed(2)} A
        </text>
      </g>
    </g>
  );
};
