/**
 * Billing-related types
 */

export interface Invoice {
  id: string;
  invoiceNumber: string;
  patientId: string;
  organizationId: string;
  appointmentId?: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  currency: string;
  status: InvoiceStatus;
  dueDate: Date;
  paidAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  category: string;
}

export type InvoiceStatus = 
  | 'draft'
  | 'pending'
  | 'paid'
  | 'partially_paid'
  | 'overdue'
  | 'cancelled'
  | 'refunded';

export interface CreateInvoiceInput {
  patientId: string;
  organizationId: string;
  appointmentId?: string;
  items: Omit<InvoiceItem, 'id'>[];
  tax?: number;
  discount?: number;
  currency?: string;
  dueDate: Date;
  notes?: string;
}

export interface UpdateInvoiceInput {
  items?: Omit<InvoiceItem, 'id'>[];
  tax?: number;
  discount?: number;
  status?: InvoiceStatus;
  dueDate?: Date;
  notes?: string;
}

export interface BillingReport {
  totalRevenue: number;
  paidInvoices: number;
  pendingInvoices: number;
  overdueInvoices: number;
  period: {
    start: Date;
    end: Date;
  };
}

