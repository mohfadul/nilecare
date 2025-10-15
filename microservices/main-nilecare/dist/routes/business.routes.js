"use strict";
/**
 * Business Service Proxy Routes
 * Proxies requests to the Business microservice
 *
 * Base Route: /api/business
 * Target Service: Business Service (port 3005)
 *
 * Features:
 * - Appointments management
 * - Billing and invoicing
 * - Staff management
 * - Scheduling
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const axios_1 = __importDefault(require("axios"));
const winston_1 = __importDefault(require("winston"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Initialize logger
const logger = winston_1.default.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.json()),
    transports: [
        new winston_1.default.transports.Console(),
        new winston_1.default.transports.File({ filename: 'logs/business-proxy.log' })
    ],
    defaultMeta: { service: 'business-proxy' }
});
// Business service URL from environment
const BUSINESS_SERVICE_URL = process.env.BUSINESS_SERVICE_URL || 'http://localhost:3005';
// Log service configuration on startup
logger.info('Business service proxy initialized', {
    targetUrl: BUSINESS_SERVICE_URL
});
// =================================================================
// MIDDLEWARE
// =================================================================
// All business routes require authentication
router.use(auth_1.authenticate);
// Request logging middleware
router.use((req, _res, next) => {
    logger.info('Business service request', {
        method: req.method,
        path: req.path,
        query: req.query,
        userId: req.user?.userId
    });
    next();
});
// =================================================================
// PROXY HELPER FUNCTION
// =================================================================
/**
 * Generic proxy handler for business service requests
 */
async function proxyToBusinessService(req, res, targetPath, method = 'GET') {
    try {
        const startTime = Date.now();
        // Forward the request to business service
        const response = await (0, axios_1.default)({
            method,
            url: `${BUSINESS_SERVICE_URL}${targetPath}`,
            data: req.body,
            params: req.query,
            headers: {
                Authorization: req.headers.authorization,
                'Content-Type': 'application/json',
            },
            timeout: 30000,
        });
        const duration = Date.now() - startTime;
        logger.info('Business service response', {
            method,
            path: targetPath,
            status: response.status,
            duration: `${duration}ms`
        });
        res.status(response.status).json(response.data);
    }
    catch (error) {
        handleProxyError(error, res, targetPath);
    }
}
/**
 * Error handler for proxy requests
 */
function handleProxyError(error, res, targetPath) {
    if (axios_1.default.isAxiosError(error)) {
        const status = error.response?.status || 503;
        const errorData = error.response?.data || {
            success: false,
            error: {
                code: 'SERVICE_UNAVAILABLE',
                message: 'Business service is currently unavailable',
                details: error.message
            }
        };
        logger.error('Business service error', {
            path: targetPath,
            status,
            error: error.message,
            response: error.response?.data
        });
        res.status(status).json(errorData);
    }
    else {
        logger.error('Unexpected error in business proxy', {
            path: targetPath,
            error: error.message,
            stack: error.stack
        });
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An unexpected error occurred',
                details: error.message
            }
        });
    }
}
// =================================================================
// HEALTH CHECK
// =================================================================
/**
 * GET /api/business/health
 * Check business service health
 */
router.get('/health', async (req, res) => {
    await proxyToBusinessService(req, res, '/health', 'GET');
});
// =================================================================
// APPOINTMENTS API
// =================================================================
/**
 * GET /api/business/appointments
 * List all appointments with filters
 */
router.get('/appointments', async (req, res) => {
    await proxyToBusinessService(req, res, '/api/v1/appointments', 'GET');
});
/**
 * GET /api/business/appointments/:id
 * Get appointment by ID
 */
router.get('/appointments/:id', async (req, res) => {
    await proxyToBusinessService(req, res, `/api/v1/appointments/${req.params.id}`, 'GET');
});
/**
 * POST /api/business/appointments
 * Create new appointment
 */
router.post('/appointments', async (req, res) => {
    await proxyToBusinessService(req, res, '/api/v1/appointments', 'POST');
});
/**
 * PUT /api/business/appointments/:id
 * Update appointment
 */
router.put('/appointments/:id', async (req, res) => {
    await proxyToBusinessService(req, res, `/api/v1/appointments/${req.params.id}`, 'PUT');
});
/**
 * DELETE /api/business/appointments/:id
 * Cancel appointment
 */
router.delete('/appointments/:id', async (req, res) => {
    await proxyToBusinessService(req, res, `/api/v1/appointments/${req.params.id}`, 'DELETE');
});
/**
 * PATCH /api/business/appointments/:id/confirm
 * Confirm appointment
 */
router.patch('/appointments/:id/confirm', async (req, res) => {
    await proxyToBusinessService(req, res, `/api/v1/appointments/${req.params.id}/confirm`, 'PATCH');
});
/**
 * PATCH /api/business/appointments/:id/complete
 * Complete appointment
 */
router.patch('/appointments/:id/complete', async (req, res) => {
    await proxyToBusinessService(req, res, `/api/v1/appointments/${req.params.id}/complete`, 'PATCH');
});
/**
 * PATCH /api/business/appointments/:id/cancel
 * Cancel appointment (alternative to DELETE)
 */
