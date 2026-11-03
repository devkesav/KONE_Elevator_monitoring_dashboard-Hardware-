import React, { useState, useRef } from 'react';
import type { ElectricalTelemetry, ComponentId } from '../../types/electrical';
import { ACSourceSymbol } from './symbols/ACSourceSymbol';
import { TransformerSymbol } from './symbols/TransformerSymbol';
import { FuseSymbol } from './symbols/FuseSymbol';
import { SwitchSymbol } from './symbols/SwitchSymbol';
import { MeterSymbol } from './symbols/MeterSymbols';
import { BridgeRectifierSymbol } from './symbols/BridgeRectifierSymbol';
import { CapacitorSymbol } from './symbols/CapacitorSymbol';
import { ResistorSymbol } from './symbols/ResistorSymbol';
import { DCConverterSymbol } from './symbols/DCConverterSymbol';
import { SupercapacitorSymbol } from './symbols/SupercapacitorSymbol';
import { PMSMSymbol } from './symbols/PMSMSymbol';
import { GroundSymbol } from './symbols/GroundSymbol';
import { ElectricalWire } from './ElectricalWire';
import { ZoomIn, ZoomOut, Maximize2, RotateCcw, Crosshair } from 'lucide-react';

interface Props {
  telemetry: ElectricalTelemetry;
  selectedComponent: ComponentId | null;
  onSelectComponent: (id: ComponentId) => void;
  onToggleSwitch: (id: 'main' | 'dpst') => void;
}

