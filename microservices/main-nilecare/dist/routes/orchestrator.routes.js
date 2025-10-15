"use strict";
/**
 * Orchestrator Routes
 * Central routing and aggregation for downstream microservices
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const axios_1 = __importDefault(require("axios"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// =================================================================
// SERVICE URLS (from environment or defaults)
// =================================================================
const BUSINESS_SERVICE_URL = process.env.BUSINESS_SERVICE_URL || 'http://localhost:7010';
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:7020';
const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://localhost:7030';
const APPOINTMENT_SERVICE_URL = process.env.APPOINTMENT_SERVICE_URL || 'http://localhost:7040';
// =================================================================
// HELPER FUNCTIONS
// =================================================================
/**
 * Forward request to downstream service
 */
async function forwardRequest(serviceUrl, path, method, req) {
    try {
        const headers = {
            'Content-Type': 'application/json',
        };
        // Forward JWT token
        if (req.headers.authorization) {
            headers['Authorization'] = req.headers.authorization;
        }
        const response = await (0, axios_1.default)({
            method,
            url: `${serviceUrl}${path}`,
            data: req.body,
            params: req.query,
            headers,
            timeout: 30000,
        });
        return response.data;
    }
    catch (error) {
        if (error.response) {
            // Service responded with error
            throw {
                status: error.response.status,
                data: error.response.data,
            };
        }
        else if (error.request) {
            // Service did not respond
            throw {
                status: 503,
                data: {
                    success: false,
                    error: {
                        code: 'SERVICE_UNAVAILABLE',
                        message: `Service at ${serviceUrl} is not responding`,
                    },
                },
            };
        }
        else {
            // Other error
            throw {
                status: 500,
                data: {
                    success: false,
                    error: {
                        code: 'GATEWAY_ERROR',
                        message: error.message,
                    },
                },
            };
        }
    }
}
/**
 * Error handler for orchestrator routes
 */
function handleOrchestrationError(error, res) {
    const status = error.status || 500;
    const data = error.data || {
        success: false,
        error: {
            code: 'ORCHESTRATION_ERROR',
            message: 'Failed to process request',
        },
    };
    res.status(status).json(data);
}
// =================================================================
// BUSINESS SERVICE ROUTES
// =================================================================
/**
 * GET /api/business/appointments
 * Get all appointments from business service
 */
router.get('/business/appointments', auth_1.authenticate, async (req, res) => {
    try {
        const data = await forwardRequest(BUSINESS_SERVICE_URL, '/api/v1/appointments', 'GET', req);
        res.json(data);
    }
    catch (error) {
        handleOrchestrationError(error, res);
    }
});
/**
 * POST /api/business/appointments
 * Create appointment via business service
 */
router.post('/business/appointments', auth_1.authenticate, async (req, res) => {
    try {
        const data = await forwardRequest(BUSINESS_SERVICE_URL, '/api/v1/appointments', 'POST', req);
        res.status(201).json(data);
    }
    catch (error) {
        handleOrchestrationError(error, res);
    }
});
/**
 * GET /api/business/billing
 * Get billing information from business service
 */
router.get('/business/billing', auth_1.authenticate, async (req, res) => {
    try {
        const data = await forwardRequest(BUSINESS_SERVICE_URL, '/api/v1/billing', 'GET', req);
        res.json(data);
    }
    catch (error) {
        handleOrchestrationError(error, res);
    }
});
/**
 * POST /api/business/billing
 * Create invoice via business service
 */
router.post('/business/billing', auth_1.authenticate, async (req, res) => {
    try {
        const data = await forwardRequest(BUSINESS_SERVICE_URL, '/api/v1/billing', 'POST', req);
        res.status(201).json(data);
    }
    catch (error) {
        handleOrchestrationError(error, res);
    }
});
/**
 * GET /api/business/staff
 * Get staff information from business service
 */
router.get('/business/staff', auth_1.authenticate, async (req, res) => {
    try {
        const data = await forwardRequest(BUSINESS_SERVICE_URL, '/api/v1/staff', 'GET', req);
        res.json(data);
    }
    catch (error) {
        handleOrchestrationError(error, res);
    }
});
/**
 * GET /api/business/scheduling
 * Get scheduling information from business service
 */
