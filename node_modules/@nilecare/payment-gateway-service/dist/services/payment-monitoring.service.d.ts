/**
 * Payment Monitoring Service
 * Monitors payment system health and sends alerts
 */
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
export declare class PaymentMonitoringService {
    private healthCheckInterval;
    /**
     * Start continuous monitoring
     */
    startMonitoring(): void;
    /**
     * Stop monitoring
     */
    stopMonitoring(): void;
    /**
     * Monitor payment system health
     */
    monitorPaymentHealth(): Promise<PaymentHealthStatus>;
    /**
     * Collect payment metrics
     */
    private collectPaymentMetrics;
    /**
     * Check for critical issues
     */
    private checkCriticalIssues;
    /**
     * Check provider health
     */
    private checkProviderHealth;
    /**
     * Check processing times
     */
    private checkProcessingTimes;
    /**
     * Check pending verifications
     */
    private checkPendingVerifications;
    /**
     * Send alert
     */
    private sendAlert;
    /**
     * Get provider health status
     */
    private getProviderHealthStatus;
    /**
     * Check individual provider status
     */
    private checkProviderStatus;
    /**
     * Metric collection methods
     */
    private getTotalPayments;
    private getFailedPayments;
    private getPendingVerifications;
    private getReconciliationIssues;
    private getAverageProcessingTime;
    /**
     * Export metrics for Prometheus
     */
    exportPrometheusMetrics(): Promise<string>;
}
export default PaymentMonitoringService;
//# sourceMappingURL=payment-monitoring.service.d.ts.map