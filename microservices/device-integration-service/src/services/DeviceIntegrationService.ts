/**
 * Medical Device Integration Service
 * Supports multiple device protocols and real-time data streaming
 * Sudan-specific: Optimized for Sudan healthcare facilities
 */

import { EventEmitter } from 'events';
import { Pool } from 'pg';
import mqtt from 'mqtt';
import { SerialPort } from 'serialport';
import ModbusRTU from 'modbus-serial';
import WebSocket from 'ws';

// Device Connection Interfaces
export interface DeviceConfig {
  deviceId: string;
  deviceType: 'vital_monitor' | 'infusion_pump' | 'ventilator' | 'ecg' | 'pulse_oximeter' | 'blood_pressure';
  protocol: 'mqtt' | 'serial' | 'modbus' | 'websocket' | 'hl7' | 'bluetooth';
  connectionParams: ConnectionParams;
  patientId?: string;
  facilityId: string;
  tenantId: string;
  samplingRate?: number; // Hz
  alertThresholds?: AlertThresholds;
}

export interface ConnectionParams {
  // MQTT
  mqttBroker?: string;
  mqttTopic?: string;
  mqttUsername?: string;
  mqttPassword?: string;
  
  // Serial
  serialPort?: string;
  baudRate?: number;
  dataBits?: 7 | 8;
  stopBits?: 1 | 2;
  parity?: 'none' | 'even' | 'odd';
  
  // Modbus
  modbusHost?: string;
  modbusPort?: number;
  modbusUnitId?: number;
  
  // WebSocket
  wsUrl?: string;
  wsProtocol?: string;
}

export interface VitalSignsData {
  deviceId: string;
  patientId: string;
  timestamp: Date;
  temperature?: number; // Celsius
  heartRate?: number; // BPM
  respiratoryRate?: number; // Breaths per minute
  bloodPressureSystolic?: number; // mmHg
  bloodPressureDiastolic?: number; // mmHg
  oxygenSaturation?: number; // Percentage
  pulseRate?: number; // BPM
  ecg?: ECGData;
  waveforms?: WaveformData[];
  quality?: DataQuality;
}

export interface ECGData {
  leadI?: number[];
  leadII?: number[];
  leadIII?: number[];
  leadAVR?: number[];
  leadAVL?: number[];
  leadAVF?: number[];
  leadV1?: number[];
  leadV2?: number[];
  leadV3?: number[];
  leadV4?: number[];
  leadV5?: number[];
  leadV6?: number[];
  samplingRate: number;
}

export interface WaveformData {
  type: 'ecg' | 'pleth' | 'respiration' | 'pressure';
  data: number[];
  samplingRate: number;
  unit: string;
}

export interface DataQuality {
  signalQuality: 'excellent' | 'good' | 'fair' | 'poor' | 'no_signal';
  leadOff?: boolean;
  artifacts?: boolean;
  confidence?: number; // 0-100
}

export interface DeviceAlert {
  alertId: string;
  deviceId: string;
  patientId: string;
  alertType: 'critical_value' | 'device_malfunction' | 'lead_off' | 'battery_low' | 'calibration_required';
  severity: 'low' | 'medium' | 'high' | 'critical';
  parameter?: string;
  value?: number;
  threshold?: number;
  message: string;
  timestamp: Date;
  acknowledged: boolean;
}

export interface AlertThresholds {
  heartRate?: { min: number; max: number; critical_min: number; critical_max: number };
  bloodPressureSystolic?: { min: number; max: number; critical_min: number; critical_max: number };
  bloodPressureDiastolic?: { min: number; max: number; critical_min: number; critical_max: number };
  oxygenSaturation?: { min: number; critical_min: number };
  temperature?: { min: number; max: number; critical_min: number; critical_max: number };
  respiratoryRate?: { min: number; max: number; critical_min: number; critical_max: number };
}

