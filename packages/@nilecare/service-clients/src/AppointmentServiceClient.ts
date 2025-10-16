import axios, { AxiosInstance } from 'axios';
import CircuitBreaker from 'opossum';

/**
 * Appointment Service Client
 * Provides type-safe access to Appointment Service APIs
 */
export class AppointmentServiceClient {
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
   * Get today's appointments count
   */
  async getTodayAppointmentsCount(): Promise<number> {
    const response = await this.breaker.fire({
      method: 'GET',
      url: '/api/v1/stats/appointments/today',
    });
    return response.data.data.count;
  }

  /**
   * Get today's appointments details
   */
  async getTodayAppointments(): Promise<any[]> {
    const response = await this.breaker.fire({
      method: 'GET',
      url: '/api/v1/stats/appointments/today/details',
    });
    return response.data.data.appointments;
  }

  /**
   * Get pending appointments count
   */
  async getPendingAppointmentsCount(): Promise<number> {
    const response = await this.breaker.fire({
      method: 'GET',
      url: '/api/v1/stats/appointments/pending',
    });
    return response.data.data.count;
  }

  /**
   * Get all appointment stats
   */
  async getAllStats(): Promise<any> {
    const response = await this.breaker.fire({
      method: 'GET',
      url: '/api/v1/stats',
    });
    return response.data.data;
  }
}

export default AppointmentServiceClient;


