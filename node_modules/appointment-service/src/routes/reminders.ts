/**
 * Reminder Routes
 * Manage appointment reminders
 */

import { Router, Request, Response, NextFunction } from 'express';
// ✅ Using local authentication middleware
import { authenticate } from '../middleware/auth';
import ReminderService from '../services/ReminderService';

const router = Router();

/**
 * GET /reminders/pending
 * Get pending reminders
 */
router.get('/pending', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reminders = await ReminderService.getPendingReminders();

    res.json({
      success: true,
      data: reminders,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /reminders/process
 * Process and send all pending reminders
 */
router.post('/process', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const results = await ReminderService.processPendingReminders();

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /reminders/appointment/:appointmentId
 * Create reminders for an appointment
 */
router.post('/appointment/:appointmentId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { appointmentId } = req.params;
    
    const result = await ReminderService.scheduleRemindersForAppointment(appointmentId);

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

