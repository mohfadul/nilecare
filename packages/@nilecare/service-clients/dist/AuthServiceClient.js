"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthServiceClient = void 0;
const axios_1 = __importDefault(require("axios"));
const opossum_1 = __importDefault(require("opossum"));
/**
 * Auth Service Client
 * Provides type-safe access to Auth Service APIs
 */
class AuthServiceClient {
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
     * Get users count
     */
    async getUsersCount() {
        const response = await this.breaker.fire({
            method: 'GET',
            url: '/api/v1/stats/users/count',
        });
        return response.data.data.count;
    }
    /**
     * Get active users count
     */
    async getActiveUsersCount() {
        const response = await this.breaker.fire({
            method: 'GET',
            url: '/api/v1/stats/users/active',
        });
        return response.data.data.count;
    }
    /**
     * Get all auth stats
     */
    async getAllStats() {
        const response = await this.breaker.fire({
            method: 'GET',
            url: '/api/v1/stats',
        });
        return response.data.data;
    }
}
exports.AuthServiceClient = AuthServiceClient;
exports.default = AuthServiceClient;
