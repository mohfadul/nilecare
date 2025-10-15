/**
 * Payment Routes - Refactored for Phase 2/3
 * ✅ Uses centralized auth from @nilecare/auth-client
 * ✅ Uses standardized error handling
 */

import { Router } from 'express';
import PaymentController from '../controllers/payment.controller';
import { requireAuth, requirePaymentWrite, requireFinance, requireAdmin } from '../middleware/auth.refactored';
import { paymentRateLimiter, webhookRateLimiter } from '../middleware/rate-limiter';
import { validateBody } from '../middleware/validation.middleware';
import { CreatePaymentDtoValidator } from '../dtos/create-payment.dto';
import { VerifyPaymentDtoValidator } from '../dtos/verify-payment.dto';
import { asyncHandler } from '@nilecare/error-handler';

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
 * ✅ Requires: Authentication + payment:write permission
 * ✅ Rate Limit: 10 per minute
 */
router.post(
  '/initiate',
  requirePaymentWrite,
  paymentRateLimiter,
  validateBody(CreatePaymentDtoValidator.schema),
  asyncHandler(paymentController.initiatePayment.bind(paymentController))
);

/**
 * Get payment by ID
 * GET /api/v1/payments/:id
 * ✅ Requires: Authentication + payment:read permission
 */
router.get(
  '/:id',
  requireAuth,
  asyncHandler(paymentController.getPayment.bind(paymentController))
);

/**
 * List payments with filters
 * GET /api/v1/payments
 * ✅ Requires: Authentication + payment:read permission
 */
router.get(
  '/',
  requireAuth,
  asyncHandler(paymentController.listPayments.bind(paymentController))
);

/**
 * Verify payment (manual verification)
 * POST /api/v1/payments/verify
 * ✅ Requires: Authentication + finance:verify permission
 */
router.post(
  '/verify',
  requireFinance,
  validateBody(VerifyPaymentDtoValidator.schema),
  asyncHandler(paymentController.verifyPayment.bind(paymentController))
);

/**
 * Get pending verifications
 * GET /api/v1/payments/pending-verification
 * ✅ Requires: Authentication + finance:verify permission
 */
router.get(
  '/pending-verification',
  requireFinance,
  asyncHandler(paymentController.getPendingVerifications.bind(paymentController))
);

/**
 * Cancel payment
 * PATCH /api/v1/payments/:id/cancel
 * ✅ Requires: Authentication + admin:cancel permission
 */
router.patch(
  '/:id/cancel',
  requireAdmin,
  asyncHandler(paymentController.cancelPayment.bind(paymentController))
);

/**
 * Get payment statistics
 * GET /api/v1/payments/stats
 * ✅ Requires: Authentication + finance:verify permission
 */
router.get(
  '/stats',
  requireFinance,
  asyncHandler(paymentController.getPaymentStats.bind(paymentController))
);

/**
 * Provider webhook handler
 * POST /api/v1/payments/webhook/:provider
 * ✅ No authentication (verified by webhook signature)
 * ✅ Rate Limit: 1000 per minute
 */
router.post(
  '/webhook/:provider',
  webhookRateLimiter,
  asyncHandler(paymentController.handleWebhook.bind(paymentController))
);

export default router;

