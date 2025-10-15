import { Request, Response } from 'express';
import type mysql from 'mysql2/promise';
import { SchedulingService } from '../services/SchedulingService';
import { logger } from '../utils/logger';
import { getOrganizationId } from '../config/constants';

export class SchedulingController {
  private schedulingService: SchedulingService;

  constructor(db?: mysql.Pool) {
    this.schedulingService = db ? new SchedulingService(db) : null as any;
  }

  setDatabase(db: mysql.Pool) {
    this.schedulingService = new SchedulingService(db);
  }

  getAllSchedules = async (req: Request, res: Response) => {
    try {
      // PRIORITY 1.3: Dynamic organization ID from JWT token
      const organizationId = getOrganizationId(req.user?.organizationId);

      const result = await this.schedulingService.getAllSchedules(
        req.query,
        organizationId
      );

      res.status(200).json({
        success: true,
        data: {
          schedules: result.data,
          pagination: result.pagination
        }
      });
    } catch (error: any) {
      logger.error('Error in getAllSchedules:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to fetch schedules' }
      });
    }
  };

  getScheduleById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      // PRIORITY 1.3: Dynamic organization ID from JWT token
      const organizationId = getOrganizationId(req.user?.organizationId);

      const schedule = await this.schedulingService.getScheduleById(id, organizationId);

      res.status(200).json({
        success: true,
        data: schedule
      });
    } catch (error: any) {
      logger.error('Error in getScheduleById:', error);
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: { message: error.message || 'Failed to fetch schedule' }
      });
    }
  };

  createSchedule = async (req: Request, res: Response) => {
    try {
      // PRIORITY 1.3: Dynamic organization ID from JWT token
      const organizationId = getOrganizationId(req.user?.organizationId);
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: { message: 'User ID is required (ensure JWT token is valid)' }
        });
      }

      const schedule = await this.schedulingService.createSchedule(
        req.body,
        organizationId,
        userId
      );

      res.status(201).json({
        success: true,
        data: schedule
      });
    } catch (error: any) {
      logger.error('Error in createSchedule:', error);
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: { message: error.message || 'Failed to create schedule' }
      });
    }
  };

  updateSchedule = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      // PRIORITY 1.3: Dynamic organization ID from JWT token
      const organizationId = getOrganizationId(req.user?.organizationId);
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: { message: 'User ID is required (ensure JWT token is valid)' }
        });
      }

      const schedule = await this.schedulingService.updateSchedule(
        id,
        req.body,
        organizationId,
        userId
      );

      res.status(200).json({
        success: true,
        data: schedule
      });
    } catch (error: any) {
      logger.error('Error in updateSchedule:', error);
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: { message: error.message || 'Failed to update schedule' }
      });
    }
  };

  deleteSchedule = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      // PRIORITY 1.3: Dynamic organization ID from JWT token
      const organizationId = getOrganizationId(req.user?.organizationId);
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: { message: 'User ID is required (ensure JWT token is valid)' }
        });
      }

      await this.schedulingService.deleteSchedule(id, organizationId, userId);

      res.status(200).json({
        success: true,
        message: 'Schedule cancelled successfully'
      });
    } catch (error: any) {
      logger.error('Error in deleteSchedule:', error);
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: { message: error.message || 'Failed to cancel schedule' }
      });
    }
  };

  getStaffSchedule = async (req: Request, res: Response) => {
    try {
      const { staffId } = req.params;
      const { startDate, endDate } = req.query;
      // PRIORITY 1.3: Dynamic organization ID from JWT token
      const organizationId = getOrganizationId(req.user?.organizationId);

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          error: { message: 'Start date and end date are required' }
        });
      }

      const schedules = await this.schedulingService.getStaffSchedule(
        staffId,
        new Date(startDate as string),
        new Date(endDate as string),
        organizationId
      );

      res.status(200).json({
        success: true,
        data: schedules
      });
    } catch (error: any) {
      logger.error('Error in getStaffSchedule:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to fetch staff schedule' }
      });
    }
  };
}

