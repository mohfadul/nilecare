import { Router } from 'express';
import { validateRequest, schemas } from '../middleware/validation';
// ✅ MIGRATED: Now using local authentication middleware (copied from shared)
import { authenticate, requireRole, requirePermission } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { AppointmentController } from '../controllers/AppointmentController';

// Factory function to create routes with controller injection
export function createAppointmentRoutes(controller: AppointmentController) {
  const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Appointment:
 *       type: object
 *       required:
 *         - patientId
 *         - providerId
 *         - appointmentDate
 *         - appointmentType
 *         - duration
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         patientId:
 *           type: string
 *           format: uuid
 *         providerId:
 *           type: string
 *           format: uuid
 *         appointmentDate:
 *           type: string
 *           format: date-time
 *         appointmentType:
 *           type: string
 *           enum: [consultation, follow-up, procedure, emergency, telemedicine]
 *         duration:
 *           type: integer
 *           description: Duration in minutes
 *         status:
 *           type: string
 *           enum: [scheduled, confirmed, in-progress, completed, cancelled, no-show]
 *         reason:
 *           type: string
 *           description: Reason for the appointment
 *         notes:
 *           type: string
 *           description: Additional notes
 *         location:
 *           type: string
 *           description: Appointment location or room
 *         priority:
 *           type: string
 *           enum: [routine, urgent, emergency]
 *         reminderSent:
 *           type: boolean
 *           description: Whether reminder was sent
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/v1/appointments:
 *   get:
 *     summary: Get all appointments
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of appointments per page
 *       - in: query
 *         name: patientId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by patient ID
 *       - in: query
 *         name: providerId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by provider ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [scheduled, confirmed, in-progress, completed, cancelled, no-show]
 *         description: Filter by appointment status
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by appointment date
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter appointments from this date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter appointments until this date
 *     responses:
 *       200:
 *         description: List of appointments retrieved successfully
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
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Appointment'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         pages:
 *                           type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
router.get(
  '/',
  requireRole(['doctor', 'nurse', 'admin', 'receptionist']),
  validateRequest({ query: schemas.pagination }),
  asyncHandler(controller.getAllAppointments)
);

/**
 * @swagger
 * /api/v1/appointments/{id}:
 *   get:
 *     summary: Get appointment by ID
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Appointment ID
 *     responses:
 *       200:
 *         description: Appointment retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Appointment'
 *       404:
 *         description: Appointment not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  '/:id',
  requireRole(['doctor', 'nurse', 'admin', 'receptionist']),
  validateRequest({ params: schemas.id }),
  asyncHandler(controller.getAppointmentById)
);

/**
 * @swagger
 * /api/v1/appointments:
 *   post:
 *     summary: Create a new appointment
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Appointment'
 *     responses:
 *       201:
 *         description: Appointment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Appointment'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
router.post(
  '/',
  requireRole(['doctor', 'nurse', 'admin', 'receptionist']),
  requirePermission('appointments:create'),
  asyncHandler(controller.createAppointment)
);

/**
 * @swagger
 * /api/v1/appointments/{id}:
 *   put:
 *     summary: Update appointment
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Appointment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Appointment'
 *     responses:
 *       200:
 *         description: Appointment updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Appointment'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Appointment not found
 *       500:
 *         description: Internal server error
 */
router.put(
  '/:id',
  requireRole(['doctor', 'nurse', 'admin', 'receptionist']),
  requirePermission('appointments:update'),
  validateRequest({ params: schemas.id }),
  asyncHandler(controller.updateAppointment)
);

/**
 * @swagger
 * /api/v1/appointments/{id}:
 *   delete:
 *     summary: Cancel appointment
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Appointment ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for cancellation
 *     responses:
 *       200:
 *         description: Appointment cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Appointment not found
 *       500:
 *         description: Internal server error
 */
router.delete(
  '/:id',
  requireRole(['doctor', 'nurse', 'admin', 'receptionist']),
  requirePermission('appointments:cancel'),
  validateRequest({ params: schemas.id }),
  asyncHandler(controller.cancelAppointment)
);

/**
 * @swagger
 * /api/v1/appointments/{id}/confirm:
 *   patch:
 *     summary: Confirm appointment
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Appointment ID
 *     responses:
 *       200:
 *         description: Appointment confirmed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Appointment'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Appointment not found
 *       500:
 *         description: Internal server error
 */
router.patch(
  '/:id/confirm',
  requireRole(['doctor', 'nurse', 'admin', 'receptionist']),
  requirePermission('appointments:confirm'),
  validateRequest({ params: schemas.id }),
  asyncHandler(controller.confirmAppointment)
);

/**
 * @swagger
 * /api/v1/appointments/{id}/complete:
 *   patch:
 *     summary: Complete appointment
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Appointment ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *                 description: Completion notes
 *               followUpRequired:
 *                 type: boolean
 *                 description: Whether follow-up is required
 *               followUpDate:
 *                 type: string
 *                 format: date-time
 *                 description: Suggested follow-up date
 *     responses:
 *       200:
 *         description: Appointment completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Appointment'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Appointment not found
 *       500:
 *         description: Internal server error
 */
router.patch(
  '/:id/complete',
  requireRole(['doctor', 'nurse']),
  requirePermission('appointments:complete'),
  validateRequest({ params: schemas.id }),
  asyncHandler(controller.completeAppointment)
);

/**
 * @swagger
 * /api/v1/appointments/availability:
 *   get:
 *     summary: Get provider availability
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: providerId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Provider ID
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Date to check availability
 *       - in: query
 *         name: duration
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Appointment duration in minutes
 *     responses:
 *       200:
 *         description: Provider availability retrieved successfully
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
 *                     availableSlots:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           startTime:
 *                             type: string
 *                             format: date-time
 *                           endTime:
 *                             type: string
 *                             format: date-time
 *                           available:
 *                             type: boolean
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  '/availability',
  requireRole(['doctor', 'nurse', 'admin', 'receptionist']),
  asyncHandler(controller.getProviderAvailability)
);

  return router;
}
