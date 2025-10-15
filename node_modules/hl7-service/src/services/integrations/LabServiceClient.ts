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

  async createLabOrder(orderData: any): Promise<any> {
    try {
      const response = await this.client.post('/api/v1/lab-orders', orderData);
      return response.data.data;
    } catch (error: any) {
      logger.error('Error creating lab order', { error: error.message });
      return null;
    }
  }

  async submitLabResult(resultData: any): Promise<any> {
    try {
      const response = await this.client.post('/api/v1/results', resultData);
      return response.data.data;
    } catch (error: any) {
      logger.error('Error submitting lab result', { error: error.message });
      return null;
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

