import axios, { AxiosInstance } from 'axios';
import { logger } from '../../utils/logger';

export class MedicationServiceClient {
  private client: AxiosInstance;

  constructor() {
    const baseUrl = process.env.MEDICATION_SERVICE_URL || 'http://localhost:4003';
    const apiKey = process.env.MEDICATION_SERVICE_API_KEY || '';

    this.client = axios.create({
      baseURL: baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
    });
  }

  async getPrescription(prescriptionId: string): Promise<any> {
    try {
      const response = await this.client.get(`/api/v1/prescriptions/${prescriptionId}`);
      return response.data.data;
    } catch (error: any) {
      logger.error('Error getting prescription', { prescriptionId, error: error.message });
      return null;
    }
  }

  async getPatientPrescriptions(patientId: string): Promise<any[]> {
    try {
      const response = await this.client.get(`/api/v1/patients/${patientId}/prescriptions`);
      return response.data.data || [];
    } catch (error: any) {
      logger.error('Error getting patient prescriptions', { patientId, error: error.message });
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

export default MedicationServiceClient;

