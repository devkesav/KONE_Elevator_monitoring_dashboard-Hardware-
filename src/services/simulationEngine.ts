import type { ElectricalTelemetry, ElevatorMotionState, PowerFlowDirection } from '../types/electrical';

export interface SimulationConfig {
  acVoltagePri: number;    // 230V Single-Phase Grid
  acFreq: number;          // 50Hz
  transformerRatio: number;// 230V:12V = 19.167 (Step-Down)
  dcLinkCapacitance: number;// 0.015 F (15 mF)
  supercapCapacitance: number;// 58 Farad pack (6x 350F cells in series, 16.0V max)
  supercapEsr: number;     // 14.5 mOhm pack ESR
  brakeResistanceOhm: number; // 5.0 Ohm dynamic braking dump resistor
  ratedMotorRpm: number;   // 950 RPM
  maxPayloadKg: number;    // 800 kg
  counterweightKg: number; // 1050 kg
  emptyCabKg: number;      // 750 kg
}

export const DEFAULT_CONFIG: SimulationConfig = {
  acVoltagePri: 230,
  acFreq: 50,
  transformerRatio: 230 / 12, // 19.167
  dcLinkCapacitance: 0.015, // 15 mF
  supercapCapacitance: 58.0,
  supercapEsr: 0.0145, // 14.5 mOhm
  brakeResistanceOhm: 5.0, // 5 Ohm dump resistor
  ratedMotorRpm: 950,
  maxPayloadKg: 800,
  counterweightKg: 1050,
  emptyCabKg: 750,
};

export class ElectricalSimulationEngine {
  private config: SimulationConfig;
  private state: ElectricalTelemetry;
  private simTime: number = 0;
  private isRunning: boolean = true;
  private targetFloor: number = 4;
  private floorDistanceM: number = 3.5;
  private carLoadPayloadKg: number = 600;
  private speedMultiplier: number = 1.0;
  
  // Supercapacitor 2-Branch Physical Model Parameters (6S EDLC Bank: 10.5V - 16.0V)
  private scapOcv: number = 13.2;         // Open-circuit primary chemical voltage
  private scapDiffusionV: number = 13.1;  // Slow diffusion branch voltage (pore redistribution)
  private scapFilteredCurrent: number = 0; // Filtered current with inductive slew rate
  private scapTempC: number = 29.5;        // Cell pack temperature
  private scapCumulativeAh: number = 0;    // Amp-hour integration
  private scapCycleCounter: number = 142;  // Historical cycle counter
  private prechargeCompleted: boolean = true;
  
  // Dynamic Braking Dump Resistor State (5 Ohm)
  private brakeResistorTempC: number = 28.0; // Resistor temperature (°C)
  private brakeResistorPowerW: number = 0;   // Watts being dissipated as heat
  private brakeResistorCurrentA: number = 0; // Amps through resistor
  private brakeChopperActive: boolean = false;
  private chopperCycleTimer: number = 0;     // Hysteresis / PWM auto close-open cycle timer
  
  // Elevator Kinematics
  private carHeightM: number = 0;
  private carVel: number = 0;
  private motionPhaseTime: number = 0;
  
  // Faults
  private blownFuse: boolean = false;
  private mainSwitchOpen: boolean = false;
  private dpstSwitchOpen: boolean = false;
  private shortCircuitFault: boolean = false;
  private diodeFailedOpen: boolean = false;

