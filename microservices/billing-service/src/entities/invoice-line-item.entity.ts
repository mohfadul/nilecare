/**
 * Invoice Line Item Entity
 * Represents a line item on an invoice
 */

export interface InvoiceLineItem {
  id: string;
  invoiceId: string;
  lineNumber: number;
  
  // Item Details
  itemType: LineItemType;
  itemCode?: string;
  itemName: string;
  itemDescription?: string;
  
  // Coding (for insurance)
  procedureCode?: string;
  diagnosisCodes?: string[];
  revenueCode?: string;
  modifierCodes?: string;
  
  // Quantity & Pricing
  quantity: number;
  unitOfMeasure: string;
  unitPrice: number;
  discountPercent: number;
  discountAmount: number;
  taxPercent: number;
  taxAmount: number;
  lineTotal: number;
  
  // Service Details
  serviceDate?: Date;
  serviceProviderId?: string;
  departmentId?: string;
  
  // Reference
  referenceId?: string;
  referenceType?: string;
  
  // Metadata
  notes?: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export enum LineItemType {
  SERVICE = 'service',
  MEDICATION = 'medication',
  SUPPLY = 'supply',
  EQUIPMENT = 'equipment',
  ROOM_CHARGE = 'room_charge',
  LAB_TEST = 'lab_test',
  RADIOLOGY = 'radiology',
  PROCEDURE = 'procedure',
  CONSULTATION = 'consultation',
  OTHER = 'other'
}

export class InvoiceLineItemEntity implements InvoiceLineItem {
  id: string;
  invoiceId: string;
  lineNumber: number;
  itemType: LineItemType;
  itemCode?: string;
  itemName: string;
  itemDescription?: string;
  procedureCode?: string;
  diagnosisCodes?: string[];
  revenueCode?: string;
  modifierCodes?: string;
  quantity: number;
  unitOfMeasure: string;
  unitPrice: number;
  discountPercent: number;
  discountAmount: number;
  taxPercent: number;
  taxAmount: number;
  lineTotal: number;
  serviceDate?: Date;
  serviceProviderId?: string;
  departmentId?: string;
  referenceId?: string;
  referenceType?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: Partial<InvoiceLineItem>) {
    Object.assign(this, data);
    this.createdAt = this.createdAt || new Date();
    this.updatedAt = new Date();
  }

  /**
   * Calculate line total
   */
  calculateTotal(): number {
    const baseAmount = this.quantity * this.unitPrice;
    const afterDiscount = baseAmount - this.discountAmount;
    const withTax = afterDiscount + this.taxAmount;
    return Math.round(withTax * 100) / 100;
  }

  /**
   * Apply discount percentage
   */
  applyDiscountPercent(percent: number): void {
    this.discountPercent = percent;
    this.discountAmount = (this.quantity * this.unitPrice * percent) / 100;
    this.lineTotal = this.calculateTotal();
    this.updatedAt = new Date();
  }

  /**
   * Apply tax percentage
   */
  applyTaxPercent(percent: number): void {
    this.taxPercent = percent;
    const afterDiscount = (this.quantity * this.unitPrice) - this.discountAmount;
    this.taxAmount = (afterDiscount * percent) / 100;
    this.lineTotal = this.calculateTotal();
    this.updatedAt = new Date();
  }
}

export default InvoiceLineItemEntity;

