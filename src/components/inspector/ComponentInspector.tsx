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
      case 'ac_source':
      case 'grid_3ph':
        return {
          title: '3φ GRID — 400V INDUSTRIAL MAINS',
          tag: '3φ GRID',
          standard: 'IEC 60038 / IEEE 141',
          category: 'AC Source',
          measurements: [
            { label: 'Line-to-Line Voltage', value: `${telemetry.v_grid_3ph.toFixed(1)} V AC`, color: 'text-sky-400' },
            { label: 'Grid Frequency (f)', value: `${telemetry.freq_ac.toFixed(1)} Hz`, color: 'text-sky-400' },
            { label: 'Rectified Current (Irect)', value: `${telemetry.i_rect_a.toFixed(1)} A`, color: 'text-amber-400' },
            { label: 'Grid Active Power (Pgrid)', value: `${telemetry.p_grid_kw.toFixed(1)} kW`, color: 'text-emerald-400' },
          ],
          specs: [
            { label: 'Nominal Voltage', value: '400 V RMS (3-Phase)' },
            { label: 'Nominal Frequency', value: '50.0 Hz' },
            { label: 'Peak Shaving', value: 'Zero grid draw during Supercap assist' },
          ],
        };

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
            { label: 'Rated Primary Voltage', value: '400 V AC (3-Phase)' },
            { label: 'Rated Power', value: '15 kVA' },
            { label: 'Core Material', value: 'Grain-Oriented Silicon Steel' },
            { label: 'Winding Isolation', value: 'Class H (180°C)' },
          ],
        };

      case 'bridge_rectifier':
        return {
          title: 'DIODE RECTIFIER (6-PULSE 3φ BRIDGE)',
          tag: 'RECTIFIER',
          standard: 'IEC 60146 / IEEE 141',
          category: 'Rectification',
          measurements: [
            { label: 'AC Input Voltage (Vac)', value: `${telemetry.v_grid_3ph.toFixed(1)} V`, color: 'text-sky-400' },
            { label: 'Rectified Current (Irect)', value: `${telemetry.i_rect_a.toFixed(1)} A`, color: 'text-amber-400' },
            { label: 'Active Grid Power (Pgrid)', value: `${telemetry.p_grid_kw.toFixed(1)} kW`, color: 'text-emerald-400' },
            { label: 'DC Bus Output (Vdc)', value: `${telemetry.vdc_bus.toFixed(1)} V`, color: 'text-rose-400' },
            { label: 'Junction Temp', value: `${telemetry.rectifier_temp.toFixed(1)} °C`, color: 'text-slate-300' },
          ],
          diodes: [
            { name: 'Diode D1 (Phase U High)', state: telemetry.diode_status[0] },
            { name: 'Diode D2 (Phase U Low)', state: telemetry.diode_status[1] },
            { name: 'Diode D3 (Phase V High)', state: telemetry.diode_status[2] },
            { name: 'Diode D4 (Phase V Low)', state: telemetry.diode_status[3] },
          ],
          specs: [
            { label: 'Configuration', value: '3-Phase 6-Pulse Diode Bridge' },
            { label: 'Peak Inverse Voltage (PIV)', value: '1200 V' },
            { label: 'Forward Voltage Drop (Vf)', value: '0.85 V per diode' },
            { label: 'Max Surge Current', value: '150 A' },
          ],
        };

      case 'dc_link_cap':
        return {
          title: 'DC LINK — C_dc SMOOTHING BUS',
          tag: 'DC LINK',
          standard: 'IEC 61071 Power Electronic Capacitors',
          category: 'DC Bus Energy Buffer',
          measurements: [
            { label: 'DC-Link Bus Voltage (Vdc)', value: `${telemetry.vdc_bus.toFixed(1)} V`, color: 'text-rose-400' },
            { label: 'Capacitance Value (C_dc)', value: `${telemetry.c_dc_mf.toFixed(1)} mF (4700 µF)`, color: 'text-sky-400' },
            { label: 'Stored Energy', value: `${(0.5 * 0.0047 * Math.pow(telemetry.vdc_bus, 2) / 1000).toFixed(2)} kJ`, color: 'text-emerald-400' },
            { label: 'Inverter Current (Iinv)', value: `${telemetry.i_inv_a.toFixed(1)} A`, color: 'text-amber-400' },
            { label: 'DC-DC Port Current (Idc)', value: `${telemetry.i_dc_dcdc.toFixed(1)} A`, color: 'text-sky-400' },
          ],
          specs: [
            { label: 'Capacitor Type', value: 'High-Ripple Metallized Polypropylene Film' },
            { label: 'Rated DC Voltage', value: '800 V DC' },
            { label: 'Rated Capacitance', value: '4.7 mF' },
            { label: 'ESR @ 10 kHz', value: '2.5 mΩ' },
          ],
        };

      case 'bts7960_driver':
        return {
          title: 'BTS7960 — 43A HIGH-POWER H-BRIDGE MOTOR DRIVER',
          tag: 'BTS7960',
          standard: 'Infineon NovalithIC™ Dual Half-Bridge',
          category: 'Motor Controller Power Stage',
          measurements: [
            { label: 'Operating Mode', value: telemetry.power_flow === 'REGENERATING' ? 'REGENERATIVE BRAKING' : telemetry.power_flow === 'MOTORING' ? (telemetry.motor_direction === 'CW' ? 'FORWARD MOTORING' : 'REVERSE MOTORING') : 'IDLE / COAST', color: telemetry.power_flow === 'REGENERATING' ? 'text-emerald-400' : 'text-sky-400' },
            { label: 'PWM Duty Cycle (D)', value: `${Math.round(Math.min(100, (Math.abs(telemetry.motor_speed_rpm) / 950) * 100))}%`, color: 'text-amber-400' },
            { label: 'Output Voltage (M+ to M-)', value: `${(telemetry.vdc_bus * (Math.abs(telemetry.motor_speed_rpm) / 950)).toFixed(1)} V`, color: 'text-sky-400' },
            { label: 'Motor Current (I_motor)', value: `${telemetry.motor_current.toFixed(2)} A`, color: telemetry.power_flow === 'REGENERATING' ? 'text-emerald-400' : 'text-sky-400' },
            { label: 'MOSFET Rds(on)', value: '16 mΩ per switch', color: 'text-slate-400' },
            { label: 'Internal Temp', value: `${(32 + Math.abs(telemetry.motor_current) * 1.5).toFixed(1)} °C`, color: 'text-slate-300' },
          ],
          specs: [
            { label: 'Operating Voltage Range', value: '5.5 V to 27.0 V DC' },
            { label: 'Peak Current Limit', value: '43 A (Integrated Current Sense)' },
            { label: 'PWM Switching Frequency', value: 'Up to 25 kHz' },
            { label: 'Protection', value: 'Over-temp, Under-voltage, Active Freewheeling' },
          ],
        };

      case 'dc_motor':
        return {
          title: 'DC TRACTION MOTOR & INERTIAL FLYWHEEL',
          tag: 'DC MOTOR + FLYWHEEL',
          standard: 'IEC 60034 Rotating Electrical Machines',
          category: 'Electromechanical Dynamo / Load',
          measurements: [
            { label: 'Shaft Speed (n)', value: `${telemetry.motor_speed_rpm.toFixed(0)} RPM`, color: 'text-sky-400' },
            { label: 'Shaft Torque (τ)', value: `${telemetry.motor_torque_nm.toFixed(2)} Nm`, color: 'text-amber-400' },
            { label: 'Mechanical Power (P)', value: `${telemetry.motor_mech_power.toFixed(1)} W`, color: 'text-emerald-400' },
            { label: 'Direction of Rotation', value: telemetry.motor_direction === 'CW' ? 'CW (CLOCKWISE)' : telemetry.motor_direction === 'CCW' ? 'CCW (COUNTER-CW)' : 'STOPPED', color: 'text-sky-300' },
            { label: 'Back-EMF (E_b)', value: `${(telemetry.motor_speed_rpm * 0.012).toFixed(2)} V`, color: 'text-purple-400' },
            { label: 'Coupled Flywheel Inertia (J)', value: '0.045 kg·m² (Steel Disk)', color: 'text-slate-400' },
          ],
          specs: [
            { label: 'Nominal Voltage', value: '12.0 V DC (15.6V Overdrive)' },
            { label: 'Rated Speed', value: '950 RPM' },
            { label: 'Armature Resistance (Ra)', value: '0.35 Ω' },
            { label: 'Armature Inductance (La)', value: '1.2 mH' },
          ],
        };

      case 'arduino_controller':
        return {
          title: 'ARDUINO ATmega328P MICROCONTROLLER',
          tag: 'ARDUINO MCU',
          standard: 'Embedded 8-bit RISC Microcontroller',
          category: 'Control & PWM Signal Generation',
          measurements: [
            { label: 'Clock Speed', value: '16.0 MHz Crystal', color: 'text-sky-400' },
            { label: 'RPWM Pin (D5)', value: telemetry.motor_direction === 'CW' && telemetry.power_flow === 'MOTORING' ? 'ACTIVE PWM (490 Hz)' : '0 V (LOW)', color: 'text-amber-400' },
            { label: 'LPWM Pin (D6)', value: telemetry.motor_direction === 'CCW' && telemetry.power_flow === 'MOTORING' ? 'ACTIVE PWM (490 Hz)' : '0 V (LOW)', color: 'text-purple-400' },
            { label: 'Enable Pins (D9, D10)', value: telemetry.main_switch_closed ? 'HIGH (5.0 V ENABLED)' : 'LOW (DISABLED)', color: 'text-emerald-400' },
            { label: 'I2C Bus (A4 SDA / A5 SCL)', value: '100 kHz Live Telemetry Telecast', color: 'text-sky-300' },
            { label: 'R&D Ground Tie', value: 'COMMON TIED TO B- (SOLVED)', color: 'text-emerald-400 font-bold' },
          ],
          specs: [
            { label: 'Microcontroller Core', value: 'Microchip ATmega328P' },
            { label: 'Operating Voltage', value: '5.0 V Regulated' },
            { label: 'ADC Resolution', value: '10-bit (1024 steps)' },
            { label: 'Flash Memory', value: '32 KB' },
          ],
        };

      case 'lcd_display':
        return {
          title: 'I2C 16x2 CHARACTER LCD DISPLAY MODULE',
          tag: '16x2 LCD (PCF8574)',
          standard: 'HD44780 Controller with PCF8574 Backpack',
          category: 'Visual Human-Machine Interface',
          measurements: [
            { label: 'Quadrant Operation', value: telemetry.power_flow === 'REGENERATING' ? (telemetry.motor_direction === 'CCW' ? 'Q4: REV REGEN' : 'Q2: FWD REGEN') : telemetry.power_flow === 'MOTORING' ? (telemetry.motor_direction === 'CCW' ? 'Q3: REV MOTOR' : 'Q1: FWD MOTOR') : 'STANDBY / IDLE', color: telemetry.power_flow === 'REGENERATING' ? 'text-emerald-400' : 'text-sky-400' },
            { label: 'Displayed Duty Cycle', value: `${Math.round(Math.min(100, (Math.abs(telemetry.motor_speed_rpm) / 950) * 100))}%`, color: 'text-amber-400' },
            { label: 'DC Link Voltage', value: `${telemetry.vdc_bus.toFixed(1)} V`, color: 'text-sky-400' },
            { label: 'Supercap Voltage', value: `${telemetry.v_scap.toFixed(1)} V`, color: 'text-emerald-400' },
            { label: 'I2C Slave Address', value: '0x27 (7-bit standard)', color: 'text-slate-400' },
          ],
          specs: [
            { label: 'Display Format', value: '16 Characters x 2 Lines' },
            { label: 'Backlight Color', value: 'Transflective Blue / Cyan LED' },
            { label: 'Communication Protocol', value: 'I2C Fast Mode (SDA, SCL, VCC, GND)' },
            { label: 'Refresh Rate', value: '25 Hz Continuous Update' },
          ],
        };

      case 'reverse_led':
        return {
          title: 'LED (REVERSE STORED ENERGY) — REGEN INDICATOR',
          tag: 'REVERSE STORED ENERGY LED',
          standard: 'Optoelectronic Energy Scavenging Indicator',
          category: 'Status Indication & Energy Harvesting Path',
          measurements: [
            { label: 'State', value: telemetry.power_flow === 'REGENERATING' ? 'ILLUMINATED (REGENERATION ACTIVE)' : 'OFF (STANDBY)', color: telemetry.power_flow === 'REGENERATING' ? 'text-emerald-400 font-bold' : 'text-slate-400' },
            { label: 'Forward Current (If)', value: telemetry.power_flow === 'REGENERATING' ? '14.2 mA' : '0.0 mA', color: telemetry.power_flow === 'REGENERATING' ? 'text-emerald-400' : 'text-slate-400' },
            { label: 'Forward Voltage (Vf)', value: telemetry.power_flow === 'REGENERATING' ? '2.15 V (Green)' : '0.0 V', color: 'text-emerald-400' },
            { label: 'R&D Ballast Resistor', value: '1.0 kΩ 0.5W in series (PROTECTED)', color: 'text-emerald-400' },
            { label: 'Reverse Voltage Protection', value: 'Antiparallel Diode 1N4007 (INTEGRATED)', color: 'text-slate-300' },
          ],
          specs: [
            { label: 'Peak Wavelength', value: '525 nm (Pure Green)' },
            { label: 'Luminous Intensity', value: '12,000 mcd Ultra-Bright' },
            { label: 'Max Forward Current', value: '30 mA' },
          ],
        };

      case 'brake_resistor':
      case 'brake_chopper':
        return {
          title: 'BRAKE CHOPPER (+ R_brake)',
          tag: 'BRAKE CHOPPER',
          standard: 'IEC 60947-4-2 / IEEE 519',
          category: 'Dynamic Heat Dissipation',
          measurements: [
            { label: 'Chopper IGBT State', value: telemetry.chopper_state_text.toUpperCase(), color: telemetry.brake_chopper_closed ? 'text-amber-400' : 'text-slate-400' },
            { label: 'Brake Current (Ibr)', value: `${telemetry.i_br_a.toFixed(1)} A`, color: 'text-amber-400' },
            { label: 'Braking Dissipated Power', value: `${telemetry.p_br_kw.toFixed(1)} kW`, color: 'text-rose-400' },
            { label: 'Resistor Temperature', value: `${telemetry.brake_resistor_temp.toFixed(1)} °C`, color: 'text-amber-400' },
          ],
          specs: [
            { label: 'Braking Resistance (R_brake)', value: '25.0 Ω' },
            { label: 'Peak Power Rating', value: '15.0 kW (10 sec)' },
            { label: 'Chopper Duty Threshold', value: 'Engages if Supercap 100% full' },
          ],
        };

      case 'supercapacitor':
        return {
          title: 'SUPERCAP BANK — KONE ECO-DRIVE STORAGE',
          tag: 'SUPERCAP',
          standard: 'IEC 62391 Double-Layer Capacitors',
          category: 'Energy Storage & Peak Shaving',
          measurements: [
            { label: 'Terminal Voltage (Vsc)', value: `${telemetry.v_scap_bank.toFixed(1)} V`, color: 'text-emerald-400' },
            { label: 'Supercap Current (Isc)', value: `${telemetry.i_scap_bank > 0 ? `+${telemetry.i_scap_bank.toFixed(1)}` : telemetry.i_scap_bank.toFixed(1)} A`, color: telemetry.i_scap_bank > 0 ? 'text-emerald-400' : 'text-amber-400' },
            { label: 'Instantaneous Power (Psc)', value: `${telemetry.p_scap_kw > 0 ? `+${telemetry.p_scap_kw.toFixed(1)}` : telemetry.p_scap_kw.toFixed(1)} kW`, color: 'text-sky-400' },
            { label: 'State of Charge (SOC)', value: `${telemetry.soc_scap.toFixed(1)} %`, color: 'text-sky-400' },
            { label: 'Module Temperature', value: `${telemetry.scap_temp.toFixed(1)} °C`, color: 'text-slate-300' },
            { label: 'Cumulative Cycles', value: `${telemetry.scap_cycles} Cycles`, color: 'text-slate-400' },
          ],
          cellBalances: telemetry.scap_cell_voltages,
          specs: [
            { label: 'Module Configuration', value: '48x 3000F EDLC Series Module Bank' },
            { label: 'Operating Voltage Range', value: '110 V (Min) to 145 V (Max)' },
            { label: 'Nominal Bank Voltage', value: '133.4 V' },
            { label: 'Peak Motoring Current', value: '120 A (Discharge)' },
          ],
          action: onSetScapSoc ? {
            label: telemetry.soc_scap >= 98 ? 'DISCHARGE TO 70% (TEST CHARGING)' : 'FORCE 100% FULL (TEST HEAT DUMP)',
            onClick: () => onSetScapSoc(telemetry.soc_scap >= 98 ? 70 : 100),
          } : undefined,
        };

      case 'dcdc_converter':
        return {
          title: 'BIDIR DC-DC (BUCK / BOOST CONVERTER)',
          tag: 'BIDIR DC-DC',
          standard: 'IEC 62477 / IEEE 1547',
          category: 'Bidirectional Power Conversion',
          measurements: [
            { label: 'Operation Mode', value: telemetry.dcdc_mode_desc, color: telemetry.dcdc_mode_desc.includes('BOOST') ? 'text-amber-400' : telemetry.dcdc_mode_desc.includes('BUCK') ? 'text-emerald-400' : 'text-slate-400' },
            { label: 'Duty Ratio (D)', value: `≈ ${telemetry.dcdc_duty_val.toFixed(2)}`, color: 'text-sky-400' },
            { label: 'DC Bus Port Current (Idc)', value: `${telemetry.i_dc_dcdc.toFixed(1)} A`, color: 'text-sky-400' },
            { label: 'Supercap Port Current (Isc)', value: `${telemetry.i_scap_bank.toFixed(1)} A`, color: 'text-amber-400' },
            { label: 'Power Stage Temp', value: `${telemetry.dcdc_temp.toFixed(1)} °C`, color: 'text-slate-300' },
          ],
          specs: [
            { label: 'Topology', value: 'Synchronous Four-Quadrant Buck/Boost' },
            { label: 'Boost Discharging Duty', value: 'Steps 133.4V up to 555.3V bus' },
            { label: 'Buck Charging Duty', value: 'Steps 555.3V bus down to 133.4V scap' },
            { label: 'Switching Frequency', value: '25 kHz SiC MOSFETs' },
          ],
        };

      case 'motor_drive':
      case 'inverter_3ph':
        return {
          title: 'INVERTER (3φ VOLTAGE SOURCE INVERTER)',
          tag: 'INVERTER',
          standard: 'IEC 61800-5-1',
          category: 'Frequency Inverter',
          measurements: [
            { label: 'Inverter Current (Iinv)', value: `${telemetry.i_inv_a.toFixed(1)} A`, color: 'text-amber-400' },
            { label: 'Inverter Active Power (Pinv)', value: `${telemetry.p_inv_kw.toFixed(1)} kW`, color: 'text-emerald-400' },
            { label: 'Modulation Index (m)', value: `${telemetry.mod_index.toFixed(2)}`, color: 'text-purple-400' },
            { label: 'Electrical Frequency (fe)', value: `${telemetry.fe_hz.toFixed(1)} Hz`, color: 'text-sky-400' },
            { label: 'Phase Voltage (Vph)', value: `${telemetry.vph_v} V RMS`, color: 'text-sky-400' },
          ],
          specs: [
            { label: 'Topology', value: '3-Phase 2-Level IGBT Bridge' },
            { label: 'Modulation Algorithm', value: 'Space Vector PWM (SVPWM)' },
            { label: 'Inverter Efficiency', value: '97.5 %' },
          ],
        };

      case 'pmsm_motor':
        return {
          title: 'PMSM GEARLESS TRACTION MOTOR',
          tag: 'PMSM',
          standard: 'IEC 60034 / EN 81-20',
          category: 'Gearless Elevator Drive',
          measurements: [
            { label: 'Quadrature Current (iq)', value: `${telemetry.iq_pk_a.toFixed(1)} A pk`, color: 'text-amber-400' },
            { label: 'Electrical Frequency (fe)', value: `${telemetry.fe_hz.toFixed(1)} Hz`, color: 'text-sky-400' },
            { label: 'Phase Voltage (Vph)', value: `${telemetry.vph_v} V`, color: 'text-sky-400' },
            { label: 'Modulation Index', value: `${telemetry.mod_index.toFixed(2)}`, color: 'text-purple-400' },
            { label: 'Shaft Power (Pshaft)', value: `${telemetry.p_shaft_kw.toFixed(1)} kW`, color: 'text-emerald-400' },
            { label: 'Rope Tension Force (F)', value: `${telemetry.rope_force_kn.toFixed(2)} kN`, color: 'text-amber-400' },
            { label: 'Elevator Velocity (v)', value: `${telemetry.car_velocity_ms.toFixed(2)} m/s`, color: 'text-sky-400' },
            { label: 'Operating State', value: telemetry.mechanical_state_text, color: telemetry.mechanical_state_text === 'MOTORING' ? 'text-sky-400' : 'text-emerald-400' },
          ],
          specs: [
            { label: 'Motor Design', value: 'Permanent Magnet Synchronous Motor (Gearless)' },
            { label: 'Rated Elevator Speed', value: '2.01 m/s' },
            { label: 'Sheave Radius', value: '0.25 m (500 mm sheave)' },
            { label: 'Pole Pairs', value: '10 Pole Pairs (20 Poles)' },
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

      case 'bts7960_driver':
        return {
          title: 'BTS7960 — 43A HIGH-POWER H-BRIDGE MOTOR DRIVER',
          tag: 'BTS7960',
          standard: 'Infineon NovalithIC™ Dual Half-Bridge',
          category: 'Motor Controller Power Stage',
          measurements: [
            { label: 'Operating Mode', value: telemetry.power_flow === 'REGENERATING' ? 'REGENERATIVE BRAKING' : telemetry.power_flow === 'MOTORING' ? (telemetry.motor_direction === 'CW' ? 'FORWARD MOTORING' : 'REVERSE MOTORING') : 'IDLE / COAST', color: telemetry.power_flow === 'REGENERATING' ? 'text-emerald-400' : 'text-sky-400' },
            { label: 'PWM Duty Cycle (D)', value: `${Math.round(Math.min(100, (Math.abs(telemetry.motor_speed_rpm) / 950) * 100))}%`, color: 'text-amber-400' },
            { label: 'Output Voltage (M+ to M-)', value: `${(telemetry.vdc_bus * (Math.abs(telemetry.motor_speed_rpm) / 950)).toFixed(1)} V`, color: 'text-sky-400' },
            { label: 'Motor Current (I_motor)', value: `${telemetry.motor_current.toFixed(2)} A`, color: telemetry.power_flow === 'REGENERATING' ? 'text-emerald-400' : 'text-sky-400' },
            { label: 'MOSFET Rds(on)', value: '16 mΩ per switch', color: 'text-slate-400' },
            { label: 'Internal Temp', value: `${(32 + Math.abs(telemetry.motor_current) * 1.5).toFixed(1)} °C`, color: 'text-slate-300' },
          ],
          specs: [
            { label: 'Operating Voltage Range', value: '5.5 V to 27.0 V DC' },
            { label: 'Peak Current Limit', value: '43 A (Integrated Current Sense)' },
            { label: 'PWM Switching Frequency', value: 'Up to 25 kHz' },
            { label: 'Protection', value: 'Over-temp, Under-voltage, Active Freewheeling' },
          ],
        };

      case 'dc_motor':
        return {
          title: 'DC TRACTION MOTOR & INERTIAL FLYWHEEL',
          tag: 'DC MOTOR + FLYWHEEL',
          standard: 'IEC 60034 Rotating Electrical Machines',
          category: 'Electromechanical Dynamo / Load',
          measurements: [
            { label: 'Shaft Speed (n)', value: `${telemetry.motor_speed_rpm.toFixed(0)} RPM`, color: 'text-sky-400' },
            { label: 'Shaft Torque (τ)', value: `${telemetry.motor_torque_nm.toFixed(2)} Nm`, color: 'text-amber-400' },
            { label: 'Mechanical Power (P)', value: `${telemetry.motor_mech_power.toFixed(1)} W`, color: 'text-emerald-400' },
            { label: 'Direction of Rotation', value: telemetry.motor_direction === 'CW' ? 'CW (CLOCKWISE)' : telemetry.motor_direction === 'CCW' ? 'CCW (COUNTER-CW)' : 'STOPPED', color: 'text-sky-300' },
            { label: 'Back-EMF (E_b)', value: `${(telemetry.motor_speed_rpm * 0.012).toFixed(2)} V`, color: 'text-purple-400' },
            { label: 'Coupled Flywheel Inertia (J)', value: '0.045 kg·m² (Steel Disk)', color: 'text-slate-400' },
          ],
          specs: [
            { label: 'Nominal Voltage', value: '12.0 V DC (15.6V Overdrive)' },
            { label: 'Rated Speed', value: '950 RPM' },
            { label: 'Armature Resistance (Ra)', value: '0.35 Ω' },
            { label: 'Armature Inductance (La)', value: '1.2 mH' },
          ],
        };

      case 'arduino_controller':
        return {
          title: 'ARDUINO ATmega328P MICROCONTROLLER',
          tag: 'ARDUINO MCU',
          standard: 'Embedded 8-bit RISC Microcontroller',
          category: 'Control & PWM Signal Generation',
          measurements: [
            { label: 'Clock Speed', value: '16.0 MHz Crystal', color: 'text-sky-400' },
            { label: 'RPWM Pin (D5)', value: telemetry.motor_direction === 'CW' && telemetry.power_flow === 'MOTORING' ? 'ACTIVE PWM (490 Hz)' : '0 V (LOW)', color: 'text-amber-400' },
            { label: 'LPWM Pin (D6)', value: telemetry.motor_direction === 'CCW' && telemetry.power_flow === 'MOTORING' ? 'ACTIVE PWM (490 Hz)' : '0 V (LOW)', color: 'text-purple-400' },
            { label: 'Enable Pins (D9, D10)', value: telemetry.main_switch_closed ? 'HIGH (5.0 V ENABLED)' : 'LOW (DISABLED)', color: 'text-emerald-400' },
            { label: 'I2C Bus (A4 SDA / A5 SCL)', value: '100 kHz Live Telemetry Telecast', color: 'text-sky-300' },
            { label: 'R&D Ground Tie', value: 'COMMON TIED TO B- (SOLVED)', color: 'text-emerald-400 font-bold' },
          ],
          specs: [
            { label: 'Microcontroller Core', value: 'Microchip ATmega328P' },
            { label: 'Operating Voltage', value: '5.0 V Regulated' },
            { label: 'ADC Resolution', value: '10-bit (1024 steps)' },
            { label: 'Flash Memory', value: '32 KB' },
          ],
        };

      case 'lcd_display':
        return {
          title: 'I2C 16x2 CHARACTER LCD DISPLAY MODULE',
          tag: '16x2 LCD (PCF8574)',
          standard: 'HD44780 Controller with PCF8574 Backpack',
          category: 'Visual Human-Machine Interface',
          measurements: [
            { label: 'Quadrant Operation', value: telemetry.power_flow === 'REGENERATING' ? (telemetry.motor_direction === 'CCW' ? 'Q4: REV REGEN' : 'Q2: FWD REGEN') : telemetry.power_flow === 'MOTORING' ? (telemetry.motor_direction === 'CCW' ? 'Q3: REV MOTOR' : 'Q1: FWD MOTOR') : 'STANDBY / IDLE', color: telemetry.power_flow === 'REGENERATING' ? 'text-emerald-400' : 'text-sky-400' },
            { label: 'Displayed Duty Cycle', value: `${Math.round(Math.min(100, (Math.abs(telemetry.motor_speed_rpm) / 950) * 100))}%`, color: 'text-amber-400' },
            { label: 'DC Link Voltage', value: `${telemetry.vdc_bus.toFixed(1)} V`, color: 'text-sky-400' },
            { label: 'Supercap Voltage', value: `${telemetry.v_scap.toFixed(1)} V`, color: 'text-emerald-400' },
            { label: 'I2C Slave Address', value: '0x27 (7-bit standard)', color: 'text-slate-400' },
          ],
          specs: [
            { label: 'Display Format', value: '16 Characters x 2 Lines' },
            { label: 'Backlight Color', value: 'Transflective Blue / Cyan LED' },
            { label: 'Communication Protocol', value: 'I2C Fast Mode (SDA, SCL, VCC, GND)' },
            { label: 'Refresh Rate', value: '25 Hz Continuous Update' },
          ],
        };

      case 'reverse_led':
        return {
          title: 'LED (REVERSE STORED ENERGY) — REGEN INDICATOR',
          tag: 'REVERSE STORED ENERGY LED',
          standard: 'Optoelectronic Energy Scavenging Indicator',
          category: 'Status Indication & Energy Harvesting Path',
          measurements: [
            { label: 'State', value: telemetry.power_flow === 'REGENERATING' ? 'ILLUMINATED (REGENERATION ACTIVE)' : 'OFF (STANDBY)', color: telemetry.power_flow === 'REGENERATING' ? 'text-emerald-400 font-bold' : 'text-slate-400' },
            { label: 'Forward Current (If)', value: telemetry.power_flow === 'REGENERATING' ? '14.2 mA' : '0.0 mA', color: telemetry.power_flow === 'REGENERATING' ? 'text-emerald-400' : 'text-slate-400' },
            { label: 'Forward Voltage (Vf)', value: telemetry.power_flow === 'REGENERATING' ? '2.15 V (Green)' : '0.0 V', color: 'text-emerald-400' },
            { label: 'R&D Ballast Resistor', value: '1.0 kΩ 0.5W in series (PROTECTED)', color: 'text-emerald-400' },
            { label: 'Reverse Voltage Protection', value: 'Antiparallel Diode 1N4007 (INTEGRATED)', color: 'text-slate-300' },
          ],
          specs: [
            { label: 'Peak Wavelength', value: '525 nm (Pure Green)' },
            { label: 'Luminous Intensity', value: '12,000 mcd Ultra-Bright' },
            { label: 'Max Forward Current', value: '30 mA' },
          ],
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
