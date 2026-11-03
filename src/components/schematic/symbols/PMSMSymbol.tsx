import React from 'react';

interface Props {
  x: number;
  y: number;
  speedRpm: number;
  torqueNm: number;
  mechPowerW: number;
  direction: 'CW' | 'CCW' | 'STOP';
  temp: number;
  powerFlow: 'MOTORING' | 'REGENERATING' | 'IDLE' | 'FAULT';
  selected?: boolean;
  onClick?: () => void;
}

export const PMSMSymbol: React.FC<Props> = ({
  x,
  y,
  speedRpm,
  torqueNm,
  mechPowerW,
  direction,
  temp,
  powerFlow,
  selected,
  onClick,
}) => {
  const isRegen = powerFlow === 'REGENERATING';
  const isMotoring = powerFlow === 'MOTORING';
  const flowColor = isRegen ? '#10b981' : isMotoring ? '#38bdf8' : '#94a3b8';

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
          r="45"
          fill="none"
          stroke={flowColor}
          strokeWidth="2.5"
          strokeDasharray="4 2"
          className="animate-pulse"
        />
      )}

      {/* Terminal leads from Drive (M1 / M+ and M2 / M-) */}
      <line x1="-42" y1="-14" x2="-28" y2="-14" stroke="#ef4444" strokeWidth="2.5" />
      <circle cx="-42" cy="-14" r="3" fill="#ef4444" />
      <text x="-40" y="-20" fill="#ef4444" fontSize="8" fontWeight="bold" fontFamily="monospace">M+</text>

      <line x1="-42" y1="14" x2="-28" y2="14" stroke="#1d4ed8" strokeWidth="2.5" />
      <circle cx="-42" cy="14" r="3" fill="#1d4ed8" />
      <text x="-40" y="26" fill="#60a5fa" fontSize="8" fontWeight="bold" fontFamily="monospace">M-</text>

      {/* Outer Stator Ring */}
      <circle
        cx="0"
        cy="0"
        r="32"
        fill="#090d16"
        stroke={flowColor}
        strokeWidth="2.5"
        className="transition-colors group-hover:brightness-125"
      />

      {/* Stator winding poles (3 phase notches or 4 field indicators) */}
      <circle cx="0" cy="-26" r="3" fill="#64748b" />
      <circle cx="-22" cy="14" r="3" fill="#64748b" />
      <circle cx="22" cy="14" r="3" fill="#64748b" />

      {/* Central 'M' and '3~' (IEC Standard Motor Symbol) */}
      <text
        x="0"
        y="4"
        textAnchor="middle"
        fill="#f8fafc"
        fontSize="18"
        fontWeight="bold"
        fontFamily="sans-serif"
        className="select-none"
      >
        M
      </text>
      <text
        x="0"
        y="17"
        textAnchor="middle"
        fill="#94a3b8"
        fontSize="8.5"
        fontWeight="bold"
        fontFamily="monospace"
        className="select-none"
      >
        3~ PMSM
      </text>

      {/* Mechanical Shaft & Rotation Direction Arrow */}
      {direction !== 'STOP' && (
        <g transform="translate(32, 0)">
          {/* Mechanical shaft stub */}
          <line x1="0" y1="0" x2="16" y2="0" stroke="#94a3b8" strokeWidth="4" />
          {/* Rotating curved arrow */}
          <path
            d={direction === 'CW' 
              ? "M 10,-8 A 9,9 0 0,1 10,8 L 6,6 M 10,8 L 12,3" 
              : "M 10,8 A 9,9 0 0,1 10,-8 L 6,-6 M 10,-8 L 12,-3"}
            fill="none"
            stroke={flowColor}
            strokeWidth="1.8"
          />
        </g>
      )}

      {/* Component Title Tag */}
      <text
        x="0"
        y="-40"
        textAnchor="middle"
        fill="#94a3b8"
        fontSize="9.5"
        fontWeight="bold"
        fontFamily="monospace"
      >
        M1 (HOIST PMSM)
      </text>

      {/* Live Measurement Badge */}
      <g transform="translate(0, 52)">
        <rect
          x="-65"
          y="-6"
          width="130"
          height="44"
          rx="4"
          fill="#020617"
          stroke="#1e293b"
          strokeWidth="1.2"
        />
        <text
          x="0"
          y="6"
          textAnchor="middle"
          fill={flowColor}
          fontSize="10"
          fontFamily="monospace"
          fontWeight="bold"
        >
          {speedRpm} RPM | {torqueNm.toFixed(1)} Nm
        </text>
        <text
          x="0"
          y="20"
          textAnchor="middle"
          fill="#cbd5e1"
          fontSize="9"
          fontFamily="monospace"
        >
          {isRegen ? `REGEN: ${Math.round(Math.abs(mechPowerW))} W` : `P_mech: ${Math.round(mechPowerW)} W`}
        </text>
        <text
          x="0"
          y="32"
          textAnchor="middle"
          fill={flowColor}
          fontSize="8.5"
          fontFamily="monospace"
          fontWeight="bold"
        >
          DIR: {direction} | {temp.toFixed(1)}°C
        </text>
      </g>
    </g>
  );
};
