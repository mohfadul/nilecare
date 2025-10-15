/**
 * Verification Service
 * Handles manual and automated payment verification
 */
import { VerifyPaymentDto } from '../dtos/verify-payment.dto';
export declare class VerificationService {
    private paymentRepository;
    private providerRepository;
    constructor();
    /**
     * Verify payment (manual or automated)
     */
    verifyPayment(verifyDto: VerifyPaymentDto): Promise<any>;
    /**
     * Get pending verifications
     */
    getPendingVerifications(facilityId?: string): Promise<any[]>;
    /**
     * Bulk verify payments
     */
    bulkVerifyPayments(paymentIds: string[], verifiedBy: string, notes?: string): Promise<any>;
    /**
     * Get verification statistics
     */
    getVerificationStatistics(filters: any): Promise<any>;
    /**
     * Auto-verify payments (for automated providers)
     */
    autoVerifyPayment(transactionId: string): Promise<void>;
    /**
     * Private helper methods
     */
    private getPaymentById;
    private getPaymentByTransactionId;
    private getPaymentProvider;
    private updateInvoiceStatus;
    private sendVerificationNotification;
    private publishPaymentEvent;
}
export default VerificationService;
//# sourceMappingURL=verification.service.d.ts.map