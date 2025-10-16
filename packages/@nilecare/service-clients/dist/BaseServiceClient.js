"use strict";
/**
 * Base Service Client
 * Common functionality for all service-to-service communication
 *
 * Usage:
 *   class BillingServiceClient extends BaseServiceClient {
 *     async getInvoice(id: string): Promise<Invoice> {
 *       return await this.get<Invoice>(`/api/v1/invoices/${id}`);
 *     }
 *   }
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseServiceClient = void 0;
const axios_1 = __importDefault(require("axios"));
class BaseServiceClient {
    constructor(config, circuitBreakerConfig = {
        enabled: true,
        threshold: 5,
        timeout: 30000,
        resetTimeout: 60000
    }) {
        this.config = config;
        this.circuitBreakerConfig = circuitBreakerConfig;
        this.circuitOpen = false;
        this.failureCount = 0;
        this.resetTimer = null;
        this.client = axios_1.default.create({
            baseURL: config.baseUrl,
            timeout: config.timeout || 5000,
            headers: {
                'X-API-Key': config.apiKey,
                'Content-Type': 'application/json',
                'User-Agent': 'NileCare-Service-Client/1.0'
            }
        });
        this.setupInterceptors();
    }
    /**
     * Setup request/response interceptors
     */
    setupInterceptors() {
        // Request interceptor
        this.client.interceptors.request.use((config) => {
            // Add correlation ID if available
            const correlationId = global.correlationId;
            if (correlationId) {
                config.headers['X-Correlation-ID'] = correlationId;
            }
            return config;
        }, (error) => Promise.reject(error));
        // Response interceptor
        this.client.interceptors.response.use((response) => {
            // Reset failure count on success
            this.failureCount = 0;
            return response;
        }, (error) => {
            // Track failures for circuit breaker
            this.handleFailure(error);
            return Promise.reject(this.transformError(error));
        });
    }
    /**
     * Circuit breaker logic
     */
    handleFailure(error) {
        if (!this.circuitBreakerConfig.enabled)
            return;
        this.failureCount++;
        if (this.failureCount >= this.circuitBreakerConfig.threshold) {
            this.openCircuit();
        }
    }
    openCircuit() {
        this.circuitOpen = true;
        console.warn(`Circuit breaker opened for ${this.config.baseUrl}`);
        // Auto-reset after timeout
        if (this.resetTimer) {
            clearTimeout(this.resetTimer);
        }
        this.resetTimer = setTimeout(() => {
            this.closeCircuit();
        }, this.circuitBreakerConfig.resetTimeout);
    }
    closeCircuit() {
        this.circuitOpen = false;
        this.failureCount = 0;
        console.info(`Circuit breaker closed for ${this.config.baseUrl}`);
    }
    /**
     * Transform axios errors to standard format
     */
    transformError(error) {
        if (error.response) {
            // Server responded with error status
            return new Error(`Service error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
        }
        else if (error.request) {
            // Request made but no response
            return new Error(`Service unavailable: ${this.config.baseUrl}`);
        }
        else {
            // Error in request configuration
            return new Error(`Request error: ${error.message}`);
        }
    }
    /**
     * GET request with retry logic
     */
    async get(path, config) {
        if (this.circuitOpen) {
            throw new Error('Circuit breaker open - service unavailable');
        }
        return await this.retryRequest(async () => {
            const response = await this.client.get(path, config);
            return response.data;
        });
    }
    /**
     * POST request with retry logic
     */
    async post(path, data, config) {
        if (this.circuitOpen) {
            throw new Error('Circuit breaker open - service unavailable');
        }
        return await this.retryRequest(async () => {
            const response = await this.client.post(path, data, config);
            return response.data;
        });
    }
    /**
     * PATCH request
     */
    async patch(path, data, config) {
        if (this.circuitOpen) {
            throw new Error('Circuit breaker open - service unavailable');
        }
        const response = await this.client.patch(path, data, config);
        return response.data;
    }
    /**
     * DELETE request
     */
    async delete(path, config) {
        const response = await this.client.delete(path, config);
        return response.data;
    }
    /**
     * Retry logic
     */
    async retryRequest(request, retries = this.config.retries || 3) {
        try {
            return await request();
        }
        catch (error) {
            if (retries > 0 && this.isRetryable(error)) {
                await this.delay(this.config.retryDelay || 1000);
                return await this.retryRequest(request, retries - 1);
            }
            throw error;
        }
    }
    /**
     * Check if error is retryable
     */
    isRetryable(error) {
        // Retry on network errors or 5xx server errors
        return (!error.response ||
            (error.response.status >= 500 && error.response.status < 600) ||
            error.code === 'ECONNABORTED');
    }
    /**
     * Delay helper
     */
    delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    /**
     * Health check
     */
    async healthCheck() {
        try {
            await this.get('/health');
            return true;
        }
        catch (error) {
            return false;
        }
    }
}
exports.BaseServiceClient = BaseServiceClient;
exports.default = BaseServiceClient;
