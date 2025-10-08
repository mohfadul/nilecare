/**
 * Payment Controller
 * Handles all payment-related HTTP requests
 */

import { Request, Response } from 'express';
import { PaymentService } from '../services/payment.service';
import { VerificationService } from '../services/verification.service';
import { CreatePaymentDto, CreatePaymentDtoValidator } from '../dtos/create-payment.dto';
import { VerifyPaymentDto, VerifyPaymentDtoValidator } from '../dtos/verify-payment.dto';

export class PaymentController {
  constructor(
    private paymentService: PaymentService,
    private verificationService: VerificationService
  ) {}

  /**
   * Initiate a new payment
   * POST /api/v1/payments/initiate
   */
  async initiatePayment(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const { error, value } = CreatePaymentDtoValidator.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.details.map(d => d.message)
        });
        return;
      }

      const createPaymentDto: CreatePaymentDto = value;

      // Add user context
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
        return;
      }

      // Initiate payment
      const result = await this.paymentService.initiatePayment(createPaymentDto, userId);

      res.status(200).json({
        success: true,
        data: result
      });

    } catch (error: any) {
      console.error('Initiate payment error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Payment initiation failed'
      });
    }
  }

  /**
   * Get payment by ID
   * GET /api/v1/payments/:id
   */
  async getPayment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const payment = await this.paymentService.getPaymentById(id);

      if (!payment) {
        res.status(404).json({
          success: false,
          error: 'Payment not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: payment
      });

    } catch (error: any) {
      console.error('Get payment error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to retrieve payment'
      });
    }
  }

  /**
   * List payments with filters
   * GET /api/v1/payments
   */
  async listPayments(req: Request, res: Response): Promise<void> {
    try {
      const {
        facilityId,
        patientId,
        status,
        providerName,
        startDate,
        endDate,
        page = 1,
        limit = 50
      } = req.query;

      const filters: any = {};
      if (facilityId) filters.facilityId = facilityId;
      if (patientId) filters.patientId = patientId;
      if (status) filters.status = status;
      if (providerName) filters.providerName = providerName;
      if (startDate && endDate) {
        filters.dateRange = { start: startDate, end: endDate };
      }

      const result = await this.paymentService.listPayments(
        filters,
        parseInt(page as string),
        parseInt(limit as string)
      );

      res.status(200).json({
        success: true,
        data: result.payments,
        pagination: {
          total: result.total,
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          totalPages: Math.ceil(result.total / parseInt(limit as string))
        }
      });

    } catch (error: any) {
      console.error('List payments error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to retrieve payments'
      });
    }
  }

  /**
   * Verify payment manually
   * POST /api/v1/payments/verify
   */
  async verifyPayment(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const { error, value } = VerifyPaymentDtoValidator.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.details.map(d => d.message)
        });
        return;
      }

      const verifyPaymentDto: VerifyPaymentDto = value;

      // Add user context
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
        return;
      }

      // Override verifiedBy with actual user ID
      verifyPaymentDto.verifiedBy = userId;

      // Verify payment
      const result = await this.verificationService.verifyPayment(verifyPaymentDto);

      res.status(200).json({
        success: true,
        data: result
      });

    } catch (error: any) {
      console.error('Verify payment error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Payment verification failed'
      });
    }
  }

  /**
   * Get pending verifications
   * GET /api/v1/payments/pending-verification
   */
  async getPendingVerifications(req: Request, res: Response): Promise<void> {
    try {
      const { facilityId } = req.query;

      const pendingPayments = await this.verificationService.getPendingVerifications(
        facilityId as string
      );

      res.status(200).json({
        success: true,
        data: pendingPayments,
        count: pendingPayments.length
      });

    } catch (error: any) {
      console.error('Get pending verifications error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to retrieve pending verifications'
      });
    }
  }

  /**
   * Cancel payment
   * PATCH /api/v1/payments/:id/cancel
   */
  async cancelPayment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
        return;
      }

      const result = await this.paymentService.cancelPayment(id, reason, userId);

      res.status(200).json({
        success: true,
        data: result
      });

    } catch (error: any) {
      console.error('Cancel payment error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Payment cancellation failed'
      });
    }
  }

  /**
   * Get payment statistics
   * GET /api/v1/payments/stats
   */
  async getPaymentStats(req: Request, res: Response): Promise<void> {
    try {
      const { facilityId, startDate, endDate } = req.query;

      const stats = await this.paymentService.getPaymentStatistics({
        facilityId: facilityId as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined
      });

      res.status(200).json({
        success: true,
        data: stats
      });

    } catch (error: any) {
      console.error('Get payment stats error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to retrieve statistics'
      });
    }
  }

  /**
   * Webhook handler for payment providers
   * POST /api/v1/payments/webhook/:provider
   */
  async handleWebhook(req: Request, res: Response): Promise<void> {
    try {
      const { provider } = req.params;
      const webhookData = req.body;

      await this.paymentService.handleProviderWebhook(provider, webhookData);

      res.status(200).json({
        success: true,
        message: 'Webhook processed successfully'
      });

    } catch (error: any) {
      console.error('Webhook error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Webhook processing failed'
      });
    }
  }
}

export default PaymentController;

