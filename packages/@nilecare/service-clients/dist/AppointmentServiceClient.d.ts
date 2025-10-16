/**
 * Appointment Service Client
 * Provides type-safe access to Appointment Service APIs
 */
export declare class AppointmentServiceClient {
    private baseUrl;
    private axiosInstance;
    private breaker;
    constructor(baseUrl: string);
    /**
     * Set authorization token for requests
     */
    setAuthToken(token: string): void;
    /**
     * Get today's appointments count
     */
    getTodayAppointmentsCount(): Promise<number>;
    /**
     * Get today's appointments details
     */
    getTodayAppointments(): Promise<any[]>;
    /**
     * Get pending appointments count
     */
    getPendingAppointmentsCount(): Promise<number>;
    /**
     * Get all appointment stats
     */
    getAllStats(): Promise<any>;
}
export default AppointmentServiceClient;
