/**
 * Bulk Operations Routes
 * Handle bulk CREATE, UPDATE, DELETE operations for efficiency
 */

import { Router, Request, Response } from 'express';
import mysql from 'mysql2/promise';

const router = Router();

// Database connection helper
const getConnection = async () => {
  return await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'nilecare',
  });
};

// ============================================================================
// BULK DELETE OPERATIONS
// ============================================================================

/**
 * DELETE /api/v1/bulk/patients
 * Bulk delete (soft delete) patients
 */
router.delete('/patients', async (req: Request, res: Response) => {
  const connection = await getConnection();
  
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'ids array is required' }
      });
    }

    // Bulk soft delete
    const placeholders = ids.map(() => '?').join(',');
    await connection.execute(`
      UPDATE patients 
      SET deleted_at = NOW()
      WHERE id IN (${placeholders})
    `, ids);

    res.json({
      success: true,
      data: { 
        count: ids.length,
        message: `${ids.length} patients deleted successfully` 
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'DB_ERROR', message: error.message }
    });
  } finally {
    await connection.end();
  }
});

/**
 * DELETE /api/v1/bulk/appointments
 * Bulk cancel appointments
 */
router.delete('/appointments', async (req: Request, res: Response) => {
  const connection = await getConnection();
  
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'ids array is required' }
      });
    }

    const placeholders = ids.map(() => '?').join(',');
    await connection.execute(`
      UPDATE appointments 
      SET status = 'cancelled'
      WHERE id IN (${placeholders})
    `, ids);

    res.json({
      success: true,
      data: { 
        count: ids.length,
        message: `${ids.length} appointments cancelled successfully` 
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'DB_ERROR', message: error.message }
    });
  } finally {
    await connection.end();
  }
});

/**
 * DELETE /api/v1/bulk/users
 * Bulk deactivate users
 */
router.delete('/users', async (req: Request, res: Response) => {
  const connection = await getConnection();
  
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'ids array is required' }
      });
    }

    const placeholders = ids.map(() => '?').join(',');
    await connection.execute(`
      UPDATE users 
      SET status = 'inactive'
      WHERE id IN (${placeholders})
    `, ids);

    res.json({
      success: true,
      data: { 
        count: ids.length,
        message: `${ids.length} users deactivated successfully` 
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'DB_ERROR', message: error.message }
    });
  } finally {
    await connection.end();
  }
});

// ============================================================================
// BULK UPDATE OPERATIONS
// ============================================================================

/**
 * PATCH /api/v1/bulk/appointments/status
 * Bulk update appointment status
 */
router.patch('/appointments/status', async (req: Request, res: Response) => {
  const connection = await getConnection();
  
  try {
    const { ids, status } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'ids array is required' }
      });
    }

    if (!status) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'status is required' }
      });
    }

    const placeholders = ids.map(() => '?').join(',');
    await connection.execute(`
      UPDATE appointments 
      SET status = ?
      WHERE id IN (${placeholders})
    `, [status, ...ids]);

    res.json({
      success: true,
      data: { 
        count: ids.length,
        message: `${ids.length} appointments updated to ${status}` 
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'DB_ERROR', message: error.message }
    });
  } finally {
    await connection.end();
  }
});

/**
 * PATCH /api/v1/bulk/users/status
 * Bulk update user status (activate/deactivate)
 */
router.patch('/users/status', async (req: Request, res: Response) => {
  const connection = await getConnection();
  
  try {
    const { ids, status } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'ids array is required' }
      });
    }

    if (!status || !['active', 'inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'status must be active or inactive' }
      });
    }

    const placeholders = ids.map(() => '?').join(',');
    await connection.execute(`
      UPDATE users 
      SET status = ?
      WHERE id IN (${placeholders})
    `, [status, ...ids]);

    res.json({
      success: true,
      data: { 
        count: ids.length,
        message: `${ids.length} users updated to ${status}` 
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'DB_ERROR', message: error.message }
    });
  } finally {
    await connection.end();
  }
});

export default router;

