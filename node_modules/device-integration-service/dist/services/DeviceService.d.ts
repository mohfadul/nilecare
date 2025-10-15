/**
 * Device Service
 * Core business logic for device management
 */
import { Pool } from 'pg';
import { DeviceRegistrationDTO, DeviceUpdateDTO, DeviceStatusUpdateDTO, DeviceQueryParams, IDevice } from '../models/Device';
export declare class DeviceService {
    private deviceRepository;
    private fhirIntegration;
    private notificationIntegration;
    constructor(pool: Pool);
    /**
     * Register a new device
     */
    registerDevice(deviceData: DeviceRegistrationDTO): Promise<IDevice>;
    /**
     * Get device by ID
     */
    getDevice(deviceId: string, tenantId: string): Promise<IDevice>;
    /**
     * Get all devices with filtering and pagination
     */
    getAllDevices(params: DeviceQueryParams): Promise<{
        devices: IDevice[];
        total: number;
    }>;
    /**
     * Update device
     */
    updateDevice(deviceId: string, updateData: DeviceUpdateDTO, tenantId: string): Promise<IDevice>;
    /**
     * Update device status
     */
    updateDeviceStatus(deviceId: string, statusData: DeviceStatusUpdateDTO, tenantId: string): Promise<IDevice>;
    /**
     * Delete device
     */
    deleteDevice(deviceId: string, tenantId: string): Promise<void>;
    /**
     * Get devices by facility
     */
    getDevicesByFacility(facilityId: string, tenantId: string): Promise<IDevice[]>;
    /**
     * Get online devices
     */
    getOnlineDevices(tenantId: string): Promise<IDevice[]>;
    /**
     * Update device heartbeat
     */
    updateHeartbeat(deviceId: string, tenantId: string): Promise<void>;
    /**
     * Check device health
     */
    checkDeviceHealth(deviceId: string, tenantId: string): Promise<any>;
}
export default DeviceService;
//# sourceMappingURL=DeviceService.d.ts.map