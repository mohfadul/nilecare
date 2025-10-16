"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryServiceClient = void 0;
const axios_1 = __importDefault(require("axios"));
const opossum_1 = __importDefault(require("opossum"));
/**
 * Inventory Service Client
 * Provides type-safe access to Inventory Service APIs
 */
class InventoryServiceClient {
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
     * Get low stock items count
     */
    async getLowStockItemsCount() {
        const response = await this.breaker.fire({
            method: 'GET',
            url: '/api/v1/stats/items/low-stock',
        });
        return response.data.data.count;
    }
    /**
     * Get low stock items details
     */
    async getLowStockItems(limit = 20) {
        const response = await this.breaker.fire({
            method: 'GET',
            url: '/api/v1/stats/items/low-stock/details',
            params: { limit },
        });
        return response.data.data.items;
    }
    /**
     * Get out of stock items count
     */
    async getOutOfStockCount() {
        const response = await this.breaker.fire({
            method: 'GET',
            url: '/api/v1/stats/items/out-of-stock',
        });
        return response.data.data.count;
    }
    /**
     * Get all inventory stats
     */
    async getAllStats() {
        const response = await this.breaker.fire({
            method: 'GET',
            url: '/api/v1/stats',
        });
        return response.data.data;
    }
}
exports.InventoryServiceClient = InventoryServiceClient;
exports.default = InventoryServiceClient;
