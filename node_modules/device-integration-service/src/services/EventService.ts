/**
 * Event Service
 * Handles pub/sub messaging and inter-service communication
 */

import Redis from 'ioredis';
import { getRedisClient, initializeRedisPubSub } from '../config/redis';
import logger from '../utils/logger';

export class EventService {
  private redis: Redis;
  private publisher?: Redis;
  private subscriber?: Redis;

  constructor() {
    this.redis = getRedisClient();
  }

  /**
   * Initialize pub/sub clients
   */
  initializePubSub(): void {
    const { pub, sub } = initializeRedisPubSub();
    this.publisher = pub;
    this.subscriber = sub;
  }

  /**
   * Publish event to a channel
   */
  async publishEvent(channel: string, event: any): Promise<void> {
    try {
      if (!this.publisher) {
        this.initializePubSub();
      }

      const message = JSON.stringify({
        ...event,
        timestamp: new Date().toISOString(),
        service: 'device-integration-service',
      });

      await this.publisher!.publish(channel, message);
      logger.info(`Event published to ${channel}`, { event: event.type || 'unknown' });
    } catch (error: any) {
      logger.error('Error publishing event:', error);
      throw error;
    }
  }

  /**
   * Subscribe to events on a channel
   */
  subscribeToEvents(channel: string, handler: (event: any) => void): void {
    try {
      if (!this.subscriber) {
        this.initializePubSub();
      }

      this.subscriber!.subscribe(channel, (err) => {
        if (err) {
          logger.error(`Error subscribing to channel ${channel}:`, err);
        } else {
          logger.info(`Subscribed to channel: ${channel}`);
        }
      });

      this.subscriber!.on('message', (ch, message) => {
        if (ch === channel) {
          try {
            const event = JSON.parse(message);
            handler(event);
          } catch (error: any) {
            logger.error('Error parsing event message:', error);
          }
        }
      });
    } catch (error: any) {
      logger.error('Error setting up subscription:', error);
      throw error;
    }
  }

  /**
   * Publish device registered event
   */
  async publishDeviceRegistered(deviceId: string, deviceData: any): Promise<void> {
    await this.publishEvent('device.registered', {
      type: 'device.registered',
      deviceId,
      deviceName: deviceData.deviceName,
      deviceType: deviceData.deviceType,
      facilityId: deviceData.facilityId,
      tenantId: deviceData.tenantId,
    });
  }

  /**
   * Publish vital signs received event
   */
  async publishVitalSignsReceived(deviceId: string, patientId: string, data: any): Promise<void> {
    await this.publishEvent('vitalsigns.received', {
      type: 'vitalsigns.received',
      deviceId,
      patientId,
      vitalSigns: data,
    });
  }

  /**
   * Publish device alert event
   */
  async publishDeviceAlert(alert: any): Promise<void> {
    await this.publishEvent('device.alert', {
      type: 'device.alert',
      alertId: alert.alertId,
      deviceId: alert.deviceId,
      patientId: alert.patientId,
      severity: alert.severity,
      alertType: alert.alertType,
      message: alert.message,
    });
  }

  /**
   * Publish device status changed event
   */
  async publishDeviceStatusChanged(
    deviceId: string,
    previousStatus: string,
    newStatus: string
  ): Promise<void> {
    await this.publishEvent('device.status.changed', {
      type: 'device.status.changed',
      deviceId,
      previousStatus,
      newStatus,
    });
  }

  /**
   * Publish device connection lost event
   */
  async publishDeviceConnectionLost(deviceId: string, lastSeen: Date): Promise<void> {
    await this.publishEvent('device.connection.lost', {
      type: 'device.connection.lost',
      deviceId,
      lastSeen: lastSeen.toISOString(),
    });
  }

  /**
   * Subscribe to facility events
   */
  subscribeFacilityEvents(handler: (event: any) => void): void {
    this.subscribeToEvents('facility.*', handler);
  }

  /**
   * Subscribe to patient events
   */
  subscribePatientEvents(handler: (event: any) => void): void {
    this.subscribeToEvents('patient.*', handler);
  }

  /**
   * Cache device data
   */
  async cacheDeviceData(deviceId: string, data: any, ttl: number = 3600): Promise<void> {
    try {
      const key = `device:${deviceId}`;
      await this.redis.setex(key, ttl, JSON.stringify(data));
      logger.debug(`Cached device data: ${deviceId}`);
    } catch (error: any) {
      logger.error('Error caching device data:', error);
    }
  }

  /**
   * Get cached device data
   */
  async getCachedDeviceData(deviceId: string): Promise<any | null> {
    try {
      const key = `device:${deviceId}`;
      const data = await this.redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error: any) {
      logger.error('Error getting cached device data:', error);
      return null;
    }
  }

  /**
   * Clear device cache
   */
  async clearDeviceCache(deviceId: string): Promise<void> {
    try {
      const key = `device:${deviceId}`;
      await this.redis.del(key);
      logger.debug(`Cleared device cache: ${deviceId}`);
    } catch (error: any) {
      logger.error('Error clearing device cache:', error);
    }
  }
}

export default EventService;

