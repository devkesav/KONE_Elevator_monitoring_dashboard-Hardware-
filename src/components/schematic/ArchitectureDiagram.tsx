import React, { useState, useRef, useEffect } from 'react';
import type { ElectricalTelemetry, ComponentId } from '../../types/electrical';
import { ZoomIn, ZoomOut, Maximize2, RotateCcw } from 'lucide-react';

interface Props {
  telemetry: ElectricalTelemetry;
  selectedComponent: ComponentId | null;
  onSelectComponent: (id: ComponentId) => void;
}

export const ArchitectureDiagram: React.FC<Props> = ({
  telemetry,
  selectedComponent,
  onSelectComponent,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Pan and Zoom
  const [zoom, setZoom] = useState<number>(0.92);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 10, y: 15 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Rotating sheave angle
  const [sheaveAngle, setSheaveAngle] = useState<number>(0);

  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const animateSheave = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      if (telemetry.car_velocity_ms > 0.01) {
        // sheave radius 0.25m -> angular velocity omega = v / 0.25 rad/s
        const omegaDegPerSec = (telemetry.car_velocity_ms / 0.25) * (180 / Math.PI);
        const dir = telemetry.motor_direction === 'CW' ? 1 : -1;
        setSheaveAngle((prev) => (prev + dir * omegaDegPerSec * dt) % 360);
      }
      animId = requestAnimationFrame(animateSheave);
    };

    animId = requestAnimationFrame(animateSheave);
    return () => cancelAnimationFrame(animId);
  }, [telemetry.car_velocity_ms, telemetry.motor_direction]);

  const handleFitScreen = () => {
    setZoom(0.92);
    setPan({ x: 10, y: 15 });
  };

  const handleResetZoom = () => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
  };

  // 'Space' key hotkey for Fit to Screen
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

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.08 : 0.92;
    setZoom((prev) => Math.max(0.4, Math.min(2.5, prev * factor)));
  };

  // Drag anywhere on background or non-interactive canvas
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, input, select, textarea, a')) {
      return;
    }
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  // Global mousemove / mouseup while dragging so dragging never drops
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

  const isMotoring = telemetry.mechanical_state_text === 'MOTORING';
  const isRegen = telemetry.mechanical_state_text === 'REGENERATING';
  const isBraking = telemetry.brake_chopper_closed || telemetry.chopper_state_text === 'chopper active';

  // Elevator hoistway travel calculation
  // 10 floors = ~31.5m. car_position_m between 0 and 31.5m
  const travelSpan = 31.5;
  const normPos = Math.max(0, Math.min(1, telemetry.car_position_m / travelSpan));
  // top level y = 140, bottom level y = 460
  const carY = 460 - normPos * (460 - 140);
  const cwY = 140 + normPos * (460 - 140);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-[#0a0e17] cursor-grab active:cursor-grabbing select-none"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
    >
      {/* Zoom / View controls toolbar */}
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

      {/* SVG Canvas */}
      <svg
        id="diagram-bg"
        className="w-full h-full"
        style={{ transformOrigin: '0 0' }}
      >
        <defs>
          {/* Subtle grid pattern */}
          <pattern id="diag-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#141c2c" strokeWidth="0.8" />
          </pattern>
        </defs>

        {/* CSS for animated power flow dashes */}
        <style>
          {`
            @keyframes flowForward {
              from { stroke-dashoffset: 28; }
              to { stroke-dashoffset: 0; }
            }
            @keyframes flowReverse {
              from { stroke-dashoffset: 0; }
              to { stroke-dashoffset: 28; }
            }
            .power-flow-motoring {
              stroke-dasharray: 8 6;
              animation: flowForward 0.8s linear infinite;
            }
            .power-flow-regen {
              stroke-dasharray: 8 6;
              animation: flowReverse 0.8s linear infinite;
            }
            .power-flow-chopper {
              stroke-dasharray: 6 4;
              animation: flowForward 0.6s linear infinite;
            }
          `}
        </style>

        {/* Background Grid */}
        <rect width="100%" height="100%" fill="url(#diag-grid)" />

        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>

          {/* ============================================================== */}
          {/* 1. POWER WIRES / BUS CONNECTIONS (Guaranteed 2-Layer Rendering)  */}
          {/* ============================================================== */}

          {/* Wire 1: Grid to Diode Rectifier */}
          <line x1="120" y1="230" x2="175" y2="230" stroke="#334155" strokeWidth="2.5" />
          {telemetry.p_grid_kw > 0.05 && (
            <>
              <line x1="120" y1="230" x2="175" y2="230" stroke="#0284c7" strokeWidth="6" opacity="0.35" />
              <line x1="120" y1="230" x2="175" y2="230" stroke="#38bdf8" strokeWidth="3" className="power-flow-motoring" />
            </>
          )}

          {/* Wire 2: Rectifier to DC Link */}
          <line x1="290" y1="230" x2="355" y2="230" stroke="#334155" strokeWidth="2.5" />
          {telemetry.p_grid_kw > 0.05 && (
            <>
              <line x1="290" y1="230" x2="355" y2="230" stroke="#0284c7" strokeWidth="6" opacity="0.35" />
              <line x1="290" y1="230" x2="355" y2="230" stroke="#38bdf8" strokeWidth="3" className="power-flow-motoring" />
            </>
          )}

          {/* Wire 3: DC Link to Brake Chopper (Branch UP) */}
          <line x1="395" y1="120" x2="395" y2="75" stroke="#334155" strokeWidth="2.5" />
          {isBraking && (
            <>
              <line x1="395" y1="120" x2="395" y2="75" stroke="#b45309" strokeWidth="6" opacity="0.4" />
              <line x1="395" y1="120" x2="395" y2="75" stroke="#f59e0b" strokeWidth="3" className="power-flow-chopper" />
            </>
          )}

          {/* Wire 4: DC Link to Bidir DC-DC (Branch DOWN) */}
          <line x1="395" y1="340" x2="395" y2="385" stroke="#334155" strokeWidth="2.5" />
          {(isMotoring || isRegen) && (
            <>
              <line x1="395" y1="340" x2="395" y2="385" stroke="#0284c7" strokeWidth="7" opacity="0.35" />
              <line
                x1="395"
                y1="340"
                x2="395"
                y2="385"
                stroke="#38bdf8"
                strokeWidth="3.5"
                className={isMotoring ? 'power-flow-motoring' : 'power-flow-regen'}
              />
            </>
          )}

          {/* Wire 5: Bidir DC-DC to Supercap Bank */}
          <line x1="395" y1="440" x2="395" y2="485" stroke="#334155" strokeWidth="2.5" />
          {(isMotoring || isRegen) && (
            <>
              <line x1="395" y1="440" x2="395" y2="485" stroke="#0284c7" strokeWidth="7" opacity="0.35" />
              <line
                x1="395"
                y1="440"
                x2="395"
                y2="485"
                stroke="#38bdf8"
                strokeWidth="3.5"
                className={isMotoring ? 'power-flow-motoring' : 'power-flow-regen'}
              />
            </>
          )}

          {/* Wire 6: DC Link to Inverter (Branch RIGHT) */}
          <line x1="435" y1="230" x2="515" y2="230" stroke="#334155" strokeWidth="2.5" />
          {(isMotoring || isRegen) && (
            <>
              <line x1="435" y1="230" x2="515" y2="230" stroke="#0284c7" strokeWidth="7" opacity="0.35" />
              <line
                x1="435"
                y1="230"
                x2="515"
                y2="230"
                stroke="#38bdf8"
                strokeWidth="3.5"
                className={isMotoring ? 'power-flow-motoring' : 'power-flow-regen'}
              />
            </>
          )}

          {/* Wire 7: Inverter to PMSM */}
          <line x1="635" y1="230" x2="725" y2="230" stroke="#334155" strokeWidth="2.5" />
          {(isMotoring || isRegen) && (
            <>
              <line x1="635" y1="230" x2="725" y2="230" stroke="#0284c7" strokeWidth="7" opacity="0.35" />
              <line
                x1="635"
                y1="230"
                x2="725"
                y2="230"
                stroke="#38bdf8"
                strokeWidth="3.5"
                className={isMotoring ? 'power-flow-motoring' : 'power-flow-regen'}
              />
            </>
          )}

          {/* Wire 8: PMSM to Traction Pulley (Drive Shaft: Right -> UP -> Right) */}
          <path
            d="M 815,230 L 980,230 L 980,65 L 1055,65"
            fill="none"
            stroke="#334155"
            strokeWidth="2.5"
          />
          {(isMotoring || isRegen) && (
            <>
              <path
                d="M 815,230 L 980,230 L 980,65 L 1055,65"
                fill="none"
                stroke="#0284c7"
                strokeWidth="7"
                opacity="0.35"
              />
              <path
                d="M 815,230 L 980,230 L 980,65 L 1055,65"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="3.5"
                className={isMotoring ? 'power-flow-motoring' : 'power-flow-regen'}
              />
            </>
          )}

          {/* ============================================================== */}
          {/* 2. BLOCK COMPONENTS                                            */}
          {/* ============================================================== */}

          {/* BLOCK 1: 3φ GRID */}
          <g
            className="cursor-pointer group"
            onClick={() => onSelectComponent('ac_source')}
          >
            <rect
              x="20"
              y="195"
              width="100"
              height="70"
              rx="8"
              fill="#131924"
              stroke={selectedComponent === 'ac_source' ? '#38bdf8' : '#2b374d'}
              strokeWidth={selectedComponent === 'ac_source' ? '2.5' : '1.5'}
              className="transition duration-150 group-hover:stroke-sky-500"
            />
            <text x="70" y="228" textAnchor="middle" fill="#f8fafc" fontSize="13" fontWeight="bold" fontFamily="sans-serif">
              3φ GRID
            </text>
            <text x="70" y="248" textAnchor="middle" fill="#94a3b8" fontSize="12" fontFamily="sans-serif">
              {Math.round(telemetry.v_grid_3ph)} V
            </text>
          </g>

          {/* BLOCK 2: DIODE RECTIFIER */}
          <g
            className="cursor-pointer group"
            onClick={() => onSelectComponent('bridge_rectifier')}
          >
            <rect
              x="175"
              y="195"
              width="115"
              height="70"
              rx="8"
              fill="#131924"
              stroke={selectedComponent === 'bridge_rectifier' ? '#38bdf8' : '#2b374d'}
              strokeWidth={selectedComponent === 'bridge_rectifier' ? '2.5' : '1.5'}
              className="transition duration-150 group-hover:stroke-sky-500"
            />
            <text x="232" y="226" textAnchor="middle" fill="#f8fafc" fontSize="11.5" fontWeight="bold" fontFamily="sans-serif">
              DIODE
            </text>
            <text x="232" y="244" textAnchor="middle" fill="#f8fafc" fontSize="11.5" fontWeight="bold" fontFamily="sans-serif">
              RECTIFIER
            </text>

            {/* Readout below connection line */}
            <text x="232" y="295" textAnchor="middle" fill="#94a3b8" fontSize="12" fontFamily="monospace">
              Irect {telemetry.i_rect_a.toFixed(1)} A
            </text>
            <text x="232" y="315" textAnchor="middle" fill="#94a3b8" fontSize="12" fontFamily="monospace">
              Pgrid {telemetry.p_grid_kw.toFixed(1)} kW
            </text>
          </g>

          {/* BLOCK 3: DC LINK (Tall Vertical Capsule Pill) */}
          <g
            className="cursor-pointer group"
            onClick={() => onSelectComponent('dc_link_cap')}
          >
            <rect
              x="355"
              y="120"
              width="80"
              height="220"
              rx="24"
              fill="#141d2c"
              stroke={selectedComponent === 'dc_link_cap' ? '#38bdf8' : '#334155'}
              strokeWidth={selectedComponent === 'dc_link_cap' ? '2.5' : '1.8'}
              className="transition duration-150 group-hover:stroke-sky-500"
            />
            <text x="395" y="215" textAnchor="middle" fill="#f8fafc" fontSize="12.5" fontWeight="bold" fontFamily="sans-serif">
              DC LINK
            </text>
            <text x="395" y="238" textAnchor="middle" fill="#94a3b8" fontSize="12" fontFamily="monospace">
              C_dc
            </text>
            <text x="395" y="258" textAnchor="middle" fill="#94a3b8" fontSize="12" fontFamily="monospace">
              {telemetry.c_dc_mf.toFixed(1)} mF
            </text>

            {/* Voltage readout above DC Link */}
            <text x="455" y="110" textAnchor="start" fill="#f8fafc" fontSize="14" fontWeight="bold" fontFamily="monospace">
              Vdc {telemetry.vdc_bus.toFixed(1)} V
            </text>
          </g>

          {/* BLOCK 4: BRAKE CHOPPER (Above DC Link) */}
          <g
            className="cursor-pointer group"
            onClick={() => onSelectComponent('brake_resistor')}
          >
            <rect
              x="320"
              y="20"
              width="150"
              height="55"
              rx="8"
              fill={isBraking ? '#2a1a0f' : '#131924'}
              stroke={selectedComponent === 'brake_resistor' ? '#f59e0b' : isBraking ? '#f59e0b' : '#2b374d'}
              strokeWidth={selectedComponent === 'brake_resistor' || isBraking ? '2.5' : '1.5'}
              className="transition duration-150 group-hover:stroke-amber-500"
            />
            <text x="395" y="44" textAnchor="middle" fill="#f8fafc" fontSize="11.5" fontWeight="bold" fontFamily="sans-serif">
              BRAKE CHOPPER
            </text>
            <text x="395" y="62" textAnchor="middle" fill="#94a3b8" fontSize="11" fontFamily="monospace">
              + R_brake
            </text>

            {/* Telemetry to the right of Brake Chopper */}
            <text x="485" y="42" textAnchor="start" fill="#94a3b8" fontSize="12" fontFamily="monospace">
              Ibr {telemetry.i_br_a.toFixed(1)} A · {telemetry.p_br_kw.toFixed(1)} kW
            </text>
            <text
              x="485"
              y="62"
              textAnchor="start"
              fill={isBraking ? '#f59e0b' : '#64748b'}
              fontSize="12"
              fontWeight="bold"
              fontFamily="monospace"
            >
              {telemetry.chopper_state_text}
            </text>
          </g>

          {/* BLOCK 5: BIDIR DC-DC (Below DC Link) */}
          <g
            className="cursor-pointer group"
            onClick={() => onSelectComponent('dcdc_converter')}
          >
            <rect
              x="320"
              y="385"
              width="150"
              height="55"
              rx="8"
              fill="#131924"
              stroke={selectedComponent === 'dcdc_converter' ? '#38bdf8' : '#2b374d'}
              strokeWidth={selectedComponent === 'dcdc_converter' ? '2.5' : '1.5'}
              className="transition duration-150 group-hover:stroke-sky-500"
            />
            <text x="395" y="409" textAnchor="middle" fill="#f8fafc" fontSize="12" fontWeight="bold" fontFamily="sans-serif">
              BIDIR DC-DC
            </text>
            <text x="395" y="427" textAnchor="middle" fill="#94a3b8" fontSize="11" fontFamily="monospace">
              buck / boost
            </text>

            {/* Telemetry to the right of BIDIR DC-DC */}
            <text x="485" y="408" textAnchor="start" fill="#94a3b8" fontSize="12" fontFamily="monospace">
              Idc {telemetry.i_dc_dcdc > 0 ? `+${telemetry.i_dc_dcdc.toFixed(1)}` : telemetry.i_dc_dcdc.toFixed(1)} A
            </text>
            <text x="485" y="428" textAnchor="start" fill="#94a3b8" fontSize="11.5" fontFamily="monospace">
              duty D≈{telemetry.dcdc_duty_val.toFixed(2)} {telemetry.dcdc_mode_desc}
            </text>
          </g>

          {/* BLOCK 6: SUPERCAP bank (Below BIDIR DC-DC) */}
          <g
            className="cursor-pointer group"
            onClick={() => onSelectComponent('supercapacitor')}
          >
            <rect
              x="320"
              y="485"
              width="150"
              height="55"
              rx="8"
              fill="#131924"
              stroke={selectedComponent === 'supercapacitor' ? '#38bdf8' : '#2b374d'}
              strokeWidth={selectedComponent === 'supercapacitor' ? '2.5' : '1.5'}
              className="transition duration-150 group-hover:stroke-sky-500"
            />
            <text x="395" y="509" textAnchor="middle" fill="#f8fafc" fontSize="12" fontWeight="bold" fontFamily="sans-serif">
              SUPERCAP
            </text>
            <text x="395" y="527" textAnchor="middle" fill="#94a3b8" fontSize="11" fontFamily="monospace">
              bank
            </text>

            {/* Telemetry to the right of Supercap */}
            <text x="485" y="508" textAnchor="start" fill="#94a3b8" fontSize="12" fontFamily="monospace">
              Vsc {telemetry.v_scap_bank.toFixed(1)} V
            </text>
            <text x="485" y="528" textAnchor="start" fill="#94a3b8" fontSize="12" fontFamily="monospace">
              Isc {telemetry.i_scap_bank > 0 ? `+${telemetry.i_scap_bank.toFixed(1)}` : telemetry.i_scap_bank.toFixed(1)} A ({telemetry.p_scap_kw > 0 ? `+${telemetry.p_scap_kw.toFixed(1)}` : telemetry.p_scap_kw.toFixed(1)} kW)
            </text>
          </g>

          {/* BLOCK 7: INVERTER (Right of DC Link) */}
          <g
            className="cursor-pointer group"
            onClick={() => onSelectComponent('motor_drive')}
          >
            <rect
              x="515"
              y="195"
              width="120"
              height="70"
              rx="8"
              fill="#131924"
              stroke={selectedComponent === 'motor_drive' ? '#38bdf8' : '#2b374d'}
              strokeWidth={selectedComponent === 'motor_drive' ? '2.5' : '1.5'}
              className="transition duration-150 group-hover:stroke-sky-500"
            />
            <text x="575" y="226" textAnchor="middle" fill="#f8fafc" fontSize="12.5" fontWeight="bold" fontFamily="sans-serif">
              INVERTER
            </text>
            <text x="575" y="246" textAnchor="middle" fill="#94a3b8" fontSize="12" fontFamily="monospace">
              3φ VSI
            </text>

            {/* Telemetry below Inverter */}
            <text x="575" y="295" textAnchor="middle" fill="#94a3b8" fontSize="12" fontFamily="monospace">
              Iinv {telemetry.i_inv_a.toFixed(1)} A
            </text>
            <text x="575" y="315" textAnchor="middle" fill="#94a3b8" fontSize="12" fontFamily="monospace">
              Pinv {telemetry.p_inv_kw.toFixed(1)} kW
            </text>
          </g>

          {/* BLOCK 8: PMSM gearless (Circle) */}
          <g
            className="cursor-pointer group"
            onClick={() => onSelectComponent('pmsm_motor')}
          >
            <circle
              cx="770"
              cy="230"
              r="45"
              fill="#131924"
              stroke={selectedComponent === 'pmsm_motor' ? '#38bdf8' : '#334155'}
              strokeWidth={selectedComponent === 'pmsm_motor' ? '2.5' : '1.8'}
              className="transition duration-150 group-hover:stroke-sky-500"
            />
            <text x="770" y="225" textAnchor="middle" fill="#f8fafc" fontSize="13" fontWeight="bold" fontFamily="sans-serif">
              PMSM
            </text>
            <text x="770" y="245" textAnchor="middle" fill="#94a3b8" fontSize="11" fontFamily="sans-serif">
              gearless
            </text>

            {/* Telemetry below PMSM */}
            <text x="770" y="300" textAnchor="middle" fill="#94a3b8" fontSize="12" fontFamily="monospace">
              iq {telemetry.iq_pk_a.toFixed(1)} A pk
            </text>
            <text x="770" y="320" textAnchor="middle" fill="#94a3b8" fontSize="11.5" fontFamily="monospace">
              fe {telemetry.fe_hz.toFixed(1)} Hz · Vph {telemetry.vph_v} V
            </text>
            <text x="770" y="340" textAnchor="middle" fill="#94a3b8" fontSize="11.5" fontFamily="monospace">
              mod. index {telemetry.mod_index.toFixed(2)}
            </text>
          </g>

          {/* ============================================================== */}
          {/* 3. ELEVATOR HOISTWAY & TRACTION SYSTEM                          */}
          {/* ============================================================== */}

          {/* Top Limit Reference Line */}
          <line x1="1025" y1="120" x2="1190" y2="120" stroke="#334155" strokeWidth="1" strokeDasharray="3 3" />
          <text x="1005" y="124" textAnchor="end" fill="#64748b" fontSize="12" fontFamily="sans-serif">
            top
          </text>

          {/* Bottom Limit Reference Line */}
          <line x1="1025" y1="480" x2="1190" y2="480" stroke="#334155" strokeWidth="1" strokeDasharray="3 3" />
          <text x="1005" y="484" textAnchor="end" fill="#64748b" fontSize="12" fontFamily="sans-serif">
            bottom
          </text>

          {/* Traction Sheave Pulley (With Rotating Spokes) */}
          <g transform="translate(1085, 65)">
            <circle
              cx="0"
              cy="0"
              r="34"
              fill="#131924"
              stroke="#cbd5e1"
              strokeWidth="2"
            />
            {/* Rotating Cross Spokes */}
            <g transform={`rotate(${sheaveAngle})`}>
              <line x1="-34" y1="0" x2="34" y2="0" stroke="#94a3b8" strokeWidth="1.8" />
              <line x1="0" y1="-34" x2="0" y2="34" stroke="#94a3b8" strokeWidth="1.8" />
              <line x1="-24" y1="-24" x2="24" y2="24" stroke="#64748b" strokeWidth="1.2" />
              <line x1="-24" y1="24" x2="24" y2="-24" stroke="#64748b" strokeWidth="1.2" />
            </g>
            <circle cx="0" cy="0" r="5" fill="#f8fafc" />
          </g>

          {/* Left Cable: From Pulley to Elevator Car */}
          <line
            x1="1051"
            y1="65"
            x2="1051"
            y2={carY}
            stroke="#94a3b8"
            strokeWidth="1.8"
          />

          {/* Right Cable: From Pulley to Counterweight */}
          <line
            x1="1119"
            y1="65"
            x2="1119"
            y2={cwY}
            stroke="#94a3b8"
            strokeWidth="1.8"
          />

          {/* Elevator Car (Warm Golden / Amber Rectangle matching diagram) */}
          <g
            transform={`translate(1029, ${carY})`}
            className="cursor-pointer group"
            onClick={() => onSelectComponent('pmsm_motor')}
          >
            <rect
              x="0"
              y="0"
              width="44"
              height="50"
              rx="4"
              fill="#b47820"
              stroke="#eab308"
              strokeWidth="1.8"
              className="transition duration-75"
            />
            {/* Floor indicator inside cabin */}
            <text x="22" y="30" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="bold" fontFamily="monospace">
              F{telemetry.car_floor}
            </text>
          </g>

          {/* Counterweight (CW) */}
          <g transform={`translate(1105, ${cwY})`}>
            <rect
              x="0"
              y="0"
              width="28"
              height="58"
              rx="3"
              fill="#182232"
              stroke="#64748b"
              strokeWidth="1.8"
            />
            <text x="14" y="34" textAnchor="middle" fill="#e2e8f0" fontSize="12" fontWeight="bold" fontFamily="sans-serif">
              CW
            </text>
          </g>

          {/* Hoistway Live Mechanical Telemetry (To the right of CW) */}
          <g transform="translate(1170, 200)">
            <text x="0" y="0" textAnchor="start" fill="#f8fafc" fontSize="14" fontFamily="monospace">
              v {telemetry.car_velocity_ms.toFixed(2)} m/s
            </text>
            <text x="0" y="24" textAnchor="start" fill="#f8fafc" fontSize="14" fontFamily="monospace">
              F {telemetry.rope_force_kn.toFixed(2)} kN
            </text>
            <text x="0" y="48" textAnchor="start" fill="#f8fafc" fontSize="14" fontFamily="monospace">
              Pshaft {telemetry.p_shaft_kw.toFixed(1)} kW
            </text>
            <text
              x="0"
              y="74"
              textAnchor="start"
              fill={isMotoring ? '#38bdf8' : isRegen ? '#10b981' : '#64748b'}
              fontSize="14"
              fontWeight="bold"
              fontFamily="sans-serif"
              letterSpacing="0.05em"
            >
              {telemetry.mechanical_state_text}
            </text>
          </g>

        </g>
      </svg>
    </div>
  );
};

export default ArchitectureDiagram;
