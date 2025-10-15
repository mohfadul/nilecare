/**
 * Centralized API Client
 * Handles all HTTP requests with authentication, token refresh, and error handling
 */

import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

class ApiClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value?: any) => void;
    reject: (reason?: any) => void;
  }> = [];

  constructor() {
    // Use main-nilecare orchestrator (port 7000) as per NileCare documentation
    // This is the single source of truth for all API requests
    const baseURL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:7000';
    
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true, // For cookies (refresh token)
    });

    this.setupInterceptors();
  }

  /**
   * Setup request/response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('accessToken');
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle errors and token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        // Handle 401 Unauthorized (token expired)
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // Queue requests while refreshing
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            })
              .then((token) => {
                if (originalRequest.headers) {
                  originalRequest.headers.Authorization = `Bearer ${token}`;
                }
                return this.client(originalRequest);
              })
              .catch((err) => Promise.reject(err));
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            // Attempt to refresh token
            const response = await axios.post(
              `${this.client.defaults.baseURL}/api/v1/auth/refresh-token`,
              {},
              { withCredentials: true }
            );

            const { accessToken } = response.data;
            localStorage.setItem('accessToken', accessToken);

            // Process queued requests
            this.failedQueue.forEach(({ resolve }) => resolve(accessToken));
            this.failedQueue = [];

            // Retry original request
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            }
            return this.client(originalRequest);

          } catch (refreshError) {
            // Refresh failed - clear auth and redirect
            this.failedQueue.forEach(({ reject }) => reject(refreshError));
            this.failedQueue = [];
            this.handleAuthError();
            return Promise.reject(refreshError);

          } finally {
            this.isRefreshing = false;
          }
        }

        // Handle rate limiting
        if (error.response?.status === 429) {
          const retryAfter = error.response.headers['retry-after'];
          console.warn(`Rate limited. Retry after ${retryAfter} seconds`);
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Handle authentication error
   */
  private handleAuthError(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }

  /**
   * Extract error message from response
   */
  private getErrorMessage(error: any): string {
    if (error.response?.data?.error?.message) {
      return error.response.data.error.message;
    }
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.message) {
      return error.message;
    }
    return 'An unexpected error occurred';
  }

  // ============================================================================
  // AUTHENTICATION APIs
  // ============================================================================

  async login(email: string, password: string): Promise<ApiResponse> {
    const response = await this.client.post('/api/v1/auth/login', { email, password });
    return response.data;
  }

  async logout(): Promise<ApiResponse> {
    const response = await this.client.post('/api/v1/auth/logout');
    return response.data;
  }

  async register(data: { email: string; username: string; password: string }): Promise<ApiResponse> {
    const response = await this.client.post('/api/v1/auth/register', data);
    return response.data;
  }

  // ============================================================================
  // PAYMENT APIs
  // ============================================================================

  async initiatePayment(data: {
    invoiceId: string;
    patientId: string;
    facilityId: string;
    provider: string;
    amount: number;
    currency: string;
    description: string;
    paymentMethodDetails?: any;
  }): Promise<ApiResponse> {
    const response = await this.client.post('/api/v1/payments/initiate', data);
    return response.data;
  }

  async getPayment(paymentId: string): Promise<ApiResponse> {
    const response = await this.client.get(`/api/v1/payments/${paymentId}`);
    return response.data;
  }

  async listPayments(filters?: any): Promise<ApiResponse> {
    const response = await this.client.get('/api/v1/payments', { params: filters });
    return response.data;
  }

  async getPendingVerifications(filters?: any): Promise<ApiResponse> {
    const response = await this.client.get('/api/v1/payments/pending-verification', { params: filters });
    return response.data;
  }

  async verifyPayment(data: {
    paymentId: string;
    verificationMethod: string;
    verifiedBy: string;
    verificationNotes: string;
  }): Promise<ApiResponse> {
    const response = await this.client.post('/api/v1/payments/verify', data);
    return response.data;
  }

  async cancelPayment(paymentId: string, reason: string): Promise<ApiResponse> {
    const response = await this.client.patch(`/api/v1/payments/${paymentId}/cancel`, { reason });
    return response.data;
  }

  // ============================================================================
  // PATIENT APIs
  // ============================================================================

  async getPatients(params?: { page?: number; limit?: number; search?: string }): Promise<ApiResponse> {
    const response = await this.client.get('/api/v1/patients', { params });
    return response.data;
  }

  async getPatient(patientId: string): Promise<ApiResponse> {
    const response = await this.client.get(`/api/v1/patients/${patientId}`);
    return response.data;
  }

  async createPatient(data: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: string;
    phoneNumber: string;
    email?: string;
    address?: any;
  }): Promise<ApiResponse> {
    const response = await this.client.post('/api/v1/patients', data);
    return response.data;
  }

  async updatePatient(patientId: string, data: any): Promise<ApiResponse> {
    const response = await this.client.put(`/api/v1/patients/${patientId}`, data);
    return response.data;
  }

  async deletePatient(patientId: string): Promise<ApiResponse> {
    const response = await this.client.delete(`/api/v1/patients/${patientId}`);
    return response.data;
  }

  async getPatientEncounters(patientId: string, params?: any): Promise<ApiResponse> {
    const response = await this.client.get(`/api/v1/patients/${patientId}/encounters`, { params });
    return response.data;
  }

  // ============================================================================
  // APPOINTMENT APIs
  // ============================================================================

  async getAppointments(params?: {
    page?: number;
    limit?: number;
    patientId?: string;
    providerId?: string;
    status?: string;
    date?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse> {
    const response = await this.client.get('/api/v1/appointments', { params });
    return response.data;
  }

  async getAppointment(appointmentId: string): Promise<ApiResponse> {
    const response = await this.client.get(`/api/v1/appointments/${appointmentId}`);
    return response.data;
  }

  async createAppointment(data: {
    patientId: string;
    providerId: string;
    appointmentDate: string;
    appointmentType: string;
    duration: number;
    reason?: string;
  }): Promise<ApiResponse> {
    const response = await this.client.post('/api/v1/appointments', data);
    return response.data;
  }

  async updateAppointment(appointmentId: string, data: any): Promise<ApiResponse> {
    const response = await this.client.put(`/api/v1/appointments/${appointmentId}`, data);
    return response.data;
  }

  async cancelAppointment(appointmentId: string, reason?: string): Promise<ApiResponse> {
    const response = await this.client.delete(`/api/v1/appointments/${appointmentId}`, {
      data: { reason }
    });
    return response.data;
  }

  async confirmAppointment(appointmentId: string): Promise<ApiResponse> {
    const response = await this.client.patch(`/api/v1/appointments/${appointmentId}/confirm`);
    return response.data;
  }

  async completeAppointment(appointmentId: string, notes?: string): Promise<ApiResponse> {
    const response = await this.client.patch(`/api/v1/appointments/${appointmentId}/complete`, { notes });
    return response.data;
  }

  async getProviderAvailability(providerId: string, date: string, duration?: number): Promise<ApiResponse> {
    const response = await this.client.get('/api/v1/appointments/availability', {
      params: { providerId, date, duration }
    });
    return response.data;
  }

  // ============================================================================
  // CLINICAL APIs
  // ============================================================================

  async getEncounters(params?: any): Promise<ApiResponse> {
    const response = await this.client.get('/api/v1/encounters', { params });
    return response.data;
  }

  async createEncounter(data: any): Promise<ApiResponse> {
    const response = await this.client.post('/api/v1/encounters', data);
    return response.data;
  }

  async saveSoapNote(data: any): Promise<ApiResponse> {
    const response = await this.client.post('/api/v1/soap-notes', data);
    return response.data;
  }

  async saveProgressNote(data: any): Promise<ApiResponse> {
    const response = await this.client.post('/api/v1/progress-notes', data);
    return response.data;
  }

  // ============================================================================
  // MEDICATION APIs
  // ============================================================================

  async getMedications(params?: any): Promise<ApiResponse> {
    const response = await this.client.get('/api/v1/medications', { params });
    return response.data;
  }

  async createMedication(data: any): Promise<ApiResponse> {
    const response = await this.client.post('/api/v1/medications', data);
    return response.data;
  }

  async administerMedication(data: any): Promise<ApiResponse> {
    const response = await this.client.post('/api/v1/medication-administration', data);
    return response.data;
  }

  async verifyBarcode(barcodeData: string): Promise<ApiResponse> {
    const response = await this.client.post('/api/v1/barcode-verification', { barcodeData });
    return response.data;
  }

  // ============================================================================
  // LAB APIs
  // ============================================================================

  async getLabOrders(params?: any): Promise<ApiResponse> {
    const response = await this.client.get('/api/v1/lab-orders', { params });
    return response.data;
  }

  async createLabOrder(data: any): Promise<ApiResponse> {
    const response = await this.client.post('/api/v1/lab-orders', data);
    return response.data;
  }

  async processLabResult(data: any): Promise<ApiResponse> {
    const response = await this.client.post('/api/v1/process-lab-result', data);
    return response.data;
  }

  // ============================================================================
  // BILLING APIs
  // ============================================================================

  async createInvoice(data: any): Promise<ApiResponse> {
    const response = await this.client.post('/api/v1/billing', data);
    return response.data;
  }

  async submitClaim(data: any): Promise<ApiResponse> {
    const response = await this.client.post('/api/v1/claims', data);
    return response.data;
  }

  async getInsuranceInfo(patientId: string): Promise<ApiResponse> {
    const response = await this.client.get(`/api/v1/insurance/${patientId}`);
    return response.data;
  }

  // ============================================================================
  // INVENTORY APIs
  // ============================================================================

  async getInventoryItems(params?: any): Promise<ApiResponse> {
    const response = await this.client.get('/api/v1/inventory', { params });
    return response.data;
  }

  async updateInventory(itemId: string, data: any): Promise<ApiResponse> {
    const response = await this.client.put(`/api/v1/inventory/${itemId}`, data);
    return response.data;
  }

  async getLowStockItems(): Promise<ApiResponse> {
    const response = await this.client.get('/api/v1/inventory/low-stock');
    return response.data;
  }

  // ============================================================================
  // FACILITY APIs
  // ============================================================================

  async getFacilities(params?: any): Promise<ApiResponse> {
    const response = await this.client.get('/api/v1/facilities', { params });
    return response.data;
  }

  async getBedStatus(facilityId: string): Promise<ApiResponse> {
    const response = await this.client.get(`/api/v1/facilities/${facilityId}/beds`);
    return response.data;
  }

  // ============================================================================
  // USER MANAGEMENT APIs
  // ============================================================================

  async getUsers(params?: { page?: number; limit?: number; search?: string }): Promise<ApiResponse> {
    const response = await this.client.get('/api/v1/data/users/all', { params });
    return response.data;
  }

  async getUser(userId: string): Promise<ApiResponse> {
    const response = await this.client.get(`/api/v1/users/${userId}`);
    return response.data;
  }

  async createUser(data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    role: string;
    phone?: string;
    national_id?: string;
    specialty?: string;
  }): Promise<ApiResponse> {
    const response = await this.client.post('/api/v1/users', data);
    return response.data;
  }

  async updateUser(userId: string, data: any): Promise<ApiResponse> {
    const response = await this.client.put(`/api/v1/users/${userId}`, data);
    return response.data;
  }

  async deleteUser(userId: string): Promise<ApiResponse> {
    const response = await this.client.delete(`/api/v1/users/${userId}`);
    return response.data;
  }

  // ============================================================================
  // APPOINTMENT STATUS APIs
  // ============================================================================

  async checkInAppointment(appointmentId: string): Promise<ApiResponse> {
    const response = await this.client.patch(`/api/v1/appointments/${appointmentId}/status`, {
      status: 'checked-in'
    });
    return response.data;
  }

  async completeAppointmentStatus(appointmentId: string): Promise<ApiResponse> {
    const response = await this.client.patch(`/api/v1/appointments/${appointmentId}/status`, {
      status: 'completed'
    });
    return response.data;
  }

  async noShowAppointment(appointmentId: string): Promise<ApiResponse> {
    const response = await this.client.patch(`/api/v1/appointments/${appointmentId}/status`, {
      status: 'no-show'
    });
    return response.data;
  }

  // ============================================================================
  // BULK OPERATIONS APIs
  // ============================================================================

  async bulkDeletePatients(ids: string[]): Promise<ApiResponse> {
    const response = await this.client.delete('/api/v1/bulk/patients', {
      data: { ids }
    });
    return response.data;
  }

  async bulkDeleteAppointments(ids: string[]): Promise<ApiResponse> {
    const response = await this.client.delete('/api/v1/bulk/appointments', {
      data: { ids }
    });
    return response.data;
  }

  async bulkDeleteUsers(ids: string[]): Promise<ApiResponse> {
    const response = await this.client.delete('/api/v1/bulk/users', {
      data: { ids }
    });
    return response.data;
  }

  async bulkUpdateAppointmentStatus(ids: string[], status: string): Promise<ApiResponse> {
    const response = await this.client.patch('/api/v1/bulk/appointments/status', {
      ids,
      status
    });
    return response.data;
  }

  async bulkUpdateUserStatus(ids: string[], status: 'active' | 'inactive'): Promise<ApiResponse> {
    const response = await this.client.patch('/api/v1/bulk/users/status', {
      ids,
      status
    });
    return response.data;
  }

  // ============================================================================
  // ADVANCED SEARCH APIs
  // ============================================================================

  async advancedSearchPatients(filters: {
    searchTerm?: string;
    gender?: string;
    minAge?: number;
    maxAge?: number;
    bloodType?: string;
    city?: string;
    state?: string;
    hasAllergies?: boolean;
    hasMedicalConditions?: boolean;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse> {
    const response = await this.client.post('/api/v1/search/patients', filters);
    return response.data;
  }

  async advancedSearchAppointments(filters: {
    searchTerm?: string;
    patientId?: string;
    providerId?: string;
    status?: string;
    statuses?: string[];
    dateFrom?: string;
    dateTo?: string;
    duration?: number;
    appointmentType?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse> {
    const response = await this.client.post('/api/v1/search/appointments', filters);
    return response.data;
  }

  async advancedSearchUsers(filters: {
    searchTerm?: string;
    role?: string;
    roles?: string[];
    status?: string;
    specialty?: string;
    department?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse> {
    const response = await this.client.post('/api/v1/search/users', filters);
    return response.data;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;

