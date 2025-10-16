import axios, { AxiosInstance } from 'axios';
import CircuitBreaker from 'opossum';

/**
 * Lab Service Client
 * Provides type-safe access to Lab Service APIs
 */
export class LabServiceClient {
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
   * Get pending lab orders count
   */
  async getPendingOrdersCount(): Promise<number> {
    const response = await this.breaker.fire({
      method: 'GET',
      url: '/api/v1/stats/orders/pending',
    });
    return response.data.data.count;
  }

  /**
   * Get critical results count
   */
  async getCriticalResultsCount(): Promise<number> {
    const response = await this.breaker.fire({
      method: 'GET',
      url: '/api/v1/stats/results/critical',
    });
    return response.data.data.count;
  }

  /**
   * Get recent critical results
   */
  async getRecentCriticalResults(limit: number = 20): Promise<any[]> {
    const response = await this.breaker.fire({
      method: 'GET',
      url: '/api/v1/stats/results/critical/recent',
      params: { limit },
    });
    return response.data.data.results;
  }

  /**
   * Get all lab stats
   */
  async getAllStats(): Promise<any> {
    const response = await this.breaker.fire({
      method: 'GET',
      url: '/api/v1/stats',
    });
    return response.data.data;
  }
}

export default LabServiceClient;


