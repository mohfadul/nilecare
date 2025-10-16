import { Router } from 'express';
import { statsController } from '../controllers/StatsController';
import { authenticate } from '../../../shared/middleware/auth';

const router = Router();

/**
 * @swagger
 * /api/v1/stats:
 *   get:
 *     summary: Get all medication statistics
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
 *                     prescriptions:
 *                       type: object
 *                       properties:
 *                         active:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                     alerts:
 *                       type: object
 *                       properties:
 *                         unacknowledged:
 *                           type: integer
 *                     administrations:
 *                       type: object
 *                       properties:
 *                         due:
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
 * /api/v1/stats/prescriptions/active:
 *   get:
 *     summary: Get active prescriptions count
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active prescriptions count retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  '/prescriptions/active',
  authenticate,
  statsController.getActivePrescriptionsCount.bind(statsController)
);

/**
 * @swagger
 * /api/v1/stats/alerts/count:
 *   get:
 *     summary: Get unacknowledged medication alerts count
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Alerts count retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  '/alerts/count',
  authenticate,
  statsController.getAlertsCount.bind(statsController)
);

/**
 * @swagger
 * /api/v1/stats/alerts/recent:
 *   get:
 *     summary: Get recent medication alerts
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of recent alerts to retrieve
 *     responses:
 *       200:
 *         description: Recent alerts retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  '/alerts/recent',
  authenticate,
  statsController.getRecentAlerts.bind(statsController)
);

/**
 * @swagger
 * /api/v1/stats/medications/due:
 *   get:
 *     summary: Get due medications count
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Due medications count retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  '/medications/due',
  authenticate,
  statsController.getDueMedicationsCount.bind(statsController)
);

export default router;

