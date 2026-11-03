import React from 'react';

interface Props {
  x: number;
  y: number;
  selected?: boolean;
  onClick?: () => void;
}

export const ArduinoSymbol: React.FC<Props> = ({
  x,
  y,
  selected,
  onClick,
}) => {
  // Generous PCB Dimensions: Width 148, Height 124
  const pcbWidth = 148;
  const pcbHeight = 124;
  const halfW = pcbWidth / 2;  // 74
  const halfH = pcbHeight / 2;  // 62

  return (
    <g
      transform={`translate(${x}, ${y})`}
      className="cursor-pointer group"
      onClick={onClick}
    >
      {/* Selection Glow */}
      {selected && (
        <rect
          x={-halfW - 8}
          y={-halfH - 8}
          width={pcbWidth + 16}
          height={pcbHeight + 16}
          rx="10"
          fill="none"
          stroke="#00979d"
          strokeWidth="2.5"
          strokeDasharray="4 2"
          className="animate-pulse"
        />
      )}

      {/* Main Arduino PCB (Teal / Arduino Blue) */}
      <rect
        x={-halfW}
        y={-halfH}
        width={pcbWidth}
        height={pcbHeight}
        rx="8"
        fill="#005e62"
        stroke={selected ? '#38bdf8' : '#00979d'}
        strokeWidth="2"
      />

      {/* USB Port & Power Barrel Jack */}
      <rect x={-halfW + 8} y={-halfH} width={26} height="13" rx="1" fill="#94a3b8" />
      <rect x={halfW - 28} y={-halfH} width="20" height="15" rx="2" fill="#0f172a" />

      {/* Central ATmega328P MCU Chip with ample clearance */}
      <rect x="-26" y="-16" width="52" height="32" rx="3" fill="#090d16" stroke="#1e293b" strokeWidth="1.2" />
      <text x="0" y="3" textAnchor="middle" fill="#94a3b8" fontSize="7.5" fontWeight="bold" fontFamily="monospace">
        ATmega328P
      </text>

      {/* Header Label (Top) */}
      <text
        x="0"
        y={-halfH - 10}
        textAnchor="middle"
        fill="#38bdf8"
        fontSize="10"
        fontWeight="bold"
        fontFamily="monospace"
      >
        ARDUINO CONTROLLER
      </text>

      {/* Power Indicator LED (Top Right Inside) */}
      <g transform={`translate(${halfW - 18}, ${-halfH + 26})`}>
        <circle cx="0" cy="0" r="3" fill="#10b981" className="animate-pulse" />
        <text x="-6" y="3" textAnchor="end" fill="#64748b" fontSize="6" fontFamily="monospace">PWR</text>
      </g>

      {/* Right side pins: Digital PWM to BTS7960 */}
      <g transform={`translate(${halfW}, -24)`}>
        {[
          { pin: 'D5 (RPWM)', color: '#f59e0b', y: 0 },
          { pin: 'D6 (LPWM)', color: '#a855f7', y: 15 },
          { pin: 'D9 (R_EN)', color: '#10b981', y: 30 },
          { pin: 'D10 (L_EN)', color: '#10b981', y: 45 },
        ].map((p) => (
          <g key={p.pin} transform={`translate(0, ${p.y})`}>
            <line x1="0" y1="0" x2="14" y2="0" stroke={p.color} strokeWidth="2" />
            <circle cx="14" cy="0" r="2.5" fill={p.color} />
            <text x="-6" y="3.5" textAnchor="end" fill="#cbd5e1" fontSize="7.5" fontWeight="bold" fontFamily="monospace">
              {p.pin}
            </text>
          </g>
        ))}
      </g>

      {/* Left side pins: I2C to LCD Display */}
      <g transform={`translate(${-halfW}, -8)`}>
        {[
          { pin: 'A4 (SDA)', color: '#f59e0b', y: 0 },
          { pin: 'A5 (SCL)', color: '#10b981', y: 15 },
          { pin: '5V (VCC)', color: '#ef4444', y: 30 },
          { pin: 'GND', color: '#1d4ed8', y: 45 },
        ].map((p) => (
          <g key={p.pin} transform={`translate(0, ${p.y})`}>
            <line x1="-14" y1="0" x2="0" y2="0" stroke={p.color} strokeWidth="2" />
            <circle cx="-14" cy="0" r="2.5" fill={p.color} />
            <text x="6" y="3.5" fill="#cbd5e1" fontSize="7.5" fontWeight="bold" fontFamily="monospace">
              {p.pin}
            </text>
          </g>
        ))}
      </g>
    </g>
  );
};
