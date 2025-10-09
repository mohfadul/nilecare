/**
 * Payment Reporting Service
 * Generates comprehensive payment reports and analytics
 */

import { PaymentEntity, PaymentStatus } from '../entities/payment.entity';

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
  averageProcessingTime: number; // in seconds
  successRate: number; // percentage
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

export class PaymentReportingService {
  /**
   * Generate comprehensive payment report
   */
  async generatePaymentReport(criteria: ReportCriteria): Promise<PaymentReport> {
    try {
      // Get payments matching criteria
      const payments = await this.getPaymentsByCriteria(criteria);

      // Calculate summary
      const summary = this.calculateSummary(payments);

      // Group by provider
      const byProvider = this.groupByProvider(payments);

      // Group by status
      const byStatus = this.groupByStatus(payments);

      // Group by date
      const byDate = this.groupByDate(payments);

      return {
        summary,
        byProvider,
        byStatus,
        byDate,
        transactions: payments
      };

    } catch (error: any) {
      console.error('Generate report error:', error);
      throw new Error(`Failed to generate payment report: ${error.message}`);
    }
  }

  /**
   * Get revenue analytics
   */
  async getRevenueAnalytics(facilityId: string, period: 'daily' | 'weekly' | 'monthly'): Promise<RevenueAnalytics> {
    try {
      // Get date range based on period
      const { startDate, endDate, previousStartDate, previousEndDate } = this.getDateRangeForPeriod(period);

      // Get current period payments
      const currentPayments = await this.getPaymentsByCriteria({
        facilityId,
        startDate,
        endDate,
        status: 'confirmed'
      });

      // Get previous period payments for comparison
      const previousPayments = await this.getPaymentsByCriteria({
        facilityId,
        startDate: previousStartDate,
        endDate: previousEndDate,
        status: 'confirmed'
      });

      // Calculate totals
      const totalRevenue = currentPayments.reduce((sum, p) => sum + p.amount, 0);
      const previousRevenue = previousPayments.reduce((sum, p) => sum + p.amount, 0);

      // Calculate trend
      const percentageChange = previousRevenue > 0
        ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
        : 0;

      let trend: 'increasing' | 'decreasing' | 'stable';
      if (percentageChange > 5) {
        trend = 'increasing';
      } else if (percentageChange < -5) {
        trend = 'decreasing';
      } else {
        trend = 'stable';
      }

      // Revenue by provider
      const byProvider: Record<string, number> = {};
      for (const payment of currentPayments) {
        const providerName = payment.providerId; // Would fetch provider name
        byProvider[providerName] = (byProvider[providerName] || 0) + payment.amount;
      }

      return {
        totalRevenue,
        currency: 'SDG',
        trend,
        percentageChange: Math.round(percentageChange * 100) / 100,
        byProvider,
        comparison: {
          currentPeriod: totalRevenue,
          previousPeriod: previousRevenue,
          change: totalRevenue - previousRevenue
        }
      };

    } catch (error: any) {
      console.error('Revenue analytics error:', error);
      throw new Error(`Failed to generate revenue analytics: ${error.message}`);
    }
  }

  /**
   * Generate daily reconciliation report
   */
  async generateDailyReconciliationReport(date: Date): Promise<any> {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const payments = await this.getPaymentsByCriteria({
      startDate,
      endDate
    });

    const summary = this.calculateSummary(payments);
    const byProvider = this.groupByProvider(payments);

    return {
      date: date.toISOString().split('T')[0],
      summary,
      byProvider,
      pendingVerifications: payments.filter(p => p.status === PaymentStatus.AWAITING_VERIFICATION).length,
      requiresReconciliation: payments.filter(p => p.status === PaymentStatus.CONFIRMED).length
    };
  }

  /**
   * Get payment performance metrics
   */
  async getPaymentPerformanceMetrics(facilityId: string): Promise<any> {
    // Get last 30 days of data
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const payments = await this.getPaymentsByCriteria({
      facilityId,
      startDate,
      endDate
    });

    const confirmedPayments = payments.filter(p => p.status === PaymentStatus.CONFIRMED);

    return {
      successRate: (confirmedPayments.length / payments.length) * 100,
      averageProcessingTime: this.calculateAverageProcessingTime(confirmedPayments),
      paymentMethodDistribution: this.getPaymentMethodDistribution(payments),
      peakHours: this.identifyPeakHours(payments),
      topProviders: this.getTopProviders(payments, 5)
    };
  }

  /**
   * Private helper methods
   */

  private async getPaymentsByCriteria(_criteria: ReportCriteria): Promise<PaymentEntity[]> {
    // In production: Query from database with filters
    // const where: any = {
    //   createdAt: Between(criteria.startDate, criteria.endDate)
    // };
    // if (criteria.facilityId) where.facilityId = criteria.facilityId;
    // if (criteria.provider) where.providerId = criteria.provider;
    // if (criteria.status) where.status = criteria.status;
    
    // return await this.paymentRepository.find({ where });

    return [];
  }

  private calculateSummary(payments: PaymentEntity[]): PaymentSummary {
    const totalPayments = payments.length;
    const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
    const successfulPayments = payments.filter(p => p.status === PaymentStatus.CONFIRMED).length;
    const pendingPayments = payments.filter(p => 
      p.status === PaymentStatus.PENDING || 
      p.status === PaymentStatus.AWAITING_VERIFICATION
    ).length;
    const failedPayments = payments.filter(p => p.status === PaymentStatus.FAILED).length;
    const totalFees = payments.reduce((sum, p) => sum + p.totalFees, 0);

    return {
      totalPayments,
      totalAmount,
      currency: 'SDG',
      successfulPayments,
      pendingPayments,
      failedPayments,
      totalFees,
      netRevenue: totalAmount - totalFees,
      averageTransactionAmount: totalPayments > 0 ? totalAmount / totalPayments : 0,
      averageProcessingTime: this.calculateAverageProcessingTime(payments),
      successRate: totalPayments > 0 ? (successfulPayments / totalPayments) * 100 : 0
    };
  }

