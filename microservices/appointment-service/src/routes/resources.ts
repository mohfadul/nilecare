/**
 * Resource Routes
 * Manage rooms, equipment, and other resources
 */

import { Router, Request, Response, NextFunction } from 'express';
// ✅ Using local authentication middleware
import { authenticate } from '../../shared/middleware/auth';
import { pool } from '../config/database';

const router = Router();

/**
 * GET /resources
 * Get all resources
 */
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type } = req.query;

    let query = 'SELECT * FROM resources WHERE 1=1';
    const params: any[] = [];

    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }

    query += ' ORDER BY name ASC';

    const [resources] = await pool.execute(query, params);

    res.json({
      success: true,
      data: resources,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /resources/:id/availability
 * Check resource availability
 */
router.get('/:id/availability', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { date, timeFrom, timeTo } = req.query;

    if (!date || !timeFrom || !timeTo) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'date, timeFrom, and timeTo are required' },
      });
      return;
    }

    // Check if resource is booked during this time
    const [bookings] = await pool.execute(
      `SELECT COUNT(*) as count
       FROM resource_bookings
       WHERE resource_id = ?
         AND booking_date = ?
         AND (
           (start_time >= ? AND start_time < ?)
           OR (end_time > ? AND end_time <= ?)
           OR (start_time <= ? AND end_time >= ?)
         )
         AND status = 'confirmed'`,
      [id, date, timeFrom, timeTo, timeFrom, timeTo, timeFrom, timeTo]
    );

    const isAvailable = (bookings as any[])[0].count === 0;

    res.json({
      success: true,
      data: {
        resourceId: id,
        date,
        timeFrom,
        timeTo,
        available: isAvailable,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;

