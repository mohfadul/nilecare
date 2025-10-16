"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentServiceClient = void 0;
const axios_1 = __importDefault(require("axios"));
const opossum_1 = __importDefault(require("opossum"));
/**
 * Appointment Service Client
 * Provides type-safe access to Appointment Service APIs
 */
class AppointmentServiceClient {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
        this.axiosInstance = axios_1.default.create({
            baseURL: baseUrl,
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json',
            },
        });
        // Circuit breaker for resilience
        this.breaker = new opossum_1.default(async (config) => {
            return await this.axiosInstance.request(config);
        }, {
            timeout: 10000,
            errorThresholdPercentage: 50,
            resetTimeout: 30000,
            volumeThreshold: 3,
        });
    }
    /**
     * Set authorization token for requests
     */
    setAuthToken(token) {
        this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    /**
     * Get today's appointments count
     */
    async getTodayAppointmentsCount() {
        const response = await this.breaker.fire({
            method: 'GET',
            url: '/api/v1/stats/appointments/today',
        });
        return response.data.data.count;
    }
    /**
     * Get today's appointments details
     */
    async getTodayAppointments() {
        const response = await this.breaker.fire({
            method: 'GET',
            url: '/api/v1/stats/appointments/today/details',
        });
        return response.data.data.appointments;
    }
    /**
     * Get pending appointments count
     */
    async getPendingAppointmentsCount() {
        const response = await this.breaker.fire({
            method: 'GET',
            url: '/api/v1/stats/appointments/pending',
        });
        return response.data.data.count;
    }
    /**
     * Get all appointment stats
     */
    async getAllStats() {
        const response = await this.breaker.fire({
            method: 'GET',
            url: '/api/v1/stats',
        });
        return response.data.data;
    }
}
exports.AppointmentServiceClient = AppointmentServiceClient;
exports.default = AppointmentServiceClient;
