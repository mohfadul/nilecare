"use strict";
/**
 * Swagger Service
 * Aggregates and merges Swagger/OpenAPI documentation from all backend services
 *
 * ✅ Integrated from gateway-service into main-nilecare
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SwaggerService = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("@nilecare/logger");
const logger = (0, logger_1.createLogger)('swagger-service');
class SwaggerService {
    constructor() {
        this.serviceUrls = new Map();
        this.initializeServiceUrls();
    }
    /**
     * Initialize service URLs for Swagger docs
     */
    initializeServiceUrls() {
        const services = {
            'auth-service': process.env.AUTH_SERVICE_URL || 'http://localhost:7020',
            'business-service': process.env.BUSINESS_SERVICE_URL || 'http://localhost:7010',
            'clinical-service': process.env.CLINICAL_SERVICE_URL || 'http://localhost:3004',
            'appointment-service': process.env.APPOINTMENT_SERVICE_URL || 'http://localhost:7040',
            'payment-service': process.env.PAYMENT_SERVICE_URL || 'http://localhost:7030',
            'billing-service': process.env.BILLING_SERVICE_URL || 'http://localhost:7050',
            'medication-service': process.env.MEDICATION_SERVICE_URL || 'http://localhost:4003',
            'lab-service': process.env.LAB_SERVICE_URL || 'http://localhost:4005',
            'inventory-service': process.env.INVENTORY_SERVICE_URL || 'http://localhost:5004',
            'facility-service': process.env.FACILITY_SERVICE_URL || 'http://localhost:5001',
            'fhir-service': process.env.FHIR_SERVICE_URL || 'http://localhost:6001',
            'hl7-service': process.env.HL7_SERVICE_URL || 'http://localhost:6002',
            'device-integration-service': process.env.DEVICE_SERVICE_URL || 'http://localhost:7009',
            'notification-service': process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:7007',
        };
        Object.entries(services).forEach(([name, url]) => {
            if (url) {
                this.serviceUrls.set(name, url);
            }
        });
    }
    /**
     * Fetch Swagger spec from a service
     */
    async fetchServiceSwagger(serviceName, url) {
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
                    const response = await axios_1.default.get(`${url}${endpoint}`, { timeout: 5000 });
                    logger.info(`Fetched Swagger spec from ${serviceName}`, { url: `${url}${endpoint}` });
                    return response.data;
                }
                catch (error) {
                    // Try next endpoint
                    continue;
                }
            }
            logger.warn(`No Swagger spec found for ${serviceName}`);
            return null;
        }
        catch (error) {
            logger.error(`Failed to fetch Swagger spec from ${serviceName}`, { error: error.message });
            return null;
        }
    }
    /**
     * Get merged Swagger specification from all services
     */
    async getMergedSwaggerSpec() {
        const specs = await Promise.all(Array.from(this.serviceUrls.entries()).map(([name, url]) => this.fetchServiceSwagger(name, url)));
        // Filter out null specs
        const validSpecs = specs.filter((spec) => spec !== null);
        if (validSpecs.length === 0) {
            // Return gateway's own basic spec
            return this.getMainNileCareSpec();
        }
        // Merge all specs
        return this.mergeSpecs(validSpecs);
    }
    /**
     * Merge multiple Swagger specs into one
     */
    mergeSpecs(specs) {
        const merged = {
            openapi: '3.0.0',
            info: {
                title: 'NileCare Healthcare Platform API',
                version: '1.0.0',
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
                Object.assign(merged.components.schemas, spec.components.schemas);
            }
            // Support Swagger 2.0 definitions
            if (spec.definitions) {
                if (!merged.components.schemas) {
                    merged.components.schemas = {};
                }
                Object.assign(merged.components.schemas, spec.definitions);
            }
        }
        return merged;
    }
    /**
     * Get Main NileCare's own Swagger specification
     */
    getMainNileCareSpec() {
        return {
            openapi: '3.0.0',
            info: {
                title: 'NileCare Main Orchestrator API',
                version: '1.0.0',
                description: `
# NileCare Healthcare Platform - Main Orchestrator

This is the main API orchestrator for the NileCare Healthcare Platform.

## Features
- **Circuit Breakers**: Resilient service communication with Opossum
- **Service Discovery**: Automatic health checking and routing
- **Redis Caching**: Smart caching with invalidation strategies
- **Response Aggregation**: Combine data from multiple services
- **WebSocket Support**: Real-time device data and notifications
- **Swagger Documentation**: Unified API documentation from all services
- **Rate Limiting**: Prevent abuse and ensure fair usage

## Architecture
- **Stateless**: No database, pure routing and orchestration
- **Microservices**: Routes to 14+ downstream services
- **FHIR/HL7**: Healthcare interoperability standards
- **Device Integration**: Medical device data management
- **Multi-tenancy**: Multi-facility support

## Authentication
All API endpoints (except /health and /api-docs) require authentication.
Include a JWT token in the Authorization header:

\`\`\`
Authorization: Bearer <your-jwt-token>
\`\`\`

Obtain tokens from the Auth Service (port 7020).

## Services
- **Auth Service** (7020): Authentication and authorization
- **Business Service** (7010): Business logic, appointments
- **Clinical Service** (3004): Patient records
- **Payment Gateway** (7030): Multi-provider payment processing
- **Billing Service** (7050): Billing and invoicing
- **Device Integration** (7009): Medical devices and vital signs
- **Notification Service** (7007): Real-time notifications
- **FHIR Service** (6001): FHIR R4 compliance
- **HL7 Service** (6002): HL7 v2.x messaging
        `,
            },
            paths: {
                '/health': {
                    get: {
                        summary: 'Health check',
                        description: 'Check if the orchestrator is healthy',
                        responses: {
                            '200': {
                                description: 'Orchestrator is healthy',
                                content: {
                                    'application/json': {
                                        schema: {
                                            type: 'object',
                                            properties: {
                                                status: { type: 'string', example: 'healthy' },
                                                service: { type: 'string', example: 'main-nilecare-orchestrator' },
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
                        description: 'Check if orchestrator is ready and downstream services are healthy',
                        responses: {
                            '200': {
                                description: 'Orchestrator is ready',
                            },
                            '503': {
                                description: 'Orchestrator is not ready',
                            },
                        },
                    },
                },
                '/api/v1/services/status': {
                    get: {
                        summary: 'Service registry status',
                        description: 'Get health status of all downstream services',
                        security: [{ bearerAuth: [] }],
                        responses: {
                            '200': {
                                description: 'Service status',
                            },
                        },
                    },
                },
                '/api/v1/patients': {
                    get: {
                        summary: 'List patients',
                        description: 'Get list of patients (cached 5 minutes)',
                        security: [{ bearerAuth: [] }],
                        responses: {
                            '200': {
                                description: 'List of patients',
                            },
                        },
                    },
                    post: {
                        summary: 'Create patient',
                        description: 'Create a new patient record',
                        security: [{ bearerAuth: [] }],
                        responses: {
                            '201': {
                                description: 'Patient created',
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
exports.SwaggerService = SwaggerService;
//# sourceMappingURL=SwaggerService.js.map