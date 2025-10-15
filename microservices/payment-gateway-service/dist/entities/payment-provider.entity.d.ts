/**
 * Payment Provider Entity
 * Represents a payment provider configuration
 */
export interface PaymentProvider {
    id: string;
    name: string;
    displayName: string;
    providerType: ProviderType;
    isActive: boolean;
    isTestMode: boolean;
    verificationType: VerificationType;
    requiresManualApproval: boolean;
    apiConfig?: ApiConfig;
    supportedCurrencies: string[];
    supportsRefunds: boolean;
    supportsPartialRefunds: boolean;
    supportsInstallments: boolean;
    feeStructure?: FeeStructure;
    minTransactionAmount?: number;
    maxTransactionAmount?: number;
    dailyTransactionLimit?: number;
    avgProcessingTime: number;
    maxProcessingTime: number;
    supportPhone?: string;
    supportEmail?: string;
    supportUrl?: string;
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
export declare enum ProviderType {
    BANK_CARD = "bank_card",
    LOCAL_BANK = "local_bank",
    MOBILE_WALLET = "mobile_wallet",
    DIGITAL_WALLET = "digital_wallet",
    CASH = "cash",
    CHEQUE = "cheque",
    BANK_TRANSFER = "bank_transfer"
}
export declare enum VerificationType {
    MANUAL = "manual",
    API_AUTO = "api_auto",
    WEBHOOK = "webhook",
    HYBRID = "hybrid"
}
export interface ApiConfig {
    baseUrl: string;
    apiKey: string;
    apiSecret?: string;
    merchantId?: string;
    webhookUrl?: string;
    timeoutSeconds: number;
}
export interface FeeStructure {
    percentage: number;
    fixedAmount: number;
    minFee?: number;
    maxFee?: number;
    currency: string;
}
export declare class PaymentProviderEntity implements PaymentProvider {
    id: string;
    name: string;
    displayName: string;
    providerType: ProviderType;
    isActive: boolean;
    isTestMode: boolean;
    verificationType: VerificationType;
    requiresManualApproval: boolean;
    apiConfig?: ApiConfig;
    supportedCurrencies: string[];
    supportsRefunds: boolean;
    supportsPartialRefunds: boolean;
    supportsInstallments: boolean;
    feeStructure?: FeeStructure;
    minTransactionAmount?: number;
    maxTransactionAmount?: number;
    dailyTransactionLimit?: number;
    avgProcessingTime: number;
    maxProcessingTime: number;
    supportPhone?: string;
    supportEmail?: string;
    supportUrl?: string;
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
    constructor(data: Partial<PaymentProvider>);
    /**
     * Check if provider is available
     */
    isAvailable(): boolean;
    /**
     * Check if amount is within limits
     */
    isAmountValid(amount: number): boolean;
    /**
     * Check if currency is supported
     */
    isCurrencySupported(currency: string): boolean;
    /**
     * Calculate fee for amount
     */
    calculateFee(amount: number): number;
    /**
     * Check if manual verification is required
     */
    requiresManualVerification(): boolean;
}
export default PaymentProviderEntity;
//# sourceMappingURL=payment-provider.entity.d.ts.map