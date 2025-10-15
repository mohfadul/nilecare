"use strict";
/**
 * Admin Role Guard
 * Ensures user has admin role
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRoleGuard = void 0;
const ADMIN_ROLES = [
    'super_admin',
    'hospital_admin',
    'dental_admin'
];
/**
 * Admin role guard middleware
 */
const adminRoleGuard = (req, res, next) => {
    try {
        const user = req.user;
        if (!user) {
            res.status(401).json({
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Authentication required'
                }
            });
            return;
        }
        // Check if user has admin role
        if (!ADMIN_ROLES.includes(user.role)) {
            res.status(403).json({
                success: false,
                error: {
                    code: 'INSUFFICIENT_PERMISSIONS',
                    message: 'Admin role required to access this resource',
                    requiredRoles: ADMIN_ROLES
                }
            });
            return;
        }
        next();
    }
    catch (error) {
        res.status(403).json({
            success: false,
            error: {
                code: 'AUTHORIZATION_ERROR',
                message: 'Authorization check failed'
            }
        });
    }
};
exports.adminRoleGuard = adminRoleGuard;
exports.default = exports.adminRoleGuard;
//# sourceMappingURL=admin-role.guard.js.map