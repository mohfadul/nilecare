import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import CircuitBreaker from 'opossum';
import { NileCareResponse } from '@nilecare/response-wrapper';

/**
 * Clinical Service Client
 * Provides type-safe access to Clinical Service APIs
 */
export class ClinicalServiceClient {
  private baseUrl: string;
  private axiosInstance: AxiosInstance;
  private breaker: CircuitBreaker<[AxiosRequestConfig], any>;

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
      async (config: AxiosRequestConfig) => {
        return await this.axiosInstance.request(config);
      },
      {
        timeout: 10000,
        errorThresholdPercentage: 50,
        resetTimeout: 30000,
        volumeThreshold: 3,
      }
    );

    this.breaker.on('open', () => {
      console.error('Circuit breaker OPEN for clinical-service');
    });
  }

  /**
   * Set authorization token for requests
   */
  setAuthToken(token: string) {
    this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  /**
   * Set request ID for correlation tracking
   * Propagates request ID across service calls for end-to-end tracing
   */
  setRequestId(requestId: string) {
    this.axiosInstance.defaults.headers.common['X-Request-ID'] = requestId;
  }

  /**
   * Get patient count statistics
   */
  async getPatientsCount(): Promise<number> {
    const response = await this.breaker.fire({
      method: 'GET',
      url: '/api/v1/stats/patients/count',
    });
    return response.data.data.count;
  }

  /**
   * Get recent patients
   */
  async getRecentPatients(limit: number = 20): Promise<any[]> {
    const response = await this.breaker.fire({
      method: 'GET',
      url: '/api/v1/patients/recent',
      params: { limit },
    });
    return response.data.data.patients;
  }

  /**
   * Get single patient by ID
   */
  async getPatient(id: number): Promise<any> {
    const response = await this.breaker.fire({
      method: 'GET',
      url: `/api/v1/patients/${id}`,
    });
    return response.data.data.patient;
  }

  /**
   * Get patients list with pagination
   */
  async getPatients(params: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<NileCareResponse<any>> {
    const response = await this.breaker.fire({
      method: 'GET',
      url: '/api/v1/patients',
      params,
    });
    return response.data;
  }

  /**
   * Search patients
   */
  async searchPatients(query: string, filters?: any): Promise<any[]> {
    const response = await this.breaker.fire({
      method: 'GET',
      url: '/api/v1/patients/search',
      params: { q: query, ...filters },
    });
    return response.data.data.patients;
  }

  /**
   * Create new patient
   */
  async createPatient(data: any): Promise<any> {
    const response = await this.breaker.fire({
      method: 'POST',
      url: '/api/v1/patients',
      data,
    });
    return response.data.data.patient;
  }

  /**
   * Update patient
   */
  async updatePatient(id: number, data: any): Promise<any> {
    const response = await this.breaker.fire({
      method: 'PUT',
      url: `/api/v1/patients/${id}`,
      data,
    });
    return response.data.data.patient;
  }

  /**
   * Get encounters count
   */
  async getEncountersCount(): Promise<number> {
    const response = await this.breaker.fire({
      method: 'GET',
      url: '/api/v1/stats/encounters/count',
    });
    return response.data.data.count;
  }

  /**
   * Get today's encounters
   */
  async getTodayEncounters(): Promise<any[]> {
    const response = await this.breaker.fire({
      method: 'GET',
      url: '/api/v1/encounters/today',
    });
    return response.data.data.encounters;
  }
}

export default ClinicalServiceClient;
