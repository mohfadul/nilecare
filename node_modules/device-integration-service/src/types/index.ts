/**
 * Core Types for Device Integration Service
 * NileCare Healthcare Platform
 */

export interface ConnectionParams {
  // MQTT
  mqttBroker?: string;
  mqttTopic?: string;
  mqttUsername?: string;
  mqttPassword?: string;
  mqttClientId?: string;

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

  // HL7
  hl7Host?: string;
  hl7Port?: number;

  // FHIR
  fhirEndpoint?: string;
  fhirApiKey?: string;

  // REST API
  apiUrl?: string;
  apiKey?: string;
  apiSecret?: string;
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
  alertType:
    | 'critical_value'
    | 'device_malfunction'
    | 'lead_off'
    | 'battery_low'
    | 'calibration_required';
  severity: 'low' | 'medium' | 'high' | 'critical';
  parameter?: string;
  value?: number;
  threshold?: number;
  message: string;
  timestamp: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolved?: boolean;
  resolvedBy?: string;
  resolvedAt?: Date;
}

export interface DeviceStatus {
  deviceId: string;
  status: 'active' | 'inactive' | 'error' | 'maintenance' | 'decommissioned';
  lastSeen: Date;
  lastHeartbeat?: Date;
  batteryLevel?: number;
  signalStrength?: number;
  firmwareVersion?: string;
  calibrationDate?: Date;
  nextCalibrationDue?: Date;
  calibrationStatus?: 'valid' | 'due' | 'overdue' | 'failed';
}

export interface DeviceCommunicationLog {
  logId: string;
  deviceId: string;
  direction: 'inbound' | 'outbound';
  protocol: string;
  messageType?: string;
  payload: any;
  rawMessage?: string;
  success: boolean;
  errorMessage?: string;
  responseTimeMs?: number;
  loggedAt: Date;
}

export interface FHIRResource {
  resourceId: string;
  fhirId?: string;
  resourceType: string;
  deviceId?: string;
  patientId?: string;
  resourceData: any;
  version: number;
  status: 'active' | 'entered-in-error' | 'superseded';
  syncedToFhirServer: boolean;
  syncError?: string;
  lastSyncAttempt?: Date;
}

export interface CalibrationRecord {
  calibrationId: string;
  deviceId: string;
  calibrationType: 'routine' | 'emergency' | 'post-maintenance';
  performedBy: string;
  results: any;
  passed: boolean;
  notes?: string;
  certificateNumber?: string;
  certifiedBy?: string;
  certificationFileUrl?: string;
  nextDueDate?: Date;
  calibrationDate: Date;
}

export interface MaintenanceRecord {
  maintenanceId: string;
  deviceId: string;
  maintenanceType: 'preventive' | 'corrective' | 'emergency';
  description: string;
  performedBy: string;
  durationMinutes?: number;
  cost?: number;
  partsReplaced?: any;
  partsCost?: number;
  issuesFound?: string;
  actionsTaken?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  nextMaintenanceDate?: Date;
  scheduledDate?: Date;
  performedDate?: Date;
}

export interface ServiceError extends Error {
  statusCode: number;
  code: string;
  details?: any;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AuthUser {
  userId: string;
  username: string;
  email: string;
  roles: string[];
  tenantId: string;
  facilityId?: string;
}

export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: any[];
}

