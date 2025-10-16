import axios, { AxiosInstance } from 'axios';
import CircuitBreaker from 'opossum';

/**
 * Auth Service Client
 * Provides type-safe access to Auth Service APIs
 */
export class AuthServiceClient {
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
   * Get users count
   */
  async getUsersCount(): Promise<number> {
    const response = await this.breaker.fire({
      method: 'GET',
      url: '/api/v1/stats/users/count',
    });
    return response.data.data.count;
  }

  /**
   * Get active users count
   */
  async getActiveUsersCount(): Promise<number> {
    const response = await this.breaker.fire({
      method: 'GET',
      url: '/api/v1/stats/users/active',
    });
    return response.data.data.count;
  }

  /**
   * Get all auth stats
   */
  async getAllStats(): Promise<any> {
    const response = await this.breaker.fire({
      method: 'GET',
      url: '/api/v1/stats',
    });
    return response.data.data;
  }
}

export default AuthServiceClient;


