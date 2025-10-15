"use strict";
/**
 * Payment Routes
 * HTTP routes for payment operations
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const payment_controller_1 = __importDefault(require("../controllers/payment.controller"));
const payment_auth_guard_1 = require("../guards/payment-auth.guard");
const finance_role_guard_1 = require("../guards/finance-role.guard");
const rate_limiter_1 = require("../middleware/rate-limiter");
const validation_middleware_1 = require("../middleware/validation.middleware");
const create_payment_dto_1 = require("../dtos/create-payment.dto");
const verify_payment_dto_1 = require("../dtos/verify-payment.dto");
// Import services
const payment_service_1 = __importDefault(require("../services/payment.service"));
const verification_service_1 = __importDefault(require("../services/verification.service"));
// Initialize services
const paymentService = new payment_service_1.default();
const verificationService = new verification_service_1.default();
// Initialize controller
const paymentController = new payment_controller_1.default(paymentService, verificationService);
const router = (0, express_1.Router)();
/**
 * Initiate payment
 * POST /api/v1/payments/initiate
 * Requires: Authentication
 * Rate Limit: 10 per minute
 */
router.post('/initiate', payment_auth_guard_1.authGuard, rate_limiter_1.paymentRateLimiter, (0, validation_middleware_1.validateBody)(create_payment_dto_1.CreatePaymentDtoValidator.schema), paymentController.initiatePayment.bind(paymentController));
/**
 * Get payment by ID
 * GET /api/v1/payments/:id
 * Requires: Authentication
 */
router.get('/:id', payment_auth_guard_1.authGuard, paymentController.getPayment.bind(paymentController));
/**
 * List payments with filters
 * GET /api/v1/payments
 * Requires: Authentication
 */
router.get('/', payment_auth_guard_1.authGuard, paymentController.listPayments.bind(paymentController));
/**
 * Verify payment (manual verification)
 * POST /api/v1/payments/verify
 * Requires: Authentication + Finance Role
 */
router.post('/verify', payment_auth_guard_1.authGuard, finance_role_guard_1.financeRoleGuard, (0, validation_middleware_1.validateBody)(verify_payment_dto_1.VerifyPaymentDtoValidator.schema), paymentController.verifyPayment.bind(paymentController));
/**
 * Get pending verifications
 * GET /api/v1/payments/pending-verification
 * Requires: Authentication + Finance Role
 */
router.get('/pending-verification', payment_auth_guard_1.authGuard, finance_role_guard_1.financeRoleGuard, paymentController.getPendingVerifications.bind(paymentController));
/**
 * Cancel payment
 * PATCH /api/v1/payments/:id/cancel
 * Requires: Authentication + Finance Role
 */
router.patch('/:id/cancel', payment_auth_guard_1.authGuard, finance_role_guard_1.financeRoleGuard, paymentController.cancelPayment.bind(paymentController));
/**
 * Get payment statistics
 * GET /api/v1/payments/stats
 * Requires: Authentication + Finance Role
 */
router.get('/stats', payment_auth_guard_1.authGuard, finance_role_guard_1.financeRoleGuard, paymentController.getPaymentStats.bind(paymentController));
/**
 * Provider webhook handler
 * POST /api/v1/payments/webhook/:provider
 * No authentication (verified by webhook signature)
 * Rate Limit: 1000 per minute
 */
router.post('/webhook/:provider', rate_limiter_1.webhookRateLimiter, paymentController.handleWebhook.bind(paymentController));
exports.default = router;
//# sourceMappingURL=payment.routes.js.map