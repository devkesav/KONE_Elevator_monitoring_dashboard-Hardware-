import React from 'react';

interface Props {
  x: number;
  y: number;
  position: 'A' | 'B';
  selected?: boolean;
  onClick?: () => void;
}

export const SPDTSwitchSymbol: React.FC<Props> = ({
  x,
  y,
  position = 'A',
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
          x="-32"
          y="-24"
          width="64"
          height="48"
          rx="4"
          fill="none"
          stroke="#38bdf8"
          strokeWidth="2"
          strokeDasharray="3 2"
        />
      )}

      {/* Outer Case / Box as drawn in sketch */}
      <rect
        x="-26"
        y="-20"
        width="52"
        height="40"
        rx="3"
        fill="#090d16"
        stroke="#475569"
        strokeWidth="1.5"
      />

      {/* Label */}
      <text
        x="0"
        y="-24"
        textAnchor="middle"
        fill="#94a3b8"
        fontSize="8"
        fontWeight="bold"
        fontFamily="monospace"
      >
        SPDT SWITCH
      </text>

      {/* Input Common Terminal (Left) */}
      <line x1="-36" y1="0" x2="-16" y2="0" stroke="#38bdf8" strokeWidth="2.5" />
      <circle cx="-16" cy="0" r="3" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />

      {/* Output Terminal 1 (Top Right - Position A: REGEN CHARGE) */}
      <line x1="16" y1="-10" x2="36" y2="-10" stroke="#10b981" strokeWidth="2.5" />
      <circle cx="16" cy="-10" r="3" fill="#0f172a" stroke="#10b981" strokeWidth="2" />
      <text x="24" y="-14" fill="#10b981" fontSize="7" fontWeight="bold" fontFamily="monospace">A</text>

      {/* Output Terminal 2 (Bottom Right - Position B: DIRECT BYPASS) */}
      <line x1="16" y1="10" x2="36" y2="10" stroke="#94a3b8" strokeWidth="2.5" />
      <circle cx="16" cy="10" r="3" fill="#0f172a" stroke="#94a3b8" strokeWidth="2" />
      <text x="24" y="20" fill="#94a3b8" fontSize="7" fontWeight="bold" fontFamily="monospace">B</text>

      {/* Switch Blade Arm */}
      {position === 'A' ? (
        <line x1="-16" y1="0" x2="16" y2="-10" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" />
      ) : (
        <line x1="-16" y1="0" x2="16" y2="10" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
      )}

      {/* Mode Tag */}
      <text
        x="0"
        y="30"
        textAnchor="middle"
        fill={position === 'A' ? '#10b981' : '#f59e0b'}
        fontSize="7"
        fontWeight="bold"
        fontFamily="monospace"
      >
        {position === 'A' ? '[POS A: REGEN STORE]' : '[POS B: DISCHARGE]'}
      </text>
    </g>
  );
};
