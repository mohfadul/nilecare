"use strict";
/**
 * Refund Routes
 * HTTP routes for payment refund operations
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const payment_auth_guard_1 = require("../guards/payment-auth.guard");
const finance_role_guard_1 = require("../guards/finance-role.guard");
const admin_role_guard_1 = require("../guards/admin-role.guard");
const router = (0, express_1.Router)();
// All refund routes require authentication
router.use(payment_auth_guard_1.authGuard);
/**
 * Create refund request
 * POST /api/v1/refunds
 * Requires: Finance role
 */
router.post('/', finance_role_guard_1.financeRoleGuard, async (_req, res) => {
    res.status(200).json({
        success: true,
        message: 'Create refund endpoint'
    });
});
/**
 * Get refund by ID
 * GET /api/v1/refunds/:id
 */
router.get('/:id', async (_req, res) => {
    res.status(200).json({
        success: true,
        message: 'Get refund endpoint'
    });
});
/**
 * Approve refund
 * PATCH /api/v1/refunds/:id/approve
 * Requires: Admin role
 */
router.patch('/:id/approve', admin_role_guard_1.adminRoleGuard, async (_req, res) => {
    res.status(200).json({
        success: true,
        message: 'Approve refund endpoint'
    });
});
/**
 * Reject refund
 * PATCH /api/v1/refunds/:id/reject
 * Requires: Admin role
 */
router.patch('/:id/reject', admin_role_guard_1.adminRoleGuard, async (_req, res) => {
    res.status(200).json({
        success: true,
        message: 'Reject refund endpoint'
    });
});
exports.default = router;
//# sourceMappingURL=refund.routes.js.map