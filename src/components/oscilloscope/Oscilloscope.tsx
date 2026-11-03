import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { OscilloscopeSample } from '../../types/electrical';
import { 
  Activity, 
  ChevronDown, 
  ChevronUp, 
  Play, 
  Pause, 
  Trash2,
  GripHorizontal,
  Maximize2,
  Minimize2
} from 'lucide-react';

interface Props {
  samples: OscilloscopeSample[];
  onClear: () => void;
}

export type ChannelKey = 'vac' | 'iac' | 'vrect' | 'vdc' | 'vscap' | 'iscap' | 'rpm' | 'torque';

interface ChannelConfig {
  key: ChannelKey;
  name: string;
  unit: string;
  color: string;
  scale: number; // Multiplier to fit graticule
  offset: number;
  enabled: boolean;
}

export const Oscilloscope: React.FC<Props> = ({ samples, onClear }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Height state (default: 200px, min: 110px, max: 650px)
  const [height, setHeight] = useState<number>(200);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [timebaseMs] = useState<number>(50); // ms per division

  const [channels, setChannels] = useState<ChannelConfig[]>([
    { key: 'vac', name: 'CH1: AC Grid (400V)', unit: 'V', color: '#38bdf8', scale: 0.12, offset: 0, enabled: true },
    { key: 'vdc', name: 'CH2: DC-Link (555V)', unit: 'V', color: '#ef4444', scale: 0.12, offset: 0, enabled: true },
    { key: 'vscap', name: 'CH3: Supercap (133V)', unit: 'V', color: '#10b981', scale: 0.40, offset: 0, enabled: true },
    { key: 'iscap', name: 'CH4: Supercap I (A)', unit: 'A', color: '#f59e0b', scale: 0.80, offset: 0, enabled: true },
    { key: 'rpm', name: 'CH5: Motor (RPM)', unit: 'RPM', color: '#a855f7', scale: 0.70, offset: 0, enabled: false },
    { key: 'torque', name: 'CH6: Motor Torque', unit: 'Nm', color: '#ec4899', scale: 0.05, offset: 0, enabled: false },
  ]);

  const toggleChannel = (key: ChannelKey) => {
    setChannels((prev) =>
      prev.map((ch) => (ch.key === key ? { ...ch, enabled: !ch.enabled } : ch))
    );
  };

  // Drag-to-resize handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);

    const startY = e.clientY;
    const startHeight = height;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      // Pulling upwards increases height, pulling downwards decreases height
      const delta = startY - moveEvent.clientY;
      const newHeight = Math.max(110, Math.min(window.innerHeight * 0.75, startHeight + delta));
      setHeight(newHeight);
      if (isCollapsed) setIsCollapsed(false);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [height, isCollapsed]);

  // Sync canvas pixel resolution with container dimensions
  useEffect(() => {
    if (isCollapsed) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      canvas.width = rect.width;
      canvas.height = rect.height;
    }
  }, [height, isCollapsed]);

  // Main canvas render loop
  useEffect(() => {
    if (isCollapsed || isPaused) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    if (width <= 0 || height <= 0) return;

    // Clear background
    ctx.fillStyle = '#050811';
    ctx.fillRect(0, 0, width, height);

    // Draw Graticule (10 horizontal div x 8 vertical div)
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    const numCols = 10;
    const numRows = 8;
    const colStep = width / numCols;
    const rowStep = height / numRows;

    // Vertical grid lines with small sub-division ticks
    for (let c = 1; c < numCols; c++) {
      const x = c * colStep;
      ctx.beginPath();
      ctx.setLineDash([2, 4]);
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Horizontal grid lines
    for (let r = 1; r < numRows; r++) {
      const y = r * rowStep;
      ctx.beginPath();
      ctx.setLineDash([2, 4]);
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    ctx.setLineDash([]); // Reset dash

    // Center crosshairs (solid subtle lines)
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.2;
    // Horizontal center
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();
    // Vertical center
    ctx.beginPath();
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.stroke();

    // Small division tick marks on center lines
    const tickLen = 4;
    for (let x = 0; x < width; x += colStep / 5) {
      ctx.beginPath();
      ctx.moveTo(x, height / 2 - tickLen);
      ctx.lineTo(x, height / 2 + tickLen);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += rowStep / 5) {
      ctx.beginPath();
      ctx.moveTo(width / 2 - tickLen, y);
      ctx.lineTo(width / 2 + tickLen, y);
      ctx.stroke();
    }

    if (samples.length < 2) return;

    // Render enabled channels
    const centerY = height / 2;
    const totalSamples = samples.length;

    channels.forEach((ch) => {
      if (!ch.enabled) return;

      ctx.strokeStyle = ch.color;
      ctx.lineWidth = 1.8;
      ctx.shadowColor = ch.color;
      ctx.shadowBlur = 4; // Phosphor glow
      ctx.beginPath();

      for (let i = 0; i < totalSamples; i++) {
        const sample = samples[i];
        const val = sample[ch.key] || 0;
        const x = (i / (totalSamples - 1)) * width;
        const y = centerY - val * ch.scale;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    });
  }, [samples, channels, height, isCollapsed, isPaused]);

  return (
    <div
      ref={containerRef}
      className="w-full bg-slate-950 border-t border-slate-800 flex flex-col select-none relative z-20 shadow-2xl"
    >
      {/* 1. INTERACTIVE DRAG-TO-RESIZE HANDLE BAR */}
      <div
        onMouseDown={handleMouseDown}
        className={`w-full h-2 cursor-row-resize flex items-center justify-center transition-all group ${
          isDragging ? 'bg-sky-500' : 'bg-slate-900 hover:bg-sky-500/80'
        }`}
        title="Drag up or down to adjust oscilloscope height"
      >
        <div className="w-12 h-1 bg-slate-600 group-hover:bg-white rounded-full transition-colors flex items-center justify-center">
          <GripHorizontal className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100" />
        </div>
      </div>

      {/* 2. OSCILLOSCOPE HEADER & CONTROLS */}
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 text-xs font-mono font-bold text-sky-400">
            <Activity className="w-4 h-4 text-sky-400" />
            <span>REAL-TIME OSCILLOSCOPE (DSO-4000)</span>
          </div>

          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800">
            TRIGGER: AUTO
          </span>

          <span className="text-[10px] font-mono text-slate-400">
            TIMEBASE: <span className="text-slate-200 font-bold">{timebaseMs} ms/div</span>
          </span>

          {/* Current Height Indicator */}
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
            H: {Math.round(height)}px
          </span>
        </div>

        {/* Channel quick toggles & Height Presets */}
        <div className="flex items-center space-x-2">
          {channels.map((ch) => (
            <button
              key={ch.key}
              onClick={() => toggleChannel(ch.key)}
              className={`flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-mono transition border ${
                ch.enabled
                  ? 'bg-slate-800 text-slate-100 border-slate-600'
                  : 'bg-slate-950 text-slate-500 border-slate-900 hover:border-slate-800'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full inline-block"
                style={{ backgroundColor: ch.enabled ? ch.color : '#475569' }}
              />
              <span>{ch.name.split(':')[1]}</span>
            </button>
          ))}

          <div className="w-[1px] h-4 bg-slate-700 mx-1" />

          {/* Height Presets: S, M, L, XL */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded p-0.5 space-x-0.5 text-[9px] font-mono">
            <button
              onClick={() => { setHeight(130); setIsCollapsed(false); }}
              className={`px-1.5 py-0.5 rounded ${height <= 150 ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
              title="Small Height (130px)"
            >
              S
            </button>
            <button
              onClick={() => { setHeight(220); setIsCollapsed(false); }}
              className={`px-1.5 py-0.5 rounded ${height > 150 && height <= 280 ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
              title="Medium Height (220px)"
            >
              M
            </button>
            <button
              onClick={() => { setHeight(360); setIsCollapsed(false); }}
              className={`px-1.5 py-0.5 rounded ${height > 280 && height <= 440 ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
              title="Large Height (360px)"
            >
              L
            </button>
            <button
              onClick={() => { setHeight(500); setIsCollapsed(false); }}
              className={`px-1.5 py-0.5 rounded ${height > 440 ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
              title="Max Height (500px)"
            >
              XL
            </button>
          </div>

          <div className="w-[1px] h-4 bg-slate-700 mx-1" />

          <button
            onClick={() => setIsPaused(!isPaused)}
            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded text-xs"
            title={isPaused ? 'Resume Trace' : 'Pause Trace'}
          >
            {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={onClear}
            className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded text-xs"
            title="Clear Buffer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded text-xs"
            title={isCollapsed ? 'Expand Graph' : 'Collapse Graph'}
          >
            {isCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 3. DYNAMIC RESIZABLE CANVAS VIEWPORT */}
      {!isCollapsed && (
        <div
          style={{ height: `${height}px` }}
          className="relative w-full bg-[#050811] flex overflow-hidden transition-[height] duration-75"
        >
          <canvas
            ref={canvasRef}
            className="w-full h-full block"
          />

          {/* Side Legend & Scale indicators */}
          <div className="absolute left-2 top-2 pointer-events-none flex flex-col space-y-1 font-mono text-[9px] bg-slate-950/85 px-2.5 py-1.5 rounded border border-slate-800/80 backdrop-blur shadow-lg">
            {channels.filter((c) => c.enabled).map((c) => (
              <div key={c.key} className="flex items-center space-x-1.5" style={{ color: c.color }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.color }} />
                <span>{c.name}: 1 div = {(1 / (c.scale * 2)).toFixed(1)} {c.unit}</span>
              </div>
            ))}
          </div>

          {/* Quick Drag Tip */}
          <div className="absolute right-3 bottom-2 pointer-events-none font-mono text-[9px] text-slate-600 bg-slate-950/60 px-2 py-0.5 rounded border border-slate-800/40">
            Drag top bar to resize height
          </div>
        </div>
      )}
    </div>
  );
};
