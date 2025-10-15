"use strict";
/**
 * Service Discovery Routes
 * Exposes service registry and health information
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const service_registry_1 = require("../services/service-registry");
const router = (0, express_1.Router)();
/**
 * GET /discovery
 * Get all registered services
 */
router.get('/', (_req, res) => {
    try {
        const registry = (0, service_registry_1.getServiceRegistry)();
        const services = registry.getAllServices();
        res.json({
            success: true,
            data: {
                services: services.map(service => ({
                    name: service.name,
                    url: service.url,
                    port: service.port,
                    version: service.version,
                    description: service.description,
                    healthEndpoint: service.healthEndpoint,
                })),
                total: services.length,
            },
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: {
                code: 'DISCOVERY_ERROR',
                message: error.message,
            },
        });
    }
});
/**
 * GET /discovery/health
 * Get health status of all services
 */
router.get('/health', async (_req, res) => {
    try {
        const registry = (0, service_registry_1.getServiceRegistry)();
        const healthStatuses = await registry.checkAllServicesHealth();
        const allHealthy = healthStatuses.every(s => s.status === 'healthy');
        res.status(allHealthy ? 200 : 503).json({
            success: allHealthy,
            data: {
                services: healthStatuses,
                summary: {
                    total: healthStatuses.length,
                    healthy: healthStatuses.filter(s => s.status === 'healthy').length,
                    unhealthy: healthStatuses.filter(s => s.status === 'unhealthy').length,
                    unknown: healthStatuses.filter(s => s.status === 'unknown').length,
                },
            },
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: {
                code: 'HEALTH_CHECK_ERROR',
                message: error.message,
            },
        });
    }
});
/**
 * GET /discovery/service/:name
 * Get specific service details
 */
router.get('/service/:name', (req, res) => {
    try {
        const { name } = req.params;
        const registry = (0, service_registry_1.getServiceRegistry)();
        const service = registry.getService(name);
        if (!service) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'SERVICE_NOT_FOUND',
                    message: `Service '${name}' not found in registry`,
                },
            });
        }
        const health = registry.getCachedHealth(name);
        res.json({
            success: true,
            data: {
                service: {
                    ...service,
                    health,
                },
            },
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: {
                code: 'DISCOVERY_ERROR',
                message: error.message,
            },
        });
    }
});
/**
 * GET /discovery/service/:name/health
 * Check health of specific service
 */
router.get('/service/:name/health', async (req, res) => {
    try {
        const { name } = req.params;
        const registry = (0, service_registry_1.getServiceRegistry)();
        const health = await registry.checkServiceHealth(name);
        const isHealthy = health.status === 'healthy';
        res.status(isHealthy ? 200 : 503).json({
            success: isHealthy,
            data: { health },
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: {
                code: 'HEALTH_CHECK_ERROR',
                message: error.message,
            },
        });
    }
});
/**
 * GET /discovery/summary
 * Get service discovery summary
 */
router.get('/summary', (_req, res) => {
    try {
        const registry = (0, service_registry_1.getServiceRegistry)();
        const summary = registry.getServiceDiscovery();
        res.json({
            success: true,
            data: summary,
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: {
                code: 'DISCOVERY_ERROR',
                message: error.message,
            },
        });
    }
});
exports.default = router;
//# sourceMappingURL=service-discovery.routes.js.map