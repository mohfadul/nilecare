"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AppointmentService_1 = __importDefault(require("../services/AppointmentService"));
const NotificationService_1 = __importDefault(require("../services/NotificationService"));
const EventService_1 = __importDefault(require("../services/EventService"));
const ReminderService_1 = __importDefault(require("../services/ReminderService"));
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const router = (0, express_1.Router)();
router.get('/', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const { page, limit, status, providerId, patientId, date } = req.query;
        const result = await AppointmentService_1.default.getAppointments({
            page: page ? parseInt(page) : undefined,
            limit: limit ? parseInt(limit) : undefined,
            status: status,
            providerId: providerId,
            patientId: patientId,
            date: date,
        });
        res.json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/today', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const { providerId } = req.query;
        const appointments = await AppointmentService_1.default.getTodayAppointments(providerId);
        res.json({
            success: true,
            data: appointments,
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/stats', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const { dateFrom, dateTo, providerId } = req.query;
        const stats = await AppointmentService_1.default.getAppointmentStats({
            dateFrom: dateFrom,
            dateTo: dateTo,
            providerId: providerId,
        });
        res.json({
            success: true,
            data: stats,
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/:id', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const appointment = await AppointmentService_1.default.getAppointmentById(req.params.id);
        res.json({
            success: true,
            data: appointment,
        });
    }
    catch (error) {
        next(error);
    }
});
router.post('/', auth_1.authMiddleware, (0, validation_1.validateRequired)(['patientId', 'providerId', 'appointmentDate', 'appointmentTime', 'duration']), async (req, res, next) => {
    try {
        const appointment = await AppointmentService_1.default.createAppointment(req.body);
        NotificationService_1.default.notifyNewAppointment(appointment);
        await EventService_1.default.publishAppointmentCreated(appointment);
        await ReminderService_1.default.scheduleRemindersForAppointment(appointment.id);
        res.status(201).json({
            success: true,
            data: appointment,
        });
    }
    catch (error) {
        next(error);
    }
});
router.put('/:id', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const appointment = await AppointmentService_1.default.updateAppointment(req.params.id, req.body);
        NotificationService_1.default.notifyAppointmentUpdate(appointment);
        await EventService_1.default.publishAppointmentUpdated(appointment);
        res.json({
            success: true,
            data: appointment,
        });
    }
    catch (error) {
        next(error);
    }
});
router.patch('/:id/status', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const { status } = req.body;
        if (!status) {
            res.status(400).json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'Status is required' },
            });
            return;
        }
        const appointment = await AppointmentService_1.default.updateAppointmentStatus(req.params.id, status);
        if (status === 'checked-in') {
            NotificationService_1.default.notifyPatientCheckIn(appointment);
        }
        else if (status === 'completed') {
            await EventService_1.default.publishAppointmentCompleted(appointment);
        }
        res.json({
            success: true,
            data: appointment,
        });
    }
    catch (error) {
        next(error);
    }
});
router.patch('/:id/confirm', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const appointment = await AppointmentService_1.default.updateAppointmentStatus(req.params.id, 'confirmed');
        res.json({
            success: true,
            data: appointment,
        });
    }
    catch (error) {
        next(error);
    }
});
router.patch('/:id/complete', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const appointment = await AppointmentService_1.default.updateAppointmentStatus(req.params.id, 'completed');
        await EventService_1.default.publishAppointmentCompleted(appointment);
        res.json({
            success: true,
            data: appointment,
        });
    }
    catch (error) {
        next(error);
    }
});
router.delete('/:id', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const appointment = await AppointmentService_1.default.cancelAppointment(req.params.id);
        NotificationService_1.default.notifyAppointmentCancelled(appointment);
        await EventService_1.default.publishAppointmentCancelled(appointment);
        res.json({
            success: true,
            message: 'Appointment cancelled successfully',
            data: appointment,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=appointments.js.map