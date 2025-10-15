import { apiClient, NileCareResponse } from './client';

export interface Payment {
  id: string;
  patientId: number;
  invoiceId?: number;
  amount: number;
  currency: string;
  provider: 'zain_cash' | 'mtn_money' | 'sudani_cash' | 'bankak' | 'stripe' | 'paypal' | 'bank_transfer' | 'cash';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'cancelled';
  description?: string;
  merchantReference?: string;
  paymentUrl?: string;
  expiresAt?: string;
  confirmedAt?: string;
  patientName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentRequest {
  patientId: number;
  amount: number;
  currency: string;
  provider: string;
  description?: string;
  invoiceId?: number;
  returnUrl?: string;
  cancelUrl?: string;
}

export interface PaymentProvider {
  id: string;
  name: string;
  type: 'mobile_wallet' | 'card' | 'bank_transfer' | 'cash';
  available: boolean;
  currencies: string[];
  logo?: string;
}

export interface PaymentHistory {
  totalPayments: number;
  totalAmount: number;
  successRate: number;
  payments: Payment[];
}

export const paymentsApi = {
  // Get payment providers
  async getProviders(): Promise<NileCareResponse<{ providers: PaymentProvider[] }>> {
    const response = await apiClient.get<NileCareResponse<{ providers: PaymentProvider[] }>>(
      '/api/payments/providers'
    );
    return response.data;
  },

  // Create payment
  async create(data: CreatePaymentRequest): Promise<NileCareResponse<{ payment: Payment }>> {
    const response = await apiClient.post<NileCareResponse<{ payment: Payment }>>(
      '/api/payments',
      data
    );
    return response.data;
  },

  // Get payment details
  async get(id: string): Promise<NileCareResponse<{ payment: Payment }>> {
    const response = await apiClient.get<NileCareResponse<{ payment: Payment }>>(
      `/api/payments/${id}`
    );
    return response.data;
  },

  // Verify payment
  async verify(id: string): Promise<NileCareResponse<{ payment: Payment }>> {
    const response = await apiClient.post<NileCareResponse<{ payment: Payment }>>(
      `/api/payments/${id}/verify`
    );
    return response.data;
  },

  // Process refund
  async refund(id: string, data: {
    amount: number;
    reason: string;
  }): Promise<NileCareResponse<{ payment: Payment }>> {
    const response = await apiClient.post<NileCareResponse<{ payment: Payment }>>(
      `/api/payments/${id}/refund`,
      data
    );
    return response.data;
  },

  // Get payment history
  async getHistory(patientId?: number): Promise<NileCareResponse<PaymentHistory>> {
    const response = await apiClient.get<NileCareResponse<PaymentHistory>>(
      '/api/payments/history',
      { params: { patientId } }
    );
    return response.data;
  },

  // Get payments for invoice
  async getByInvoice(invoiceId: number): Promise<NileCareResponse<{ payments: Payment[] }>> {
    const response = await apiClient.get<NileCareResponse<{ payments: Payment[] }>>(
      '/api/payments',
      { params: { invoiceId } }
    );
    return response.data;
  },
};

