/**
 * Reconciliation Service
 * Handles payment reconciliation with bank statements and provider reports
 */

import { ReconciliationDto, ResolveDiscrepancyDto } from '../dtos/reconciliation.dto';
import { PaymentEntity, PaymentStatus } from '../entities/payment.entity';
import { ReconciliationEntity, ReconciliationStatus, DiscrepancyType, ResolutionAction } from '../entities/reconciliation.entity';
import PaymentRepository from '../repositories/payment.repository';
import ReconciliationRepository from '../repositories/reconciliation.repository';

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

export class ReconciliationService {
  private paymentRepository: PaymentRepository;
  private reconciliationRepository: ReconciliationRepository;

  constructor() {
    this.paymentRepository = new PaymentRepository();
    this.reconciliationRepository = new ReconciliationRepository();
  }

  /**
   * Reconcile payments with external transactions
   */
  async reconcilePayments(reconcileDto: ReconciliationDto[]): Promise<ReconciliationResult> {
    try {
      const results: ReconciliationEntity[] = [];
      let matched = 0;
      let mismatches = 0;
      let investigating = 0;
      let missing = 0;

      for (const externalTx of reconcileDto) {
        // Find matching payment
        const payment = await this.findPaymentByExternalTransaction(externalTx);

        const reconciliation = new ReconciliationEntity({
          id: this.generateId(),
          paymentId: payment?.id,
          externalTransactionId: externalTx.externalTransactionId,
          externalAmount: externalTx.externalAmount,
          externalCurrency: externalTx.externalCurrency || 'SDG',
          externalFee: externalTx.externalFee,
          transactionDate: new Date(externalTx.transactionDate),
          reconciliationStatus: ReconciliationStatus.PENDING,
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
            reconciliation.reconciliationStatus = ReconciliationStatus.MATCHED;
            matched++;
          } else {
            // Amount mismatch
            reconciliation.reconciliationStatus = ReconciliationStatus.MISMATCH;
            reconciliation.amountDifference = amountDifference;
            reconciliation.discrepancyType = DiscrepancyType.AMOUNT;
            reconciliation.discrepancyReason = `Amount mismatch: System ${payment.amount} ${payment.currency} vs External ${externalTx.externalAmount} ${externalTx.externalCurrency}`;
            mismatches++;
          }
        } else {
          // No matching payment found
          reconciliation.reconciliationStatus = ReconciliationStatus.INVESTIGATING;
          reconciliation.discrepancyType = DiscrepancyType.MISSING;
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

    } catch (error: any) {
      console.error('Reconciliation error:', error);
      throw new Error(`Reconciliation failed: ${error.message}`);
    }
  }

  /**
   * Resolve reconciliation discrepancy
   */
  async resolveDiscrepancy(resolveDto: ResolveDiscrepancyDto): Promise<any> {
    try {
      const reconciliation = await this.getReconciliationById(resolveDto.reconciliationId);

      if (!reconciliation) {
        throw new Error('Reconciliation record not found');
      }

      if (reconciliation.reconciliationStatus !== ReconciliationStatus.MISMATCH &&
          reconciliation.reconciliationStatus !== ReconciliationStatus.INVESTIGATING) {
        throw new Error('Reconciliation is not in a state that can be resolved');
      }

      // Mark as resolved
      reconciliation.reconciliationStatus = ReconciliationStatus.RESOLVED;
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

    } catch (error: any) {
      console.error('Resolve discrepancy error:', error);
      throw new Error(`Failed to resolve discrepancy: ${error.message}`);
    }
  }

  /**
   * Generate reconciliation report
   */
  async generateReconciliationReport(
    provider: string,
    startDate: Date,
    endDate: Date
  ): Promise<ReconciliationReport> {
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

      const pendingPayments: PaymentEntity[] = [];

      for (const payment of payments) {
        if (payment.status === PaymentStatus.CONFIRMED) {
          summary.totalConfirmed++;
          summary.totalAmountConfirmed += payment.amount;
          summary.totalFees += payment.totalFees;
        } else if (payment.status === PaymentStatus.PENDING ||
                   payment.status === PaymentStatus.AWAITING_VERIFICATION) {
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

    } catch (error: any) {
      console.error('Generate report error:', error);
      throw new Error(`Failed to generate reconciliation report: ${error.message}`);
    }
  }

  /**
   * Get daily reconciliation summary
   */
  async getDailyReconciliationSummary(date: Date): Promise<any> {
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
      matched: reconciliations.filter(r => r.reconciliationStatus === ReconciliationStatus.MATCHED).length,
      mismatches: reconciliations.filter(r => r.reconciliationStatus === ReconciliationStatus.MISMATCH).length,
      investigating: reconciliations.filter(r => r.reconciliationStatus === ReconciliationStatus.INVESTIGATING).length,
      resolved: reconciliations.filter(r => r.reconciliationStatus === ReconciliationStatus.RESOLVED).length
    };
  }

  /**
   * Private helper methods
   */

  private async findPaymentByExternalTransaction(externalTx: ReconciliationDto): Promise<PaymentEntity | null> {
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

  private async checkForMissingExternalTransactions(externalTransactions: ReconciliationDto[]): Promise<void> {
    // Find system payments that don't have corresponding external transactions
    // These could indicate duplicate payments or missing provider reports
  }

  private async getPaymentsByPeriod(
    provider: string,
    startDate: Date,
    endDate: Date
  ): Promise<PaymentEntity[]> {
    const filters: any = {
      dateRange: { start: startDate, end: endDate }
    };
    if (provider !== 'all') {
      filters.providerId = provider;
    }
    const { payments } = await this.paymentRepository.findWithFilters(filters, 1, 10000);
    return payments;
  }

  private async getReconciliationsByPeriod(
    startDate: Date,
    endDate: Date
  ): Promise<ReconciliationEntity[]> {
    // In production: Query from database
    // return await this.reconciliationRepository.find({
    //   where: {
    //     createdAt: Between(startDate, endDate)
    //   }
    // });

    return [];
  }

  private async getReconciliationIssues(
    provider: string,
    startDate: Date,
    endDate: Date
  ): Promise<ReconciliationEntity[]> {
    return await this.reconciliationRepository.findUnresolved();
  }

  private async getReconciliationById(reconciliationId: string): Promise<ReconciliationEntity | null> {
    return await this.reconciliationRepository.findById(reconciliationId);
  }

  private async executeResolutionAction(reconciliation: ReconciliationEntity): Promise<void> {
    // Execute the resolution action
    switch (reconciliation.resolutionAction) {
      case ResolutionAction.ADJUST_PAYMENT:
        // Adjust payment amount
        console.log('Adjusting payment amount');
        break;
      
      case ResolutionAction.REFUND:
        // Process refund
        console.log('Processing refund');
        break;
      
      case ResolutionAction.WRITE_OFF:
        // Write off discrepancy
        console.log('Writing off discrepancy');
        break;
      
      case ResolutionAction.CONTACT_PROVIDER:
        // Create task to contact provider
        console.log('Creating contact provider task');
        break;
      
      default:
        // No action needed
        break;
    }
  }

  private mapResolutionAction(action: string): ResolutionAction {
    const actionMap: Record<string, ResolutionAction> = {
      'adjust_payment': ResolutionAction.ADJUST_PAYMENT,
      'refund': ResolutionAction.REFUND,
      'write_off': ResolutionAction.WRITE_OFF,
      'contact_provider': ResolutionAction.CONTACT_PROVIDER,
      'none': ResolutionAction.NONE
    };

    return actionMap[action] || ResolutionAction.NONE;
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}

export default ReconciliationService;

