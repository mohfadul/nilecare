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

export enum ProviderType {
  BANK_CARD = 'bank_card',
  LOCAL_BANK = 'local_bank',
  MOBILE_WALLET = 'mobile_wallet',
  DIGITAL_WALLET = 'digital_wallet',
  CASH = 'cash',
  CHEQUE = 'cheque',
  BANK_TRANSFER = 'bank_transfer'
}

export enum VerificationType {
  MANUAL = 'manual',
  API_AUTO = 'api_auto',
  WEBHOOK = 'webhook',
  HYBRID = 'hybrid'
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

export class PaymentProviderEntity implements PaymentProvider {
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

  constructor(data: Partial<PaymentProvider>) {
    Object.assign(this, data);
    this.createdAt = this.createdAt || new Date();
    this.updatedAt = new Date();
  }

  /**
   * Check if provider is available
   */
  isAvailable(): boolean {
    return this.isActive && !this.isTestMode;
  }

  /**
   * Check if amount is within limits
   */
  isAmountValid(amount: number): boolean {
    if (this.minTransactionAmount && amount < this.minTransactionAmount) {
      return false;
    }
    if (this.maxTransactionAmount && amount > this.maxTransactionAmount) {
      return false;
    }
    return true;
  }

  /**
   * Check if currency is supported
   */
  isCurrencySupported(currency: string): boolean {
    return this.supportedCurrencies.includes(currency);
  }

  /**
   * Calculate fee for amount
   */
  calculateFee(amount: number): number {
    if (!this.feeStructure) {
      return 0;
    }

    let fee = (amount * this.feeStructure.percentage / 100) + this.feeStructure.fixedAmount;

    if (this.feeStructure.minFee && fee < this.feeStructure.minFee) {
      fee = this.feeStructure.minFee;
    }

    if (this.feeStructure.maxFee && fee > this.feeStructure.maxFee) {
      fee = this.feeStructure.maxFee;
    }

    return Math.round(fee * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Check if manual verification is required
   */
  requiresManualVerification(): boolean {
    return this.verificationType === VerificationType.MANUAL || 
           this.requiresManualApproval;
  }
}

export default PaymentProviderEntity;

