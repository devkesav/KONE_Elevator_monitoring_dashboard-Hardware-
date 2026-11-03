// Electrical & Simulation Types for KONE Regenerative PMSM Schematic

export type SimulationMode = 'DEMO' | 'HARDWARE' | 'FAULT_TEST';

export type ElevatorMotionState = 
  | 'IDLE'
  | 'ACCELERATING_UP'
  | 'CRUISING_UP'
  | 'DECELERATING_UP'
  | 'ACCELERATING_DOWN'
  | 'CRUISING_DOWN'
  | 'DECELERATING_DOWN'
  | 'EMERGENCY_STOP';

export type PowerFlowDirection = 'MOTORING' | 'REGENERATING' | 'IDLE' | 'FAULT';

export interface ElectricalTelemetry {
  timestamp: number;
  
  // AC Mains & Transformer
  vac_primary: number;       // Volts AC (e.g. 230V)
  iac_primary: number;       // Amps AC
  freq_ac: number;           // Hz (e.g. 50Hz)
  vac_secondary: number;     // Volts AC (e.g. 12V or 400V)
  iac_secondary: number;     // Amps AC
  transformer_temp: number;  // °C
  transformer_eff: number;   // %
  
  // Primary & Secondary Switches/Fuses
  fuse_blown: boolean;
  main_switch_closed: boolean;
  dpst_switch_closed: boolean;
  precharge_active: boolean;
  
  // Rectifier
  v_rect_out: number;        // Volts DC (unfiltered)
  i_rect_out: number;        // Amps DC
  diode_status: [boolean, boolean, boolean, boolean]; // D1, D2, D3, D4 forward conduction
  rectifier_temp: number;    // °C
  
  // DC Link
  vdc_bus: number;           // Volts DC (e.g. 15.8V or 600V)
  idc_bus: number;           // Amps DC
  pdc_bus: number;           // Watts DC
  vdc_ripple: number;        // mV ripple
  cap_stored_energy: number; // Joules
  
  // Bidirectional DC-DC Converter
  dcdc_mode: 'BUCK' | 'BOOST' | 'STANDBY';
  dcdc_duty_cycle: number;   // %
  dcdc_current: number;      // Amps (+ into supercap, - from supercap)
  dcdc_temp: number;         // °C
  
  // Supercapacitor Bank (EDLC Stern 2-Branch Model)
  v_scap: number;            // Volts DC (Loaded Terminal Voltage)
  v_scap_ocv: number;        // Volts DC (Internal Open-Circuit Chemical Voltage)
  i_scap: number;            // Amps DC (+ charging, - discharging)
  soc_scap: number;          // State of Charge %
  stored_energy_scap: number;// Joules
  scap_stored_wh: number;    // Watt-Hours
  scap_power_w: number;      // Watts (+ into scap, - delivered to bus)
  scap_ir_drop_v: number;    // Volts instantaneous IR step drop/rise
  scap_esr_mohm: number;     // mΩ Equivalent Series Resistance
  scap_status: 'CHARGING' | 'DISCHARGING' | 'FLOAT' | 'ISOLATED' | 'PRECHARGING';
  scap_temp: number;         // °C
  scap_cell_voltages: number[]; // 6-series cells balancing array
  scap_cycles: number;       // Cumulative cycle counter
  scap_coulombic_eff: number;// Coulombic round-trip efficiency %
  
  // Dynamic Braking / Heat Dissipation Resistor & Chopper
  brake_resistor_active: boolean; // True when supercapacitor is full and burning excess regen
  brake_resistor_power_w: number; // Watts dissipated as heat
  brake_resistor_current: number; // Amps through dump resistor
  brake_resistor_temp: number;    // °C of the braking resistor
  brake_chopper_closed: boolean;  // Chopper IGBT state
  
  // PMSM Motor & Inverter Drive
  motor_speed_rpm: number;   // RPM
  motor_torque_nm: number;   // Nm
  motor_mech_power: number;  // Watts
  motor_current: number;     // Amps
  motor_direction: 'CW' | 'CCW' | 'STOP';
  motor_temp: number;        // °C
  regen_power_w: number;     // Watts regenerated
  
  // Elevator Mechanical State
  car_floor: number;         // Floor number (1 to 10)
  car_position_m: number;    // Height in meters
  car_velocity_ms: number;   // m/s
  car_load_kg: number;       // kg payload
  counterweight_kg: number;  // kg
  motion_state: ElevatorMotionState;
  power_flow: PowerFlowDirection;
  
  // System Health
  fault_active: boolean;
  fault_message?: string;
  hardware_connected: boolean;
}

export type ComponentId = 
  | 'ac_source'
  | 'transformer'
  | 'fuse_ac'
  | 'switch_ac'
  | 'ammeter_ac'
  | 'voltmeter_ac'
  | 'bridge_rectifier'
  | 'dc_link_cap'
  | 'voltmeter_dc'
  | 'ammeter_dc'
  | 'dpst_switch'
  | 'precharge_resistor'
  | 'brake_resistor'
  | 'ammeter_scap'
  | 'voltmeter_scap'
  | 'supercapacitor'
  | 'dcdc_converter'
  | 'motor_drive'
  | 'pmsm_motor'
  | 'ground_ac'
  | 'ground_dc';

export interface ComponentSpec {
  id: ComponentId;
  name: string;
  tag: string;
  category: 'SOURCE' | 'TRANSFORMATION' | 'PROTECTION' | 'RECTIFICATION' | 'FILTER' | 'STORAGE' | 'CONVERTER' | 'LOAD' | 'INSTRUMENT';
  symbolType: string;
  description: string;
  standardRating: string;
  editableParams: Record<string, { label: string; value: number | string; unit: string; min?: number; max?: number }>;
  iecReference: string;
}

export interface OscilloscopeSample {
  time: number;
  vac: number;
  iac: number;
  vrect: number;
  vdc: number;
  vscap: number;
  iscap: number;
  rpm: number;
  torque: number;
  power: number;
}
