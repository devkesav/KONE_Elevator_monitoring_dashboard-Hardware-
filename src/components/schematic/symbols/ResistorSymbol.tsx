import React from 'react';

interface Props {
  x: number;
  y: number;
  resistanceOhm: number;
  tag?: string;
  orientation?: 'horizontal' | 'vertical';
  isDissipatingHeat?: boolean;
  dissipatedPowerW?: number;
  temperatureC?: number;
  showBadge?: boolean;
  selected?: boolean;
  onClick?: () => void;
}

export const ResistorSymbol: React.FC<Props> = ({
  x,
  y,
  resistanceOhm,
  tag = 'R_DUMP',
  orientation = 'horizontal',
  isDissipatingHeat = false,
  dissipatedPowerW = 0,
  temperatureC = 28.0,
  showBadge,
  selected,
  onClick,
}) => {
  const resistorColor = isDissipatingHeat ? '#f97316' : '#f59e0b';
  // Only show the live dissipation badge if it's explicitly enabled or actively dissipating heat
  const shouldRenderBadge = showBadge !== undefined ? showBadge : isDissipatingHeat;
  const displayTag = tag.includes('Ω') ? tag : `${tag} (${resistanceOhm} Ω)`;

  return (
    <g
      transform={`translate(${x}, ${y})`}
      className="cursor-pointer group"
      onClick={onClick}
    >
      {/* Dynamic Thermal Dissipation Glow Aura */}
      {isDissipatingHeat && (
        <circle
          cx="0"
          cy="0"
          r="32"
          fill="#f97316"
          fillOpacity="0.18"
          className="animate-pulse"
        />
      )}

      {selected && (
        <rect
          x="-36"
          y="-22"
          width="72"
          height="44"
          rx="4"
          fill="none"
          stroke={resistorColor}
          strokeWidth="2"
          strokeDasharray="3 2"
        />
      )}

      {/* Radiating Thermal Heat Waves Animation when dissipating power */}
      {isDissipatingHeat && (
        <g stroke="#f97316" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.85">
          {orientation === 'horizontal' ? (
            <>
              {/* Thermal wave 1 */}
              <path
                d="M -12,-16 C -10,-20 -6,-18 -4,-22 C -2,-26 2,-24 4,-28"
                className="animate-bounce"
              />
              {/* Thermal wave 2 */}
              <path
                d="M 2,-16 C 4,-20 8,-18 10,-22 C 12,-26 16,-24 18,-28"
                className="animate-bounce"
                style={{ animationDelay: '0.2s' }}
              />
            </>
          ) : (
            <>
              {/* Thermal wave side */}
              <path
                d="M 16,-10 C 20,-8 18,-4 22,-2 C 26,0 24,4 28,6"
                className="animate-pulse"
              />
              <path
                d="M 16,6 C 20,8 18,12 22,14 C 26,16 24,20 28,22"
                className="animate-pulse"
                style={{ animationDelay: '0.3s' }}
              />
            </>
          )}
        </g>
      )}

      {orientation === 'horizontal' ? (
        <>
          {/* Connecting leads */}
          <line x1="-30" y1="0" x2="-18" y2="0" stroke={resistorColor} strokeWidth="2.5" />
          <line x1="18" y1="0" x2="30" y2="0" stroke={resistorColor} strokeWidth="2.5" />

          {/* IEEE Zigzag Resistor */}
          <path
            d="M -18,0 L -14,-7 L -8,7 L -2,-7 L 4,7 L 10,-7 L 14,7 L 18,0"
            fill="none"
            stroke={resistorColor}
            strokeWidth={isDissipatingHeat ? 3 : 2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              filter: isDissipatingHeat ? 'drop-shadow(0 0 4px #ea580c)' : undefined,
            }}
          />
        </>
      ) : (
        <>
          {/* Vertical leads */}
          <line x1="0" y1="-30" x2="0" y2="-18" stroke={resistorColor} strokeWidth="2.5" />
          <line x1="0" y1="18" x2="0" y2="30" stroke={resistorColor} strokeWidth="2.5" />

          {/* Vertical Zigzag */}
          <path
            d="M 0,-18 L -7,-14 L 7,-8 L -7,-2 L 7,4 L -7,10 L 7,14 L 0,18"
            fill="none"
            stroke={resistorColor}
            strokeWidth={isDissipatingHeat ? 3 : 2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              filter: isDissipatingHeat ? 'drop-shadow(0 0 4px #ea580c)' : undefined,
            }}
          />
        </>
      )}

      {/* Tag & Value: For vertical, place neatly to the right so it never overlaps left elements */}
      <text
        x={orientation === 'horizontal' ? 0 : 24}
        y={orientation === 'horizontal' ? -12 : -14}
        textAnchor={orientation === 'horizontal' ? 'middle' : 'start'}
        fill={isDissipatingHeat ? '#fb923c' : '#94a3b8'}
        fontSize="8.5"
        fontWeight="bold"
        fontFamily="monospace"
      >
        {displayTag}
      </text>

      {/* Live Heat Dissipation Readout Badge: only rendered when active or explicitly requested */}
      {shouldRenderBadge && (
        <g transform={orientation === 'horizontal' ? 'translate(0, 18)' : 'translate(24, 0)'}>
          <rect
            x={orientation === 'horizontal' ? -42 : 0}
            y={orientation === 'horizontal' ? -6 : -1}
            width={orientation === 'horizontal' ? 84 : 96}
            height={isDissipatingHeat ? (orientation === 'horizontal' ? 26 : 30) : (orientation === 'horizontal' ? 16 : 18)}
            rx="3"
            fill="#020617"
            stroke={isDissipatingHeat ? '#f97316' : '#1e293b'}
            strokeWidth="1.2"
          />
          <text
            x={orientation === 'horizontal' ? 0 : 48}
            y={orientation === 'horizontal' ? 5.5 : 11}
            textAnchor="middle"
            fill={isDissipatingHeat ? '#f97316' : '#94a3b8'}
            fontSize="8.5"
            fontWeight="bold"
            fontFamily="monospace"
          >
            {isDissipatingHeat ? `HEAT: ${dissipatedPowerW}W` : 'IDLE (0W)'}
          </text>
          {isDissipatingHeat && (
            <text
              x={orientation === 'horizontal' ? 0 : 48}
              y={orientation === 'horizontal' ? 16 : 23}
              textAnchor="middle"
              fill="#ea580c"
              fontSize="8"
              fontFamily="monospace"
              fontWeight="bold"
            >
              {temperatureC.toFixed(1)}°C (DISSIPATING)
            </text>
          )}
        </g>
      )}
    </g>
  );
};
