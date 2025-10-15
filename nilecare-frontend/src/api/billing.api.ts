import { apiClient, NileCareResponse } from './client';

export interface Invoice {
  id: number;
  patientId: number;
  facilityId: number;
  invoiceNumber: string;
  invoiceType: 'consultation' | 'procedure' | 'laboratory' | 'medication' | 'hospitalization' | 'other';
  invoiceDate: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: 'draft' | 'pending' | 'paid' | 'partially_paid' | 'overdue' | 'cancelled';
  currency: string;
  notes?: string;
  patientName?: string;
  facilityName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceLineItem {
  id: number;
  invoiceId: number;
  itemType: string;
  itemName: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  discountPercent?: number;
  discountAmount?: number;
  taxPercent?: number;
  taxAmount?: number;
  finalAmount: number;
}

export interface CreateInvoiceRequest {
  patientId: number;
  facilityId: number;
  invoiceType: string;
  invoiceDate: string;
  dueDate: string;
  currency?: string;
  notes?: string;
  lineItems: {
    itemType: string;
    itemName: string;
    description?: string;
    quantity: number;
    unitPrice: number;
    discountPercent?: number;
    taxPercent?: number;
  }[];
}

export interface InvoiceStatistics {
  totalInvoices: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  byStatus: {
    draft: number;
    pending: number;
    paid: number;
    partially_paid: number;
    overdue: number;
    cancelled: number;
  };
}

export const billingApi = {
  // Get invoices list
  async list(params: {
    page?: number;
    limit?: number;
    status?: string;
    patientId?: number;
    facilityId?: number;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<NileCareResponse<{ invoices: Invoice[] }>> {
    const response = await apiClient.get<NileCareResponse<{ invoices: Invoice[] }>>(
      '/api/v1/invoices',
      { params }
    );
    return response.data;
  },

  // Get single invoice
  async get(id: number): Promise<NileCareResponse<{ invoice: Invoice; lineItems: InvoiceLineItem[] }>> {
    const response = await apiClient.get<NileCareResponse<{ invoice: Invoice; lineItems: InvoiceLineItem[] }>>(
      `/api/v1/invoices/${id}`
    );
    return response.data;
  },

  // Create invoice
  async create(data: CreateInvoiceRequest): Promise<NileCareResponse<{ invoice: Invoice }>> {
    const response = await apiClient.post<NileCareResponse<{ invoice: Invoice }>>(
      '/api/v1/invoices',
      data
    );
    return response.data;
  },

  // Update invoice
  async update(id: number, data: Partial<CreateInvoiceRequest>): Promise<NileCareResponse<{ invoice: Invoice }>> {
    const response = await apiClient.put<NileCareResponse<{ invoice: Invoice }>>(
      `/api/v1/invoices/${id}`,
      data
    );
    return response.data;
  },

  // Cancel invoice
  async cancel(id: number): Promise<NileCareResponse<void>> {
    const response = await apiClient.delete<NileCareResponse<void>>(
      `/api/v1/invoices/${id}`
    );
    return response.data;
  },

  // Get invoice statistics
  async getStatistics(params?: {
    dateFrom?: string;
    dateTo?: string;
    facilityId?: number;
  }): Promise<NileCareResponse<InvoiceStatistics>> {
    const response = await apiClient.get<NileCareResponse<InvoiceStatistics>>(
      '/api/v1/invoices/statistics',
      { params }
    );
    return response.data;
  },

  // Sync payment status (updates invoice with payment gateway data)
  async syncPayment(id: number): Promise<NileCareResponse<{ invoice: Invoice }>> {
    const response = await apiClient.post<NileCareResponse<{ invoice: Invoice }>>(
      `/api/v1/invoices/${id}/sync-payment`
    );
    return response.data;
  },
};

