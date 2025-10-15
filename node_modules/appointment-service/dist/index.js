"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const compression_1 = __importDefault(require("compression"));
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const node_cron_1 = __importDefault(require("node-cron"));
dotenv_1.default.config();
const database_1 = require("./config/database");
const appointments_1 = __importDefault(require("./routes/appointments"));
const schedules_1 = __importDefault(require("./routes/schedules"));
const resources_1 = __importDefault(require("./routes/resources"));
const waitlist_1 = __importDefault(require("./routes/waitlist"));
const reminders_1 = __importDefault(require("./routes/reminders"));
const errorHandler_1 = require("./middleware/errorHandler");
const logger_1 = require("./middleware/logger");
const NotificationService_1 = __importDefault(require("./services/NotificationService"));
const ReminderService_1 = __importDefault(require("./services/ReminderService"));
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(',') || [
            'http://localhost:3000',
            'http://localhost:5173',
            'http://localhost:7001',
        ],
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        credentials: true,
    },
});
const PORT = process.env.PORT || 5002;
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://localhost:7001',
    ],
    credentials: true,
}));
app.use((0, compression_1.default)());
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use(logger_1.requestLogger);
NotificationService_1.default.initialize(io);
app.get('/health', (req, res) => {
    res.json({
        success: true,
        service: 'appointment-service',
        status: 'running',
        timestamp: new Date().toISOString(),
    });
});
app.use('/api/v1/appointments', appointments_1.default);
app.use('/api/v1/schedules', schedules_1.default);
app.use('/api/v1/resources', resources_1.default);
app.use('/api/v1/waitlist', waitlist_1.default);
app.use('/api/v1/reminders', reminders_1.default);
app.get('/', (req, res) => {
    res.json({
        success: true,
        service: 'NileCare Appointment Service',
        version: '1.0.0',
        endpoints: {
            appointments: '/api/v1/appointments',
            schedules: '/api/v1/schedules',
            resources: '/api/v1/resources',
            waitlist: '/api/v1/waitlist',
            reminders: '/api/v1/reminders',
            health: '/health',
        },
    });
});
app.use(errorHandler_1.errorHandler);
node_cron_1.default.schedule('*/5 * * * *', async () => {
    try {
        console.log('⏰ Running scheduled reminder processing...');
        await ReminderService_1.default.processPendingReminders();
    }
    catch (error) {
        console.error('Failed to process reminders:', error.message);
    }
});
async function startServer() {
    try {
        console.log('🔌 Testing database connection...');
        const dbConnected = await (0, database_1.testConnection)();
        if (!dbConnected) {
            console.error('❌ Failed to connect to database');
            process.exit(1);
        }
        server.listen(PORT, () => {
            console.log('');
            console.log('═══════════════════════════════════════════════════════════');
            console.log('✅  APPOINTMENT SERVICE STARTED');
            console.log('═══════════════════════════════════════════════════════════');
            console.log(`🚀  Server:          http://localhost:${PORT}`);
            console.log(`🏥  Service:         NileCare Appointment Service`);
            console.log(`📡  Socket.IO:       Enabled`);
            console.log(`🗄️   Database:        MySQL (${process.env.DB_NAME})`);
            console.log(`⏰  Cron Jobs:       Enabled (reminder processing)`);
            console.log('');
            console.log('📚  API Endpoints:');
            console.log(`    - GET/POST    /api/v1/appointments`);
            console.log(`    - GET         /api/v1/schedules`);
            console.log(`    - GET         /api/v1/resources`);
            console.log(`    - GET/POST    /api/v1/waitlist`);
            console.log(`    - GET/POST    /api/v1/reminders`);
            console.log(`    - GET         /health`);
            console.log('═══════════════════════════════════════════════════════════');
            console.log('');
        });
    }
    catch (error) {
        console.error('❌ Failed to start server:', error.message);
        process.exit(1);
    }
}
process.on('SIGTERM', () => {
    console.log('👋 SIGTERM received, shutting down gracefully...');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});
process.on('SIGINT', () => {
    console.log('👋 SIGINT received, shutting down gracefully...');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});
startServer();
exports.default = app;
//# sourceMappingURL=index.js.map