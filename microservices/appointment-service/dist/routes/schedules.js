"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const database_1 = require("../config/database");
const router = (0, express_1.Router)();
router.get('/provider/:providerId', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const { providerId } = req.params;
        const { dateFrom, dateTo } = req.query;
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
        const params = [providerId];
        if (dateFrom) {
            query += ' AND appointment_date >= ?';
            params.push(dateFrom);
        }
        if (dateTo) {
            query += ' AND appointment_date <= ?';
            params.push(dateTo);
        }
        query += ' ORDER BY appointment_date ASC, appointment_time ASC';
        const [appointments] = await database_1.pool.execute(query, params);
        res.json({
            success: true,
            data: {
                providerId,
                appointments,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/available-slots', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const { providerId, date, duration = 30 } = req.query;
        if (!providerId || !date) {
            res.status(400).json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'providerId and date are required' },
            });
            return;
        }
        const [appointments] = await database_1.pool.execute(`SELECT appointment_time, duration 
       FROM appointments 
       WHERE provider_id = ? 
         AND appointment_date = ?
         AND status NOT IN ('cancelled', 'no-show')
       ORDER BY appointment_time ASC`, [providerId, date]);
        const workStart = 8 * 60;
        const workEnd = 17 * 60;
        const slotDuration = parseInt(duration);
        const availableSlots = [];
        const bookedSlots = new Set();
        appointments.forEach((apt) => {
            const [hours, minutes] = apt.appointment_time.split(':').map(Number);
            const aptStart = hours * 60 + minutes;
            const aptEnd = aptStart + apt.duration;
            for (let time = aptStart; time < aptEnd; time += slotDuration) {
                bookedSlots.add(time);
            }
        });
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
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=schedules.js.map