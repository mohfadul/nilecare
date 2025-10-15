import { Request, Response } from 'express';
import type mysql from 'mysql2/promise';
import { BillingService } from '../services/BillingService';
import { logger } from '../utils/logger';
import { getOrganizationId } from '../config/constants';

export class BillingController {
  private billingService: BillingService;

  constructor(db?: mysql.Pool) {
    this.billingService = db ? new BillingService(db) : null as any;
  }

  setDatabase(db: mysql.Pool) {
    this.billingService = new BillingService(db);
  }

  getAllBillings = async (req: Request, res: Response) => {
    try {
      // PRIORITY 1.3: Dynamic organization ID from JWT token
      const organizationId = getOrganizationId(req.user?.organizationId);

      const result = await this.billingService.getAllBillings(
        req.query,
        organizationId
      );

      res.status(200).json({
        success: true,
        data: {
          billings: result.data,
          pagination: result.pagination
        }
      });
    } catch (error: any) {
      logger.error('Error in getAllBillings:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to fetch billings' }
      });
    }
  };

  getBillingById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      // PRIORITY 1.3: Dynamic organization ID from JWT token
      const organizationId = getOrganizationId(req.user?.organizationId);

      const billing = await this.billingService.getBillingById(id, organizationId);

      return res.status(200).json({
        success: true,
        data: billing
      });
    } catch (error: any) {
      logger.error('Error in getBillingById:', error);
      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({
        success: false,
        error: { message: error.message || 'Failed to fetch billing' }
      });
    }
  };

  createBilling = async (req: Request, res: Response) => {
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

      const billing = await this.billingService.createBilling(
        req.body,
        organizationId,
        userId
      );

      return res.status(201).json({
        success: true,
        data: billing
      });
    } catch (error: any) {
      logger.error('Error in createBilling:', error);
      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({
        success: false,
        error: { message: error.message || 'Failed to create billing' }
      });
    }
  };

  updateBilling = async (req: Request, res: Response) => {
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

      const billing = await this.billingService.updateBilling(
        id,
        req.body,
        organizationId,
        userId
      );

      return res.status(200).json({
        success: true,
        data: billing
      });
    } catch (error: any) {
      logger.error('Error in updateBilling:', error);
      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({
        success: false,
        error: { message: error.message || 'Failed to update billing' }
      });
    }
  };

  markAsPaid = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { paymentMethod } = req.body;
      // PRIORITY 1.3: Dynamic organization ID from JWT token
      const organizationId = getOrganizationId(req.user?.organizationId);
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: { message: 'User ID is required (ensure JWT token is valid)' }
        });
      }

      if (!paymentMethod) {
        return res.status(400).json({
          success: false,
          error: { message: 'Payment method is required' }
        });
      }

      const billing = await this.billingService.markAsPaid(
        id,
        organizationId,
        userId,
        paymentMethod
      );

      return res.status(200).json({
        success: true,
        data: billing
      });
    } catch (error: any) {
      logger.error('Error in markAsPaid:', error);
      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({
        success: false,
        error: { message: error.message || 'Failed to mark billing as paid' }
      });
    }
  };

  cancelBilling = async (req: Request, res: Response) => {
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

      const billing = await this.billingService.cancelBilling(
        id,
        organizationId,
        userId
      );

      return res.status(200).json({
        success: true,
        data: billing
      });
    } catch (error: any) {
      logger.error('Error in cancelBilling:', error);
      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({
        success: false,
        error: { message: error.message || 'Failed to cancel billing' }
      });
    }
  };

  getPatientBillingHistory = async (req: Request, res: Response) => {
    try {
      const { patientId } = req.params;
      // PRIORITY 1.3: Dynamic organization ID from JWT token
      const organizationId = getOrganizationId(req.user?.organizationId);

      const billings = await this.billingService.getPatientBillingHistory(
        patientId,
        organizationId
      );

      res.status(200).json({
        success: true,
        data: billings
      });
    } catch (error: any) {
      logger.error('Error in getPatientBillingHistory:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to fetch patient billing history' }
      });
    }
  };
}

