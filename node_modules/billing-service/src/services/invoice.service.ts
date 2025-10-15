/**
 * Invoice Service
 * Business logic for invoice management
 * 
 * ✅ NO PAYMENT PROCESSING - delegates to Payment Gateway
 * ✅ All authentication via Auth Service
 * ✅ Comprehensive audit logging
 */

import { v4 as uuidv4 } from 'uuid';
import { InvoiceEntity, InvoiceStatus } from '../entities/invoice.entity';
import { InvoiceLineItemEntity } from '../entities/invoice-line-item.entity';
import InvoiceRepository from '../repositories/invoice.repository';
import InvoiceLineItemRepository from '../repositories/invoice-line-item.repository';
import BillingAccountRepository from '../repositories/billing-account.repository';
import PaymentGatewayClient from './payment-gateway-client.service';
import { logBillingAction } from '../middleware/audit-logger.middleware';
import { CreateInvoiceDto } from '../dtos/create-invoice.dto';
import { UpdateInvoiceDto } from '../dtos/update-invoice.dto';
import DatabaseConfig from '../config/database.config';
import { logger } from '../config/logger.config';

export class InvoiceService {
  private invoiceRepository: InvoiceRepository;
  private lineItemRepository: InvoiceLineItemRepository;
  private accountRepository: BillingAccountRepository;

  constructor() {
    this.invoiceRepository = new InvoiceRepository();
    this.lineItemRepository = new InvoiceLineItemRepository();
    this.accountRepository = new BillingAccountRepository();
  }

