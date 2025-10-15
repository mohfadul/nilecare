"use strict";
/**
 * Logger Utility
 * Winston-based structured logging for the Device Integration Service
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = __importDefault(require("winston"));
const path_1 = __importDefault(require("path"));
const env_1 = require("../config/env");
const logLevels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};
const logColors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'blue',
};
winston_1.default.addColors(logColors);
const format = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }), winston_1.default.format.colorize({ all: true }), winston_1.default.format.printf((info) => {
    const { timestamp, level, message, ...metadata } = info;
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(metadata).length > 0) {
        msg += ` ${JSON.stringify(metadata)}`;
    }
    return msg;
}));
const transports = [
    new winston_1.default.transports.Console(),
];
// Add file transport in production
if (env_1.config.NODE_ENV !== 'test') {
    transports.push(new winston_1.default.transports.File({
        filename: path_1.default.join(env_1.config.LOG_FILE_PATH, '../error.log'),
        level: 'error',
        maxsize: 10485760, // 10MB
        maxFiles: 5,
    }), new winston_1.default.transports.File({
        filename: env_1.config.LOG_FILE_PATH,
        maxsize: 10485760, // 10MB
        maxFiles: 10,
    }));
}
const logger = winston_1.default.createLogger({
    level: env_1.config.LOG_LEVEL || 'info',
    levels: logLevels,
    format,
    transports,
});
exports.default = logger;
//# sourceMappingURL=logger.js.map