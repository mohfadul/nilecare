/**
 * Device Model
 * Represents a medical device in the NileCare system
 */
import { ConnectionParams, AlertThresholds } from '../types';
export interface IDevice {
    deviceId: string;
    deviceName: string;
    deviceType: DeviceType;
    manufacturer?: string;
    modelNumber?: string;
    serialNumber?: string;
    protocol: DeviceProtocol;
    firmwareVersion?: string;
    connectionParams: ConnectionParams;
    status: DeviceStatus;
    facilityId: string;
    linkedPatientId?: string;
    location?: string;
    lastSyncTime?: Date;
    lastSeen?: Date;
    lastHeartbeat?: Date;
    batteryLevel?: number;
    signalStrength?: number;
    calibrationDate?: Date;
    nextCalibrationDue?: Date;
    calibrationStatus?: CalibrationStatus;
    alertThresholds?: AlertThresholds;
    metadata?: Record<string, any>;
    payload?: Record<string, any>;
    createdBy: string;
    updatedBy?: string;
    createdAt: Date;
    updatedAt: Date;
    tenantId: string;
}
export declare enum DeviceType {
    VITAL_MONITOR = "vital_monitor",
    INFUSION_PUMP = "infusion_pump",
    VENTILATOR = "ventilator",
    ECG = "ecg",
    PULSE_OXIMETER = "pulse_oximeter",
    BLOOD_PRESSURE = "blood_pressure",
    LAB_ANALYZER = "lab_analyzer",
    IMAGING = "imaging",
    THERMOMETER = "thermometer",
    GLUCOMETER = "glucometer",
    OTHER = "other"
}
export declare enum DeviceProtocol {
    MQTT = "mqtt",
    SERIAL = "serial",
    MODBUS = "modbus",
    WEBSOCKET = "websocket",
    HL7 = "hl7",
    FHIR = "fhir",
    BLUETOOTH = "bluetooth",
    USB = "usb",
    REST_API = "rest_api"
}
export declare enum DeviceStatus {
    ACTIVE = "active",
    INACTIVE = "inactive",
    MAINTENANCE = "maintenance",
    ERROR = "error",
    DECOMMISSIONED = "decommissioned"
}
export declare enum CalibrationStatus {
    VALID = "valid",
    DUE = "due",
    OVERDUE = "overdue",
    FAILED = "failed"
}
export interface DeviceRegistrationDTO {
    deviceName: string;
    deviceType: DeviceType;
    manufacturer?: string;
    modelNumber?: string;
    serialNumber?: string;
    protocol: DeviceProtocol;
    firmwareVersion?: string;
    connectionParams: ConnectionParams;
    facilityId: string;
    linkedPatientId?: string;
    location?: string;
    alertThresholds?: AlertThresholds;
    metadata?: Record<string, any>;
    tenantId: string;
    createdBy: string;
}
export interface DeviceUpdateDTO {
    deviceName?: string;
    deviceType?: DeviceType;
    manufacturer?: string;
    modelNumber?: string;
    serialNumber?: string;
    protocol?: DeviceProtocol;
    firmwareVersion?: string;
    connectionParams?: ConnectionParams;
    status?: DeviceStatus;
    facilityId?: string;
    linkedPatientId?: string;
    location?: string;
    alertThresholds?: AlertThresholds;
    metadata?: Record<string, any>;
    updatedBy: string;
}
export interface DeviceStatusUpdateDTO {
    status: DeviceStatus;
    changeReason?: string;
    errorMessage?: string;
    errorCode?: string;
    updatedBy: string;
}
export interface DeviceQueryParams {
    facilityId?: string;
    deviceType?: DeviceType;
    status?: DeviceStatus;
    linkedPatientId?: string;
    protocol?: DeviceProtocol;
    calibrationStatus?: CalibrationStatus;
    tenantId: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}
export declare class Device implements IDevice {
    deviceId: string;
    deviceName: string;
    deviceType: DeviceType;
    manufacturer?: string;
    modelNumber?: string;
    serialNumber?: string;
    protocol: DeviceProtocol;
    firmwareVersion?: string;
    connectionParams: ConnectionParams;
    status: DeviceStatus;
    facilityId: string;
    linkedPatientId?: string;
    location?: string;
    lastSyncTime?: Date;
    lastSeen?: Date;
    lastHeartbeat?: Date;
    batteryLevel?: number;
    signalStrength?: number;
    calibrationDate?: Date;
    nextCalibrationDue?: Date;
    calibrationStatus?: CalibrationStatus;
    alertThresholds?: AlertThresholds;
    metadata?: Record<string, any>;
    payload?: Record<string, any>;
    createdBy: string;
    updatedBy?: string;
    createdAt: Date;
    updatedAt: Date;
    tenantId: string;
    constructor(data: Partial<IDevice>);
    isOnline(): boolean;
    needsCalibration(): boolean;
    isLowBattery(): boolean;
    getHealthStatus(): 'healthy' | 'warning' | 'critical' | 'offline';
    toJSON(): any;
}
export default Device;
//# sourceMappingURL=Device.d.ts.map