  private groupByProvider(payments: PaymentEntity[]): ProviderBreakdown[] {
    const grouped = new Map<string, PaymentEntity[]>();

    for (const payment of payments) {
      const providerId = payment.providerId;
      if (!grouped.has(providerId)) {
        grouped.set(providerId, []);
      }
      grouped.get(providerId)!.push(payment);
    }

    const breakdown: ProviderBreakdown[] = [];
    for (const [providerId, providerPayments] of grouped.entries()) {
      const totalAmount = providerPayments.reduce((sum, p) => sum + p.amount, 0);
      const totalFees = providerPayments.reduce((sum, p) => sum + p.totalFees, 0);
      const successfulCount = providerPayments.filter(p => p.status === PaymentStatus.CONFIRMED).length;

      breakdown.push({
        providerName: providerId,
        providerDisplayName: providerId, // Would fetch from provider entity
        transactionCount: providerPayments.length,
        totalAmount,
        totalFees,
        successRate: (successfulCount / providerPayments.length) * 100,
        averageAmount: totalAmount / providerPayments.length
      });
    }

    return breakdown.sort((a, b) => b.transactionCount - a.transactionCount);
  }

  private groupByStatus(payments: PaymentEntity[]): StatusBreakdown[] {
    const grouped = new Map<string, PaymentEntity[]>();

    for (const payment of payments) {
      const status = payment.status;
      if (!grouped.has(status)) {
        grouped.set(status, []);
      }
      grouped.get(status)!.push(payment);
    }

    const totalPayments = payments.length;
    const breakdown: StatusBreakdown[] = [];

    for (const [status, statusPayments] of grouped.entries()) {
      breakdown.push({
        status,
        count: statusPayments.length,
        totalAmount: statusPayments.reduce((sum, p) => sum + p.amount, 0),
        percentage: (statusPayments.length / totalPayments) * 100
      });
    }

    return breakdown.sort((a, b) => b.count - a.count);
  }

  private groupByDate(payments: PaymentEntity[]): DailyBreakdown[] {
    const grouped = new Map<string, PaymentEntity[]>();

    for (const payment of payments) {
      const date = payment.createdAt.toISOString().split('T')[0];
      if (!grouped.has(date)) {
        grouped.set(date, []);
      }
      grouped.get(date)!.push(payment);
    }

    const breakdown: DailyBreakdown[] = [];
    for (const [date, datePayments] of grouped.entries()) {
      breakdown.push({
        date,
        transactionCount: datePayments.length,
        totalAmount: datePayments.reduce((sum, p) => sum + p.amount, 0),
        successfulCount: datePayments.filter(p => p.status === PaymentStatus.CONFIRMED).length
      });
    }

    return breakdown.sort((a, b) => a.date.localeCompare(b.date));
  }

  private calculateAverageProcessingTime(payments: PaymentEntity[]): number {
    const confirmedPayments = payments.filter(p => p.confirmedAt);
    
    if (confirmedPayments.length === 0) return 0;

    const totalTime = confirmedPayments.reduce((sum, p) => {
      if (p.confirmedAt) {
        return sum + (p.confirmedAt.getTime() - p.initiatedAt.getTime());
      }
      return sum;
    }, 0);

    return Math.round(totalTime / confirmedPayments.length / 1000); // Convert to seconds
  }

  private getPaymentMethodDistribution(payments: PaymentEntity[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    
    for (const payment of payments) {
      const providerId = payment.providerId;
      distribution[providerId] = (distribution[providerId] || 0) + 1;
    }

    return distribution;
  }

  private identifyPeakHours(payments: PaymentEntity[]): number[] {
    const hourCounts = new Array(24).fill(0);

    for (const payment of payments) {
      const hour = payment.createdAt.getHours();
      hourCounts[hour]++;
    }

    // Find top 3 peak hours
    return hourCounts
      .map((count, hour) => ({ hour, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(item => item.hour);
  }

  private getTopProviders(payments: PaymentEntity[], limit: number): ProviderBreakdown[] {
    const byProvider = this.groupByProvider(payments);
    return byProvider.slice(0, limit);
  }

  private getDateRangeForPeriod(period: 'daily' | 'weekly' | 'monthly'): any {
    const endDate = new Date();
    const startDate = new Date();
    const previousEndDate = new Date();
    const previousStartDate = new Date();

    switch (period) {
      case 'daily':
        startDate.setHours(0, 0, 0, 0);
        previousEndDate.setDate(endDate.getDate() - 1);
        previousEndDate.setHours(23, 59, 59, 999);
        previousStartDate.setDate(startDate.getDate() - 1);
        previousStartDate.setHours(0, 0, 0, 0);
        break;

      case 'weekly':
        startDate.setDate(endDate.getDate() - 7);
        previousEndDate.setDate(startDate.getDate() - 1);
        previousStartDate.setDate(previousEndDate.getDate() - 7);
        break;

      case 'monthly':
        startDate.setDate(endDate.getDate() - 30);
        previousEndDate.setDate(startDate.getDate() - 1);
        previousStartDate.setDate(previousEndDate.getDate() - 30);
        break;
    }

    return {
      startDate,
      endDate,
      previousStartDate,
      previousEndDate
    };
  }
}

export default PaymentReportingService;

