import axios, { AxiosInstance } from 'axios';
import { logger } from '../../utils/logger';

/**
 * Billing Service Client
 * Handles communication with Billing Service for lab test charges
 */

export interface LabTestCharge {
  testId: string;
  testName: string;
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
        'X-Service-Name': 'lab-service',
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
   * Create billing record for lab order
   */
  async createLabOrderCharge(params: {
    patientId: string;
    facilityId: string;
    labOrderId: string;
    tests: Array<{
      testId: string;
      testName: string;
      testCode: string;
      basePrice: number;
    }>;
    orderedBy: string;
    encounterId?: string;
    appointmentId?: string;
  }): Promise<BillingRecord | null> {
    try {
      const lineItems = params.tests.map((test) => ({
        itemType: 'lab_test',
        itemName: test.testName,
        itemCode: test.testCode,
        quantity: 1,
        unitPrice: test.basePrice,
        totalPrice: test.basePrice,
        referenceId: params.labOrderId,
        referenceType: 'lab_order',
      }));

      const response = await this.client.post('/api/v1/charges/batch', {
        patientId: params.patientId,
        facilityId: params.facilityId,
        encounterId: params.encounterId,
        appointmentId: params.appointmentId,
        serviceProviderId: params.orderedBy,
        lineItems,
        serviceDate: new Date().toISOString(),
      });

      if (response.data.success && response.data.data) {
        logger.info('Lab order billing record created', {
          billingRecordId: response.data.data.id,
          labOrderId: params.labOrderId,
          patientId: params.patientId,
          testCount: params.tests.length,
        });

        return {
          billingRecordId: response.data.data.id,
          invoiceId: response.data.data.invoiceId,
          status: response.data.data.status,
        };
      }

      return null;
    } catch (error: any) {
      logger.error('Create lab order charge failed', {
        error: error.message,
        labOrderId: params.labOrderId,
      });
      return null;
    }
  }

  /**
   * Get test price from charge master
   */
  async getLabTestPrice(testId: string, facilityId: string): Promise<number | null> {
    try {
      const response = await this.client.get(`/api/v1/charge-master/lab-test/${testId}`, {
        params: { facilityId },
      });

      if (response.data.success && response.data.data) {
        return response.data.data.basePrice || response.data.data.cashRate;
      }

      return null;
    } catch (error: any) {
      logger.error('Get lab test price failed', { error: error.message, testId });
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

