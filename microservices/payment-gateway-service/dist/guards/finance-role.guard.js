"use strict";
/**
 * Finance Role Guard
 * Ensures user has finance/accountant role
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.financeRoleGuard = void 0;
const FINANCE_ROLES = [
    'super_admin',
    'hospital_admin',
    'accountant',
    'finance_manager',
    'billing_staff'
];
/**
 * Finance role guard middleware
 */
const financeRoleGuard = (req, res, next) => {
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
        // Check if user has finance role
        if (!FINANCE_ROLES.includes(user.role)) {
            res.status(403).json({
                success: false,
                error: {
                    code: 'INSUFFICIENT_PERMISSIONS',
                    message: 'Finance role required to access this resource',
                    requiredRoles: FINANCE_ROLES
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
exports.financeRoleGuard = financeRoleGuard;
exports.default = exports.financeRoleGuard;
//# sourceMappingURL=finance-role.guard.js.map