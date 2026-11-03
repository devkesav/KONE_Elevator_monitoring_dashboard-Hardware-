import React, { useState, useEffect, useRef } from 'react';
import type { 
  ComponentId, 
  ElectricalTelemetry, 
  OscilloscopeSample, 
  SimulationMode 
} from './types/electrical';
import { ElectricalSimulationEngine } from './services/simulationEngine';
import { WebSerialService } from './services/webSerialService';
import { TopBar } from './components/header/TopBar';
import { ComponentLibrary } from './components/library/ComponentLibrary';
import { ElectricalSchematic } from './components/schematic/ElectricalSchematic';
import { ArchitectureDiagram } from './components/schematic/ArchitectureDiagram';
import { ComponentInspector } from './components/inspector/ComponentInspector';
import { Oscilloscope } from './components/oscilloscope/Oscilloscope';
import { ErrorBoundary } from './components/common/ErrorBoundary';

export const App: React.FC = () => {
  // Engine & Serial instances
  const simEngineRef = useRef<ElectricalSimulationEngine>(new ElectricalSimulationEngine());
  const serialServiceRef = useRef<WebSerialService>(new WebSerialService());

  // Application State
  const [mode, setMode] = useState<SimulationMode>('DEMO');
  const [viewMode, setViewMode] = useState<'ARCHITECTURE' | 'SCHEMATIC'>('ARCHITECTURE');
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1.0);
  const [telemetry, setTelemetry] = useState<ElectricalTelemetry>(() => simEngineRef.current.getState());
  const [selectedComponent, setSelectedComponent] = useState<ComponentId | null>('pmsm_motor');
  const [carLoadKg, setCarLoadKg] = useState<number>(600);
  const [targetFloor, setTargetFloor] = useState<number>(4);
  const [hardwareConnected, setHardwareConnected] = useState<boolean>(false);
  const [samples, setSamples] = useState<OscilloscopeSample[]>([]);

  // Telemetry tick loop (runs at ~40ms / 25Hz)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isRunning) return;

      const newTelemetry = simEngineRef.current.update(0.04);
      setTelemetry(newTelemetry);

      // Add to oscilloscope buffer
      setSamples((prev) => {
        const nextSample: OscilloscopeSample = {
          time: newTelemetry.timestamp,
          vac: newTelemetry.vac_secondary * Math.sin((newTelemetry.timestamp / 1000) * 2 * Math.PI * 50),
          iac: newTelemetry.iac_secondary * Math.sin((newTelemetry.timestamp / 1000) * 2 * Math.PI * 50 - 0.2),
          vrect: newTelemetry.v_rect_out,
          vdc: newTelemetry.vdc_bus,
          vscap: newTelemetry.v_scap,
          iscap: newTelemetry.i_scap,
          rpm: newTelemetry.motor_speed_rpm,
          torque: newTelemetry.motor_torque_nm,
          power: newTelemetry.motor_mech_power,
        };
        const updated = [...prev, nextSample];
        return updated.length > 180 ? updated.slice(updated.length - 180) : updated;
      });
    }, 40);

    return () => clearInterval(interval);
  }, [isRunning]);

  // Handle hardware telemetry callbacks
  useEffect(() => {
    serialServiceRef.current.setCallbacks(
      (data) => {
        simEngineRef.current.updateHardwareTelemetry(data);
      },
      (connected, err) => {
        setHardwareConnected(connected);
        if (err) {
          alert(`ESP32 Connection: ${err}`);
        }
      }
    );
  }, []);

  // Controls
  const handleTogglePlay = () => {
    const next = !isRunning;
    setIsRunning(next);
    simEngineRef.current.setRunning(next);
  };

  const handleReset = () => {
    simEngineRef.current.resetAll();
    setTelemetry(simEngineRef.current.getState());
    setSamples([]);
  };

  const handleEmergencyStop = () => {
    simEngineRef.current.emergencyStop();
    setTelemetry(simEngineRef.current.getState());
  };

  const handleSetSpeed = (s: number) => {
    setSpeedMultiplier(s);
    simEngineRef.current.setSpeedMultiplier(s);
  };

  const handleSetCarLoad = (kg: number) => {
    setCarLoadKg(kg);
    simEngineRef.current.setCarLoad(kg);
  };

  const handleSetTargetFloor = (fl: number) => {
    setTargetFloor(fl);
    simEngineRef.current.setTargetFloor(fl);
  };

  const handleToggleSwitch = (id: 'main' | 'dpst') => {
    if (id === 'main') {
      simEngineRef.current.toggleMainSwitch();
    } else {
      simEngineRef.current.toggleDpstSwitch();
    }
    setTelemetry(simEngineRef.current.getState());
  };

  const handleSetScapSoc = (soc: number) => {
    simEngineRef.current.setSupercapSoc(soc);
    setTelemetry(simEngineRef.current.getState());
  };

  const handleConnectHardware = async () => {
    await serialServiceRef.current.connect(115200);
  };

  const handleDisconnectHardware = async () => {
    await serialServiceRef.current.disconnect();
    setHardwareConnected(false);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#070a12] text-slate-100 overflow-hidden font-sans">
      {/* 1. TOP HEADER & WORKBENCH TOOLBAR */}
      <TopBar
        mode={mode}
        onSetMode={setMode}
        isRunning={isRunning}
        onTogglePlay={handleTogglePlay}
        onReset={handleReset}
        onEmergencyStop={handleEmergencyStop}
        speedMultiplier={speedMultiplier}
        onSetSpeed={handleSetSpeed}
        telemetry={telemetry}
        hardwareConnected={hardwareConnected}
        onConnectHardware={handleConnectHardware}
        onDisconnectHardware={handleDisconnectHardware}
      />

      {/* 2. MAIN CENTER WORKSPACE (3-COLUMN LAYOUT) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* LEFT COLUMN: System Explorer & Elevator Kinematics */}
        <ComponentLibrary
          telemetry={telemetry}
          selectedComponent={selectedComponent}
          onSelectComponent={setSelectedComponent}
          carLoadKg={carLoadKg}
          onSetCarLoad={handleSetCarLoad}
          targetFloor={targetFloor}
          onSetTargetFloor={handleSetTargetFloor}
        />

        {/* CENTER COLUMN: Real Electrical Engineering Architecture / Schematic */}
        <div className="flex-1 h-full relative overflow-hidden flex flex-col">
          {/* View Mode Switcher Header Toolbar */}
          <div className="absolute top-3 left-4 z-20 flex items-center bg-slate-900/90 backdrop-blur border border-slate-700/80 rounded-lg p-0.5 shadow-xl font-mono text-xs">
            <button
              onClick={() => setViewMode('ARCHITECTURE')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md transition ${
                viewMode === 'ARCHITECTURE'
                  ? 'bg-sky-600 text-white font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>⚡ ARCHITECTURE DIAGRAM</span>
            </button>
            <button
              onClick={() => setViewMode('SCHEMATIC')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md transition ${
                viewMode === 'SCHEMATIC'
                  ? 'bg-sky-600 text-white font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>🔌 DETAILED SCHEMATIC</span>
            </button>
          </div>

          <ErrorBoundary fallbackTitle="Schematic Workbench Error">
            {viewMode === 'ARCHITECTURE' ? (
              <ArchitectureDiagram
                telemetry={telemetry}
                selectedComponent={selectedComponent}
                onSelectComponent={setSelectedComponent}
              />
            ) : (
              <ElectricalSchematic
                telemetry={telemetry}
                selectedComponent={selectedComponent}
                onSelectComponent={setSelectedComponent}
                onToggleSwitch={handleToggleSwitch}
              />
            )}
          </ErrorBoundary>
        </div>

        {/* RIGHT COLUMN: Component Inspector (Simulink/Proteus style) */}
        {selectedComponent && (
          <ComponentInspector
            selectedComponent={selectedComponent}
            telemetry={telemetry}
            onToggleFuse={() => {
              simEngineRef.current.toggleFuseFault();
              setTelemetry(simEngineRef.current.getState());
            }}
            onToggleMainSwitch={() => {
              simEngineRef.current.toggleMainSwitch();
              setTelemetry(simEngineRef.current.getState());
            }}
            onToggleDpstSwitch={() => {
              simEngineRef.current.toggleDpstSwitch();
              setTelemetry(simEngineRef.current.getState());
            }}
            onToggleDiodeFault={() => {
              simEngineRef.current.toggleDiodeFault();
              setTelemetry(simEngineRef.current.getState());
            }}
            onToggleShortCircuit={() => {
              simEngineRef.current.toggleShortCircuit();
              setTelemetry(simEngineRef.current.getState());
            }}
            onSetScapSoc={handleSetScapSoc}
            onClose={() => setSelectedComponent(null)}
          />
        )}
      </div>

      {/* 3. BOTTOM OSCILLOSCOPE DUAL TRACE WINDOW */}
      <Oscilloscope
        samples={samples}
        onClear={() => setSamples([])}
      />
    </div>
  );
};

export default App;
