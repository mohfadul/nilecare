/**
 * Service Registry
 * Centralized registry for all microservices
 */

import axios from 'axios';
import winston from 'winston';

export interface ServiceDefinition {
  name: string;
  url: string;
  port: number;
  healthEndpoint: string;
  version: string;
  description: string;
  dependencies?: string[];
}

export interface ServiceHealthStatus {
  name: string;
  url: string;
  status: 'healthy' | 'unhealthy' | 'unknown';
  responseTime?: number;
  lastCheck: Date;
  uptime?: number;
  version?: string;
  error?: string;
}

export class ServiceRegistry {
  private services: Map<string, ServiceDefinition> = new Map();
  private healthCache: Map<string, ServiceHealthStatus> = new Map();
  private logger: winston.Logger;
  private checkInterval: NodeJS.Timeout | null = null;

  constructor(logger: winston.Logger) {
    this.logger = logger;
    this.initializeServices();
  }

  /**
   * Initialize service definitions
   */
  private initializeServices(): void {
    const services: ServiceDefinition[] = [
      {
        name: 'business-service',
        url: process.env.BUSINESS_SERVICE_URL || 'http://localhost:7010',
        port: 7010,
        healthEndpoint: '/health',
        version: '1.0.0',
        description: 'Business domain operations (appointments, billing, staff, scheduling)',
      },
      {
        name: 'auth-service',
        url: process.env.AUTH_SERVICE_URL || 'http://localhost:7020',
        port: 7020,
        healthEndpoint: '/health',
        version: '1.0.0',
        description: 'Authentication and authorization service',
      },
      {
        name: 'payment-service',
        url: process.env.PAYMENT_SERVICE_URL || 'http://localhost:7030',
        port: 7030,
        healthEndpoint: '/health',
        version: '1.0.0',
        description: 'Payment processing and gateway service',
      },
      {
        name: 'appointment-service',
        url: process.env.APPOINTMENT_SERVICE_URL || 'http://localhost:7040',
        port: 7040,
        healthEndpoint: '/health',
        version: '1.0.0',
        description: 'Appointment management service',
      },
    ];

    services.forEach(service => {
      this.services.set(service.name, service);
    });

    this.logger.info(`Service registry initialized with ${services.length} services`);
  }

  /**
   * Register a new service
   */
  register(service: ServiceDefinition): void {
    this.services.set(service.name, service);
    this.logger.info(`Service registered: ${service.name} at ${service.url}`);
  }

  /**
   * Unregister a service
   */
  unregister(serviceName: string): void {
    this.services.delete(serviceName);
    this.healthCache.delete(serviceName);
    this.logger.info(`Service unregistered: ${serviceName}`);
  }

  /**
   * Get service by name
   */
  getService(name: string): ServiceDefinition | undefined {
    return this.services.get(name);
  }

  /**
   * Get all registered services
   */
  getAllServices(): ServiceDefinition[] {
    return Array.from(this.services.values());
  }

  /**
   * Check health of a single service
   */
  async checkServiceHealth(serviceName: string): Promise<ServiceHealthStatus> {
    const service = this.services.get(serviceName);
    
    if (!service) {
      return {
        name: serviceName,
        url: 'unknown',
        status: 'unknown',
        lastCheck: new Date(),
        error: 'Service not found in registry',
      };
    }

    const startTime = Date.now();

    try {
      const response = await axios.get(`${service.url}${service.healthEndpoint}`, {
        timeout: 5000,
      });

      const responseTime = Date.now() - startTime;

      const healthStatus: ServiceHealthStatus = {
        name: serviceName,
        url: service.url,
        status: 'healthy',
        responseTime,
        lastCheck: new Date(),
        uptime: response.data.uptime,
        version: response.data.version || service.version,
      };

      this.healthCache.set(serviceName, healthStatus);
      return healthStatus;
    } catch (error: any) {
      const healthStatus: ServiceHealthStatus = {
        name: serviceName,
        url: service.url,
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        lastCheck: new Date(),
        error: error.message || 'Service unreachable',
      };

      this.healthCache.set(serviceName, healthStatus);
      this.logger.warn(`Service health check failed: ${serviceName} - ${error.message}`);
      return healthStatus;
    }
  }

  /**
   * Check health of all services
   */
  async checkAllServicesHealth(): Promise<ServiceHealthStatus[]> {
    const serviceNames = Array.from(this.services.keys());
    const healthChecks = await Promise.all(
      serviceNames.map(name => this.checkServiceHealth(name))
    );
    return healthChecks;
  }

  /**
   * Get cached health status
   */
  getCachedHealth(serviceName: string): ServiceHealthStatus | undefined {
    return this.healthCache.get(serviceName);
  }

  /**
   * Get all cached health statuses
   */
  getAllCachedHealth(): ServiceHealthStatus[] {
    return Array.from(this.healthCache.values());
  }

  /**
   * Start periodic health checks
   */
  startHealthChecks(intervalMs: number = 30000): void {
    if (this.checkInterval) {
      this.logger.warn('Health checks already running');
      return;
    }

    this.logger.info(`Starting periodic health checks every ${intervalMs}ms`);
    
    // Run initial check
    this.checkAllServicesHealth();

    // Schedule periodic checks
    this.checkInterval = setInterval(() => {
      this.checkAllServicesHealth();
    }, intervalMs);
  }

  /**
   * Stop periodic health checks
   */
  stopHealthChecks(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      this.logger.info('Stopped periodic health checks');
    }
  }

  /**
   * Get service discovery information
   */
  getServiceDiscovery(): {
    totalServices: number;
    healthyServices: number;
    unhealthyServices: number;
    unknownServices: number;
    services: ServiceHealthStatus[];
  } {
    const services = this.getAllCachedHealth();
    
    return {
      totalServices: this.services.size,
      healthyServices: services.filter(s => s.status === 'healthy').length,
      unhealthyServices: services.filter(s => s.status === 'unhealthy').length,
      unknownServices: this.services.size - services.length,
      services,
    };
  }

  /**
   * Get service URL by name
   */
  getServiceUrl(serviceName: string): string | null {
    const service = this.services.get(serviceName);
    return service ? service.url : null;
  }

  /**
   * Check if service is available
   */
  isServiceAvailable(serviceName: string): boolean {
    const health = this.healthCache.get(serviceName);
    return health?.status === 'healthy';
  }

  /**
   * Get service dependencies
   */
  getServiceDependencies(serviceName: string): string[] {
    const service = this.services.get(serviceName);
    return service?.dependencies || [];
  }

  /**
   * Validate service dependencies
   */
  async validateDependencies(serviceName: string): Promise<{
    valid: boolean;
    missingDependencies: string[];
  }> {
    const dependencies = this.getServiceDependencies(serviceName);
    const missingDependencies: string[] = [];

    for (const dep of dependencies) {
      const isAvailable = this.isServiceAvailable(dep);
      if (!isAvailable) {
        missingDependencies.push(dep);
      }
    }

    return {
      valid: missingDependencies.length === 0,
      missingDependencies,
    };
  }
}

// Export singleton instance
let registryInstance: ServiceRegistry | null = null;

export function createServiceRegistry(logger: winston.Logger): ServiceRegistry {
  if (!registryInstance) {
    registryInstance = new ServiceRegistry(logger);
  }
  return registryInstance;
}

export function getServiceRegistry(): ServiceRegistry {
  if (!registryInstance) {
    throw new Error('Service registry not initialized');
  }
  return registryInstance;
}

