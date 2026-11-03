import React, { useState, useRef, useEffect } from 'react';
import type { ElectricalTelemetry, ComponentId } from '../../types/electrical';
import { ACSourceSymbol } from './symbols/ACSourceSymbol';
import { TransformerSymbol } from './symbols/TransformerSymbol';
import { FuseSymbol } from './symbols/FuseSymbol';
import { SwitchSymbol } from './symbols/SwitchSymbol';
import { MeterSymbol } from './symbols/MeterSymbols';
import { BridgeRectifierSymbol } from './symbols/BridgeRectifierSymbol';
import { CapacitorSymbol } from './symbols/CapacitorSymbol';
import { ResistorSymbol } from './symbols/ResistorSymbol';
import { BTS7960Symbol } from './symbols/BTS7960Symbol';
import { DCMotorFlywheelSymbol } from './symbols/DCMotorFlywheelSymbol';
import { ArduinoSymbol } from './symbols/ArduinoSymbol';
import { LCDDisplaySymbol } from './symbols/LCDDisplaySymbol';
import { ReverseLedSymbol } from './symbols/ReverseLedSymbol';
import { SupercapacitorSymbol } from './symbols/SupercapacitorSymbol';
import { GroundSymbol } from './symbols/GroundSymbol';
import { SPDTSwitchSymbol } from './symbols/SPDTSwitchSymbol';
import { DiodeSymbol } from './symbols/DiodeSymbol';
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
  
  // Pan and Zoom transform states (Default well-framed for 1920x1080)
  const [zoom, setZoom] = useState<number>(0.74);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 35, y: 20 });
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
    setZoom((prev) => Math.max(0.35, Math.min(2.5, prev * zoomFactor)));
  };

  const handleFitScreen = () => {
    setZoom(0.72);
    setPan({ x: 35, y: 25 });
  };

  const handleResetZoom = () => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
  };

  // 'Space' hotkey for Fit to Screen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') return;
      if (e.code === 'Space') {
        e.preventDefault();
        handleFitScreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, input, select, textarea, a')) {
      return;
    }
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  // Window-level mouse listeners for buttery smooth dragging
  useEffect(() => {
    if (!isDragging) return;

    const onMouseMove = (e: MouseEvent) => {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    };

    const onMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isDragging, dragStart]);

  // Operational States
  const isMotoring = telemetry.power_flow === 'MOTORING';
  const isRegen = telemetry.power_flow === 'REGENERATING';
  const isGridConduction = telemetry.main_switch_closed && !telemetry.fuse_blown && (telemetry.i_rect_out > 0.05 || telemetry.iac_secondary > 0.05);
  const isDcLinkActive = isMotoring || isRegen || telemetry.brake_chopper_closed;
  const isMotorRunning = Math.abs(telemetry.motor_speed_rpm) > 5;
  const btsMode = isRegen ? 'REGEN' : (isMotoring ? (telemetry.motor_direction === 'CW' ? 'FORWARD' : 'REVERSE') : 'STANDBY');
  const dutyCycleVal = Math.round(Math.min(100, (Math.abs(telemetry.motor_speed_rpm) / 950) * 100));

  // Determine 4-Quadrant Status
  let quadrantTitle = 'STANDBY / IDLE';
  let quadrantColor = '#64748b';
  if (isRegen) {
    if (telemetry.motor_direction === 'CCW') {
      quadrantTitle = 'QUADRANT IV: REVERSE REGEN BRAKING';
      quadrantColor = '#10b981';
    } else {
      quadrantTitle = 'QUADRANT II: FORWARD REGEN BRAKING';
      quadrantColor = '#10b981';
    }
  } else if (isMotoring) {
    if (telemetry.motor_direction === 'CCW') {
      quadrantTitle = 'QUADRANT III: REVERSE MOTORING';
      quadrantColor = '#a855f7';
    } else {
      quadrantTitle = 'QUADRANT I: FORWARD MOTORING';
      quadrantColor = '#38bdf8';
    }
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden schematic-workbench-grid cursor-grab active:cursor-grabbing select-none"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
    >
      {/* Top Right Workbench Toolbar */}
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
          onClick={() => setZoom((prev) => Math.max(0.35, prev - 0.15))}
          className="p-1.5 text-slate-300 hover:text-sky-400 hover:bg-slate-800 rounded transition"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <div className="w-[1px] h-4 bg-slate-700" />
        <button
          onClick={handleFitScreen}
          className="p-1.5 text-slate-300 hover:text-sky-400 hover:bg-slate-800 rounded transition"
          title="Fit to Screen (Space)"
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

      {/* Floating Wire Probe Readout Tooltip */}
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
        style={{ transformOrigin: '0 0' }}
      >
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* ============================================================== */}
          {/* HEADER & 4-QUADRANT STATUS BADGE                                */}
          {/* ============================================================== */}
          <g transform="translate(50, 45)">
            <text fill="#38bdf8" fontSize="16" fontWeight="bold" fontFamily="monospace">
              4-QUADRANT REGENERATIVE TEST BENCH — SCHEMATIC DIAGRAM
            </text>
            <text fill="#64748b" fontSize="10.5" fontFamily="monospace" y="20">
              IEC 60617 SYMBOLOGY • 230V/12V AC STEP-DOWN • BTS7960 43A H-BRIDGE • 16x2 LCD
            </text>

            {/* Live 4-Quadrant Status Pill */}
            <g transform="translate(0, 30)">
              <rect x="0" y="0" width="320" height="24" rx="4" fill="#0f172a" stroke={quadrantColor} strokeWidth="1.2" />
              <circle cx="14" cy="12" r="4.5" fill={quadrantColor} className={isMotorRunning ? 'animate-pulse' : ''} />
              <text x="28" y="16.5" fill={quadrantColor} fontSize="9.5" fontWeight="bold" fontFamily="monospace">
                {quadrantTitle}
              </text>
            </g>
          </g>

          {/* ============================================================== */}
          {/* 1. AC MAINS & STEP-DOWN TRANSFORMER WIRING                     */}
          {/* ============================================================== */}

          {/* AC Line (230V AC) to Transformer Primary Upper Lead */}
          <ElectricalWire
            points={[
              { x: 128, y: 170 },
              { x: 165, y: 170 },
              { x: 165, y: 140 },
              { x: 208, y: 140 },
            ]}
            signalType="AC"
            isFlowing={isGridConduction}
            nodeName="NODE_230V_LINE"
            voltageText={`${telemetry.vac_primary.toFixed(1)} VAC (50Hz)`}
            onHover={setHoveredProbe}
          />

          {/* AC Neutral to Transformer Primary Lower Lead & Earth Ground */}
          <ElectricalWire
            points={[
              { x: 52, y: 170 },
              { x: 25, y: 170 },
              { x: 25, y: 200 },
              { x: 208, y: 200 },
            ]}
            signalType="AC"
            isFlowing={isGridConduction}
            nodeName="NODE_230V_NEUTRAL"
            voltageText="0.0 VAC (REF)"
            intermediateJunctions={[{ x: 25, y: 200 }]}
            onHover={setHoveredProbe}
          />
          <GroundSymbol x={25} y={222} type="EARTH" tag="GND_AC" />

          {/* Transformer Secondary Upper Lead (12V AC) to Fuse F1 */}
          <ElectricalWire
            points={[
              { x: 292, y: 140 },
              { x: 330, y: 140 },
              { x: 330, y: 120 },
              { x: 345, y: 120 },
            ]}
            signalType="AC"
            isFlowing={isGridConduction}
            nodeName="NODE_12V_SEC_RAW"
            voltageText={`${telemetry.vac_secondary.toFixed(1)} VAC`}
            onHover={setHoveredProbe}
          />

          {/* Fuse F1 to Switch SW1 */}
          <ElectricalWire
            points={[
              { x: 415, y: 120 },
              { x: 452, y: 120 },
            ]}
            signalType="AC"
            isFlowing={isGridConduction}
            nodeName="NODE_FUSE_OUT"
            voltageText={`${telemetry.vac_secondary.toFixed(1)} VAC`}
            onHover={setHoveredProbe}
          />

          {/* Switch SW1 to AC Ammeter A1 */}
          <ElectricalWire
            points={[
              { x: 508, y: 120 },
              { x: 546, y: 120 },
            ]}
            signalType="AC"
            isFlowing={isGridConduction}
            nodeName="NODE_SW1_OUT"
            voltageText={`${telemetry.vac_secondary.toFixed(1)} VAC`}
            onHover={setHoveredProbe}
          />

          {/* AC Ammeter A1 to Voltmeter V1 and Bridge Rectifier AC Input 1 */}
          <ElectricalWire
            points={[
              { x: 614, y: 120 },
              { x: 690, y: 120 },
              { x: 762, y: 120 },
            ]}
            signalType="AC"
            isFlowing={isGridConduction}
            nodeName="NODE_RECT_AC1"
            voltageText={`${telemetry.vac_secondary.toFixed(1)} VAC`}
            intermediateJunctions={[{ x: 690, y: 120 }]}
            onHover={setHoveredProbe}
          />

          {/* Transformer Secondary Lower Lead (12V Return) to Voltmeter V1 and Bridge Rectifier AC Input 2 */}
          <ElectricalWire
            points={[
              { x: 292, y: 200 },
              { x: 690, y: 200 },
              { x: 762, y: 200 },
            ]}
            signalType="AC"
            isFlowing={isGridConduction}
            nodeName="NODE_RECT_AC2"
            voltageText="0.0 VAC (REF)"
            intermediateJunctions={[{ x: 690, y: 200 }]}
            onHover={setHoveredProbe}
          />

          {/* AC Voltmeter V1 Connection Leads */}
          <ElectricalWire
            points={[
              { x: 690, y: 120 },
              { x: 690, y: 142 },
            ]}
            signalType="AC"
            onHover={setHoveredProbe}
          />
          <ElectricalWire
            points={[
              { x: 690, y: 198 },
              { x: 690, y: 200 },
            ]}
            signalType="AC"
            onHover={setHoveredProbe}
          />

          {/* ============================================================== */}
          {/* 2. BRIDGE RECTIFIER & DC LINK RAILS (DC+ & DC-)                */}
          {/* ============================================================== */}

          {/* DC+ Main Rail (at Y = 70): from Bridge Rectifier Output to BTS7960 B+ */}
          <ElectricalWire
            points={[
              { x: 830, y: 110 },
              { x: 830, y: 70 },
              { x: 1445, y: 70 },
            ]}
            signalType="DC_POS"
            isFlowing={telemetry.i_rect_out > 0.05}
            flowDirection="FORWARD"
            nodeName="NODE_DC_BUS_POS"
            voltageText={`${telemetry.vdc_bus.toFixed(1)} VDC`}
            intermediateJunctions={[
              { x: 990, y: 70 },   // C_DC tap
              { x: 1170, y: 70 },  // V_DC tap
              { x: 1280, y: 70 },  // R_DUMP tap
            ]}
            onHover={setHoveredProbe}
          />

          {/* DC- Main Rail (at Y = 270): from Bridge Rectifier Output to BTS7960 B- */}
          <ElectricalWire
            points={[
              { x: 830, y: 230 },
              { x: 830, y: 270 },
              { x: 1515, y: 270 },
            ]}
            signalType="DC_NEG"
            isFlowing={telemetry.i_rect_out > 0.05}
            nodeName="NODE_DC_BUS_NEG"
            voltageText="0.0 VDC (GND)"
            intermediateJunctions={[
              { x: 990, y: 270 },   // C_DC tap
              { x: 1170, y: 270 },  // V_DC tap
              { x: 1280, y: 270 },  // R_DUMP tap
              { x: 1350, y: 270 },  // Chassis GND tie
            ]}
            onHover={setHoveredProbe}
          />
          <GroundSymbol x={1350} y={288} type="CHASSIS" tag="GND_DC" />

          {/* DC Smoothing Capacitor C_DC Branch (Vertical at x = 990) */}
          <ElectricalWire
            points={[
              { x: 990, y: 70 },
              { x: 990, y: 138 },
            ]}
            signalType="DC_POS"
            onHover={setHoveredProbe}
          />
          <ElectricalWire
            points={[
              { x: 990, y: 202 },
              { x: 990, y: 270 },
            ]}
            signalType="DC_NEG"
            onHover={setHoveredProbe}
          />

          {/* DC Voltmeter DC LINK (V) Branch (Vertical at x = 1170) */}
          <ElectricalWire
            points={[
              { x: 1170, y: 70 },
              { x: 1170, y: 138 },
            ]}
            signalType="DC_POS"
            onHover={setHoveredProbe}
          />
          <ElectricalWire
            points={[
              { x: 1170, y: 202 },
              { x: 1170, y: 270 },
            ]}
            signalType="DC_NEG"
            onHover={setHoveredProbe}
          />

          {/* Dynamic Brake Resistor + Chopper Branch (Vertical at x = 1280) */}
          <ElectricalWire
            points={[
              { x: 1280, y: 70 },
              { x: 1280, y: 140 },
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
              { x: 1280, y: 200 },
              { x: 1280, y: 220 },
            ]}
            signalType="DC_POS"
            isFlowing={telemetry.brake_chopper_closed}
            onHover={setHoveredProbe}
          />
          <ElectricalWire
            points={[
              { x: 1280, y: 240 },
              { x: 1280, y: 270 },
            ]}
            signalType="DC_NEG"
            isFlowing={telemetry.brake_chopper_closed}
            onHover={setHoveredProbe}
          />

          {/* BTS7960 B+ Power Connection (from DC+ Rail down to B+ terminal at 1445, 98) */}
          <ElectricalWire
            points={[
              { x: 1445, y: 70 },
              { x: 1445, y: 98 },
            ]}
            signalType="DC_POS"
            isFlowing={isDcLinkActive}
            flowDirection={isRegen ? 'REVERSE' : 'FORWARD'}
            isRegen={isRegen}
            nodeName="NODE_BTS_B_POS"
            voltageText={`${telemetry.vdc_bus.toFixed(1)} VDC`}
            onHover={setHoveredProbe}
          />

          {/* BTS7960 B- Ground Connection (from DC- Rail down to B- terminal at 1515, 98) */}
          <ElectricalWire
            points={[
              { x: 1515, y: 270 },
              { x: 1515, y: 98 },
            ]}
            signalType="DC_NEG"
            isFlowing={isDcLinkActive}
            nodeName="NODE_BTS_B_NEG"
            voltageText="0.0 VDC"
            onHover={setHoveredProbe}
          />

          {/* ============================================================== */}
          {/* 3. BTS7960 OUTPUT LEADS TO DC TRACTION MOTOR                   */}
          {/* ============================================================== */}

          {/* BTS7960 M+ to DC Motor M+ */}
          <ElectricalWire
            points={[
              { x: 1564, y: 160 },
              { x: 1688, y: 160 },
              { x: 1688, y: 156 },
            ]}
            signalType="DC_POS"
            isFlowing={isMotorRunning}
            flowDirection={isRegen ? 'REVERSE' : 'FORWARD'}
            isRegen={isRegen}
            nodeName="NODE_MOTOR_M_POS"
            voltageText={`${(telemetry.motor_current * 1.5).toFixed(1)} V`}
            onHover={setHoveredProbe}
          />

          {/* BTS7960 M- to DC Motor M- */}
          <ElectricalWire
            points={[
              { x: 1564, y: 188 },
              { x: 1688, y: 188 },
              { x: 1688, y: 184 },
            ]}
            signalType="DC_NEG"
            isFlowing={isMotorRunning}
            flowDirection={isRegen ? 'REVERSE' : 'FORWARD'}
            isRegen={isRegen}
            nodeName="NODE_MOTOR_M_NEG"
            voltageText="0.0 V"
            onHover={setHoveredProbe}
          />

          {/* Directional Current Flow Indicator */}
          <g transform="translate(1480, 42)">
            <rect x="-70" y="-11" width="140" height="22" rx="4" fill="#090d16" stroke="#1e293b" strokeWidth="1" />
            <text x="0" y="4" textAnchor="middle" fill={isMotoring ? '#38bdf8' : isRegen ? '#10b981' : '#64748b'} fontSize="8.5" fontWeight="bold" fontFamily="monospace">
              {isMotoring ? 'CURRENT FLOW ➔' : isRegen ? '◀ DISCHARGING / REGEN' : 'STANDBY IDLE'}
            </text>
          </g>

          {/* ============================================================== */}
          {/* 4. REGENERATIVE STORAGE BRANCH (SUPERCAP, SPDT, REVERSE LED)   */}
          {/* ============================================================== */}

          {/* Tap from DC+ Bus (at x = 990) down to Storage Branch at Y = 370 */}
          <ElectricalWire
            points={[
              { x: 990, y: 70 },
              { x: 990, y: 50 },
              { x: 740, y: 50 },
              { x: 740, y: 340 },
              { x: 706, y: 340 },
              { x: 706, y: 370 },
            ]}
            signalType="DC_POS"
            isFlowing={isRegen || Math.abs(telemetry.i_scap) > 0.05}
            flowDirection={telemetry.i_scap < 0 ? 'REVERSE' : 'FORWARD'}
            isRegen={isRegen}
            nodeName="NODE_STORAGE_BUS_POS"
            voltageText={`${telemetry.vdc_bus.toFixed(1)} VDC`}
            onHover={setHoveredProbe}
          />

          {/* SPDT Switch Terminal A (Left Top) to Diode D_STEER */}
          <ElectricalWire
            points={[
              { x: 634, y: 360 },
              { x: 574, y: 360 },
            ]}
            signalType="DC_POS"
            isFlowing={isRegen}
            flowDirection="FORWARD"
            isRegen={true}
            nodeName="NODE_SPDT_A"
            voltageText={`${telemetry.v_scap.toFixed(1)} VDC`}
            onHover={setHoveredProbe}
          />

          {/* Diode D_STEER to Inrush Limiting Resistor R_LIMIT */}
          <ElectricalWire
            points={[
              { x: 526, y: 360 },
              { x: 460, y: 360 },
            ]}
            signalType="DC_POS"
            isFlowing={isRegen}
            nodeName="NODE_PRECHARGE_RES"
            voltageText={`${telemetry.v_scap.toFixed(1)} VDC`}
            onHover={setHoveredProbe}
          />

          {/* R_LIMIT to Supercapacitor Bank Positive Terminal & Voltmeter */}
          <ElectricalWire
            points={[
              { x: 400, y: 360 },
              { x: 280, y: 360 },
              { x: 280, y: 410 },
            ]}
            signalType="DC_POS"
            isFlowing={Math.abs(telemetry.i_scap) > 0.05}
            flowDirection={telemetry.i_scap < 0 ? 'REVERSE' : 'FORWARD'}
            isRegen={telemetry.i_scap > 0}
            nodeName="NODE_SCAP_BANK_POS"
            voltageText={`${telemetry.v_scap.toFixed(1)} VDC`}
            intermediateJunctions={[{ x: 280, y: 360 }]}
            onHover={setHoveredProbe}
          />

          {/* Supercapacitor Voltmeter V_SC Positive Lead */}
          <ElectricalWire
            points={[
              { x: 280, y: 360 },
              { x: 150, y: 360 },
              { x: 150, y: 438 },
            ]}
            signalType="DC_POS"
            onHover={setHoveredProbe}
          />

          {/* Supercapacitor Voltmeter V_SC Negative Lead to Common Ground */}
          <ElectricalWire
            points={[
              { x: 150, y: 482 },
              { x: 150, y: 510 },
              { x: 280, y: 510 },
            ]}
            signalType="DC_NEG"
            intermediateJunctions={[{ x: 280, y: 510 }]}
            onHover={setHoveredProbe}
          />

          {/* Supercapacitor Bank Bottom Negative Lead to Common Ground Return */}
          <ElectricalWire
            points={[
              { x: 280, y: 508 },
              { x: 280, y: 510 },
              { x: 1060, y: 510 },
              { x: 1060, y: 270 },
            ]}
            signalType="DC_NEG"
            isFlowing={Math.abs(telemetry.i_scap) > 0.05}
            nodeName="NODE_SCAP_RETURN_NEG"
            voltageText="0.0 VDC"
            intermediateJunctions={[
              { x: 280, y: 510 },
              { x: 1060, y: 510 },
            ]}
            onHover={setHoveredProbe}
          />

          {/* SPDT Switch Terminal B (Bottom Right) to Storage Switch */}
          <ElectricalWire
            points={[
              { x: 634, y: 380 },
              { x: 650, y: 380 },
              { x: 650, y: 370 },
              { x: 772, y: 370 },
            ]}
            signalType="DC_POS"
            nodeName="NODE_SPDT_B"
            voltageText={`${telemetry.vdc_bus.toFixed(1)} VDC`}
            onHover={setHoveredProbe}
          />

          {/* Storage Switch to Ballast Resistor R_LED */}
          <ElectricalWire
            points={[
              { x: 828, y: 370 },
              { x: 890, y: 370 },
            ]}
            signalType="DC_POS"
            isFlowing={isRegen}
            onHover={setHoveredProbe}
          />

          {/* Ballast Resistor R_LED to Reverse Stored Energy LED Anode (+) */}
          <ElectricalWire
            points={[
              { x: 950, y: 370 },
              { x: 1060, y: 370 },
              { x: 1060, y: 412 },
            ]}
            signalType="DC_POS"
            isFlowing={isRegen}
            isRegen={true}
            nodeName="NODE_REVERSE_LED_ANODE"
            voltageText={`${(telemetry.vdc_bus * 0.9).toFixed(1)} VDC`}
            onHover={setHoveredProbe}
          />

          {/* Reverse Stored Energy LED Cathode (-) to Ground Return */}
          <ElectricalWire
            points={[
              { x: 1060, y: 468 },
              { x: 1060, y: 510 },
            ]}
            signalType="DC_NEG"
            isFlowing={isRegen}
            onHover={setHoveredProbe}
          />

          {/* ============================================================== */}
          {/* 5. ARDUINO MCU TO BTS7960 PWM & ENABLE CONTROL BUS             */}
          {/* ============================================================== */}

          {/* Arduino D5 (RPWM) to BTS7960 RPWM (Clean parallel vertical route) */}
          <ElectricalWire
            points={[
              { x: 1338, y: 576 },
              { x: 1380, y: 576 },
              { x: 1380, y: 158 },
              { x: 1400, y: 158 },
            ]}
            signalType="DC_POS"
            isFlowing={telemetry.motor_direction === 'CW' && isMotoring}
            nodeName="CTRL_RPWM_D5"
            voltageText={telemetry.motor_direction === 'CW' && isMotoring ? '5.0V PWM' : '0.0V'}
            onHover={setHoveredProbe}
          />

          {/* Arduino D6 (LPWM) to BTS7960 LPWM */}
          <ElectricalWire
            points={[
              { x: 1338, y: 591 },
              { x: 1392, y: 591 },
              { x: 1392, y: 170 },
              { x: 1400, y: 170 },
            ]}
            signalType="DC_POS"
            isFlowing={telemetry.motor_direction === 'CCW' && isMotoring}
            nodeName="CTRL_LPWM_D6"
            voltageText={telemetry.motor_direction === 'CCW' && isMotoring ? '5.0V PWM' : '0.0V'}
            onHover={setHoveredProbe}
          />

          {/* Arduino D9 (R_EN) to BTS7960 R_EN */}
          <ElectricalWire
            points={[
              { x: 1338, y: 606 },
              { x: 1404, y: 606 },
              { x: 1404, y: 182 },
              { x: 1400, y: 182 },
            ]}
            signalType="DC_POS"
            isFlowing={telemetry.main_switch_closed}
            nodeName="CTRL_REN_D9"
            voltageText="5.0V ENABLE"
            onHover={setHoveredProbe}
          />

          {/* Arduino D10 (L_EN) to BTS7960 L_EN */}
          <ElectricalWire
            points={[
              { x: 1338, y: 621 },
              { x: 1416, y: 621 },
              { x: 1416, y: 194 },
              { x: 1400, y: 194 },
            ]}
            signalType="DC_POS"
            isFlowing={telemetry.main_switch_closed}
            nodeName="CTRL_LEN_D10"
            voltageText="5.0V ENABLE"
            onHover={setHoveredProbe}
          />

          {/* Arduino GND to Chassis DC Ground Rail */}
          <ElectricalWire
            points={[
              { x: 1162, y: 637 },
              { x: 1140, y: 637 },
              { x: 1140, y: 270 },
              { x: 1170, y: 270 },
            ]}
            signalType="DC_NEG"
            isFlowing={true}
            nodeName="NODE_ARDUINO_GND"
            voltageText="0.0 VDC (COMMON GND)"
            onHover={setHoveredProbe}
          />

          {/* ============================================================== */}
          {/* 6. ARDUINO I2C BUS TO 16x2 LCD DISPLAY MODULE                   */}
          {/* ============================================================== */}

          {/* A4 (SDA) Data Line */}
          <ElectricalWire
            points={[
              { x: 1162, y: 592 },
              { x: 920, y: 592 },
              { x: 920, y: 620 },
              { x: 828, y: 620 },
            ]}
            signalType="DC_POS"
            isFlowing={true}
            nodeName="I2C_SDA_DATA"
            voltageText="3.3V/5V I2C (100kHz)"
            onHover={setHoveredProbe}
          />

          {/* A5 (SCL) Clock Line */}
          <ElectricalWire
            points={[
              { x: 1162, y: 607 },
              { x: 910, y: 607 },
              { x: 910, y: 632 },
              { x: 828, y: 632 },
            ]}
            signalType="DC_POS"
            isFlowing={true}
            nodeName="I2C_SCL_CLOCK"
            voltageText="5.0V CLOCK"
            onHover={setHoveredProbe}
          />

          {/* 5V (VCC) Power Line */}
          <ElectricalWire
            points={[
              { x: 1162, y: 622 },
              { x: 900, y: 622 },
              { x: 900, y: 644 },
              { x: 828, y: 644 },
            ]}
            signalType="DC_POS"
            isFlowing={true}
            nodeName="VCC_5V_RAIL"
            voltageText="5.0 VDC"
            onHover={setHoveredProbe}
          />

          {/* GND Ground Line */}
          <ElectricalWire
            points={[
              { x: 1162, y: 637 },
              { x: 890, y: 637 },
              { x: 890, y: 656 },
              { x: 828, y: 656 },
            ]}
            signalType="DC_NEG"
            isFlowing={true}
            nodeName="I2C_GND_RETURN"
            voltageText="0.0 VDC"
            onHover={setHoveredProbe}
          />

          {/* ============================================================== */}
          {/* 7. SCHEMATIC HARDWARE COMPONENTS & IEC/IEEE SYMBOLS             */}
          {/* ============================================================== */}

          {/* (1) 230VAC Power Supply Source */}
          <ACSourceSymbol
            x={90}
            y={170}
            voltage={telemetry.vac_primary}
            frequency={telemetry.freq_ac}
            current={telemetry.iac_primary}
            selected={selectedComponent === 'ac_source'}
            onClick={() => onSelectComponent('ac_source')}
          />

          {/* (2) Step-down Transformer (230V / 12V AC) */}
          <TransformerSymbol
            x={250}
            y={170}
            vPrimary={telemetry.vac_primary}
            vSecondary={telemetry.vac_secondary}
            iSecondary={telemetry.iac_secondary}
            efficiency={telemetry.transformer_eff}
            selected={selectedComponent === 'transformer'}
            onClick={() => onSelectComponent('transformer')}
          />

          {/* (3) Secondary Protection Fuse F1 */}
          <FuseSymbol
            x={380}
            y={120}
            blown={telemetry.fuse_blown}
            selected={selectedComponent === 'fuse_ac'}
            onClick={() => onSelectComponent('fuse_ac')}
          />

          {/* (4) Main AC Circuit Switch SW1 */}
          <SwitchSymbol
            x={480}
            y={120}
            closed={telemetry.main_switch_closed}
            tag="SW1"
            selected={selectedComponent === 'switch_ac'}
            onClick={() => onToggleSwitch('main')}
          />

          {/* (5) AC Ammeter A1 */}
          <MeterSymbol
            x={580}
            y={120}
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

          {/* (6) AC Voltmeter V1 */}
          <MeterSymbol
            x={690}
            y={170}
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

          {/* (7) Full-Wave Bridge Rectifier BR1 */}
          <BridgeRectifierSymbol
            x={830}
            y={170}
            vacIn={telemetry.vac_secondary}
            vdcOut={telemetry.v_rect_out}
            idcOut={telemetry.i_rect_out}
            diodeStatus={telemetry.diode_status}
            selected={selectedComponent === 'bridge_rectifier'}
            onClick={() => onSelectComponent('bridge_rectifier')}
          />

          {/* (8) DC Link Smoothing Capacitor C_DC */}
          <CapacitorSymbol
            x={990}
            y={170}
            voltage={telemetry.vdc_bus}
            capacitanceUf={15000}
            rippleMv={telemetry.vdc_ripple}
            storedJoules={telemetry.cap_stored_energy}
            isPolarized={true}
            tag="C_DC (15 mF / 25V)"
            orientation="vertical"
            badgePosition="right"
            selected={selectedComponent === 'dc_link_cap'}
            onClick={() => onSelectComponent('dc_link_cap')}
          />

          {/* (9) DC Link Voltmeter */}
          <MeterSymbol
            x={1170}
            y={170}
            type="VOLT"
            isAc={false}
            value={telemetry.vdc_bus}
            unit="V"
            tag="DC LINK (V)"
            orientation="vertical"
            badgePosition="right"
            selected={selectedComponent === 'voltmeter_dc'}
            onClick={() => onSelectComponent('voltmeter_dc')}
          />

          {/* (10) Dynamic Dump Resistor + Chopper Switch */}
          <ResistorSymbol
            x={1280}
            y={170}
            resistanceOhm={5}
            tag="R_DUMP (5 Ω)"
            orientation="vertical"
            isDissipatingHeat={telemetry.brake_chopper_closed}
            dissipatedPowerW={telemetry.brake_resistor_power_w}
            temperatureC={telemetry.brake_resistor_temp}
            showBadge={telemetry.brake_chopper_closed}
            selected={selectedComponent === 'brake_resistor'}
            onClick={() => onSelectComponent('brake_resistor')}
          />
          <SwitchSymbol
            x={1280}
            y={230}
            closed={telemetry.brake_chopper_closed}
            tag="Q_CHOP"
            orientation="vertical"
          />

          {/* (11) BTS7960 43A High-Power H-Bridge Motor Driver */}
          <BTS7960Symbol
            x={1480}
            y={170}
            mode={btsMode}
            dutyCycle={dutyCycleVal}
            outputVoltage={telemetry.vdc_bus * (dutyCycleVal / 100)}
            current={telemetry.motor_current}
            temp={32.0 + Math.abs(telemetry.motor_current) * 1.2}
            selected={selectedComponent === 'bts7960_driver'}
            onClick={() => onSelectComponent('bts7960_driver')}
          />

          {/* (12) DC Traction Motor coupled with Inertial Flywheel */}
          <DCMotorFlywheelSymbol
            x={1720}
            y={170}
            speedRpm={telemetry.motor_speed_rpm}
            torqueNm={telemetry.motor_torque_nm}
            powerW={telemetry.motor_mech_power}
            direction={telemetry.motor_direction}
            powerFlow={telemetry.power_flow}
            selected={selectedComponent === 'dc_motor'}
            onClick={() => onSelectComponent('dc_motor')}
          />

          {/* (13) Voltmeter V_SC for Supercapacitor */}
          <MeterSymbol
            x={150}
            y={460}
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

          {/* (14) Supercapacitor Bank (58F / 16.0V Module) */}
          <SupercapacitorSymbol
            x={280}
            y={460}
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
            tag="SC_BANK (58F / 16.0V)"
            selected={selectedComponent === 'supercapacitor'}
            onClick={() => onSelectComponent('supercapacitor')}
          />

          {/* (15) Precharge / Inrush Limiting Resistor (2.2 Ω) */}
          <ResistorSymbol
            x={430}
            y={360}
            resistanceOhm={2.2}
            tag="R_LIMIT (2.2 Ω)"
            orientation="horizontal"
            showBadge={false}
          />

          {/* (16) Diode D_STEER for One-Way Energy Harvesting */}
          <DiodeSymbol
            x={550}
            y={360}
            isConducting={isRegen}
            orientation="horizontal"
            tag="D_STEER (10A)"
          />

          {/* (17) SPDT Selector Switch */}
          <SPDTSwitchSymbol
            x={670}
            y={370}
            position={isRegen ? 'A' : 'B'}
            selected={selectedComponent === 'spdt_switch'}
            onClick={() => onSelectComponent('spdt_switch')}
          />

          {/* (18) Storage Branch Switch */}
          <SwitchSymbol
            x={800}
            y={370}
            closed={true}
            tag="SWITCH"
            orientation="horizontal"
          />

          {/* (19) LED Ballast Resistor (1 kΩ) */}
          <ResistorSymbol
            x={920}
            y={370}
            resistanceOhm={1000}
            tag="R_LED (1 kΩ)"
            orientation="horizontal"
            showBadge={false}
          />

          {/* (20) LED (Reverse Stored Energy) - Radiates Bright Green on Regen */}
          <ReverseLedSymbol
            x={1060}
            y={440}
            isActive={isRegen}
            selected={selectedComponent === 'reverse_led'}
            onClick={() => onSelectComponent('reverse_led')}
          />

          {/* (21) Arduino Microcontroller Board (ATmega328P) */}
          <ArduinoSymbol
            x={1250}
            y={600}
            selected={selectedComponent === 'arduino_controller'}
            onClick={() => onSelectComponent('arduino_controller')}
          />

          {/* (22) 16x2 Character LCD Display (Showing 4-Quadrant Status & Telemetry) */}
          <LCDDisplaySymbol
            x={740}
            y={638}
            powerFlow={telemetry.power_flow === 'FAULT' ? 'IDLE' : telemetry.power_flow}
            motorDirection={telemetry.motor_direction}
            dutyCycle={dutyCycleVal}
            vdcBus={telemetry.vdc_bus}
            vScap={telemetry.v_scap}
            motorCurrent={telemetry.motor_current}
            selected={selectedComponent === 'lcd_display'}
            onClick={() => onSelectComponent('lcd_display')}
          />
        </g>
      </svg>
    </div>
  );
};
