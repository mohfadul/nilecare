import { Router } from 'express';
import { validateRequest, schemas } from '../middleware/validation';
// ✅ MIGRATED: Now using local authentication middleware (copied from shared)
import { authenticate, requireRole, requirePermission } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { BillingController } from '../controllers/BillingController';

// Factory function to create routes with controller injection
export function createBillingRoutes(billingController: BillingController) {
  const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Billing:
 *       type: object
 *       required:
 *         - patientId
 *         - amount
 *         - currency
 *         - description
 *         - items
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         patientId:
 *           type: string
 *           format: uuid
 *         appointmentId:
 *           type: string
 *           format: uuid
 *         invoiceNumber:
 *           type: string
 *         amount:
 *           type: number
 *         currency:
 *           type: string
 *         status:
 *           type: string
 *           enum: [draft, pending, paid, overdue, cancelled, refunded]
 *         description:
 *           type: string
 *         items:
 *           type: array
 *           items:
 *             type: object
 *         dueDate:
 *           type: string
 *           format: date-time
 *         paidDate:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/v1/billing:
 *   get:
 *     summary: Get all billing records
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of billing records
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/',
  requireRole(['admin', 'receptionist', 'doctor']),
  validateRequest({ query: schemas.pagination }),
  asyncHandler(billingController.getAllBillings)
);

/**
 * @swagger
 * /api/v1/billing/{id}:
 *   get:
 *     summary: Get billing by ID
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/:id',
  requireRole(['admin', 'receptionist', 'doctor']),
  validateRequest({ params: schemas.id }),
  asyncHandler(billingController.getBillingById)
);

/**
 * @swagger
 * /api/v1/billing:
 *   post:
 *     summary: Create a new billing record
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/',
  requireRole(['admin', 'receptionist']),
  requirePermission('billing:create'),
  validateRequest({ body: schemas.billing }),
  asyncHandler(billingController.createBilling)
);

/**
 * @swagger
 * /api/v1/billing/{id}:
 *   put:
 *     summary: Update billing record
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 */
router.put(
  '/:id',
  requireRole(['admin', 'receptionist']),
  requirePermission('billing:update'),
  validateRequest({ params: schemas.id }),
  asyncHandler(billingController.updateBilling)
);

/**
 * @swagger
 * /api/v1/billing/{id}/pay:
 *   patch:
 *     summary: Mark billing as paid
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  '/:id/pay',
  requireRole(['admin', 'receptionist']),
  requirePermission('billing:update'),
  validateRequest({ params: schemas.id }),
  asyncHandler(billingController.markAsPaid)
);

/**
 * @swagger
 * /api/v1/billing/{id}/cancel:
 *   patch:
 *     summary: Cancel billing record
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  '/:id/cancel',
  requireRole(['admin']),
  requirePermission('billing:cancel'),
  validateRequest({ params: schemas.id }),
  asyncHandler(billingController.cancelBilling)
);

/**
 * @swagger
 * /api/v1/billing/patient/{patientId}:
 *   get:
 *     summary: Get patient billing history
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/patient/:patientId',
  requireRole(['admin', 'receptionist', 'doctor']),
  validateRequest({ params: schemas.id }),
  asyncHandler(billingController.getPatientBillingHistory)
);

  return router;
}

