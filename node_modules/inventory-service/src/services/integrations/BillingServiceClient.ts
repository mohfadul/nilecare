import axios, { AxiosInstance } from 'axios';
import { logger } from '../../utils/logger';

/**
 * Billing Service Client
 * Only used to link inventory movements to billing records (NO billing logic here)
 */

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
        'X-Service-Name': 'inventory-service',
        'X-API-Key': this.apiKey,
      },
    });
  }

  /**
   * Notify billing service of inventory movement
   * (Billing decides whether to create charge - Inventory only notifies)
   */
  async notifyInventoryMovement(params: {
    itemId: string;
    movementId: string;
    movementType: string;
    quantity: number;
    reference?: string;
    facilityId: string;
  }): Promise<boolean> {
    try {
      const response = await this.client.post('/api/v1/inventory/movement-notification', params);
      return response.data.success;
    } catch (error: any) {
      logger.error('Notify billing of inventory movement failed', { error: error.message });
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

