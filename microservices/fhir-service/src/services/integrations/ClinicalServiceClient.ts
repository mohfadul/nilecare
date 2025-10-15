import axios, { AxiosInstance } from 'axios';
import { logger } from '../../utils/logger';

export class ClinicalServiceClient {
  private client: AxiosInstance;

  constructor() {
    const baseUrl = process.env.CLINICAL_SERVICE_URL || 'http://localhost:4001';
    const apiKey = process.env.CLINICAL_SERVICE_API_KEY || '';

    this.client = axios.create({
      baseURL: baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
    });
  }

  async getEncounter(encounterId: string): Promise<any> {
    try {
      const response = await this.client.get(`/api/v1/encounters/${encounterId}`);
      return response.data.data;
    } catch (error: any) {
      logger.error('Error getting encounter from Clinical Service', {
        encounterId,
        error: error.message,
      });
      return null;
    }
  }

  async getPatientEncounters(patientId: string): Promise<any[]> {
    try {
      const response = await this.client.get(`/api/v1/patients/${patientId}/encounters`);
      return response.data.data || [];
    } catch (error: any) {
      logger.error('Error getting patient encounters', { patientId, error: error.message });
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

export default ClinicalServiceClient;