  /**
   * Create new invoice
   */
  async createInvoice(
    createDto: CreateInvoiceDto,
    userId: string
  ): Promise<any> {
    try {
      return await DatabaseConfig.transaction(async (connection) => {
        // Generate invoice number
        const invoiceNumber = await this.invoiceRepository.generateInvoiceNumber(
          createDto.facilityId
        );

        // Calculate totals from line items
        const subtotal = createDto.lineItems.reduce(
          (sum, item) => sum + (item.quantity * item.unitPrice - (item.discountAmount || 0)),
          0
        );

        const totalTax = createDto.taxAmount || createDto.lineItems.reduce(
          (sum, item) => sum + (item.taxAmount || 0),
          0
        );

        const totalAmount = subtotal + totalTax - (createDto.discountAmount || 0) + (createDto.adjustmentAmount || 0);

        // Create invoice entity
        const invoice = new InvoiceEntity({
          id: uuidv4(),
          invoiceNumber,
          patientId: createDto.patientId,
          facilityId: createDto.facilityId,
          billingAccountId: createDto.billingAccountId,
          encounterId: createDto.encounterId,
          appointmentId: createDto.appointmentId,
          invoiceType: createDto.invoiceType,
          subtotal,
          taxAmount: totalTax,
          discountAmount: createDto.discountAmount || 0,
          adjustmentAmount: createDto.adjustmentAmount || 0,
          totalAmount,
          paidAmount: 0,
          balanceDue: totalAmount,
          currency: createDto.currency || 'SDG',
          exchangeRate: 1.0,
          status: InvoiceStatus.DRAFT,
          invoiceDate: new Date(createDto.invoiceDate),
          dueDate: new Date(createDto.dueDate),
          paymentTerms: createDto.paymentTerms || 'Net 30',
          gracePeriodDays: createDto.gracePeriodDays || 7,
          lateFeePercentage: createDto.lateFeePercentage || 2.0,
          lateFeesApplied: 0,
          insurancePolicyId: createDto.insurancePolicyId,
          insuranceCompany: createDto.insuranceCompany,
          insuranceAuthorizationNumber: createDto.insuranceAuthorizationNumber,
          description: createDto.description,
          internalNotes: createDto.internalNotes,
          patientNotes: createDto.patientNotes,
          createdBy: userId,
          createdAt: new Date(),
          updatedAt: new Date()
        });

        // Save invoice
        await this.invoiceRepository.create(invoice);

        // Save line items
        for (let i = 0; i < createDto.lineItems.length; i++) {
          const item = createDto.lineItems[i];
          
          const lineTotal = (item.quantity * item.unitPrice) - (item.discountAmount || 0) + (item.taxAmount || 0);
          
          const lineItem = new InvoiceLineItemEntity({
            id: uuidv4(),
            invoiceId: invoice.id,
            lineNumber: i + 1,
            itemType: item.itemType as any,
            itemCode: item.itemCode,
            itemName: item.itemName,
            itemDescription: item.itemDescription,
            procedureCode: item.procedureCode,
            diagnosisCodes: item.diagnosisCodes,
            revenueCode: item.revenueCode,
            modifierCodes: item.modifierCodes,
            quantity: item.quantity,
            unitOfMeasure: item.unitOfMeasure || 'each',
            unitPrice: item.unitPrice,
            discountPercent: item.discountPercent || 0,
            discountAmount: item.discountAmount || 0,
            taxPercent: item.taxPercent || 0,
            taxAmount: item.taxAmount || 0,
            lineTotal,
            serviceDate: item.serviceDate ? new Date(item.serviceDate) : undefined,
            serviceProviderId: item.serviceProviderId,
            departmentId: item.departmentId,
            referenceId: item.referenceId,
            referenceType: item.referenceType,
            notes: item.notes,
            createdAt: new Date(),
            updatedAt: new Date()
          });

          await this.lineItemRepository.create(lineItem, connection);
        }

        // Update billing account if exists
        if (invoice.billingAccountId) {
          const account = await this.accountRepository.findById(invoice.billingAccountId);
          if (account) {
            account.applyCharge(invoice.totalAmount);
            account.updatedBy = userId;
            await this.accountRepository.update(account);
          }
        }

        // Audit log
        await logBillingAction({
          action: 'invoice_created',
          resourceType: 'invoice',
          resourceId: invoice.id,
          userId,
          result: 'success',
          newValues: {
            invoiceNumber,
            patientId: invoice.patientId,
            totalAmount: invoice.totalAmount,
            status: invoice.status
          },
          metadata: {
            lineItemsCount: createDto.lineItems.length
          }
        });

        logger.info('Invoice created', {
          invoiceId: invoice.id,
          invoiceNumber,
          patientId: invoice.patientId,
          totalAmount: invoice.totalAmount,
          userId
        });

        // Finalize invoice (mark as pending)
        invoice.status = InvoiceStatus.PENDING;
        await this.invoiceRepository.update(invoice, connection);

        return await this.getInvoiceWithLineItems(invoice.id);
      });

    } catch (error: any) {
      logger.error('Failed to create invoice', {
        error: error.message,
        userId
      });

      await logBillingAction({
        action: 'invoice_created',
        resourceType: 'invoice',
        resourceId: 'N/A',
        userId,
        result: 'failure',
        errorMessage: error.message
      });

      throw new Error(`Failed to create invoice: ${error.message}`);
    }
  }

  /**
   * Get invoice by ID with line items
   */
  async getInvoiceWithLineItems(invoiceId: string): Promise<any> {
    const invoice = await this.invoiceRepository.findById(invoiceId);
    
    if (!invoice) {
      return null;
    }

    const lineItems = await this.lineItemRepository.findByInvoiceId(invoiceId);

    // Get payment info from Payment Gateway
    const payments = await PaymentGatewayClient.getPaymentsForInvoice(invoiceId);

    return {
      ...invoice,
      lineItems,
      payments
    };
  }

