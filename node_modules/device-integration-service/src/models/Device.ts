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

export enum DeviceType {
  VITAL_MONITOR = 'vital_monitor',
  INFUSION_PUMP = 'infusion_pump',
  VENTILATOR = 'ventilator',
  ECG = 'ecg',
  PULSE_OXIMETER = 'pulse_oximeter',
  BLOOD_PRESSURE = 'blood_pressure',
  LAB_ANALYZER = 'lab_analyzer',
  IMAGING = 'imaging',
  THERMOMETER = 'thermometer',
  GLUCOMETER = 'glucometer',
  OTHER = 'other',
}

export enum DeviceProtocol {
  MQTT = 'mqtt',
  SERIAL = 'serial',
  MODBUS = 'modbus',
  WEBSOCKET = 'websocket',
  HL7 = 'hl7',
  FHIR = 'fhir',
  BLUETOOTH = 'bluetooth',
  USB = 'usb',
  REST_API = 'rest_api',
}

export enum DeviceStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintenance',
  ERROR = 'error',
  DECOMMISSIONED = 'decommissioned',
}

export enum CalibrationStatus {
  VALID = 'valid',
  DUE = 'due',
  OVERDUE = 'overdue',
  FAILED = 'failed',
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

export class Device implements IDevice {
  deviceId!: string;
  deviceName!: string;
  deviceType!: DeviceType;
  manufacturer?: string;
  modelNumber?: string;
  serialNumber?: string;
  protocol!: DeviceProtocol;
  firmwareVersion?: string;
  connectionParams!: ConnectionParams;
  status!: DeviceStatus;
  facilityId!: string;
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
  createdBy!: string;
  updatedBy?: string;
  createdAt!: Date;
  updatedAt!: Date;
  tenantId!: string;

  constructor(data: Partial<IDevice>) {
    Object.assign(this, data);
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  isOnline(): boolean {
    if (!this.lastSeen) return false;
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return this.lastSeen > fiveMinutesAgo;
  }

  needsCalibration(): boolean {
    if (!this.nextCalibrationDue) return false;
    return this.nextCalibrationDue <= new Date();
  }

  isLowBattery(): boolean {
    if (this.batteryLevel === undefined) return false;
    return this.batteryLevel < 20;
  }

  getHealthStatus(): 'healthy' | 'warning' | 'critical' | 'offline' {
    if (!this.isOnline()) return 'offline';
    if (this.status === DeviceStatus.ERROR) return 'critical';
    if (this.isLowBattery() || this.needsCalibration()) return 'warning';
    return 'healthy';
  }

  toJSON(): any {
    return {
      deviceId: this.deviceId,
      deviceName: this.deviceName,
      deviceType: this.deviceType,
      manufacturer: this.manufacturer,
      modelNumber: this.modelNumber,
      serialNumber: this.serialNumber,
      protocol: this.protocol,
      firmwareVersion: this.firmwareVersion,
      status: this.status,
      facilityId: this.facilityId,
      linkedPatientId: this.linkedPatientId,
      location: this.location,
      lastSeen: this.lastSeen,
      batteryLevel: this.batteryLevel,
      signalStrength: this.signalStrength,
      calibrationStatus: this.calibrationStatus,
      nextCalibrationDue: this.nextCalibrationDue,
      healthStatus: this.getHealthStatus(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

export default Device;

