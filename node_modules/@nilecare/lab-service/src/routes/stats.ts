import { Router } from 'express';
import { statsController } from '../controllers/StatsController';
import { authenticate } from '../../../shared/middleware/auth';

const router = Router();

/**
 * @swagger
 * /api/v1/stats:
 *   get:
 *     summary: Get all lab statistics
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
 *                     orders:
 *                       type: object
 *                       properties:
 *                         pending:
 *                           type: integer
 *                         today:
 *                           type: integer
 *                         completed:
 *                           type: integer
 *                     results:
 *                       type: object
 *                       properties:
 *                         criticalUnacknowledged:
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
 * /api/v1/stats/orders/pending:
 *   get:
 *     summary: Get pending lab orders count
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pending orders count retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  '/orders/pending',
  authenticate,
  statsController.getPendingOrdersCount.bind(statsController)
);

/**
 * @swagger
 * /api/v1/stats/orders/today:
 *   get:
 *     summary: Get today's lab orders count
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Today's orders count retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  '/orders/today',
  authenticate,
  statsController.getTodayOrdersCount.bind(statsController)
);

/**
 * @swagger
 * /api/v1/stats/results/critical:
 *   get:
 *     summary: Get unacknowledged critical results count
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Critical results count retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  '/results/critical',
  authenticate,
  statsController.getCriticalResultsCount.bind(statsController)
);

/**
 * @swagger
 * /api/v1/stats/results/critical/recent:
 *   get:
 *     summary: Get recent critical results
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of recent critical results to retrieve
 *     responses:
 *       200:
 *         description: Recent critical results retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  '/results/critical/recent',
  authenticate,
  statsController.getRecentCriticalResults.bind(statsController)
);

export default router;

