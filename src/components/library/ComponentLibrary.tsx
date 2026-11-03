import React, { useState } from 'react';
import type { ComponentId, ElectricalTelemetry } from '../../types/electrical';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Activity, 
  Compass, 
  ChevronRight,
} from 'lucide-react';

interface Props {
  telemetry: ElectricalTelemetry;
  selectedComponent: ComponentId | null;
  onSelectComponent: (id: ComponentId) => void;
  carLoadKg: number;
  onSetCarLoad: (kg: number) => void;
  targetFloor: number;
  onSetTargetFloor: (floor: number) => void;
}

export const ComponentLibrary: React.FC<Props> = ({
  telemetry,
  selectedComponent,
  onSelectComponent,
  carLoadKg,
  onSetCarLoad,
  targetFloor,
  onSetTargetFloor,
}) => {
  const [activeTab, setActiveTab] = useState<'HIERARCHY' | 'ELEVATOR' | 'ENERGY'>('ELEVATOR');

  const componentsList: { id: ComponentId; tag: string; name: string; section: string }[] = [
    { id: 'ac_source', tag: 'V_GRID', name: 'AC Mains Source (230V)', section: 'GRID' },
    { id: 'transformer', tag: 'T1', name: 'Step-Down Transformer', section: 'GRID' },
    { id: 'fuse_ac', tag: 'F1', name: 'Secondary Protection Fuse', section: 'PROTECTION' },
    { id: 'switch_ac', tag: 'SW1', name: 'Main AC Breaker', section: 'PROTECTION' },
    { id: 'ammeter_ac', tag: 'A1', name: 'AC Current Ammeter', section: 'METERS' },
    { id: 'voltmeter_ac', tag: 'V1', name: 'AC Secondary Voltmeter', section: 'METERS' },
    { id: 'bridge_rectifier', tag: 'BR1', name: 'Full-Wave Bridge Rectifier', section: 'CONVERSION' },
    { id: 'dc_link_cap', tag: 'C_DC', name: 'DC-Link Capacitor (15mF)', section: 'DC BUS' },
    { id: 'voltmeter_dc', tag: 'V2', name: 'DC Bus Voltmeter', section: 'METERS' },
    { id: 'dcdc_converter', tag: 'CONV1', name: 'Bidirectional DC-DC Buck/Boost', section: 'CONVERSION' },
    { id: 'dpst_switch', tag: 'SW_DPST', name: 'Supercapacitor Isolation Switch', section: 'PROTECTION' },
    { id: 'brake_resistor', tag: 'R_DUMP', name: 'Dynamic Braking Dump Resistor (5Ω)', section: 'DISSIPATION' },
    { id: 'supercapacitor', tag: 'SC_BANK', name: 'Supercapacitor Bank (58F)', section: 'STORAGE' },
    { id: 'voltmeter_scap', tag: 'V_SC', name: 'Supercapacitor Voltmeter', section: 'METERS' },
    { id: 'pmsm_motor', tag: 'M1', name: 'Hoist PMSM Motor', section: 'LOAD' },
  ];

  const isRegen = telemetry.power_flow === 'REGENERATING';
  const isMotoring = telemetry.power_flow === 'MOTORING';

  return (
    <div className="w-72 h-full bg-slate-900/95 border-r border-slate-800 flex flex-col justify-between shadow-2xl backdrop-blur select-none">
      <div>
        {/* Top Header */}
        <div className="p-3 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Compass className="w-4 h-4 text-sky-400" />
            <h2 className="text-xs font-mono font-bold text-slate-200 tracking-wider">
              SYSTEM EXPLORER
            </h2>
          </div>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800">
            SIMSCAPE
          </span>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-800 text-[11px] font-mono bg-slate-950/40">
          <button
            onClick={() => setActiveTab('ELEVATOR')}
            className={`flex-1 py-2 text-center transition border-b-2 ${
              activeTab === 'ELEVATOR'
                ? 'border-sky-500 text-sky-300 bg-slate-800/40 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            Elevator
          </button>
          <button
            onClick={() => setActiveTab('HIERARCHY')}
            className={`flex-1 py-2 text-center transition border-b-2 ${
              activeTab === 'HIERARCHY'
                ? 'border-sky-500 text-sky-300 bg-slate-800/40 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            Tree
          </button>
          <button
            onClick={() => setActiveTab('ENERGY')}
            className={`flex-1 py-2 text-center transition border-b-2 ${
              activeTab === 'ENERGY'
                ? 'border-sky-500 text-sky-300 bg-slate-800/40 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            Energy
          </button>
        </div>

        {/* Tab 1: Elevator State & Physics Controls */}
        {activeTab === 'ELEVATOR' && (
          <div className="p-3.5 space-y-3 overflow-y-auto max-h-[calc(100vh-320px)]">
            {/* Live Elevator Shaft & Car Position graphic */}
            <div className="bg-slate-950 border border-slate-800 rounded p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-slate-400">SHAFT STATUS</span>
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                    isRegen
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : isMotoring
                      ? 'bg-sky-950 text-sky-400 border border-sky-800'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {telemetry.motion_state.replace('_', ' ')}
                </span>
              </div>

              {/* Shaft visualization */}
              <div className="relative h-28 w-full bg-slate-900/60 rounded border border-slate-800/60 flex items-center justify-between px-6 overflow-hidden">
                {/* Guide rails */}
                <div className="absolute left-10 top-0 bottom-0 w-[1px] bg-slate-800" />
                <div className="absolute right-10 top-0 bottom-0 w-[1px] bg-slate-800" />

                {/* Pulley at top */}
                <div className="absolute top-1 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full border border-slate-700 bg-slate-800 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                </div>

                {/* Elevator Car */}
                <div
                  className="absolute left-8 w-14 h-9 bg-sky-950/90 border border-sky-500 rounded flex flex-col items-center justify-center transition-all duration-300 shadow-lg"
                  style={{
                    bottom: `${Math.min(75, Math.max(5, (telemetry.car_position_m / 25) * 75 + 5))}px`,
                  }}
                >
                  <span className="text-[9px] font-mono font-bold text-sky-300">CAR: F{telemetry.car_floor}</span>
                  <span className="text-[8px] font-mono text-slate-400">{telemetry.car_velocity_ms.toFixed(1)} m/s</span>
                </div>

                {/* Counterweight */}
                <div
                  className="absolute right-8 w-8 h-12 bg-slate-800 border border-slate-600 rounded flex flex-col items-center justify-center transition-all duration-300"
                  style={{
                    top: `${Math.min(65, Math.max(5, (telemetry.car_position_m / 25) * 65 + 5))}px`,
                  }}
                >
                  <span className="text-[8px] font-mono text-slate-400 font-bold">CW</span>
                  <span className="text-[7.5px] font-mono text-slate-500">1050kg</span>
                </div>
              </div>

              {/* Floor Readout */}
              <div className="grid grid-cols-3 gap-1.5 mt-2.5 text-center font-mono">
                <div className="bg-slate-900 rounded p-1">
                  <div className="text-[9px] text-slate-500">FLOOR</div>
                  <div className="text-sm font-bold text-sky-400">{telemetry.car_floor} / 8</div>
                </div>
                <div className="bg-slate-900 rounded p-1">
                  <div className="text-[9px] text-slate-500">HEIGHT</div>
                  <div className="text-sm font-bold text-slate-200">{telemetry.car_position_m.toFixed(1)} m</div>
                </div>
                <div className="bg-slate-900 rounded p-1">
                  <div className="text-[9px] text-slate-500">SPEED</div>
                  <div className="text-sm font-bold text-slate-200">{telemetry.car_velocity_ms.toFixed(1)} m/s</div>
                </div>
              </div>
            </div>

            {/* Quick Floor Dispatch Call buttons */}
            <div className="bg-slate-950 border border-slate-800 rounded p-2.5">
              <div className="text-[10px] font-mono text-slate-400 mb-1.5 flex items-center justify-between">
                <span>CALL CAR TO FLOOR:</span>
                <span className="text-sky-400 font-bold">TARGET: F{targetFloor}</span>
              </div>
              <div className="grid grid-cols-4 gap-1 font-mono text-xs">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((fl) => (
                  <button
                    key={fl}
                    onClick={() => onSetTargetFloor(fl)}
                    className={`py-1.5 rounded text-center transition font-bold ${
                      targetFloor === fl
                        ? 'bg-sky-600 text-white'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    F{fl}
                  </button>
                ))}
              </div>
            </div>

            {/* Car Load Adjustment Slider */}
            <div className="bg-slate-950 border border-slate-800 rounded p-2.5">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
                <span>CAR PAYLOAD:</span>
                <span className="text-amber-400 font-bold">{carLoadKg} kg</span>
              </div>
              <input
                type="range"
                min="0"
                max="800"
                step="50"
                value={carLoadKg}
                onChange={(e) => onSetCarLoad(Number(e.target.value))}
                className="w-full accent-sky-500 h-1 bg-slate-800 rounded"
              />
              <div className="flex justify-between text-[9px] font-mono text-slate-600 mt-1">
                <span>EMPTY (0kg)</span>
                <span>CW BALANCE (300kg)</span>
                <span>FULL (800kg)</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Schematic Component Hierarchy */}
        {activeTab === 'HIERARCHY' && (
          <div className="p-2 space-y-1 overflow-y-auto max-h-[calc(100vh-320px)]">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold px-2 py-1">
              Circuit Netlist Elements
            </div>
            {componentsList.map((c) => {
              const isSelected = selectedComponent === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => onSelectComponent(c.id)}
                  className={`w-full text-left px-2.5 py-1.5 rounded flex items-center justify-between text-xs font-mono transition ${
                    isSelected
                      ? 'bg-sky-950 border border-sky-700 text-sky-200'
                      : 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center space-x-2 truncate">
                    <span className="text-[10px] px-1 py-0.2 rounded bg-slate-800 text-sky-400 font-bold">
                      {c.tag}
                    </span>
                    <span className="truncate">{c.name}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                </button>
              );
            })}
          </div>
        )}

        {/* Tab 3: Energy Balance & Supercap Assist */}
        {activeTab === 'ENERGY' && (
          <div className="p-3 space-y-2.5 overflow-y-auto max-h-[calc(100vh-320px)] font-mono text-xs">
            <div className="bg-slate-950 border border-slate-800 rounded p-2.5">
              <div className="text-[10px] text-slate-500 mb-1">POWER FLOW STATE</div>
              <div className="flex items-center space-x-2">
                {isRegen ? (
                  <ArrowDownLeft className="w-5 h-5 text-emerald-400" />
                ) : isMotoring ? (
                  <ArrowUpRight className="w-5 h-5 text-sky-400" />
                ) : (
                  <Activity className="w-5 h-5 text-slate-500" />
                )}
                <div>
                  <div className={`text-sm font-bold ${isRegen ? 'text-emerald-400' : isMotoring ? 'text-sky-400' : 'text-slate-400'}`}>
                    {telemetry.power_flow}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {isRegen ? 'Motor generates ➔ Charges Supercap' : isMotoring ? 'Grid + Supercap Boost ➔ Motor' : 'Holding Brake Engaged'}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded p-2.5 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500 text-[11px]">Grid Input Power:</span>
                <span className="text-sky-400 font-bold">{Math.round(telemetry.vac_primary * telemetry.iac_primary)} W</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 text-[11px]">DC Bus Total Power:</span>
                <span className="text-slate-200 font-bold">{telemetry.pdc_bus} W</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 text-[11px]">Supercapacitor Exchange:</span>
                <span className={telemetry.i_scap > 0 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                  {Math.round(telemetry.v_scap * telemetry.i_scap)} W
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 text-[11px]">Regenerative Captured:</span>
                <span className="text-emerald-400 font-bold">{telemetry.regen_power_w} W</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Health Bar */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/70 font-mono text-[10px]">
        <div className="flex items-center justify-between text-slate-400">
          <span>CIRCUIT TOPOLOGY:</span>
          <span className="text-emerald-400 font-bold">VERIFIED CLOSED-LOOP</span>
        </div>
        <div className="flex items-center justify-between text-slate-500 mt-1">
          <span>MODEL SOLVER:</span>
          <span className="text-slate-300">Runge-Kutta 4 (RK4)</span>
        </div>
      </div>
    </div>
  );
};
