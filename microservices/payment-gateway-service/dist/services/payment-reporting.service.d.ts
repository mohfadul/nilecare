/**
 * Payment Reporting Service
 * Generates comprehensive payment reports and analytics
 */
import { PaymentEntity } from '../entities/payment.entity';
export interface ReportCriteria {
    facilityId?: string;
    startDate: Date;
    endDate: Date;
    provider?: string;
    status?: string;
}
export interface PaymentReport {
    summary: PaymentSummary;
    byProvider: ProviderBreakdown[];
    byStatus: StatusBreakdown[];
    byDate: DailyBreakdown[];
    transactions: PaymentEntity[];
}
export interface PaymentSummary {
    totalPayments: number;
    totalAmount: number;
    currency: string;
    successfulPayments: number;
    pendingPayments: number;
    failedPayments: number;
    totalFees: number;
    netRevenue: number;
    averageTransactionAmount: number;
    averageProcessingTime: number;
    successRate: number;
}
export interface ProviderBreakdown {
    providerName: string;
    providerDisplayName: string;
    transactionCount: number;
    totalAmount: number;
    totalFees: number;
    successRate: number;
    averageAmount: number;
}
export interface StatusBreakdown {
    status: string;
    count: number;
    totalAmount: number;
    percentage: number;
}
export interface DailyBreakdown {
    date: string;
    transactionCount: number;
    totalAmount: number;
    successfulCount: number;
}
export interface RevenueAnalytics {
    totalRevenue: number;
    currency: string;
    trend: 'increasing' | 'decreasing' | 'stable';
    percentageChange: number;
    byProvider: Record<string, number>;
    comparison: {
        currentPeriod: number;
        previousPeriod: number;
        change: number;
    };
}
export declare class PaymentReportingService {
    /**
     * Generate comprehensive payment report
     */
    generatePaymentReport(criteria: ReportCriteria): Promise<PaymentReport>;
    /**
     * Get revenue analytics
     */
    getRevenueAnalytics(facilityId: string, period: 'daily' | 'weekly' | 'monthly'): Promise<RevenueAnalytics>;
    /**
     * Generate daily reconciliation report
     */
    generateDailyReconciliationReport(date: Date): Promise<any>;
    /**
     * Get payment performance metrics
     */
    getPaymentPerformanceMetrics(facilityId: string): Promise<any>;
    /**
     * Private helper methods
     */
    private getPaymentsByCriteria;
    private calculateSummary;
    private groupByProvider;
    private groupByStatus;
    private groupByDate;
    private calculateAverageProcessingTime;
    private getPaymentMethodDistribution;
    private identifyPeakHours;
    private getTopProviders;
    private getDateRangeForPeriod;
}
export default PaymentReportingService;
//# sourceMappingURL=payment-reporting.service.d.ts.map