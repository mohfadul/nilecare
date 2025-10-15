/**
 * Notification Integration
 * Communicates with the Notification Service for alerts and events
 */
import { DeviceAlert } from '../types';
export declare class NotificationIntegration {
    private client;
    constructor();
    /**
     * Send critical alert notification
     */
    sendCriticalAlert(alert: DeviceAlert): Promise<void>;
    /**
     * Send device registration notification
     */
    sendDeviceRegistrationNotification(deviceId: string, deviceName: string, facilityId: string, createdBy: string): Promise<void>;
    /**
     * Send device connection lost notification
     */
    sendDeviceConnectionLostNotification(deviceId: string, deviceName: string, lastSeen: Date): Promise<void>;
    /**
     * Send device maintenance notification
     */
    sendMaintenanceNotification(deviceId: string, deviceName: string, maintenanceType: string, dueDate: Date): Promise<void>;
}
export default NotificationIntegration;
//# sourceMappingURL=NotificationIntegration.d.ts.map