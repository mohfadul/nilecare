/**
 * Reconciliation Service
 * Handles payment reconciliation with bank statements and provider reports
 */
import { ReconciliationDto, ResolveDiscrepancyDto } from '../dtos/reconciliation.dto';
import { PaymentEntity } from '../entities/payment.entity';
import { ReconciliationEntity } from '../entities/reconciliation.entity';
export interface ReconciliationResult {
    totalProcessed: number;
    matched: number;
    mismatches: number;
    investigating: number;
    missing: number;
    results: ReconciliationEntity[];
}
export interface ReconciliationReport {
    period: {
        startDate: Date;
        endDate: Date;
    };
    provider: string;
    summary: {
        totalPending: number;
        totalConfirmed: number;
        totalAmountPending: number;
        totalAmountConfirmed: number;
        totalFees: number;
        netAmount: number;
    };
    pendingPayments: PaymentEntity[];
    reconciliationIssues: ReconciliationEntity[];
}
export declare class ReconciliationService {
    private paymentRepository;
    private reconciliationRepository;
    constructor();
    /**
     * Reconcile payments with external transactions
     */
    reconcilePayments(reconcileDto: ReconciliationDto[]): Promise<ReconciliationResult>;
    /**
     * Resolve reconciliation discrepancy
     */
    resolveDiscrepancy(resolveDto: ResolveDiscrepancyDto): Promise<any>;
    /**
     * Generate reconciliation report
     */
    generateReconciliationReport(provider: string, startDate: Date, endDate: Date): Promise<ReconciliationReport>;
    /**
     * Get daily reconciliation summary
     */
    getDailyReconciliationSummary(date: Date): Promise<any>;
    /**
     * Private helper methods
     */
    private findPaymentByExternalTransaction;
    private checkForMissingExternalTransactions;
    private getPaymentsByPeriod;
    private getReconciliationsByPeriod;
    private getReconciliationIssues;
    private getReconciliationById;
    private executeResolutionAction;
    private mapResolutionAction;
    private generateId;
}
export default ReconciliationService;
//# sourceMappingURL=reconciliation.service.d.ts.map