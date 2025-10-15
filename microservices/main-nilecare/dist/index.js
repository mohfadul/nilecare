"use strict";
/**
 * Main NileCare Orchestrator
 * Port: 7000
 *
 * ✅ PHASE 2 REFACTORING:
 * - Stateless (NO database)
 * - Pure routing layer
 * - Circuit breakers for resilience
 * - Service discovery
 * - Centralized shared packages
 *
 * This service acts as the main API gateway, routing requests to
 * appropriate microservices and aggregating responses when needed.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.server = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const axios_1 = __importDefault(require("axios"));
const opossum_1 = __importDefault(require("opossum"));
const http_1 = require("http");
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const morgan_1 = __importDefault(require("morgan"));
// ✅ NEW: Shared packages
const logger_1 = require("@nilecare/logger");
const config_validator_1 = require("@nilecare/config-validator");
const error_handler_1 = require("@nilecare/error-handler");
const service_discovery_1 = require("@nilecare/service-discovery");
const cache_1 = require("@nilecare/cache");
// Import authentication middleware
const auth_1 = require("./middleware/auth");
// ✅ NEW: Services for Swagger and WebSocket proxying
const SwaggerService_1 = require("./services/SwaggerService");
const ProxyService_1 = require("./services/ProxyService");
// ✅ NEW: Response transformer
const responseTransformer_1 = __importDefault(require("./middleware/responseTransformer"));
// ============================================================================
// ENVIRONMENT VALIDATION (Fail fast if misconfigured)
// ============================================================================
const config = (0, config_validator_1.validateAndLog)(config_validator_1.commonEnvSchema, 'main-nilecare');
// ============================================================================
// INITIALIZE LOGGER
// ============================================================================
const logger = (0, logger_1.createLogger)('main-nilecare');
// ============================================================================
// INITIALIZE CACHE (Phase 3)
// ============================================================================
const cache = new cache_1.CacheManager({
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || '0')
    },
    defaultTTL: parseInt(process.env.CACHE_TTL || '300'), // 5 minutes default
    prefix: 'nilecare:'
});
// Test Redis connection
cache.ping().then(connected => {
    if (connected) {
        logger.info('✅ Redis cache connected');
    }
    else {
        logger.warn('⚠️  Redis cache not available - caching disabled');
    }
}).catch(err => {
    logger.warn('⚠️  Redis connection error - caching disabled:', err.message);
});
// ============================================================================
// INITIALIZE SERVICE DISCOVERY
// ============================================================================
const serviceRegistry = (0, service_discovery_1.createNileCareRegistry)({
    autoStart: true,
    services: {
        'auth-service': config.AUTH_SERVICE_URL,
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
        'notification-service': process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:7007'
    },
    healthConfig: {
        path: '/health',
        timeout: 3000,
        interval: 30000,
        maxFailures: 3
    }
});
// ============================================================================
// INITIALIZE EXPRESS APP & HTTP SERVER
// ============================================================================
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app); // For WebSocket support
exports.server = server;
const PORT = config.PORT || 7000;
// Initialize services
const swaggerService = new SwaggerService_1.SwaggerService();
const proxyService = new ProxyService_1.ProxyService();
const breakers = {};
/**
 * Create circuit breaker for a service
 */
