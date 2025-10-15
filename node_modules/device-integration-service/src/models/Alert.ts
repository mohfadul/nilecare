/**
 * Alert Model
 * Represents device alerts for critical values and malfunctions
 */

export interface IAlert {
  alertId: string;
  deviceId: string;
  patientId: string;
  alertType: AlertType;
  severity: AlertSeverity;
  parameter?: string;
  value?: number;
  threshold?: number;
  message: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: Date;
  resolutionNotes?: string;
  notificationSent: boolean;
  notificationChannels?: string[];
  timestamp: Date;
  createdAt: Date;
  tenantId: string;
}

export enum AlertType {
  CRITICAL_VALUE = 'critical_value',
  DEVICE_MALFUNCTION = 'device_malfunction',
  LEAD_OFF = 'lead_off',
  BATTERY_LOW = 'battery_low',
  CALIBRATION_REQUIRED = 'calibration_required',
  CONNECTION_LOST = 'connection_lost',
  SIGNAL_QUALITY_POOR = 'signal_quality_poor',
}

export enum AlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface AlertDTO {
  deviceId: string;
  patientId: string;
  alertType: AlertType;
  severity: AlertSeverity;
  parameter?: string;
  value?: number;
  threshold?: number;
  message: string;
  tenantId: string;
}

export interface AlertAcknowledgeDTO {
  alertId: string;
  acknowledgedBy: string;
  notes?: string;
}

export interface AlertResolveDTO {
  alertId: string;
  resolvedBy: string;
  resolutionNotes: string;
}

export interface AlertQueryParams {
  deviceId?: string;
  patientId?: string;
  alertType?: AlertType;
  severity?: AlertSeverity;
  acknowledged?: boolean;
  resolved?: boolean;
  startTime?: Date;
  endTime?: Date;
  tenantId: string;
  page?: number;
  limit?: number;
}

export class Alert implements IAlert {
  alertId: string;
  deviceId: string;
  patientId: string;
  alertType: AlertType;
  severity: AlertSeverity;
  parameter?: string;
  value?: number;
  threshold?: number;
  message: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: Date;
  resolutionNotes?: string;
  notificationSent: boolean;
  notificationChannels?: string[];
  timestamp: Date;
  createdAt: Date;
  tenantId: string;

  constructor(data: Partial<IAlert>) {
    Object.assign(this, data);
    this.timestamp = data.timestamp || new Date();
    this.createdAt = data.createdAt || new Date();
    this.acknowledged = data.acknowledged || false;
    this.resolved = data.resolved || false;
    this.notificationSent = data.notificationSent || false;
  }

  acknowledge(userId: string, notes?: string): void {
    this.acknowledged = true;
    this.acknowledgedBy = userId;
    this.acknowledgedAt = new Date();
  }

  resolve(userId: string, notes: string): void {
    this.resolved = true;
    this.resolvedBy = userId;
    this.resolvedAt = new Date();
    this.resolutionNotes = notes;
  }

  isCritical(): boolean {
    return this.severity === AlertSeverity.CRITICAL;
  }

  toJSON(): any {
    return {
      alertId: this.alertId,
      deviceId: this.deviceId,
      patientId: this.patientId,
      alertType: this.alertType,
      severity: this.severity,
      parameter: this.parameter,
      value: this.value,
      threshold: this.threshold,
      message: this.message,
      acknowledged: this.acknowledged,
      acknowledgedBy: this.acknowledgedBy,
      acknowledgedAt: this.acknowledgedAt,
      resolved: this.resolved,
      resolvedBy: this.resolvedBy,
      resolvedAt: this.resolvedAt,
      timestamp: this.timestamp,
      createdAt: this.createdAt,
    };
  }
}

export default Alert;

