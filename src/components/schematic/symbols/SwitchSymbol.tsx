import React from 'react';

interface SwitchProps {
  x: number;
  y: number;
  closed: boolean;
  tag?: string;
  isDpst?: boolean;
  orientation?: 'horizontal' | 'vertical';
  selected?: boolean;
  onClick?: () => void;
}

export const SwitchSymbol: React.FC<SwitchProps> = ({
  x,
  y,
  closed,
  tag = 'SW1',
  isDpst = false,
  orientation = 'horizontal',
  selected,
  onClick,
}) => {
  const isVert = orientation === 'vertical';

  return (
    <g
      transform={`translate(${x}, ${y})`}
      className="cursor-pointer group"
      onClick={onClick}
    >
      {selected && (
        <rect
          x="-24"
          y="-24"
          width="48"
          height="48"
          rx="4"
          fill="none"
          stroke="#38bdf8"
          strokeWidth="2"
          strokeDasharray="3 2"
        />
      )}

      {!isVert ? (
        // Horizontal Switch
        <>
          {/* Terminal Contacts */}
          <circle cx="-16" cy="0" r="3.5" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
          <circle cx="16" cy="0" r="3.5" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
          
          {/* External connecting leads */}
          <line x1="-28" y1="0" x2="-16" y2="0" stroke="#38bdf8" strokeWidth="2.5" />
          <line x1="16" y1="0" x2="28" y2="0" stroke="#38bdf8" strokeWidth="2.5" />

          {/* Knife switch blade */}
          {closed ? (
            <line x1="-16" y1="0" x2="16" y2="0" stroke="#22c55e" strokeWidth="3" />
          ) : (
            <line x1="-16" y1="0" x2="12" y2="-15" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
          )}
        </>
      ) : (
        // Vertical Switch (e.g. for dynamic braking chopper leg)
        <>
          <circle cx="0" cy="-16" r="3.5" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
          <circle cx="0" cy="16" r="3.5" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
          
          <line x1="0" y1="-26" x2="0" y2="-16" stroke="#38bdf8" strokeWidth="2.5" />
          <line x1="0" y1="16" x2="0" y2="26" stroke="#38bdf8" strokeWidth="2.5" />

          {/* Knife switch blade with smooth animated swing */}
          <line
            x1="0"
            y1="-16"
            x2={closed ? 0 : 15}
            y2={closed ? 16 : 12}
            stroke={closed ? '#22c55e' : '#ef4444'}
            strokeWidth="3.2"
            strokeLinecap="round"
            className="transition-all duration-200 ease-out"
          />

          {/* Contact closure pulse/glow ping */}
          {closed && (
            <circle
              cx="0"
              cy="16"
              r="4.5"
              fill="#22c55e"
              fillOpacity="0.5"
              className="animate-ping"
            />
          )}
        </>
      )}

      <text
        x={isVert ? 22 : 0}
        y={isVert ? 4 : -18}
        textAnchor={isVert ? 'start' : 'middle'}
        fill={closed ? '#22c55e' : '#ef4444'}
        fontSize="8.5"
        fontWeight="bold"
        fontFamily="monospace"
      >
        {tag} [{closed ? 'CLOSED' : 'OPEN'}]
      </text>
    </g>
  );
};
