"use strict";
/**
 * Alert Model
 * Represents device alerts for critical values and malfunctions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Alert = exports.AlertSeverity = exports.AlertType = void 0;
var AlertType;
(function (AlertType) {
    AlertType["CRITICAL_VALUE"] = "critical_value";
    AlertType["DEVICE_MALFUNCTION"] = "device_malfunction";
    AlertType["LEAD_OFF"] = "lead_off";
    AlertType["BATTERY_LOW"] = "battery_low";
    AlertType["CALIBRATION_REQUIRED"] = "calibration_required";
    AlertType["CONNECTION_LOST"] = "connection_lost";
    AlertType["SIGNAL_QUALITY_POOR"] = "signal_quality_poor";
})(AlertType || (exports.AlertType = AlertType = {}));
var AlertSeverity;
(function (AlertSeverity) {
    AlertSeverity["LOW"] = "low";
    AlertSeverity["MEDIUM"] = "medium";
    AlertSeverity["HIGH"] = "high";
    AlertSeverity["CRITICAL"] = "critical";
})(AlertSeverity || (exports.AlertSeverity = AlertSeverity = {}));
class Alert {
    constructor(data) {
        Object.assign(this, data);
        this.timestamp = data.timestamp || new Date();
        this.createdAt = data.createdAt || new Date();
        this.acknowledged = data.acknowledged || false;
        this.resolved = data.resolved || false;
        this.notificationSent = data.notificationSent || false;
    }
    acknowledge(userId, notes) {
        this.acknowledged = true;
        this.acknowledgedBy = userId;
        this.acknowledgedAt = new Date();
    }
    resolve(userId, notes) {
        this.resolved = true;
        this.resolvedBy = userId;
        this.resolvedAt = new Date();
        this.resolutionNotes = notes;
    }
    isCritical() {
        return this.severity === AlertSeverity.CRITICAL;
    }
    toJSON() {
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
exports.Alert = Alert;
exports.default = Alert;
//# sourceMappingURL=Alert.js.map