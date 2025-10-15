import { Request, Response } from 'express';
import type mysql from 'mysql2/promise';
import { AppointmentService } from '../services/AppointmentService';
import { logger } from '../utils/logger';
import { getOrganizationId } from '../config/constants';

export class AppointmentController {
  private appointmentService: AppointmentService;

  constructor(db?: mysql.Pool) {
    // Pool will be injected or created
    this.appointmentService = db ? new AppointmentService(db) : null as any;
  }

  setDatabase(db: mysql.Pool) {
    this.appointmentService = new AppointmentService(db);
  }

  getAllAppointments = async (req: Request, res: Response) => {
    try {
      // PRIORITY 1.3: Dynamic organization ID from JWT token
      const organizationId = getOrganizationId(req.user?.organizationId);

      const result = await this.appointmentService.getAllAppointments(
        req.query,
        organizationId
      );

      res.status(200).json({
        success: true,
        data: {
          appointments: result.data,
          pagination: result.pagination
        }
      });
    } catch (error: any) {
      logger.error('Error in getAllAppointments:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to fetch appointments' }
      });
    }
  };

  getAppointmentById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      // PRIORITY 1.3: Dynamic organization ID from JWT token
      const organizationId = getOrganizationId(req.user?.organizationId);

      const appointment = await this.appointmentService.getAppointmentById(
        id,
        organizationId
      );

      res.status(200).json({
        success: true,
        data: appointment
      });
    } catch (error: any) {
      logger.error('Error in getAppointmentById:', error);
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: { message: error.message || 'Failed to fetch appointment' }
      });
    }
  };

  createAppointment = async (req: Request, res: Response) => {
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

      const appointment = await this.appointmentService.createAppointment(
        req.body,
        organizationId,
        userId
      );

      res.status(201).json({
        success: true,
        data: appointment
      });
    } catch (error: any) {
      logger.error('Error in createAppointment:', error);
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: { message: error.message || 'Failed to create appointment' }
      });
    }
  };

  updateAppointment = async (req: Request, res: Response) => {
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

      const appointment = await this.appointmentService.updateAppointment(
        id,
        req.body,
        organizationId,
        userId
      );

      res.status(200).json({
        success: true,
        data: appointment
      });
    } catch (error: any) {
      logger.error('Error in updateAppointment:', error);
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: { message: error.message || 'Failed to update appointment' }
      });
    }
  };

  cancelAppointment = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      // PRIORITY 1.3: Dynamic organization ID from JWT token
      const organizationId = getOrganizationId(req.user?.organizationId);
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: { message: 'User ID is required (ensure JWT token is valid)' }
        });
      }

      await this.appointmentService.cancelAppointment(
        id,
        organizationId,
        userId,
        reason
      );

      res.status(200).json({
        success: true,
        message: 'Appointment cancelled successfully'
      });
    } catch (error: any) {
      logger.error('Error in cancelAppointment:', error);
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: { message: error.message || 'Failed to cancel appointment' }
      });
    }
  };

  confirmAppointment = async (req: Request, res: Response) => {
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

      const appointment = await this.appointmentService.confirmAppointment(
        id,
        organizationId,
        userId
      );

      res.status(200).json({
        success: true,
        data: appointment
      });
    } catch (error: any) {
      logger.error('Error in confirmAppointment:', error);
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: { message: error.message || 'Failed to confirm appointment' }
      });
    }
  };

  completeAppointment = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      // PRIORITY 1.3: Dynamic organization ID from JWT token
      const organizationId = getOrganizationId(req.user?.organizationId);
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: { message: 'User ID is required (ensure JWT token is valid)' }
        });
      }

      const appointment = await this.appointmentService.completeAppointment(
        id,
        organizationId,
        userId,
        notes
      );

      res.status(200).json({
        success: true,
        data: appointment
      });
    } catch (error: any) {
      logger.error('Error in completeAppointment:', error);
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: { message: error.message || 'Failed to complete appointment' }
      });
    }
  };

  getProviderAvailability = async (req: Request, res: Response) => {
    try {
      const { providerId, date, duration } = req.query;

      if (!providerId || !date) {
        return res.status(400).json({
          success: false,
          error: { message: 'Provider ID and date are required' }
        });
      }

      const availableSlots = await this.appointmentService.getProviderAvailability(
        providerId as string,
        new Date(date as string),
        duration ? parseInt(duration as string) : 30
      );

      res.status(200).json({
        success: true,
        data: { availableSlots }
      });
    } catch (error: any) {
      logger.error('Error in getProviderAvailability:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to fetch provider availability' }
      });
    }
  };
}

