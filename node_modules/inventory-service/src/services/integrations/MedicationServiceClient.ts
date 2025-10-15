import axios, { AxiosInstance } from 'axios';
import { logger } from '../../utils/logger';

/**
 * Medication Service Client
 * Handles communication with Medication Service
 */

export interface MedicationInfo {
  medicationId: string;
  name: string;
  dosageForm: string;
  strength: string;
  unit: string;
  category?: string;
}

export class MedicationServiceClient {
  private client: AxiosInstance;
  private medicationServiceUrl: string;
  private apiKey: string;

  constructor() {
    this.medicationServiceUrl = process.env.MEDICATION_SERVICE_URL || 'http://localhost:4003';
    this.apiKey = process.env.MEDICATION_SERVICE_API_KEY || '';

    if (!this.apiKey) {
      logger.warn('MEDICATION_SERVICE_API_KEY not configured. Service-to-service calls may fail.');
    }

    this.client = axios.create({
      baseURL: this.medicationServiceUrl,
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json',
        'X-Service-Name': 'inventory-service',
        'X-API-Key': this.apiKey,
      },
    });
  }

  /**
   * Get medication details by ID
   */
  async getMedicationById(medicationId: string): Promise<MedicationInfo | null> {
    try {
      const response = await this.client.get(`/api/v1/medications/${medicationId}`);

      if (response.data.success && response.data.data) {
        const med = response.data.data;
        return {
          medicationId: med.id,
          name: med.name,
          dosageForm: med.dosageForm,
          strength: med.strength,
          unit: med.unit,
          category: med.category,
        };
      }

      return null;
    } catch (error: any) {
      logger.error('Get medication failed', { error: error.message, medicationId });
      return null;
    }
  }

  /**
   * Notify medication service of stock update
   */
  async notifyStockUpdate(params: {
    medicationId: string;
    facilityId: string;
    quantityAvailable: number;
    lowStock: boolean;
  }): Promise<boolean> {
    try {
      const response = await this.client.post('/api/v1/medications/stock-update', params);
      return response.data.success;
    } catch (error: any) {
      logger.error('Notify stock update failed', { error: error.message });
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
      logger.error('Medication Service health check failed', { error: error.message });
      return false;
    }
  }
}

export default MedicationServiceClient;

