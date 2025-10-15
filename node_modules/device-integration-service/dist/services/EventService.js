"use strict";
/**
 * Event Service
 * Handles pub/sub messaging and inter-service communication
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventService = void 0;
const redis_1 = require("../config/redis");
const logger_1 = __importDefault(require("../utils/logger"));
class EventService {
    constructor() {
        this.redis = (0, redis_1.getRedisClient)();
    }
    /**
     * Initialize pub/sub clients
     */
    initializePubSub() {
        const { pub, sub } = (0, redis_1.initializeRedisPubSub)();
        this.publisher = pub;
        this.subscriber = sub;
    }
    /**
     * Publish event to a channel
     */
    async publishEvent(channel, event) {
        try {
            if (!this.publisher) {
                this.initializePubSub();
            }
            const message = JSON.stringify({
                ...event,
                timestamp: new Date().toISOString(),
                service: 'device-integration-service',
            });
            await this.publisher.publish(channel, message);
            logger_1.default.info(`Event published to ${channel}`, { event: event.type || 'unknown' });
        }
        catch (error) {
            logger_1.default.error('Error publishing event:', error);
            throw error;
        }
    }
    /**
     * Subscribe to events on a channel
     */
    subscribeToEvents(channel, handler) {
        try {
            if (!this.subscriber) {
                this.initializePubSub();
            }
            this.subscriber.subscribe(channel, (err) => {
                if (err) {
                    logger_1.default.error(`Error subscribing to channel ${channel}:`, err);
                }
                else {
                    logger_1.default.info(`Subscribed to channel: ${channel}`);
                }
            });
            this.subscriber.on('message', (ch, message) => {
                if (ch === channel) {
                    try {
                        const event = JSON.parse(message);
                        handler(event);
                    }
                    catch (error) {
                        logger_1.default.error('Error parsing event message:', error);
                    }
                }
            });
        }
        catch (error) {
            logger_1.default.error('Error setting up subscription:', error);
            throw error;
        }
    }
    /**
     * Publish device registered event
     */
    async publishDeviceRegistered(deviceId, deviceData) {
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
    async publishVitalSignsReceived(deviceId, patientId, data) {
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
    async publishDeviceAlert(alert) {
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
    async publishDeviceStatusChanged(deviceId, previousStatus, newStatus) {
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
    async publishDeviceConnectionLost(deviceId, lastSeen) {
        await this.publishEvent('device.connection.lost', {
            type: 'device.connection.lost',
            deviceId,
            lastSeen: lastSeen.toISOString(),
        });
    }
    /**
     * Subscribe to facility events
     */
    subscribeFacilityEvents(handler) {
        this.subscribeToEvents('facility.*', handler);
    }
    /**
     * Subscribe to patient events
     */
    subscribePatientEvents(handler) {
        this.subscribeToEvents('patient.*', handler);
    }
    /**
     * Cache device data
     */
    async cacheDeviceData(deviceId, data, ttl = 3600) {
        try {
            const key = `device:${deviceId}`;
            await this.redis.setex(key, ttl, JSON.stringify(data));
            logger_1.default.debug(`Cached device data: ${deviceId}`);
        }
        catch (error) {
            logger_1.default.error('Error caching device data:', error);
        }
    }
    /**
     * Get cached device data
     */
    async getCachedDeviceData(deviceId) {
        try {
            const key = `device:${deviceId}`;
            const data = await this.redis.get(key);
            return data ? JSON.parse(data) : null;
        }
        catch (error) {
            logger_1.default.error('Error getting cached device data:', error);
            return null;
        }
    }
    /**
     * Clear device cache
     */
    async clearDeviceCache(deviceId) {
        try {
            const key = `device:${deviceId}`;
            await this.redis.del(key);
            logger_1.default.debug(`Cleared device cache: ${deviceId}`);
        }
        catch (error) {
            logger_1.default.error('Error clearing device cache:', error);
        }
    }
}
exports.EventService = EventService;
exports.default = EventService;
//# sourceMappingURL=EventService.js.map