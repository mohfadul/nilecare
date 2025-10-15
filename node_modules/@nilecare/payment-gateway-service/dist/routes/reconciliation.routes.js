"use strict";
/**
 * Reconciliation Routes
 * HTTP routes for payment reconciliation operations
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const payment_auth_guard_1 = require("../guards/payment-auth.guard");
const finance_role_guard_1 = require("../guards/finance-role.guard");
const validation_middleware_1 = require("../middleware/validation.middleware");
const reconciliation_dto_1 = require("../dtos/reconciliation.dto");
const router = (0, express_1.Router)();
// All reconciliation routes require authentication + finance role
router.use(payment_auth_guard_1.authGuard);
router.use(finance_role_guard_1.financeRoleGuard);
/**
 * Create reconciliation
 * POST /api/v1/reconciliation
 */
router.post('/', (0, validation_middleware_1.validateBody)(reconciliation_dto_1.ReconciliationDtoValidator.schema), async (_req, res) => {
    res.status(200).json({
        success: true,
        message: 'Reconciliation endpoint - implementation in progress'
    });
});
/**
 * Get reconciliation by ID
 * GET /api/v1/reconciliation/:id
 */
router.get('/:id', async (_req, res) => {
    res.status(200).json({
        success: true,
        message: 'Get reconciliation endpoint'
    });
});
/**
 * Resolve discrepancy
 * POST /api/v1/reconciliation/resolve
 */
router.post('/resolve', (0, validation_middleware_1.validateBody)(reconciliation_dto_1.ReconciliationDtoValidator.resolveSchema), async (_req, res) => {
    res.status(200).json({
        success: true,
        message: 'Resolve discrepancy endpoint'
    });
});
exports.default = router;
//# sourceMappingURL=reconciliation.routes.js.map