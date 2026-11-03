import React from 'react';

interface Props {
  x: number;
  y: number;
  voltage: number;         // Loaded terminal voltage
  vOcv?: number;           // Open circuit chemical voltage
  irDrop?: number;         // Instantaneous IR step
  powerW?: number;         // Watts
  current: number;         // Amps
  soc: number;             // %
  storedJoules: number;    // Joules
  storedWh?: number;       // Wh
  cellVoltages?: number[]; // 6 series cells
  status: 'CHARGING' | 'DISCHARGING' | 'FLOAT' | 'ISOLATED' | 'PRECHARGING';
  selected?: boolean;
  onClick?: () => void;
}

export const SupercapacitorSymbol: React.FC<Props> = ({
  x,
  y,
  voltage,
  vOcv = voltage,
  irDrop = 0,
  powerW = 0,
  current,
  soc,
  storedJoules,
  storedWh = storedJoules / 3600,
  cellVoltages = [2.35, 2.34, 2.36, 2.35, 2.33, 2.35],
  status,
  selected,
  onClick,
}) => {
  const isCharging = status === 'CHARGING';
  const isDischarging = status === 'DISCHARGING';
  const statusColor = isCharging ? '#10b981' : isDischarging ? '#f59e0b' : '#38bdf8';

  return (
    <g
      transform={`translate(${x}, ${y})`}
      className="cursor-pointer group"
      onClick={onClick}
    >
      {/* Dynamic Animated Electrolyte Field Glow */}
      {(isCharging || isDischarging) && (
        <rect
          x="-50"
          y="-34"
          width="100"
          height="68"
          rx="8"
          fill={isCharging ? '#10b981' : '#f59e0b'}
          fillOpacity="0.12"
          className="animate-pulse"
        />
      )}

      {/* Selection Glow */}
      {selected && (
        <rect
          x="-56"
          y="-40"
          width="112"
          height="80"
          rx="8"
          fill="none"
          stroke={statusColor}
          strokeWidth="2.5"
          strokeDasharray="4 2"
          className="animate-pulse"
        />
      )}

      {/* Terminal Leads: Top + (Red), Bottom - (Dark Blue) */}
      <line x1="0" y1="-38" x2="0" y2="-22" stroke="#ef4444" strokeWidth="2.5" />
      <circle cx="0" cy="-38" r="3" fill="#ef4444" />
      
      <line x1="0" y1="22" x2="0" y2="38" stroke="#1d4ed8" strokeWidth="2.5" />
      <circle cx="0" cy="38" r="3" fill="#1d4ed8" />

      {/* Main EDLC Enclosure Box */}
      <rect
        x="-48"
        y="-26"
        width="96"
        height="52"
        rx="6"
        fill="#090d16"
        stroke={selected ? statusColor : '#334155'}
        strokeWidth="1.8"
      />

      {/* Double-Layer Cell Array (6 Series EDLC Cells Representation) */}
      <g transform="translate(-36, -11)">
        {cellVoltages.slice(0, 6).map((cv, idx) => {
          const cx = idx * 14.5;
          return (
            <g key={idx} transform={`translate(${cx}, 0)`}>
              {/* Positive Plate */}
              <line x1="0" y1="0" x2="10" y2="0" stroke="#ef4444" strokeWidth="2.2" />
              {/* Porous Carbon / Helmholtz double layer */}
              <line x1="1" y1="5" x2="9" y2="5" stroke="#94a3b8" strokeWidth="1" strokeDasharray="1.5 1.5" />
              <line x1="1" y1="10" x2="9" y2="10" stroke="#94a3b8" strokeWidth="1" strokeDasharray="1.5 1.5" />
              {/* Negative Plate */}
              <line x1="0" y1="15" x2="10" y2="15" stroke="#1d4ed8" strokeWidth="2.2" />
              
              {/* Inter-cell connection link if not last */}
              {idx < 5 && (
                <line x1="10" y1="7.5" x2="14.5" y2="7.5" stroke="#64748b" strokeWidth="1.2" />
              )}
            </g>
          );
        })}
      </g>

      {/* Internal Bus Connection Lines */}
      <line x1="-36" y1="-11" x2="0" y2="-22" stroke="#ef4444" strokeWidth="1.5" />
      <line x1="36" y1="4" x2="0" y2="22" stroke="#1d4ed8" strokeWidth="1.5" />

      {/* Polarity Markers */}
      <text x="-42" y="-12" fill="#ef4444" fontSize="10" fontWeight="bold" fontFamily="monospace">+</text>
      <text x="36" y="20" fill="#60a5fa" fontSize="10" fontWeight="bold" fontFamily="monospace">-</text>

      {/* Tag: Placed cleanly to the TOP LEFT of the component box, clear of the right side and R_DUMP */}
      <text
        x="-14"
        y="-30"
        textAnchor="end"
        fill="#94a3b8"
        fontSize="8.5"
        fontWeight="bold"
        fontFamily="monospace"
      >
        SC_BANK (58F / 16.0V)
      </text>

      {/* Real-time State of Charge (SOC) Bar */}
      <g transform="translate(-35, 12)">
        <rect x="0" y="0" width="70" height="4" rx="2" fill="#1e293b" />
        <rect
          x="0"
          y="0"
          width={Math.max(2, 70 * (soc / 100))}
          height="4"
          rx="2"
          fill={soc >= 98 ? '#10b981' : soc > 30 ? (soc > 70 ? '#10b981' : '#38bdf8') : '#f59e0b'}
        />
      </g>

      {/* Rich Simulink/Proteus Engineering Live Measurement Badge */}
      <g transform="translate(0, 48)">
        <rect
          x="-75"
          y="-6"
          width="150"
          height="52"
          rx="5"
          fill="#020617"
          stroke="#1e293b"
          strokeWidth="1.2"
        />
        {/* Row 1: Loaded Vterm vs Internal Vocv */}
        <text
          x="0"
          y="7"
          textAnchor="middle"
          fill={statusColor}
          fontSize="10"
          fontFamily="monospace"
          fontWeight="bold"
        >
          V_term: {voltage.toFixed(2)}V {Math.abs(irDrop) > 0.02 ? `(IR: ${irDrop > 0 ? '+' : ''}${irDrop.toFixed(2)}V)` : ''}
        </text>

        {/* Row 2: Real Current & Power */}
        <text
          x="0"
          y="20"
          textAnchor="middle"
          fill={current > 0.5 ? '#10b981' : current < -0.5 ? '#f59e0b' : '#94a3b8'}
          fontSize="9.5"
          fontFamily="monospace"
          fontWeight="bold"
        >
          I_sc: {current > 0 ? `+${current.toFixed(2)}` : current.toFixed(2)} A | P: {Math.abs(powerW) > 0.1 ? `${Math.abs(powerW).toFixed(0)}W` : '0W'}
        </text>

        {/* Row 3: Stored Energy in kJ and Wh */}
        <text
          x="0"
          y="32"
          textAnchor="middle"
          fill="#cbd5e1"
          fontSize="8.5"
          fontFamily="monospace"
        >
          SOC: {soc.toFixed(1)}% | {(storedJoules / 1000).toFixed(2)} kJ ({storedWh.toFixed(2)} Wh)
        </text>

        {/* Row 4: Physical Operating State */}
        <text
          x="0"
          y="42"
          textAnchor="middle"
          fill={soc >= 98 ? '#10b981' : statusColor}
          fontSize="8"
          fontFamily="monospace"
          fontWeight="bold"
        >
          {soc >= 98 ? '[100% FULL - OVERFLOW DUMP]' : `[${status}]`} • ESR: 14.5mΩ
        </text>
      </g>
    </g>
  );
};
