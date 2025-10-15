"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventService = void 0;
class EventService {
    async publishAppointmentCreated(appointment) {
        const event = {
            type: 'appointment.created',
            appointmentId: appointment.id,
            timestamp: new Date().toISOString(),
            data: appointment,
        };
        await this.publishEvent(event);
    }
    async publishAppointmentUpdated(appointment) {
        const event = {
            type: 'appointment.updated',
            appointmentId: appointment.id,
            timestamp: new Date().toISOString(),
            data: appointment,
        };
        await this.publishEvent(event);
    }
    async publishAppointmentCancelled(appointment) {
        const event = {
            type: 'appointment.cancelled',
            appointmentId: appointment.id,
            timestamp: new Date().toISOString(),
            data: appointment,
        };
        await this.publishEvent(event);
    }
    async publishAppointmentCompleted(appointment) {
        const event = {
            type: 'appointment.completed',
            appointmentId: appointment.id,
            timestamp: new Date().toISOString(),
            data: appointment,
        };
        await this.publishEvent(event);
    }
    async publishEvent(event) {
        console.log(`📮 Event published: ${event.type}`, {
            appointmentId: event.appointmentId,
            timestamp: event.timestamp,
        });
    }
    async publishBatchEvents(events) {
        for (const event of events) {
            await this.publishEvent(event);
        }
    }
}
exports.EventService = EventService;
exports.default = new EventService();
//# sourceMappingURL=EventService.js.map