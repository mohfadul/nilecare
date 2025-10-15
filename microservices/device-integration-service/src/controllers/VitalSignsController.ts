/**
 * Vital Signs Controller
 * Handles HTTP requests for vital signs data
 */

import { Request, Response, NextFunction } from 'express';
import { Pool } from 'pg';
import VitalSignsService from '../services/VitalSignsService';
import { VitalSignsQueryParams } from '../models/VitalSigns';

export class VitalSignsController {
  private vitalSignsService: VitalSignsService;

  constructor(pool: Pool) {
    this.vitalSignsService = new VitalSignsService(pool);
  }

  /**
   * Submit vital signs data
   * POST /api/v1/vital-signs
   */
  submitVitalSigns = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const vitalSigns = await this.vitalSignsService.processVitalSigns({
        ...req.body,
        tenantId: req.user!.tenantId,
      });

      res.status(201).json({
        success: true,
        data: vitalSigns,
        message: 'Vital signs processed successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get vital signs by device
   * GET /api/v1/vital-signs/device/:deviceId
   */
  getVitalSignsByDevice = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { deviceId } = req.params;
      const queryParams: VitalSignsQueryParams = {
        tenantId: req.user!.tenantId,
        deviceId,
        startTime: req.query.startTime ? new Date(req.query.startTime as string) : undefined,
        endTime: req.query.endTime ? new Date(req.query.endTime as string) : undefined,
        page: parseInt(req.query.page as string, 10) || 1,
        limit: parseInt(req.query.limit as string, 10) || 100,
      };

      const result = await this.vitalSignsService.getVitalSignsByDevice(deviceId, queryParams);

      res.status(200).json({
        success: true,
        data: result.data,
        pagination: {
          page: queryParams.page,
          limit: queryParams.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / (queryParams.limit || 100)),
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get vital signs by patient
   * GET /api/v1/vital-signs/patient/:patientId
   */
  getVitalSignsByPatient = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { patientId } = req.params;
      const queryParams: VitalSignsQueryParams = {
        tenantId: req.user!.tenantId,
        patientId,
        startTime: req.query.startTime ? new Date(req.query.startTime as string) : undefined,
        endTime: req.query.endTime ? new Date(req.query.endTime as string) : undefined,
        page: parseInt(req.query.page as string, 10) || 1,
        limit: parseInt(req.query.limit as string, 10) || 100,
      };

      const result = await this.vitalSignsService.getVitalSignsByPatient(patientId, queryParams);

      res.status(200).json({
        success: true,
        data: result.data,
        pagination: {
          page: queryParams.page,
          limit: queryParams.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / (queryParams.limit || 100)),
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get latest vital signs for a device
   * GET /api/v1/vital-signs/device/:deviceId/latest
   */
  getLatestVitalSigns = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { deviceId } = req.params;
      const vitalSigns = await this.vitalSignsService.getLatestVitalSigns(
        deviceId,
        req.user!.tenantId
      );

      res.status(200).json({
        success: true,
        data: vitalSigns,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get vital signs trends
   * GET /api/v1/vital-signs/patient/:patientId/trends
   */
  getVitalSignsTrends = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { patientId } = req.params;
      const { parameter, startTime, endTime, interval } = req.query;

      if (!parameter || !startTime || !endTime) {
        res.status(400).json({
          success: false,
          error: 'Parameter, startTime, and endTime are required',
        });
        return;
      }

      const trends = await this.vitalSignsService.getVitalSignsTrends(
        patientId,
        parameter as string,
        new Date(startTime as string),
        new Date(endTime as string),
        req.user!.tenantId,
        interval as string
      );

      res.status(200).json({
        success: true,
        data: trends,
      });
    } catch (error) {
      next(error);
    }
  };
}

export default VitalSignsController;

