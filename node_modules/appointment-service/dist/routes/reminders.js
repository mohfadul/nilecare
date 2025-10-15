"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const ReminderService_1 = __importDefault(require("../services/ReminderService"));
const router = (0, express_1.Router)();
router.get('/pending', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const reminders = await ReminderService_1.default.getPendingReminders();
        res.json({
            success: true,
            data: reminders,
        });
    }
    catch (error) {
        next(error);
    }
});
router.post('/process', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const results = await ReminderService_1.default.processPendingReminders();
        res.json({
            success: true,
            data: results,
        });
    }
    catch (error) {
        next(error);
    }
});
router.post('/appointment/:appointmentId', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const { appointmentId } = req.params;
        const result = await ReminderService_1.default.scheduleRemindersForAppointment(appointmentId);
        res.status(201).json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=reminders.js.map