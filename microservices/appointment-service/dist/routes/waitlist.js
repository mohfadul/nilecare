"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const database_1 = require("../config/database");
const router = (0, express_1.Router)();
router.get('/', auth_1.authMiddleware, async (req, res, next) => {
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
        const params = [status];
        if (providerId) {
            query += ' AND w.provider_id = ?';
            params.push(providerId);
        }
        query += ' ORDER BY w.created_at ASC';
        const [entries] = await database_1.pool.execute(query, params);
        res.json({
            success: true,
            data: entries,
        });
    }
    catch (error) {
        next(error);
    }
});
router.post('/', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const { patientId, providerId, preferredDate, reason } = req.body;
        if (!patientId || !providerId) {
            res.status(400).json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'patientId and providerId are required' },
            });
            return;
        }
        const [result] = await database_1.pool.execute(`INSERT INTO appointment_waitlist (patient_id, provider_id, preferred_date, reason, status)
       VALUES (?, ?, ?, ?, 'waiting')`, [patientId, providerId, preferredDate || null, reason || null]);
        res.status(201).json({
            success: true,
            data: {
                id: result.insertId,
                patientId,
                providerId,
                status: 'waiting',
            },
        });
    }
    catch (error) {
        next(error);
    }
});
router.patch('/:id/contacted', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const { id } = req.params;
        await database_1.pool.execute(`UPDATE appointment_waitlist SET status = 'contacted', contacted_at = NOW() WHERE id = ?`, [id]);
        res.json({
            success: true,
            message: 'Waitlist entry marked as contacted',
        });
    }
    catch (error) {
        next(error);
    }
});
router.delete('/:id', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const { id } = req.params;
        await database_1.pool.execute(`UPDATE appointment_waitlist SET status = 'cancelled' WHERE id = ?`, [id]);
        res.json({
            success: true,
            message: 'Removed from waitlist',
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=waitlist.js.map