  /**
   * Update invoice
   */
  async updateInvoice(
    invoiceId: string,
    updateDto: UpdateInvoiceDto,
    userId: string
  ): Promise<any> {
    try {
      const invoice = await this.invoiceRepository.findById(invoiceId);
      
      if (!invoice) {
        throw new Error('Invoice not found');
      }

      // Cannot update paid or cancelled invoices
      if (invoice.status === InvoiceStatus.PAID || invoice.status === InvoiceStatus.CANCELLED) {
        throw new Error(`Cannot update invoice in status: ${invoice.status}`);
      }

      const oldValues = { ...invoice };

      // Apply updates
      if (updateDto.taxAmount !== undefined) invoice.taxAmount = updateDto.taxAmount;
      if (updateDto.discountAmount !== undefined) invoice.discountAmount = updateDto.discountAmount;
      if (updateDto.adjustmentAmount !== undefined) invoice.adjustmentAmount = updateDto.adjustmentAmount;
      if (updateDto.dueDate) invoice.dueDate = new Date(updateDto.dueDate);
      if (updateDto.description) invoice.description = updateDto.description;
      if (updateDto.internalNotes) invoice.internalNotes = updateDto.internalNotes;
      if (updateDto.patientNotes) invoice.patientNotes = updateDto.patientNotes;
      
      // Recalculate total
      invoice.totalAmount = invoice.subtotal + invoice.taxAmount - invoice.discountAmount + invoice.adjustmentAmount;
      invoice.updatedBy = userId;

      await this.invoiceRepository.update(invoice);

      // Audit log
      await logBillingAction({
        action: 'invoice_updated',
        resourceType: 'invoice',
        resourceId: invoice.id,
        userId,
        result: 'success',
        oldValues: { totalAmount: oldValues.totalAmount },
        newValues: { totalAmount: invoice.totalAmount },
        changesSummary: 'Invoice updated'
      });

      logger.info('Invoice updated', {
        invoiceId,
        userId
      });

      return await this.getInvoiceWithLineItems(invoiceId);

    } catch (error: any) {
      logger.error('Failed to update invoice', {
        invoiceId,
        error: error.message,
        userId
      });
      throw error;
    }
  }

  /**
   * Apply payment to invoice (called when payment confirmed)
   */
  async applyPayment(
    invoiceId: string,
    paymentId: string,
    amount: number,
    userId: string
  ): Promise<any> {
    try {
      const invoice = await this.invoiceRepository.findById(invoiceId);
      
      if (!invoice) {
        throw new Error('Invoice not found');
      }

      const oldStatus = invoice.status;

      // Apply payment
      invoice.applyPartialPayment(amount, new Date());
      invoice.updatedBy = userId;

      await this.invoiceRepository.update(invoice);

      // Update billing account
      if (invoice.billingAccountId) {
        const account = await this.accountRepository.findById(invoice.billingAccountId);
        if (account) {
          account.applyPayment(amount, new Date());
          account.updatedBy = userId;
          await this.accountRepository.update(account);
        }
      }

      // Audit log
      await logBillingAction({
        action: 'payment_applied',
        resourceType: 'invoice',
        resourceId: invoice.id,
        userId,
        result: 'success',
        oldValues: { status: oldStatus, paidAmount: oldStatus === InvoiceStatus.PAID ? invoice.totalAmount : 0 },
        newValues: { status: invoice.status, paidAmount: invoice.paidAmount },
        changesSummary: `Payment of ${amount} ${invoice.currency} applied`,
        metadata: { paymentId, amount }
      });

      logger.info('Payment applied to invoice', {
        invoiceId,
        paymentId,
        amount,
        newStatus: invoice.status,
        userId
      });

      return await this.getInvoiceWithLineItems(invoiceId);

    } catch (error: any) {
      logger.error('Failed to apply payment to invoice', {
        invoiceId,
        paymentId,
        error: error.message,
        userId
      });
      throw error;
    }
  }

