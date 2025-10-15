/**
 * Device Controller
 * Handles HTTP requests for device management
 */

import { Request, Response, NextFunction } from 'express';
import { Pool } from 'pg';
import DeviceService from '../services/DeviceService';
import { DeviceQueryParams } from '../models/Device';

export class DeviceController {
  private deviceService: DeviceService;

  constructor(pool: Pool) {
    this.deviceService = new DeviceService(pool);
  }

  /**
   * Register a new device
   * POST /api/v1/devices
   */
  registerDevice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const device = await this.deviceService.registerDevice({
        ...req.body,
        createdBy: req.user!.userId,
        tenantId: req.user!.tenantId,
      });

      res.status(201).json({
        success: true,
        data: device,
        message: 'Device registered successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get device by ID
   * GET /api/v1/devices/:deviceId
   */
  getDevice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { deviceId } = req.params;
      const device = await this.deviceService.getDevice(deviceId, req.user!.tenantId);

      res.status(200).json({
        success: true,
        data: device,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get all devices with filtering and pagination
   * GET /api/v1/devices
   */
  getAllDevices = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const queryParams: DeviceQueryParams = {
        tenantId: req.user!.tenantId,
        facilityId: req.query.facilityId as string,
        deviceType: req.query.deviceType as any,
        status: req.query.status as any,
        linkedPatientId: req.query.linkedPatientId as string,
        protocol: req.query.protocol as any,
        calibrationStatus: req.query.calibrationStatus as any,
        page: parseInt(req.query.page as string, 10) || 1,
        limit: parseInt(req.query.limit as string, 10) || 50,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'ASC' | 'DESC',
      };

      const result = await this.deviceService.getAllDevices(queryParams);

      res.status(200).json({
        success: true,
        data: result.devices,
        pagination: {
          page: queryParams.page,
          limit: queryParams.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / (queryParams.limit || 50)),
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update device
   * PATCH /api/v1/devices/:deviceId
   */
  updateDevice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { deviceId } = req.params;
      const device = await this.deviceService.updateDevice(
        deviceId,
        {
          ...req.body,
          updatedBy: req.user!.userId,
        },
        req.user!.tenantId
      );

      res.status(200).json({
        success: true,
        data: device,
        message: 'Device updated successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update device status
   * PATCH /api/v1/devices/:deviceId/status
   */
  updateDeviceStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { deviceId } = req.params;
      const device = await this.deviceService.updateDeviceStatus(
        deviceId,
        {
          status: req.body.status,
          changeReason: req.body.changeReason,
          errorMessage: req.body.errorMessage,
          errorCode: req.body.errorCode,
          updatedBy: req.user!.userId,
        },
        req.user!.tenantId
      );

      res.status(200).json({
        success: true,
        data: device,
        message: 'Device status updated successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete device
   * DELETE /api/v1/devices/:deviceId
   */
  deleteDevice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { deviceId } = req.params;
      await this.deviceService.deleteDevice(deviceId, req.user!.tenantId);

      res.status(200).json({
        success: true,
        message: 'Device deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get devices by facility
   * GET /api/v1/devices/facility/:facilityId
   */
  getDevicesByFacility = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { facilityId } = req.params;
      const devices = await this.deviceService.getDevicesByFacility(
        facilityId,
        req.user!.tenantId
      );

      res.status(200).json({
        success: true,
        data: devices,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get online devices
   * GET /api/v1/devices/status/online
   */
  getOnlineDevices = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const devices = await this.deviceService.getOnlineDevices(req.user!.tenantId);

      res.status(200).json({
        success: true,
        data: devices,
        count: devices.length,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Check device health
   * GET /api/v1/devices/:deviceId/health
   */
  checkDeviceHealth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { deviceId } = req.params;
      const health = await this.deviceService.checkDeviceHealth(deviceId, req.user!.tenantId);

      res.status(200).json({
        success: true,
        data: health,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update device heartbeat
   * POST /api/v1/devices/:deviceId/heartbeat
   */
  updateHeartbeat = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { deviceId } = req.params;
      await this.deviceService.updateHeartbeat(deviceId, req.user!.tenantId);

      res.status(200).json({
        success: true,
        message: 'Heartbeat updated',
      });
    } catch (error) {
      next(error);
    }
  };
}

export default DeviceController;

