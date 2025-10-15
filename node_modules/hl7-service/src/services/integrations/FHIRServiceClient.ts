import axios, { AxiosInstance } from 'axios';
import { logger } from '../../utils/logger';

export class FHIRServiceClient {
  private client: AxiosInstance;

  constructor() {
    const baseUrl = process.env.FHIR_SERVICE_URL || 'http://localhost:6001';
    const apiKey = process.env.FHIR_SERVICE_API_KEY || '';

    this.client = axios.create({
      baseURL: baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/fhir+json',
        'X-API-Key': apiKey,
      },
    });
  }

  async createFHIRResource(resourceType: string, resource: any): Promise<any> {
    try {
      const response = await this.client.post(`/fhir/${resourceType}`, resource);
      return response.data;
    } catch (error: any) {
      logger.error('Error creating FHIR resource', {
        resourceType,
        error: error.message,
      });
      return null;
    }
  }

  async getFHIRResource(resourceType: string, resourceId: string): Promise<any> {
    try {
      const response = await this.client.get(`/fhir/${resourceType}/${resourceId}`);
      return response.data;
    } catch (error: any) {
      logger.error('Error getting FHIR resource', {
        resourceType,
        resourceId,
        error: error.message,
      });
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

export default FHIRServiceClient;

