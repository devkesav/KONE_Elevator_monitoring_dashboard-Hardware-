import React from 'react';

interface Props {
  x: number;
  y: number;
  vacIn: number;
  vdcOut: number;
  idcOut: number;
  diodeStatus: [boolean, boolean, boolean, boolean]; // D1, D2, D3, D4
  selected?: boolean;
  onClick?: () => void;
}

export const BridgeRectifierSymbol: React.FC<Props> = ({
  x,
  y,
  vacIn,
  vdcOut,
  idcOut,
  diodeStatus,
  selected,
  onClick,
}) => {
  // Helper to render an IEEE / IEC diode pointing UP (anode at bottom, cathode at top)
  const renderVerticalDiode = (
    name: string,
    dx: number,
    dy: number,
    labelX: number,
    isActive: boolean
  ) => {
    const diodeColor = isActive ? '#38bdf8' : '#475569';
    const diodeFill = isActive ? '#0284c7' : '#1e293b';

    return (
      <g transform={`translate(${dx}, ${dy})`}>
        {/* Anode triangle pointing UP */}
        <polygon
          points="-8,7 8,7 0,-7"
          fill={diodeFill}
          stroke={diodeColor}
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        {/* Cathode horizontal bar across top */}
        <line
          x1="-9"
          y1="-7"
          x2="9"
          y2="-7"
          stroke={diodeColor}
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        {/* Diode identifier label */}
        <text
          x={labelX}
          y="3"
          textAnchor={labelX < 0 ? 'end' : 'start'}
          fill={isActive ? '#7dd3fc' : '#94a3b8'}
          fontSize="8.5"
          fontFamily="monospace"
          fontWeight="bold"
        >
          {name}
        </text>
      </g>
    );
  };

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
          stroke="#38bdf8"
          strokeWidth="2"
          strokeDasharray="4 2"
          className="animate-pulse"
        />
      )}

      {/* Bridge Enclosure Boundary (IEC module dashed boundary) */}
      <rect
        x="-68"
        y="-52"
        width="136"
        height="104"
        rx="6"
        fill="#090d16"
        fillOpacity="0.9"
        stroke="#1e293b"
        strokeWidth="1.5"
        strokeDasharray="3 3"
      />

      {/* Component Reference Header (Well above the top DC rail) */}
      <text
        x="0"
        y="-58"
        textAnchor="middle"
        fill="#94a3b8"
        fontSize="9.5"
        fontWeight="bold"
        fontFamily="monospace"
      >
        BR1 (FULL-WAVE BRIDGE)
      </text>

      {/* ============================================================== */}
      {/* TOP DC+ BUS (Red at y = -38)                                   */}
      {/* ============================================================== */}
      <line x1="-24" y1="-38" x2="68" y2="-38" stroke="#ef4444" strokeWidth="2.5" />
      <circle cx="-24" cy="-38" r="3" fill="#ef4444" />
      <circle cx="24" cy="-38" r="3" fill="#ef4444" />
      <circle cx="68" cy="-38" r="3" fill="#ef4444" />
      <text x="60" y="-44" fill="#ef4444" fontSize="8.5" fontWeight="bold" fontFamily="monospace">
        DC +
      </text>

      {/* ============================================================== */}
      {/* BOTTOM DC- BUS (Dark Blue at y = +38)                          */}
      {/* ============================================================== */}
      <line x1="-24" y1="38" x2="68" y2="38" stroke="#1d4ed8" strokeWidth="2.5" />
      <circle cx="-24" cy="38" r="3" fill="#1d4ed8" />
      <circle cx="24" cy="38" r="3" fill="#1d4ed8" />
      <circle cx="68" cy="38" r="3" fill="#1d4ed8" />
      <text x="60" y="48" fill="#60a5fa" fontSize="8.5" fontWeight="bold" fontFamily="monospace">
        DC -
      </text>

      {/* ============================================================== */}
      {/* LEFT LEG: D1 (Upper) & D2 (Lower) at x = -24                    */}
      {/* ============================================================== */}
      {/* Line from DC+ to D1 cathode */}
      <line x1="-24" y1="-38" x2="-24" y2="-27" stroke="#ef4444" strokeWidth="2" />
      {/* D1 Symbol at y = -20 */}
      {renderVerticalDiode('D1', -24, -20, -12, diodeStatus[0])}
      {/* Line from D1 anode to AC1 midpoint */}
      <line x1="-24" y1="-13" x2="-24" y2="0" stroke="#38bdf8" strokeWidth="2" />

      {/* Midpoint Junction 1 */}
      <circle cx="-24" cy="0" r="3" fill="#38bdf8" />

      {/* Line from AC1 midpoint to D2 cathode */}
      <line x1="-24" y1="0" x2="-24" y2="13" stroke="#38bdf8" strokeWidth="2" />
      {/* D2 Symbol at y = +20 */}
      {renderVerticalDiode('D2', -24, 20, -12, diodeStatus[1])}
      {/* Line from D2 anode to DC- */}
      <line x1="-24" y1="27" x2="-24" y2="38" stroke="#1d4ed8" strokeWidth="2" />

      {/* ============================================================== */}
      {/* RIGHT LEG: D3 (Upper) & D4 (Lower) at x = +24                   */}
      {/* ============================================================== */}
      {/* Line from DC+ to D3 cathode */}
      <line x1="24" y1="-38" x2="24" y2="-27" stroke="#ef4444" strokeWidth="2" />
      {/* D3 Symbol at y = -20 */}
      {renderVerticalDiode('D3', 24, -20, 12, diodeStatus[2])}
      {/* Line from D3 anode to AC2 midpoint */}
      <line x1="24" y1="-13" x2="24" y2="0" stroke="#38bdf8" strokeWidth="2" />

      {/* Midpoint Junction 2 */}
      <circle cx="24" cy="0" r="3" fill="#38bdf8" />

      {/* Line from AC2 midpoint to D4 cathode */}
      <line x1="24" y1="0" x2="24" y2="13" stroke="#38bdf8" strokeWidth="2" />
      {/* D4 Symbol at y = +20 */}
      {renderVerticalDiode('D4', 24, 20, 12, diodeStatus[3])}
      {/* Line from D4 anode to DC- */}
      <line x1="24" y1="27" x2="24" y2="38" stroke="#1d4ed8" strokeWidth="2" />

      {/* ============================================================== */}
      {/* AC INPUT LEADS (From Left terminals to midpoints)              */}
      {/* ============================================================== */}
      {/* AC1 Input (Upper left terminal at y = -14) */}
      <line x1="-68" y1="-14" x2="-44" y2="-14" stroke="#38bdf8" strokeWidth="2.5" />
      <line x1="-44" y1="-14" x2="-44" y2="0" stroke="#38bdf8" strokeWidth="2" />
      <line x1="-44" y1="0" x2="-24" y2="0" stroke="#38bdf8" strokeWidth="2" />
      <circle cx="-68" cy="-14" r="3" fill="#38bdf8" />
      <text x="-62" y="-18" fill="#38bdf8" fontSize="8" fontFamily="monospace">AC ~</text>

      {/* AC2 Input (Lower left terminal at y = +14, routed to Right leg midpoint) */}
      {/* It routes horizontally, arches/bridges past the left branch, into Junction 2 */}
      <line x1="-68" y1="14" x2="-32" y2="14" stroke="#38bdf8" strokeWidth="2.5" />
      {/* Clean bridge jumper arch across left leg (from x = -32 to x = -16) */}
      <path
        d="M -32,14 A 8,8 0 0,1 -16,14"
        fill="none"
        stroke="#38bdf8"
        strokeWidth="2"
      />
      <line x1="-16" y1="14" x2="6" y2="14" stroke="#38bdf8" strokeWidth="2" />
      <line x1="6" y1="14" x2="6" y2="0" stroke="#38bdf8" strokeWidth="2" />
      <line x1="6" y1="0" x2="24" y2="0" stroke="#38bdf8" strokeWidth="2" />
      <circle cx="-68" cy="14" r="3" fill="#38bdf8" />
      <text x="-62" y="24" fill="#38bdf8" fontSize="8" fontFamily="monospace">AC ~</text>

      {/* ============================================================== */}
      {/* LIVE TELEMETRY BADGE                                           */}
      {/* ============================================================== */}
      <g transform="translate(0, 68)">
        <rect
          x="-62"
          y="-8"
          width="124"
          height="32"
          rx="4"
          fill="#020617"
          stroke="#1e293b"
          strokeWidth="1.2"
        />
        <text
          x="0"
          y="4"
          textAnchor="middle"
          fill="#38bdf8"
          fontSize="9.5"
          fontFamily="monospace"
          fontWeight="bold"
        >
          VAC: {vacIn.toFixed(1)}V ➔ VDC: {vdcOut.toFixed(1)}V
        </text>
        <text
          x="0"
          y="18"
          textAnchor="middle"
          fill="#94a3b8"
          fontSize="9"
          fontFamily="monospace"
        >
          I_rect: {idcOut.toFixed(2)} A
        </text>
      </g>
    </g>
  );
};
