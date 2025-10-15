"use strict";
/**
 * Payment Gateway Service
 * Main entry point for NileCare payment processing
 * Port: 7001
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const dotenv_1 = require("dotenv");
const winston_1 = __importDefault(require("winston"));
// Load environment variables
(0, dotenv_1.config)();
// Import routes
const payment_routes_1 = __importDefault(require("./routes/payment.routes"));
const reconciliation_routes_1 = __importDefault(require("./routes/reconciliation.routes"));
const refund_routes_1 = __importDefault(require("./routes/refund.routes"));
const health_routes_1 = __importDefault(require("./routes/health.routes"));
// Import middleware
const error_handler_1 = require("./middleware/error-handler");
const request_logger_1 = require("./middleware/request-logger");
const rate_limiter_1 = require("./middleware/rate-limiter");
// Initialize logger
const logger = winston_1.default.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.json()),
    transports: [
        new winston_1.default.transports.Console(),
        new winston_1.default.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston_1.default.transports.File({ filename: 'logs/combined.log' })
    ]
});
// Initialize Express app
const app = (0, express_1.default)();
const PORT = process.env.PORT || 7001;
// Middleware
app.use((0, helmet_1.default)()); // Security headers
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
}));
app.use((0, compression_1.default)()); // Compress responses
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use(request_logger_1.requestLogger); // Request logging
app.use(rate_limiter_1.rateLimiter); // Rate limiting
// Routes
app.use('/health', health_routes_1.default);
app.use('/api/v1/payments', payment_routes_1.default);
app.use('/api/v1/reconciliation', reconciliation_routes_1.default);
app.use('/api/v1/refunds', refund_routes_1.default);
// Error handling
app.use(error_handler_1.errorHandler);
// Start server
app.listen(PORT, () => {
    logger.info(`Payment Gateway Service listening on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    process.exit(0);
});
process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully');
    process.exit(0);
});
exports.default = app;
//# sourceMappingURL=index.js.map