export const ElectricalSchematic: React.FC<Props> = ({
  telemetry,
  selectedComponent,
  onSelectComponent,
  onToggleSwitch,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Pan and Zoom transform states
  const [zoom, setZoom] = useState<number>(0.82);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 25, y: 15 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  
  // Wire Probe Tooltip
  const [hoveredProbe, setHoveredProbe] = useState<{
    name: string;
    voltage: string;
    x: number;
    y: number;
  } | null>(null);

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    setZoom((prev) => Math.max(0.4, Math.min(2.5, prev * zoomFactor)));
  };

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName === 'svg' || (e.target as HTMLElement).id === 'schematic-bg') {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleFitScreen = () => {
    setZoom(0.78);
    setPan({ x: 20, y: 20 });
  };

  const handleResetZoom = () => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
  };

  const isMotoring = telemetry.power_flow === 'MOTORING';
  const isRegen = telemetry.power_flow === 'REGENERATING';
  const hasCurrentFlow = telemetry.iac_secondary > 0.05 || telemetry.idc_bus > 0.05 || Math.abs(telemetry.i_scap) > 0.05;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden schematic-workbench-grid cursor-grab active:cursor-grabbing select-none"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Workbench Canvas Toolbar (Top Right inside workspace) */}
      <div className="absolute top-4 right-4 z-20 flex items-center space-x-1.5 bg-slate-900/90 backdrop-blur border border-slate-700/80 rounded-md p-1 shadow-xl">
        <button
          onClick={() => setZoom((prev) => Math.min(2.5, prev + 0.15))}
          className="p-1.5 text-slate-300 hover:text-sky-400 hover:bg-slate-800 rounded transition"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <span className="text-[11px] font-mono text-slate-400 px-1 w-12 text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => setZoom((prev) => Math.max(0.4, prev - 0.15))}
          className="p-1.5 text-slate-300 hover:text-sky-400 hover:bg-slate-800 rounded transition"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <div className="w-[1px] h-4 bg-slate-700" />
        <button
          onClick={handleFitScreen}
          className="p-1.5 text-slate-300 hover:text-sky-400 hover:bg-slate-800 rounded transition"
          title="Fit to Screen"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        <button
          onClick={handleResetZoom}
          className="p-1.5 text-slate-300 hover:text-sky-400 hover:bg-slate-800 rounded transition"
          title="Reset View"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Floating Electrical Wire Probe Readout Tooltip */}
      {hoveredProbe && (
        <div
          className="absolute z-30 pointer-events-none bg-slate-950/95 border border-sky-500/80 rounded px-2.5 py-1 text-xs shadow-2xl backdrop-blur"
          style={{
            left: `${hoveredProbe.x * zoom + pan.x + 20}px`,
            top: `${hoveredProbe.y * zoom + pan.y - 35}px`,
          }}
        >
          <div className="flex items-center space-x-1.5">
            <Crosshair className="w-3.5 h-3.5 text-sky-400" />
            <span className="font-mono font-bold text-sky-300">{hoveredProbe.name}</span>
          </div>
          <div className="font-mono text-[11px] text-slate-300">
            Node Potential: <span className="text-amber-400 font-semibold">{hoveredProbe.voltage}</span>
          </div>
        </div>
      )}

      {/* Main SVG Schematic Canvas */}
      <svg
        id="schematic-bg"
        className="w-full h-full"
        style={{
          transformOrigin: '0 0',
        }}
      >
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* Schematic Title & Standard Header */}
          <g transform="translate(40, 45)">
            <text fill="#38bdf8" fontSize="15" fontWeight="bold" fontFamily="monospace">
              KONE ECO-DRIVE SIMULATION BENCH — SCHEMATIC DIAGRAM
            </text>
            <text fill="#64748b" fontSize="10" fontFamily="monospace" y="18">
              IEC 60617 / IEEE 315 STANDARD SYMBOLOGY • REGENERATIVE PMSM POWER TOPOLOGY
            </text>
          </g>

          {/* ============================================================== */}
          {/* 1. AC MAINS & TRANSFORMER WIRING                               */}
          {/* ============================================================== */}

          {/* AC Grid Line L (at y = 230) to T1 Primary Upper Lead */}
          <ElectricalWire
            points={[
              { x: 118, y: 260 },
              { x: 150, y: 260 },
              { x: 150, y: 230 },
              { x: 198, y: 230 },
            ]}
            signalType="AC"
            isFlowing={hasCurrentFlow && telemetry.main_switch_closed && !telemetry.fuse_blown}
            nodeName="NODE_VAC_LINE"
            voltageText={`${telemetry.vac_primary.toFixed(1)} VAC`}
            onHover={setHoveredProbe}
          />

          {/* AC Grid Neutral N (at y = 290) to T1 Primary Lower Lead & Earth Ground */}
          <ElectricalWire
            points={[
              { x: 42, y: 260 },
              { x: 20, y: 260 },
              { x: 20, y: 290 },
              { x: 198, y: 290 },
            ]}
            signalType="AC"
            isFlowing={hasCurrentFlow && telemetry.main_switch_closed && !telemetry.fuse_blown}
            nodeName="NODE_VAC_NEUTRAL"
            voltageText="0.0 VAC (REF)"
            intermediateJunctions={[{ x: 20, y: 290 }]}
            onHover={setHoveredProbe}
          />
          <GroundSymbol x={20} y={310} type="EARTH" tag="GND_GRID" />

          {/* Transformer Secondary Upper Line (at y = 210) to Fuse F1 */}
          <ElectricalWire
            points={[
              { x: 282, y: 230 },
              { x: 310, y: 230 },
              { x: 310, y: 210 },
              { x: 335, y: 210 },
            ]}
            signalType="AC"
            isFlowing={hasCurrentFlow && telemetry.main_switch_closed && !telemetry.fuse_blown}
            nodeName="NODE_SEC_RAW"
            voltageText={`${telemetry.vac_secondary.toFixed(1)} VAC`}
            onHover={setHoveredProbe}
          />

          {/* Fuse F1 to Main AC Switch SW1 */}
          <ElectricalWire
            points={[
              { x: 385, y: 210 },
              { x: 422, y: 210 },
            ]}
            signalType="AC"
            isFlowing={hasCurrentFlow && telemetry.main_switch_closed && !telemetry.fuse_blown}
            isFault={telemetry.fuse_blown}
            onHover={setHoveredProbe}
          />

          {/* Main Switch SW1 to AC Ammeter A1 */}
          <ElectricalWire
            points={[
              { x: 478, y: 210 },
              { x: 512, y: 210 },
            ]}
            signalType="AC"
            isFlowing={hasCurrentFlow && telemetry.main_switch_closed && !telemetry.fuse_blown}
            onHover={setHoveredProbe}
          />

          {/* AC Ammeter A1 to Voltmeter tap & Rectifier AC1 Input */}
          <ElectricalWire
            points={[
              { x: 568, y: 210 },
              { x: 640, y: 210 },
              { x: 700, y: 210 },
              { x: 700, y: 246 },
              { x: 722, y: 246 },
            ]}
            signalType="AC"
            isFlowing={hasCurrentFlow && telemetry.main_switch_closed && !telemetry.fuse_blown}
            nodeName="NODE_RECT_AC1"
            voltageText={`${telemetry.vac_secondary.toFixed(1)} VAC`}
            intermediateJunctions={[{ x: 640, y: 210 }]}
            onHover={setHoveredProbe}
          />

          {/* Transformer Secondary Lower Line (at y = 290) to Voltmeter tap & Rectifier AC2 Input */}
          <ElectricalWire
            points={[
              { x: 282, y: 290 },
              { x: 310, y: 290 },
              { x: 310, y: 310 },
              { x: 640, y: 310 },
              { x: 700, y: 310 },
              { x: 700, y: 274 },
              { x: 722, y: 274 },
            ]}
            signalType="AC"
            isFlowing={hasCurrentFlow && telemetry.main_switch_closed && !telemetry.fuse_blown}
            nodeName="NODE_RECT_AC2"
            voltageText="0.0 VAC (SEC_REF)"
            intermediateJunctions={[{ x: 640, y: 310 }]}
            onHover={setHoveredProbe}
          />

          {/* AC Voltmeter vertical leads across secondary rails */}
          <ElectricalWire
            points={[
              { x: 640, y: 210 },
              { x: 640, y: 228 },
            ]}
            signalType="AC"
          />
          <ElectricalWire
            points={[
              { x: 640, y: 292 },
              { x: 640, y: 310 },
            ]}
            signalType="AC"
          />

          {/* ============================================================== */}
          {/* 2. DC BUS RAILS & FILTERING                                    */}
          {/* ============================================================== */}

          {/* Rectifier DC+ Output (at x = 858, y = 222) to Upper DC+ Rail at y = 140 */}
          <ElectricalWire
            points={[
              { x: 858, y: 222 },
              { x: 890, y: 222 },
              { x: 890, y: 140 },
              { x: 1200, y: 140 },
            ]}
            signalType="DC_POS"
            isFlowing={hasCurrentFlow}
            flowDirection={isRegen ? 'REVERSE' : 'FORWARD'}
            isRegen={isRegen}
            nodeName="NODE_VDC_BUS_POS"
            voltageText={`${telemetry.vdc_bus.toFixed(1)} VDC (+)`}
            intermediateJunctions={[
              { x: 940, y: 140 },  // C_DC tap
              { x: 1070, y: 140 }, // V2 (DC) tap
              { x: 1150, y: 140 }, // CONV1 B+ tap
            ]}
            onHover={setHoveredProbe}
          />

          {/* Rectifier DC- Output (at x = 858, y = 298) to Lower DC- Rail at y = 380 */}
          <ElectricalWire
            points={[
              { x: 858, y: 298 },
              { x: 890, y: 298 },
              { x: 890, y: 380 },
              { x: 1200, y: 380 },
            ]}
            signalType="DC_NEG"
            isFlowing={hasCurrentFlow}
            flowDirection={isRegen ? 'REVERSE' : 'FORWARD'}
            isRegen={isRegen}
            nodeName="NODE_VDC_BUS_NEG"
            voltageText="0.0 VDC (BUS_NEG)"
            intermediateJunctions={[
              { x: 940, y: 380 },  // C_DC tap
              { x: 1070, y: 380 }, // V2 (DC) tap
              { x: 1105, y: 380 }, // CONV1 B- tap
            ]}
            onHover={setHoveredProbe}
          />
          <GroundSymbol x={890} y={402} type="CHASSIS" tag="GND_CHASSIS" />

          {/* DC Capacitor Branch (Vertical from DC+ at 140 to DC- at 380) */}
          <ElectricalWire
            points={[
              { x: 940, y: 140 },
              { x: 940, y: 228 },
            ]}
            signalType="DC_POS"
            onHover={setHoveredProbe}
          />
          <ElectricalWire
            points={[
              { x: 940, y: 292 },
              { x: 940, y: 380 },
            ]}
            signalType="DC_NEG"
            onHover={setHoveredProbe}
          />

          {/* DC Voltmeter Branch (Vertical at x = 1070) */}
          <ElectricalWire
            points={[
              { x: 1070, y: 140 },
              { x: 1070, y: 228 },
            ]}
            signalType="DC_POS"
            onHover={setHoveredProbe}
          />
          <ElectricalWire
            points={[
              { x: 1070, y: 292 },
              { x: 1070, y: 380 },
            ]}
            signalType="DC_NEG"
            onHover={setHoveredProbe}
          />

          {/* Taps from DC Bus to Bidirectional DC-DC Converter B+ and B- (Clean, non-overlapping) */}
          <ElectricalWire
            points={[
              { x: 1150, y: 140 },
              { x: 1150, y: 495 },
              { x: 1075, y: 495 },
            ]}
            signalType="DC_POS"
            isFlowing={telemetry.dcdc_mode !== 'STANDBY'}
            flowDirection={telemetry.dcdc_mode === 'BOOST' ? 'REVERSE' : 'FORWARD'}
            isRegen={telemetry.dcdc_mode === 'BUCK'}
            nodeName="NODE_DCDC_B_POS"
            voltageText={`${telemetry.vdc_bus.toFixed(1)} VDC`}
            intermediateJunctions={[{ x: 1150, y: 140 }]}
            onHover={setHoveredProbe}
          />
          <ElectricalWire
            points={[
              { x: 1105, y: 380 },
              { x: 1105, y: 545 },
              { x: 1075, y: 545 },
            ]}
            signalType="DC_NEG"
            isFlowing={telemetry.dcdc_mode !== 'STANDBY'}
            nodeName="NODE_DCDC_B_NEG"
            voltageText="0.0 VDC"
            intermediateJunctions={[{ x: 1105, y: 380 }]}
            onHover={setHoveredProbe}
          />

          {/* ============================================================== */}
          {/* 3. SUPERCAPACITOR BRANCH & BRAKING HEAT DISSIPATION RESISTOR   */}
          {/* ============================================================== */}

          {/* DC-DC Converter SC+ to DPST Switch Pole 1 (at y = 610) */}
          <ElectricalWire
            points={[
              { x: 925, y: 495 },
              { x: 868, y: 495 },
              { x: 868, y: 610 },
            ]}
            signalType="DC_POS"
            isFlowing={(Math.abs(telemetry.i_scap) > 0.1 || telemetry.brake_resistor_active) && telemetry.dpst_switch_closed}
            flowDirection={telemetry.i_scap < 0 ? 'REVERSE' : 'FORWARD'}
            isRegen={telemetry.i_scap > 0 || telemetry.brake_resistor_active}
            nodeName="NODE_SCAP_SW_POS"
            voltageText={`${telemetry.v_scap.toFixed(1)} VDC`}
            onHover={setHoveredProbe}
          />

          {/* DC-DC Converter SC- to DPST Switch Pole 2 (at y = 780) */}
          <ElectricalWire
            points={[
              { x: 925, y: 545 },
              { x: 895, y: 545 },
              { x: 895, y: 780 },
              { x: 868, y: 780 },
            ]}
            signalType="DC_NEG"
            isFlowing={(Math.abs(telemetry.i_scap) > 0.1 || telemetry.brake_resistor_active) && telemetry.dpst_switch_closed}
            nodeName="NODE_SCAP_SW_NEG"
            voltageText="0.0 VDC"
            onHover={setHoveredProbe}
          />

          {/* DPST Switch Pole 1 to Ammeter A_SC */}
          <ElectricalWire
            points={[
              { x: 812, y: 610 },
              { x: 758, y: 610 },
            ]}
            signalType="DC_POS"
            isFlowing={(Math.abs(telemetry.i_scap) > 0.1 || telemetry.brake_resistor_active) && telemetry.dpst_switch_closed}
            flowDirection={telemetry.i_scap < 0 ? 'REVERSE' : 'FORWARD'}
            isRegen={telemetry.i_scap > 0 || telemetry.brake_resistor_active}
            onHover={setHoveredProbe}
          />

          {/* Ammeter A_SC to Braking Dump Resistor Junction at (600, 610) */}
          <ElectricalWire
            points={[
              { x: 702, y: 610 },
              { x: 600, y: 610 },
            ]}
            signalType="DC_POS"
            isFlowing={(Math.abs(telemetry.i_scap) > 0.1 || telemetry.brake_chopper_closed) && telemetry.dpst_switch_closed}
            flowDirection={telemetry.i_scap < 0 ? 'REVERSE' : 'FORWARD'}
            isRegen={telemetry.i_scap > 0 || telemetry.brake_chopper_closed}
            intermediateJunctions={[{ x: 600, y: 610 }]}
            onHover={setHoveredProbe}
          />

          {/* Dynamic Braking Resistor Branch: Drops from (600, 610) down through R_DUMP & Chopper */}
          <ElectricalWire
            points={[
              { x: 600, y: 610 },
              { x: 600, y: 640 },
            ]}
            signalType="DC_POS"
            isFlowing={telemetry.brake_chopper_closed}
            flowDirection="FORWARD"
            isRegen={true}
            nodeName="NODE_BRAKE_TOP"
            voltageText={`${telemetry.vdc_bus.toFixed(1)} VDC`}
            onHover={setHoveredProbe}
          />
          <ElectricalWire
            points={[
              { x: 600, y: 700 },
              { x: 600, y: 714 },
            ]}
            signalType="DC_POS"
            isFlowing={telemetry.brake_chopper_closed}
            onHover={setHoveredProbe}
          />
          <ElectricalWire
            points={[
              { x: 600, y: 766 },
              { x: 600, y: 780 },
            ]}
            signalType="DC_NEG"
            isFlowing={telemetry.brake_chopper_closed}
            intermediateJunctions={[{ x: 600, y: 780 }]}
            onHover={setHoveredProbe}
          />

          {/* Positive Line from (600, 610) to Supercapacitor Bank Tap (420, 610) */}
          {/* Note: When supercapacitor is 100% full or resistor is active, current into supercap ceases */}
          <ElectricalWire
            points={[
              { x: 600, y: 610 },
              { x: 420, y: 610 },
              { x: 420, y: 662 },
            ]}
            signalType="DC_POS"
            isFlowing={!telemetry.brake_chopper_closed && !telemetry.brake_resistor_active && telemetry.soc_scap < 99.5 && Math.abs(telemetry.i_scap) > 0.1 && telemetry.dpst_switch_closed}
            flowDirection={telemetry.i_scap < 0 ? 'REVERSE' : 'FORWARD'}
            isRegen={telemetry.i_scap > 0}
            nodeName="NODE_SCAP_BANK_POS"
            voltageText={`${telemetry.v_scap.toFixed(2)} VDC`}
            intermediateJunctions={[{ x: 420, y: 610 }]}
            onHover={setHoveredProbe}
          />

          {/* Negative Return Line from DPST Pole 2 across all lower components */}
          <ElectricalWire
            points={[
              { x: 812, y: 780 },
              { x: 600, y: 780 },
              { x: 420, y: 780 },
              { x: 280, y: 780 },
            ]}
            signalType="DC_NEG"
            isFlowing={((!telemetry.brake_chopper_closed && Math.abs(telemetry.i_scap) > 0.1) || telemetry.brake_chopper_closed) && telemetry.dpst_switch_closed}
            nodeName="NODE_SCAP_BANK_NEG"
            voltageText="0.0 VDC"
            intermediateJunctions={[
              { x: 600, y: 780 },
              { x: 420, y: 780 },
              { x: 280, y: 780 },
            ]}
            onHover={setHoveredProbe}
          />

          {/* Supercapacitor Bottom Terminal Lead dropping straight to Negative Bus */}
          <ElectricalWire
            points={[
              { x: 420, y: 738 },
              { x: 420, y: 780 },
            ]}
            signalType="DC_NEG"
            isFlowing={!telemetry.brake_chopper_closed && !telemetry.brake_resistor_active && telemetry.soc_scap < 99.5 && Math.abs(telemetry.i_scap) > 0.1 && telemetry.dpst_switch_closed}
            onHover={setHoveredProbe}
          />

          {/* Supercapacitor Voltmeter connections (at x = 280) */}
          <ElectricalWire
            points={[
              { x: 420, y: 610 },
              { x: 280, y: 610 },
              { x: 280, y: 668 },
            ]}
            signalType="DC_POS"
            intermediateJunctions={[{ x: 280, y: 610 }]}
          />
          <ElectricalWire
            points={[
              { x: 280, y: 732 },
              { x: 280, y: 780 },
            ]}
            signalType="DC_NEG"
          />

          {/* ============================================================== */}
          {/* 4. MOTOR DRIVE INVERTER & PMSM MOTOR CONNECTIONS               */}
          {/* ============================================================== */}

          {/* DC+ Rail into Drive Inverter B+ */}
          <ElectricalWire
            points={[
              { x: 1200, y: 140 },
              { x: 1230, y: 140 },
              { x: 1230, y: 235 },
            ]}
            signalType="DC_POS"
            isFlowing={hasCurrentFlow}
            flowDirection={isRegen ? 'REVERSE' : 'FORWARD'}
            isRegen={isRegen}
            nodeName="NODE_DRIVE_DC_POS"
            voltageText={`${telemetry.vdc_bus.toFixed(1)} VDC`}
            onHover={setHoveredProbe}
          />

          {/* DC- Rail into Drive Inverter B- */}
          <ElectricalWire
            points={[
              { x: 1200, y: 380 },
              { x: 1230, y: 380 },
              { x: 1230, y: 285 },
            ]}
            signalType="DC_NEG"
            isFlowing={hasCurrentFlow}
            nodeName="NODE_DRIVE_DC_NEG"
            voltageText="0.0 VDC"
            onHover={setHoveredProbe}
          />

          {/* Drive Inverter M+ to PMSM M+ */}
          <ElectricalWire
            points={[
              { x: 1310, y: 246 },
              { x: 1348, y: 246 },
            ]}
            signalType="DC_POS"
            isFlowing={telemetry.motor_speed_rpm > 10}
            flowDirection={isRegen ? 'REVERSE' : 'FORWARD'}
            isRegen={isRegen}
            nodeName="NODE_MOTOR_M_POS"
            voltageText={`${(telemetry.motor_current * 1.8).toFixed(1)} V`}
            onHover={setHoveredProbe}
          />

          {/* Drive Inverter M- to PMSM M- */}
          <ElectricalWire
            points={[
              { x: 1310, y: 274 },
              { x: 1348, y: 274 },
            ]}
            signalType="DC_NEG"
            isFlowing={telemetry.motor_speed_rpm > 10}
            flowDirection={isRegen ? 'REVERSE' : 'FORWARD'}
            isRegen={isRegen}
            nodeName="NODE_MOTOR_M_NEG"
            voltageText="0.0 V"
            onHover={setHoveredProbe}
          />

          {/* ============================================================== */}
          {/* 5. ELECTRICAL COMPONENTS & IEC SYMBOLS                         */}
          {/* ============================================================== */}

          {/* AC Grid Source */}
          <ACSourceSymbol
            x={80}
            y={260}
            voltage={telemetry.vac_primary}
            frequency={telemetry.freq_ac}
            current={telemetry.iac_primary}
            selected={selectedComponent === 'ac_source'}
            onClick={() => onSelectComponent('ac_source')}
          />

          {/* Step-down Transformer T1 */}
          <TransformerSymbol
            x={240}
            y={260}
            vPrimary={telemetry.vac_primary}
            vSecondary={telemetry.vac_secondary}
            iSecondary={telemetry.iac_secondary}
            efficiency={telemetry.transformer_eff}
            selected={selectedComponent === 'transformer'}
            onClick={() => onSelectComponent('transformer')}
          />

          {/* Secondary Fuse F1 */}
          <FuseSymbol
            x={360}
            y={210}
            blown={telemetry.fuse_blown}
            selected={selectedComponent === 'fuse_ac'}
            onClick={() => onSelectComponent('fuse_ac')}
          />

          {/* Main Circuit Breaker / Switch SW1 */}
          <SwitchSymbol
            x={450}
            y={210}
            closed={telemetry.main_switch_closed}
            tag="SW1"
            selected={selectedComponent === 'switch_ac'}
            onClick={() => onToggleSwitch('main')}
          />

          {/* AC Ammeter A1 */}
          <MeterSymbol
            x={540}
            y={210}
            type="AMP"
            isAc={true}
            value={telemetry.iac_secondary}
            unit="A"
            tag="A1 (AC)"
            orientation="horizontal"
            badgePosition="bottom"
            selected={selectedComponent === 'ammeter_ac'}
            onClick={() => onSelectComponent('ammeter_ac')}
          />

          {/* AC Voltmeter V1 */}
          <MeterSymbol
            x={640}
            y={260}
            type="VOLT"
            isAc={true}
            value={telemetry.vac_secondary}
            unit="V"
            tag="V1 (AC)"
            orientation="vertical"
            badgePosition="right"
            selected={selectedComponent === 'voltmeter_ac'}
            onClick={() => onSelectComponent('voltmeter_ac')}
          />

          {/* Full Wave Diode Bridge Rectifier BR1 */}
          <BridgeRectifierSymbol
            x={790}
            y={260}
            vacIn={telemetry.vac_secondary}
            vdcOut={telemetry.v_rect_out}
            idcOut={telemetry.i_rect_out}
            diodeStatus={telemetry.diode_status}
            selected={selectedComponent === 'bridge_rectifier'}
            onClick={() => onSelectComponent('bridge_rectifier')}
          />

          {/* DC Link Smoothing Capacitor C_DC */}
          <CapacitorSymbol
            x={940}
            y={260}
            voltage={telemetry.vdc_bus}
            capacitanceUf={15000}
            rippleMv={telemetry.vdc_ripple}
            storedJoules={telemetry.cap_stored_energy}
            isPolarized={true}
            tag="C_DC"
            orientation="vertical"
            selected={selectedComponent === 'dc_link_cap'}
            onClick={() => onSelectComponent('dc_link_cap')}
          />

          {/* DC Voltmeter V2 */}
          <MeterSymbol
            x={1070}
            y={260}
            type="VOLT"
            isAc={false}
            value={telemetry.vdc_bus}
            unit="V"
            tag="V2 (DC)"
            orientation="vertical"
            badgePosition="right"
            selected={selectedComponent === 'voltmeter_dc'}
            onClick={() => onSelectComponent('voltmeter_dc')}
          />

          {/* Bidirectional DC-DC Converter */}
          <DCConverterSymbol
            x={1000}
            y={520}
            mode={telemetry.dcdc_mode}
            dutyCycle={telemetry.dcdc_duty_cycle}
            current={telemetry.dcdc_current}
            temp={telemetry.dcdc_temp}
            selected={selectedComponent === 'dcdc_converter'}
            onClick={() => onSelectComponent('dcdc_converter')}
          />

          {/* Ganged DPST Contactor for Supercapacitor Isolation */}
          <SwitchSymbol
            x={840}
            y={610}
            closed={telemetry.dpst_switch_closed}
            tag="SW_DPST (P1)"
            selected={selectedComponent === 'dpst_switch'}
            onClick={() => onToggleSwitch('dpst')}
          />
          <SwitchSymbol
            x={840}
            y={780}
            closed={telemetry.dpst_switch_closed}
            tag="SW_DPST (P2)"
            selected={selectedComponent === 'dpst_switch'}
            onClick={() => onToggleSwitch('dpst')}
          />
          {/* Mechanical Ganging Tie Bar */}
          <line
            x1="840"
            y1="610"
            x2="840"
            y2="780"
            stroke="#94a3b8"
            strokeWidth="1.5"
            strokeDasharray="4 3"
          />
          <text x="846" y="695" fill="#64748b" fontSize="7.5" fontFamily="monospace">
            GANGED TIE
          </text>

          {/* Supercapacitor Ammeter A_SC */}
          <MeterSymbol
            x={730}
            y={610}
            type="AMP"
            isAc={false}
            value={telemetry.brake_chopper_closed ? telemetry.brake_resistor_current : telemetry.i_scap}
            unit="A"
            tag="A_SC"
            orientation="horizontal"
            badgePosition="bottom"
            selected={selectedComponent === 'ammeter_scap'}
            onClick={() => onSelectComponent('ammeter_scap')}
          />

          {/* Dynamic Braking / Overflow Heat Dissipation Resistor */}
          <ResistorSymbol
            x={600}
            y={670}
            resistanceOhm={5}
            tag="R_DUMP (BRAKE)"
            orientation="vertical"
            isDissipatingHeat={telemetry.brake_chopper_closed}
            dissipatedPowerW={telemetry.brake_resistor_power_w}
            temperatureC={telemetry.brake_resistor_temp}
            selected={selectedComponent === 'brake_resistor'}
            onClick={() => onSelectComponent('brake_resistor')}
          />

          {/* Electronic Chopper Switch for Braking Resistor */}
          <SwitchSymbol
            x={600}
            y={740}
            closed={telemetry.brake_chopper_closed}
            tag="Q_CHOP"
            orientation="vertical"
          />

          {/* Supercapacitor Bank */}
          <SupercapacitorSymbol
            x={420}
            y={700}
            voltage={telemetry.v_scap}
            vOcv={telemetry.v_scap_ocv}
            irDrop={telemetry.scap_ir_drop_v}
            powerW={telemetry.scap_power_w}
            current={telemetry.i_scap}
            soc={telemetry.soc_scap}
            storedJoules={telemetry.stored_energy_scap}
            storedWh={telemetry.scap_stored_wh}
            cellVoltages={telemetry.scap_cell_voltages}
            status={telemetry.scap_status}
            selected={selectedComponent === 'supercapacitor'}
            onClick={() => onSelectComponent('supercapacitor')}
          />

          {/* Supercapacitor Voltmeter V_SC */}
          <MeterSymbol
            x={280}
            y={700}
            type="VOLT"
            isAc={false}
            value={telemetry.v_scap}
            unit="V"
            tag="V_SC"
            orientation="vertical"
            badgePosition="left"
            selected={selectedComponent === 'voltmeter_scap'}
            onClick={() => onSelectComponent('voltmeter_scap')}
          />

          {/* Motor Inverter Drive Block */}
          <g
            transform="translate(1270, 260)"
            className="cursor-pointer group"
            onClick={() => onSelectComponent('motor_drive')}
          >
            {selectedComponent === 'motor_drive' && (
              <rect
                x="-46"
                y="-65"
                width="92"
                height="130"
                rx="6"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2"
                strokeDasharray="4 2"
                className="animate-pulse"
              />
            )}
            <rect
              x="-40"
              y="-60"
              width="80"
              height="120"
              rx="4"
              fill="#090d16"
              stroke="#334155"
              strokeWidth="1.8"
            />
            <text
              x="0"
              y="-66"
              textAnchor="middle"
              fill="#94a3b8"
              fontSize="9"
              fontWeight="bold"
              fontFamily="monospace"
            >
              DRV1 (INVERTER)
            </text>
            
            {/* Terminal labels */}
            <text x="-32" y="-20" fill="#ef4444" fontSize="8" fontWeight="bold" fontFamily="monospace">B+</text>
            <text x="-32" y="30" fill="#60a5fa" fontSize="8" fontWeight="bold" fontFamily="monospace">B-</text>
            <text x="20" y="-10" fill="#ef4444" fontSize="8" fontWeight="bold" fontFamily="monospace">M+</text>
            <text x="20" y="18" fill="#60a5fa" fontSize="8" fontWeight="bold" fontFamily="monospace">M-</text>

            {/* Inverter 3-phase PWM Bridge graphic inside */}
            <path
              d="M -15,-15 L 15,15 M -15,15 L 15,-15"
              stroke="#475569"
              strokeWidth="1.5"
            />
            <text
              x="0"
              y="48"
              textAnchor="middle"
              fill={isRegen ? '#10b981' : isMotoring ? '#38bdf8' : '#94a3b8'}
              fontSize="8"
              fontWeight="bold"
              fontFamily="monospace"
            >
              {telemetry.power_flow}
            </text>
          </g>

          {/* PMSM Motor */}
          <PMSMSymbol
            x={1390}
            y={260}
            speedRpm={telemetry.motor_speed_rpm}
            torqueNm={telemetry.motor_torque_nm}
            mechPowerW={telemetry.motor_mech_power}
            direction={telemetry.motor_direction}
            temp={telemetry.motor_temp}
            powerFlow={telemetry.power_flow}
            selected={selectedComponent === 'pmsm_motor'}
            onClick={() => onSelectComponent('pmsm_motor')}
          />

          {/* Hoisting Sheave & Elevator Connection Indication */}
          <g transform="translate(1480, 260)">
            <circle cx="20" cy="0" r="18" fill="none" stroke="#64748b" strokeWidth="2.5" strokeDasharray="4 2" />
            <circle cx="20" cy="0" r="4" fill="#94a3b8" />
            <line x1="20" y1="-18" x2="20" y2="-50" stroke="#94a3b8" strokeWidth="2" />
            <text x="20" y="-55" textAnchor="middle" fill="#64748b" fontSize="8" fontFamily="monospace">
              ROPE TO CAR
            </text>
          </g>
        </g>
      </svg>
    </div>
  );
};
