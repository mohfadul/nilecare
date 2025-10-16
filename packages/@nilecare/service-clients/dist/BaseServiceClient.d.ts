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
import { AxiosInstance, AxiosRequestConfig } from 'axios';
export interface ServiceClientConfig {
    baseUrl: string;
    apiKey: string;
    timeout?: number;
    retries?: number;
    retryDelay?: number;
}
export interface CircuitBreakerConfig {
    enabled: boolean;
    threshold: number;
    timeout: number;
    resetTimeout: number;
}
export declare abstract class BaseServiceClient {
    protected config: ServiceClientConfig;
    private circuitBreakerConfig;
    protected client: AxiosInstance;
    private circuitOpen;
    private failureCount;
    private resetTimer;
    constructor(config: ServiceClientConfig, circuitBreakerConfig?: CircuitBreakerConfig);
    /**
     * Setup request/response interceptors
     */
    private setupInterceptors;
    /**
     * Circuit breaker logic
     */
    private handleFailure;
    private openCircuit;
    private closeCircuit;
    /**
     * Transform axios errors to standard format
     */
    private transformError;
    /**
     * GET request with retry logic
     */
    protected get<T>(path: string, config?: AxiosRequestConfig): Promise<T>;
    /**
     * POST request with retry logic
     */
    protected post<T>(path: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
    /**
     * PATCH request
     */
    protected patch<T>(path: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
    /**
     * DELETE request
     */
    protected delete<T>(path: string, config?: AxiosRequestConfig): Promise<T>;
    /**
     * Retry logic
     */
    private retryRequest;
    /**
     * Check if error is retryable
     */
    private isRetryable;
    /**
     * Delay helper
     */
    private delay;
    /**
     * Health check
     */
    healthCheck(): Promise<boolean>;
}
export default BaseServiceClient;
