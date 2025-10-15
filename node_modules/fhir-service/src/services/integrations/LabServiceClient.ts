import axios, { AxiosInstance } from 'axios';
import { logger } from '../../utils/logger';

export class LabServiceClient {
  private client: AxiosInstance;

  constructor() {
    const baseUrl = process.env.LAB_SERVICE_URL || 'http://localhost:4005';
    const apiKey = process.env.LAB_SERVICE_API_KEY || '';

    this.client = axios.create({
      baseURL: baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
    });
  }

  async getLabOrder(labOrderId: string): Promise<any> {
    try {
      const response = await this.client.get(`/api/v1/lab-orders/${labOrderId}`);
      return response.data.data;
    } catch (error: any) {
      logger.error('Error getting lab order', { labOrderId, error: error.message });
      return null;
    }
  }

  async getLabResults(patientId: string): Promise<any[]> {
    try {
      const response = await this.client.get(`/api/v1/patients/${patientId}/results`);
      return response.data.data || [];
    } catch (error: any) {
      logger.error('Error getting lab results', { patientId, error: error.message });
      return [];
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health', { timeout: 3000 });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
}

export default LabServiceClient;

