import React from 'react';

interface Props {
  x: number;
  y: number;
  mode: 'FORWARD' | 'REVERSE' | 'REGEN' | 'STANDBY';
  dutyCycle: number;
  outputVoltage: number;
  current: number;
  temp?: number;
  selected?: boolean;
  onClick?: () => void;
}

export const BTS7960Symbol: React.FC<Props> = ({
  x,
  y,
  mode,
  dutyCycle,
  outputVoltage,
  current,
  temp = 32.5,
  selected,
  onClick,
}) => {
  const isForward = mode === 'FORWARD';
  const isReverse = mode === 'REVERSE';
  const isRegen = mode === 'REGEN';
  const activeColor = isRegen ? '#10b981' : isForward ? '#38bdf8' : isReverse ? '#a855f7' : '#64748b';

  return (
    <g
      transform={`translate(${x}, ${y})`}
      className="cursor-pointer group"
      onClick={onClick}
    >
      {/* Selection Glow */}
      {selected && (
        <rect
          x="-75"
          y="-65"
          width="150"
          height="130"
          rx="8"
          fill="none"
          stroke={activeColor}
          strokeWidth="2.5"
          strokeDasharray="4 2"
          className="animate-pulse"
        />
      )}

      {/* Main PCB Module Body */}
      <rect
        x="-68"
        y="-58"
        width="136"
        height="116"
        rx="6"
        fill="#0b1329"
        stroke={selected ? activeColor : '#334155'}
        strokeWidth="1.8"
      />

      {/* Aluminum Heatsink Graphic on Module */}
      <rect x="-58" y="-48" width="116" height="24" rx="2" fill="#1e293b" stroke="#475569" strokeWidth="1" />
      {[-45, -30, -15, 0, 15, 30, 45].map((hx) => (
        <line key={hx} x1={hx} y1="-46" x2={hx} y2="-26" stroke="#64748b" strokeWidth="2" />
      ))}

      {/* Title placed cleanly above terminals */}
      <text
        x="0"
        y="-88"
        textAnchor="middle"
        fill="#38bdf8"
        fontSize="9.5"
        fontWeight="bold"
        fontFamily="monospace"
      >
        BTS7960 (43A H-BRIDGE DRIVER)
      </text>

      {/* Power Terminals (Top) */}
      <line x1="-35" y1="-58" x2="-35" y2="-72" stroke="#ef4444" strokeWidth="2.5" />
      <circle cx="-35" cy="-72" r="3" fill="#ef4444" />
      <text x="-35" y="-77" textAnchor="middle" fill="#ef4444" fontSize="8" fontWeight="bold" fontFamily="monospace">B+</text>

      <line x1="35" y1="-58" x2="35" y2="-72" stroke="#1d4ed8" strokeWidth="2.5" />
      <circle cx="35" cy="-72" r="3" fill="#1d4ed8" />
      <text x="35" y="-77" textAnchor="middle" fill="#60a5fa" fontSize="8" fontWeight="bold" fontFamily="monospace">B-</text>

      {/* Motor Output Terminals (Right side) */}
      <line x1="68" y1="-10" x2="84" y2="-10" stroke="#38bdf8" strokeWidth="2.5" />
      <circle cx="84" cy="-10" r="3" fill="#38bdf8" />
      <text x="62" y="-7" textAnchor="end" fill="#38bdf8" fontSize="8" fontWeight="bold" fontFamily="monospace">M+</text>

      <line x1="68" y1="18" x2="84" y2="18" stroke="#38bdf8" strokeWidth="2.5" />
      <circle cx="84" cy="18" r="3" fill="#38bdf8" />
      <text x="62" y="21" textAnchor="end" fill="#38bdf8" fontSize="8" fontWeight="bold" fontFamily="monospace">M-</text>

      {/* Logic Control Pins (Left side - from Arduino) */}
      <g transform="translate(-68, -12)">
        {[
          { name: 'RPWM', y: 0, color: '#f59e0b' },
          { name: 'LPWM', y: 12, color: '#a855f7' },
          { name: 'R_EN', y: 24, color: '#10b981' },
          { name: 'L_EN', y: 36, color: '#10b981' },
        ].map((pin) => (
          <g key={pin.name} transform={`translate(0, ${pin.y})`}>
            <line x1="-12" y1="0" x2="0" y2="0" stroke={pin.color} strokeWidth="1.8" />
            <circle cx="-12" cy="0" r="2.2" fill={pin.color} />
            <text x="4" y="3" fill="#cbd5e1" fontSize="7" fontWeight="bold" fontFamily="monospace">
              {pin.name}
            </text>
          </g>
        ))}
      </g>

      {/* Internal State Info Display */}
      <g transform="translate(0, 10)">
        <rect x="-42" y="-12" width="84" height="40" rx="3" fill="#020617" stroke="#1e293b" strokeWidth="1.2" />
        <text
          x="0"
          y="0"
          textAnchor="middle"
          fill={activeColor}
          fontSize="8.5"
          fontWeight="bold"
          fontFamily="monospace"
        >
          {isRegen ? 'REGEN BRAKE' : isForward ? 'FWD DRIVE' : isReverse ? 'REV DRIVE' : 'COAST / IDLE'}
        </text>
        <text
          x="0"
          y="12"
          textAnchor="middle"
          fill="#cbd5e1"
          fontSize="7.5"
          fontFamily="monospace"
        >
          PWM: {dutyCycle}% | {outputVoltage.toFixed(1)}V
        </text>
        <text
          x="0"
          y="23"
          textAnchor="middle"
          fill="#94a3b8"
          fontSize="7.5"
          fontFamily="monospace"
        >
          I_out: {Math.abs(current).toFixed(2)}A | {temp.toFixed(0)}°C
        </text>
      </g>
    </g>
  );
};
