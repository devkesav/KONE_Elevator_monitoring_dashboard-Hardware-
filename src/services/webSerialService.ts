import type { ElectricalTelemetry } from '../types/electrical';

export class WebSerialService {
  private port: any = null;
  private reader: any = null;
  private isConnected: boolean = false;
  private onDataCallback: ((data: Partial<ElectricalTelemetry>) => void) | null = null;
  private onStatusChangeCallback: ((connected: boolean, error?: string) => void) | null = null;
  private buffer: string = '';

  public isSupported(): boolean {
    return 'serial' in navigator;
  }

  public getConnectionStatus(): boolean {
    return this.isConnected;
  }

  public setCallbacks(
    onData: (data: Partial<ElectricalTelemetry>) => void,
    onStatusChange: (connected: boolean, error?: string) => void
  ) {
    this.onDataCallback = onData;
    this.onStatusChangeCallback = onStatusChange;
  }

  public async connect(baudRate: number = 115200): Promise<boolean> {
    if (!this.isSupported()) {
      if (this.onStatusChangeCallback) {
        this.onStatusChangeCallback(false, 'WebSerial API not supported in this browser. Please use Chrome, Edge, or Opera.');
      }
      return false;
    }

    try {
      // @ts-ignore
      this.port = await navigator.serial.requestPort();
      await this.port.open({ baudRate });
      this.isConnected = true;
      if (this.onStatusChangeCallback) {
        this.onStatusChangeCallback(true);
      }
      this.startReading();
      return true;
    } catch (err: any) {
      console.error('Serial connection error:', err);
      this.isConnected = false;
      if (this.onStatusChangeCallback) {
        this.onStatusChangeCallback(false, err?.message || 'Connection failed');
      }
      return false;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      if (this.reader) {
        await this.reader.cancel();
        this.reader = null;
      }
      if (this.port) {
        await this.port.close();
        this.port = null;
      }
      this.isConnected = false;
      if (this.onStatusChangeCallback) {
        this.onStatusChangeCallback(false);
      }
    } catch (err) {
      console.error('Error during disconnect:', err);
    }
  }

  private async startReading() {
    const textDecoder = new TextDecoderStream();
    if (!this.port || !this.port.readable) return;

    const readableStreamClosed = this.port.readable.pipeTo(textDecoder.writable);
    this.reader = textDecoder.readable.getReader();

    try {
      while (true) {
        const { value, done } = await this.reader.read();
        if (done) break;
        if (value) {
          this.buffer += value;
          this.processBuffer();
        }
      }
    } catch (err) {
      console.error('Serial reading error:', err);
      this.isConnected = false;
      if (this.onStatusChangeCallback) {
        this.onStatusChangeCallback(false, 'Serial connection lost');
      }
    } finally {
      this.reader.releaseLock();
    }
  }

  private processBuffer() {
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() || ''; // keep incomplete line

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      this.parseTelemetryLine(trimmed);
    }
  }

  private parseTelemetryLine(line: string) {
    try {
      // Try JSON format: {"vac":230.1,"iac":2.4,"vdc":15.8,"idc":4.6,"vsc":14.1,"isc":-2.1,"rpm":760,"torque":8.2}
      if (line.startsWith('{') && line.endsWith('}')) {
        const json = JSON.parse(line);
        const mapped: Partial<ElectricalTelemetry> = {};
        if (json.vac !== undefined) mapped.vac_primary = Number(json.vac);
        if (json.iac !== undefined) mapped.iac_primary = Number(json.iac);
        if (json.vsec !== undefined) mapped.vac_secondary = Number(json.vsec);
        if (json.vdc !== undefined) mapped.vdc_bus = Number(json.vdc);
        if (json.idc !== undefined) mapped.idc_bus = Number(json.idc);
        if (json.vsc !== undefined) mapped.v_scap = Number(json.vsc);
        if (json.isc !== undefined) mapped.i_scap = Number(json.isc);
        if (json.rpm !== undefined) mapped.motor_speed_rpm = Number(json.rpm);
        if (json.torque !== undefined) mapped.motor_torque_nm = Number(json.torque);
        if (json.floor !== undefined) mapped.car_floor = Number(json.floor);
        
        if (this.onDataCallback) {
          this.onDataCallback(mapped);
        }
      }
    } catch (e) {
      // Ignore malformed line
    }
  }
}
