/**
 * Invoice Routes
 * HTTP routes for invoice operations
 */

import { Router } from 'express';
import InvoiceController from '../controllers/invoice.controller';
import { authenticate, requirePermission, requireRole } from '../middleware/auth.middleware';
import { billingRateLimiter } from '../middleware/rate-limiter.middleware';
import { asyncHandler } from '../middleware/error-handler.middleware';

const router = Router();
const invoiceController = new InvoiceController();

/**
 * Create invoice
 * POST /api/v1/invoices
 * Requires: Authentication + billing:create permission
 */
router.post(
  '/',
  authenticate,
  requirePermission('billing', 'create'),
  billingRateLimiter,
  asyncHandler(invoiceController.createInvoice.bind(invoiceController))
);

/**
 * Get invoice by ID
 * GET /api/v1/invoices/:id
 * Requires: Authentication + billing:read permission
 */
router.get(
  '/:id',
  authenticate,
  requirePermission('billing', 'read'),
  asyncHandler(invoiceController.getInvoiceById.bind(invoiceController))
);

/**
 * List invoices with filters
 * GET /api/v1/invoices
 * Requires: Authentication + billing:read permission
 */
router.get(
  '/',
  authenticate,
  requirePermission('billing', 'read'),
  asyncHandler(invoiceController.listInvoices.bind(invoiceController))
);

/**
 * Update invoice
 * PUT /api/v1/invoices/:id
 * Requires: Authentication + billing:update permission
 */
router.put(
  '/:id',
  authenticate,
  requirePermission('billing', 'update'),
  billingRateLimiter,
  asyncHandler(invoiceController.updateInvoice.bind(invoiceController))
);

/**
 * Cancel invoice
 * DELETE /api/v1/invoices/:id
 * Requires: Authentication + billing:delete permission
 */
router.delete(
  '/:id',
  authenticate,
  requirePermission('billing', 'delete'),
  asyncHandler(invoiceController.cancelInvoice.bind(invoiceController))
);

/**
 * Get invoice statistics
 * GET /api/v1/invoices/statistics
 * Requires: Authentication + billing:read permission
 */
router.get(
  '/statistics',
  authenticate,
  requirePermission('billing', 'read'),
  asyncHandler(invoiceController.getStatistics.bind(invoiceController))
);

/**
 * Sync payment status from Payment Gateway
 * POST /api/v1/invoices/:id/sync-payment
 * Requires: Authentication + billing:update permission
 */
router.post(
  '/:id/sync-payment',
  authenticate,
  requirePermission('billing', 'update'),
  asyncHandler(invoiceController.syncPaymentStatus.bind(invoiceController))
);

export default router;

