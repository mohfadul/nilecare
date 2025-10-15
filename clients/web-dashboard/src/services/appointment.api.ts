/**
 * Appointment Service API Client
 * Handles all appointment-related API calls
 */

import axios, { AxiosInstance } from 'axios';

class AppointmentApiClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor() {
    // Use main-nilecare orchestrator (port 7000) as per documentation
    // Orchestrator routes: /api/appointment/* → appointment-service:7040/api/v1/*
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:7000';
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
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

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('Appointment API Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  // ============================================================================
  // APPOINTMENT ENDPOINTS
  // ============================================================================

  /**
   * Get all appointments with filters
   */
  async getAppointments(params?: {
    page?: number;
    limit?: number;
    status?: string;
    providerId?: string;
    patientId?: string;
    date?: string;
  }) {
    const response = await this.client.get('/api/appointment/appointments', { params });
    return response.data;
  }

  /**
   * Get appointment by ID
   */
  async getAppointmentById(id: string) {
    const response = await this.client.get(`/api/appointment/appointments/${id}`);
    return response.data;
  }

  /**
   * Get today's appointments
   */
  async getTodayAppointments(providerId?: string) {
    const response = await this.client.get('/api/appointment/appointments/today', {
      params: { providerId },
    });
    return response.data;
  }

  /**
   * Get appointment statistics
   */
  async getAppointmentStats(params?: {
    dateFrom?: string;
    dateTo?: string;
    providerId?: string;
  }) {
    const response = await this.client.get('/api/appointment/appointments/stats', { params });
    return response.data;
  }

  /**
   * Create new appointment
   */
  async createAppointment(data: {
    patientId: string;
    providerId: string;
    appointmentDate: string;
    appointmentTime: string;
    duration: number;
    reason?: string;
    notes?: string;
  }) {
    const response = await this.client.post('/api/appointment/appointments', data);
    return response.data;
  }

  /**
   * Update appointment
   */
  async updateAppointment(id: string, data: any) {
    const response = await this.client.put(`/api/appointment/appointments/${id}`, data);
    return response.data;
  }

  /**
   * Update appointment status
   */
  async updateAppointmentStatus(id: string, status: string) {
    const response = await this.client.patch(`/api/appointment/appointments/${id}/status`, { status });
    return response.data;
  }

  /**
   * Confirm appointment
   */
  async confirmAppointment(id: string) {
    const response = await this.client.patch(`/api/appointment/appointments/${id}/confirm`);
    return response.data;
  }

  /**
   * Complete appointment
   */
  async completeAppointment(id: string) {
    const response = await this.client.patch(`/api/appointment/appointments/${id}/complete`);
    return response.data;
  }

  /**
   * Cancel appointment
   */
  async cancelAppointment(id: string) {
    const response = await this.client.delete(`/api/appointment/appointments/${id}`);
    return response.data;
  }

  // ============================================================================
  // SCHEDULE ENDPOINTS
  // ============================================================================

  /**
   * Get provider schedule
   */
  async getProviderSchedule(providerId: string, dateFrom?: string, dateTo?: string) {
    const response = await this.client.get(`/api/appointment/schedules/provider/${providerId}`, {
      params: { dateFrom, dateTo },
    });
    return response.data;
  }

  /**
   * Get available time slots
   */
  async getAvailableSlots(providerId: string, date: string, duration: number = 30) {
    const response = await this.client.get('/api/appointment/schedules/available-slots', {
      params: { providerId, date, duration },
    });
    return response.data;
  }

  // ============================================================================
  // RESOURCE ENDPOINTS
  // ============================================================================

  /**
   * Get all resources
   */
  async getResources(type?: string) {
    const response = await this.client.get('/api/appointment/resources', {
      params: { type },
    });
    return response.data;
  }

  /**
   * Check resource availability
   */
  async checkResourceAvailability(
    resourceId: string,
    date: string,
    timeFrom: string,
    timeTo: string
  ) {
    const response = await this.client.get(`/api/appointment/resources/${resourceId}/availability`, {
      params: { date, timeFrom, timeTo },
    });
    return response.data;
  }

  // ============================================================================
  // WAITLIST ENDPOINTS
  // ============================================================================

  /**
   * Get waitlist entries
   */
  async getWaitlist(providerId?: string, status: string = 'waiting') {
    const response = await this.client.get('/api/appointment/waitlist', {
      params: { providerId, status },
    });
    return response.data;
  }

  /**
   * Add patient to waitlist
   */
  async addToWaitlist(data: {
    patientId: string;
    providerId: string;
    preferredDate?: string;
    reason?: string;
  }) {
    const response = await this.client.post('/api/appointment/waitlist', data);
    return response.data;
  }

  /**
   * Mark waitlist entry as contacted
   */
  async markWaitlistContacted(id: string) {
    const response = await this.client.patch(`/api/appointment/waitlist/${id}/contacted`);
    return response.data;
  }

  /**
   * Remove from waitlist
   */
  async removeFromWaitlist(id: string) {
    const response = await this.client.delete(`/api/appointment/waitlist/${id}`);
    return response.data;
  }

  // ============================================================================
  // REMINDER ENDPOINTS
  // ============================================================================

  /**
   * Get pending reminders
   */
  async getPendingReminders() {
    const response = await this.client.get('/api/appointment/reminders/pending');
    return response.data;
  }

  /**
   * Process pending reminders
   */
  async processPendingReminders() {
    const response = await this.client.post('/api/appointment/reminders/process');
    return response.data;
  }

  /**
   * Schedule reminders for appointment
   */
  async scheduleReminders(appointmentId: string) {
    const response = await this.client.post(`/api/appointment/reminders/appointment/${appointmentId}`);
    return response.data;
  }

  // ============================================================================
  // HEALTH CHECK
  // ============================================================================

  /**
   * Check service health
   */
  async checkHealth() {
    const response = await this.client.get('/api/appointment/health');
    return response.data;
  }
}

// Export singleton instance
export const appointmentApi = new AppointmentApiClient();
export default appointmentApi;

