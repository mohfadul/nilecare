export interface Reminder {
    id: string;
    appointment_id: string;
    reminder_type: 'email' | 'sms' | 'push';
    scheduled_time: string;
    sent: boolean;
    sent_at?: string;
    created_at?: string;
}
export declare class ReminderService {
    createReminder(appointmentId: string, reminderType: 'email' | 'sms' | 'push', hoursBeforeAppointment?: number): Promise<{
        id: any;
        appointmentId: string;
        reminderType: "push" | "email" | "sms";
        scheduledTime: string;
        sent: boolean;
    }>;
    getPendingReminders(): Promise<import("mysql2").QueryResult>;
    markReminderSent(reminderId: string): Promise<void>;
    sendReminder(reminder: any): Promise<{
        success: boolean;
        reminderId: any;
        type: any;
    }>;
    processPendingReminders(): Promise<({
        success: boolean;
        reminderId: any;
        error?: undefined;
    } | {
        success: boolean;
        reminderId: any;
        error: any;
    })[]>;
    scheduleRemindersForAppointment(appointmentId: string): Promise<{
        success: boolean;
    }>;
}
declare const _default: ReminderService;
export default _default;
//# sourceMappingURL=ReminderService.d.ts.map