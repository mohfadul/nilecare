import axios, { AxiosInstance } from 'axios';
import { logger } from '../../utils/logger';

/**
 * Appointment Service Client
 * Handles communication with Appointment Service for lab orders from appointments
 */

export interface AppointmentInfo {
  appointmentId: string;
  patientId: string;
  providerId: string;
  appointmentDate: Date;
  status: string;
}

export class AppointmentServiceClient {
  private client: AxiosInstance;
  private appointmentServiceUrl: string;
  private apiKey: string;

  constructor() {
    this.appointmentServiceUrl = process.env.APPOINTMENT_SERVICE_URL || 'http://localhost:7040';
    this.apiKey = process.env.APPOINTMENT_SERVICE_API_KEY || '';

    if (!this.apiKey) {
      logger.warn('APPOINTMENT_SERVICE_API_KEY not configured. Service-to-service calls may fail.');
    }

    this.client = axios.create({
      baseURL: this.appointmentServiceUrl,
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json',
        'X-Service-Name': 'lab-service',
        'X-API-Key': this.apiKey,
      },
    });

    // Add interceptors for logging
    this.client.interceptors.request.use(
      (config) => {
        logger.debug(`Appointment Service Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        logger.error('Appointment Service Request Error', { error: error.message });
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => {
        logger.debug(`Appointment Service Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        logger.error('Appointment Service Response Error', {
          url: error.config?.url,
          status: error.response?.status,
          message: error.message,
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get appointment details
   */
  async getAppointment(appointmentId: string): Promise<AppointmentInfo | null> {
    try {
      const response = await this.client.get(`/api/v1/appointments/${appointmentId}`);

      if (response.data.success && response.data.data) {
        return {
          appointmentId: response.data.data.id,
          patientId: response.data.data.patientId,
          providerId: response.data.data.providerId,
          appointmentDate: new Date(response.data.data.appointmentDate),
          status: response.data.data.status,
        };
      }

      return null;
    } catch (error: any) {
      logger.error('Get appointment failed', { error: error.message, appointmentId });
      return null;
    }
  }

  /**
   * Notify appointment that lab order was created
   */
  async notifyLabOrderCreated(appointmentId: string, labOrderId: string): Promise<boolean> {
    try {
      const response = await this.client.post(`/api/v1/appointments/${appointmentId}/lab-order`, {
        labOrderId,
        status: 'lab_ordered',
      });

      return response.data.success;
    } catch (error: any) {
      logger.error('Notify lab order failed', { error: error.message, appointmentId });
      return false;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.status === 200;
    } catch (error: any) {
      logger.error('Appointment Service health check failed', { error: error.message });
      return false;
    }
  }
}

export default AppointmentServiceClient;

