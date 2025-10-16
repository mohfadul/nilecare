import { Router } from 'express';
import { statsController } from '../controllers/StatsController';
import { authenticate } from '../../../shared/middleware/auth';

const router = Router();

/**
 * @swagger
 * /api/v1/stats:
 *   get:
 *     summary: Get all appointment statistics
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
 *                     appointments:
 *                       type: object
 *                       properties:
 *                         today:
 *                           type: integer
 *                         pending:
 *                           type: integer
 *                         upcoming7Days:
 *                           type: integer
 *                         cancelledToday:
 *                           type: integer
 *                         total:
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
 * /api/v1/stats/appointments/today:
 *   get:
 *     summary: Get today's appointments count
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Today's appointments count retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  '/appointments/today',
  authenticate,
  statsController.getTodayAppointmentsCount.bind(statsController)
);

/**
 * @swagger
 * /api/v1/stats/appointments/today/details:
 *   get:
 *     summary: Get today's appointments details
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Today's appointments retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  '/appointments/today/details',
  authenticate,
  statsController.getTodayAppointments.bind(statsController)
);

/**
 * @swagger
 * /api/v1/stats/appointments/pending:
 *   get:
 *     summary: Get pending appointments count
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pending appointments count retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  '/appointments/pending',
  authenticate,
  statsController.getPendingAppointmentsCount.bind(statsController)
);

/**
 * @swagger
 * /api/v1/stats/appointments/upcoming:
 *   get:
 *     summary: Get upcoming appointments count (next 7 days)
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Upcoming appointments count retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  '/appointments/upcoming',
  authenticate,
  statsController.getUpcomingAppointmentsCount.bind(statsController)
);

/**
 * @swagger
 * /api/v1/stats/appointments/cancelled:
 *   get:
 *     summary: Get cancelled appointments count (today)
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cancelled appointments count retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  '/appointments/cancelled',
  authenticate,
  statsController.getCancelledAppointmentsCount.bind(statsController)
);

export default router;

