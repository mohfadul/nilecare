/**
 * Device Controller
 * Handles HTTP requests for device management
 */
import { Request, Response, NextFunction } from 'express';
import { Pool } from 'pg';
export declare class DeviceController {
    private deviceService;
    constructor(pool: Pool);
    /**
     * Register a new device
     * POST /api/v1/devices
     */
    registerDevice: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Get device by ID
     * GET /api/v1/devices/:deviceId
     */
    getDevice: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Get all devices with filtering and pagination
     * GET /api/v1/devices
     */
    getAllDevices: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Update device
     * PATCH /api/v1/devices/:deviceId
     */
    updateDevice: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Update device status
     * PATCH /api/v1/devices/:deviceId/status
     */
    updateDeviceStatus: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Delete device
     * DELETE /api/v1/devices/:deviceId
     */
    deleteDevice: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Get devices by facility
     * GET /api/v1/devices/facility/:facilityId
     */
    getDevicesByFacility: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Get online devices
     * GET /api/v1/devices/status/online
     */
    getOnlineDevices: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Check device health
     * GET /api/v1/devices/:deviceId/health
     */
    checkDeviceHealth: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Update device heartbeat
     * POST /api/v1/devices/:deviceId/heartbeat
     */
    updateHeartbeat: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}
export default DeviceController;
//# sourceMappingURL=DeviceController.d.ts.map