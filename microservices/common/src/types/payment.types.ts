/**
 * Payment-related types
 */

export interface Payment {
  id: string;
  invoiceId: string;
  patientId: string;
  organizationId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  gateway?: PaymentGateway;
  metadata?: Record<string, any>;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type PaymentMethod = 
  | 'cash'
  | 'credit_card'
  | 'debit_card'
  | 'mobile_money'
  | 'bank_transfer'
  | 'insurance'
  | 'check';

export type PaymentStatus = 
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'refunded';

export type PaymentGateway = 
  | 'stripe'
  | 'paypal'
  | 'flutterwave'
  | 'paystack'
  | 'internal';

export interface CreatePaymentInput {
  invoiceId: string;
  patientId: string;
  organizationId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  gateway?: PaymentGateway;
  metadata?: Record<string, any>;
}

export interface ProcessPaymentInput {
  paymentId: string;
  transactionId: string;
  status: PaymentStatus;
  metadata?: Record<string, any>;
}

export interface PaymentGatewayConfig {
  gateway: PaymentGateway;
  apiKey: string;
  secretKey: string;
  webhookSecret?: string;
  environment: 'sandbox' | 'production';
}