router.get('/business/scheduling', auth_1.authenticate, async (req, res) => {
    try {
        const data = await forwardRequest(BUSINESS_SERVICE_URL, '/api/v1/scheduling', 'GET', req);
        res.json(data);
    }
    catch (error) {
        handleOrchestrationError(error, res);
    }
});
/**
 * GET /api/business/health
 * Health check for business service
 */
router.get('/business/health', async (req, res) => {
    try {
        const data = await forwardRequest(BUSINESS_SERVICE_URL, '/health', 'GET', req);
        res.json(data);
    }
    catch (error) {
        handleOrchestrationError(error, res);
    }
});
// =================================================================
// AUTH SERVICE ROUTES (v1)
// =================================================================
/**
 * POST /api/v1/auth/login
 * User login via auth service
 */
router.post('/v1/auth/login', async (req, res) => {
    try {
        const data = await forwardRequest(AUTH_SERVICE_URL, '/api/v1/auth/login', 'POST', req);
        res.json(data);
    }
    catch (error) {
        handleOrchestrationError(error, res);
    }
});
/**
 * POST /api/v1/auth/register
 * User registration via auth service
 */
router.post('/v1/auth/register', async (req, res) => {
    try {
        const data = await forwardRequest(AUTH_SERVICE_URL, '/api/v1/auth/register', 'POST', req);
        res.status(201).json(data);
    }
    catch (error) {
        handleOrchestrationError(error, res);
    }
});
/**
 * POST /api/auth/refresh
 * Refresh JWT token
 */
router.post('/v1/auth/refresh', async (req, res) => {
    try {
        const data = await forwardRequest(AUTH_SERVICE_URL, '/api/v1/auth/refresh', 'POST', req);
        res.json(data);
    }
    catch (error) {
        handleOrchestrationError(error, res);
    }
});
/**
 * POST /api/auth/logout
 * User logout
 */
router.post('/v1/auth/logout', auth_1.authenticate, async (req, res) => {
    try {
        const data = await forwardRequest(AUTH_SERVICE_URL, '/api/v1/auth/logout', 'POST', req);
        res.json(data);
    }
    catch (error) {
        handleOrchestrationError(error, res);
    }
});
/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/v1/auth/me', auth_1.authenticate, async (req, res) => {
    try {
        const data = await forwardRequest(AUTH_SERVICE_URL, '/api/v1/auth/me', 'GET', req);
        res.json(data);
    }
    catch (error) {
        handleOrchestrationError(error, res);
    }
});
// =================================================================
// APPOINTMENT SERVICE ROUTES
// =================================================================
/**
 * GET /api/appointment/appointments
 * Get all appointments from appointment service
 */
router.get('/appointment/appointments', auth_1.authenticate, async (req, res) => {
    try {
        // Route to Business Service since appointments are handled there
        const data = await forwardRequest(BUSINESS_SERVICE_URL, '/api/v1/appointments', 'GET', req);
        res.json(data);
    }
    catch (error) {
        handleOrchestrationError(error, res);
    }
});
/**
 * GET /api/appointment/appointments/today
 * Get today's appointments
 */
router.get('/appointment/appointments/today', auth_1.authenticate, async (req, res) => {
    try {
        const data = await forwardRequest(BUSINESS_SERVICE_URL, // Using Business Service for appointments
        '/api/v1/appointments/today', 'GET', req);
        res.json(data);
    }
    catch (error) {
        handleOrchestrationError(error, res);
    }
});
/**
 * GET /api/appointment/appointments/stats
 * Get appointment statistics
 */
router.get('/appointment/appointments/stats', auth_1.authenticate, async (req, res) => {
    try {
        const data = await forwardRequest(BUSINESS_SERVICE_URL, // Using Business Service for appointments
        '/api/v1/appointments/stats', 'GET', req);
        res.json(data);
    }
    catch (error) {
        handleOrchestrationError(error, res);
    }
});
/**
 * GET /api/appointment/appointments/:id
 * Get appointment by ID
 */
router.get('/appointment/appointments/:id', auth_1.authenticate, async (req, res) => {
    try {
        const data = await forwardRequest(BUSINESS_SERVICE_URL, // Using Business Service for appointments
        `/api/v1/appointments/${req.params.id}`, 'GET', req);
        res.json(data);
    }
    catch (error) {
        handleOrchestrationError(error, res);
    }
});
/**
 * POST /api/appointment/appointments
 * Create new appointment
 */
