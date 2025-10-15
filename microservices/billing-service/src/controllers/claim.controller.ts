/**
 * Claim Controller
 * Handles HTTP requests for insurance claims
 */

import { Request, Response } from 'express';
import ClaimService from '../services/claim.service';
import { CreateClaimDtoValidator } from '../dtos/create-claim.dto';
import { ClaimStatus } from '../entities/claim.entity';
import { logger } from '../config/logger.config';

export class ClaimController {
  private claimService: ClaimService;

  constructor() {
    this.claimService = new ClaimService();
  }

  /**
   * Create new claim
   * POST /api/v1/claims
   */
  async createClaim(req: Request, res: Response): Promise<void> {
    try {
      // Validate request
      const { error, value } = CreateClaimDtoValidator.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: error.details.map(d => d.message)
          }
        });
        return;
      }

      const userId = req.user!.id;

      const claim = await this.claimService.createClaim(value, userId);

      res.status(201).json({
        success: true,
        data: claim
      });

    } catch (error: any) {
      logger.error('Create claim error', { error: error.message });
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to create claim'
        }
      });
    }
  }

  /**
   * Get claim by ID
   * GET /api/v1/claims/:id
   */
  async getClaimById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const claim = await this.claimService.getClaimById(id);

      if (!claim) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Claim not found'
          }
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: claim
      });

    } catch (error: any) {
      logger.error('Get claim error', { error: error.message });
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to retrieve claim'
        }
      });
    }
  }

  /**
   * Submit claim to insurance
   * POST /api/v1/claims/:id/submit
   */
  async submitClaim(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const claim = await this.claimService.submitClaim(id, userId);

      res.status(200).json({
        success: true,
        data: claim,
        message: 'Claim submitted successfully'
      });

    } catch (error: any) {
      logger.error('Submit claim error', { error: error.message });
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to submit claim'
        }
      });
    }
  }

  /**
   * Process claim payment
   * POST /api/v1/claims/:id/payment
   */
  async processClaimPayment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { paidAmount, allowedAmount, remittanceInfo } = req.body;
      const userId = req.user!.id;

      if (!paidAmount || !allowedAmount) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'paidAmount and allowedAmount are required'
          }
        });
        return;
      }

      const claim = await this.claimService.processClaimPayment(
        id,
        paidAmount,
        allowedAmount,
        userId,
        remittanceInfo
      );

      res.status(200).json({
        success: true,
        data: claim,
        message: 'Claim payment processed successfully'
      });

    } catch (error: any) {
      logger.error('Process claim payment error', { error: error.message });
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to process claim payment'
        }
      });
    }
  }

  /**
   * Deny claim
   * POST /api/v1/claims/:id/deny
   */
  async denyClaim(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { denialReasonCode, denialReason } = req.body;
      const userId = req.user!.id;

      if (!denialReasonCode || !denialReason) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'denialReasonCode and denialReason are required'
          }
        });
        return;
      }

      const claim = await this.claimService.denyClaim(
        id,
        denialReasonCode,
        denialReason,
        userId
      );

      res.status(200).json({
        success: true,
        data: claim,
        message: 'Claim marked as denied'
      });

    } catch (error: any) {
      logger.error('Deny claim error', { error: error.message });
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to deny claim'
        }
      });
    }
  }

  /**
   * File appeal
   * POST /api/v1/claims/:id/appeal
   */
  async fileAppeal(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { appealNotes } = req.body;
      const userId = req.user!.id;

      if (!appealNotes) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'appealNotes is required'
          }
        });
        return;
      }

      const claim = await this.claimService.fileAppeal(id, appealNotes, userId);

      res.status(200).json({
        success: true,
        data: claim,
        message: 'Appeal filed successfully'
      });

    } catch (error: any) {
      logger.error('File appeal error', { error: error.message });
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to file appeal'
        }
      });
    }
  }

  /**
   * List claims by status
   * GET /api/v1/claims/by-status/:status
   */
  async listClaimsByStatus(req: Request, res: Response): Promise<void> {
    try {
      const { status } = req.params;

      const claims = await this.claimService.listClaimsByStatus(status as ClaimStatus);

      res.status(200).json({
        success: true,
        data: claims,
        count: claims.length
      });

    } catch (error: any) {
      logger.error('List claims by status error', { error: error.message });
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to retrieve claims'
        }
      });
    }
  }
}

export default InvoiceController;

