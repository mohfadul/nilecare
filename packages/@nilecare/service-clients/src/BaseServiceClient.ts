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

import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';

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

export abstract class BaseServiceClient {
  protected client: AxiosInstance;
  private circuitOpen: boolean = false;
  private failureCount: number = 0;
  private resetTimer: NodeJS.Timeout | null = null;

  constructor(
    protected config: ServiceClientConfig,
    private circuitBreakerConfig: CircuitBreakerConfig = {
      enabled: true,
      threshold: 5,
      timeout: 30000,
      resetTimeout: 60000
    }
  ) {
    this.client = axios.create({
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
  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add correlation ID if available
        const correlationId = (global as any).correlationId;
        if (correlationId) {
          config.headers['X-Correlation-ID'] = correlationId;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        // Reset failure count on success
        this.failureCount = 0;
        return response;
      },
      (error) => {
        // Track failures for circuit breaker
        this.handleFailure(error);
        return Promise.reject(this.transformError(error));
      }
    );
  }

  /**
   * Circuit breaker logic
   */
  private handleFailure(error: AxiosError): void {
    if (!this.circuitBreakerConfig.enabled) return;

    this.failureCount++;

    if (this.failureCount >= this.circuitBreakerConfig.threshold) {
      this.openCircuit();
    }
  }

  private openCircuit(): void {
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

  private closeCircuit(): void {
    this.circuitOpen = false;
    this.failureCount = 0;
    console.info(`Circuit breaker closed for ${this.config.baseUrl}`);
  }

  /**
   * Transform axios errors to standard format
   */
  private transformError(error: AxiosError): Error {
    if (error.response) {
      // Server responded with error status
      return new Error(
        `Service error: ${error.response.status} - ${JSON.stringify(error.response.data)}`
      );
    } else if (error.request) {
      // Request made but no response
      return new Error(`Service unavailable: ${this.config.baseUrl}`);
    } else {
      // Error in request configuration
      return new Error(`Request error: ${error.message}`);
    }
  }

  /**
   * GET request with retry logic
   */
  protected async get<T>(path: string, config?: AxiosRequestConfig): Promise<T> {
    if (this.circuitOpen) {
      throw new Error('Circuit breaker open - service unavailable');
    }

    return await this.retryRequest<T>(async () => {
      const response = await this.client.get(path, config);
      return response.data;
    });
  }

  /**
   * POST request with retry logic
   */
  protected async post<T>(path: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    if (this.circuitOpen) {
      throw new Error('Circuit breaker open - service unavailable');
    }

    return await this.retryRequest<T>(async () => {
      const response = await this.client.post(path, data, config);
      return response.data;
    });
  }

  /**
   * PATCH request
   */
  protected async patch<T>(path: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    if (this.circuitOpen) {
      throw new Error('Circuit breaker open - service unavailable');
    }

    const response = await this.client.patch(path, data, config);
    return response.data;
  }

  /**
   * DELETE request
   */
  protected async delete<T>(path: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete(path, config);
    return response.data;
  }

  /**
   * Retry logic
   */
  private async retryRequest<T>(
    request: () => Promise<T>,
    retries: number = this.config.retries || 3
  ): Promise<T> {
    try {
      return await request();
    } catch (error) {
      if (retries > 0 && this.isRetryable(error as AxiosError)) {
        await this.delay(this.config.retryDelay || 1000);
        return await this.retryRequest(request, retries - 1);
      }
      throw error;
    }
  }

  /**
   * Check if error is retryable
   */
  private isRetryable(error: AxiosError): boolean {
    // Retry on network errors or 5xx server errors
    return (
      !error.response ||
      (error.response.status >= 500 && error.response.status < 600) ||
      error.code === 'ECONNABORTED'
    );
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.get('/health');
      return true;
    } catch (error) {
      return false;
    }
  }
}

export default BaseServiceClient;

