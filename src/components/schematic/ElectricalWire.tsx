import React from 'react';

export type WireSignalType = 'AC' | 'DC_POS' | 'DC_NEG' | 'SIGNAL' | 'GROUND';

export interface WirePoint {
  x: number;
  y: number;
}

interface Props {
  points: WirePoint[];
  signalType: WireSignalType;
  isFlowing?: boolean;
  flowDirection?: 'FORWARD' | 'REVERSE';
  isRegen?: boolean;
  isFault?: boolean;
  nodeName?: string;
  showNodeLabel?: boolean;
  voltageText?: string;
  showJunctionStart?: boolean;
  showJunctionEnd?: boolean;
  intermediateJunctions?: WirePoint[];
  onHover?: (info: { name: string; voltage: string; x: number; y: number } | null) => void;
}

export const ElectricalWire: React.FC<Props> = ({
  points,
  signalType,
  isFlowing = false,
  flowDirection = 'FORWARD',
  isRegen = false,
  isFault = false,
  nodeName,
  showNodeLabel = false,
  voltageText,
  showJunctionStart = false,
  showJunctionEnd = false,
  intermediateJunctions = [],
  onHover,
}) => {
  if (points.length < 2) return null;

  // Build SVG path string from points (orthogonal)
  const pathD = points.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`;
  }, '');

  // Base electrical colors
  let baseColor = '#38bdf8'; // AC light blue
  if (signalType === 'DC_POS') baseColor = '#ef4444'; // Red DC+
  else if (signalType === 'DC_NEG') baseColor = '#1d4ed8'; // Dark blue DC-
  else if (signalType === 'SIGNAL') baseColor = '#fbbf24'; // Amber
  else if (signalType === 'GROUND') baseColor = '#64748b'; // Gray

  if (isFault) {
    baseColor = '#f43f5e'; // Highlighted red on fault
  }

  // Animation flow styling
  const flowColor = isRegen ? '#10b981' : isFault ? '#f43f5e' : '#38bdf8';
  const animationClass = isFlowing
    ? flowDirection === 'FORWARD'
      ? 'animate-wire-flow-forward'
      : 'animate-wire-flow-reverse'
    : '';

  // Midpoint for node label
  const midIndex = Math.floor(points.length / 2);
  const midPoint = points[midIndex] || points[0];

  return (
    <g
      className="group"
      onMouseEnter={() => {
        if (nodeName && onHover) {
          onHover({
            name: nodeName,
            voltage: voltageText || '',
            x: midPoint.x,
            y: midPoint.y,
          });
        }
      }}
      onMouseLeave={() => onHover && onHover(null)}
    >
      {/* Invisible thicker hover hit-test line */}
      <path
        d={pathD}
        fill="none"
        stroke="transparent"
        strokeWidth="14"
        className="cursor-crosshair"
      />

      {/* Main Electrical Wire (Thin, crisp line) */}
      <path
        d={pathD}
        fill="none"
        stroke={baseColor}
        strokeWidth={isFault ? 3 : 2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-colors duration-200"
      />

      {/* Animated Power Flow Particles / Dashed Arrow Overlay */}
      {isFlowing && (
        <path
          d={pathD}
          fill="none"
          stroke={flowColor}
          strokeWidth="2.4"
          strokeDasharray="6 8"
          strokeLinecap="round"
          className={animationClass}
          opacity="0.95"
        />
      )}

      {/* Junction Dots (Nodes) */}
      {showJunctionStart && (
        <circle
          cx={points[0].x}
          cy={points[0].y}
          r="3.5"
          fill={baseColor}
          stroke="#0f172a"
          strokeWidth="1"
        />
      )}

      {showJunctionEnd && (
        <circle
          cx={points[points.length - 1].x}
          cy={points[points.length - 1].y}
          r="3.5"
          fill={baseColor}
          stroke="#0f172a"
          strokeWidth="1"
        />
      )}

      {intermediateJunctions.map((jpt, idx) => (
        <circle
          key={idx}
          cx={jpt.x}
          cy={jpt.y}
          r="3.5"
          fill={baseColor}
          stroke="#0f172a"
          strokeWidth="1"
        />
      ))}

      {/* Technical Node Identifier Label (only when explicitly requested) */}
      {showNodeLabel && nodeName && (
        <text
          x={midPoint.x + 4}
          y={midPoint.y - 4}
          fill="#64748b"
          fontSize="7.5"
          fontFamily="monospace"
          className="select-none pointer-events-none group-hover:fill-sky-300"
        >
          {nodeName}
        </text>
      )}
    </g>
  );
};
