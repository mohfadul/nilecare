import { AppointmentServiceClient } from './integrations/AppointmentServiceClient';
import { BillingServiceClient } from './integrations/BillingServiceClient';
import { logger, logLabOrderCreation } from '../utils/logger';
import { ValidationError, NotFoundError, ExternalServiceError } from '../middleware/errorHandler';
import { getPostgreSQLPool } from '../utils/database';

/**
 * Lab Service
 * Core orchestration for lab orders, samples, and results
 * Integrates with Appointment and Billing services
 */

export class LabService {
  private appointmentClient: AppointmentServiceClient;
  private billingClient: BillingServiceClient;
  private pool;

  constructor() {
    this.appointmentClient = new AppointmentServiceClient();
    this.billingClient = new BillingServiceClient();
    this.pool = getPostgreSQLPool();
  }

  /**
   * Create lab order
   * Main workflow: validates appointment → creates order → creates billing
   */
  async createLabOrder(orderData: {
    patientId: string;
    providerId: string;
    tests: Array<{ testId: string; priority?: string; notes?: string }>;
    appointmentId?: string;
    encounterId?: string;
    clinicalNotes?: string;
    diagnosisCode?: string;
    facilityId: string;
    organizationId: string;
    createdBy: string;
  }): Promise<{
    labOrder: any;
    billingRecord?: any;
    warnings: string[];
  }> {
    const warnings: string[] = [];

    // 1. Validate appointment if provided
    if (orderData.appointmentId) {
      const appointment = await this.appointmentClient.getAppointment(orderData.appointmentId);
      
      if (!appointment) {
        warnings.push('Appointment not found - order created without appointment link');
      } else if (appointment.patientId !== orderData.patientId) {
        throw new ValidationError('Patient ID mismatch with appointment');
      }
    }

    // 2. Get test details and prices
    const testDetails = await Promise.all(
      orderData.tests.map(async (test) => {
        const testQuery = await this.pool.query(
          'SELECT * FROM lab_tests WHERE id = $1 AND status = $2',
          [test.testId, 'active']
        );

        if (testQuery.rows.length === 0) {
          throw new NotFoundError(`Test not found or inactive: ${test.testId}`);
        }

        return {
          ...test,
          testData: testQuery.rows[0],
          priority: test.priority || 'routine',
        };
      })
    );

    // 3. Generate order number
    const orderNumber = await this.generateOrderNumber();

    // 4. Create lab order
    const orderQuery = `
      INSERT INTO lab_orders (
        id, order_number, patient_id, provider_id, appointment_id, encounter_id,
        tests, clinical_notes, diagnosis_code, status, priority,
        facility_id, organization_id, created_by, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, 'pending', $9, $10, $11, $12, NOW(), NOW()
      )
      RETURNING *
    `;

    const testsJSON = testDetails.map((t) => ({
      testId: t.testId,
      testName: t.testData.test_name,
      priority: t.priority,
      status: 'pending',
      notes: t.notes,
    }));

    const orderResult = await this.pool.query(orderQuery, [
      orderNumber,
      orderData.patientId,
      orderData.providerId,
      orderData.appointmentId || null,
      orderData.encounterId || null,
      JSON.stringify(testsJSON),
      orderData.clinicalNotes || null,
      orderData.diagnosisCode || null,
      orderData.tests[0].priority || 'routine',
      orderData.facilityId,
      orderData.organizationId,
      orderData.createdBy,
    ]);

    const labOrder = orderResult.rows[0];

    // 5. Create billing records
    logger.info('Creating billing records for lab order', {
      labOrderId: labOrder.id,
      testCount: testDetails.length,
    });

    const testsForBilling = testDetails.map((t) => ({
      testId: t.testId,
      testName: t.testData.test_name,
      testCode: t.testData.test_code,
      basePrice: parseFloat(t.testData.base_price) || 0,
    }));

    const billingRecord = await this.billingClient.createLabOrderCharge({
      patientId: orderData.patientId,
      facilityId: orderData.facilityId,
      labOrderId: labOrder.id,
      tests: testsForBilling,
      orderedBy: orderData.providerId,
      encounterId: orderData.encounterId,
      appointmentId: orderData.appointmentId,
    });

    if (!billingRecord) {
      warnings.push('Billing record creation failed - manual billing may be required');
    } else {
      // Update lab order with billing reference
      await this.pool.query(
        'UPDATE lab_orders SET billing_reference = $1, billing_status = $2 WHERE id = $3',
        [billingRecord.billingRecordId, 'pending', labOrder.id]
      );
    }

    // 6. Notify appointment service
    if (orderData.appointmentId) {
      await this.appointmentClient.notifyLabOrderCreated(orderData.appointmentId, labOrder.id);
    }

    // 7. Log the order creation
    logLabOrderCreation({
      userId: orderData.createdBy,
      userRole: 'provider',
      patientId: orderData.patientId,
      testIds: testDetails.map((t) => t.testId),
      testNames: testDetails.map((t) => t.testData.test_name),
      orderId: labOrder.id,
      appointmentId: orderData.appointmentId,
      facilityId: orderData.facilityId,
    });

    logger.info('Lab order created successfully', {
      labOrderId: labOrder.id,
      orderNumber: labOrder.order_number,
      testCount: testDetails.length,
      billingCreated: !!billingRecord,
    });

    return {
      labOrder: this.mapRowToLabOrder(labOrder),
      billingRecord,
      warnings,
    };
  }