  constructor(customConfig?: Partial<SimulationConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...customConfig };
    this.state = this.createInitialState();
  }

  private createInitialState(): ElectricalTelemetry {
    const ocv = this.scapOcv;
    const termV = ocv;
    const soc = Math.max(0, Math.min(100, ((ocv - 10.0) / (16.0 - 10.0)) * 100));
    const storedJoules = 0.5 * this.config.supercapCapacitance * Math.pow(ocv, 2);

    return {
      timestamp: Date.now(),
      vac_primary: 230.0,
      iac_primary: 0,
      freq_ac: 50.0,
      vac_secondary: 12.0,
      iac_secondary: 0,
      transformer_temp: 34.5,
      transformer_eff: 96.5,
      fuse_blown: false,
      main_switch_closed: true,
      dpst_switch_closed: true,
      precharge_active: false,
      v_rect_out: 15.6,
      i_rect_out: 0,
      diode_status: [true, true, true, true],
      rectifier_temp: 32.2,
      vdc_bus: 15.6,
      idc_bus: 0,
      pdc_bus: 0,
      vdc_ripple: 15,
      cap_stored_energy: 0.5 * this.config.dcLinkCapacitance * Math.pow(15.6, 2),
      dcdc_mode: 'STANDBY',
      dcdc_duty_cycle: 15,
      dcdc_current: 0,
      dcdc_temp: 31.1,
      v_scap: 13.2,
      v_scap_ocv: 13.2,
      i_scap: 0.0,
      soc_scap: 53.3,
      stored_energy_scap: Math.round(storedJoules),
      scap_stored_wh: Math.round((storedJoules / 3600) * 100) / 100,
      scap_power_w: 0,
      scap_ir_drop_v: 0,
      scap_esr_mohm: this.config.supercapEsr * 1000,
      scap_status: 'FLOAT',
      scap_temp: this.scapTempC,
      scap_cell_voltages: [2.21, 2.20, 2.22, 2.19, 2.21, 2.20],
      scap_cycles: this.scapCycleCounter,
      scap_coulombic_eff: 99.4,
      brake_resistor_active: false,
      brake_resistor_power_w: 0,
      brake_resistor_current: 0,
      brake_resistor_temp: 28.0,
      brake_chopper_closed: false,
      motor_speed_rpm: 0,
      motor_torque_nm: 1.2,
      motor_mech_power: 0,
      motor_current: 0,
      motor_direction: 'STOP',
      motor_temp: 32.0,
      regen_power_w: 0,
      car_floor: 1,
      car_position_m: 0,
      car_velocity_ms: 0,
      car_load_kg: this.carLoadPayloadKg,
      counterweight_kg: this.config.counterweightKg,
      motion_state: 'IDLE',
      power_flow: 'IDLE',
      fault_active: false,
      hardware_connected: false,

      // Diagram Architecture Telemetry (Dedicated to KONE Eco-Drive 400V Industrial View)
      v_grid_3ph: 400.0,
      i_rect_a: 0.0,
      p_grid_kw: 0.0,
      i_br_a: 0.0,
      p_br_kw: 0.0,
      chopper_state_text: 'chopper off',
      c_dc_mf: 4.7,
      i_dc_dcdc: -16.8,
      dcdc_duty_val: 0.24,
      dcdc_mode_desc: 'BOOST: discharging',
      v_scap_bank: 133.4,
      i_scap_bank: -72.0,
      p_scap_kw: -9.6,
      i_inv_a: 16.8,
      p_inv_kw: 9.3,
      iq_pk_a: 28.1,
      fe_hz: 12.8,
      vph_v: 219.0,
      mod_index: 0.68,
      rope_force_kn: 4.21,
      p_shaft_kw: 8.4,
      mechanical_state_text: 'MOTORING',
    };
  }

  public setSpeedMultiplier(mult: number) {
    this.speedMultiplier = mult;
  }

  public setCarLoad(kg: number) {
    this.carLoadPayloadKg = Math.max(0, Math.min(1000, kg));
  }

  public setTargetFloor(floor: number) {
    this.targetFloor = Math.max(1, Math.min(10, floor));
  }

  public toggleMainSwitch() {
    this.mainSwitchOpen = !this.mainSwitchOpen;
  }

  public toggleDpstSwitch() {
    this.dpstSwitchOpen = !this.dpstSwitchOpen;
  }

  public toggleFuseFault() {
    this.blownFuse = !this.blownFuse;
  }

  public toggleDiodeFault() {
    this.diodeFailedOpen = !this.diodeFailedOpen;
  }

  public toggleShortCircuit() {
    this.shortCircuitFault = !this.shortCircuitFault;
  }

  public setRunning(run: boolean) {
    this.isRunning = run;
  }

  public emergencyStop() {
    this.carVel = 0;
    this.state.motion_state = 'EMERGENCY_STOP';
    this.state.fault_active = true;
    this.state.fault_message = 'EMERGENCY STOP ENGAGED BY OPERATOR';
  }

  public resetAll() {
    this.blownFuse = false;
    this.mainSwitchOpen = false;
    this.dpstSwitchOpen = false;
    this.shortCircuitFault = false;
    this.diodeFailedOpen = false;
    this.carVel = 0;
    this.carHeightM = 0;
    this.targetFloor = 3;
    this.scapOcv = 13.2;
    this.scapDiffusionV = 13.1;
    this.scapFilteredCurrent = 0;
    this.brakeResistorTempC = 28.0;
    this.brakeResistorPowerW = 0;
    this.brakeResistorCurrentA = 0;
    this.brakeChopperActive = false;
    this.chopperCycleTimer = 0;
    this.state = this.createInitialState();
  }

  public setSupercapSoc(targetSocPercent: number) {
    const clampedSoc = Math.max(0, Math.min(100, targetSocPercent));
    this.scapOcv = 10.0 + (clampedSoc / 100) * 6.0;
    this.scapDiffusionV = this.scapOcv;
    this.scapFilteredCurrent = 0;
    if (clampedSoc >= 98) {
      this.scapOcv = 145.0;
      this.scapDiffusionV = 145.0;
    }
    this.update(0.01);
  }

  public updateHardwareTelemetry(raw: Partial<ElectricalTelemetry>) {
    this.state = {
      ...this.state,
      ...raw,
      hardware_connected: true,
      timestamp: Date.now(),
    };
  }

  public update(dtSeconds: number): ElectricalTelemetry {
    if (!this.isRunning) return this.state;

    const dt = dtSeconds * this.speedMultiplier;
    this.simTime += dt;

    // 1. Elevator Kinematics & Physical Load
    const targetHeight = (this.targetFloor - 1) * this.floorDistanceM;
    const heightDiff = targetHeight - this.carHeightM;
    const totalCarMass = this.config.emptyCabKg + this.carLoadPayloadKg;
    const cwMass = this.config.counterweightKg;
    const massImbalance = totalCarMass - cwMass;

    let desiredState: ElevatorMotionState = 'IDLE';
    const maxSpeed = 2.01; // m/s (KONE Eco-Drive 2.01 m/s rated speed)
    const accel = 0.8;    // m/s^2

    if (Math.abs(heightDiff) > 0.05 && this.state.motion_state !== 'EMERGENCY_STOP') {
      const movingUp = heightDiff > 0;
      const stoppingDistance = (this.carVel * this.carVel) / (2 * accel);

      if (movingUp) {
        if (Math.abs(heightDiff) <= stoppingDistance + 0.1) {
          desiredState = 'DECELERATING_UP';
          this.carVel = Math.max(0.1, this.carVel - accel * dt);
        } else if (this.carVel < maxSpeed) {
          desiredState = 'ACCELERATING_UP';
          this.carVel = Math.min(maxSpeed, this.carVel + accel * dt);
        } else {
          desiredState = 'CRUISING_UP';
          this.carVel = maxSpeed;
        }
        this.carHeightM += this.carVel * dt;
      } else {
        if (Math.abs(heightDiff) <= stoppingDistance + 0.1) {
          desiredState = 'DECELERATING_DOWN';
          this.carVel = Math.max(0.1, this.carVel - accel * dt);
        } else if (this.carVel < maxSpeed) {
          desiredState = 'ACCELERATING_DOWN';
          this.carVel = Math.min(maxSpeed, this.carVel + accel * dt);
        } else {
          desiredState = 'CRUISING_DOWN';
          this.carVel = maxSpeed;
        }
        this.carHeightM -= this.carVel * dt;
      }
    } else {
      desiredState = 'IDLE';
      this.carVel = 0;
      this.motionPhaseTime += dt;
      if (this.motionPhaseTime > 4.5 && this.state.motion_state === 'IDLE') {
        this.motionPhaseTime = 0;
        this.targetFloor = this.targetFloor >= 6 ? 1 : this.targetFloor + 2;
      }
    }

    const currentFloor = Math.max(1, Math.min(10, Math.round(this.carHeightM / this.floorDistanceM) + 1));

    // 2. Motor Power & Regeneration Calculation
    let mechanicalPowerW = 0;
    let motorTorqueNm = 0;
    let motorRpm = 0;
    let powerFlow: PowerFlowDirection = 'IDLE';
    let regenPowerW = 0;

    const g = 9.81;
    const sheaveRadiusM = 0.25;
    const gearRatio = 12.0;

    if (this.carVel > 0.01) {
      const isUp = desiredState.includes('UP');
      const isRegenCondition = (!isUp && massImbalance > 50) || (isUp && massImbalance < -50);
      const speedRatio = Math.min(1.0, this.carVel / maxSpeed);
      
      motorRpm = speedRatio * this.config.ratedMotorRpm;

      if (isRegenCondition) {
        powerFlow = 'REGENERATING';
        mechanicalPowerW = -Math.round(85 * speedRatio + 15);
        regenPowerW = Math.abs(mechanicalPowerW) * 0.88;
        motorTorqueNm = -(Math.round((Math.abs(mechanicalPowerW) * 9.5488 / Math.max(80, motorRpm)) * 10) / 10);
      } else {
        powerFlow = 'MOTORING';
        mechanicalPowerW = Math.round(115 * speedRatio + 20);
        regenPowerW = 0;
        motorTorqueNm = Math.round((mechanicalPowerW * 9.5488 / Math.max(80, motorRpm)) * 10) / 10;
      }
    } else {
      motorRpm = 0;
      motorTorqueNm = 0.8;
      mechanicalPowerW = 0;
      powerFlow = 'IDLE';
    }

    // 3. AC Mains Source & Transformer
    const noise = (Math.sin(this.simTime * 23) + Math.cos(this.simTime * 41)) * 0.008;
    const priVoltage = this.mainSwitchOpen || this.blownFuse ? 0 : this.config.acVoltagePri * (1 + noise * 0.5);
    const secVoltage = (this.mainSwitchOpen || this.blownFuse) ? 0 : (priVoltage / this.config.transformerRatio);

    // Full Wave Diode Bridge Rectifier
    const diodeDrop = 0.7;
    let rectOutV = 0;
    let diodeStatus: [boolean, boolean, boolean, boolean] = [false, false, false, false];

    if (secVoltage > 1.5 && !this.blownFuse && !this.mainSwitchOpen) {
      if (this.diodeFailedOpen) {
        rectOutV = Math.max(0, (secVoltage * Math.SQRT2 * 0.95 - diodeDrop));
        diodeStatus = [true, false, false, false];
      } else {
        // 3-Phase Diode Rectifier into DC Link: ~555.3V DC Bus
        rectOutV = Math.max(0, (secVoltage * Math.SQRT2 * 0.982 - 2 * diodeDrop));
        diodeStatus = [true, true, true, true];
      }
    }

    let vdcBus = rectOutV > 0 ? rectOutV : 0;

    // ==============================================================
    // 4. SUPERCAPACITOR & DYNAMIC BRAKING RESISTOR OVERFLOW DISSIPATION
    // ==============================================================
    let targetIScap = 0;
    let dcdcMode: 'BUCK' | 'BOOST' | 'STANDBY' = 'STANDBY';
    let brakePowerW = 0;
    let brakeCurrentA = 0;
    let chopperClosed = false;

    // Check if Supercapacitor Bank is 100% Fully Charged (15.8V or higher on 16V pack)
    const scapIsFull = this.scapOcv >= 15.8;

    if (!this.dpstSwitchOpen) {
      if (powerFlow === 'REGENERATING' && regenPowerW > 10) {
        if (!scapIsFull) {
          // NORMAL REGEN: Supercap absorbs regenerative braking energy (Buck charging)
          dcdcMode = 'BUCK';
          targetIScap = 2.5 * (Math.abs(this.carVel) / 2.01);
          brakePowerW = 0;
          brakeCurrentA = 0;
          chopperClosed = false;
          this.chopperCycleTimer = 0;
        } else {
          // OVERFLOW REGEN: Supercapacitor is 100% FULL!
          // Brake Chopper on the DC Link burns excess energy across the 5 Ohm dump resistor!
          dcdcMode = 'STANDBY';
          targetIScap = 0.0;
          this.scapFilteredCurrent = 0.0;
          
          chopperClosed = true;
          brakePowerW = Math.round(Math.pow(vdcBus, 2) / this.config.brakeResistanceOhm);
          brakeCurrentA = Math.sqrt(brakePowerW / this.config.brakeResistanceOhm);
        }
      } else if (scapIsFull && this.scapOcv >= 15.8) {
        // High voltage bleed on DC link
        dcdcMode = 'STANDBY';
        targetIScap = 0.0;
        this.scapFilteredCurrent = 0.0;
        chopperClosed = true;
        brakePowerW = Math.round(Math.pow(vdcBus, 2) / this.config.brakeResistanceOhm);
        brakeCurrentA = Math.sqrt(brakePowerW / this.config.brakeResistanceOhm);
      } else if (powerFlow === 'MOTORING' && Math.abs(this.carVel) > 0.05 && this.scapOcv > 10.5) {
        this.chopperCycleTimer = 0;
        // Motoring: DC-DC operates in BOOST mode (discharging assisting DC bus)
        dcdcMode = 'BOOST';
        targetIScap = -3.8 * (Math.abs(this.carVel) / 2.01);
        brakePowerW = 0;
        brakeCurrentA = 0;
        chopperClosed = false;
      } else {
        this.chopperCycleTimer = 0;
        dcdcMode = 'STANDBY';
        targetIScap = 0.0;
        brakePowerW = 0;
        brakeCurrentA = 0;
        chopperClosed = false;
      }
    } else {
      this.chopperCycleTimer = 0;
      dcdcMode = 'STANDBY';
      targetIScap = 0.0;
      this.scapFilteredCurrent = 0.0;
      brakePowerW = 0;
      brakeCurrentA = 0;
      chopperClosed = false;
    }

    // Physical Current Inductance Slew Rate Filtering: dI/dt = (I_target - I_current) / tau_L
    const tauCurrent = 0.06;
    if (scapIsFull && targetIScap <= 0.01) {
      this.scapFilteredCurrent = 0.0;
    } else {
      this.scapFilteredCurrent += (targetIScap - this.scapFilteredCurrent) * (dt / tauCurrent);
    }
    const iScap = Math.abs(this.scapFilteredCurrent) < 0.05 ? 0.0 : this.scapFilteredCurrent;

    // Dynamic Braking Dump Resistor Thermal Dissipation Model (5 Ohm Resistor)
    this.brakeResistorPowerW = brakePowerW;
    this.brakeResistorCurrentA = brakeCurrentA;
    this.brakeChopperActive = chopperClosed;
    const ambTemp = 25.0;
    const cThermalRes = 25.0;  // Wirewound brake resistor
    const rThermalRes = 0.65;
    const dTempRes = (brakePowerW - (this.brakeResistorTempC - ambTemp) / rThermalRes) * (dt / cThermalRes);
    this.brakeResistorTempC = Math.max(25.0, Math.min(260.0, this.brakeResistorTempC + dTempRes));

    // 2-Branch EDLC Integration (16V bank):
    const c1 = this.config.supercapCapacitance * 0.88;
    const c2 = this.config.supercapCapacitance * 0.12;
    const rDiff = 1.4;

    const iDiff = (this.scapOcv - this.scapDiffusionV) / rDiff;
    const dOcv = ((iScap - iDiff) * dt) / c1;
    const dDiffV = (iDiff * dt) / c2;

    this.scapOcv += dOcv;
    this.scapDiffusionV += dDiffV;

    // Strict Voltage Clamping: 10.0V to 16.0V
    this.scapOcv = Math.max(10.0, Math.min(16.0, this.scapOcv));
    this.scapDiffusionV = Math.max(10.0, Math.min(16.0, this.scapDiffusionV));

    // Instantaneous Loaded Terminal Voltage with IR Step
    const scapEsr = this.config.supercapEsr;
    const irDrop = iScap * scapEsr;
    const termVoltage = Math.max(10.0, Math.min(16.2, this.scapOcv + irDrop));

    // Supercap Cell Pack Thermal Model
    const pLossW = Math.pow(iScap, 2) * scapEsr;
    const cThermal = 120.0;
    const rThermal = 3.5;
    const dTemp = (pLossW - (this.scapTempC - ambTemp) / rThermal) * (dt / cThermal);
    this.scapTempC += dTemp;

    // Amp-Hour integration & Cycles counting
    const deltaAh = Math.abs(iScap * dt) / 3600;
    this.scapCumulativeAh += deltaAh;
    if (this.scapCumulativeAh > 1.5) {
      this.scapCumulativeAh = 0;
      this.scapCycleCounter++;
    }

    // Energy Calculations: E = 0.5 * C * V^2
    const storedJoules = 0.5 * this.config.supercapCapacitance * Math.pow(this.scapOcv, 2);
    const storedWh = storedJoules / 3600;
    const scapPowerW = termVoltage * iScap;

    // State of Charge (SOC): 10.0V (0%) to 16.0V (100%)
    const soc = Math.max(0, Math.min(100, ((this.scapOcv - 10.0) / (16.0 - 10.0)) * 100));

    // 6-Series Cells Balancing Array (2.7V nominal per cell)
    const nominalCellV = this.scapOcv / 6;
    const cellVoltages = [
      Math.round((nominalCellV + 0.012) * 1000) / 1000,
      Math.round((nominalCellV - 0.015) * 1000) / 1000,
      Math.round((nominalCellV + 0.008) * 1000) / 1000,
      Math.round((nominalCellV + 0.018) * 1000) / 1000,
      Math.round((nominalCellV - 0.011) * 1000) / 1000,
      Math.round((nominalCellV - 0.005) * 1000) / 1000,
    ];

    // Status label
    let scapStatus: 'CHARGING' | 'DISCHARGING' | 'FLOAT' | 'ISOLATED' = 'FLOAT';
    if (this.dpstSwitchOpen) scapStatus = 'ISOLATED';
    else if (iScap > 0.8) scapStatus = 'CHARGING';
    else if (iScap < -0.8) scapStatus = 'DISCHARGING';
    else scapStatus = 'FLOAT';

    // 5. DC Bus Total Power & Grid Current Demands
    const netElectricalDemandW = Math.max(0, mechanicalPowerW - (dcdcMode === 'BOOST' ? Math.abs(scapPowerW) : 0));
    const totalDcPowerW = netElectricalDemandW + (dcdcMode === 'BUCK' ? 0 : 35);
    const idcBus = vdcBus > 0 ? (totalDcPowerW / vdcBus) : 0;
    const priPowerW = totalDcPowerW / 0.92;
    const priCurrent = priVoltage > 0 ? (priPowerW / priVoltage) : 0;
    const secCurrent = secVoltage > 0 ? (totalDcPowerW / secVoltage) : 0;

    let faultActive = this.blownFuse || this.shortCircuitFault || this.diodeFailedOpen;
    let faultMsg = '';
    if (this.blownFuse) faultMsg = 'FUSE TRIPPED: OVERCURRENT IN SECONDARY WINDING';
    else if (this.shortCircuitFault) faultMsg = 'SHORT CIRCUIT DETECTED ON DC BUS';
    else if (this.diodeFailedOpen) faultMsg = 'RECTIFIER DIODE D2 OPEN FAULT';
    else if (this.state.fault_active && this.state.motion_state === 'EMERGENCY_STOP') {
      faultActive = true;
      faultMsg = this.state.fault_message || 'EMERGENCY STOP ACTIVE';
    }

    this.state = {
      timestamp: Date.now(),
      vac_primary: Math.round(priVoltage * 10) / 10,
      iac_primary: Math.round(priCurrent * 100) / 100,
      freq_ac: 50.0 + (noise * 2),
      vac_secondary: Math.round(secVoltage * 10) / 10,
      iac_secondary: Math.round(secCurrent * 100) / 100,
      transformer_temp: 34.5 + (priCurrent * 1.8),
      transformer_eff: 96.5,
      fuse_blown: this.blownFuse,
      main_switch_closed: !this.mainSwitchOpen,
      dpst_switch_closed: !this.dpstSwitchOpen,
      precharge_active: !this.prechargeCompleted,
      v_rect_out: Math.round(rectOutV * 10) / 10,
      i_rect_out: Math.round(idcBus * 100) / 100,
      diode_status: diodeStatus,
      rectifier_temp: 36.2 + (idcBus * 1.2),
      vdc_bus: Math.round(vdcBus * 10) / 10,
      idc_bus: Math.round(idcBus * 100) / 100,
      pdc_bus: Math.round(totalDcPowerW),
      vdc_ripple: Math.round((idcBus / (2 * 50 * this.config.dcLinkCapacitance * 1000)) * 100) / 10,
      cap_stored_energy: Math.round(0.5 * this.config.dcLinkCapacitance * Math.pow(vdcBus, 2) * 10) / 10,
      dcdc_mode: dcdcMode,
      dcdc_duty_cycle: Math.round((termVoltage / Math.max(1, vdcBus)) * 100),
      dcdc_current: Math.round(iScap * 100) / 100,
      dcdc_temp: 33.1 + Math.abs(iScap) * 0.4,
      v_scap: Math.round(termVoltage * 100) / 100,
      v_scap_ocv: Math.round(this.scapOcv * 100) / 100,
      i_scap: Math.round(iScap * 100) / 100,
      soc_scap: Math.round(soc * 10) / 10,
      stored_energy_scap: Math.round(storedJoules),
      scap_stored_wh: Math.round(storedWh * 100) / 100,
      scap_power_w: Math.round(scapPowerW * 10) / 10,
      scap_ir_drop_v: Math.round(irDrop * 1000) / 1000,
      scap_esr_mohm: Math.round(scapEsr * 1000 * 10) / 10,
      scap_status: scapStatus,
      scap_temp: Math.round(this.scapTempC * 10) / 10,
      scap_cell_voltages: cellVoltages,
      scap_cycles: this.scapCycleCounter,
      scap_coulombic_eff: 99.4,
      brake_resistor_active: this.brakeChopperActive,
      brake_resistor_power_w: Math.round(this.brakeResistorPowerW),
      brake_resistor_current: Math.round(this.brakeResistorCurrentA * 10) / 10,
      brake_resistor_temp: Math.round(this.brakeResistorTempC * 10) / 10,
      brake_chopper_closed: this.brakeChopperActive,
      motor_speed_rpm: Math.round(motorRpm),
      motor_torque_nm: Math.round(motorTorqueNm * 10) / 10,
      motor_mech_power: Math.round(mechanicalPowerW),
      motor_current: Math.round((Math.abs(mechanicalPowerW) / Math.max(1, vdcBus)) * 100) / 100,
      motor_direction: desiredState.includes('UP') ? 'CW' : desiredState.includes('DOWN') ? 'CCW' : 'STOP',
      motor_temp: 38.0 + (Math.abs(mechanicalPowerW) / 300),
      regen_power_w: Math.round(regenPowerW),
      car_floor: currentFloor,
      car_position_m: Math.round(this.carHeightM * 100) / 100,
      car_velocity_ms: Math.round(this.carVel * 100) / 100,
      car_load_kg: this.carLoadPayloadKg,
      counterweight_kg: this.config.counterweightKg,
      motion_state: desiredState,
      power_flow: powerFlow,
      fault_active: faultActive,
      fault_message: faultMsg,
      hardware_connected: false,

      // Diagram Architecture Telemetry
      v_grid_3ph: 400.0,
      i_rect_a: (!this.mainSwitchOpen && !this.blownFuse && (this.dpstSwitchOpen || soc < 5.0)) ? Math.round((Math.abs(mechanicalPowerW) / 400) * 10) / 10 : 0.0,
      p_grid_kw: (!this.mainSwitchOpen && !this.blownFuse && (this.dpstSwitchOpen || soc < 5.0)) ? Math.round((Math.abs(mechanicalPowerW) / 1000) * 10) / 10 : 0.0,
      i_br_a: Math.round(this.brakeResistorCurrentA * 10) / 10,
      p_br_kw: Math.round((this.brakeResistorPowerW / 1000) * 10) / 10,
      chopper_state_text: this.brakeChopperActive ? 'chopper active' : 'chopper off',
      c_dc_mf: 4.7,
      i_dc_dcdc: powerFlow === 'MOTORING' 
        ? -Math.round((Math.abs(this.carVel) / 2.01 * 16.8) * 10) / 10
        : powerFlow === 'REGENERATING' && !this.brakeChopperActive
        ? Math.round((Math.abs(this.carVel) / 2.01 * 11.7) * 10) / 10
        : 0.0,
      dcdc_duty_val: 0.24,
      dcdc_mode_desc: powerFlow === 'MOTORING' && Math.abs(this.carVel) > 0.05
        ? 'BOOST: discharging'
        : powerFlow === 'REGENERATING' && !this.brakeChopperActive
        ? 'BUCK: charging'
        : 'STANDBY',
      v_scap_bank: Math.round(termVoltage * 10) / 10,
      i_scap_bank: Math.round(iScap * 10) / 10,
      p_scap_kw: Math.round((scapPowerW / 1000) * 10) / 10,
      i_inv_a: Math.round((Math.abs(this.carVel) / 2.01 * 16.8) * 10) / 10,
      p_inv_kw: Math.round((Math.abs(this.carVel) / 2.01 * 9.3) * 10) / 10,
      iq_pk_a: Math.round((Math.abs(this.carVel) / 2.01 * 28.1) * 10) / 10,
      fe_hz: Math.round((Math.abs(this.carVel) / 2.01 * 12.8) * 10) / 10,
      vph_v: Math.round((Math.abs(this.carVel) / 2.01 * 219.0)),
      mod_index: Math.round((Math.abs(this.carVel) / 2.01 * 0.68) * 100) / 100,
      rope_force_kn: Math.abs(this.carVel) > 0.05 ? 4.21 : 0.0,
      p_shaft_kw: powerFlow === 'MOTORING'
        ? Math.round((Math.abs(this.carVel) / 2.01 * 8.4) * 10) / 10
        : powerFlow === 'REGENERATING'
        ? -Math.round((Math.abs(this.carVel) / 2.01 * 7.5) * 10) / 10
        : 0.0,
      mechanical_state_text: powerFlow === 'MOTORING' ? 'MOTORING' : powerFlow === 'REGENERATING' ? 'REGENERATING' : 'IDLE',
    };

    return this.state;
  }

  public getState(): ElectricalTelemetry {
    return this.state;
  }
}
