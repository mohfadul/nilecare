import { Server as SocketIOServer } from 'socket.io';
export declare class NotificationService {
    private io;
    initialize(io: SocketIOServer): void;
    private setupEventHandlers;
    notifyUser(userId: string, event: string, data: any): void;
    notifyRole(role: string, event: string, data: any): void;
    broadcast(event: string, data: any): void;
    notifyNewAppointment(appointment: any): void;
    notifyAppointmentUpdate(appointment: any): void;
    notifyAppointmentCancelled(appointment: any): void;
    notifyPatientCheckIn(appointment: any): void;
}
declare const _default: NotificationService;
export default _default;
//# sourceMappingURL=NotificationService.d.ts.map