router.post('/appointment/appointments', auth_1.authenticate, async (req, res) => {
    try {
        const data = await forwardRequest(BUSINESS_SERVICE_URL, // Using Business Service for appointments
        '/api/v1/appointments', 'POST', req);
        res.status(201).json(data);
    }
    catch (error) {
        handleOrchestrationError(error, res);
    }
});
/**
 * PUT /api/appointment/appointments/:id
 * Update appointment
 */
router.put('/appointment/appointments/:id', auth_1.authenticate, async (req, res) => {
    try {
        const data = await forwardRequest(BUSINESS_SERVICE_URL, // Using Business Service for appointments
        `/api/v1/appointments/${req.params.id}`, 'PUT', req);
        res.json(data);
    }
    catch (error) {
        handleOrchestrationError(error, res);
    }
});
/**
 * PATCH /api/appointment/appointments/:id/status
 * Update appointment status
 */
router.patch('/appointment/appointments/:id/status', auth_1.authenticate, async (req, res) => {
    try {
        const data = await forwardRequest(BUSINESS_SERVICE_URL, // Using Business Service for appointments
        `/api/v1/appointments/${req.params.id}/status`, 'PATCH', req);
        res.json(data);
    }
    catch (error) {
        handleOrchestrationError(error, res);
    }
});
/**
 * PATCH /api/appointment/appointments/:id/confirm
 * Confirm appointment
 */
router.patch('/appointment/appointments/:id/confirm', auth_1.authenticate, async (req, res) => {
    try {
        const data = await forwardRequest(BUSINESS_SERVICE_URL, // Using Business Service for appointments
        `/api/v1/appointments/${req.params.id}/confirm`, 'PATCH', req);
        res.json(data);
    }
    catch (error) {
        handleOrchestrationError(error, res);
    }
});
/**
 * PATCH /api/appointment/appointments/:id/complete
 * Complete appointment
 */
router.patch('/appointment/appointments/:id/complete', auth_1.authenticate, async (req, res) => {
    try {
        const data = await forwardRequest(BUSINESS_SERVICE_URL, // Using Business Service for appointments
        `/api/v1/appointments/${req.params.id}/complete`, 'PATCH', req);
        res.json(data);
    }
    catch (error) {
        handleOrchestrationError(error, res);
    }
});
/**
 * DELETE /api/appointment/appointments/:id
 * Cancel appointment
 */
router.delete('/appointment/appointments/:id', auth_1.authenticate, async (req, res) => {
    try {
        const data = await forwardRequest(BUSINESS_SERVICE_URL, // Using Business Service for appointments
        `/api/v1/appointments/${req.params.id}`, 'DELETE', req);
        res.json(data);
    }
    catch (error) {
        handleOrchestrationError(error, res);
    }
});
/**
 * GET /api/appointment/schedules/provider/:providerId
 * Get provider schedule
 */
router.get('/appointment/schedules/provider/:providerId', auth_1.authenticate, async (req, res) => {
    try {
        const data = await forwardRequest(BUSINESS_SERVICE_URL, // Using Business Service for appointments
        `/api/v1/schedules/provider/${req.params.providerId}`, 'GET', req);
        res.json(data);
    }
    catch (error) {
        handleOrchestrationError(error, res);
    }
});
/**
 * GET /api/appointment/schedules/available-slots
 * Get available time slots
 */
router.get('/appointment/schedules/available-slots', auth_1.authenticate, async (req, res) => {
    try {
        const data = await forwardRequest(BUSINESS_SERVICE_URL, // Using Business Service for appointments
        '/api/v1/schedules/available-slots', 'GET', req);
        res.json(data);
    }
    catch (error) {
        handleOrchestrationError(error, res);
    }
});
/**
 * GET /api/appointment/resources
 * Get all resources
 */
router.get('/appointment/resources', auth_1.authenticate, async (req, res) => {
    try {
        const data = await forwardRequest(BUSINESS_SERVICE_URL, // Using Business Service for appointments
        '/api/v1/resources', 'GET', req);
        res.json(data);
    }
    catch (error) {
        handleOrchestrationError(error, res);
    }
});
/**
 * GET /api/appointment/resources/:id/availability
 * Check resource availability
 */
router.get('/appointment/resources/:id/availability', auth_1.authenticate, async (req, res) => {
    try {
        const data = await forwardRequest(BUSINESS_SERVICE_URL, // Using Business Service for appointments
        `/api/v1/resources/${req.params.id}/availability`, 'GET', req);
        res.json(data);
    }
    catch (error) {
        handleOrchestrationError(error, res);
    }
});
/**
 * GET /api/appointment/waitlist
 * Get waitlist entries
 */
