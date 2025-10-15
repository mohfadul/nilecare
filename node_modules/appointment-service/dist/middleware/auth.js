"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.requireRole = exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const errorHandler_1 = require("./errorHandler");
const JWT_SECRET = process.env.JWT_SECRET || 'nilecare-secret-key-2024';
const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new errorHandler_1.UnauthorizedError('No token provided');
        }
        const token = authHeader.substring(7);
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.user = {
            id: decoded.id || decoded.userId,
            email: decoded.email,
            role: decoded.role,
            name: decoded.name || decoded.username,
        };
        next();
    }
    catch (error) {
        if (error.name === 'JsonWebTokenError') {
            next(new errorHandler_1.UnauthorizedError('Invalid token'));
        }
        else if (error.name === 'TokenExpiredError') {
            next(new errorHandler_1.UnauthorizedError('Token expired'));
        }
        else {
            next(error);
        }
    }
};
exports.authMiddleware = authMiddleware;
const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new errorHandler_1.UnauthorizedError('Authentication required'));
        }
        if (!roles.includes(req.user.role)) {
            return next(new errorHandler_1.UnauthorizedError(`Required role: ${roles.join(' or ')}`));
        }
        next();
    };
};
exports.requireRole = requireRole;
const optionalAuth = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
            req.user = {
                id: decoded.id || decoded.userId,
                email: decoded.email,
                role: decoded.role,
                name: decoded.name || decoded.username,
            };
        }
    }
    catch (error) {
    }
    next();
};
exports.optionalAuth = optionalAuth;
//# sourceMappingURL=auth.js.map