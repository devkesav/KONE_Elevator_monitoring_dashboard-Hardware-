import React from 'react';
import type { SimulationMode, ElectricalTelemetry } from '../../types/electrical';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Octagon, 
  Usb, 
  Activity,
  AlertTriangle,
} from 'lucide-react';

interface Props {
  mode: SimulationMode;
  onSetMode: (mode: SimulationMode) => void;
  isRunning: boolean;
  onTogglePlay: () => void;
  onReset: () => void;
  onEmergencyStop: () => void;
  speedMultiplier: number;
  onSetSpeed: (speed: number) => void;
  telemetry: ElectricalTelemetry;
  hardwareConnected: boolean;
  onConnectHardware: () => void;
  onDisconnectHardware: () => void;
}

export const TopBar: React.FC<Props> = ({
  mode,
  onSetMode,
  isRunning,
  onTogglePlay,
  onReset,
  onEmergencyStop,
  speedMultiplier,
  onSetSpeed,
  telemetry,
  hardwareConnected,
  onConnectHardware,
  onDisconnectHardware,
}) => {
  return (
    <header className="h-14 w-full bg-slate-950 border-b border-slate-800 flex items-center justify-between px-4 select-none z-30">
      {/* Left: Project Branding & Status */}
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded bg-gradient-to-tr from-sky-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-sky-900/30">
          <Activity className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-sm font-mono font-bold text-white tracking-wide">
              KONE ECO-DRIVE <span className="text-sky-400 font-normal">| ELECTRICAL SIMULATOR</span>
            </h1>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-sky-950 text-sky-400 border border-sky-800">
              v2.4-RT
            </span>
          </div>
          <div className="text-[10px] font-mono text-slate-400 flex items-center space-x-2">
            <span>PMSM REGEN HOISTING ARCHITECTURE</span>
            <span className="text-slate-600">•</span>
            <span className="text-emerald-400 flex items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1" />
              SOLVER ACTIVE (50Hz)
            </span>
          </div>
        </div>
      </div>

      {/* Center: Simulation Controls (Start, Pause, Reset, E-Stop) */}
      <div className="flex items-center space-x-2 bg-slate-900/90 border border-slate-800 rounded-lg p-1 shadow-inner">
        <button
          onClick={onTogglePlay}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded font-mono text-xs font-bold transition ${
            isRunning
              ? 'bg-amber-600 hover:bg-amber-500 text-white'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white'
          }`}
        >
          {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          <span>{isRunning ? 'PAUSE' : 'RUN'}</span>
        </button>

        <button
          onClick={onReset}
          className="flex items-center space-x-1 px-2.5 py-1.5 rounded font-mono text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition"
          title="Reset Simulation"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>RESET</span>
        </button>

        <div className="w-[1px] h-5 bg-slate-700" />

        <button
          onClick={onEmergencyStop}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded font-mono text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition shadow-lg shadow-rose-950/50"
          title="Trigger Emergency Stop"
        >
          <Octagon className="w-3.5 h-3.5 fill-current" />
          <span>E-STOP</span>
        </button>

        {/* Speed multiplier selector */}
        <div className="flex items-center space-x-1 pl-2 text-[11px] font-mono text-slate-400">
          <span>SPEED:</span>
          {[0.5, 1, 2].map((s) => (
            <button
              key={s}
              onClick={() => onSetSpeed(s)}
              className={`px-1.5 py-0.5 rounded text-[10px] transition ${
                speedMultiplier === s
                  ? 'bg-sky-600 text-white font-bold'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      {/* Right: Operating Mode Selector & Hardware Link */}
      <div className="flex items-center space-x-3">
        {/* Mode Toggle Pills */}
        <div className="flex bg-slate-900 border border-slate-800 rounded-md p-0.5 text-xs font-mono">
          <button
            onClick={() => onSetMode('DEMO')}
            className={`px-2.5 py-1 rounded transition ${
              mode === 'DEMO'
                ? 'bg-sky-600 text-white font-bold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            DEMO SIM
          </button>
          <button
            onClick={() => onSetMode('HARDWARE')}
            className={`px-2.5 py-1 rounded flex items-center space-x-1 transition ${
              mode === 'HARDWARE'
                ? 'bg-emerald-600 text-white font-bold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Usb className="w-3 h-3" />
            <span>ESP32 HARDWARE</span>
          </button>
          <button
            onClick={() => onSetMode('FAULT_TEST')}
            className={`px-2.5 py-1 rounded flex items-center space-x-1 transition ${
              mode === 'FAULT_TEST'
                ? 'bg-rose-600 text-white font-bold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="w-3 h-3" />
            <span>FAULT INJECTION</span>
          </button>
        </div>

        {/* Hardware Serial Connect Button if in Hardware Mode */}
        {mode === 'HARDWARE' && (
          <button
            onClick={hardwareConnected ? onDisconnectHardware : onConnectHardware}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded font-mono text-xs font-bold transition border ${
              hardwareConnected
                ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
                : 'bg-slate-900 hover:bg-slate-800 text-sky-400 border-slate-700'
            }`}
          >
            <Usb className="w-3.5 h-3.5" />
            <span>{hardwareConnected ? 'COM CONNECTED (115200)' : 'CONNECT ESP32'}</span>
          </button>
        )}

        {/* Fault Alert Badge if fault is active */}
        {telemetry.fault_active && (
          <div className="px-2.5 py-1 rounded bg-rose-950/90 border border-rose-600 text-rose-300 font-mono text-[11px] font-bold flex items-center space-x-1.5 animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>{telemetry.fault_message || 'FAULT DETECTED'}</span>
          </div>
        )}
      </div>
    </header>
  );
};