router.get('/appointment/waitlist', auth_1.authenticate, async (req, res) => {
    try {
        const data = await forwardRequest(BUSINESS_SERVICE_URL, // Using Business Service for appointments
        '/api/v1/waitlist', 'GET', req);
        res.json(data);
    }
    catch (error) {
        handleOrchestrationError(error, res);
    }
});
/**
 * POST /api/appointment/waitlist
 * Add patient to waitlist
 */
router.post('/appointment/waitlist', auth_1.authenticate, async (req, res) => {
    try {
        const data = await forwardRequest(BUSINESS_SERVICE_URL, // Using Business Service for appointments
        '/api/v1/waitlist', 'POST', req);
        res.status(201).json(data);
    }
    catch (error) {
        handleOrchestrationError(error, res);
    }
});
/**
 * PATCH /api/appointment/waitlist/:id/contacted
 * Mark waitlist entry as contacted
 */
router.patch('/appointment/waitlist/:id/contacted', auth_1.authenticate, async (req, res) => {
    try {
        const data = await forwardRequest(BUSINESS_SERVICE_URL, // Using Business Service for appointments
        `/api/v1/waitlist/${req.params.id}/contacted`, 'PATCH', req);
        res.json(data);
    }
    catch (error) {
        handleOrchestrationError(error, res);
    }
});
/**
 * DELETE /api/appointment/waitlist/:id
 * Remove from waitlist
 */
router.delete('/appointment/waitlist/:id', auth_1.authenticate, async (req, res) => {
    try {
        const data = await forwardRequest(BUSINESS_SERVICE_URL, // Using Business Service for appointments
        `/api/v1/waitlist/${req.params.id}`, 'DELETE', req);
        res.json(data);
    }
    catch (error) {
        handleOrchestrationError(error, res);
    }
});
/**
 * GET /api/appointment/reminders/pending
 * Get pending reminders
 */
router.get('/appointment/reminders/pending', auth_1.authenticate, async (req, res) => {
    try {
        const data = await forwardRequest(BUSINESS_SERVICE_URL, // Using Business Service for appointments
        '/api/v1/reminders/pending', 'GET', req);
        res.json(data);
    }
    catch (error) {
        handleOrchestrationError(error, res);
    }
});
/**
 * POST /api/appointment/reminders/process
 * Process pending reminders
 */
router.post('/appointment/reminders/process', auth_1.authenticate, async (req, res) => {
    try {
        const data = await forwardRequest(BUSINESS_SERVICE_URL, // Using Business Service for appointments
        '/api/v1/reminders/process', 'POST', req);
        res.json(data);
    }
    catch (error) {
        handleOrchestrationError(error, res);
    }
});
/**
 * POST /api/appointment/reminders/appointment/:appointmentId
 * Schedule reminders for appointment
 */
router.post('/appointment/reminders/appointment/:appointmentId', auth_1.authenticate, async (req, res) => {
    try {
        const data = await forwardRequest(BUSINESS_SERVICE_URL, // Using Business Service for appointments
        `/api/v1/reminders/appointment/${req.params.appointmentId}`, 'POST', req);
        res.status(201).json(data);
    }
    catch (error) {
        handleOrchestrationError(error, res);
    }
});
/**
 * GET /api/appointment/health
 * Health check for appointment service
 */
router.get('/appointment/health', async (req, res) => {
    try {
        const data = await forwardRequest(BUSINESS_SERVICE_URL, // Using Business Service for appointments
        '/health', 'GET', req);
        res.json(data);
    }
    catch (error) {
        handleOrchestrationError(error, res);
    }
});
// =================================================================
// PAYMENT SERVICE ROUTES
// =================================================================
/**
 * GET /api/payment/payments
 * Get all payments
 */
router.get('/payment/payments', auth_1.authenticate, async (req, res) => {
    try {
        const data = await forwardRequest(PAYMENT_SERVICE_URL, '/api/v1/payments', 'GET', req);
        res.json(data);
    }
    catch (error) {
        handleOrchestrationError(error, res);
    }
});
/**
 * POST /api/payment/payments
 * Create payment
 */
router.post('/payment/payments', auth_1.authenticate, async (req, res) => {
    try {
        const data = await forwardRequest(PAYMENT_SERVICE_URL, '/api/v1/payments', 'POST', req);
        res.status(201).json(data);
    }
    catch (error) {
        handleOrchestrationError(error, res);
    }
});
/**
 * POST /api/payment/process
 * Process payment
 */
