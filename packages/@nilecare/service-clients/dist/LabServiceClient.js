"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LabServiceClient = void 0;
const axios_1 = __importDefault(require("axios"));
const opossum_1 = __importDefault(require("opossum"));
/**
 * Lab Service Client
 * Provides type-safe access to Lab Service APIs
 */
class LabServiceClient {
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
     * Get pending lab orders count
     */
    async getPendingOrdersCount() {
        const response = await this.breaker.fire({
            method: 'GET',
            url: '/api/v1/stats/orders/pending',
        });
        return response.data.data.count;
    }
    /**
     * Get critical results count
     */
    async getCriticalResultsCount() {
        const response = await this.breaker.fire({
            method: 'GET',
            url: '/api/v1/stats/results/critical',
        });
        return response.data.data.count;
    }
    /**
     * Get recent critical results
     */
    async getRecentCriticalResults(limit = 20) {
        const response = await this.breaker.fire({
            method: 'GET',
            url: '/api/v1/stats/results/critical/recent',
            params: { limit },
        });
        return response.data.data.results;
    }
    /**
     * Get all lab stats
     */
    async getAllStats() {
        const response = await this.breaker.fire({
            method: 'GET',
            url: '/api/v1/stats',
        });
        return response.data.data;
    }
}
exports.LabServiceClient = LabServiceClient;
exports.default = LabServiceClient;
