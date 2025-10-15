import type mysql from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';
import { Billing, BillingQuery, PaginationResult, BillingItem } from '../types';
import { NotFoundError, BadRequestError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

export class BillingService {
  constructor(private db: mysql.Pool) {}

  async getAllBillings(
    query: BillingQuery,
    organizationId: string
  ): Promise<PaginationResult<Billing>> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const offset = (page - 1) * limit;

    // Note: organization_id column doesn't exist in current schema, using WHERE 1=1 as base
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (query.patientId) {
      whereClause += ` AND patient_id = ?`;
      params.push(query.patientId);
    }

    if (query.status) {
      whereClause += ` AND status = ?`;
      params.push(query.status);
    }

    if (query.startDate && query.endDate) {
      whereClause += ` AND created_at BETWEEN ? AND ?`;
      params.push(query.startDate, query.endDate);
    }

    if (query.minAmount) {
      whereClause += ` AND amount >= ?`;
      params.push(query.minAmount);
    }

    if (query.maxAmount) {
      whereClause += ` AND amount <= ?`;
      params.push(query.maxAmount);
    }

    try {
      const countQuery = `SELECT COUNT(*) as count FROM billings ${whereClause}`;
      const [countRows] = await this.db.query(countQuery, params) as any;
      const total = parseInt(countRows[0].count);

      const dataQuery = `
        SELECT * FROM billings 
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `;
      const dataParams = [...params, limit, offset];

      const [dataRows] = await this.db.query(dataQuery, dataParams) as any;

      // Parse JSON items field
      const billings = dataRows.map((row: any) => ({
        ...row,
        items: typeof row.items === 'string' ? JSON.parse(row.items) : row.items
      }));

      return {
        data: billings,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error: any) {
      logger.error('Error fetching billings:', error);
      throw error;
    }
  }

  async getBillingById(id: string, organizationId: string): Promise<Billing> {
    try {
      const [rows] = await this.db.query(
        'SELECT * FROM billings WHERE id = ?',
        [id, organizationId]
      ) as any;

      if (rows.length === 0) {
        throw new NotFoundError('Billing record not found');
      }

      const billing = rows[0];
      billing.items = typeof billing.items === 'string' ? JSON.parse(billing.items) : billing.items;

      return billing;
    } catch (error: any) {
      logger.error('Error fetching billing:', error);
      throw error;
    }
  }

  async createBilling(
    data: Partial<Billing>,
    organizationId: string,
    userId: string
  ): Promise<Billing> {
    const id = uuidv4();
    const invoiceNumber = await this.generateInvoiceNumber(organizationId);

    // Calculate total from items
    const totalAmount = data.items!.reduce((sum, item) => sum + item.amount, 0);

    try {
      await this.db.query(
        `INSERT INTO billings (
          id, patient_id, appointment_id, invoice_number,
          amount, currency, status, description, items, due_date,
          created_by, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          id,
          data.patientId,
          data.appointmentId || null,
          invoiceNumber,
          totalAmount,
          data.currency || 'USD',
          'pending',
          data.description,
          JSON.stringify(data.items),
          data.dueDate || null,
          userId
        ]
      );

      logger.info(`Billing created: ${id}, Invoice: ${invoiceNumber}`);
      return await this.getBillingById(id, organizationId);
    } catch (error: any) {
      logger.error('Error creating billing:', error);
      throw error;
    }
  }

  async updateBilling(
    id: string,
    data: Partial<Billing>,
    organizationId: string,
    userId: string
  ): Promise<Billing> {
    await this.getBillingById(id, organizationId);

    const updates: string[] = [];
    const params: any[] = [];

    if (data.status) {
      updates.push(`status = ?`);
      params.push(data.status);

      if (data.status === 'paid' && !data.paidDate) {
        updates.push(`paid_date = NOW()`);
      }
    }

    if (data.description) {
      updates.push(`description = ?`);
      params.push(data.description);
    }

    if (data.items) {
      const totalAmount = data.items.reduce((sum, item) => sum + item.amount, 0);
      updates.push(`items = ?`);
      params.push(JSON.stringify(data.items));
      updates.push(`amount = ?`);
      params.push(totalAmount);
    }

    if (data.notes !== undefined) {
      updates.push(`notes = ?`);
      params.push(data.notes);
    }

    if (data.paymentMethod) {
      updates.push(`payment_method = ?`);
      params.push(data.paymentMethod);
    }

    if (updates.length === 0) {
      return await this.getBillingById(id, organizationId);
    }

    updates.push(`updated_by = ?`);
    params.push(userId);
    updates.push(`updated_at = NOW()`);

    params.push(id, organizationId);

    try {
      await this.db.query(
        `UPDATE billings SET ${updates.join(', ')} 
         WHERE id = ?`,
        params
      );

      logger.info(`Billing updated: ${id}`);
      return await this.getBillingById(id, organizationId);
    } catch (error: any) {
      logger.error('Error updating billing:', error);
      throw error;
    }
  }

  async markAsPaid(
    id: string,
    organizationId: string,
    userId: string,
    paymentMethod: string
  ): Promise<Billing> {
    return this.updateBilling(
      id,
      { status: 'paid', paymentMethod },
      organizationId,
      userId
    );
  }

  async cancelBilling(
    id: string,
    organizationId: string,
    userId: string
  ): Promise<Billing> {
    const billing = await this.getBillingById(id, organizationId);

    if (billing.status === 'paid') {
      throw new BadRequestError('Cannot cancel a paid billing. Use refund instead.');
    }

    return this.updateBilling(id, { status: 'cancelled' }, organizationId, userId);
  }

  async getPatientBillingHistory(
    patientId: string,
    organizationId: string
  ): Promise<Billing[]> {
    try {
      const [rows] = await this.db.query(
        `SELECT * FROM billings 
         WHERE patient_id = ?         ORDER BY created_at DESC`,
        [patientId, organizationId]
      ) as any;

      // Parse JSON items field
      const billings = rows.map((row: any) => ({
        ...row,
        items: typeof row.items === 'string' ? JSON.parse(row.items) : row.items
      }));

      return billings;
    } catch (error: any) {
      logger.error('Error fetching patient billing history:', error);
      throw error;
    }
  }

  private async generateInvoiceNumber(organizationId: string): Promise<string> {
    const year = new Date().getFullYear();
    const [rows] = await this.db.query(
      `SELECT COUNT(*) as count FROM billings 
       WHERE YEAR(created_at) = ?`,
      [year]
    ) as any;

    const count = parseInt(rows[0].count) + 1;
    return `INV-${year}-${String(count).padStart(6, '0')}`;
  }
}
