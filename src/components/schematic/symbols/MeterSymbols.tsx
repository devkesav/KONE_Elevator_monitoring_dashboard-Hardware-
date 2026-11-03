import React from 'react';

interface MeterProps {
  x: number;
  y: number;
  type: 'VOLT' | 'AMP';
  isAc?: boolean;
  value: number;
  unit: string;
  tag: string;
  orientation?: 'horizontal' | 'vertical';
  badgePosition?: 'top' | 'bottom' | 'left' | 'right';
  selected?: boolean;
  onClick?: () => void;
}

export const MeterSymbol: React.FC<MeterProps> = ({
  x,
  y,
  type,
  isAc = false,
  value,
  unit,
  tag,
  orientation = 'horizontal',
  badgePosition,
  selected,
  onClick,
}) => {
  const isVolt = type === 'VOLT';
  const meterColor = isVolt ? '#38bdf8' : '#fbbf24';

  // Smart badge position
  const resolvedBadgePos = badgePosition || (orientation === 'vertical' ? 'right' : 'bottom');

  let badgeTransform = 'translate(0, 26)';
  if (resolvedBadgePos === 'right') badgeTransform = 'translate(46, 0)';
  else if (resolvedBadgePos === 'left') badgeTransform = 'translate(-46, 0)';
  else if (resolvedBadgePos === 'top') badgeTransform = 'translate(0, -28)';

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
          r="24"
          fill="none"
          stroke={meterColor}
          strokeWidth="2"
          strokeDasharray="3 2"
          className="animate-pulse"
        />
      )}

      {/* Terminal leads */}
      {orientation === 'horizontal' ? (
        <>
          <line x1="-28" y1="0" x2="-18" y2="0" stroke="#38bdf8" strokeWidth="2.5" />
          <line x1="18" y1="0" x2="28" y2="0" stroke="#38bdf8" strokeWidth="2.5" />
          <circle cx="-28" cy="0" r="2.5" fill="#38bdf8" />
          <circle cx="28" cy="0" r="2.5" fill="#38bdf8" />
        </>
      ) : (
        <>
          <line x1="0" y1="-32" x2="0" y2="-18" stroke="#38bdf8" strokeWidth="2.5" />
          <line x1="0" y1="18" x2="0" y2="32" stroke="#38bdf8" strokeWidth="2.5" />
          <circle cx="0" cy="-32" r="2.5" fill="#38bdf8" />
          <circle cx="0" cy="32" r="2.5" fill="#38bdf8" />
        </>
      )}

      {/* Outer Circle (IEC Meter) */}
      <circle
        cx="0"
        cy="0"
        r="18"
        fill="#090d16"
        stroke={meterColor}
        strokeWidth="2"
        className="transition-colors group-hover:brightness-125"
      />

      {/* Symbol Letter V or A */}
      <text
        x="0"
        y={isAc ? "1" : "3"}
        textAnchor="middle"
        fill="#f8fafc"
        fontSize="13"
        fontWeight="bold"
        fontFamily="monospace"
        className="select-none"
      >
        {isVolt ? 'V' : 'A'}
      </text>

      {/* AC/DC indicator below letter */}
      {isAc ? (
        <text
          x="0"
          y="11"
          textAnchor="middle"
          fill="#38bdf8"
          fontSize="9"
          fontWeight="bold"
          fontFamily="sans-serif"
          className="select-none"
        >
          ~
        </text>
      ) : (
        <text
          x="0"
          y="10"
          textAnchor="middle"
          fill="#94a3b8"
          fontSize="8"
          fontWeight="bold"
          fontFamily="monospace"
          className="select-none"
        >
          ⎓
        </text>
      )}

      {/* Tag Label */}
      <text
        x="0"
        y="-22"
        textAnchor="middle"
        fill="#94a3b8"
        fontSize="8.5"
        fontWeight="bold"
        fontFamily="monospace"
        className="select-none"
      >
        {tag}
      </text>

      {/* Live Value Digital Readout Badge */}
      <g transform={badgeTransform}>
        <rect
          x="-30"
          y="-8.5"
          width="60"
          height="17"
          rx="3"
          fill="#020617"
          stroke="#1e293b"
          strokeWidth="1.2"
        />
        <text
          x="0"
          y="3.5"
          textAnchor="middle"
          fill={meterColor}
          fontSize="9"
          fontWeight="bold"
          fontFamily="monospace"
        >
          {value.toFixed(isVolt ? 1 : 2)} {unit}
        </text>
      </g>
    </g>
  );
};
