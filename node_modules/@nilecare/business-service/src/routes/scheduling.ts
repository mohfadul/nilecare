import { Router } from 'express';
import { validateRequest, schemas } from '../middleware/validation';
// ✅ MIGRATED: Now using local authentication middleware (copied from shared)
import { authenticate, requireRole, requirePermission } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { SchedulingController } from '../controllers/SchedulingController';

// Factory function to create routes with controller injection
export function createSchedulingRoutes(schedulingController: SchedulingController) {
  const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Schedule:
 *       type: object
 *       required:
 *         - staffId
 *         - startTime
 *         - endTime
 *         - scheduleType
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         staffId:
 *           type: string
 *           format: uuid
 *         startTime:
 *           type: string
 *           format: date-time
 *         endTime:
 *           type: string
 *           format: date-time
 *         scheduleType:
 *           type: string
 *           enum: [shift, appointment, time-off, break, meeting]
 *         location:
 *           type: string
 *         notes:
 *           type: string
 *         status:
 *           type: string
 *           enum: [scheduled, active, completed, cancelled]
 */

/**
 * @swagger
 * /api/v1/scheduling:
 *   get:
 *     summary: Get all schedules
 *     tags: [Scheduling]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/',
  requireRole(['admin', 'doctor', 'nurse', 'receptionist']),
  validateRequest({ query: schemas.pagination }),
  asyncHandler(schedulingController.getAllSchedules)
);

/**
 * @swagger
 * /api/v1/scheduling/{id}:
 *   get:
 *     summary: Get schedule by ID
 *     tags: [Scheduling]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/:id',
  requireRole(['admin', 'doctor', 'nurse', 'receptionist']),
  validateRequest({ params: schemas.id }),
  asyncHandler(schedulingController.getScheduleById)
);

/**
 * @swagger
 * /api/v1/scheduling:
 *   post:
 *     summary: Create a new schedule
 *     tags: [Scheduling]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/',
  requireRole(['admin', 'receptionist']),
  requirePermission('scheduling:create'),
  validateRequest({ body: schemas.schedule }),
  asyncHandler(schedulingController.createSchedule)
);

/**
 * @swagger
 * /api/v1/scheduling/{id}:
 *   put:
 *     summary: Update schedule
 *     tags: [Scheduling]
 *     security:
 *       - bearerAuth: []
 */
router.put(
  '/:id',
  requireRole(['admin', 'receptionist']),
  requirePermission('scheduling:update'),
  validateRequest({ params: schemas.id }),
  asyncHandler(schedulingController.updateSchedule)
);

/**
 * @swagger
 * /api/v1/scheduling/{id}:
 *   delete:
 *     summary: Cancel schedule
 *     tags: [Scheduling]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  '/:id',
  requireRole(['admin', 'receptionist']),
  requirePermission('scheduling:delete'),
  validateRequest({ params: schemas.id }),
  asyncHandler(schedulingController.deleteSchedule)
);

/**
 * @swagger
 * /api/v1/scheduling/staff/{staffId}:
 *   get:
 *     summary: Get staff schedule
 *     tags: [Scheduling]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: staffId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 */
router.get(
  '/staff/:staffId',
  requireRole(['admin', 'doctor', 'nurse', 'receptionist']),
  validateRequest({ params: schemas.id }),
  asyncHandler(schedulingController.getStaffSchedule)
);

  return router;
}

