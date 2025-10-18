/**
 * Schedule Routes
 * Provider availability and schedule management
 */

import { Router, Request, Response, NextFunction } from 'express';
// ✅ Using local authentication middleware
import { authenticate } from '../../shared/middleware/auth';
import { pool } from '../config/database';

const router = Router();

/**
 * GET /schedules/provider/:providerId
 * Get provider's schedule
 */
router.get('/provider/:providerId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { providerId } = req.params;
    const { dateFrom, dateTo } = req.query;

    // Get provider's appointments in date range
    let query = `
      SELECT 
        appointment_date,
        appointment_time,
        duration,
        status
      FROM appointments
      WHERE provider_id = ?
        AND status NOT IN ('cancelled', 'no-show')
    `;
    const params: any[] = [providerId];

    if (dateFrom) {
      query += ' AND appointment_date >= ?';
      params.push(dateFrom);
    }

    if (dateTo) {
      query += ' AND appointment_date <= ?';
      params.push(dateTo);
    }

    query += ' ORDER BY appointment_date ASC, appointment_time ASC';

    const [appointments] = await pool.execute(query, params);

    res.json({
      success: true,
      data: {
        providerId,
        appointments,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /schedules/available-slots
 * Get available time slots for a provider
 */
router.get('/available-slots', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { providerId, date, duration = 30 } = req.query;

    if (!providerId || !date) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'providerId and date are required' },
      });
      return;
    }

    // Get existing appointments for the day
    const [appointments] = await pool.execute(
      `SELECT appointment_time, duration 
       FROM appointments 
       WHERE provider_id = ? 
         AND appointment_date = ?
         AND status NOT IN ('cancelled', 'no-show')
       ORDER BY appointment_time ASC`,
      [providerId, date]
    );

    // Generate time slots (8 AM - 5 PM, every duration minutes)
    const workStart = 8 * 60; // 8 AM in minutes
    const workEnd = 17 * 60;  // 5 PM in minutes
    const slotDuration = parseInt(duration as string);

    const availableSlots: string[] = [];
    const bookedSlots = new Set();

    // Mark booked slots
    (appointments as any[]).forEach((apt) => {
      const [hours, minutes] = apt.appointment_time.split(':').map(Number);
      const aptStart = hours * 60 + minutes;
      const aptEnd = aptStart + apt.duration;

      for (let time = aptStart; time < aptEnd; time += slotDuration) {
        bookedSlots.add(time);
      }
    });

    // Generate available slots
    for (let time = workStart; time < workEnd; time += slotDuration) {
      if (!bookedSlots.has(time)) {
        const hours = Math.floor(time / 60);
        const minutes = time % 60;
        const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
        availableSlots.push(timeStr);
      }
    }

    res.json({
      success: true,
      data: {
        providerId,
        date,
        duration: slotDuration,
        availableSlots,
        totalSlots: availableSlots.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;

