"use strict";
/**
 * Payment Authentication Guard
 * Verifies JWT token and attaches user to request
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authGuard = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
/**
 * Authentication guard middleware
 */
const authGuard = (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            res.status(401).json({
                success: false,
                error: {
                    code: 'NO_TOKEN',
                    message: 'Authentication token is required'
                }
            });
            return;
        }
        // Extract token
        const token = authHeader.startsWith('Bearer ')
            ? authHeader.substring(7)
            : authHeader;
        if (!token) {
            res.status(401).json({
                success: false,
                error: {
                    code: 'INVALID_TOKEN_FORMAT',
                    message: 'Token format is invalid. Use: Authorization: Bearer <token>'
                }
            });
            return;
        }
        // Verify token
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new Error('JWT_SECRET not configured');
        }
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        // Attach user to request
        req.user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role,
            facilityId: decoded.facilityId
        };
        next();
    }
    catch (error) {
        if (error.name === 'TokenExpiredError') {
            res.status(401).json({
                success: false,
                error: {
                    code: 'TOKEN_EXPIRED',
                    message: 'Authentication token has expired'
                }
            });
            return;
        }
        if (error.name === 'JsonWebTokenError') {
            res.status(401).json({
                success: false,
                error: {
                    code: 'INVALID_TOKEN',
                    message: 'Authentication token is invalid'
                }
            });
            return;
        }
        res.status(401).json({
            success: false,
            error: {
                code: 'AUTH_ERROR',
                message: 'Authentication failed'
            }
        });
    }
};
exports.authGuard = authGuard;
exports.default = exports.authGuard;
//# sourceMappingURL=payment-auth.guard.js.map