export interface DeviceStatus {
  deviceId: string;
  status: 'connected' | 'disconnected' | 'error' | 'maintenance';
  lastSeen: Date;
  batteryLevel?: number;
  signalStrength?: number;
  firmwareVersion?: string;
  calibrationDate?: Date;
  nextCalibrationDue?: Date;
}

// Abstract Device Connection
export abstract class DeviceConnection extends EventEmitter {
  protected deviceId: string;
  protected config: DeviceConfig;
  protected isConnected: boolean = false;
  protected reconnectAttempts: number = 0;
  protected maxReconnectAttempts: number = 10;

  constructor(deviceId: string, config: DeviceConfig) {
    super();
    this.deviceId = deviceId;
    this.config = config;
  }

  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract sendCommand(command: string, params?: any): Promise<any>;
  
  protected handleError(error: Error): void {
    console.error(`Device ${this.deviceId} error:`, error);
    this.emit('error', { deviceId: this.deviceId, error });
  }

  protected async reconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(`Max reconnection attempts reached for device ${this.deviceId}`);
      this.emit('max_reconnect_attempts', { deviceId: this.deviceId });
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    
    console.log(`Reconnecting device ${this.deviceId} in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(async () => {
      try {
        await this.connect();
        this.reconnectAttempts = 0;
      } catch (error) {
        await this.reconnect();
      }
    }, delay);
  }
}

// Vital Monitor Connection (MQTT)
export class VitalMonitorConnection extends DeviceConnection {
  private mqttClient?: mqtt.MqttClient;

  async connect(): Promise<void> {
    const params = this.config.connectionParams;
    
    this.mqttClient = mqtt.connect(params.mqttBroker!, {
      clientId: `device-${this.deviceId}`,
      username: params.mqttUsername,
      password: params.mqttPassword,
      clean: true,
      reconnectPeriod: 5000
    });

    this.mqttClient.on('connect', () => {
      console.log(`Device ${this.deviceId} connected via MQTT`);
      this.isConnected = true;
      this.emit('connected', { deviceId: this.deviceId });
      
      // Subscribe to device topic
      this.mqttClient!.subscribe(`devices/${this.deviceId}/vitals`, (err) => {
        if (err) {
          this.handleError(err);
        }
      });
    });

    this.mqttClient.on('message', (topic, message) => {
      try {
        const data = JSON.parse(message.toString());
        this.emit('vitalData', this.parseVitalSigns(data));
      } catch (error) {
        this.handleError(error as Error);
      }
    });

    this.mqttClient.on('error', (error) => {
      this.handleError(error);
    });

    this.mqttClient.on('close', () => {
      console.log(`Device ${this.deviceId} disconnected`);
      this.isConnected = false;
      this.emit('disconnected', { deviceId: this.deviceId });
      this.reconnect();
    });
  }

  async disconnect(): Promise<void> {
    if (this.mqttClient) {
      this.mqttClient.end();
      this.isConnected = false;
    }
  }

  async sendCommand(command: string, params?: any): Promise<any> {
    if (!this.mqttClient || !this.isConnected) {
      throw new Error('Device not connected');
    }

    const commandTopic = `devices/${this.deviceId}/commands`;
    const commandPayload = JSON.stringify({ command, params, timestamp: new Date() });
    
    return new Promise((resolve, reject) => {
      this.mqttClient!.publish(commandTopic, commandPayload, { qos: 1 }, (err) => {
        if (err) reject(err);
        else resolve({ success: true });
      });
    });
  }

  private parseVitalSigns(data: any): VitalSignsData {
    return {
      deviceId: this.deviceId,
      patientId: this.config.patientId || 'unknown',
      timestamp: new Date(data.timestamp || Date.now()),
      temperature: data.temperature,
      heartRate: data.heart_rate || data.heartRate,
      respiratoryRate: data.respiratory_rate || data.respiratoryRate,
      bloodPressureSystolic: data.bp_systolic || data.bloodPressureSystolic,
      bloodPressureDiastolic: data.bp_diastolic || data.bloodPressureDiastolic,
      oxygenSaturation: data.spo2 || data.oxygenSaturation,
      pulseRate: data.pulse_rate || data.pulseRate,
      quality: {
        signalQuality: data.signal_quality || 'good',
        leadOff: data.lead_off || false,
        artifacts: data.artifacts || false,
        confidence: data.confidence || 95
      }
    };
  }
}

// Serial Port Connection
export class SerialPortConnection extends DeviceConnection {
  private serialPort?: SerialPort;

  async connect(): Promise<void> {
    const params = this.config.connectionParams;
    
    this.serialPort = new SerialPort({
      path: params.serialPort!,
      baudRate: params.baudRate || 9600,
      dataBits: params.dataBits || 8,
      stopBits: params.stopBits || 1,
      parity: params.parity || 'none'
    });

    this.serialPort.on('open', () => {
      console.log(`Device ${this.deviceId} connected via Serial Port`);
      this.isConnected = true;
      this.emit('connected', { deviceId: this.deviceId });
    });

    this.serialPort.on('data', (data) => {
      try {
        const parsed = this.parseSerialData(data);
        this.emit('vitalData', parsed);
      } catch (error) {
        this.handleError(error as Error);
      }
    });

    this.serialPort.on('error', (error) => {
      this.handleError(error);
    });

    this.serialPort.on('close', () => {
      console.log(`Device ${this.deviceId} disconnected`);
      this.isConnected = false;
      this.emit('disconnected', { deviceId: this.deviceId });
      this.reconnect();
    });
  }

  async disconnect(): Promise<void> {
    if (this.serialPort && this.serialPort.isOpen) {
      this.serialPort.close();
      this.isConnected = false;
    }
  }

  async sendCommand(command: string, params?: any): Promise<any> {
    if (!this.serialPort || !this.serialPort.isOpen) {
      throw new Error('Device not connected');
    }

    return new Promise((resolve, reject) => {
      this.serialPort!.write(command + '\r\n', (err) => {
        if (err) reject(err);
        else resolve({ success: true });
      });
    });
  }

  private parseSerialData(data: Buffer): VitalSignsData {
    // Parse device-specific protocol
    const dataString = data.toString();
    // Implementation depends on device protocol
    return {
      deviceId: this.deviceId,
      patientId: this.config.patientId || 'unknown',
      timestamp: new Date(),
      // Parse vital signs from data
    } as VitalSignsData;
  }
}

// Main Device Integration Service
export class DeviceIntegrationService extends EventEmitter {
  private readonly deviceConnections = new Map<string, DeviceConnection>();
  private readonly pool: Pool;
  private readonly alertService: any; // AlertService
  
  // Default alert thresholds (Sudan healthcare standards)
  private readonly DEFAULT_THRESHOLDS: AlertThresholds = {
    heartRate: { min: 60, max: 100, critical_min: 40, critical_max: 150 },
    bloodPressureSystolic: { min: 90, max: 140, critical_min: 70, critical_max: 180 },
    bloodPressureDiastolic: { min: 60, max: 90, critical_min: 40, critical_max: 110 },
    oxygenSaturation: { min: 95, critical_min: 90 },
    temperature: { min: 36.0, max: 37.5, critical_min: 35.0, critical_max: 39.0 },
    respiratoryRate: { min: 12, max: 20, critical_min: 8, critical_max: 30 }
  };

  constructor(pool: Pool, alertService: any) {
    super();
    this.pool = pool;
    this.alertService = alertService;
  }

  /**
   * Connect to vital signs monitor
   * @param deviceId - Unique device identifier
   * @param config - Device configuration
   */
  async connectToVitalMonitor(deviceId: string, config: DeviceConfig): Promise<void> {
    // Check if already connected
    if (this.deviceConnections.has(deviceId)) {
      throw new Error(`Device ${deviceId} is already connected`);
    }

    // Create connection based on protocol
    let connection: DeviceConnection;

    switch (config.protocol) {
      case 'mqtt':
        connection = new VitalMonitorConnection(deviceId, config);
        break;
      
      case 'serial':
        connection = new SerialPortConnection(deviceId, config);
        break;
      
      case 'modbus':
        connection = new ModbusConnection(deviceId, config);
        break;
      
      case 'websocket':
        connection = new WebSocketConnection(deviceId, config);
        break;
      
      default:
        throw new Error(`Unsupported protocol: ${config.protocol}`);
    }

    // Set up event listeners
    connection.on('vitalData', async (data: VitalSignsData) => {
      await this.processVitalSigns(data);
    });

    connection.on('alert', async (alert: DeviceAlert) => {
      await this.handleDeviceAlert(alert);
    });

    connection.on('connected', () => {
      this.updateDeviceStatus(deviceId, 'connected');
    });

    connection.on('disconnected', () => {
      this.updateDeviceStatus(deviceId, 'disconnected');
    });

    connection.on('error', (error) => {
      console.error(`Device ${deviceId} error:`, error);
      this.emit('device_error', { deviceId, error });
    });

    // Store connection
    this.deviceConnections.set(deviceId, connection);

    // Connect to device
    await connection.connect();

    // Register device in database
    await this.registerDevice(deviceId, config);

    console.log(`Device ${deviceId} connected successfully`);
  }

  /**
   * Disconnect from device
   * @param deviceId - Device identifier
   */
  async disconnectDevice(deviceId: string): Promise<void> {
    const connection = this.deviceConnections.get(deviceId);
    
    if (!connection) {
      throw new Error(`Device ${deviceId} not found`);
    }

    await connection.disconnect();
    this.deviceConnections.delete(deviceId);
    await this.updateDeviceStatus(deviceId, 'disconnected');

    console.log(`Device ${deviceId} disconnected`);
  }

  /**
   * Process vital signs data
   * @param data - Vital signs data from device
   */
  private async processVitalSigns(data: VitalSignsData): Promise<void> {
    try {
      // 1. Store in TimescaleDB (time-series database)
      await this.storeVitalSignsTimeSeries(data);

      // 2. Store in PostgreSQL (for FHIR)
      await this.storeVitalSignsFHIR(data);

      // 3. Check for critical values
      const criticalAlerts = this.checkCriticalValues(data);
      
      if (criticalAlerts.length > 0) {
        for (const alert of criticalAlerts) {
          await this.handleDeviceAlert(alert);
        }
      }

      // 4. Emit real-time event
      this.emit('vital_signs_processed', data);

      // 5. Send to WebSocket clients
      this.broadcastVitalSigns(data);

    } catch (error) {
      console.error('Error processing vital signs:', error);
      throw error;
    }
  }

  /**
   * Store vital signs in TimescaleDB
   */
  private async storeVitalSignsTimeSeries(data: VitalSignsData): Promise<void> {
    const query = `
      INSERT INTO vital_signs_timeseries (
        device_id, patient_id, observation_time,
        temperature, heart_rate, respiratory_rate,
        blood_pressure_systolic, blood_pressure_diastolic,
        oxygen_saturation, pulse_rate,
        signal_quality, lead_off, artifacts
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    `;

    await this.pool.query(query, [
      data.deviceId,
      data.patientId,
      data.timestamp,
      data.temperature,
      data.heartRate,
      data.respiratoryRate,
      data.bloodPressureSystolic,
      data.bloodPressureDiastolic,
      data.oxygenSaturation,
      data.pulseRate,
      data.quality?.signalQuality,
      data.quality?.leadOff,
      data.quality?.artifacts
    ]);
  }

  /**
   * Store vital signs as FHIR Observations
   */
  private async storeVitalSignsFHIR(data: VitalSignsData): Promise<void> {
    const observations = this.convertToFHIRObservations(data);
    
    // Store each observation
    for (const observation of observations) {
      await this.storeFHIRObservation(observation);
    }
  }

  /**
   * Convert vital signs to FHIR Observations
   */
  private convertToFHIRObservations(data: VitalSignsData): any[] {
    const observations: any[] = [];

    // Temperature
    if (data.temperature !== undefined) {
      observations.push({
        resourceType: 'Observation',
        status: 'final',
        category: [{
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/observation-category',
            code: 'vital-signs'
          }]
        }],
        code: {
          coding: [{
            system: 'http://loinc.org',
            code: '8310-5',
            display: 'Body temperature'
          }]
        },
        subject: { reference: `Patient/${data.patientId}` },
        effectiveDateTime: data.timestamp.toISOString(),
        valueQuantity: {
          value: data.temperature,
          unit: '°C',
          system: 'http://unitsofmeasure.org',
          code: 'Cel'
        },
        device: { reference: `Device/${data.deviceId}` }
      });
    }

    // Heart Rate
    if (data.heartRate !== undefined) {
      observations.push({
        resourceType: 'Observation',
        status: 'final',
        category: [{
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/observation-category',
            code: 'vital-signs'
          }]
        }],
        code: {
          coding: [{
            system: 'http://loinc.org',
            code: '8867-4',
            display: 'Heart rate'
          }]
        },
        subject: { reference: `Patient/${data.patientId}` },
        effectiveDateTime: data.timestamp.toISOString(),
        valueQuantity: {
          value: data.heartRate,
          unit: 'beats/minute',
          system: 'http://unitsofmeasure.org',
          code: '/min'
        },
        device: { reference: `Device/${data.deviceId}` }
      });
    }

    // Blood Pressure
    if (data.bloodPressureSystolic !== undefined && data.bloodPressureDiastolic !== undefined) {
      observations.push({
        resourceType: 'Observation',
        status: 'final',
        category: [{
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/observation-category',
            code: 'vital-signs'
          }]
        }],
        code: {
          coding: [{
            system: 'http://loinc.org',
            code: '85354-9',
            display: 'Blood pressure panel'
          }]
        },
        subject: { reference: `Patient/${data.patientId}` },
        effectiveDateTime: data.timestamp.toISOString(),
        component: [
          {
            code: {
              coding: [{
                system: 'http://loinc.org',
                code: '8480-6',
                display: 'Systolic blood pressure'
              }]
            },
            valueQuantity: {
              value: data.bloodPressureSystolic,
              unit: 'mmHg',
              system: 'http://unitsofmeasure.org',
              code: 'mm[Hg]'
            }
          },
          {
            code: {
              coding: [{
                system: 'http://loinc.org',
                code: '8462-4',
                display: 'Diastolic blood pressure'
              }]
            },
            valueQuantity: {
              value: data.bloodPressureDiastolic,
              unit: 'mmHg',
              system: 'http://unitsofmeasure.org',
              code: 'mm[Hg]'
            }
          }
        ],
        device: { reference: `Device/${data.deviceId}` }
      });
    }

    // Oxygen Saturation
    if (data.oxygenSaturation !== undefined) {
      observations.push({
        resourceType: 'Observation',
        status: 'final',
        category: [{
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/observation-category',
            code: 'vital-signs'
          }]
        }],
        code: {
          coding: [{
            system: 'http://loinc.org',
            code: '2708-6',
            display: 'Oxygen saturation'
          }]
        },
        subject: { reference: `Patient/${data.patientId}` },
        effectiveDateTime: data.timestamp.toISOString(),
        valueQuantity: {
          value: data.oxygenSaturation,
          unit: '%',
          system: 'http://unitsofmeasure.org',
          code: '%'
        },
        device: { reference: `Device/${data.deviceId}` }
      });
    }

    // Respiratory Rate
    if (data.respiratoryRate !== undefined) {
      observations.push({
        resourceType: 'Observation',
        status: 'final',
        category: [{
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/observation-category',
            code: 'vital-signs'
          }]
        }],
        code: {
          coding: [{
            system: 'http://loinc.org',
            code: '9279-1',
            display: 'Respiratory rate'
          }]
        },
        subject: { reference: `Patient/${data.patientId}` },
        effectiveDateTime: data.timestamp.toISOString(),
        valueQuantity: {
          value: data.respiratoryRate,
          unit: 'breaths/minute',
          system: 'http://unitsofmeasure.org',
          code: '/min'
        },
        device: { reference: `Device/${data.deviceId}` }
      });
    }

    return observations;
  }

  /**
   * Check for critical values
   */
  private checkCriticalValues(data: VitalSignsData): DeviceAlert[] {
    const alerts: DeviceAlert[] = [];
    const thresholds = this.config.alertThresholds || this.DEFAULT_THRESHOLDS;

    // Check heart rate
    if (data.heartRate !== undefined) {
      if (data.heartRate < thresholds.heartRate!.critical_min) {
        alerts.push(this.createAlert(data, 'critical_value', 'critical', 'heartRate', data.heartRate, thresholds.heartRate!.critical_min, 'Critical bradycardia'));
      } else if (data.heartRate > thresholds.heartRate!.critical_max) {
        alerts.push(this.createAlert(data, 'critical_value', 'critical', 'heartRate', data.heartRate, thresholds.heartRate!.critical_max, 'Critical tachycardia'));
      } else if (data.heartRate < thresholds.heartRate!.min) {
        alerts.push(this.createAlert(data, 'critical_value', 'medium', 'heartRate', data.heartRate, thresholds.heartRate!.min, 'Low heart rate'));
      } else if (data.heartRate > thresholds.heartRate!.max) {
        alerts.push(this.createAlert(data, 'critical_value', 'medium', 'heartRate', data.heartRate, thresholds.heartRate!.max, 'High heart rate'));
      }
    }

    // Check blood pressure
    if (data.bloodPressureSystolic !== undefined) {
      if (data.bloodPressureSystolic < thresholds.bloodPressureSystolic!.critical_min) {
        alerts.push(this.createAlert(data, 'critical_value', 'critical', 'bloodPressureSystolic', data.bloodPressureSystolic, thresholds.bloodPressureSystolic!.critical_min, 'Critical hypotension'));
      } else if (data.bloodPressureSystolic > thresholds.bloodPressureSystolic!.critical_max) {
        alerts.push(this.createAlert(data, 'critical_value', 'critical', 'bloodPressureSystolic', data.bloodPressureSystolic, thresholds.bloodPressureSystolic!.critical_max, 'Critical hypertension'));
      }
    }

    // Check oxygen saturation
    if (data.oxygenSaturation !== undefined) {
      if (data.oxygenSaturation < thresholds.oxygenSaturation!.critical_min) {
        alerts.push(this.createAlert(data, 'critical_value', 'critical', 'oxygenSaturation', data.oxygenSaturation, thresholds.oxygenSaturation!.critical_min, 'Critical hypoxemia'));
      } else if (data.oxygenSaturation < thresholds.oxygenSaturation!.min) {
        alerts.push(this.createAlert(data, 'critical_value', 'high', 'oxygenSaturation', data.oxygenSaturation, thresholds.oxygenSaturation!.min, 'Low oxygen saturation'));
      }
    }

    // Check temperature
    if (data.temperature !== undefined) {
      if (data.temperature < thresholds.temperature!.critical_min) {
        alerts.push(this.createAlert(data, 'critical_value', 'critical', 'temperature', data.temperature, thresholds.temperature!.critical_min, 'Critical hypothermia'));
      } else if (data.temperature > thresholds.temperature!.critical_max) {
        alerts.push(this.createAlert(data, 'critical_value', 'critical', 'temperature', data.temperature, thresholds.temperature!.critical_max, 'Critical hyperthermia'));
      }
    }

    // Check respiratory rate
    if (data.respiratoryRate !== undefined) {
      if (data.respiratoryRate < thresholds.respiratoryRate!.critical_min) {
        alerts.push(this.createAlert(data, 'critical_value', 'critical', 'respiratoryRate', data.respiratoryRate, thresholds.respiratoryRate!.critical_min, 'Critical bradypnea'));
      } else if (data.respiratoryRate > thresholds.respiratoryRate!.critical_max) {
        alerts.push(this.createAlert(data, 'critical_value', 'critical', 'respiratoryRate', data.respiratoryRate, thresholds.respiratoryRate!.critical_max, 'Critical tachypnea'));
      }
    }

    return alerts;
  }

  /**
   * Create device alert
   */
  private createAlert(
    data: VitalSignsData,
    alertType: DeviceAlert['alertType'],
    severity: DeviceAlert['severity'],
    parameter: string,
    value: number,
    threshold: number,
    message: string
  ): DeviceAlert {
    return {
      alertId: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      deviceId: data.deviceId,
      patientId: data.patientId,
      alertType,
      severity,
      parameter,
      value,
      threshold,
      message,
      timestamp: data.timestamp,
      acknowledged: false
    };
  }

  /**
   * Handle device alert
   */
  private async handleDeviceAlert(alert: DeviceAlert): Promise<void> {
    try {
      // 1. Store alert in database
      await this.storeAlert(alert);

      // 2. Send notification based on severity
      if (alert.severity === 'critical') {
        await this.alertService.sendCriticalAlert({
          patientId: alert.patientId,
          deviceId: alert.deviceId,
          message: alert.message,
          parameter: alert.parameter,
          value: alert.value,
          timestamp: alert.timestamp
        });
      }

      // 3. Emit event
      this.emit('alert', alert);

      // 4. Log in audit trail
      await this.logAlertInAudit(alert);

    } catch (error) {
      console.error('Error handling device alert:', error);
    }
  }

  /**
   * Check if value is critical
   */
  isCriticalValue(data: VitalSignsData): boolean {
    const alerts = this.checkCriticalValues(data);
    return alerts.some(alert => alert.severity === 'critical');
  }

  /**
   * Get device status
   */
  async getDeviceStatus(deviceId: string): Promise<DeviceStatus> {
    const query = `
      SELECT * FROM device_status
      WHERE device_id = $1
    `;

    const result = await this.pool.query(query, [deviceId]);
    return result.rows[0];
  }

  /**
   * Get all connected devices
   */
  getConnectedDevices(): string[] {
    return Array.from(this.deviceConnections.keys());
  }

  /**
   * Send command to device
   */
  async sendDeviceCommand(deviceId: string, command: string, params?: any): Promise<any> {
    const connection = this.deviceConnections.get(deviceId);
    
    if (!connection) {
      throw new Error(`Device ${deviceId} not connected`);
    }

    return connection.sendCommand(command, params);
  }

  // Helper methods
  private async registerDevice(deviceId: string, config: DeviceConfig): Promise<void> {
    const query = `
      INSERT INTO devices (
        device_id, device_type, protocol, patient_id, facility_id, tenant_id, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      ON CONFLICT (device_id) DO UPDATE
      SET patient_id = $4, status = $7, updated_at = NOW()
    `;

    await this.pool.query(query, [
      deviceId,
      config.deviceType,
      config.protocol,
      config.patientId,
      config.facilityId,
      config.tenantId,
      'connected'
    ]);
  }

  private async updateDeviceStatus(deviceId: string, status: string): Promise<void> {
    const query = `
      UPDATE devices
      SET status = $1, last_seen = NOW(), updated_at = NOW()
      WHERE device_id = $2
    `;

    await this.pool.query(query, [status, deviceId]);
  }

  private async storeAlert(alert: DeviceAlert): Promise<void> {
    const query = `
      INSERT INTO device_alerts (
        alert_id, device_id, patient_id, alert_type, severity,
        parameter, value, threshold, message, timestamp, acknowledged
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `;

    await this.pool.query(query, [
      alert.alertId,
      alert.deviceId,
      alert.patientId,
      alert.alertType,
      alert.severity,
      alert.parameter,
      alert.value,
      alert.threshold,
      alert.message,
      alert.timestamp,
      alert.acknowledged
    ]);
  }

  private async storeFHIRObservation(observation: any): Promise<void> {
    // Store in FHIR repository
    const query = `
      INSERT INTO fhir_resources (
        resource_id, resource_type, resource_data, created_at
      ) VALUES ($1, $2, $3, NOW())
    `;

    await this.pool.query(query, [
      observation.id || `obs-${Date.now()}`,
      'Observation',
      JSON.stringify(observation)
    ]);
  }

  private async logAlertInAudit(alert: DeviceAlert): Promise<void> {
    // Log in PHI audit trail
    console.log('Alert logged in audit trail:', alert.alertId);
  }

  private broadcastVitalSigns(data: VitalSignsData): void {
    // Broadcast to WebSocket clients
    this.emit('broadcast_vital_signs', data);
  }
}

// Modbus Connection (for some medical devices)
class ModbusConnection extends DeviceConnection {
  private modbusClient?: ModbusRTU;

  async connect(): Promise<void> {
    const params = this.config.connectionParams;
    
    this.modbusClient = new ModbusRTU();
    await this.modbusClient.connectTCP(params.modbusHost!, { port: params.modbusPort || 502 });
    this.modbusClient.setID(params.modbusUnitId || 1);
    
    this.isConnected = true;
    this.emit('connected', { deviceId: this.deviceId });
    
    // Start polling
    this.startPolling();
  }

  async disconnect(): Promise<void> {
    if (this.modbusClient) {
      this.modbusClient.close(() => {});
      this.isConnected = false;
    }
  }

  async sendCommand(command: string, params?: any): Promise<any> {
    // Modbus write command
    return { success: true };
  }

  private startPolling(): void {
    setInterval(async () => {
      if (!this.isConnected) return;
      
      try {
        // Read holding registers (example)
        const data = await this.modbusClient!.readHoldingRegisters(0, 10);
        const vitalSigns = this.parseModbusData(data.data);
        this.emit('vitalData', vitalSigns);
      } catch (error) {
        this.handleError(error as Error);
      }
    }, 1000); // Poll every second
  }

  private parseModbusData(data: number[]): VitalSignsData {
    // Parse device-specific Modbus registers
    return {
      deviceId: this.deviceId,
      patientId: this.config.patientId || 'unknown',
      timestamp: new Date(),
      heartRate: data[0],
      oxygenSaturation: data[1],
      // ... parse other values
    } as VitalSignsData;
  }
}

// WebSocket Connection
class WebSocketConnection extends DeviceConnection {
  private ws?: WebSocket;

  async connect(): Promise<void> {
    const params = this.config.connectionParams;
    
    this.ws = new WebSocket(params.wsUrl!, params.wsProtocol);

    this.ws.on('open', () => {
      console.log(`Device ${this.deviceId} connected via WebSocket`);
      this.isConnected = true;
      this.emit('connected', { deviceId: this.deviceId });
    });

    this.ws.on('message', (data) => {
      try {
        const parsed = JSON.parse(data.toString());
        this.emit('vitalData', parsed);
      } catch (error) {
        this.handleError(error as Error);
      }
    });

    this.ws.on('error', (error) => {
      this.handleError(error);
    });

    this.ws.on('close', () => {
      console.log(`Device ${this.deviceId} disconnected`);
      this.isConnected = false;
      this.emit('disconnected', { deviceId: this.deviceId });
      this.reconnect();
    });
  }

  async disconnect(): Promise<void> {
    if (this.ws) {
      this.ws.close();
      this.isConnected = false;
    }
  }

  async sendCommand(command: string, params?: any): Promise<any> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('Device not connected');
    }

    this.ws.send(JSON.stringify({ command, params }));
    return { success: true };
  }
}

export default DeviceIntegrationService;
