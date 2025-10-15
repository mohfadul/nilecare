export interface Appointment {
    id: string;
    patient_id: string;
    provider_id: string;
    appointment_date: string;
    appointment_time: string;
    duration: number;
    status: string;
    reason?: string;
    notes?: string;
    created_at?: string;
    updated_at?: string;
}
export declare class AppointmentService {
    getAppointments(params: {
        page?: number;
        limit?: number;
        status?: string;
        providerId?: string;
        patientId?: string;
        date?: string;
    }): Promise<{
        appointments: import("mysql2").QueryResult;
        pagination: {
            page: number;
            limit: number;
            total: any;
            pages: number;
        };
    }>;
    getAppointmentById(id: string): Promise<any>;
    createAppointment(data: {
        patientId: string;
        providerId: string;
        appointmentDate: string;
        appointmentTime: string;
        duration: number;
        reason?: string;
        notes?: string;
    }): Promise<any>;
    updateAppointment(id: string, data: Partial<Appointment>): Promise<any>;
    updateAppointmentStatus(id: string, status: string): Promise<any>;
    cancelAppointment(id: string): Promise<any>;
    checkAppointmentConflict(providerId: string, date: string, time: string, duration: number, excludeId?: string): Promise<boolean>;
    getTodayAppointments(providerId?: string): Promise<import("mysql2").QueryResult>;
    getUpcomingAppointments(patientId: string, limit?: number): Promise<import("mysql2").QueryResult>;
    getAppointmentStats(params?: {
        dateFrom?: string;
        dateTo?: string;
        providerId?: string;
    }): Promise<import("mysql2").QueryResult>;
}
declare const _default: AppointmentService;
export default _default;
//# sourceMappingURL=AppointmentService.d.ts.map