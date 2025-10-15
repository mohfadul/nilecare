import { Router } from 'express';
import { InventoryController } from '../controllers/InventoryController';
import { validateRequest, inventorySchemas } from '../middleware/validation';
import { reservationLimiter, adminLimiter } from '../middleware/rateLimiter';
import { 
  attachFacilityContext, 
  requireFacility, 
  validateInventoryAccess,
  logInventoryAccess 
} from '../middleware/facilityMiddleware';

/**
 * Inventory Routes
 * All routes require authentication (applied at app level)
 */

const router = Router();
const controller = new InventoryController();

// Apply facility middleware to all routes
router.use(attachFacilityContext);
router.use(requireFacility);
router.use(validateInventoryAccess);
router.use(logInventoryAccess);

/**
 * @swagger
 * /api/v1/inventory/reserve:
 *   post:
 *     summary: Reserve stock (Step 1 of dispensing)
 *     tags: [Inventory - Atomic Operations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - itemId
 *               - quantity
 *               - reference
 *               - reservationType
 *               - facilityId
 *             properties:
 *               itemId:
 *                 type: string
 *                 format: uuid
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *               reservationType:
 *                 type: string
 *                 enum: [medication_dispense, procedure, transfer, other]
 *               reference:
 *                 type: string
 *                 description: Prescription ID or order reference
 *               expiresInMinutes:
 *                 type: integer
 *                 default: 30
 *               batchNumber:
 *                 type: string
 *               facilityId:
 *                 type: string
 *                 format: uuid
 *               locationId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Stock reserved successfully
 *       409:
 *         description: Insufficient stock
 */
router.post(
  '/reserve',
  reservationLimiter,
  validateRequest(inventorySchemas.reserveStock),
  controller.reserveStock
);

/**
 * @swagger
 * /api/v1/inventory/commit/{reservationId}:
 *   post:
 *     summary: Commit reservation (Step 2a - after successful dispensing)
 *     tags: [Inventory - Atomic Operations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reservationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - facilityId
 *             properties:
 *               facilityId:
 *                 type: string
 *                 format: uuid
 *               actualQuantity:
 *                 type: integer
 *                 description: Can be less than reserved if partial
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Reservation committed
 *       404:
 *         description: Reservation not found
 *       410:
 *         description: Reservation expired
 */
router.post(
  '/commit/:reservationId',
  reservationLimiter,
  controller.commitReservation
);

/**
 * @swagger
 * /api/v1/inventory/rollback/{reservationId}:
 *   post:
 *     summary: Rollback reservation (Step 2b - if dispensing fails)
 *     tags: [Inventory - Atomic Operations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reservationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *               - facilityId
 *             properties:
 *               reason:
 *                 type: string
 *               facilityId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Reservation rolled back
 */
router.post(
  '/rollback/:reservationId',
  reservationLimiter,
  controller.rollbackReservation
);

/**
 * @swagger
 * /api/v1/inventory/check-availability:
 *   get:
 *     summary: Check stock availability
 *     tags: [Inventory - Query]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: quantity
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: facilityId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: locationId
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Stock availability details
 */
router.get('/check-availability', controller.checkAvailability);

/**
 * @swagger
 * /api/v1/inventory/receive:
 *   post:
 *     summary: Receive stock from purchase order
 *     tags: [Inventory - Stock Operations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - itemId
 *               - quantity
 *               - batchNumber
 *               - expiryDate
 *               - locationId
 *               - facilityId
 *     responses:
 *       201:
 *         description: Stock received successfully
 */
router.post(
  '/receive',
  adminLimiter,
  validateRequest(inventorySchemas.receiveStock),
  controller.receiveStock
);

/**
 * @swagger
 * /api/v1/inventory/adjust:
 *   post:
 *     summary: Adjust stock (damage, loss, count correction)
 *     tags: [Inventory - Stock Operations]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/adjust',
  adminLimiter,
  validateRequest(inventorySchemas.adjustStock),
  controller.adjustStock
);

/**
 * @swagger
 * /api/v1/inventory/transfer:
 *   post:
 *     summary: Transfer stock between locations
 *     tags: [Inventory - Stock Operations]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/transfer',
  adminLimiter,
  validateRequest(inventorySchemas.transferStock),
  controller.transferStock
);

/**
 * @swagger
 * /api/v1/inventory/{itemId}/stock:
 *   get:
 *     summary: Get stock levels for item
 *     tags: [Inventory - Query]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:itemId/stock', controller.getItemStock);

/**
 * @swagger
 * /api/v1/inventory/low-stock:
 *   get:
 *     summary: Get low stock items
 *     tags: [Inventory - Reports]
 *     security:
 *       - bearerAuth: []
 */
router.get('/low-stock', controller.getLowStockItems);

/**
 * @swagger
 * /api/v1/inventory/expiring:
 *   get:
 *     summary: Get expiring batches
 *     tags: [Inventory - Reports]
 *     security:
 *       - bearerAuth: []
 */
router.get('/expiring', controller.getExpiringBatches);

/**
 * @swagger
 * /api/v1/inventory/movements:
 *   get:
 *     summary: Get stock movement history
 *     tags: [Inventory - Reports]
 *     security:
 *       - bearerAuth: []
 */
router.get('/movements', controller.getStockMovements);

/**
 * @swagger
 * /api/v1/inventory/valuation:
 *   get:
 *     summary: Get stock valuation report
 *     tags: [Inventory - Reports]
 *     security:
 *       - bearerAuth: []
 */
router.get('/valuation', controller.getStockValuation);

/**
 * @swagger
 * /api/v1/inventory/pharmacy-report:
 *   get:
 *     summary: Get pharmacy-specific stock report
 *     tags: [Inventory - Pharmacy]
 *     security:
 *       - bearerAuth: []
 */
router.get('/pharmacy-report', controller.getPharmacyStockReport);

/**
 * @swagger
 * /api/v1/inventory/medication-stock:
 *   get:
 *     summary: Get all medication stock (pharmacy view)
 *     tags: [Inventory - Pharmacy]
 *     security:
 *       - bearerAuth: []
 */
router.get('/medication-stock', controller.getMedicationStock);

export default router;

