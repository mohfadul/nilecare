import axios, { AxiosInstance } from 'axios';
import { logger } from '../../utils/logger';

/**
 * Billing Service Client
 * Handles communication with Billing Service for medication charges
 */

export interface MedicationCharge {
  medicationId: string;
  medicationName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface BillingRecord {
  billingRecordId: string;
  invoiceId?: string;
  status: 'pending' | 'billed' | 'paid' | 'cancelled';
}

export class BillingServiceClient {
  private client: AxiosInstance;
  private billingServiceUrl: string;
  private apiKey: string;

  constructor() {
    this.billingServiceUrl = process.env.BILLING_SERVICE_URL || 'http://localhost:7030';
    this.apiKey = process.env.BILLING_SERVICE_API_KEY || '';

    if (!this.apiKey) {
      logger.warn('BILLING_SERVICE_API_KEY not configured. Service-to-service calls may fail.');
    }

    this.client = axios.create({
      baseURL: this.billingServiceUrl,
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json',
        'X-Service-Name': 'medication-service',
        'X-API-Key': this.apiKey,
      },
    });

    // Add interceptors for logging
    this.client.interceptors.request.use(
      (config) => {
        logger.debug(`Billing Service Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        logger.error('Billing Service Request Error', { error: error.message });
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => {
        logger.debug(`Billing Service Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        logger.error('Billing Service Response Error', {
          url: error.config?.url,
          status: error.response?.status,
          message: error.message,
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Create billing record for dispensed medication
   */
  async createMedicationCharge(params: {
    patientId: string;
    facilityId: string;
    prescriptionId: string;
    medicationId: string;
    medicationName: string;
    quantity: number;
    unitPrice: number;
    dispensedBy: string;
    encounterId?: string;
    notes?: string;
  }): Promise<BillingRecord | null> {
    try {
      const totalPrice = params.quantity * params.unitPrice;

      const response = await this.client.post('/api/v1/charges/medication', {
        patientId: params.patientId,
        facilityId: params.facilityId,
        itemType: 'medication',
        itemName: params.medicationName,
        itemCode: params.medicationId,
        quantity: params.quantity,
        unitPrice: params.unitPrice,
        totalPrice: totalPrice,
        referenceId: params.prescriptionId,
        referenceType: 'prescription',
        encounterId: params.encounterId,
        serviceProviderId: params.dispensedBy,
        notes: params.notes,
        serviceDate: new Date().toISOString(),
      });

      if (response.data.success && response.data.data) {
        logger.info('Medication billing record created', {
          billingRecordId: response.data.data.id,
          patientId: params.patientId,
          medicationId: params.medicationId,
          totalPrice,
        });

        return {
          billingRecordId: response.data.data.id,
          invoiceId: response.data.data.invoiceId,
          status: response.data.data.status,
        };
      }

      return null;
    } catch (error: any) {
      logger.error('Create medication charge failed', {
        error: error.message,
        medicationId: params.medicationId,
        patientId: params.patientId,
      });
      return null;
    }
  }

  /**
   * Create batch billing records for multiple medications
   */
  async createBatchCharges(
    patientId: string,
    facilityId: string,
    charges: Array<{
      prescriptionId: string;
      medicationId: string;
      medicationName: string;
      quantity: number;
      unitPrice: number;
    }>,
    dispensedBy: string,
    encounterId?: string
  ): Promise<BillingRecord[] | null> {
    try {
      const lineItems = charges.map((charge) => ({
        itemType: 'medication',
        itemName: charge.medicationName,
        itemCode: charge.medicationId,
        quantity: charge.quantity,
        unitPrice: charge.unitPrice,
        totalPrice: charge.quantity * charge.unitPrice,
        referenceId: charge.prescriptionId,
        referenceType: 'prescription',
      }));

      const response = await this.client.post('/api/v1/charges/batch', {
        patientId,
        facilityId,
        encounterId,
        serviceProviderId: dispensedBy,
        lineItems,
        serviceDate: new Date().toISOString(),
      });

      if (response.data.success && response.data.data) {
        logger.info('Batch medication billing records created', {
          patientId,
          count: charges.length,
        });

        return response.data.data.records.map((record: any) => ({
          billingRecordId: record.id,
          invoiceId: record.invoiceId,
          status: record.status,
        }));
      }

      return null;
    } catch (error: any) {
      logger.error('Create batch charges failed', { error: error.message, patientId });
      return null;
    }
  }

  /**
   * Get medication price from charge master
   */
  async getMedicationPrice(medicationId: string, facilityId: string): Promise<number | null> {
    try {
      const response = await this.client.get(`/api/v1/charge-master/medication/${medicationId}`, {
        params: { facilityId },
      });

      if (response.data.success && response.data.data) {
        return response.data.data.basePrice || response.data.data.cashRate;
      }

      return null;
    } catch (error: any) {
      logger.error('Get medication price failed', { error: error.message, medicationId });
      return null;
    }
  }

  /**
   * Cancel billing record
   */
  async cancelCharge(billingRecordId: string, reason: string, cancelledBy: string): Promise<boolean> {
    try {
      const response = await this.client.post(`/api/v1/charges/${billingRecordId}/cancel`, {
        reason,
        cancelledBy,
      });

      if (response.data.success) {
        logger.info('Billing record cancelled', { billingRecordId, reason });
        return true;
      }

      return false;
    } catch (error: any) {
      logger.error('Cancel charge failed', { error: error.message, billingRecordId });
      return false;
    }
  }

  /**
   * Check if patient has active billing account
   */
  async checkPatientBillingAccount(patientId: string, facilityId: string): Promise<{
    hasAccount: boolean;
    accountId?: string;
    status?: string;
  } | null> {
    try {
      const response = await this.client.get(`/api/v1/billing-accounts/patient/${patientId}`, {
        params: { facilityId },
      });

      if (response.data.success && response.data.data) {
        return {
          hasAccount: true,
          accountId: response.data.data.id,
          status: response.data.data.status,
        };
      }

      return { hasAccount: false };
    } catch (error: any) {
      logger.error('Check patient billing account failed', { error: error.message, patientId });
      return null;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.status === 200;
    } catch (error: any) {
      logger.error('Billing Service health check failed', { error: error.message });
      return false;
    }
  }
}

export default BillingServiceClient;

