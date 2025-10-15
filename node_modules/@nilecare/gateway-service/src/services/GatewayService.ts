/**
 * Gateway Service
 * Handles core gateway functionality including request composition,
 * service orchestration, and intelligent routing
 */

import axios, { AxiosRequestConfig } from 'axios';
import { logger } from '../utils/logger';

export interface ServiceEndpoint {
  name: string;
  url: string;
  timeout?: number;
}

export interface ComposedRequest {
  endpoints: ServiceEndpoint[];
  mergeStrategy?: 'merge' | 'array' | 'nested';
}

export class GatewayService {
  private serviceRegistry: Map<string, string>;

  constructor() {
    this.serviceRegistry = new Map();
    this.initializeServiceRegistry();
  }

  /**
   * Initialize service registry with environment variables
   */
  private initializeServiceRegistry(): void {
    const services: Record<string, string> = {
      'auth-service': process.env.AUTH_SERVICE_URL || 'http://localhost:7020',
      'clinical-service': process.env.CLINICAL_SERVICE_URL || 'http://localhost:7001',
      'business-service': process.env.BUSINESS_SERVICE_URL || 'http://localhost:7010',
      'data-service': process.env.DATA_SERVICE_URL || 'http://localhost:7003',
      'notification-service': process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:7002',
      'billing-service': process.env.BILLING_SERVICE_URL || 'http://localhost:7011',
    };

    // Optional services (only register if URL is provided)
    if (process.env.PAYMENT_GATEWAY_SERVICE_URL) {
      services['payment-gateway-service'] = process.env.PAYMENT_GATEWAY_SERVICE_URL;
    }
    
    if (process.env.DEVICE_INTEGRATION_SERVICE_URL) {
      services['device-integration-service'] = process.env.DEVICE_INTEGRATION_SERVICE_URL;
    }

    Object.entries(services).forEach(([name, url]) => {
      this.serviceRegistry.set(name, url);
      logger.info(`Registered service: ${name} -> ${url}`);
    });
  }

  /**
   * Get service URL by name
   */
  getServiceUrl(serviceName: string): string | undefined {
    return this.serviceRegistry.get(serviceName);
  }

  /**
   * Make a request to a backend service
   */
  async makeServiceRequest<T = any>(
    serviceName: string,
    path: string,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const serviceUrl = this.getServiceUrl(serviceName);

    if (!serviceUrl) {
      throw new Error(`Service '${serviceName}' not found in registry`);
    }

    const fullUrl = `${serviceUrl}${path}`;

    try {
      logger.info(`Making request to ${serviceName}`, { url: fullUrl, method: config?.method || 'GET' });
      
      const response = await axios({
        ...config,
        url: fullUrl,
        timeout: config?.timeout || 10000,
      });

      return response.data;
    } catch (error: any) {
      logger.error(`Request to ${serviceName} failed`, {
        url: fullUrl,
        error: error.message,
        status: error.response?.status,
      });
      throw error;
    }
  }

  /**
   * Compose multiple service requests and merge results
   * Useful for aggregating data from multiple services
   */
  async composeRequests(composedRequest: ComposedRequest): Promise<any> {
    const { endpoints, mergeStrategy = 'merge' } = composedRequest;

    try {
      // Make all requests in parallel
      const promises = endpoints.map(endpoint =>
        axios({
          url: endpoint.url,
          timeout: endpoint.timeout || 5000,
        })
          .then(response => ({ name: endpoint.name, data: response.data, success: true }))
          .catch(error => ({
            name: endpoint.name,
            data: null,
            success: false,
            error: error.message,
          }))
      );

      const results = await Promise.all(promises);

      // Merge results based on strategy
      return this.mergeResults(results, mergeStrategy);
    } catch (error: any) {
      logger.error('Request composition failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Merge results from multiple services
   */
  private mergeResults(
    results: Array<{ name: string; data: any; success: boolean; error?: string }>,
    strategy: 'merge' | 'array' | 'nested'
  ): any {
    switch (strategy) {
      case 'merge':
        // Merge all successful responses into a single object
        return results.reduce((acc, result) => {
          if (result.success) {
            return { ...acc, ...result.data };
          }
          return acc;
        }, {});

      case 'array':
        // Return array of all responses (including failures)
        return results;

      case 'nested':
        // Return nested object with service names as keys
        return results.reduce((acc, result) => {
          acc[result.name] = result.success
            ? result.data
            : { error: result.error };
          return acc;
        }, {} as any);

      default:
        return results;
    }
  }

  /**
   * Health check for all registered services
   */
  async healthCheck(): Promise<Record<string, { healthy: boolean; latency?: number; error?: string }>> {
    const healthPromises = Array.from(this.serviceRegistry.entries()).map(
      async ([name, url]) => {
        const startTime = Date.now();
        try {
          await axios.get(`${url}/health`, { timeout: 3000 });
          const latency = Date.now() - startTime;
          return [name, { healthy: true, latency }];
        } catch (error: any) {
          return [name, { healthy: false, error: error.message }];
        }
      }
    );

    const results = await Promise.all(healthPromises);
    return Object.fromEntries(results);
  }

  /**
   * Transform request before forwarding to backend service
   */
  transformRequest(req: any): any {
    // Add common headers
    const transformed = {
      ...req,
      headers: {
        ...req.headers,
        'X-Gateway-Timestamp': new Date().toISOString(),
        'X-Gateway-Version': process.env.npm_package_version || '1.0.0',
      },
    };

    return transformed;
  }

  /**
   * Transform response before sending to client
   */
  transformResponse(response: any): any {
    // Add gateway metadata
    return {
      ...response,
      _gateway: {
        version: process.env.npm_package_version || '1.0.0',
        timestamp: new Date().toISOString(),
      },
    };
  }
}

