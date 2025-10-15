/**
 * Payment Controller
 * Handles all payment-related HTTP requests
 */
import { Request, Response } from 'express';
import { PaymentService } from '../services/payment.service';
import { VerificationService } from '../services/verification.service';
export declare class PaymentController {
    private paymentService;
    private verificationService;
    constructor(paymentService: PaymentService, verificationService: VerificationService);
    /**
     * Initiate a new payment
     * POST /api/v1/payments/initiate
     */
    initiatePayment(req: Request, res: Response): Promise<void>;
    /**
     * Get payment by ID
     * GET /api/v1/payments/:id
     */
    getPayment(req: Request, res: Response): Promise<void>;
    /**
     * List payments with filters
     * GET /api/v1/payments
     */
    listPayments(req: Request, res: Response): Promise<void>;
    /**
     * Verify payment manually
     * POST /api/v1/payments/verify
     */
    verifyPayment(req: Request, res: Response): Promise<void>;
    /**
     * Get pending verifications
     * GET /api/v1/payments/pending-verification
     */
    getPendingVerifications(req: Request, res: Response): Promise<void>;
    /**
     * Cancel payment
     * PATCH /api/v1/payments/:id/cancel
     */
    cancelPayment(req: Request, res: Response): Promise<void>;
    /**
     * Get payment statistics
     * GET /api/v1/payments/stats
     */
    getPaymentStats(req: Request, res: Response): Promise<void>;
    /**
     * Webhook handler for payment providers
     * POST /api/v1/payments/webhook/:provider
     */
    handleWebhook(req: Request, res: Response): Promise<void>;
}
export default PaymentController;
//# sourceMappingURL=payment.controller.d.ts.map