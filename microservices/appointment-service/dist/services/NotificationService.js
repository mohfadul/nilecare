"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
class NotificationService {
    constructor() {
        this.io = null;
    }
    initialize(io) {
        this.io = io;
        this.setupEventHandlers();
    }
    setupEventHandlers() {
        if (!this.io)
            return;
        this.io.on('connection', (socket) => {
            console.log(`✅ Client connected: ${socket.id}`);
            socket.on('join', (data) => {
                socket.join(`user:${data.userId}`);
                socket.join(`role:${data.role}`);
                console.log(`User ${data.userId} joined room (role: ${data.role})`);
            });
            socket.on('leave', (data) => {
                socket.leave(`user:${data.userId}`);
            });
            socket.on('disconnect', () => {
                console.log(`❌ Client disconnected: ${socket.id}`);
            });
        });
    }
    notifyUser(userId, event, data) {
        if (!this.io) {
            console.warn('Socket.IO not initialized');
            return;
        }
        this.io.to(`user:${userId}`).emit(event, data);
        console.log(`📤 Notification sent to user ${userId}: ${event}`);
    }
    notifyRole(role, event, data) {
        if (!this.io) {
            console.warn('Socket.IO not initialized');
            return;
        }
        this.io.to(`role:${role}`).emit(event, data);
        console.log(`📤 Notification sent to role ${role}: ${event}`);
    }
    broadcast(event, data) {
        if (!this.io) {
            console.warn('Socket.IO not initialized');
            return;
        }
        this.io.emit(event, data);
        console.log(`📢 Broadcast: ${event}`);
    }
    notifyNewAppointment(appointment) {
        this.notifyUser(appointment.patient_id, 'appointment:created', {
            id: appointment.id,
            date: appointment.appointment_date,
            time: appointment.appointment_time,
            provider: `Dr. ${appointment.provider_first_name} ${appointment.provider_last_name}`,
        });
        this.notifyUser(appointment.provider_id, 'appointment:new', {
            id: appointment.id,
            date: appointment.appointment_date,
            time: appointment.appointment_time,
            patient: `${appointment.patient_first_name} ${appointment.patient_last_name}`,
        });
        this.notifyRole('receptionist', 'appointment:created', {
            id: appointment.id,
            date: appointment.appointment_date,
            time: appointment.appointment_time,
        });
    }
    notifyAppointmentUpdate(appointment) {
        this.notifyUser(appointment.patient_id, 'appointment:updated', appointment);
        this.notifyUser(appointment.provider_id, 'appointment:updated', appointment);
        this.notifyRole('receptionist', 'appointment:updated', appointment);
    }
    notifyAppointmentCancelled(appointment) {
        this.notifyUser(appointment.patient_id, 'appointment:cancelled', {
            id: appointment.id,
            reason: 'Appointment cancelled',
        });
        this.notifyUser(appointment.provider_id, 'appointment:cancelled', {
            id: appointment.id,
        });
        this.notifyRole('receptionist', 'appointment:cancelled', {
            id: appointment.id,
        });
    }
    notifyPatientCheckIn(appointment) {
        this.notifyUser(appointment.provider_id, 'patient:checked-in', {
            appointmentId: appointment.id,
            patient: `${appointment.patient_first_name} ${appointment.patient_last_name}`,
            time: appointment.appointment_time,
        });
        this.notifyRole('nurse', 'patient:checked-in', {
            appointmentId: appointment.id,
            patient: `${appointment.patient_first_name} ${appointment.patient_last_name}`,
        });
    }
}
exports.NotificationService = NotificationService;
exports.default = new NotificationService();
//# sourceMappingURL=NotificationService.js.map