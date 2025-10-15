/**
 * Payment Monitoring Service
 * Monitors payment system health and sends alerts
 */

// import { PaymentEntity } from '../entities/payment.entity';

export interface PaymentHealthStatus {
  totalPayments: number;
  failedPayments: number;
  pendingVerifications: number;
  reconciliationIssues: number;
  failureRate: number;
  avgProcessingTime: number;
  providerHealth: ProviderHealthStatus[];
  lastUpdated: Date;
}

export interface ProviderHealthStatus {
  providerName: string;
  isActive: boolean;
  successRate: number;
  avgResponseTime: number;
  totalTransactions: number;
  failedTransactions: number;
  lastSuccessfulTransaction?: Date;
  lastFailedTransaction?: Date;
  status: 'healthy' | 'degraded' | 'down';
}

export interface Alert {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details: any;
  timestamp: Date;
}

export class PaymentMonitoringService {
  private healthCheckInterval: NodeJS.Timeout | null = null;

  /**
   * Start continuous monitoring
   */
  startMonitoring(): void {
    console.log('Starting payment monitoring...');

    // Check health every 60 seconds
    this.healthCheckInterval = setInterval(async () => {
      await this.monitorPaymentHealth();
    }, 60000);

    // Initial check
    this.monitorPaymentHealth();
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  /**
   * Monitor payment system health
   */
  async monitorPaymentHealth(): Promise<PaymentHealthStatus> {
    try {
      const metrics = await this.collectPaymentMetrics();

      // Check for critical issues
      await this.checkCriticalIssues(metrics);

      // Check provider health
      await this.checkProviderHealth(metrics.providerHealth);

      // Check processing times
      await this.checkProcessingTimes(metrics.avgProcessingTime);

      // Check pending verifications
      await this.checkPendingVerifications(metrics.pendingVerifications);

      return metrics;

    } catch (error: any) {
      console.error('Health monitoring error:', error);
      
      await this.sendAlert({
        type: 'monitoring_error',
        severity: 'high',
        message: 'Payment monitoring system encountered an error',
        details: { error: error.message },
        timestamp: new Date()
      });

      throw error;
    }
  }

  /**
   * Collect payment metrics
   */
  private async collectPaymentMetrics(): Promise<PaymentHealthStatus> {
    // Get last 24 hours of data
    const endDate = new Date();
    const startDate = new Date();
    startDate.setHours(startDate.getHours() - 24);

    const totalPayments = await this.getTotalPayments(startDate, endDate);
    const failedPayments = await this.getFailedPayments(startDate, endDate);
    const pendingVerifications = await this.getPendingVerifications();
    const reconciliationIssues = await this.getReconciliationIssues();
    const avgProcessingTime = await this.getAverageProcessingTime(startDate, endDate);
    const providerHealth = await this.getProviderHealthStatus();

    return {
      totalPayments,
      failedPayments,
      pendingVerifications,
      reconciliationIssues,
      failureRate: totalPayments > 0 ? failedPayments / totalPayments : 0,
      avgProcessingTime,
      providerHealth,
      lastUpdated: new Date()
    };
  }

  /**
   * Check for critical issues
   */
  private async checkCriticalIssues(metrics: PaymentHealthStatus): Promise<void> {
    // High failure rate
    if (metrics.failureRate > 0.1) { // 10% failure rate
      await this.sendAlert({
        type: 'payment_failure_rate_high',
        severity: 'critical',
        message: `Payment failure rate is ${(metrics.failureRate * 100).toFixed(2)}%`,
        details: metrics,
        timestamp: new Date()
      });
    }

    // Too many pending verifications
    if (metrics.pendingVerifications > 100) {
      await this.sendAlert({
        type: 'pending_verifications_high',
        severity: 'high',
        message: `${metrics.pendingVerifications} payments pending verification`,
        details: { count: metrics.pendingVerifications },
        timestamp: new Date()
      });
    }

    // Reconciliation issues
    if (metrics.reconciliationIssues > 50) {
      await this.sendAlert({
        type: 'reconciliation_issues_high',
        severity: 'medium',
        message: `${metrics.reconciliationIssues} unresolved reconciliation issues`,
        details: { count: metrics.reconciliationIssues },
        timestamp: new Date()
      });
    }
  }

  /**
   * Check provider health
   */
  private async checkProviderHealth(providers: ProviderHealthStatus[]): Promise<void> {
    for (const provider of providers) {
      // Provider down
      if (provider.status === 'down') {
        await this.sendAlert({
          type: 'provider_down',
          severity: 'critical',
          message: `Payment provider ${provider.providerName} is down`,
          details: provider,
          timestamp: new Date()
        });
      }

      // Provider degraded
      if (provider.status === 'degraded') {
        await this.sendAlert({
          type: 'provider_degraded',
          severity: 'high',
          message: `Payment provider ${provider.providerName} is experiencing issues`,
          details: provider,
          timestamp: new Date()
        });
      }

      // Low success rate
      if (provider.successRate < 90) {
        await this.sendAlert({
          type: 'provider_low_success_rate',
          severity: 'medium',
          message: `Provider ${provider.providerName} success rate is ${provider.successRate.toFixed(2)}%`,
          details: provider,
          timestamp: new Date()
        });
      }
    }
  }

  /**
   * Check processing times
   */
  private async checkProcessingTimes(avgTime: number): Promise<void> {
    // Average processing time too high
    if (avgTime > 60) { // 60 seconds
      await this.sendAlert({
        type: 'processing_time_high',
        severity: 'medium',
        message: `Average payment processing time is ${avgTime} seconds`,
        details: { avgProcessingTime: avgTime },
        timestamp: new Date()
      });
    }
  }

  /**
   * Check pending verifications
   */
  private async checkPendingVerifications(count: number): Promise<void> {
    if (count > 50) {
      await this.sendAlert({
        type: 'pending_verifications_high',
        severity: 'high',
        message: `${count} payments pending manual verification`,
        details: { count },
        timestamp: new Date()
      });
    }
  }

  /**
   * Send alert
   */
  private async sendAlert(alert: Alert): Promise<void> {
    try {
      console.log(`[ALERT] ${alert.severity.toUpperCase()}: ${alert.message}`);

      // In production: Send to AlertManager, PagerDuty, Slack, etc.
      // if (alert.severity === 'critical') {
      //   await this.pagerDutyService.triggerIncident(alert);
      // }
      
      // if (alert.severity === 'high' || alert.severity === 'critical') {
      //   await this.slackService.sendAlert(alert);
      // }

      // await this.emailService.sendAlert(alert);

    } catch (error: any) {
      console.error('Alert sending error:', error);
    }
  }

  /**
   * Get provider health status
   */
  private async getProviderHealthStatus(): Promise<ProviderHealthStatus[]> {
    const providers = [
      'bank_of_khartoum',
      'faisal_islamic',
      'omdurman_national',
      'zain_cash',
      'mtn_money',
      'sudani_cash',
      'bankak',
      'visa',
      'mastercard',
      'cash',
      'cheque',
      'bank_transfer'
    ];

    const healthStatus: ProviderHealthStatus[] = [];

    for (const providerName of providers) {
      const status = await this.checkProviderStatus(providerName);
      healthStatus.push(status);
    }

    return healthStatus;
  }

  /**
   * Check individual provider status
   */
  private async checkProviderStatus(providerName: string): Promise<ProviderHealthStatus> {
    // In production: Query actual provider metrics
    // const last24Hours = new Date();
    // last24Hours.setHours(last24Hours.getHours() - 24);

    // const payments = await this.paymentRepository.find({
    //   where: {
    //     providerName,
    //     createdAt: MoreThan(last24Hours)
    //   }
    // });

    // Mock data for now
    return {
      providerName,
      isActive: true,
      successRate: 95.5,
      avgResponseTime: 15,
      totalTransactions: 100,
      failedTransactions: 5,
      status: 'healthy'
    };
  }

  /**
   * Metric collection methods
   */

  private async getTotalPayments(_startDate: Date, _endDate: Date): Promise<number> {
    // In production: Query from database
    // return await this.paymentRepository.count({
    //   where: {
    //     createdAt: Between(startDate, endDate)
    //   }
    // });
    return 0;
  }

  private async getFailedPayments(_startDate: Date, _endDate: Date): Promise<number> {
    // In production: Query from database
    // return await this.paymentRepository.count({
    //   where: {
    //     createdAt: Between(startDate, endDate),
    //     status: In([PaymentStatus.FAILED, PaymentStatus.REJECTED])
    //   }
    // });
    return 0;
  }

  private async getPendingVerifications(): Promise<number> {
    // In production: Query from database
    // return await this.paymentRepository.count({
    //   where: {
    //     status: PaymentStatus.AWAITING_VERIFICATION
    //   }
    // });
    return 0;
  }

  private async getReconciliationIssues(): Promise<number> {
    // In production: Query from reconciliation table
    // return await this.reconciliationRepository.count({
    //   where: {
    //     reconciliationStatus: In(['mismatch', 'investigating'])
    //   }
    // });
    return 0;
  }

  private async getAverageProcessingTime(_startDate: Date, _endDate: Date): Promise<number> {
    // In production: Calculate from confirmed payments
    // const confirmedPayments = await this.paymentRepository.find({
    //   where: {
    //     createdAt: Between(startDate, endDate),
    //     status: PaymentStatus.CONFIRMED
    //   }
    // });

    // if (confirmedPayments.length === 0) return 0;

    // const totalTime = confirmedPayments.reduce((sum, p) => {
    //   if (p.confirmedAt) {
    //     return sum + (p.confirmedAt.getTime() - p.initiatedAt.getTime());
    //   }
    //   return sum;
    // }, 0);

    // return Math.round(totalTime / confirmedPayments.length / 1000);

    return 15; // 15 seconds average
  }

  /**
   * Export metrics for Prometheus
   */
  async exportPrometheusMetrics(): Promise<string> {
    const metrics = await this.collectPaymentMetrics();

    return `
# HELP payment_total_count Total number of payments
# TYPE payment_total_count counter
payment_total_count ${metrics.totalPayments}

# HELP payment_failed_count Total number of failed payments
# TYPE payment_failed_count counter
payment_failed_count ${metrics.failedPayments}

# HELP payment_pending_verifications Number of payments pending verification
# TYPE payment_pending_verifications gauge
payment_pending_verifications ${metrics.pendingVerifications}

# HELP payment_reconciliation_issues Number of unresolved reconciliation issues
# TYPE payment_reconciliation_issues gauge
payment_reconciliation_issues ${metrics.reconciliationIssues}

# HELP payment_failure_rate Payment failure rate (0-1)
# TYPE payment_failure_rate gauge
payment_failure_rate ${metrics.failureRate}

# HELP payment_avg_processing_time_seconds Average payment processing time in seconds
# TYPE payment_avg_processing_time_seconds gauge
payment_avg_processing_time_seconds ${metrics.avgProcessingTime}

# Provider health metrics
${metrics.providerHealth.map(provider => `
# HELP payment_provider_success_rate_${provider.providerName} Success rate for ${provider.providerName}
# TYPE payment_provider_success_rate_${provider.providerName} gauge
payment_provider_success_rate_${provider.providerName} ${provider.successRate / 100}

# HELP payment_provider_avg_response_time_${provider.providerName} Average response time for ${provider.providerName}
# TYPE payment_provider_avg_response_time_${provider.providerName} gauge
payment_provider_avg_response_time_${provider.providerName} ${provider.avgResponseTime}
`).join('\n')}
    `.trim();
  }
}

export default PaymentMonitoringService;

