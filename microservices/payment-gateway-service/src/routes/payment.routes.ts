/**
 * Payment Routes
 * HTTP routes for payment operations
 */

import { Router } from 'express';
import PaymentController from '../controllers/payment.controller';
// ✅ UPDATED: Using shared authentication middleware (centralized auth)
import { authenticate } from '../../../shared/middleware/auth';
import { financeRoleGuard } from '../guards/finance-role.guard';
import { paymentRateLimiter, webhookRateLimiter } from '../middleware/rate-limiter';
import { validateBody } from '../middleware/validation.middleware';
import { CreatePaymentDtoValidator } from '../dtos/create-payment.dto';
import { VerifyPaymentDtoValidator } from '../dtos/verify-payment.dto';

// Import services
import PaymentService from '../services/payment.service';
import VerificationService from '../services/verification.service';

// Initialize services
const paymentService = new PaymentService();
const verificationService = new VerificationService();

// Initialize controller
const paymentController = new PaymentController(paymentService, verificationService);

const router = Router();

/**
 * Initiate payment
 * POST /api/v1/payments/initiate
 * Requires: Authentication
 * Rate Limit: 10 per minute
 */
router.post(
  '/initiate',
  authenticate,
  paymentRateLimiter,
  validateBody(CreatePaymentDtoValidator.schema),
  paymentController.initiatePayment.bind(paymentController)
);

/**
 * Get payment by ID
 * GET /api/v1/payments/:id
 * Requires: Authentication
 */
router.get(
  '/:id',
  authenticate,
  paymentController.getPayment.bind(paymentController)
);

/**
 * List payments with filters
 * GET /api/v1/payments
 * Requires: Authentication
 */
router.get(
  '/',
  authenticate,
  paymentController.listPayments.bind(paymentController)
);

/**
 * Verify payment (manual verification)
 * POST /api/v1/payments/verify
 * Requires: Authentication + Finance Role
 */
router.post(
  '/verify',
  authenticate,
  financeRoleGuard,
  validateBody(VerifyPaymentDtoValidator.schema),
  paymentController.verifyPayment.bind(paymentController)
);

/**
 * Get pending verifications
 * GET /api/v1/payments/pending-verification
 * Requires: Authentication + Finance Role
 */
router.get(
  '/pending-verification',
  authenticate,
  financeRoleGuard,
  paymentController.getPendingVerifications.bind(paymentController)
);

/**
 * Cancel payment
 * PATCH /api/v1/payments/:id/cancel
 * Requires: Authentication + Finance Role
 */
router.patch(
  '/:id/cancel',
  authenticate,
  financeRoleGuard,
  paymentController.cancelPayment.bind(paymentController)
);

/**
 * Get payment statistics
 * GET /api/v1/payments/stats
 * Requires: Authentication + Finance Role
 */
router.get(
  '/stats',
  authenticate,
  financeRoleGuard,
  paymentController.getPaymentStats.bind(paymentController)
);

/**
 * Provider webhook handler
 * POST /api/v1/payments/webhook/:provider
 * No authentication (verified by webhook signature)
 * Rate Limit: 1000 per minute
 */
router.post(
  '/webhook/:provider',
  webhookRateLimiter,
  paymentController.handleWebhook.bind(paymentController)
);

export default router;

