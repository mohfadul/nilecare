import axios, { AxiosInstance } from 'axios';
import CircuitBreaker from 'opossum';

/**
 * Inventory Service Client
 * Provides type-safe access to Inventory Service APIs
 */
export class InventoryServiceClient {
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
   * Get low stock items count
   */
  async getLowStockItemsCount(): Promise<number> {
    const response = await this.breaker.fire({
      method: 'GET',
      url: '/api/v1/stats/items/low-stock',
    });
    return response.data.data.count;
  }

  /**
   * Get low stock items details
   */
  async getLowStockItems(limit: number = 20): Promise<any[]> {
    const response = await this.breaker.fire({
      method: 'GET',
      url: '/api/v1/stats/items/low-stock/details',
      params: { limit },
    });
    return response.data.data.items;
  }

  /**
   * Get out of stock items count
   */
  async getOutOfStockCount(): Promise<number> {
    const response = await this.breaker.fire({
      method: 'GET',
      url: '/api/v1/stats/items/out-of-stock',
    });
    return response.data.data.count;
  }

  /**
   * Get all inventory stats
   */
  async getAllStats(): Promise<any> {
    const response = await this.breaker.fire({
      method: 'GET',
      url: '/api/v1/stats',
    });
    return response.data.data;
  }
}

export default InventoryServiceClient;


