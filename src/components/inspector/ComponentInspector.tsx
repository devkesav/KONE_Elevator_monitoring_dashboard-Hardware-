import React, { useState } from 'react';
import type { ComponentId, ElectricalTelemetry } from '../../types/electrical';
import { 
  Zap, 
  AlertTriangle, 
  Power, 
  Layers
} from 'lucide-react';

interface Props {
  selectedComponent: ComponentId | null;
  telemetry: ElectricalTelemetry;
  onToggleFuse: () => void;
  onToggleMainSwitch: () => void;
  onToggleDpstSwitch: () => void;
  onToggleDiodeFault: () => void;
  onToggleShortCircuit: () => void;
  onSetScapSoc?: (soc: number) => void;
  onClose: () => void;
}

export const ComponentInspector: React.FC<Props> = ({
  selectedComponent,
  telemetry,
  onToggleFuse,
  onToggleMainSwitch,
  onToggleDpstSwitch,
  onToggleDiodeFault,
  onToggleShortCircuit,
  onSetScapSoc,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'TELEMETRY' | 'SPECS' | 'DIAGNOSTICS'>('TELEMETRY');

  if (!selectedComponent) {
    return (
      <div className="w-80 h-full bg-slate-900/95 border-l border-slate-800 flex flex-col items-center justify-center p-6 text-center text-slate-500">
        <Layers className="w-12 h-12 stroke-[1.2] mb-3 text-slate-600" />
        <h3 className="text-sm font-semibold font-mono text-slate-400">NO COMPONENT SELECTED</h3>
        <p className="text-xs text-slate-600 mt-1 max-w-[220px]">
          Click any component or instrument in the electrical schematic to inspect its live telemetry, specifications, and parameters.
        </p>
      </div>
    );
  }

  // Render content according to the selected component
  const renderComponentData = () => {
    switch (selectedComponent) {
      case 'transformer':
        return {
          title: 'T1 — STEP-DOWN TRANSFORMER',
          tag: 'T1',
          standard: 'IEC 60076 / IEEE C57.12',
          category: 'Transformation',
          measurements: [
            { label: 'Primary Voltage (Vac)', value: `${telemetry.vac_primary.toFixed(1)} V`, color: 'text-sky-400' },
            { label: 'Secondary Voltage (Vac)', value: `${telemetry.vac_secondary.toFixed(1)} V`, color: 'text-sky-400' },
            { label: 'Secondary Current (Iac)', value: `${telemetry.iac_secondary.toFixed(2)} A`, color: 'text-amber-400' },
            { label: 'Calculated Power (S)', value: `${Math.round(telemetry.vac_secondary * telemetry.iac_secondary)} VA`, color: 'text-emerald-400' },
            { label: 'Operating Efficiency (η)', value: `${telemetry.transformer_eff.toFixed(1)} %`, color: 'text-emerald-400' },
            { label: 'Core / Winding Temp', value: `${telemetry.transformer_temp.toFixed(1)} °C`, color: 'text-slate-300' },
          ],
          specs: [
            { label: 'Rated Primary Voltage', value: '230 V AC (Single Phase)' },
            { label: 'Rated Secondary Voltage', value: '12.0 V AC RMS' },
            { label: 'Rated Power', value: '500 VA' },
            { label: 'Turns Ratio (Np/Ns)', value: '19.17 : 1' },
            { label: 'Core Material', value: 'Grain-Oriented Silicon Steel' },
            { label: 'Winding Isolation', value: 'Class H (180°C)' },
          ],
        };

      case 'bridge_rectifier':
        return {
          title: 'BR1 — FULL-WAVE BRIDGE RECTIFIER',
          tag: 'BR1',
          standard: 'IEC 60146 / IEEE 141',
          category: 'Rectification',
          measurements: [
            { label: 'AC Input Voltage (Vac)', value: `${telemetry.vac_secondary.toFixed(1)} V`, color: 'text-sky-400' },
            { label: 'DC Output Voltage (Vdc)', value: `${telemetry.v_rect_out.toFixed(1)} V`, color: 'text-rose-400' },
            { label: 'Rectifier Current (Idc)', value: `${telemetry.i_rect_out.toFixed(2)} A`, color: 'text-amber-400' },
            { label: 'Junction Temp', value: `${telemetry.rectifier_temp.toFixed(1)} °C`, color: 'text-slate-300' },
            { label: 'Conduction Angle', value: '180° (Continuous)', color: 'text-emerald-400' },
          ],
          diodes: [
            { name: 'Diode D1 (High Side Pos)', state: telemetry.diode_status[0] },
            { name: 'Diode D2 (Low Side Return)', state: telemetry.diode_status[1] },
            { name: 'Diode D3 (Opposite High Side)', state: telemetry.diode_status[2] },
            { name: 'Diode D4 (Opposite Low Side)', state: telemetry.diode_status[3] },
          ],
          specs: [
            { label: 'Configuration', value: '4x Fast Recovery Silicon Diodes' },
            { label: 'Peak Inverse Voltage (PIV)', value: '100 V' },
            { label: 'Forward Voltage Drop (Vf)', value: '0.7 V per diode' },
            { label: 'Max Forward Current', value: '25 A' },
          ],
        };

      case 'dc_link_cap':
        return {
          title: 'C_DC — DC-LINK SMOOTHING CAPACITOR',
          tag: 'C1',
          standard: 'IEC 61071 Power Electronic Capacitors',
          category: 'Filtering & Energy Buffer',
          measurements: [
            { label: 'DC-Link Bus Voltage (Vdc)', value: `${telemetry.vdc_bus.toFixed(1)} V`, color: 'text-rose-400' },
            { label: 'Capacitance Value', value: '15,000 µF (15 mF)', color: 'text-sky-400' },
            { label: 'Stored Electrostatic Energy', value: `${telemetry.cap_stored_energy.toFixed(2)} J`, color: 'text-emerald-400' },
            { label: 'Peak-to-Peak Ripple Voltage', value: `${telemetry.vdc_ripple.toFixed(1)} mV`, color: 'text-amber-400' },
            { label: 'Bus Power (Pdc)', value: `${telemetry.pdc_bus} W`, color: 'text-emerald-400' },
          ],
          specs: [
            { label: 'Dielectric Type', value: 'Electrolytic / Polypropylene Film' },
            { label: 'Rated DC Voltage', value: '25 V DC (Surge: 30V)' },
            { label: 'Equivalent Series Res. (ESR)', value: '12 mΩ' },
            { label: 'Ripple Current Rating', value: '18 A RMS' },
          ],
        };

      case 'supercapacitor':
        return {
          title: 'SC_BANK — SUPERCAPACITOR STORAGE BANK',
          tag: 'SC1',
          standard: 'IEC 62391 Double-Layer Capacitors',
          category: 'Energy Storage & Peak Shaving',
          measurements: [
            { label: 'Loaded Terminal Voltage', value: `${telemetry.v_scap.toFixed(2)} V`, color: 'text-emerald-400' },
            { label: 'Internal Open-Circuit (Vocv)', value: `${telemetry.v_scap_ocv.toFixed(2)} V`, color: 'text-sky-300' },
            { label: 'Instantaneous IR Step (ΔV)', value: `${telemetry.scap_ir_drop_v > 0 ? '+' : ''}${telemetry.scap_ir_drop_v.toFixed(3)} V`, color: 'text-amber-400' },
            { label: 'Charge/Discharge Current', value: `${telemetry.i_scap > 0 ? `+${telemetry.i_scap.toFixed(2)}` : telemetry.i_scap.toFixed(2)} A`, color: telemetry.i_scap > 0 ? 'text-emerald-400' : 'text-amber-400' },
            { label: 'Instantaneous Power (Psc)', value: `${telemetry.scap_power_w > 0 ? `+${telemetry.scap_power_w.toFixed(0)}` : telemetry.scap_power_w.toFixed(0)} W`, color: 'text-amber-400' },
            { label: 'State of Charge (SOC)', value: `${telemetry.soc_scap.toFixed(1)} %`, color: 'text-sky-400' },
            { label: 'Stored Energy (Joules)', value: `${(telemetry.stored_energy_scap / 1000).toFixed(2)} kJ`, color: 'text-emerald-400' },
            { label: 'Stored Energy (Wh)', value: `${telemetry.scap_stored_wh.toFixed(2)} Wh`, color: 'text-emerald-400' },
            { label: 'Module ESR', value: `${telemetry.scap_esr_mohm.toFixed(1)} mΩ`, color: 'text-slate-300' },
            { label: 'Cell Pack Temp', value: `${telemetry.scap_temp.toFixed(1)} °C`, color: 'text-slate-300' },
            { label: 'Coulombic Efficiency', value: `${telemetry.scap_coulombic_eff.toFixed(1)} %`, color: 'text-emerald-400' },
            { label: 'Cycle Counter', value: `${telemetry.scap_cycles} Cycles`, color: 'text-slate-400' },
          ],
          cellBalances: telemetry.scap_cell_voltages,
          specs: [
            { label: 'Configuration', value: '6x 350F Cells in Series (58F Pack)' },
            { label: 'Cell Chemistry', value: 'EDLC Organic Electrolyte (Stern 2-Branch)' },
            { label: 'Rated Capacitance', value: '58.0 Farads' },
            { label: 'Operating Voltage Range', value: '10.0 V (Empty) to 16.2 V (Max)' },
            { label: 'Peak Current Capability', value: '120 A (1 sec pulse)' },
            { label: 'Total Pack ESR', value: '14.5 mΩ' },
            { label: 'Endurance Rating', value: '1,000,000 Cycles @ 25°C' },
          ],
          action: onSetScapSoc ? {
            label: telemetry.soc_scap >= 98 ? 'DISCHARGE TO 70% (TEST CHARGING)' : 'FORCE 100% FULL (TEST HEAT DUMP)',
            onClick: () => onSetScapSoc(telemetry.soc_scap >= 98 ? 70 : 100),
          } : undefined,
        };

      case 'dcdc_converter':
        return {
          title: 'CONV1 — BIDIRECTIONAL DC-DC CONVERTER',
          tag: 'CONV1',
          standard: 'IEC 62477 / IEEE 1547',
          category: 'Power Electronic Conversion',
          measurements: [
            { label: 'Conversion Mode', value: telemetry.dcdc_mode, color: telemetry.dcdc_mode === 'BUCK' ? 'text-emerald-400' : telemetry.dcdc_mode === 'BOOST' ? 'text-amber-400' : 'text-slate-400' },
            { label: 'PWM Duty Cycle', value: `${telemetry.dcdc_duty_cycle} %`, color: 'text-sky-400' },
            { label: 'Inductor Current (I_L)', value: `${telemetry.dcdc_current.toFixed(2)} A`, color: 'text-amber-400' },
            { label: 'Converter Efficiency', value: '96.2 %', color: 'text-emerald-400' },
            { label: 'Power Stage Temp', value: `${telemetry.dcdc_temp.toFixed(1)} °C`, color: 'text-slate-300' },
          ],
          specs: [
            { label: 'Topology', value: 'Synchronous Non-Isolated Buck/Boost' },
            { label: 'Switching Devices', value: 'Dual N-Channel MOSFETs' },
            { label: 'PWM Switching Freq', value: '50 kHz' },
            { label: 'Filter Inductor (L1)', value: '47 µH, Ferrite core' },
          ],
        };

      case 'pmsm_motor':
        return {
          title: 'M1 — PERMANENT MAGNET SYNCHRONOUS MOTOR',
          tag: 'M1',
          standard: 'IEC 60034 Rotating Electrical Machines',
          category: 'Actuation & Regeneration',
          measurements: [
            { label: 'Rotor Shaft Speed', value: `${telemetry.motor_speed_rpm} RPM`, color: 'text-sky-400' },
            { label: 'Electromagnetic Torque', value: `${telemetry.motor_torque_nm.toFixed(1)} Nm`, color: 'text-amber-400' },
            { label: 'Mechanical Power', value: `${telemetry.motor_mech_power} W`, color: 'text-emerald-400' },
            { label: 'Regenerative Power', value: `${telemetry.regen_power_w} W`, color: 'text-emerald-400' },
            { label: 'Shaft Direction', value: telemetry.motor_direction, color: 'text-sky-300' },
            { label: 'Stator Temperature', value: `${telemetry.motor_temp.toFixed(1)} °C`, color: 'text-slate-300' },
          ],
          specs: [
            { label: 'Motor Architecture', value: '3-Phase Surface PMSM' },
            { label: 'Pole Pairs', value: '4 (8 Poles)' },
            { label: 'Back-EMF Constant (Ke)', value: '0.015 V·s/rad' },
            { label: 'Rated Continuous Torque', value: '14.0 Nm' },
            { label: 'Counterweight Ratio', value: '50% Balance' },
          ],
        };

      case 'fuse_ac':
        return {
          title: 'F1 — SECONDARY PROTECTION FUSE',
          tag: 'F1',
          standard: 'IEC 60269 Low-voltage fuses',
          category: 'Protection',
          measurements: [
            { label: 'Fuse State', value: telemetry.fuse_blown ? 'TRIPPED / BLOWN' : 'INTACT (CONDUCTING)', color: telemetry.fuse_blown ? 'text-rose-500' : 'text-emerald-400' },
            { label: 'Through-Current', value: `${telemetry.iac_secondary.toFixed(2)} A`, color: 'text-amber-400' },
            { label: 'Voltage Drop', value: telemetry.fuse_blown ? `${telemetry.vac_secondary.toFixed(1)} V (Open)` : '0.04 V', color: 'text-slate-300' },
          ],
          specs: [
            { label: 'Type', value: 'Fast-Acting Cartridge Ceramic' },
            { label: 'Rated Current (In)', value: '10 A' },
            { label: 'Interrupting Capacity', value: '1500 A @ 250V' },
          ],
          action: {
            label: telemetry.fuse_blown ? 'REPLACE / RESET FUSE' : 'SIMULATE FUSE BLOW',
            onClick: onToggleFuse,
          },
        };

      case 'dpst_switch':
        return {
          title: 'SW_DPST — TWO POLE SINGLE THROW CONTACTOR',
          tag: 'SW_DPST',
          standard: 'IEC 60947-4-1 Contactors',
          category: 'Isolation Switching',
          measurements: [
            { label: 'Pole 1 (Positive Rail)', value: telemetry.dpst_switch_closed ? 'CLOSED' : 'OPEN', color: telemetry.dpst_switch_closed ? 'text-emerald-400' : 'text-rose-500' },
            { label: 'Pole 2 (Negative Rail)', value: telemetry.dpst_switch_closed ? 'CLOSED' : 'OPEN', color: telemetry.dpst_switch_closed ? 'text-emerald-400' : 'text-rose-500' },
            { label: 'Switched Current', value: `${telemetry.i_scap.toFixed(2)} A`, color: 'text-amber-400' },
          ],
          specs: [
            { label: 'Configuration', value: '2P1T Double Break' },
            { label: 'Rated Operational Current', value: '32 A DC' },
            { label: 'Coil Control Voltage', value: '12 V DC' },
          ],
          action: {
            label: telemetry.dpst_switch_closed ? 'OPEN CONTACTOR (ISOLATE)' : 'CLOSE CONTACTOR',
            onClick: onToggleDpstSwitch,
          },
        };

      case 'brake_resistor':
        return {
          title: 'R_DUMP — BRAKING HEAT DISSIPATION RESISTOR',
          tag: 'R_DUMP',
          standard: 'IEC 60115 / IEEE Dynamic Braking',
          category: 'Energy Absorption & Heat Dissipation',
          measurements: [
            { label: 'Operating State', value: telemetry.brake_resistor_active ? 'DISSIPATING HEAT (OVERFLOW)' : 'IDLE (STANDBY)', color: telemetry.brake_resistor_active ? 'text-rose-400' : 'text-slate-400' },
            { label: 'Dissipated Power (Heat)', value: `${telemetry.brake_resistor_power_w} W`, color: telemetry.brake_resistor_active ? 'text-amber-400' : 'text-slate-400' },
            { label: 'Dump Resistor Current', value: `${telemetry.brake_resistor_current.toFixed(1)} A`, color: telemetry.brake_resistor_active ? 'text-rose-400' : 'text-slate-400' },
            { label: 'Surface Temperature', value: `${telemetry.brake_resistor_temp.toFixed(1)} °C`, color: telemetry.brake_resistor_temp > 60 ? 'text-rose-400' : 'text-slate-300' },
            { label: 'Chopper IGBT (Q_CHOP)', value: telemetry.brake_chopper_closed ? 'MODULATING (ON)' : 'OFF (OPEN)', color: telemetry.brake_chopper_closed ? 'text-emerald-400' : 'text-slate-400' },
            { label: 'Supercap Protection Status', value: telemetry.soc_scap >= 98 ? 'OVP ENGAGED (100% FULL)' : 'NORMAL RECHARGE', color: 'text-emerald-400' },
          ],
          specs: [
            { label: 'Nominal Resistance', value: '5.0 Ω Wirewound Non-Inductive' },
            { label: 'Continuous Power Rating', value: '3,000 W' },
            { label: 'Pulse Absorption Energy', value: '75 kJ (10 sec)' },
            { label: 'Max Surface Temp', value: '350 °C Rated' },
            { label: 'Cooling Method', value: 'Extruded Aluminum Heat Sink with Forced Air' },
          ],
          action: onSetScapSoc ? {
            label: telemetry.brake_resistor_active ? 'RESTORE NORMAL CHARGE (70% SOC)' : 'TRIGGER 100% FULL (FIRE CHOPPER & HEAT DUMP)',
            onClick: () => onSetScapSoc(telemetry.brake_resistor_active ? 70 : 100),
          } : undefined,
        };

      default:
        return {
          title: `${selectedComponent.toUpperCase()} — ELECTRICAL ELEMENT`,
          tag: selectedComponent,
          standard: 'IEC / IEEE Standard',
          category: 'Circuit Element',
          measurements: [
            { label: 'Bus Potential', value: `${telemetry.vdc_bus.toFixed(1)} V`, color: 'text-sky-400' },
            { label: 'Status', value: 'ACTIVE IN NETWORK', color: 'text-emerald-400' },
          ],
          specs: [
            { label: 'Standard Rating', value: 'Conforms to Schematic Topology' },
          ],
        };
    }
  };

  const comp = renderComponentData();

  return (
    <div className="w-80 h-full bg-slate-900/95 border-l border-slate-800 flex flex-col justify-between shadow-2xl backdrop-blur select-none">
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between p-3.5 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-sky-400" />
            <h2 className="text-xs font-mono font-bold text-slate-200 tracking-wider">
              COMPONENT INSPECTOR
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-sm font-mono px-1 rounded hover:bg-slate-800"
          >
            ✕
          </button>
        </div>

        {/* Component Title & Tag Banner */}
        <div className="p-3.5 bg-slate-900 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-950 border border-sky-800 text-sky-300 font-bold">
              {comp.tag}
            </span>
            <span className="text-[10px] font-mono text-slate-400">{comp.category}</span>
          </div>
          <h3 className="text-xs font-mono font-bold text-slate-100 mt-1.5 leading-snug">
            {comp.title}
          </h3>
          <p className="text-[10px] font-mono text-slate-500 mt-0.5">{comp.standard}</p>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-800 bg-slate-950/30 text-[11px] font-mono">
          <button
            onClick={() => setActiveTab('TELEMETRY')}
            className={`flex-1 py-2 text-center transition border-b-2 ${
              activeTab === 'TELEMETRY'
                ? 'border-sky-500 text-sky-300 bg-slate-800/40 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            Telemetry
          </button>
          <button
            onClick={() => setActiveTab('SPECS')}
            className={`flex-1 py-2 text-center transition border-b-2 ${
              activeTab === 'SPECS'
                ? 'border-sky-500 text-sky-300 bg-slate-800/40 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            Parameters
          </button>
          <button
            onClick={() => setActiveTab('DIAGNOSTICS')}
            className={`flex-1 py-2 text-center transition border-b-2 ${
              activeTab === 'DIAGNOSTICS'
                ? 'border-sky-500 text-sky-300 bg-slate-800/40 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            Testing
          </button>
        </div>

        {/* Tab 1: Live Telemetry */}
        {activeTab === 'TELEMETRY' && (
          <div className="p-3.5 space-y-2.5 overflow-y-auto max-h-[calc(100vh-340px)]">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold mb-1">
              Real-time Operating Values
            </div>

            <div className="grid grid-cols-1 gap-2">
              {comp.measurements.map((m, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950/70 border border-slate-800/80 rounded px-3 py-2 flex items-center justify-between"
                >
                  <span className="text-[11px] font-mono text-slate-400">{m.label}</span>
                  <span className={`text-xs font-mono font-bold ${m.color}`}>{m.value}</span>
                </div>
              ))}
            </div>

            {/* Diode Bridge details if rectifier */}
            {'diodes' in comp && comp.diodes && (
              <div className="mt-3 pt-3 border-t border-slate-800">
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold mb-2">
                  Diode Conduction States
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {comp.diodes.map((d: any, idx: number) => (
                    <div
                      key={idx}
                      className="bg-slate-950 border border-slate-800 rounded p-2 flex items-center justify-between"
                    >
                      <span className="text-[10px] font-mono text-slate-300">{d.name.split(' ')[1]}</span>
                      <span className={`text-[10px] font-mono font-bold ${d.state ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {d.state ? 'CONDUCTING' : 'REVERSE'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Technical Specifications & Parameters */}
        {activeTab === 'SPECS' && (
          <div className="p-3.5 space-y-2.5 overflow-y-auto max-h-[calc(100vh-340px)]">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold mb-1">
              Hardware Parameters & Ratings
            </div>
            <div className="space-y-1.5">
              {comp.specs.map((s, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950/50 border border-slate-800/60 rounded px-2.5 py-1.5 flex items-center justify-between text-xs font-mono"
                >
                  <span className="text-slate-400 text-[11px]">{s.label}</span>
                  <span className="text-slate-200 font-medium text-[11px]">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Diagnostics & Fault Injection */}
        {activeTab === 'DIAGNOSTICS' && (
          <div className="p-3.5 space-y-3 overflow-y-auto max-h-[calc(100vh-340px)]">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
              Component Fault Simulation
            </div>

            {selectedComponent === 'fuse_ac' && (
              <button
                onClick={onToggleFuse}
                className={`w-full py-2.5 px-3 rounded font-mono text-xs font-bold flex items-center justify-center space-x-2 transition ${
                  telemetry.fuse_blown
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : 'bg-rose-900/60 border border-rose-700 hover:bg-rose-800/80 text-rose-200'
                }`}
              >
                <AlertTriangle className="w-4 h-4" />
                <span>{telemetry.fuse_blown ? 'REPLACE FUSE (RESET)' : 'INJECT OVERCURRENT (BLOW FUSE)'}</span>
              </button>
            )}

            {selectedComponent === 'bridge_rectifier' && (
              <button
                onClick={onToggleDiodeFault}
                className="w-full py-2.5 px-3 rounded font-mono text-xs font-bold bg-amber-900/40 border border-amber-700 hover:bg-amber-800/60 text-amber-200 flex items-center justify-center space-x-2 transition"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>INJECT DIODE D2 OPEN-CIRCUIT</span>
              </button>
            )}

            {selectedComponent === 'dc_link_cap' && (
              <button
                onClick={onToggleShortCircuit}
                className="w-full py-2.5 px-3 rounded font-mono text-xs font-bold bg-rose-900/40 border border-rose-700 hover:bg-rose-800/60 text-rose-200 flex items-center justify-center space-x-2 transition"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>INJECT DC BUS SHORT-CIRCUIT</span>
              </button>
            )}

            {(selectedComponent === 'dpst_switch' || selectedComponent === 'supercapacitor') && (
              <button
                onClick={onToggleDpstSwitch}
                className={`w-full py-2.5 px-3 rounded font-mono text-xs font-bold flex items-center justify-center space-x-2 transition ${
                  telemetry.dpst_switch_closed
                    ? 'bg-rose-900/60 border border-rose-700 text-rose-200 hover:bg-rose-800'
                    : 'bg-emerald-600 text-white hover:bg-emerald-500'
                }`}
              >
                <Power className="w-4 h-4" />
                <span>{telemetry.dpst_switch_closed ? 'ISOLATE SUPERCAPACITOR (OPEN DPST)' : 'CONNECT SUPERCAPACITOR (CLOSE DPST)'}</span>
              </button>
            )}

            {selectedComponent === 'switch_ac' && (
              <button
                onClick={onToggleMainSwitch}
                className={`w-full py-2.5 px-3 rounded font-mono text-xs font-bold flex items-center justify-center space-x-2 transition ${
                  telemetry.main_switch_closed
                    ? 'bg-rose-900/60 border border-rose-700 text-rose-200 hover:bg-rose-800'
                    : 'bg-emerald-600 text-white hover:bg-emerald-500'
                }`}
              >
                <Power className="w-4 h-4" />
                <span>{telemetry.main_switch_closed ? 'OPEN BREAKER SW1' : 'CLOSE BREAKER SW1'}</span>
              </button>
            )}

            <div className="bg-slate-950/70 border border-slate-800 rounded p-2.5 text-[11px] font-mono text-slate-400">
              <div className="text-slate-300 font-bold mb-1">HEALTH METRICS:</div>
              <div>Thermal Stress: <span className="text-emerald-400 font-semibold">NORMAL (18%)</span></div>
              <div>Component Degradation: <span className="text-emerald-400 font-semibold">0.2% / 10k hrs</span></div>
              <div>Insulation Resistance: <span className="text-emerald-400 font-semibold">&gt; 100 MΩ</span></div>
            </div>
          </div>
        )}
      </div>

      {/* Action Footer if single button */}
      {'action' in comp && comp.action && (
        <div className="p-3 border-t border-slate-800 bg-slate-950/70">
          <button
            onClick={comp.action.onClick}
            className="w-full py-2 rounded bg-sky-600 hover:bg-sky-500 text-white text-xs font-mono font-bold transition shadow"
          >
            {comp.action.label}
          </button>
        </div>
      )}
    </div>
  );
};
