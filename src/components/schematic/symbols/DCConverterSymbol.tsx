import React from 'react';

interface Props {
  x: number;
  y: number;
  mode: 'BUCK' | 'BOOST' | 'STANDBY';
  dutyCycle: number;
  current: number;
  temp: number;
  selected?: boolean;
  onClick?: () => void;
}

export const DCConverterSymbol: React.FC<Props> = ({
  x,
  y,
  mode,
  dutyCycle,
  current,
  temp,
  selected,
  onClick,
}) => {
  const isBuck = mode === 'BUCK';
  const isBoost = mode === 'BOOST';
  const activeColor = isBuck ? '#10b981' : isBoost ? '#f59e0b' : '#38bdf8';

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
          y="-60"
          width="150"
          height="120"
          rx="6"
          fill="none"
          stroke={activeColor}
          strokeWidth="2.5"
          strokeDasharray="4 2"
          className="animate-pulse"
        />
      )}

      {/* Main Enclosure */}
      <rect
        x="-65"
        y="-50"
        width="130"
        height="100"
        rx="4"
        fill="#090d16"
        stroke="#334155"
        strokeWidth="1.8"
      />

      {/* Title */}
      <text
        x="0"
        y="-56"
        textAnchor="middle"
        fill="#94a3b8"
        fontSize="9.5"
        fontWeight="bold"
        fontFamily="monospace"
      >
        CONV1 (BIDIRECTIONAL DC-DC)
      </text>

      {/* Terminals:
          Left side: SCAP+ (-65, -25) and SCAP- (-65, 25) [to Supercapacitor]
          Right side: B_BUS+ (65, -25) and B_BUS- (65, 25) [to DC Bus]
      */}
      {/* Left Terminals (to Supercapacitor branch) */}
      <line x1="-75" y1="-25" x2="-65" y2="-25" stroke="#ef4444" strokeWidth="2.5" />
      <circle cx="-75" cy="-25" r="3" fill="#ef4444" />
      <text x="-58" y="-22" fill="#ef4444" fontSize="8" fontWeight="bold" fontFamily="monospace">SC+</text>

      <line x1="-75" y1="25" x2="-65" y2="25" stroke="#1d4ed8" strokeWidth="2.5" />
      <circle cx="-75" cy="25" r="3" fill="#1d4ed8" />
      <text x="-58" y="28" fill="#60a5fa" fontSize="8" fontWeight="bold" fontFamily="monospace">SC-</text>

      {/* Right Terminals (from DC Bus) */}
      <line x1="65" y1="-25" x2="75" y2="-25" stroke="#ef4444" strokeWidth="2.5" />
      <circle cx="75" cy="-25" r="3" fill="#ef4444" />
      <text x="46" y="-22" fill="#ef4444" fontSize="8" fontWeight="bold" fontFamily="monospace">B+</text>

      <line x1="65" y1="25" x2="75" y2="25" stroke="#1d4ed8" strokeWidth="2.5" />
      <circle cx="75" cy="25" r="3" fill="#1d4ed8" />
      <text x="46" y="28" fill="#60a5fa" fontSize="8" fontWeight="bold" fontFamily="monospace">B-</text>

      {/* Internal Power Electronics: IGBT Q1 (High Side Buck Switch) */}
      <g transform="translate(15, -20)">
        {/* Collector from B+ */}
        <line x1="15" y1="-5" x2="0" y2="-5" stroke="#ef4444" strokeWidth="1.5" />
        {/* Gate bar */}
        <line x1="0" y1="-12" x2="0" y2="2" stroke="#94a3b8" strokeWidth="2" />
        {/* Channel & Emitter */}
        <line x1="-5" y1="-10" x2="-5" y2="0" stroke="#94a3b8" strokeWidth="1.5" />
        <line x1="-5" y1="-2" x2="-15" y2="4" stroke="#94a3b8" strokeWidth="1.5" />
        {/* Emitter arrow pointing to SC */}
        <polygon points="-12,2 -15,4 -11,5" fill="#94a3b8" />
        <text x="0" y="-14" textAnchor="middle" fill="#64748b" fontSize="7" fontFamily="monospace">Q1</text>
      </g>

      {/* Inductor L1 in the middle */}
      <g transform="translate(-15, -25)">
        <path
          d="M -12,0 
             A 4,4 0 0,1 -4,0 
             A 4,4 0 0,1 4,0 
             A 4,4 0 0,1 12,0"
          fill="none"
          stroke="#f59e0b"
          strokeWidth="2.5"
        />
        <text x="0" y="-7" textAnchor="middle" fill="#f59e0b" fontSize="7.5" fontFamily="monospace">L1 (47µH)</text>
      </g>

      {/* Common Ground Return bus */}
      <line x1="-65" y1="25" x2="65" y2="25" stroke="#1d4ed8" strokeWidth="2" />

      {/* Bi-directional power arrow */}
      <g transform="translate(0, 5)">
        {isBuck ? (
          // Buck flow: Right to Left (charging supercap with regen energy from bus)
          <path d="M 16,0 L -16,0 M -10,-4 L -16,0 L -10,4" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
        ) : isBoost ? (
          // Boost flow: Left to Right (discharging supercap to DC bus)
          <path d="M -16,0 L 16,0 M 10,-4 L 16,0 L 10,4" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
        ) : (
          // Standby dual arrow
          <path d="M -12,0 L 12,0 M -8,-3 L -12,0 L -8,3 M 8,-3 L 12,0 L 8,3" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" />
        )}
      </g>

      {/* Live Measurement Badge */}
      <g transform="translate(0, 60)">
        <rect
          x="-62"
          y="-6"
          width="124"
          height="34"
          rx="4"
          fill="#020617"
          stroke="#1e293b"
          strokeWidth="1.2"
        />
        <text
          x="0"
          y="6"
          textAnchor="middle"
          fill={activeColor}
          fontSize="9.5"
          fontFamily="monospace"
          fontWeight="bold"
        >
          MODE: {mode} ({dutyCycle}%)
        </text>
        <text
          x="0"
          y="20"
          textAnchor="middle"
          fill="#94a3b8"
          fontSize="8.5"
          fontFamily="monospace"
        >
          I_conv: {current.toFixed(2)}A | {temp.toFixed(1)}°C
        </text>
      </g>
    </g>
  );
};
