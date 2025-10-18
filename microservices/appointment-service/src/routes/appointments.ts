/**
 * Appointment Routes
 */

import { Router, Request, Response, NextFunction } from 'express';
import AppointmentService from '../services/AppointmentService';
import NotificationService from '../services/NotificationService';
import EventService from '../services/EventService';
import ReminderService from '../services/ReminderService';
// ✅ Using local authentication middleware
import { authenticate } from '../../shared/middleware/auth';
import { validateRequired } from '../middleware/validation';

const router = Router();

/**
 * GET /appointments
 * Get all appointments with pagination and filters
 */
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, status, providerId, patientId, date } = req.query;

    const result = await AppointmentService.getAppointments({
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      status: status as string,
      providerId: providerId as string,
      patientId: patientId as string,
      date: date as string,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /appointments/today
 * Get today's appointments
 */
router.get('/today', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { providerId } = req.query;
    const appointments = await AppointmentService.getTodayAppointments(providerId as string);

    res.json({
      success: true,
      data: appointments,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /appointments/stats
 * Get appointment statistics
 */
router.get('/stats', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { dateFrom, dateTo, providerId } = req.query;

    const stats = await AppointmentService.getAppointmentStats({
      dateFrom: dateFrom as string,
      dateTo: dateTo as string,
      providerId: providerId as string,
    });

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /appointments/:id
 * Get appointment by ID
 */
router.get('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const appointment = await AppointmentService.getAppointmentById(req.params.id);

    res.json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /appointments
 * Create new appointment
 */
router.post(
  '/',
  authenticate,
  validateRequired(['patientId', 'providerId', 'appointmentDate', 'appointmentTime', 'duration']),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const appointment = await AppointmentService.createAppointment(req.body);

      // Send notifications
      NotificationService.notifyNewAppointment(appointment);

      // Publish event
      await EventService.publishAppointmentCreated(appointment);

      // Schedule reminders
      await ReminderService.scheduleRemindersForAppointment(appointment.id);

      res.status(201).json({
        success: true,
        data: appointment,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /appointments/:id
 * Update appointment
 */
router.put('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const appointment = await AppointmentService.updateAppointment(req.params.id, req.body);

    // Send notifications
    NotificationService.notifyAppointmentUpdate(appointment);

    // Publish event
    await EventService.publishAppointmentUpdated(appointment);

    res.json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /appointments/:id/status
 * Update appointment status
 */
router.patch('/:id/status', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status } = req.body;
    if (!status) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Status is required' },
      });
      return;
    }

    const appointment = await AppointmentService.updateAppointmentStatus(req.params.id, status);

    // Send appropriate notification based on status
    if (status === 'checked-in') {
      NotificationService.notifyPatientCheckIn(appointment);
    } else if (status === 'completed') {
      await EventService.publishAppointmentCompleted(appointment);
    }

    res.json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /appointments/:id/confirm
 * Confirm appointment
 */
router.patch('/:id/confirm', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const appointment = await AppointmentService.updateAppointmentStatus(req.params.id, 'confirmed');

    res.json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /appointments/:id/complete
 * Complete appointment
 */
router.patch('/:id/complete', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const appointment = await AppointmentService.updateAppointmentStatus(req.params.id, 'completed');

    await EventService.publishAppointmentCompleted(appointment);

    res.json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /appointments/:id
 * Cancel appointment
 */
router.delete('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const appointment = await AppointmentService.cancelAppointment(req.params.id);

    // Send notifications
    NotificationService.notifyAppointmentCancelled(appointment);

    // Publish event
    await EventService.publishAppointmentCancelled(appointment);

    res.json({
      success: true,
      message: 'Appointment cancelled successfully',
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

