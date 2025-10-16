import axios, { AxiosInstance } from 'axios';
import CircuitBreaker from 'opossum';

/**
 * Medication Service Client
 * Provides type-safe access to Medication Service APIs
 */
export class MedicationServiceClient {
  private baseUrl: string;
  private axiosInstance: AxiosInstance;
  private breaker: CircuitBreaker<[any], any>;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    
    this.axiosInstance = axios.create({
      baseURL: baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Circuit breaker for resilience
    this.breaker = new CircuitBreaker(
      async (config: any) => {
        return await this.axiosInstance.request(config);
      },
      {
        timeout: 10000,
        errorThresholdPercentage: 50,
        resetTimeout: 30000,
        volumeThreshold: 3,
      }
    );
  }

  /**
   * Set authorization token for requests
   */
  setAuthToken(token: string) {
    this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  /**
   * Get active prescriptions count
   */
  async getActivePrescriptionsCount(): Promise<number> {
    const response = await this.breaker.fire({
      method: 'GET',
      url: '/api/v1/stats/prescriptions/active',
    });
    return response.data.data.count;
  }

  /**
   * Get medication alerts count
   */
  async getAlertsCount(): Promise<number> {
    const response = await this.breaker.fire({
      method: 'GET',
      url: '/api/v1/stats/alerts/count',
    });
    return response.data.data.count;
  }

  /**
   * Get recent alerts
   */
  async getRecentAlerts(limit: number = 20): Promise<any[]> {
    const response = await this.breaker.fire({
      method: 'GET',
      url: '/api/v1/stats/alerts/recent',
      params: { limit },
    });
    return response.data.data.alerts;
  }

  /**
   * Get all medication stats
   */
  async getAllStats(): Promise<any> {
    const response = await this.breaker.fire({
      method: 'GET',
      url: '/api/v1/stats',
    });
    return response.data.data;
  }
}

export default MedicationServiceClient;


