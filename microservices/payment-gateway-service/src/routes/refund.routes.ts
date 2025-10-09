/**
 * Refund Routes
 * HTTP routes for payment refund operations
 */

import { Router } from 'express';
import { authGuard } from '../guards/payment-auth.guard';
import { financeRoleGuard } from '../guards/finance-role.guard';
import { adminRoleGuard } from '../guards/admin-role.guard';

const router = Router();

// All refund routes require authentication
router.use(authGuard);

/**
 * Create refund request
 * POST /api/v1/refunds
 * Requires: Finance role
 */
router.post(
  '/',
  financeRoleGuard,
  async (_req, res) => {
    res.status(200).json({
      success: true,
      message: 'Create refund endpoint'
    });
  }
);

/**
 * Get refund by ID
 * GET /api/v1/refunds/:id
 */
router.get('/:id', async (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Get refund endpoint'
  });
});

/**
 * Approve refund
 * PATCH /api/v1/refunds/:id/approve
 * Requires: Admin role
 */
router.patch(
  '/:id/approve',
  adminRoleGuard,
  async (_req, res) => {
    res.status(200).json({
      success: true,
      message: 'Approve refund endpoint'
    });
  }
);

/**
 * Reject refund
 * PATCH /api/v1/refunds/:id/reject
 * Requires: Admin role
 */
router.patch(
  '/:id/reject',
  adminRoleGuard,
  async (_req, res) => {
    res.status(200).json({
      success: true,
      message: 'Reject refund endpoint'
    });
  }
);

export default router;

