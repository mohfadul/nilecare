export interface AppointmentEvent {
    type: string;
    appointmentId: string;
    timestamp: string;
    data: any;
}
export declare class EventService {
    publishAppointmentCreated(appointment: any): Promise<void>;
    publishAppointmentUpdated(appointment: any): Promise<void>;
    publishAppointmentCancelled(appointment: any): Promise<void>;
    publishAppointmentCompleted(appointment: any): Promise<void>;
    private publishEvent;
    publishBatchEvents(events: AppointmentEvent[]): Promise<void>;
}
declare const _default: EventService;
export default _default;
//# sourceMappingURL=EventService.d.ts.map