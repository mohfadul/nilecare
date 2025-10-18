/**
 * Waitlist Routes
 * Manage appointment waitlist
 */

import { Router, Request, Response, NextFunction } from 'express';
// ✅ Using local authentication middleware
import { authenticate } from '../../shared/middleware/auth';
import { pool } from '../config/database';

const router = Router();

/**
 * GET /waitlist
 * Get waitlist entries
 */
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { providerId, status = 'waiting' } = req.query;

    let query = `
      SELECT 
        w.*,
        p.first_name,
        p.last_name,
        p.phone,
        p.email
      FROM appointment_waitlist w
      JOIN patients p ON w.patient_id = p.id
      WHERE w.status = ?
    `;
    const params: any[] = [status];

    if (providerId) {
      query += ' AND w.provider_id = ?';
      params.push(providerId);
    }

    query += ' ORDER BY w.created_at ASC';

    const [entries] = await pool.execute(query, params);

    res.json({
      success: true,
      data: entries,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /waitlist
 * Add patient to waitlist
 */
router.post('/', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { patientId, providerId, preferredDate, reason } = req.body;

    if (!patientId || !providerId) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'patientId and providerId are required' },
      });
      return;
    }

    const [result] = await pool.execute(
      `INSERT INTO appointment_waitlist (patient_id, provider_id, preferred_date, reason, status)
       VALUES (?, ?, ?, ?, 'waiting')`,
      [patientId, providerId, preferredDate || null, reason || null]
    );

    res.status(201).json({
      success: true,
      data: {
        id: (result as any).insertId,
        patientId,
        providerId,
        status: 'waiting',
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /waitlist/:id/contact
 * Mark waitlist entry as contacted
 */
router.patch('/:id/contacted', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    await pool.execute(
      `UPDATE appointment_waitlist SET status = 'contacted', contacted_at = NOW() WHERE id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: 'Waitlist entry marked as contacted',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /waitlist/:id
 * Remove from waitlist
 */
router.delete('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    await pool.execute(
      `UPDATE appointment_waitlist SET status = 'cancelled' WHERE id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: 'Removed from waitlist',
    });
  } catch (error) {
    next(error);
  }
});

export default router;

