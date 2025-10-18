import { Router } from 'express';
import { statsController } from '../controllers/stats.controller';
import { authenticate, requireRole } from '../middleware/authentication';

const router = Router();

/**
 * @swagger
 * /api/v1/stats:
 *   get:
 *     summary: Get all auth statistics
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
 *                     users:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         active24h:
 *                           type: integer
 *                         mfaEnabled:
 *                           type: integer
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  '/',
  authenticate,
  requireRole(['admin', 'super_admin']),
  statsController.getAllStats.bind(statsController)
);

/**
 * @swagger
 * /api/v1/stats/users/count:
 *   get:
 *     summary: Get total users count
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User count retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  '/users/count',
  authenticate,
  requireRole(['admin', 'super_admin']),
  statsController.getUsersCount.bind(statsController)
);

/**
 * @swagger
 * /api/v1/stats/users/active:
 *   get:
 *     summary: Get active users count (last 24h)
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active users count retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  '/users/active',
  authenticate,
  requireRole(['admin', 'super_admin']),
  statsController.getActiveUsersCount.bind(statsController)
);

/**
 * @swagger
 * /api/v1/stats/users/by-role:
 *   get:
 *     summary: Get users count by role
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Users by role retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  '/users/by-role',
  authenticate,
  requireRole(['admin', 'super_admin']),
  statsController.getUsersByRole.bind(statsController)
);

/**
 * @swagger
 * /api/v1/stats/logins/recent:
 *   get:
 *     summary: Get recent login activity
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of recent logins to retrieve
 *     responses:
 *       200:
 *         description: Recent logins retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  '/logins/recent',
  authenticate,
  requireRole(['admin', 'super_admin']),
  statsController.getRecentLogins.bind(statsController)
);

export default router;

