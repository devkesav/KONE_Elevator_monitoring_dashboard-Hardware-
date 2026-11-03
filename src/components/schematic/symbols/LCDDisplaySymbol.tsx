import React from 'react';

interface Props {
  x: number;
  y: number;
  powerFlow: 'MOTORING' | 'REGENERATING' | 'IDLE';
  motorDirection: 'CW' | 'CCW' | 'STOP';
  dutyCycle: number;
  vdcBus: number;
  vScap: number;
  motorCurrent: number;
  selected?: boolean;
  onClick?: () => void;
}

export const LCDDisplaySymbol: React.FC<Props> = ({
  x,
  y,
  powerFlow,
  motorDirection,
  dutyCycle,
  vdcBus,
  vScap,
  motorCurrent,
  selected,
  onClick,
}) => {
  // Determine 4-Quadrant Operation:
  // Q1: Forward Motoring (CW + Motoring)
  // Q2: Forward Regen (CW + Regenerating)
  // Q3: Reverse Motoring (CCW + Motoring)
  // Q4: Reverse Regen (CCW + Regenerating)
  let quadrantText = 'Q1: FWD MOTOR';
  let quadrantBadgeColor = '#38bdf8'; // Cyan
  if (powerFlow === 'REGENERATING') {
    if (motorDirection === 'CCW') {
      quadrantText = 'Q4: REV REGEN';
      quadrantBadgeColor = '#10b981'; // Green
    } else {
      quadrantText = 'Q2: FWD REGEN';
      quadrantBadgeColor = '#10b981'; // Green
    }
  } else if (powerFlow === 'MOTORING') {
    if (motorDirection === 'CCW') {
      quadrantText = 'Q3: REV MOTOR';
      quadrantBadgeColor = '#a855f7'; // Purple
    } else {
      quadrantText = 'Q1: FWD MOTOR';
      quadrantBadgeColor = '#38bdf8'; // Cyan
    }
  } else {
    quadrantText = 'STANDBY / IDLE';
    quadrantBadgeColor = '#94a3b8'; // Slate
  }

  return (
    <g
      transform={`translate(${x}, ${y})`}
      className="cursor-pointer group"
      onClick={onClick}
    >
      {/* Selection Glow */}
      {selected && (
        <rect
          x="-95"
          y="-55"
          width="190"
          height="110"
          rx="8"
          fill="none"
          stroke="#38bdf8"
          strokeWidth="2.5"
          strokeDasharray="4 2"
          className="animate-pulse"
        />
      )}

      {/* Main LCD Module PCB (Green/Blue PCB) */}
      <rect
        x="-88"
        y="-48"
        width="176"
        height="96"
        rx="6"
        fill="#042f2e"
        stroke={selected ? '#38bdf8' : '#115e59'}
        strokeWidth="1.8"
      />

      {/* Mounting screw holes */}
      {[-80, 80].map((mx) =>
        [-40, 40].map((my) => (
          <circle key={`${mx}-${my}`} cx={mx} cy={my} r="2.5" fill="#0f172a" stroke="#334155" strokeWidth="1" />
        ))
      )}

      {/* LCD Header Label */}
      <text
        x="0"
        y="-54"
        textAnchor="middle"
        fill="#94a3b8"
        fontSize="9.5"
        fontWeight="bold"
        fontFamily="monospace"
      >
        I2C 16x2 LCD DISPLAY MODULE
      </text>

      {/* Backlit Blue LCD Screen */}
      <rect
        x="-72"
        y="-34"
        width="144"
        height="56"
        rx="3"
        fill="#0284c7"
        fillOpacity="0.85"
        stroke="#0369a1"
        strokeWidth="1.5"
      />

      {/* Inner LCD Character Matrix Screen (Dark Blue) */}
      <rect
        x="-68"
        y="-30"
        width="136"
        height="48"
        rx="2"
        fill="#082f49"
      />

      {/* LINE 1: 4-Quadrant Status & PWM Duty Cycle */}
      <text
        x="-62"
        y="-16"
        fill={quadrantBadgeColor}
        fontSize="8"
        fontWeight="bold"
        fontFamily="monospace"
        letterSpacing="0.5"
      >
        4-Q: [{quadrantText}]
      </text>
      <text
        x="62"
        y="-16"
        textAnchor="end"
        fill="#facc15"
        fontSize="8"
        fontWeight="bold"
        fontFamily="monospace"
      >
        D: {dutyCycle}%
      </text>

      {/* LINE 2: Bus Voltage, Supercap Voltage, Current */}
      <text
        x="-62"
        y="1"
        fill="#f8fafc"
        fontSize="8"
        fontWeight="bold"
        fontFamily="monospace"
      >
        Vdc:{vdcBus.toFixed(1)}V  Vsc:{vScap.toFixed(1)}V
      </text>
      <text
        x="-62"
        y="12"
        fill="#7dd3fc"
        fontSize="7.5"
        fontFamily="monospace"
      >
        I:{motorCurrent > 0 ? `+${motorCurrent.toFixed(1)}` : motorCurrent.toFixed(1)}A  {powerFlow}
      </text>

      {/* 4-Pin I2C Header (GND, VCC, SDA, SCL) on Left Edge */}
      <g transform="translate(-88, -18)">
        {[
          { name: 'GND', y: 0, color: '#1d4ed8' },
          { name: 'VCC', y: 12, color: '#ef4444' },
          { name: 'SDA', y: 24, color: '#f59e0b' },
          { name: 'SCL', y: 36, color: '#10b981' },
        ].map((pin) => (
          <g key={pin.name} transform={`translate(0, ${pin.y})`}>
            <line x1="-10" y1="0" x2="0" y2="0" stroke={pin.color} strokeWidth="1.8" />
            <circle cx="-10" cy="0" r="2.2" fill={pin.color} />
            <text x="3" y="3" fill="#cbd5e1" fontSize="6.5" fontWeight="bold" fontFamily="monospace">
              {pin.name}
            </text>
          </g>
        ))}
      </g>
    </g>
  );
};
