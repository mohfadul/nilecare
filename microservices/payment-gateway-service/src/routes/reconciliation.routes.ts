/**
 * Reconciliation Routes
 * HTTP routes for payment reconciliation operations
 */

import { Router } from 'express';
import { authGuard } from '../guards/payment-auth.guard';
import { financeRoleGuard } from '../guards/finance-role.guard';
import { validateBody } from '../middleware/validation.middleware';
import { ReconciliationDtoValidator } from '../dtos/reconciliation.dto';

const router = Router();

// All reconciliation routes require authentication + finance role
router.use(authGuard);
router.use(financeRoleGuard);

/**
 * Create reconciliation
 * POST /api/v1/reconciliation
 */
router.post(
  '/',
  validateBody(ReconciliationDtoValidator.schema),
  async (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Reconciliation endpoint - implementation in progress'
    });
  }
);

/**
 * Get reconciliation by ID
 * GET /api/v1/reconciliation/:id
 */
router.get('/:id', async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Get reconciliation endpoint'
  });
});

/**
 * Resolve discrepancy
 * POST /api/v1/reconciliation/resolve
 */
router.post(
  '/resolve',
  validateBody(ReconciliationDtoValidator.resolveSchema),
  async (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Resolve discrepancy endpoint'
    });
  }
);

export default router;

