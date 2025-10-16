import { Router } from 'express';
import { statsController } from '../controllers/StatsController';
import { authenticate } from '../../../shared/middleware/auth';

const router = Router();

/**
 * @swagger
 * /api/v1/stats:
 *   get:
 *     summary: Get all inventory statistics
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     items:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         lowStock:
 *                           type: integer
 *                         outOfStock:
 *                           type: integer
 *                         expiringSoon:
 *                           type: integer
 *                     purchaseOrders:
 *                       type: object
 *                       properties:
 *                         pending:
 *                           type: integer
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  '/',
  authenticate,
  statsController.getAllStats.bind(statsController)
);

/**
 * @swagger
 * /api/v1/stats/items/low-stock:
 *   get:
 *     summary: Get low stock items count
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Low stock items count retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  '/items/low-stock',
  authenticate,
  statsController.getLowStockItemsCount.bind(statsController)
);

/**
 * @swagger
 * /api/v1/stats/items/low-stock/details:
 *   get:
 *     summary: Get low stock items details
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of low stock items to retrieve
 *     responses:
 *       200:
 *         description: Low stock items retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  '/items/low-stock/details',
  authenticate,
  statsController.getLowStockItems.bind(statsController)
);

/**
 * @swagger
 * /api/v1/stats/items/out-of-stock:
 *   get:
 *     summary: Get out of stock items count
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Out of stock items count retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  '/items/out-of-stock',
  authenticate,
  statsController.getOutOfStockCount.bind(statsController)
);

/**
 * @swagger
 * /api/v1/stats/items/expiring:
 *   get:
 *     summary: Get expiring items count (within 30 days)
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Expiring items count retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  '/items/expiring',
  authenticate,
  statsController.getExpiringItemsCount.bind(statsController)
);

/**
 * @swagger
 * /api/v1/stats/purchase-orders/pending:
 *   get:
 *     summary: Get pending purchase orders count
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pending purchase orders count retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  '/purchase-orders/pending',
  authenticate,
  statsController.getPendingPurchaseOrdersCount.bind(statsController)
);

export default router;