router.patch('/appointments/:id/cancel', async (req, res) => {
    await proxyToBusinessService(req, res, `/api/v1/appointments/${req.params.id}/cancel`, 'PATCH');
});
/**
 * GET /api/business/appointments/availability
 * Check provider availability
 */
router.get('/appointments/availability', async (req, res) => {
    await proxyToBusinessService(req, res, '/api/v1/appointments/availability', 'GET');
});
// =================================================================
// BILLING API
// =================================================================
/**
 * GET /api/business/billing
 * List billing records with filters
 */
router.get('/billing', async (req, res) => {
    await proxyToBusinessService(req, res, '/api/v1/billing', 'GET');
});
/**
 * GET /api/business/billing/:id
 * Get billing record by ID
 */
router.get('/billing/:id', async (req, res) => {
    await proxyToBusinessService(req, res, `/api/v1/billing/${req.params.id}`, 'GET');
});
/**
 * POST /api/business/billing
 * Create new billing record/invoice
 */
router.post('/billing', async (req, res) => {
    await proxyToBusinessService(req, res, '/api/v1/billing', 'POST');
});
/**
 * PUT /api/business/billing/:id
 * Update billing record
 */
router.put('/billing/:id', async (req, res) => {
    await proxyToBusinessService(req, res, `/api/v1/billing/${req.params.id}`, 'PUT');
});
/**
 * PATCH /api/business/billing/:id/pay
 * Mark billing as paid
 */
router.patch('/billing/:id/pay', async (req, res) => {
    await proxyToBusinessService(req, res, `/api/v1/billing/${req.params.id}/pay`, 'PATCH');
});
/**
 * PATCH /api/business/billing/:id/cancel
 * Cancel billing
 */
router.patch('/billing/:id/cancel', async (req, res) => {
    await proxyToBusinessService(req, res, `/api/v1/billing/${req.params.id}/cancel`, 'PATCH');
});
/**
 * GET /api/business/billing/patient/:patientId
 * Get patient billing history
 */
router.get('/billing/patient/:patientId', async (req, res) => {
    await proxyToBusinessService(req, res, `/api/v1/billing/patient/${req.params.patientId}`, 'GET');
});
// =================================================================
// SCHEDULING API
// =================================================================
/**
 * GET /api/business/scheduling
 * List schedules with filters
 */
router.get('/scheduling', async (req, res) => {
    await proxyToBusinessService(req, res, '/api/v1/scheduling', 'GET');
});
/**
 * GET /api/business/scheduling/:id
 * Get schedule by ID
 */
router.get('/scheduling/:id', async (req, res) => {
    await proxyToBusinessService(req, res, `/api/v1/scheduling/${req.params.id}`, 'GET');
});
/**
 * POST /api/business/scheduling
 * Create new schedule
 */
router.post('/scheduling', async (req, res) => {
    await proxyToBusinessService(req, res, '/api/v1/scheduling', 'POST');
});
/**
 * PUT /api/business/scheduling/:id
 * Update schedule
 */
router.put('/scheduling/:id', async (req, res) => {
    await proxyToBusinessService(req, res, `/api/v1/scheduling/${req.params.id}`, 'PUT');
});
/**
 * DELETE /api/business/scheduling/:id
 * Cancel schedule
 */
router.delete('/scheduling/:id', async (req, res) => {
    await proxyToBusinessService(req, res, `/api/v1/scheduling/${req.params.id}`, 'DELETE');
});
/**
 * GET /api/business/scheduling/staff/:staffId
 * Get staff schedule
 */
router.get('/scheduling/staff/:staffId', async (req, res) => {
    await proxyToBusinessService(req, res, `/api/v1/scheduling/staff/${req.params.staffId}`, 'GET');
});
/**
 * GET /api/business/scheduling/slots
 * Get available time slots
 */
router.get('/scheduling/slots', async (req, res) => {
    await proxyToBusinessService(req, res, '/api/v1/scheduling/slots', 'GET');
});
// =================================================================
// STAFF API
// =================================================================
/**
 * GET /api/business/staff
 * List staff members with filters
 */
router.get('/staff', async (req, res) => {
    await proxyToBusinessService(req, res, '/api/v1/staff', 'GET');
});
/**
 * GET /api/business/staff/:id
 * Get staff member by ID
 */
router.get('/staff/:id', async (req, res) => {
    await proxyToBusinessService(req, res, `/api/v1/staff/${req.params.id}`, 'GET');
});
/**
 * POST /api/business/staff
 * Create new staff member
 */
router.post('/staff', async (req, res) => {
    await proxyToBusinessService(req, res, '/api/v1/staff', 'POST');
});
/**
 * PUT /api/business/staff/:id
 * Update staff member
 */
router.put('/staff/:id', async (req, res) => {
    await proxyToBusinessService(req, res, `/api/v1/staff/${req.params.id}`, 'PUT');
});
/**
 * DELETE /api/business/staff/:id
 * Terminate staff member
 */
