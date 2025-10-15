/**
 * Business Service API Client
 * Handles all business-related operations via the orchestrator
 */

import axios, { AxiosInstance } from 'axios';
import { API_BASE_URL } from '../config/api.config';

const API_URL = API_BASE_URL;

class BusinessService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: `${API_URL}/api`,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth token to requests
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired, redirect to login
          localStorage.removeItem('accessToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // =================================================================
  // APPOINTMENTS
  // =================================================================

  async getAppointments(params?: { patientId?: string; doctorId?: string; date?: string }) {
    const response = await this.client.get('/business/appointments', { params });
    return response.data;
  }

  async getAppointment(id: string) {
    const response = await this.client.get(`/business/appointments/${id}`);
    return response.data;
  }

  async createAppointment(data: {
    patientId: string;
    doctorId: string;
    appointmentDate: string;
    startTime: string;
    endTime: string;
    duration: number;
    type: string;
    reason?: string;
    notes?: string;
  }) {
    const response = await this.client.post('/business/appointments', data);
    return response.data;
  }

  async updateAppointment(id: string, data: any) {
    const response = await this.client.put(`/business/appointments/${id}`, data);
    return response.data;
  }

  async cancelAppointment(id: string, reason?: string) {
    const response = await this.client.patch(`/business/appointments/${id}/cancel`, { reason });
    return response.data;
  }

  // =================================================================
  // BILLING
  // =================================================================

  async getBillingRecords(params?: { patientId?: string; status?: string }) {
    const response = await this.client.get('/business/billing', { params });
    return response.data;
  }

  async getBillingRecord(id: string) {
    const response = await this.client.get(`/business/billing/${id}`);
    return response.data;
  }

  async createInvoice(data: {
    patientId: string;
    items: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      total: number;
      category: string;
    }>;
    tax?: number;
    discount?: number;
    dueDate: string;
    notes?: string;
  }) {
    const response = await this.client.post('/business/billing', data);
    return response.data;
  }

  async updateInvoice(id: string, data: any) {
    const response = await this.client.put(`/business/billing/${id}`, data);
    return response.data;
  }

  // =================================================================
  // STAFF
  // =================================================================

  async getStaff(params?: { role?: string; department?: string }) {
    const response = await this.client.get('/business/staff', { params });
    return response.data;
  }

  async getStaffMember(id: string) {
    const response = await this.client.get(`/business/staff/${id}`);
    return response.data;
  }

  async createStaffMember(data: {
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    department?: string;
    specialization?: string;
    phone?: string;
  }) {
    const response = await this.client.post('/business/staff', data);
    return response.data;
  }

  // =================================================================
  // SCHEDULING
  // =================================================================

  async getSchedules(params?: { staffId?: string; date?: string }) {
    const response = await this.client.get('/business/scheduling', { params });
    return response.data;
  }

  async getAvailableSlots(doctorId: string, date: string) {
    const response = await this.client.get('/business/scheduling/slots', {
      params: { doctorId, date },
    });
    return response.data;
  }

  // =================================================================
  // HEALTH CHECK
  // =================================================================

  async checkHealth() {
    const response = await this.client.get('/business/health');
    return response.data;
  }
}

export const businessService = new BusinessService();
export default businessService;

