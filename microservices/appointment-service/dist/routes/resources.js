"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const database_1 = require("../config/database");
const router = (0, express_1.Router)();
router.get('/', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const { type } = req.query;
        let query = 'SELECT * FROM resources WHERE 1=1';
        const params = [];
        if (type) {
            query += ' AND type = ?';
            params.push(type);
        }
        query += ' ORDER BY name ASC';
        const [resources] = await database_1.pool.execute(query, params);
        res.json({
            success: true,
            data: resources,
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/:id/availability', auth_1.authMiddleware, async (req, res, next) => {
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
        const [bookings] = await database_1.pool.execute(`SELECT COUNT(*) as count
       FROM resource_bookings
       WHERE resource_id = ?
         AND booking_date = ?
         AND (
           (start_time >= ? AND start_time < ?)
           OR (end_time > ? AND end_time <= ?)
           OR (start_time <= ? AND end_time >= ?)
         )
         AND status = 'confirmed'`, [id, date, timeFrom, timeTo, timeFrom, timeTo, timeFrom, timeTo]);
        const isAvailable = bookings[0].count === 0;
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
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=resources.js.map