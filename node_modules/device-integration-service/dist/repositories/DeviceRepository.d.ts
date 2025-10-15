/**
 * Device Repository
 * Handles all database operations for devices
 */
import { Pool } from 'pg';
import { IDevice, DeviceRegistrationDTO, DeviceUpdateDTO, DeviceStatusUpdateDTO, DeviceQueryParams } from '../models/Device';
export declare class DeviceRepository {
    private pool;
    constructor(pool: Pool);
    create(deviceData: DeviceRegistrationDTO): Promise<IDevice>;
    findById(deviceId: string, tenantId: string): Promise<IDevice | null>;
    findBySerialNumber(serialNumber: string, tenantId: string): Promise<IDevice | null>;
    findAll(params: DeviceQueryParams): Promise<{
        devices: IDevice[];
        total: number;
    }>;
    update(deviceId: string, updateData: DeviceUpdateDTO, tenantId: string): Promise<IDevice>;
    updateStatus(deviceId: string, statusData: DeviceStatusUpdateDTO, tenantId: string): Promise<IDevice>;
    updateLastSeen(deviceId: string, tenantId: string): Promise<void>;
    delete(deviceId: string, tenantId: string): Promise<void>;
    getDevicesByFacility(facilityId: string, tenantId: string): Promise<IDevice[]>;
    getOnlineDevices(tenantId: string): Promise<IDevice[]>;
    private mapRowToDevice;
}
export default DeviceRepository;
//# sourceMappingURL=DeviceRepository.d.ts.map