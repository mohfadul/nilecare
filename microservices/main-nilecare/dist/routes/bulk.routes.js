"use strict";
/**
 * Bulk Operations Routes
 * Handle bulk CREATE, UPDATE, DELETE operations for efficiency
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const promise_1 = __importDefault(require("mysql2/promise"));
const router = (0, express_1.Router)();
// Database connection helper
const getConnection = async () => {
    return await promise_1.default.createConnection({
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
router.delete('/patients', async (req, res) => {
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: { code: 'DB_ERROR', message: error.message }
        });
    }
    finally {
        await connection.end();
    }
});
/**
 * DELETE /api/v1/bulk/appointments
 * Bulk cancel appointments
 */
router.delete('/appointments', async (req, res) => {
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: { code: 'DB_ERROR', message: error.message }
        });
    }
    finally {
        await connection.end();
    }
});
/**
 * DELETE /api/v1/bulk/users
 * Bulk deactivate users
 */
router.delete('/users', async (req, res) => {
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: { code: 'DB_ERROR', message: error.message }
        });
    }
    finally {
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
router.patch('/appointments/status', async (req, res) => {
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: { code: 'DB_ERROR', message: error.message }
        });
    }
    finally {
        await connection.end();
    }
});
/**
 * PATCH /api/v1/bulk/users/status
 * Bulk update user status (activate/deactivate)
 */
router.patch('/users/status', async (req, res) => {
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: { code: 'DB_ERROR', message: error.message }
        });
    }
    finally {
        await connection.end();
    }
});
exports.default = router;
//# sourceMappingURL=bulk.routes.js.map