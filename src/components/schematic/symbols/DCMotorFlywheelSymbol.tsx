import React from 'react';

interface Props {
  x: number;
  y: number;
  speedRpm: number;
  torqueNm: number;
  powerW: number;
  direction: 'CW' | 'CCW' | 'STOP';
  powerFlow: 'MOTORING' | 'REGENERATING' | 'IDLE';
  selected?: boolean;
  onClick?: () => void;
}

export const DCMotorFlywheelSymbol: React.FC<Props> = ({
  x,
  y,
  speedRpm,
  torqueNm,
  powerW,
  direction,
  powerFlow,
  selected,
  onClick,
}) => {
  const isRegen = powerFlow === 'REGENERATING';
  const isMotoring = powerFlow === 'MOTORING';
  const activeColor = isRegen ? '#10b981' : isMotoring ? '#38bdf8' : '#94a3b8';

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
          width="135"
          height="120"
          rx="8"
          fill="none"
          stroke={activeColor}
          strokeWidth="2.5"
          strokeDasharray="4 2"
          className="animate-pulse"
        />
      )}

      {/* Terminal Leads Left (from BTS7960 M+ and M-) */}
      <line x1="-32" y1="-14" x2="-22" y2="-14" stroke="#38bdf8" strokeWidth="2.5" />
      <circle cx="-32" cy="-14" r="2.5" fill="#38bdf8" />
      <text x="-24" y="-18" textAnchor="middle" fill="#38bdf8" fontSize="7.5" fontWeight="bold" fontFamily="monospace">M+</text>

      <line x1="-32" y1="14" x2="-22" y2="14" stroke="#38bdf8" strokeWidth="2.5" />
      <circle cx="-32" cy="14" r="2.5" fill="#38bdf8" />
      <text x="-24" y="25" textAnchor="middle" fill="#38bdf8" fontSize="7.5" fontWeight="bold" fontFamily="monospace">M-</text>

      {/* DC Motor Stator Frame (Circle) */}
      <circle
        cx="0"
        cy="0"
        r="22"
        fill="#090d16"
        stroke={activeColor}
        strokeWidth="2"
      />

      {/* Brushes Representation */}
      <rect x="-24" y="-7" width="4" height="14" rx="1" fill="#475569" />
      <rect x="20" y="-7" width="4" height="14" rx="1" fill="#475569" />

      {/* Motor 'M' Letter & DC Symbol */}
      <text
        x="0"
        y="4"
        textAnchor="middle"
        fill="#f8fafc"
        fontSize="14"
        fontWeight="bold"
        fontFamily="monospace"
      >
        M
      </text>
      <text
        x="0"
        y="14"
        textAnchor="middle"
        fill="#94a3b8"
        fontSize="7"
        fontFamily="monospace"
      >
        DC
      </text>

      {/* Shaft Coupling between Motor and Flywheel */}
      <line x1="22" y1="0" x2="44" y2="0" stroke="#94a3b8" strokeWidth="4" />

      {/* Flywheel Assembly (Inertial Disk from user sketch) */}
      <g transform="translate(60, 0)">
        {/* Outer Heavy Rim */}
        <circle cx="0" cy="0" r="20" fill="#0f172a" stroke="#cbd5e1" strokeWidth="3" />
        <circle cx="0" cy="0" r="16" fill="none" stroke="#475569" strokeWidth="1" strokeDasharray="3 2" />
        <circle cx="0" cy="0" r="5" fill="#94a3b8" />

        {/* Flywheel Spokes (Rotates when running) */}
        <line x1="-16" y1="0" x2="16" y2="0" stroke="#64748b" strokeWidth="1.8" />
        <line x1="0" y1="-16" x2="0" y2="16" stroke="#64748b" strokeWidth="1.8" />

        {/* Rotation Direction Arrow if rotating */}
        {speedRpm > 10 && (
          <path
            d={direction === 'CW' 
              ? "M -10,-12 A 16,16 0 0,1 10,-12"
              : "M 10,-12 A 16,16 0 0,0 -10,-12"
            }
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2"
            strokeLinecap="round"
            className="animate-spin"
            style={{ transformOrigin: '0 0' }}
          />
        )}
        <text
          x="0"
          y="32"
          textAnchor="middle"
          fill="#cbd5e1"
          fontSize="8"
          fontWeight="bold"
          fontFamily="monospace"
        >
          FLYWHEEL
        </text>
      </g>

      {/* Tag Label */}
      <text
        x="0"
        y="-32"
        textAnchor="middle"
        fill="#94a3b8"
        fontSize="8.5"
        fontWeight="bold"
        fontFamily="monospace"
      >
        DC MOTOR (TRACTION)
      </text>

      {/* Live Measurement Badge */}
      <g transform="translate(18, 48)">
        <rect
          x="-50"
          y="-6"
          width="100"
          height="28"
          rx="3"
          fill="#020617"
          stroke="#1e293b"
          strokeWidth="1.2"
        />
        <text
          x="0"
          y="5"
          textAnchor="middle"
          fill={activeColor}
          fontSize="8"
          fontWeight="bold"
          fontFamily="monospace"
        >
          {speedRpm} RPM | {direction}
        </text>
        <text
          x="0"
          y="16"
          textAnchor="middle"
          fill="#cbd5e1"
          fontSize="7.5"
          fontFamily="monospace"
        >
          T: {torqueNm.toFixed(1)} Nm | {powerW} W
        </text>
      </g>
    </g>
  );
};
