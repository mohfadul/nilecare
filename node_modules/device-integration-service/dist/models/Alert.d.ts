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
export declare enum AlertType {
    CRITICAL_VALUE = "critical_value",
    DEVICE_MALFUNCTION = "device_malfunction",
    LEAD_OFF = "lead_off",
    BATTERY_LOW = "battery_low",
    CALIBRATION_REQUIRED = "calibration_required",
    CONNECTION_LOST = "connection_lost",
    SIGNAL_QUALITY_POOR = "signal_quality_poor"
}
export declare enum AlertSeverity {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
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
export declare class Alert implements IAlert {
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
    constructor(data: Partial<IAlert>);
    acknowledge(userId: string, notes?: string): void;
    resolve(userId: string, notes: string): void;
    isCritical(): boolean;
    toJSON(): any;
}
export default Alert;
//# sourceMappingURL=Alert.d.ts.map