import React from 'react';

interface Props {
  x: number;
  y: number;
  type?: 'EARTH' | 'CHASSIS' | 'SIGNAL';
  tag?: string;
}

export const GroundSymbol: React.FC<Props> = ({
  x,
  y,
  type = 'EARTH',
  tag,
}) => {
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Lead wire */}
      <line x1="0" y1="-12" x2="0" y2="0" stroke="#38bdf8" strokeWidth="2.5" />

      {type === 'EARTH' ? (
        // Standard Earth Ground (Stepped 3 horizontal bars)
        <>
          <line x1="-14" y1="0" x2="14" y2="0" stroke="#38bdf8" strokeWidth="2.5" />
          <line x1="-9" y1="4" x2="9" y2="4" stroke="#38bdf8" strokeWidth="2" />
          <line x1="-4" y1="8" x2="4" y2="8" stroke="#38bdf8" strokeWidth="1.5" />
        </>
      ) : (
        // Chassis Ground (Rake angled lines)
        <>
          <line x1="-12" y1="0" x2="12" y2="0" stroke="#38bdf8" strokeWidth="2.5" />
          <line x1="-8" y1="0" x2="-13" y2="7" stroke="#38bdf8" strokeWidth="1.8" />
          <line x1="0" y1="0" x2="-5" y2="7" stroke="#38bdf8" strokeWidth="1.8" />
          <line x1="8" y1="0" x2="3" y2="7" stroke="#38bdf8" strokeWidth="1.8" />
        </>
      )}

      {tag && (
        <text
          x="0"
          y="18"
          textAnchor="middle"
          fill="#64748b"
          fontSize="7.5"
          fontFamily="monospace"
        >
          {tag}
        </text>
      )}
    </g>
  );
};
