"use strict";
/**
 * Reconciliation Service
 * Handles payment reconciliation with bank statements and provider reports
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReconciliationService = void 0;
const payment_entity_1 = require("../entities/payment.entity");
const reconciliation_entity_1 = require("../entities/reconciliation.entity");
const payment_repository_1 = __importDefault(require("../repositories/payment.repository"));
const reconciliation_repository_1 = __importDefault(require("../repositories/reconciliation.repository"));
class ReconciliationService {
    constructor() {
        this.paymentRepository = new payment_repository_1.default();
        this.reconciliationRepository = new reconciliation_repository_1.default();
    }
    /**
     * Reconcile payments with external transactions
     */
    async reconcilePayments(reconcileDto) {
        try {
            const results = [];
            let matched = 0;
            let mismatches = 0;
            let investigating = 0;
            let missing = 0;
            for (const externalTx of reconcileDto) {
                // Find matching payment
                const payment = await this.findPaymentByExternalTransaction(externalTx);
                const reconciliation = new reconciliation_entity_1.ReconciliationEntity({
                    id: this.generateId(),
                    paymentId: payment?.id,
                    externalTransactionId: externalTx.externalTransactionId,
                    externalAmount: externalTx.externalAmount,
                    externalCurrency: externalTx.externalCurrency || 'SDG',
                    externalFee: externalTx.externalFee,
                    transactionDate: new Date(externalTx.transactionDate),
                    reconciliationStatus: reconciliation_entity_1.ReconciliationStatus.PENDING,
                    bankStatementId: externalTx.bankStatementId,
                    statementLineNumber: externalTx.statementLineNumber,
                    statementFileUrl: externalTx.statementFileUrl,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
                if (payment) {
                    // Found matching payment - check amounts
                    const amountDifference = Math.abs(payment.amount - externalTx.externalAmount);
                    if (amountDifference < 0.01) {
                        // Amounts match
                        reconciliation.reconciliationStatus = reconciliation_entity_1.ReconciliationStatus.MATCHED;
                        matched++;
                    }
                    else {
                        // Amount mismatch
                        reconciliation.reconciliationStatus = reconciliation_entity_1.ReconciliationStatus.MISMATCH;
                        reconciliation.amountDifference = amountDifference;
                        reconciliation.discrepancyType = reconciliation_entity_1.DiscrepancyType.AMOUNT;
                        reconciliation.discrepancyReason = `Amount mismatch: System ${payment.amount} ${payment.currency} vs External ${externalTx.externalAmount} ${externalTx.externalCurrency}`;
                        mismatches++;
                    }
                }
                else {
                    // No matching payment found
                    reconciliation.reconciliationStatus = reconciliation_entity_1.ReconciliationStatus.INVESTIGATING;
                    reconciliation.discrepancyType = reconciliation_entity_1.DiscrepancyType.MISSING;
                    reconciliation.discrepancyReason = 'No matching payment found in system';
                    investigating++;
                    missing++;
                }
                await this.reconciliationRepository.create(reconciliation);
                results.push(reconciliation);
            }
            // Check for system payments not in external transactions
            await this.checkForMissingExternalTransactions(reconcileDto);
            return {
                totalProcessed: results.length,
                matched,
                mismatches,
                investigating,
                missing,
                results
            };
        }
        catch (error) {
            console.error('Reconciliation error:', error);
            throw new Error(`Reconciliation failed: ${error.message}`);
        }
    }
    /**
     * Resolve reconciliation discrepancy
     */
    async resolveDiscrepancy(resolveDto) {
        try {
            const reconciliation = await this.getReconciliationById(resolveDto.reconciliationId);
            if (!reconciliation) {
                throw new Error('Reconciliation record not found');
            }
            if (reconciliation.reconciliationStatus !== reconciliation_entity_1.ReconciliationStatus.MISMATCH &&
                reconciliation.reconciliationStatus !== reconciliation_entity_1.ReconciliationStatus.INVESTIGATING) {
                throw new Error('Reconciliation is not in a state that can be resolved');
            }
            // Mark as resolved
            reconciliation.reconciliationStatus = reconciliation_entity_1.ReconciliationStatus.RESOLVED;
            reconciliation.resolutionAction = this.mapResolutionAction(resolveDto.resolutionAction);
            reconciliation.resolutionNotes = resolveDto.resolutionNotes;
            reconciliation.resolvedBy = resolveDto.resolvedBy;
            reconciliation.resolvedAt = new Date();
            reconciliation.updatedAt = new Date();
            await this.reconciliationRepository.update(reconciliation);
            // Execute resolution action
            await this.executeResolutionAction(reconciliation);
            return {
                success: true,
                reconciliationId: reconciliation.id,
                status: 'resolved',
                action: resolveDto.resolutionAction
            };
        }
        catch (error) {
            console.error('Resolve discrepancy error:', error);
            throw new Error(`Failed to resolve discrepancy: ${error.message}`);
        }
    }
    /**
     * Generate reconciliation report
     */
    async generateReconciliationReport(provider, startDate, endDate) {
        try {
            // Get all payments for period
            const payments = await this.getPaymentsByPeriod(provider, startDate, endDate);
            // Calculate summary
            const summary = {
                totalPending: 0,
                totalConfirmed: 0,
                totalAmountPending: 0,
                totalAmountConfirmed: 0,
                totalFees: 0,
                netAmount: 0
            };
            const pendingPayments = [];
            for (const payment of payments) {
                if (payment.status === payment_entity_1.PaymentStatus.CONFIRMED) {
                    summary.totalConfirmed++;
                    summary.totalAmountConfirmed += payment.amount;
                    summary.totalFees += payment.totalFees;
                }
                else if (payment.status === payment_entity_1.PaymentStatus.PENDING ||
                    payment.status === payment_entity_1.PaymentStatus.AWAITING_VERIFICATION) {
                    summary.totalPending++;
                    summary.totalAmountPending += payment.amount;
                    pendingPayments.push(payment);
                }
            }
            summary.netAmount = summary.totalAmountConfirmed - summary.totalFees;
            // Get reconciliation issues
            const reconciliationIssues = await this.getReconciliationIssues(provider, startDate, endDate);
            return {
                period: { startDate, endDate },
                provider,
                summary,
                pendingPayments,
                reconciliationIssues
            };
        }
        catch (error) {
            console.error('Generate report error:', error);
            throw new Error(`Failed to generate reconciliation report: ${error.message}`);
        }
    }
    /**
     * Get daily reconciliation summary
     */
    async getDailyReconciliationSummary(date) {
        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);
        // Get all payments for the day
        const payments = await this.getPaymentsByPeriod('all', startDate, endDate);
        // Get all reconciliations for the day
        const reconciliations = await this.getReconciliationsByPeriod(startDate, endDate);
        return {
            date,
            totalPayments: payments.length,
            totalReconciliations: reconciliations.length,
            matched: reconciliations.filter(r => r.reconciliationStatus === reconciliation_entity_1.ReconciliationStatus.MATCHED).length,
            mismatches: reconciliations.filter(r => r.reconciliationStatus === reconciliation_entity_1.ReconciliationStatus.MISMATCH).length,
            investigating: reconciliations.filter(r => r.reconciliationStatus === reconciliation_entity_1.ReconciliationStatus.INVESTIGATING).length,
            resolved: reconciliations.filter(r => r.reconciliationStatus === reconciliation_entity_1.ReconciliationStatus.RESOLVED).length
        };
    }
    /**
     * Private helper methods
     */
    async findPaymentByExternalTransaction(_externalTx) {
        // In production: Query from database
        // Try multiple matching strategies:
        // 1. Match by external transaction ID
        // 2. Match by amount and date
        // 3. Match by merchant reference
        // return await this.paymentRepository.findOne({
        //   where: [
        //     { transactionId: externalTx.externalTransactionId },
        //     {
        //       amount: externalTx.externalAmount,
        //       createdAt: Between(
        //         new Date(externalTx.transactionDate).setHours(0, 0, 0, 0),
        //         new Date(externalTx.transactionDate).setHours(23, 59, 59, 999)
        //       )
        //     }
        //   ]
        // });
        return null;
    }
    async checkForMissingExternalTransactions(_externalTransactions) {
        // Find system payments that don't have corresponding external transactions
        // These could indicate duplicate payments or missing provider reports
    }
    async getPaymentsByPeriod(provider, startDate, endDate) {
        const filters = {
            dateRange: { start: startDate, end: endDate }
        };
        if (provider !== 'all') {
            filters.providerId = provider;
        }
        const { payments } = await this.paymentRepository.findWithFilters(filters, 1, 10000);
        return payments;
    }
    async getReconciliationsByPeriod(_startDate, _endDate) {
        // In production: Query from database
        // return await this.reconciliationRepository.find({
        //   where: {
        //     createdAt: Between(startDate, endDate)
        //   }
        // });
        return [];
    }
    async getReconciliationIssues(_provider, _startDate, _endDate) {
        return await this.reconciliationRepository.findUnresolved();
    }
    async getReconciliationById(reconciliationId) {
        return await this.reconciliationRepository.findById(reconciliationId);
    }
    async executeResolutionAction(reconciliation) {
        // Execute the resolution action
        switch (reconciliation.resolutionAction) {
            case reconciliation_entity_1.ResolutionAction.ADJUST_PAYMENT:
                // Adjust payment amount
                console.log('Adjusting payment amount');
                break;
            case reconciliation_entity_1.ResolutionAction.REFUND:
                // Process refund
                console.log('Processing refund');
                break;
            case reconciliation_entity_1.ResolutionAction.WRITE_OFF:
                // Write off discrepancy
                console.log('Writing off discrepancy');
                break;
            case reconciliation_entity_1.ResolutionAction.CONTACT_PROVIDER:
                // Create task to contact provider
                console.log('Creating contact provider task');
                break;
            default:
                // No action needed
                break;
        }
    }
    mapResolutionAction(action) {
        const actionMap = {
            'adjust_payment': reconciliation_entity_1.ResolutionAction.ADJUST_PAYMENT,
            'refund': reconciliation_entity_1.ResolutionAction.REFUND,
            'write_off': reconciliation_entity_1.ResolutionAction.WRITE_OFF,
            'contact_provider': reconciliation_entity_1.ResolutionAction.CONTACT_PROVIDER,
            'none': reconciliation_entity_1.ResolutionAction.NONE
        };
        return actionMap[action] || reconciliation_entity_1.ResolutionAction.NONE;
    }
    generateId() {
        return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }
}
exports.ReconciliationService = ReconciliationService;
exports.default = ReconciliationService;
//# sourceMappingURL=reconciliation.service.js.map