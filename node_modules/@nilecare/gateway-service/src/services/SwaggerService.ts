/**
 * Swagger Service
 * Aggregates and merges Swagger/OpenAPI documentation from all backend services
 */

import axios from 'axios';
import { logger } from '../utils/logger';

export interface SwaggerSpec {
  openapi?: string;
  swagger?: string;
  info: {
    title: string;
    version: string;
    description?: string;
  };
  paths: Record<string, any>;
  components?: any;
  definitions?: any;
}

export class SwaggerService {
  private serviceUrls: Map<string, string>;

  constructor() {
    this.serviceUrls = new Map();
    this.initializeServiceUrls();
  }

  /**
   * Initialize service URLs for Swagger docs
   */
  private initializeServiceUrls(): void {
    const services = {
      'auth-service': process.env.AUTH_SERVICE_URL || 'http://localhost:7020',
      'clinical-service': process.env.CLINICAL_SERVICE_URL || 'http://localhost:7001',
      'business-service': process.env.BUSINESS_SERVICE_URL || 'http://localhost:7010',
      'data-service': process.env.DATA_SERVICE_URL || 'http://localhost:7003',
      'notification-service': process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:7002',
    };

    Object.entries(services).forEach(([name, url]) => {
      this.serviceUrls.set(name, url);
    });
  }

  /**
   * Fetch Swagger spec from a service
   */
  private async fetchServiceSwagger(serviceName: string, url: string): Promise<SwaggerSpec | null> {
    try {
      // Try common Swagger endpoints
      const endpoints = [
        '/api-docs/swagger.json',
        '/api-docs',
        '/swagger.json',
        '/swagger',
      ];

      for (const endpoint of endpoints) {
        try {
          const response = await axios.get(`${url}${endpoint}`, { timeout: 5000 });
          logger.info(`Fetched Swagger spec from ${serviceName}`, { url: `${url}${endpoint}` });
          return response.data;
        } catch (error) {
          // Try next endpoint
          continue;
        }
      }

      logger.warn(`No Swagger spec found for ${serviceName}`);
      return null;
    } catch (error: any) {
      logger.error(`Failed to fetch Swagger spec from ${serviceName}`, { error: error.message });
      return null;
    }
  }

  /**
   * Get merged Swagger specification from all services
   */
  async getMergedSwaggerSpec(): Promise<SwaggerSpec> {
    const specs: Array<SwaggerSpec | null> = await Promise.all(
      Array.from(this.serviceUrls.entries()).map(([name, url]) =>
        this.fetchServiceSwagger(name, url)
      )
    );

    // Filter out null specs
    const validSpecs = specs.filter((spec): spec is SwaggerSpec => spec !== null);

    if (validSpecs.length === 0) {
      // Return gateway's own basic spec
      return this.getGatewaySpec();
    }

    // Merge all specs
    return this.mergeSpecs(validSpecs);
  }

  /**
   * Merge multiple Swagger specs into one
   */
  private mergeSpecs(specs: SwaggerSpec[]): SwaggerSpec {
    const merged: SwaggerSpec = {
      openapi: '3.0.0',
      info: {
        title: 'NileCare Healthcare Platform API',
        version: process.env.npm_package_version || '1.0.0',
        description: 'Unified API documentation for all NileCare microservices',
      },
      paths: {},
      components: {
        schemas: {},
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    };

    // Merge paths and components from all specs
    for (const spec of specs) {
      // Merge paths
      Object.assign(merged.paths, spec.paths || {});

      // Merge components/schemas
      if (spec.components?.schemas) {
        Object.assign(merged.components!.schemas, spec.components.schemas);
      }

      // Support Swagger 2.0 definitions
      if (spec.definitions) {
        if (!merged.components!.schemas) {
          merged.components!.schemas = {};
        }
        Object.assign(merged.components!.schemas, spec.definitions);
      }
    }

    return merged;
  }

  /**
   * Get gateway's own Swagger specification
   */
  private getGatewaySpec(): SwaggerSpec {
    return {
      openapi: '3.0.0',
      info: {
        title: 'NileCare API Gateway',
        version: process.env.npm_package_version || '1.0.0',
        description: `
# NileCare Healthcare Platform API Gateway

This is the central API gateway for the NileCare Healthcare Platform.

## Features
- **API Routing**: Intelligent routing to backend microservices
- **Request Composition**: Aggregate data from multiple services
- **Response Transformation**: Normalize and transform responses
- **CORS Handling**: Configured CORS for web applications
- **Security Headers**: Helmet.js security headers
- **Rate Limiting**: Prevent abuse and ensure fair usage
- **Swagger Documentation**: Unified API documentation
- **WebSocket Proxy**: Real-time notifications support

## Authentication
All API endpoints (except /health and /api-docs) require authentication.
Include a JWT token in the Authorization header:

\`\`\`
Authorization: Bearer <your-jwt-token>
\`\`\`

## Services
- **Auth Service**: User authentication and authorization
- **Clinical Service**: Patient records, encounters, medications
- **Business Service**: Appointments, scheduling, staff management
- **Data Service**: Analytics, reports, dashboards
- **Notification Service**: Real-time notifications
        `,
      },
      paths: {
        '/health': {
          get: {
            summary: 'Health check',
            description: 'Check if the gateway is healthy',
            responses: {
              '200': {
                description: 'Gateway is healthy',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        status: { type: 'string', example: 'healthy' },
                        service: { type: 'string', example: 'gateway-service' },
                        timestamp: { type: 'string', format: 'date-time' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        '/health/ready': {
          get: {
            summary: 'Readiness probe',
            description: 'Check if the gateway is ready to accept requests',
            responses: {
              '200': {
                description: 'Gateway is ready',
              },
              '503': {
                description: 'Gateway is not ready',
              },
            },
          },
        },
        '/health/startup': {
          get: {
            summary: 'Startup probe',
            description: 'Check if the gateway has started',
            responses: {
              '200': {
                description: 'Gateway has started',
              },
              '503': {
                description: 'Gateway is still starting',
              },
            },
          },
        },
        '/metrics': {
          get: {
            summary: 'Prometheus metrics',
            description: 'Get Prometheus-compatible metrics',
            responses: {
              '200': {
                description: 'Metrics',
                content: {
                  'text/plain': {
                    schema: {
                      type: 'string',
                    },
                  },
                },
              },
            },
          },
        },
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    };
  }
}

