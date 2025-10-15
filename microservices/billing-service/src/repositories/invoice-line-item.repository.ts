/**
 * Invoice Line Item Repository
 * Data access layer for invoice line items
 */

import { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import DatabaseConfig from '../config/database.config';
import { InvoiceLineItemEntity, LineItemType } from '../entities/invoice-line-item.entity';

export class InvoiceLineItemRepository {
  private db = DatabaseConfig;

  /**
   * Create line item
   */
  async create(lineItem: InvoiceLineItemEntity, connection?: PoolConnection): Promise<InvoiceLineItemEntity> {
    const sql = `
      INSERT INTO invoice_line_items (
        id, invoice_id, line_number,
        item_type, item_code, item_name, item_description,
        procedure_code, diagnosis_codes, revenue_code, modifier_codes,
        quantity, unit_of_measure, unit_price,
        discount_percent, discount_amount, tax_percent, tax_amount, line_total,
        service_date, service_provider_id, department_id,
        reference_id, reference_type, notes,
        created_at, updated_at
      ) VALUES (
        ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?,
        NOW(), NOW()
      )
    `;

    const params = [
      lineItem.id,
      lineItem.invoiceId,
      lineItem.lineNumber,
      lineItem.itemType,
      lineItem.itemCode || null,
      lineItem.itemName,
      lineItem.itemDescription || null,
      lineItem.procedureCode || null,
      lineItem.diagnosisCodes ? JSON.stringify(lineItem.diagnosisCodes) : null,
      lineItem.revenueCode || null,
      lineItem.modifierCodes || null,
      lineItem.quantity,
      lineItem.unitOfMeasure,
      lineItem.unitPrice,
      lineItem.discountPercent,
      lineItem.discountAmount,
      lineItem.taxPercent,
      lineItem.taxAmount,
      lineItem.lineTotal,
      lineItem.serviceDate || null,
      lineItem.serviceProviderId || null,
      lineItem.departmentId || null,
      lineItem.referenceId || null,
      lineItem.referenceType || null,
      lineItem.notes || null
    ];

    if (connection) {
      await connection.execute(sql, params);
    } else {
      await this.db.query<ResultSetHeader>(sql, params);
    }

    return lineItem;
  }

  /**
   * Find line items by invoice ID
   */
  async findByInvoiceId(invoiceId: string): Promise<InvoiceLineItemEntity[]> {
    const sql = `
      SELECT * FROM invoice_line_items 
      WHERE invoice_id = ? 
      ORDER BY line_number ASC
    `;

    const rows = await this.db.query<RowDataPacket[]>(sql, [invoiceId]);
    return rows.map(row => this.mapRowToEntity(row));
  }

  /**
   * Update line item
   */
  async update(lineItem: InvoiceLineItemEntity, connection?: PoolConnection): Promise<void> {
    const sql = `
      UPDATE invoice_line_items SET
        item_name = ?,
        item_description = ?,
        quantity = ?,
        unit_price = ?,
        discount_percent = ?,
        discount_amount = ?,
        tax_percent = ?,
        tax_amount = ?,
        line_total = ?,
        notes = ?,
        updated_at = NOW()
      WHERE id = ?
    `;

    const params = [
      lineItem.itemName,
      lineItem.itemDescription || null,
      lineItem.quantity,
      lineItem.unitPrice,
      lineItem.discountPercent,
      lineItem.discountAmount,
      lineItem.taxPercent,
      lineItem.taxAmount,
      lineItem.lineTotal,
      lineItem.notes || null,
      lineItem.id
    ];

    if (connection) {
      await connection.execute(sql, params);
    } else {
      await this.db.query<ResultSetHeader>(sql, params);
    }
  }

  /**
   * Delete line item
   */
  async delete(id: string, connection?: PoolConnection): Promise<void> {
    const sql = `DELETE FROM invoice_line_items WHERE id = ?`;

    if (connection) {
      await connection.execute(sql, [id]);
    } else {
      await this.db.query<ResultSetHeader>(sql, [id]);
    }
  }

  /**
   * Map database row to entity
   */
  private mapRowToEntity(row: any): InvoiceLineItemEntity {
    return new InvoiceLineItemEntity({
      id: row.id,
      invoiceId: row.invoice_id,
      lineNumber: row.line_number,
      itemType: row.item_type as LineItemType,
      itemCode: row.item_code,
      itemName: row.item_name,
      itemDescription: row.item_description,
      procedureCode: row.procedure_code,
      diagnosisCodes: row.diagnosis_codes ? JSON.parse(row.diagnosis_codes) : undefined,
      revenueCode: row.revenue_code,
      modifierCodes: row.modifier_codes,
      quantity: parseFloat(row.quantity),
      unitOfMeasure: row.unit_of_measure,
      unitPrice: parseFloat(row.unit_price),
      discountPercent: parseFloat(row.discount_percent),
      discountAmount: parseFloat(row.discount_amount),
      taxPercent: parseFloat(row.tax_percent),
      taxAmount: parseFloat(row.tax_amount),
      lineTotal: parseFloat(row.line_total),
      serviceDate: row.service_date ? new Date(row.service_date) : undefined,
      serviceProviderId: row.service_provider_id,
      departmentId: row.department_id,
      referenceId: row.reference_id,
      referenceType: row.reference_type,
      notes: row.notes,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    });
  }
}

export default InvoiceLineItemRepository;

