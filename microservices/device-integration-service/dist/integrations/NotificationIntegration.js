"use strict";
/**
 * Notification Integration
 * Communicates with the Notification Service for alerts and events
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationIntegration = void 0;
const axios_1 = __importDefault(require("axios"));
const env_1 = require("../config/env");
const logger_1 = __importDefault(require("../utils/logger"));
class NotificationIntegration {
    constructor() {
        this.client = axios_1.default.create({
            baseURL: env_1.config.NOTIFICATION_SERVICE_URL,
            headers: {
                'X-Service-API-Key': env_1.config.SERVICE_API_KEY,
                'X-Service-Name': env_1.config.SERVICE_NAME,
                'Content-Type': 'application/json',
            },
            timeout: 5000,
        });
    }
    /**
     * Send critical alert notification
     */
    async sendCriticalAlert(alert) {
        try {
            await this.client.post('/api/v1/notifications/send', {
                type: 'critical_device_alert',
                priority: 'critical',
                recipients: ['admin', 'clinician'], // Will be resolved by notification service
                channels: ['email', 'sms', 'push'],
                subject: `Critical Device Alert: ${alert.message}`,
                message: `
          Device ID: ${alert.deviceId}
          Patient ID: ${alert.patientId}
          Alert Type: ${alert.alertType}
          Severity: ${alert.severity}
          Parameter: ${alert.parameter}
          Value: ${alert.value}
          Threshold: ${alert.threshold}
          Time: ${alert.timestamp}
        `,
                metadata: {
                    alertId: alert.alertId,
                    deviceId: alert.deviceId,
                    patientId: alert.patientId,
                    severity: alert.severity,
                    alertType: alert.alertType,
                },
            });
            logger_1.default.info(`Critical alert notification sent: ${alert.alertId}`);
        }
        catch (error) {
            logger_1.default.error('Error sending critical alert notification:', error);
            // Don't throw - notification failure shouldn't break alert creation
        }
    }
    /**
     * Send device registration notification
     */
    async sendDeviceRegistrationNotification(deviceId, deviceName, facilityId, createdBy) {
        try {
            await this.client.post('/api/v1/notifications/send', {
                type: 'device_registered',
                priority: 'low',
                recipients: [createdBy],
                channels: ['email'],
                subject: `Device Registered: ${deviceName}`,
                message: `A new device "${deviceName}" has been successfully registered in the system.`,
                metadata: {
                    deviceId,
                    deviceName,
                    facilityId,
                },
            });
            logger_1.default.info(`Device registration notification sent: ${deviceId}`);
        }
        catch (error) {
            logger_1.default.error('Error sending device registration notification:', error);
        }
    }
    /**
     * Send device connection lost notification
     */
    async sendDeviceConnectionLostNotification(deviceId, deviceName, lastSeen) {
        try {
            await this.client.post('/api/v1/notifications/send', {
                type: 'device_connection_lost',
                priority: 'high',
                recipients: ['admin', 'technician'],
                channels: ['email', 'sms'],
                subject: `Device Connection Lost: ${deviceName}`,
                message: `Device "${deviceName}" has lost connection. Last seen: ${lastSeen.toISOString()}`,
                metadata: {
                    deviceId,
                    deviceName,
                    lastSeen: lastSeen.toISOString(),
                },
            });
            logger_1.default.info(`Device connection lost notification sent: ${deviceId}`);
        }
        catch (error) {
            logger_1.default.error('Error sending device connection lost notification:', error);
        }
    }
    /**
     * Send device maintenance notification
     */
    async sendMaintenanceNotification(deviceId, deviceName, maintenanceType, dueDate) {
        try {
            await this.client.post('/api/v1/notifications/send', {
                type: 'device_maintenance_due',
                priority: 'medium',
                recipients: ['technician', 'admin'],
                channels: ['email'],
                subject: `Device Maintenance Due: ${deviceName}`,
                message: `Device "${deviceName}" requires ${maintenanceType} maintenance by ${dueDate.toDateString()}.`,
                metadata: {
                    deviceId,
                    deviceName,
                    maintenanceType,
                    dueDate: dueDate.toISOString(),
                },
            });
            logger_1.default.info(`Maintenance notification sent: ${deviceId}`);
        }
        catch (error) {
            logger_1.default.error('Error sending maintenance notification:', error);
        }
    }
}
exports.NotificationIntegration = NotificationIntegration;
exports.default = NotificationIntegration;
//# sourceMappingURL=NotificationIntegration.js.map