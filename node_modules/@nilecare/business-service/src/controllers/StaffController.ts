import { Request, Response } from 'express';
import type mysql from 'mysql2/promise';
import { StaffService } from '../services/StaffService';
import { logger } from '../utils/logger';
import { getOrganizationId } from '../config/constants';

export class StaffController {
  private staffService: StaffService;

  constructor(db?: mysql.Pool) {
    this.staffService = db ? new StaffService(db) : null as any;
  }

  setDatabase(db: mysql.Pool) {
    this.staffService = new StaffService(db);
  }

  getAllStaff = async (req: Request, res: Response) => {
    try {
      // PRIORITY 1.3: Dynamic organization ID from JWT token
      const organizationId = getOrganizationId(req.user?.organizationId);

      const result = await this.staffService.getAllStaff(req.query, organizationId);

      res.status(200).json({
        success: true,
        data: {
          staff: result.data,
          pagination: result.pagination
        }
      });
    } catch (error: any) {
      logger.error('Error in getAllStaff:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to fetch staff' }
      });
    }
  };

  getStaffById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      // PRIORITY 1.3: Dynamic organization ID from JWT token
      const organizationId = getOrganizationId(req.user?.organizationId);

      const staff = await this.staffService.getStaffById(id, organizationId);

      res.status(200).json({
        success: true,
        data: staff
      });
    } catch (error: any) {
      logger.error('Error in getStaffById:', error);
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: { message: error.message || 'Failed to fetch staff member' }
      });
    }
  };

  createStaff = async (req: Request, res: Response) => {
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

      const staff = await this.staffService.createStaff(
        req.body,
        organizationId,
        userId
      );

      res.status(201).json({
        success: true,
        data: staff
      });
    } catch (error: any) {
      logger.error('Error in createStaff:', error);
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: { message: error.message || 'Failed to create staff member' }
      });
    }
  };

  updateStaff = async (req: Request, res: Response) => {
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

      const staff = await this.staffService.updateStaff(
        id,
        req.body,
        organizationId,
        userId
      );

      res.status(200).json({
        success: true,
        data: staff
      });
    } catch (error: any) {
      logger.error('Error in updateStaff:', error);
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: { message: error.message || 'Failed to update staff member' }
      });
    }
  };

  deleteStaff = async (req: Request, res: Response) => {
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

      await this.staffService.deleteStaff(id, organizationId, userId);

      res.status(200).json({
        success: true,
        message: 'Staff member terminated successfully'
      });
    } catch (error: any) {
      logger.error('Error in deleteStaff:', error);
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: { message: error.message || 'Failed to terminate staff member' }
      });
    }
  };

  getStaffByRole = async (req: Request, res: Response) => {
    try {
      const { role } = req.params;
      // PRIORITY 1.3: Dynamic organization ID from JWT token
      const organizationId = getOrganizationId(req.user?.organizationId);

      const staff = await this.staffService.getStaffByRole(role, organizationId);

      res.status(200).json({
        success: true,
        data: staff
      });
    } catch (error: any) {
      logger.error('Error in getStaffByRole:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to fetch staff by role' }
      });
    }
  };

  getStaffByDepartment = async (req: Request, res: Response) => {
    try {
      const { department } = req.params;
      // PRIORITY 1.3: Dynamic organization ID from JWT token
      const organizationId = getOrganizationId(req.user?.organizationId);

      const staff = await this.staffService.getStaffByDepartment(
        department,
        organizationId
      );

      res.status(200).json({
        success: true,
        data: staff
      });
    } catch (error: any) {
      logger.error('Error in getStaffByDepartment:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to fetch staff by department' }
      });
    }
  };
}

