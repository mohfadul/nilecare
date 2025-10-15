"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = exports.server = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const compression_1 = __importDefault(require("compression"));
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const node_cron_1 = __importDefault(require("node-cron"));
const appointments_1 = __importDefault(require("./routes/appointments"));
const schedules_1 = __importDefault(require("./routes/schedules"));
const resources_1 = __importDefault(require("./routes/resources"));
const waitlist_1 = __importDefault(require("./routes/waitlist"));
const reminders_1 = __importDefault(require("./routes/reminders"));
const errorHandler_1 = require("./middleware/errorHandler");
const logger_1 = require("./middleware/logger");
const auth_1 = require("./middleware/auth");
const AppointmentService_1 = require("./services/AppointmentService");
const ReminderService_1 = require("./services/ReminderService");
dotenv_1.default.config();
const REQUIRED_ENV_VARS = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
function validateEnvironment() {
    const missing = REQUIRED_ENV_VARS.filter(k => !process.env[k]);
    if (missing.length > 0) {
        console.error('Missing required environment variables:', missing);
        throw new Error(`Missing env vars: ${missing.join(', ')}`);
    }
}
validateEnvironment();
let appInitialized = false;
const serviceStartTime = Date.now();
const app = (0, express_1.default)();
exports.app = app;
const server = (0, http_1.createServer)(app);
exports.server = server;
const io = new socket_io_1.Server(server, {
    cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
        methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
});
exports.io = io;
const PORT = process.env.PORT || 5002;
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true
}));
app.use((0, compression_1.default)());
app.use((0, morgan_1.default)('combined'));
app.use(limiter);
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use(logger_1.requestLogger);
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'NileCare Appointment Service API',
            version: '1.0.0',
            description: 'Appointment scheduling and calendar management service',
        },
        servers: [
            {
                url: `http://localhost:${PORT}`,
                description: 'Development server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
    },
    apis: ['./src/routes/*.ts', './src/models/*.ts'],
};
const specs = (0, swagger_jsdoc_1.default)(swaggerOptions);
app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(specs));
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        service: 'appointment-service',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
    app.get('/health/ready', async (req, res) => {
        try {
            if (typeof dbPool !== 'undefined' && dbPool) {
                await dbPool.query('SELECT 1');
            }
            res.status(200).json({ status: 'ready', timestamp: new Date().toISOString() });
        }
        catch (error) {
            res.status(503).json({ status: 'not_ready', error: error.message });
        }
    });
    app.get('/health/startup', (req, res) => {
        res.status(appInitialized ? 200 : 503).json({
            status: appInitialized ? 'started' : 'starting',
            timestamp: new Date().toISOString()
        });
    });
    app.get('/metrics', (req, res) => {
        const uptime = Math.floor((Date.now() - serviceStartTime) / 1000);
        res.setHeader('Content-Type', 'text/plain');
        res.send(`service_uptime_seconds ${uptime}`);
    });
});
app.use('/api/v1/appointments', auth_1.authMiddleware, appointments_1.default);
app.use('/api/v1/schedules', auth_1.authMiddleware, schedules_1.default);
app.use('/api/v1/resources', auth_1.authMiddleware, resources_1.default);
app.use('/api/v1/waitlist', auth_1.authMiddleware, waitlist_1.default);
app.use('/api/v1/reminders', auth_1.authMiddleware, reminders_1.default);
io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);
    socket.on('join-user', (userId) => {
        socket.join(`user-${userId}`);
        console.log(`Client ${socket.id} joined user room ${userId}`);
    });
    socket.on('join-provider', (providerId) => {
        socket.join(`provider-${providerId}`);
        console.log(`Client ${socket.id} joined provider room ${providerId}`);
    });
    socket.on('book-appointment', async (data) => {
        try {
            const { patientId, providerId, dateTime, duration, type } = data;
            const appointmentService = new AppointmentService_1.AppointmentService();
            const appointment = await appointmentService.bookAppointment({
                patientId,
                providerId,
                dateTime: new Date(dateTime),
                duration,
                type,
                status: 'scheduled'
            });
            io.to(`user-${patientId}`).emit('appointment-booked', appointment);
            io.to(`provider-${providerId}`).emit('appointment-booked', appointment);
        }
        catch (error) {
            console.error('Error booking appointment:', error);
            socket.emit('error', { message: 'Failed to book appointment' });
        }
    });
    socket.on('cancel-appointment', async (data) => {
        try {
            const { appointmentId, reason } = data;
            const appointmentService = new AppointmentService_1.AppointmentService();
            const appointment = await appointmentService.cancelAppointment(appointmentId, reason);
            io.to(`user-${appointment.patientId}`).emit('appointment-cancelled', appointment);
            io.to(`provider-${appointment.providerId}`).emit('appointment-cancelled', appointment);
        }
        catch (error) {
            console.error('Error cancelling appointment:', error);
            socket.emit('error', { message: 'Failed to cancel appointment' });
        }
    });
    socket.on('reschedule-appointment', async (data) => {
        try {
            const { appointmentId, newDateTime } = data;
            const appointmentService = new AppointmentService_1.AppointmentService();
            const appointment = await appointmentService.rescheduleAppointment(appointmentId, new Date(newDateTime));
            io.to(`user-${appointment.patientId}`).emit('appointment-rescheduled', appointment);
            io.to(`provider-${appointment.providerId}`).emit('appointment-rescheduled', appointment);
        }
        catch (error) {
            console.error('Error rescheduling appointment:', error);
            socket.emit('error', { message: 'Failed to reschedule appointment' });
        }
    });
    socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
    });
});
node_cron_1.default.schedule('0 * * * *', async () => {
    console.log('Running appointment reminders...');
    try {
        const reminderService = new ReminderService_1.ReminderService();
        await reminderService.sendUpcomingAppointmentReminders();
    }
    catch (error) {
        console.error('Error sending appointment reminders:', error);
    }
});
node_cron_1.default.schedule('*/30 * * * *', async () => {
    console.log('Processing waitlist...');
    try {
        const appointmentService = new AppointmentService_1.AppointmentService();
        await appointmentService.processWaitlist();
    }
    catch (error) {
        console.error('Error processing waitlist:', error);
    }
});
node_cron_1.default.schedule('0 2 * * *', async () => {
    console.log('Running daily cleanup tasks...');
    try {
        const appointmentService = new AppointmentService_1.AppointmentService();
        await appointmentService.cleanupExpiredAppointments();
    }
    catch (error) {
        console.error('Error running cleanup tasks:', error);
    }
});
app.use(errorHandler_1.errorHandler);
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
        path: req.originalUrl
    });
});
server.listen(PORT, () => {
    console.log(`📅 Appointment Service running on port ${PORT}`);
    console.log(`📚 API Documentation available at http://localhost:${PORT}/api-docs`);
    console.log(`🔌 WebSocket server running on port ${PORT}`);
});
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('Process terminated');
        process.exit(0);
    });
});
process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    server.close(() => {
        console.log('Process terminated');
        process.exit(0);
    });
});
//# sourceMappingURL=index.improved.js.map