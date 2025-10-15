/**
 * Event Service
 * Handles pub/sub messaging and inter-service communication
 */
export declare class EventService {
    private redis;
    private publisher?;
    private subscriber?;
    constructor();
    /**
     * Initialize pub/sub clients
     */
    initializePubSub(): void;
    /**
     * Publish event to a channel
     */
    publishEvent(channel: string, event: any): Promise<void>;
    /**
     * Subscribe to events on a channel
     */
    subscribeToEvents(channel: string, handler: (event: any) => void): void;
    /**
     * Publish device registered event
     */
    publishDeviceRegistered(deviceId: string, deviceData: any): Promise<void>;
    /**
     * Publish vital signs received event
     */
    publishVitalSignsReceived(deviceId: string, patientId: string, data: any): Promise<void>;
    /**
     * Publish device alert event
     */
    publishDeviceAlert(alert: any): Promise<void>;
    /**
     * Publish device status changed event
     */
    publishDeviceStatusChanged(deviceId: string, previousStatus: string, newStatus: string): Promise<void>;
    /**
     * Publish device connection lost event
     */
    publishDeviceConnectionLost(deviceId: string, lastSeen: Date): Promise<void>;
    /**
     * Subscribe to facility events
     */
    subscribeFacilityEvents(handler: (event: any) => void): void;
    /**
     * Subscribe to patient events
     */
    subscribePatientEvents(handler: (event: any) => void): void;
    /**
     * Cache device data
     */
    cacheDeviceData(deviceId: string, data: any, ttl?: number): Promise<void>;
    /**
     * Get cached device data
     */
    getCachedDeviceData(deviceId: string): Promise<any | null>;
    /**
     * Clear device cache
     */
    clearDeviceCache(deviceId: string): Promise<void>;
}
export default EventService;
//# sourceMappingURL=EventService.d.ts.map