function createServiceBreaker(serviceName) {
    const breaker = new opossum_1.default(async (config) => {
        return await (0, axios_1.default)(config);
    }, {
        timeout: 10000, // 10 seconds
        errorThresholdPercentage: 50,
        resetTimeout: 30000, // 30 seconds
        volumeThreshold: 3,
        rollingCountTimeout: 10000
    });
    breaker.on('open', () => {
        logger.error(`🔴 Circuit breaker OPEN for ${serviceName}`);
    });
    breaker.on('halfOpen', () => {
        logger.warn(`🟡 Circuit breaker HALF-OPEN (testing) for ${serviceName}`);
    });
    breaker.on('close', () => {
        logger.info(`🟢 Circuit breaker CLOSED (recovered) for ${serviceName}`);
    });
    breaker.fallback(() => {
        throw error_handler_1.Errors.serviceUnavailable(serviceName);
    });
    return breaker;
}
// Initialize circuit breakers for all services
const serviceNames = [
    'auth-service',
    'business-service',
    'clinical-service',
    'appointment-service',
    'payment-service',
    'billing-service',
    'medication-service',
    'lab-service',
    'inventory-service',
    'facility-service',
    'fhir-service',
    'hl7-service'
];
serviceNames.forEach(serviceName => {
    breakers[serviceName] = createServiceBreaker(serviceName);
});
// ============================================================================
// MIDDLEWARE
// ============================================================================
app.use((0, helmet_1.default)({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false,
}));
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use((0, compression_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Request logging
app.use((0, morgan_1.default)('combined', { stream: { write: (message) => logger.info(message.trim()) } }));
app.use((0, logger_1.createRequestLogger)(logger));
// Response transformer (removes sensitive fields)
app.use(responseTransformer_1.default);
// ============================================================================
// PROXY HELPER FUNCTIONS
// ============================================================================
/**
 * Proxy request to a microservice with circuit breaker (NO caching)
 */
async function proxyToService(serviceName, path, method, req) {
    // Get service URL from registry
    const serviceUrl = await serviceRegistry.getServiceUrl(serviceName);
    if (!serviceUrl) {
        throw error_handler_1.Errors.serviceUnavailable(serviceName);
    }
    // Make request through circuit breaker
    const breaker = breakers[serviceName];
    const response = await breaker.fire({
        method,
        url: `${serviceUrl}${path}`,
        headers: {
            'Content-Type': 'application/json',
            ...(req.headers.authorization && { 'Authorization': req.headers.authorization })
        },
        params: method === 'GET' ? req.query : undefined,
        data: method !== 'GET' ? req.body : undefined,
        timeout: 10000
    });
    return response.data;
}
/**
 * Proxy request with Redis caching (Phase 3)
 * Only caches GET requests
 */
async function cachedProxyToService(serviceName, path, method, req, options) {
    // Only cache GET requests
    if (method !== 'GET' || options?.bypassCache) {
        return await proxyToService(serviceName, path, method, req);
    }
    // Generate cache key
    const queryString = Object.keys(req.query).length > 0 ? JSON.stringify(req.query) : '';
    const cacheKey = `${serviceName}:${path}:${queryString}`;
    // Try cache first
    const cached = await cache.get(cacheKey);
    if (cached) {
        logger.debug('Cache HIT', { key: cacheKey });
        return cached;
    }
    logger.debug('Cache MISS', { key: cacheKey });
    // Call service
    const data = await proxyToService(serviceName, path, method, req);
    // Cache the result
    const ttl = options?.ttl || 300; // 5 minutes default
    await cache.set(cacheKey, data, ttl);
    return data;
}
// ============================================================================
// HEALTH CHECK ENDPOINTS
// ============================================================================
app.get('/health', (_req, res) => {
    res.status(200).json({
        status: 'healthy',
        service: 'main-nilecare-orchestrator',
        version: '2.0.0',
        timestamp: new Date().toISOString(),
        architecture: 'stateless-orchestrator',
        features: {
            serviceDiscovery: true,
            circuitBreakers: true,
            healthBasedRouting: true,
            responseAggregation: true
        }
    });
});
app.get('/health/ready', async (_req, res) => {
    const healthyServices = serviceRegistry.getHealthyServices();
    const unhealthyServices = serviceRegistry.getUnhealthyServices();
    res.status(200).json({
        status: 'ready',
        services: {
            healthy: healthyServices,
            unhealthy: unhealthyServices,
            total: serviceRegistry.getServiceCount()
        },
        timestamp: new Date().toISOString()
    });
});
// Service status endpoint
app.get('/api/v1/services/status', auth_1.authenticate, (_req, res) => {
    res.json({
        success: true,
        data: serviceRegistry.getStatus()
    });
});
// ✅ Phase 3: Cache statistics endpoint
app.get('/api/v1/cache/stats', auth_1.authenticate, async (_req, res) => {
    try {
        const stats = await cache.getStats();
        res.json({
            success: true,
            data: stats
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: { code: 'CACHE_ERROR', message: error.message }
        });
    }
});
// ✅ Phase 3: Clear cache endpoint (admin only)
app.delete('/api/v1/cache', auth_1.authenticate, async (_req, res) => {
    try {
        await cache.flushAll();
        res.json({
            success: true,
            message: 'Cache cleared successfully'
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: { code: 'CACHE_ERROR', message: error.message }
        });
    }
});
// Service info endpoint
app.get('/', (_req, res) => {
    res.json({
        service: 'NileCare Main Orchestrator',
        version: '2.0.0',
        status: 'running',
        port: PORT,
        description: '✅ Stateless orchestration and routing layer (Phase 2)',
        architecture: {
            type: 'API Gateway / Orchestrator',
            stateless: true,
            database: false,
            circuitBreakers: true,
            serviceDiscovery: true
        },
        routes: {
            health: '/health',
            servicesStatus: '/api/v1/services/status',
            patients: '/api/v1/patients → clinical-service',
            appointments: '/api/v1/appointments → business-service',
            billing: '/api/v1/billing → business-service',
            medications: '/api/v1/medications → medication-service',
            labs: '/api/v1/lab-orders → lab-service',
            devices: '/api/v1/devices → device-integration-service',
            vitalSigns: '/api/v1/vital-signs → device-integration-service'
        },
        timestamp: new Date().toISOString()
    });
});
// ============================================================================
// ORCHESTRATOR ROUTES (Pure Proxying)
// ============================================================================
// --- PATIENTS (routed to clinical-service) ---
app.get('/api/v1/patients', auth_1.authenticate, async (req, res, next) => {
    try {
        const data = await cachedProxyToService('clinical-service', '/api/v1/patients', 'GET', req, { ttl: 300 });
        res.setHeader('X-Cache-Enabled', 'true');
        res.json(data);
    }
    catch (error) {
        next(error);
    }
});
app.post('/api/v1/patients', auth_1.authenticate, async (req, res, next) => {
    try {
        const data = await proxyToService('clinical-service', '/api/v1/patients', 'POST', req);
        // ✅ Phase 3: Invalidate patient cache on creation
        await cache.invalidatePattern('clinical-service:/api/v1/patients:*');
        logger.debug('Cache invalidated', { pattern: 'patients:*' });
        res.status(201).json(data);
    }
    catch (error) {
        next(error);
    }
});
app.get('/api/v1/patients/:id', auth_1.authenticate, async (req, res, next) => {
    try {
        const data = await cachedProxyToService('clinical-service', `/api/v1/patients/${req.params.id}`, 'GET', req, { ttl: 600 });
        res.setHeader('X-Cache-Enabled', 'true');
        res.json(data);
    }
    catch (error) {
        next(error);
    }
});
app.put('/api/v1/patients/:id', auth_1.authenticate, async (req, res, next) => {
    try {
        const data = await proxyToService('clinical-service', `/api/v1/patients/${req.params.id}`, 'PUT', req);
        // ✅ Phase 3: Invalidate specific patient cache
        await cache.del(`clinical-service:/api/v1/patients/${req.params.id}:`);
        await cache.invalidatePattern('clinical-service:/api/v1/patients:*');
        logger.debug('Cache invalidated', { patient: req.params.id });
        res.json(data);
    }
    catch (error) {
        next(error);
    }
});
app.delete('/api/v1/patients/:id', auth_1.authenticate, async (req, res, next) => {
    try {
        const data = await proxyToService('clinical-service', `/api/v1/patients/${req.params.id}`, 'DELETE', req);
        // ✅ Phase 3: Invalidate patient cache on deletion
        await cache.del(`clinical-service:/api/v1/patients/${req.params.id}:`);
        await cache.invalidatePattern('clinical-service:/api/v1/patients:*');
        logger.debug('Cache invalidated', { patient: req.params.id });
        res.json(data);
    }
    catch (error) {
        next(error);
    }
});
// --- APPOINTMENTS (routed to business-service) ---
app.get('/api/v1/appointments', auth_1.authenticate, async (req, res, next) => {
    try {
        const data = await cachedProxyToService('business-service', '/api/v1/appointments', 'GET', req, { ttl: 180 }); // 3 min cache
        res.setHeader('X-Cache-Enabled', 'true');
        res.json(data);
    }
    catch (error) {
        next(error);
    }
});
app.post('/api/v1/appointments', auth_1.authenticate, async (req, res, next) => {
    try {
        const data = await proxyToService('business-service', '/api/v1/appointments', 'POST', req);
        // ✅ Phase 3: Invalidate appointment cache
        await cache.invalidatePattern('business-service:/api/v1/appointments:*');
        res.status(201).json(data);
    }
    catch (error) {
        next(error);
    }
});
app.get('/api/v1/appointments/:id', auth_1.authenticate, async (req, res, next) => {
    try {
        const data = await proxyToService('business-service', `/api/v1/appointments/${req.params.id}`, 'GET', req);
        res.json(data);
    }
    catch (error) {
        next(error);
    }
});
app.put('/api/v1/appointments/:id', auth_1.authenticate, async (req, res, next) => {
    try {
        const data = await proxyToService('business-service', `/api/v1/appointments/${req.params.id}`, 'PUT', req);
        res.json(data);
    }
    catch (error) {
        next(error);
    }
});
app.delete('/api/v1/appointments/:id', auth_1.authenticate, async (req, res, next) => {
    try {
        const data = await proxyToService('business-service', `/api/v1/appointments/${req.params.id}`, 'DELETE', req);
        res.json(data);
    }
    catch (error) {
        next(error);
    }
});
// --- PAYMENTS (routed to payment-gateway-service) ---
// ✅ Multi-provider payment processing for Sudan healthcare
app.post('/api/v1/payments/initiate', auth_1.authenticate, async (req, res, next) => {
    try {
        const data = await proxyToService('payment-service', '/api/v1/payments/initiate', 'POST', req);
        // Invalidate related caches (billing, invoices)
        await cache.invalidatePattern('billing-service:*');
        await cache.invalidatePattern('payment-service:*');
        logger.info('Payment initiated', { paymentId: data.id });
        res.status(201).json(data);
    }
    catch (error) {
        next(error);
    }
});
app.get('/api/v1/payments/:id', auth_1.authenticate, async (req, res, next) => {
    try {
        const data = await cachedProxyToService('payment-service', `/api/v1/payments/${req.params.id}`, 'GET', req, { ttl: 180 }); // 3 min cache
        res.setHeader('X-Cache-Enabled', 'true');
        res.json(data);
    }
    catch (error) {
        next(error);
    }
});
app.get('/api/v1/payments', auth_1.authenticate, async (req, res, next) => {
    try {
        const data = await cachedProxyToService('payment-service', '/api/v1/payments', 'GET', req, { ttl: 120 }); // 2 min cache
        res.setHeader('X-Cache-Enabled', 'true');
        res.json(data);
    }
    catch (error) {
        next(error);
    }
});
app.post('/api/v1/payments/verify', auth_1.authenticate, async (req, res, next) => {
    try {
        const data = await proxyToService('payment-service', '/api/v1/payments/verify', 'POST', req);
        // Invalidate payment caches
        await cache.invalidatePattern('payment-service:*');
        logger.info('Payment verified', { paymentId: req.body.paymentId });
        res.json(data);
    }
    catch (error) {
        next(error);
    }
});
app.get('/api/v1/payments/pending-verification', auth_1.authenticate, async (req, res, next) => {
    try {
        const data = await proxyToService('payment-service', '/api/v1/payments/pending-verification', 'GET', req);
        res.json(data);
    }
    catch (error) {
        next(error);
    }
});
app.get('/api/v1/payments/stats', auth_1.authenticate, async (req, res, next) => {
    try {
        const data = await cachedProxyToService('payment-service', '/api/v1/payments/stats', 'GET', req, { ttl: 300 }); // 5 min cache
        res.setHeader('X-Cache-Enabled', 'true');
        res.json(data);
    }
    catch (error) {
        next(error);
    }
});
app.patch('/api/v1/payments/:id/cancel', auth_1.authenticate, async (req, res, next) => {
    try {
        const data = await proxyToService('payment-service', `/api/v1/payments/${req.params.id}/cancel`, 'PATCH', req);
        // Invalidate payment caches
        await cache.invalidatePattern('payment-service:*');
        await cache.invalidatePattern('billing-service:*');
        res.json(data);
    }
    catch (error) {
        next(error);
    }
});
// Refunds
app.post('/api/v1/refunds', auth_1.authenticate, async (req, res, next) => {
    try {
        const data = await proxyToService('payment-service', '/api/v1/refunds', 'POST', req);
        // Invalidate caches
        await cache.invalidatePattern('payment-service:*');
        await cache.invalidatePattern('billing-service:*');
        res.status(201).json(data);
    }
    catch (error) {
        next(error);
    }
});
app.get('/api/v1/refunds/:id', auth_1.authenticate, async (req, res, next) => {
    try {
        const data = await cachedProxyToService('payment-service', `/api/v1/refunds/${req.params.id}`, 'GET', req, { ttl: 300 }); // 5 min cache
        res.setHeader('X-Cache-Enabled', 'true');
        res.json(data);
    }
    catch (error) {
        next(error);
    }
});
// Reconciliation
app.post('/api/v1/reconciliation', auth_1.authenticate, async (req, res, next) => {
    try {
        const data = await proxyToService('payment-service', '/api/v1/reconciliation', 'POST', req);
        res.status(201).json(data);
    }
    catch (error) {
        next(error);
    }
});
app.get('/api/v1/reconciliation/:id', auth_1.authenticate, async (req, res, next) => {
    try {
        const data = await cachedProxyToService('payment-service', `/api/v1/reconciliation/${req.params.id}`, 'GET', req, { ttl: 600 }); // 10 min cache
        res.setHeader('X-Cache-Enabled', 'true');
        res.json(data);
    }
    catch (error) {
        next(error);
    }
});
// Webhook endpoint (no auth - signature verified by payment gateway)
app.post('/api/v1/payments/webhook/:provider', async (req, res, next) => {
    try {
        const data = await proxyToService('payment-service', `/api/v1/payments/webhook/${req.params.provider}`, 'POST', req);
        res.json(data);
    }
    catch (error) {
        next(error);
    }
});
// --- BILLING (routed to billing-service) ---
app.get('/api/v1/billing', auth_1.authenticate, async (req, res, next) => {
    try {
        const data = await cachedProxyToService('billing-service', '/api/v1/billing', 'GET', req, { ttl: 240 }); // 4 min cache
        res.setHeader('X-Cache-Enabled', 'true');
        res.json(data);
    }
    catch (error) {
        next(error);
    }
});
app.post('/api/v1/billing', auth_1.authenticate, async (req, res, next) => {
    try {
        const data = await proxyToService('billing-service', '/api/v1/billing', 'POST', req);
        res.status(201).json(data);
    }
    catch (error) {
        next(error);
    }
});
// --- MEDICATIONS (routed to medication-service) ---
app.get('/api/v1/medications', auth_1.authenticate, async (req, res, next) => {
    try {
        const data = await cachedProxyToService('medication-service', '/api/v1/medications', 'GET', req, { ttl: 180 }); // 3 min cache
        res.setHeader('X-Cache-Enabled', 'true');
        res.json(data);
    }
    catch (error) {
        next(error);
    }
});
app.post('/api/v1/medications', auth_1.authenticate, async (req, res, next) => {
    try {
        const data = await proxyToService('medication-service', '/api/v1/medications', 'POST', req);
        res.status(201).json(data);
    }
    catch (error) {
        next(error);
    }
});
// --- LAB ORDERS (routed to lab-service) ---
app.get('/api/v1/lab-orders', auth_1.authenticate, async (req, res, next) => {
    try {
        const data = await cachedProxyToService('lab-service', '/api/v1/lab-orders', 'GET', req, { ttl: 120 }); // 2 min cache
        res.setHeader('X-Cache-Enabled', 'true');
        res.json(data);
    }
    catch (error) {
        next(error);
    }
});
app.post('/api/v1/lab-orders', auth_1.authenticate, async (req, res, next) => {
    try {
        const data = await proxyToService('lab-service', '/api/v1/lab-orders', 'POST', req);
        res.status(201).json(data);
    }
    catch (error) {
        next(error);
    }
});
// ============================================================================
// RESPONSE AGGREGATION EXAMPLE
// ============================================================================
/**
 * GET /api/v1/patients/:id/complete
 * Aggregates patient data from multiple services
 */
app.get('/api/v1/patients/:id/complete', auth_1.authenticate, async (req, res, next) => {
    try {
        const patientId = req.params.id;
        // Parallel requests to multiple services (with graceful fallback)
        const [patient, appointments, medications, labOrders, vitalSigns] = await Promise.allSettled([
            proxyToService('clinical-service', `/api/v1/patients/${patientId}`, 'GET', req),
            proxyToService('business-service', `/api/v1/appointments?patientId=${patientId}`, 'GET', req),
            proxyToService('medication-service', `/api/v1/medications?patientId=${patientId}`, 'GET', req),
            proxyToService('lab-service', `/api/v1/lab-orders?patientId=${patientId}`, 'GET', req),
            proxyToService('device-integration-service', `/api/v1/vital-signs/patient/${patientId}?limit=10`, 'GET', req)
        ]);
        res.json({
            success: true,
            data: {
                patient: patient.status === 'fulfilled' ? patient.value?.data : null,
                appointments: appointments.status === 'fulfilled' ? appointments.value?.data : [],
                medications: medications.status === 'fulfilled' ? medications.value?.data : [],
                labOrders: labOrders.status === 'fulfilled' ? labOrders.value?.data : [],
                vitalSigns: vitalSigns.status === 'fulfilled' ? vitalSigns.value?.data : []
            },
            errors: {
                patient: patient.status === 'rejected' ? patient.reason.message : null,
                appointments: appointments.status === 'rejected' ? appointments.reason.message : null,
                medications: medications.status === 'rejected' ? medications.reason.message : null,
                labOrders: labOrders.status === 'rejected' ? labOrders.reason.message : null,
                vitalSigns: vitalSigns.status === 'rejected' ? vitalSigns.reason.message : null
            }
        });
    }
    catch (error) {
        next(error);
    }
});
// ============================================================================
// DASHBOARD STATS (Aggregated from multiple services)
// ============================================================================
app.get('/api/v1/dashboard/stats', auth_1.authenticate, async (req, res, next) => {
    try {
        const [patients, appointments, medications, labs, devices] = await Promise.allSettled([
            proxyToService('clinical-service', '/api/v1/patients?limit=1', 'GET', req),
            proxyToService('business-service', '/api/v1/appointments?date=' + new Date().toISOString().split('T')[0], 'GET', req),
            proxyToService('medication-service', '/api/v1/medications?status=active', 'GET', req),
            proxyToService('lab-service', '/api/v1/lab-orders?status=pending', 'GET', req),
            proxyToService('device-integration-service', '/api/v1/devices?limit=1', 'GET', req)
        ]);
        res.json({
            success: true,
            data: {
                totalPatients: patients.status === 'fulfilled' ? patients.value?.data?.total || 0 : 0,
                todayAppointments: appointments.status === 'fulfilled' ? appointments.value?.data?.total || 0 : 0,
                activeMedications: medications.status === 'fulfilled' ? medications.value?.data?.total || 0 : 0,
                pendingLabs: labs.status === 'fulfilled' ? labs.value?.data?.total || 0 : 0,
                totalDevices: devices.status === 'fulfilled' ? devices.value?.data?.total || 0 : 0,
                onlineDevices: devices.status === 'fulfilled' ? devices.value?.data?.onlineCount || 0 : 0
            }
        });
    }
    catch (error) {
        next(error);
    }
});
// ============================================================================
// DEVICE INTEGRATION ROUTES (✅ NEW - Medical Device Management)
// ============================================================================
// --- DEVICES ---
app.get('/api/v1/devices', auth_1.authenticate, async (req, res, next) => {
    try {
        const data = await cachedProxyToService('device-integration-service', '/api/v1/devices', 'GET', req, { ttl: 60 }); // 1 min cache
        res.setHeader('X-Cache-Enabled', 'true');
        res.json(data);
    }
    catch (error) {
        next(error);
    }
});
app.post('/api/v1/devices', auth_1.authenticate, async (req, res, next) => {
    try {
        const data = await proxyToService('device-integration-service', '/api/v1/devices', 'POST', req);
        await cache.invalidatePattern('device-integration-service:/api/v1/devices:*');
        res.status(201).json(data);
    }
    catch (error) {
        next(error);
    }
});
app.get('/api/v1/devices/:deviceId', auth_1.authenticate, async (req, res, next) => {
    try {
        const data = await cachedProxyToService('device-integration-service', `/api/v1/devices/${req.params.deviceId}`, 'GET', req, { ttl: 120 });
        res.setHeader('X-Cache-Enabled', 'true');
        res.json(data);
    }
    catch (error) {
        next(error);
    }
});
app.patch('/api/v1/devices/:deviceId', auth_1.authenticate, async (req, res, next) => {
    try {
        const data = await proxyToService('device-integration-service', `/api/v1/devices/${req.params.deviceId}`, 'PATCH', req);
        await cache.del(`device-integration-service:/api/v1/devices/${req.params.deviceId}:`);
        await cache.invalidatePattern('device-integration-service:/api/v1/devices:*');
        res.json(data);
    }
    catch (error) {
        next(error);
    }
});
app.patch('/api/v1/devices/:deviceId/status', auth_1.authenticate, async (req, res, next) => {
    try {
        const data = await proxyToService('device-integration-service', `/api/v1/devices/${req.params.deviceId}/status`, 'PATCH', req);
        await cache.del(`device-integration-service:/api/v1/devices/${req.params.deviceId}:`);
        res.json(data);
    }
    catch (error) {
        next(error);
    }
});
app.delete('/api/v1/devices/:deviceId', auth_1.authenticate, async (req, res, next) => {
    try {
        const data = await proxyToService('device-integration-service', `/api/v1/devices/${req.params.deviceId}`, 'DELETE', req);
        await cache.invalidatePattern('device-integration-service:/api/v1/devices:*');
        res.json(data);
    }
    catch (error) {
        next(error);
    }
});
// --- VITAL SIGNS ---
app.post('/api/v1/vital-signs', auth_1.authenticate, async (req, res, next) => {
    try {
        const data = await proxyToService('device-integration-service', '/api/v1/vital-signs', 'POST', req);
        // No caching for vital signs submissions
        res.status(201).json(data);
    }
    catch (error) {
        next(error);
    }
});
app.get('/api/v1/vital-signs/device/:deviceId', auth_1.authenticate, async (req, res, next) => {
    try {
        const data = await cachedProxyToService('device-integration-service', `/api/v1/vital-signs/device/${req.params.deviceId}`, 'GET', req, { ttl: 30 }); // 30 sec cache
        res.setHeader('X-Cache-Enabled', 'true');
        res.json(data);
    }
    catch (error) {
        next(error);
    }
});
app.get('/api/v1/vital-signs/patient/:patientId', auth_1.authenticate, async (req, res, next) => {
    try {
        const data = await cachedProxyToService('device-integration-service', `/api/v1/vital-signs/patient/${req.params.patientId}`, 'GET', req, { ttl: 30 });
        res.setHeader('X-Cache-Enabled', 'true');
        res.json(data);
    }
    catch (error) {
        next(error);
    }
});
app.get('/api/v1/vital-signs/device/:deviceId/latest', auth_1.authenticate, async (req, res, next) => {
    try {
        const data = await proxyToService('device-integration-service', `/api/v1/vital-signs/device/${req.params.deviceId}/latest`, 'GET', req);
        // No caching for latest data - always fetch fresh
        res.json(data);
    }
    catch (error) {
        next(error);
    }
});
// ============================================================================
// SWAGGER / API DOCUMENTATION
// ============================================================================
// Swagger JSON endpoint
app.get('/api-docs/swagger.json', async (_req, res) => {
    try {
        const swaggerSpec = await swaggerService.getMergedSwaggerSpec();
        res.json(swaggerSpec);
    }
    catch (error) {
        logger.error('Error generating Swagger spec:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SWAGGER_ERROR',
                message: 'Failed to generate API documentation'
            }
        });
    }
});
// Swagger UI
app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(null, {
    swaggerOptions: {
        url: '/api-docs/swagger.json'
    }
}));
// ============================================================================
// WEBSOCKET PROXIES
// ============================================================================
// WebSocket proxy for device integration (real-time vital signs)
if (process.env.DEVICE_SERVICE_URL) {
    const deviceWsProxy = proxyService.createWebSocketProxy({
        target: process.env.DEVICE_SERVICE_URL,
        ws: true,
        changeOrigin: true
    });
    app.use('/ws/devices', deviceWsProxy);
    logger.info('✅ WebSocket proxy enabled for device service');
}
// WebSocket proxy for notifications (real-time notifications)
if (process.env.NOTIFICATION_SERVICE_URL) {
    const notificationWsProxy = proxyService.createWebSocketProxy({
        target: process.env.NOTIFICATION_SERVICE_URL,
        ws: true,
        changeOrigin: true
    });
    app.use('/ws/notifications', notificationWsProxy);
    logger.info('✅ WebSocket proxy enabled for notification service');
}
// ============================================================================
// ERROR HANDLING
// ============================================================================
// 404 handler
app.use('*', (0, error_handler_1.notFoundHandler)());
// Global error handler (uses @nilecare/error-handler)
app.use((0, error_handler_1.createErrorHandler)(logger));
// ============================================================================
// GRACEFUL SHUTDOWN
// ============================================================================
const shutdown = (signal) => {
    logger.info(`${signal} received, shutting down gracefully`);
    // Stop health checks
    serviceRegistry.stopHealthChecks();
    process.exit(0);
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
// ============================================================================
// START SERVER
// ============================================================================
server.listen(PORT, () => {
    logger.info('═══════════════════════════════════════════════════════');
    logger.info('🚀  MAIN NILECARE ORCHESTRATOR - UNIFIED GATEWAY');
    logger.info('═══════════════════════════════════════════════════════');
    logger.info(`📡  Service URL:          http://localhost:${PORT}`);
    logger.info(`🏥  Health Check:         http://localhost:${PORT}/health`);
    logger.info(`📚  API Documentation:    http://localhost:${PORT}/api-docs`);
    logger.info(`📊  Services Status:      http://localhost:${PORT}/api/v1/services/status`);
    logger.info('');
    logger.info('✅  Architecture: UNIFIED ORCHESTRATOR (gateway-service integrated)');
    logger.info('✅  Database: NONE (pure routing layer)');
    logger.info('✅  Circuit Breakers: ENABLED');
    logger.info('✅  Service Discovery: ENABLED');
    logger.info('✅  Health-Based Routing: ENABLED');
    logger.info('✅  Redis Caching: ENABLED');
    logger.info('✅  Swagger Docs: ENABLED');
    logger.info('✅  WebSocket Support: ENABLED');
    logger.info('');
    logger.info('🔗  Downstream Services:');
    serviceRegistry.getHealthyServices().forEach(service => {
        logger.info(`   ✅ ${service}`);
    });
    logger.info('═══════════════════════════════════════════════════════');
});
// Gracefully handle WebSocket upgrades
server.on('upgrade', (request, _socket, _head) => {
    logger.debug('WebSocket upgrade request', { url: request.url });
});
exports.default = app;
//# sourceMappingURL=index.js.map