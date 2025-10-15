/**
 * Webhook Routes
 * Receives callbacks from Payment Gateway and other services
 */

import { Router, Request, Response } from 'express';
import InvoiceService from '../services/invoice.service';
import { logger } from '../config/logger.config';
import { logBillingAction } from '../middleware/audit-logger.middleware';

const router = Router();
const invoiceService = new InvoiceService();

/**
 * Payment confirmed webhook
 * POST /api/v1/webhooks/payment-confirmed
 * Called by Payment Gateway when payment is confirmed
 */
router.post('/payment-confirmed', async (req: Request, res: Response) => {
  try {
    const { invoiceId, paymentId, amount, paymentGatewayReference, paymentMethod } = req.body;

    // Validate webhook data
    if (!invoiceId || !paymentId || !amount) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_WEBHOOK_DATA',
          message: 'Missing required fields: invoiceId, paymentId, amount'
        }
      });
    }

    // Apply payment to invoice
    await invoiceService.applyPayment(
      invoiceId,
      paymentId,
      amount,
      'payment-gateway-webhook'
    );

    // Log webhook received
    await logBillingAction({
      action: 'webhook_payment_confirmed',
      resourceType: 'invoice',
      resourceId: invoiceId,
      userId: 'system',
      result: 'success',
      metadata: {
        paymentId,
        amount,
        paymentGatewayReference,
        paymentMethod
      }
    });

    logger.info('Payment confirmed webhook processed', {
      invoiceId,
      paymentId,
      amount
    });

    res.status(200).json({
      success: true,
      message: 'Payment confirmation received and processed'
    });

  } catch (error: any) {
    logger.error('Payment confirmed webhook error', {
      error: error.message,
      body: req.body
    });

    res.status(500).json({
      success: false,
      error: {
        code: 'WEBHOOK_PROCESSING_FAILED',
        message: error.message || 'Failed to process webhook'
      }
    });
  }
});

/**
 * Payment failed webhook
 * POST /api/v1/webhooks/payment-failed
 * Called by Payment Gateway when payment fails
 */
router.post('/payment-failed', async (req: Request, res: Response) => {
  try {
    const { invoiceId, paymentId, reason } = req.body;

    if (!invoiceId || !paymentId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_WEBHOOK_DATA',
          message: 'Missing required fields: invoiceId, paymentId'
        }
      });
    }

    // Log webhook received
    await logBillingAction({
      action: 'webhook_payment_failed',
      resourceType: 'invoice',
      resourceId: invoiceId,
      userId: 'system',
      result: 'warning',
      metadata: {
        paymentId,
        reason
      }
    });

    logger.warn('Payment failed webhook received', {
      invoiceId,
      paymentId,
      reason
    });

    res.status(200).json({
      success: true,
      message: 'Payment failure notification received'
    });

  } catch (error: any) {
    logger.error('Payment failed webhook error', {
      error: error.message,
      body: req.body
    });

    res.status(500).json({
      success: false,
      error: {
        code: 'WEBHOOK_PROCESSING_FAILED',
        message: error.message || 'Failed to process webhook'
      }
    });
  }
});

export default router;

