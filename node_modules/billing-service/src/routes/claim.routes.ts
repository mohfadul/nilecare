/**
 * Claim Routes
 * HTTP routes for insurance claims operations
 */

import { Router } from 'express';
import { ClaimController } from '../controllers/claim.controller';
import { authenticate, requirePermission } from '../middleware/auth.middleware';
import { billingRateLimiter } from '../middleware/rate-limiter.middleware';
import { asyncHandler } from '../middleware/error-handler.middleware';

const router = Router();
const claimController = new ClaimController();

/**
 * Create claim
 * POST /api/v1/claims
 * Requires: Authentication + claims:create permission
 */
router.post(
  '/',
  authenticate,
  requirePermission('claims', 'create'),
  billingRateLimiter,
  asyncHandler(claimController.createClaim.bind(claimController))
);

/**
 * Get claim by ID
 * GET /api/v1/claims/:id
 * Requires: Authentication + claims:read permission
 */
router.get(
  '/:id',
  authenticate,
  requirePermission('claims', 'read'),
  asyncHandler(claimController.getClaimById.bind(claimController))
);

/**
 * Submit claim to insurance
 * POST /api/v1/claims/:id/submit
 * Requires: Authentication + claims:submit permission
 */
router.post(
  '/:id/submit',
  authenticate,
  requirePermission('claims', 'submit'),
  asyncHandler(claimController.submitClaim.bind(claimController))
);

/**
 * Process claim payment (when insurance pays)
 * POST /api/v1/claims/:id/payment
 * Requires: Authentication + claims:process permission
 */
router.post(
  '/:id/payment',
  authenticate,
  requirePermission('claims', 'process'),
  asyncHandler(claimController.processClaimPayment.bind(claimController))
);

/**
 * Deny claim
 * POST /api/v1/claims/:id/deny
 * Requires: Authentication + claims:process permission
 */
router.post(
  '/:id/deny',
  authenticate,
  requirePermission('claims', 'process'),
  asyncHandler(claimController.denyClaim.bind(claimController))
);

/**
 * File appeal for denied claim
 * POST /api/v1/claims/:id/appeal
 * Requires: Authentication + claims:appeal permission
 */
router.post(
  '/:id/appeal',
  authenticate,
  requirePermission('claims', 'appeal'),
  asyncHandler(claimController.fileAppeal.bind(claimController))
);

/**
 * List claims by status
 * GET /api/v1/claims/by-status/:status
 * Requires: Authentication + claims:read permission
 */
router.get(
  '/by-status/:status',
  authenticate,
  requirePermission('claims', 'read'),
  asyncHandler(claimController.listClaimsByStatus.bind(claimController))
);

export default router;