  /**
   * Mark invoice as overdue (called by cron job)
   */
  async markOverdueInvoices(): Promise<number> {
    try {
      const today = new Date();
      
      // Find invoices past due date with balance
      const filters = {
        status: InvoiceStatus.PENDING
      };
      
      const { invoices } = await this.invoiceRepository.findWithFilters(filters, 1, 1000);
      
      let marked = 0;
      for (const invoice of invoices) {
        if (invoice.dueDate < today && invoice.balanceDue > 0) {
          invoice.markAsOverdue();
          await this.invoiceRepository.update(invoice);
          marked++;
        }
      }

      logger.info('Marked overdue invoices', { count: marked });
      return marked;

    } catch (error: any) {
      logger.error('Failed to mark overdue invoices', { error: error.message });
      throw error;
    }
  }

  /**
   * Cancel invoice
   */
  async cancelInvoice(invoiceId: string, userId: string, reason?: string): Promise<any> {
    try {
      const invoice = await this.invoiceRepository.findById(invoiceId);
      
      if (!invoice) {
        throw new Error('Invoice not found');
      }

      // Can only cancel draft or pending invoices
      if (![InvoiceStatus.DRAFT, InvoiceStatus.PENDING].includes(invoice.status)) {
        throw new Error(`Cannot cancel invoice in status: ${invoice.status}`);
      }

      const oldStatus = invoice.status;
      invoice.status = InvoiceStatus.CANCELLED;
      invoice.internalNotes = (invoice.internalNotes || '') + `\n[CANCELLED] ${reason || 'No reason provided'}`;
      invoice.updatedBy = userId;

      await this.invoiceRepository.update(invoice);

      // Audit log
      await logBillingAction({
        action: 'invoice_cancelled',
        resourceType: 'invoice',
        resourceId: invoice.id,
        userId,
        result: 'success',
        oldValues: { status: oldStatus },
        newValues: { status: invoice.status },
        changesSummary: `Invoice cancelled: ${reason || 'No reason'}`
      });

      logger.info('Invoice cancelled', {
        invoiceId,
        reason,
        userId
      });

      return await this.getInvoiceWithLineItems(invoiceId);

    } catch (error: any) {
      logger.error('Failed to cancel invoice', {
        invoiceId,
        error: error.message,
        userId
      });
      throw error;
    }
  }

  /**
   * List invoices with filters
   */
  async listInvoices(filters: any, page: number = 1, limit: number = 50): Promise<any> {
    const result = await this.invoiceRepository.findWithFilters(filters, page, limit);
    
    return {
      invoices: result.invoices,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit)
      }
    };
  }

  /**
   * Get invoice statistics
   */
  async getStatistics(filters: any): Promise<any> {
    return await this.invoiceRepository.getStatistics(filters);
  }

  /**
   * Sync payment status from Payment Gateway
   * This checks Payment Gateway for any new payments and updates invoices
   */
  async syncPaymentStatus(invoiceId: string, userId: string): Promise<any> {
    try {
      const invoice = await this.invoiceRepository.findById(invoiceId);
      
      if (!invoice) {
        throw new Error('Invoice not found');
      }

      // Query Payment Gateway for payments
      const payments = await PaymentGatewayClient.getPaymentsForInvoice(invoiceId);
      
      // Calculate total confirmed payments
      const totalConfirmed = payments
        .filter(p => p.status === 'confirmed')
        .reduce((sum, p) => sum + p.amount, 0);

      // Update invoice if needed
      if (totalConfirmed > invoice.paidAmount) {
        const additionalPayment = totalConfirmed - invoice.paidAmount;
        await this.applyPayment(invoiceId, 'SYNC', additionalPayment, userId);
      }

      logger.info('Payment status synced', {
        invoiceId,
        paymentsFound: payments.length,
        totalConfirmed,
        userId
      });

      return {
        invoiceId,
        payments,
        totalConfirmed,
        synced: true
      };

    } catch (error: any) {
      logger.error('Failed to sync payment status', {
        invoiceId,
        error: error.message,
        userId
      });
      throw error;
    }
  }
}

export default InvoiceService;