router.delete('/staff/:id', async (req, res) => {
    await proxyToBusinessService(req, res, `/api/v1/staff/${req.params.id}`, 'DELETE');
});
/**
 * GET /api/business/staff/role/:role
 * Get staff by role
 */
router.get('/staff/role/:role', async (req, res) => {
    await proxyToBusinessService(req, res, `/api/v1/staff/role/${req.params.role}`, 'GET');
});
/**
 * GET /api/business/staff/department/:department
 * Get staff by department
 */
router.get('/staff/department/:department', async (req, res) => {
    await proxyToBusinessService(req, res, `/api/v1/staff/department/${req.params.department}`, 'GET');
});
// =================================================================
// SUMMARY/DASHBOARD ENDPOINT
// =================================================================
/**
 * GET /api/business/summary
 * Get business service summary for dashboard
 */
router.get('/summary', async (req, res) => {
    try {
        logger.info('Fetching business summary');
        // Fetch all data in parallel
        const [appointmentsRes, billingRes, staffRes, healthRes] = await Promise.allSettled([
            axios_1.default.get(`${BUSINESS_SERVICE_URL}/api/v1/appointments`, {
                params: { limit: 10 },
                headers: { Authorization: req.headers.authorization },
                timeout: 10000,
            }),
            axios_1.default.get(`${BUSINESS_SERVICE_URL}/api/v1/billing`, {
                params: { limit: 10 },
                headers: { Authorization: req.headers.authorization },
                timeout: 10000,
            }),
            axios_1.default.get(`${BUSINESS_SERVICE_URL}/api/v1/staff`, {
                params: { limit: 10 },
                headers: { Authorization: req.headers.authorization },
                timeout: 10000,
            }),
            axios_1.default.get(`${BUSINESS_SERVICE_URL}/health`, { timeout: 5000 }),
        ]);
        const summary = {
            success: true,
            data: {
                health: healthRes.status === 'fulfilled' ? healthRes.value.data : { status: 'unhealthy' },
                appointments: appointmentsRes.status === 'fulfilled' ? appointmentsRes.value.data : { error: 'Failed to fetch' },
                billing: billingRes.status === 'fulfilled' ? billingRes.value.data : { error: 'Failed to fetch' },
                staff: staffRes.status === 'fulfilled' ? staffRes.value.data : { error: 'Failed to fetch' },
                timestamp: new Date().toISOString(),
            }
        };
        logger.info('Business summary fetched successfully');
        res.json(summary);
    }
    catch (error) {
        logger.error('Error fetching business summary', { error: error.message });
        res.status(500).json({
            success: false,
            error: {
                code: 'SUMMARY_ERROR',
                message: 'Failed to fetch business summary',
                details: error.message
            }
        });
    }
});
// =================================================================
// STATISTICS ENDPOINT
// =================================================================
/**
 * GET /api/business/stats
 * Get business statistics
 */
router.get('/stats', async (req, res) => {
    try {
        logger.info('Fetching business statistics');
        const [appointmentsRes, billingRes, staffRes] = await Promise.allSettled([
            axios_1.default.get(`${BUSINESS_SERVICE_URL}/api/v1/appointments`, {
                headers: { Authorization: req.headers.authorization },
                timeout: 10000,
            }),
            axios_1.default.get(`${BUSINESS_SERVICE_URL}/api/v1/billing`, {
                headers: { Authorization: req.headers.authorization },
                timeout: 10000,
            }),
            axios_1.default.get(`${BUSINESS_SERVICE_URL}/api/v1/staff`, {
                headers: { Authorization: req.headers.authorization },
                timeout: 10000,
            }),
        ]);
        const stats = {
            success: true,
            data: {
                appointments: {
                    total: appointmentsRes.status === 'fulfilled' ? appointmentsRes.value.data?.data?.pagination?.total || 0 : 0,
                    recent: appointmentsRes.status === 'fulfilled' ? appointmentsRes.value.data?.data?.appointments?.length || 0 : 0,
                },
                billing: {
                    total: billingRes.status === 'fulfilled' ? billingRes.value.data?.data?.pagination?.total || 0 : 0,
                    recent: billingRes.status === 'fulfilled' ? billingRes.value.data?.data?.billings?.length || 0 : 0,
                },
                staff: {
                    total: staffRes.status === 'fulfilled' ? staffRes.value.data?.data?.pagination?.total || 0 : 0,
                    recent: staffRes.status === 'fulfilled' ? staffRes.value.data?.data?.staff?.length || 0 : 0,
                },
                timestamp: new Date().toISOString(),
            }
        };
        logger.info('Business statistics fetched successfully', { stats: stats.data });
        res.json(stats);
    }
    catch (error) {
        logger.error('Error fetching business statistics', { error: error.message });
        res.status(500).json({
            success: false,
            error: {
                code: 'STATS_ERROR',
                message: 'Failed to fetch business statistics',
                details: error.message
            }
        });
    }
});
exports.default = router;
//# sourceMappingURL=business.routes.js.map