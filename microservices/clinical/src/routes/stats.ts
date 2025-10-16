import { Router } from 'express';
import { StatsController } from '../controllers/StatsController';
// ✅ MIGRATED: Using shared authentication middleware
import { authenticate, requireRole } from '../../../shared/middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const statsController = new StatsController();

/**
 * @swagger
 * /api/v1/stats:
 *   get:
 *     summary: Get all clinical statistics
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
 *                     patients:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                     encounters:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         today:
 *                           type: integer
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  '/',
  authenticate,
  requireRole(['doctor', 'nurse', 'admin']),
  asyncHandler(statsController.getAllStats)
);

/**
 * @swagger
 * /api/v1/stats/patients/count:
 *   get:
 *     summary: Get total patients count
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Patient count retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  '/patients/count',
  authenticate,
  requireRole(['doctor', 'nurse', 'admin']),
  asyncHandler(statsController.getPatientsCount)
);

/**
 * @swagger
 * /api/v1/stats/patients/recent:
 *   get:
 *     summary: Get recent patients
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of recent patients to retrieve
 *     responses:
 *       200:
 *         description: Recent patients retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  '/patients/recent',
  authenticate,
  requireRole(['doctor', 'nurse', 'admin']),
  asyncHandler(statsController.getRecentPatients)
);

/**
 * @swagger
 * /api/v1/stats/encounters/count:
 *   get:
 *     summary: Get total encounters count
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Encounter count retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  '/encounters/count',
  authenticate,
  requireRole(['doctor', 'nurse', 'admin']),
  asyncHandler(statsController.getEncountersCount)
);

/**
 * @swagger
 * /api/v1/stats/encounters/today:
 *   get:
 *     summary: Get today's encounters
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Today's encounters retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  '/encounters/today',
  authenticate,
  requireRole(['doctor', 'nurse', 'admin']),
  asyncHandler(statsController.getTodayEncounters)
);

export default router;