router.post('/payment/process', auth_1.authenticate, async (req, res) => {
    try {
        const data = await forwardRequest(PAYMENT_SERVICE_URL, '/api/v1/payments/process', 'POST', req);
        res.json(data);
    }
    catch (error) {
        handleOrchestrationError(error, res);
    }
});
/**
 * GET /api/payment/gateways
 * Get available payment gateways
 */
router.get('/payment/gateways', auth_1.authenticate, async (req, res) => {
    try {
        const data = await forwardRequest(PAYMENT_SERVICE_URL, '/api/v1/gateways', 'GET', req);
        res.json(data);
    }
    catch (error) {
        handleOrchestrationError(error, res);
    }
});
// =================================================================
// AGGREGATE ROUTES (Combine multiple services)
// =================================================================
/**
 * GET /api/aggregate/dashboard
 * Aggregate data from multiple services for dashboard
 */
router.get('/aggregate/dashboard', auth_1.authenticate, async (req, res) => {
    try {
        const [appointments, billing, payments] = await Promise.allSettled([
            forwardRequest(BUSINESS_SERVICE_URL, '/api/v1/appointments', 'GET', req),
            forwardRequest(BUSINESS_SERVICE_URL, '/api/v1/billing', 'GET', req),
            forwardRequest(PAYMENT_SERVICE_URL, '/api/v1/payments', 'GET', req),
        ]);
        res.json({
            success: true,
            data: {
                appointments: appointments.status === 'fulfilled' ? appointments.value : null,
                billing: billing.status === 'fulfilled' ? billing.value : null,
                payments: payments.status === 'fulfilled' ? payments.value : null,
            },
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: {
                code: 'AGGREGATION_ERROR',
                message: 'Failed to aggregate dashboard data',
            },
        });
    }
});
/**
 * GET /api/aggregate/patient/:patientId
 * Aggregate patient data from multiple services
 */
router.get('/aggregate/patient/:patientId', auth_1.authenticate, async (req, res) => {
    try {
        const { patientId } = req.params;
        const [appointments, billing, payments] = await Promise.allSettled([
            forwardRequest(BUSINESS_SERVICE_URL, `/api/v1/appointments?patientId=${patientId}`, 'GET', req),
            forwardRequest(BUSINESS_SERVICE_URL, `/api/v1/billing?patientId=${patientId}`, 'GET', req),
            forwardRequest(PAYMENT_SERVICE_URL, `/api/v1/payments?patientId=${patientId}`, 'GET', req),
        ]);
        res.json({
            success: true,
            data: {
                patientId,
                appointments: appointments.status === 'fulfilled' ? appointments.value : null,
                billing: billing.status === 'fulfilled' ? billing.value : null,
                payments: payments.status === 'fulfilled' ? payments.value : null,
            },
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: {
                code: 'AGGREGATION_ERROR',
                message: 'Failed to aggregate patient data',
            },
        });
    }
});
// =================================================================
// SERVICE HEALTH AGGREGATION
// =================================================================
/**
 * GET /api/health/all
 * Check health of all downstream services
 */
router.get('/health/all', async (req, res) => {
    const services = [
        { name: 'business', url: BUSINESS_SERVICE_URL },
        { name: 'auth', url: AUTH_SERVICE_URL },
        { name: 'payment', url: PAYMENT_SERVICE_URL },
        { name: 'appointment', url: APPOINTMENT_SERVICE_URL },
    ];
    const healthChecks = await Promise.allSettled(services.map(async (service) => {
        try {
            const response = await axios_1.default.get(`${service.url}/health`, { timeout: 5000 });
            return {
                name: service.name,
                status: 'healthy',
                url: service.url,
                data: response.data,
            };
        }
        catch (error) {
            return {
                name: service.name,
                status: 'unhealthy',
                url: service.url,
                error: 'Service not responding',
            };
        }
    }));
    const results = healthChecks.map((result) => result.status === 'fulfilled' ? result.value : result.reason);
    const allHealthy = results.every((r) => r.status === 'healthy');
    res.status(allHealthy ? 200 : 503).json({
        success: allHealthy,
        services: results,
        timestamp: new Date().toISOString(),
    });
});
exports.default = router;
//# sourceMappingURL=orchestrator.routes.js.map