  /**
   * Get lab order by ID
   */
  async getLabOrderById(id: string, facilityId?: string): Promise<any> {
    let query = 'SELECT * FROM lab_orders WHERE id = $1';
    const values: any[] = [id];

    if (facilityId) {
      query += ' AND facility_id = $2';
      values.push(facilityId);
    }

    const result = await this.pool.query(query, values);

    if (result.rows.length === 0) {
      throw new NotFoundError(`Lab order not found: ${id}`);
    }

    return this.mapRowToLabOrder(result.rows[0]);
  }

  /**
   * Cancel lab order
   */
  async cancelLabOrder(
    labOrderId: string,
    cancelledBy: string,
    reason: string,
    facilityId: string
  ): Promise<any> {
    const query = `
      UPDATE lab_orders
      SET status = 'cancelled',
          updated_by = $1,
          updated_at = NOW()
      WHERE id = $2 AND facility_id = $3
      RETURNING *
    `;

    const result = await this.pool.query(query, [cancelledBy, labOrderId, facilityId]);

    if (result.rows.length === 0) {
      throw new NotFoundError(`Lab order not found or access denied: ${labOrderId}`);
    }

    const labOrder = this.mapRowToLabOrder(result.rows[0]);

    // Cancel billing if exists
    if (labOrder.billingReference) {
      await this.billingClient.cancelCharge(labOrder.billingReference, reason, cancelledBy);
    }

    logger.info('Lab order cancelled', { labOrderId, reason });
    return labOrder;
  }

  /**
   * Generate order number
   */
  private async generateOrderNumber(): Promise<string> {
    const prefix = 'LAB';
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');

    const query = `
      SELECT COUNT(*) as count
      FROM lab_orders
      WHERE order_number LIKE $1
    `;

    const result = await this.pool.query(query, [`${prefix}-${dateStr}-%`]);
    const count = parseInt(result.rows[0].count) + 1;
    const sequence = count.toString().padStart(6, '0');

    return `${prefix}-${dateStr}-${sequence}`;
  }

  /**
   * Map database row to LabOrder model
   */
  private mapRowToLabOrder(row: any): any {
    return {
      id: row.id,
      orderNumber: row.order_number,
      patientId: row.patient_id,
      providerId: row.provider_id,
      appointmentId: row.appointment_id,
      encounterId: row.encounter_id,
      tests: row.tests,
      clinicalNotes: row.clinical_notes,
      diagnosisCode: row.diagnosis_code,
      indication: row.indication,
      status: row.status,
      priority: row.priority,
      orderedDate: row.ordered_date,
      expectedCompletionDate: row.expected_completion_date,
      completedDate: row.completed_date,
      sampleIds: row.sample_ids || [],
      hasResults: row.has_results,
      resultsReleasedDate: row.results_released_date,
      resultsReleasedBy: row.results_released_by,
      billingReference: row.billing_reference,
      billingStatus: row.billing_status,
      facilityId: row.facility_id,
      organizationId: row.organization_id,
      createdBy: row.created_by,
      updatedBy: row.updated_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export default LabService;

