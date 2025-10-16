"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClinicalServiceClient = void 0;
const axios_1 = __importDefault(require("axios"));
const opossum_1 = __importDefault(require("opossum"));
/**
 * Clinical Service Client
 * Provides type-safe access to Clinical Service APIs
 */
class ClinicalServiceClient {
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
        this.breaker.on('open', () => {
            console.error('Circuit breaker OPEN for clinical-service');
        });
    }
    /**
     * Set authorization token for requests
     */
    setAuthToken(token) {
        this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    /**
     * Set request ID for correlation tracking
     * Propagates request ID across service calls for end-to-end tracing
     */
    setRequestId(requestId) {
        this.axiosInstance.defaults.headers.common['X-Request-ID'] = requestId;
    }
    /**
     * Get patient count statistics
     */
    async getPatientsCount() {
        const response = await this.breaker.fire({
            method: 'GET',
            url: '/api/v1/stats/patients/count',
        });
        return response.data.data.count;
    }
    /**
     * Get recent patients
     */
    async getRecentPatients(limit = 20) {
        const response = await this.breaker.fire({
            method: 'GET',
            url: '/api/v1/patients/recent',
            params: { limit },
        });
        return response.data.data.patients;
    }
    /**
     * Get single patient by ID
     */
    async getPatient(id) {
        const response = await this.breaker.fire({
            method: 'GET',
            url: `/api/v1/patients/${id}`,
        });
        return response.data.data.patient;
    }
    /**
     * Get patients list with pagination
     */
    async getPatients(params) {
        const response = await this.breaker.fire({
            method: 'GET',
            url: '/api/v1/patients',
            params,
        });
        return response.data;
    }
    /**
     * Search patients
     */
    async searchPatients(query, filters) {
        const response = await this.breaker.fire({
            method: 'GET',
            url: '/api/v1/patients/search',
            params: { q: query, ...filters },
        });
        return response.data.data.patients;
    }
    /**
     * Create new patient
     */
    async createPatient(data) {
        const response = await this.breaker.fire({
            method: 'POST',
            url: '/api/v1/patients',
            data,
        });
        return response.data.data.patient;
    }
    /**
     * Update patient
     */
    async updatePatient(id, data) {
        const response = await this.breaker.fire({
            method: 'PUT',
            url: `/api/v1/patients/${id}`,
            data,
        });
        return response.data.data.patient;
    }
    /**
     * Get encounters count
     */
    async getEncountersCount() {
        const response = await this.breaker.fire({
            method: 'GET',
            url: '/api/v1/stats/encounters/count',
        });
        return response.data.data.count;
    }
    /**
     * Get today's encounters
     */
    async getTodayEncounters() {
        const response = await this.breaker.fire({
            method: 'GET',
            url: '/api/v1/encounters/today',
        });
        return response.data.data.encounters;
    }
}
exports.ClinicalServiceClient = ClinicalServiceClient;
exports.default = ClinicalServiceClient;
