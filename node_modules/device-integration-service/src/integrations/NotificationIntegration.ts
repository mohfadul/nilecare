/**
 * Notification Integration
 * Communicates with the Notification Service for alerts and events
 */

import axios, { AxiosInstance } from 'axios';
import { config } from '../config/env';
import { DeviceAlert } from '../types';
import { ExternalServiceError } from '../utils/errors';
import logger from '../utils/logger';

export class NotificationIntegration {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.NOTIFICATION_SERVICE_URL,
      headers: {
        'X-Service-API-Key': config.SERVICE_API_KEY,
        'X-Service-Name': config.SERVICE_NAME,
        'Content-Type': 'application/json',
      },
      timeout: 5000,
    });
  }

  /**
   * Send critical alert notification
   */
  async sendCriticalAlert(alert: DeviceAlert): Promise<void> {
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

      logger.info(`Critical alert notification sent: ${alert.alertId}`);
    } catch (error: any) {
      logger.error('Error sending critical alert notification:', error);
      // Don't throw - notification failure shouldn't break alert creation
    }
  }

  /**
   * Send device registration notification
   */
  async sendDeviceRegistrationNotification(
    deviceId: string,
    deviceName: string,
    facilityId: string,
    createdBy: string
  ): Promise<void> {
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

      logger.info(`Device registration notification sent: ${deviceId}`);
    } catch (error: any) {
      logger.error('Error sending device registration notification:', error);
    }
  }

  /**
   * Send device connection lost notification
   */
  async sendDeviceConnectionLostNotification(
    deviceId: string,
    deviceName: string,
    lastSeen: Date
  ): Promise<void> {
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

      logger.info(`Device connection lost notification sent: ${deviceId}`);
    } catch (error: any) {
      logger.error('Error sending device connection lost notification:', error);
    }
  }

  /**
   * Send device maintenance notification
   */
  async sendMaintenanceNotification(
    deviceId: string,
    deviceName: string,
    maintenanceType: string,
    dueDate: Date
  ): Promise<void> {
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

      logger.info(`Maintenance notification sent: ${deviceId}`);
    } catch (error: any) {
      logger.error('Error sending maintenance notification:', error);
    }
  }
}

export default NotificationIntegration;

