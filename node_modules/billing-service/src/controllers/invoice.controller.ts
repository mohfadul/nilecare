/**
 * Invoice Controller
 * Handles HTTP requests for invoice operations
 */

import { Request, Response } from 'express';
import InvoiceService from '../services/invoice.service';
import { CreateInvoiceDtoValidator } from '../dtos/create-invoice.dto';
import { UpdateInvoiceDtoValidator } from '../dtos/update-invoice.dto';
import { logger } from '../config/logger.config';

export class InvoiceController {
  private invoiceService: InvoiceService;

  constructor() {
    this.invoiceService = new InvoiceService();
  }

  /**
   * Create new invoice
   * POST /api/v1/invoices
   */
  async createInvoice(req: Request, res: Response): Promise<void> {
    try {
      // Validate request
      const { error, value } = CreateInvoiceDtoValidator.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: error.details.map(d => d.message)
          }
        });
        return;
      }

      const userId = req.user!.id;

      // Create invoice
      const invoice = await this.invoiceService.createInvoice(value, userId);

      res.status(201).json({
        success: true,
        data: invoice
      });

    } catch (error: any) {
      logger.error('Create invoice error', { error: error.message });
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to create invoice'
        }
      });
    }
  }

  /**
   * Get invoice by ID
   * GET /api/v1/invoices/:id
   */
  async getInvoiceById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const invoice = await this.invoiceService.getInvoiceWithLineItems(id);

      if (!invoice) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Invoice not found'
          }
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: invoice
      });

    } catch (error: any) {
      logger.error('Get invoice error', { error: error.message });
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to retrieve invoice'
        }
      });
    }
  }

  /**
   * List invoices with filters
   * GET /api/v1/invoices
   */
  async listInvoices(req: Request, res: Response): Promise<void> {
    try {
      const {
        patientId,
        facilityId,
        status,
        invoiceType,
        startDate,
        endDate,
        minAmount,
        maxAmount,
        page = 1,
        limit = 50
      } = req.query;

      const filters: any = {};
      if (patientId) filters.patientId = patientId;
      if (facilityId) filters.facilityId = facilityId;
      if (status) filters.status = status;
      if (invoiceType) filters.invoiceType = invoiceType;
      if (startDate && endDate) {
        filters.dateRange = { start: startDate, end: endDate };
      }
      if (minAmount) filters.minAmount = parseFloat(minAmount as string);
      if (maxAmount) filters.maxAmount = parseFloat(maxAmount as string);

      const result = await this.invoiceService.listInvoices(
        filters,
        parseInt(page as string),
        parseInt(limit as string)
      );

      res.status(200).json({
        success: true,
        data: result.invoices,
        pagination: result.pagination
      });

    } catch (error: any) {
      logger.error('List invoices error', { error: error.message });
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to retrieve invoices'
        }
      });
    }
  }

  /**
   * Update invoice
   * PUT /api/v1/invoices/:id
   */
  async updateInvoice(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Validate request
      const { error, value } = UpdateInvoiceDtoValidator.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: error.details.map(d => d.message)
          }
        });
        return;
      }

      const userId = req.user!.id;

      const invoice = await this.invoiceService.updateInvoice(id, value, userId);

      res.status(200).json({
        success: true,
        data: invoice
      });

    } catch (error: any) {
      logger.error('Update invoice error', { error: error.message });
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to update invoice'
        }
      });
    }
  }

  /**
   * Cancel invoice
   * DELETE /api/v1/invoices/:id
   */
  async cancelInvoice(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const userId = req.user!.id;

      const invoice = await this.invoiceService.cancelInvoice(id, userId, reason);

      res.status(200).json({
        success: true,
        data: invoice
      });

    } catch (error: any) {
      logger.error('Cancel invoice error', { error: error.message });
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to cancel invoice'
        }
      });
    }
  }

  /**
   * Get invoice statistics
   * GET /api/v1/invoices/statistics
   */
  async getStatistics(req: Request, res: Response): Promise<void> {
    try {
      const { facilityId, startDate, endDate } = req.query;

      const filters: any = {};
      if (facilityId) filters.facilityId = facilityId;
      if (startDate && endDate) {
        filters.dateRange = { start: startDate, end: endDate };
      }

      const stats = await this.invoiceService.getStatistics(filters);

      res.status(200).json({
        success: true,
        data: stats
      });

    } catch (error: any) {
      logger.error('Get statistics error', { error: error.message });
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to retrieve statistics'
        }
      });
    }
  }

  /**
   * Sync payment status from Payment Gateway
   * POST /api/v1/invoices/:id/sync-payment
   */
  async syncPaymentStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const result = await this.invoiceService.syncPaymentStatus(id, userId);

      res.status(200).json({
        success: true,
        data: result
      });

    } catch (error: any) {
      logger.error('Sync payment status error', { error: error.message });
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to sync payment status'
        }
      });
    }
  }
}

export default InvoiceController;

