/**
 * Medical Device Integration Service
 * Supports multiple device protocols and real-time data streaming
 * Sudan-specific: Optimized for Sudan healthcare facilities
 */
import { EventEmitter } from 'events';
import { Pool } from 'pg';
export interface DeviceConfig {
    deviceId: string;
    deviceType: 'vital_monitor' | 'infusion_pump' | 'ventilator' | 'ecg' | 'pulse_oximeter' | 'blood_pressure';
    protocol: 'mqtt' | 'serial' | 'modbus' | 'websocket' | 'hl7' | 'bluetooth';
    connectionParams: ConnectionParams;
    patientId?: string;
    facilityId: string;
    tenantId: string;
    samplingRate?: number;
    alertThresholds?: AlertThresholds;
}
export interface ConnectionParams {
    mqttBroker?: string;
    mqttTopic?: string;
    mqttUsername?: string;
    mqttPassword?: string;
    serialPort?: string;
    baudRate?: number;
    dataBits?: 7 | 8;
    stopBits?: 1 | 2;
    parity?: 'none' | 'even' | 'odd';
    modbusHost?: string;
    modbusPort?: number;
    modbusUnitId?: number;
    wsUrl?: string;
    wsProtocol?: string;
}
export interface VitalSignsData {
    deviceId: string;
    patientId: string;
    timestamp: Date;
    temperature?: number;
    heartRate?: number;
    respiratoryRate?: number;
    bloodPressureSystolic?: number;
    bloodPressureDiastolic?: number;
    oxygenSaturation?: number;
    pulseRate?: number;
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
    confidence?: number;
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
    heartRate?: {
        min: number;
        max: number;
        critical_min: number;
        critical_max: number;
    };
    bloodPressureSystolic?: {
        min: number;
        max: number;
        critical_min: number;
        critical_max: number;
    };
    bloodPressureDiastolic?: {
        min: number;
        max: number;
        critical_min: number;
        critical_max: number;
    };
    oxygenSaturation?: {
        min: number;
        critical_min: number;
    };
    temperature?: {
        min: number;
        max: number;
        critical_min: number;
        critical_max: number;
    };
    respiratoryRate?: {
        min: number;
        max: number;
        critical_min: number;
        critical_max: number;
    };
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
export declare abstract class DeviceConnection extends EventEmitter {
    protected deviceId: string;
    protected config: DeviceConfig;
    protected isConnected: boolean;
    protected reconnectAttempts: number;
    protected maxReconnectAttempts: number;
    constructor(deviceId: string, config: DeviceConfig);
    abstract connect(): Promise<void>;
    abstract disconnect(): Promise<void>;
    abstract sendCommand(command: string, params?: any): Promise<any>;
    protected handleError(error: Error): void;
    protected reconnect(): Promise<void>;
}
export declare class VitalMonitorConnection extends DeviceConnection {
    private mqttClient?;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    sendCommand(command: string, params?: any): Promise<any>;
    private parseVitalSigns;
}
export declare class SerialPortConnection extends DeviceConnection {
    private serialPort?;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    sendCommand(command: string, params?: any): Promise<any>;
    private parseSerialData;
}
export declare class DeviceIntegrationService extends EventEmitter {
    private readonly deviceConnections;
    private readonly pool;
    private readonly alertService;
    private readonly DEFAULT_THRESHOLDS;
    constructor(pool: Pool, alertService: any);
    /**
     * Connect to vital signs monitor
     * @param deviceId - Unique device identifier
     * @param config - Device configuration
     */
    connectToVitalMonitor(deviceId: string, config: DeviceConfig): Promise<void>;
    /**
     * Disconnect from device
     * @param deviceId - Device identifier
     */
    disconnectDevice(deviceId: string): Promise<void>;
    /**
     * Process vital signs data
     * @param data - Vital signs data from device
     */
    private processVitalSigns;
    /**
     * Store vital signs in TimescaleDB
     */
    private storeVitalSignsTimeSeries;
    /**
     * Store vital signs as FHIR Observations
     */
    private storeVitalSignsFHIR;
    /**
     * Convert vital signs to FHIR Observations
     */
    private convertToFHIRObservations;
    /**
     * Check for critical values
     */
    private checkCriticalValues;
    /**
     * Create device alert
     */
    private createAlert;
    /**
     * Handle device alert
     */
    private handleDeviceAlert;
    /**
     * Check if value is critical
     */
    isCriticalValue(data: VitalSignsData): boolean;
    /**
     * Get device status
     */
    getDeviceStatus(deviceId: string): Promise<DeviceStatus>;
    /**
     * Get all connected devices
     */
    getConnectedDevices(): string[];
    /**
     * Send command to device
     */
    sendDeviceCommand(deviceId: string, command: string, params?: any): Promise<any>;
    private registerDevice;
    private updateDeviceStatus;
    private storeAlert;
    private storeFHIRObservation;
    private logAlertInAudit;
    private broadcastVitalSigns;
}
export default DeviceIntegrationService;
//# sourceMappingURL=DeviceIntegrationService.d.ts.map