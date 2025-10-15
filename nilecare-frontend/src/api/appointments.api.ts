import { apiClient, NileCareResponse } from './client';

export interface Appointment {
  id: number;
  patientId: number;
  providerId: number;
  appointmentDate: string;
  appointmentTime: string;
  duration: number;
  status: 'scheduled' | 'confirmed' | 'checked-in' | 'in-progress' | 'completed' | 'cancelled' | 'no-show';
  reason: string;
  notes?: string;
  patientFirstName?: string;
  patientLastName?: string;
  providerFirstName?: string;
  providerLastName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentListResponse {
  appointments: Appointment[];
}

export interface CreateAppointmentRequest {
  patientId: number;
  providerId: number;
  appointmentDate: string;
  appointmentTime: string;
  duration: number;
  reason: string;
  notes?: string;
}

export interface AvailableSlot {
  time: string;
  available: boolean;
}

export interface AvailableSlotsResponse {
  providerId: number;
  date: string;
  duration: number;
  availableSlots: string[];
  totalSlots: number;
}

export const appointmentsApi = {
  // Get appointments list
  async list(params: {
    page?: number;
    limit?: number;
    status?: string;
    providerId?: number;
    patientId?: number;
    date?: string;
  }): Promise<NileCareResponse<AppointmentListResponse>> {
    const response = await apiClient.get<NileCareResponse<AppointmentListResponse>>(
      '/api/v1/appointments',
      { params }
    );
    return response.data;
  },

  // Get single appointment
  async get(id: number): Promise<NileCareResponse<{ appointment: Appointment }>> {
    const response = await apiClient.get<NileCareResponse<{ appointment: Appointment }>>(
      `/api/v1/appointments/${id}`
    );
    return response.data;
  },

  // Create appointment
  async create(data: CreateAppointmentRequest): Promise<NileCareResponse<{ appointment: Appointment }>> {
    const response = await apiClient.post<NileCareResponse<{ appointment: Appointment }>>(
      '/api/v1/appointments',
      data
    );
    return response.data;
  },

  // Update appointment
  async update(
    id: number,
    data: Partial<CreateAppointmentRequest>
  ): Promise<NileCareResponse<{ appointment: Appointment }>> {
    const response = await apiClient.put<NileCareResponse<{ appointment: Appointment }>>(
      `/api/v1/appointments/${id}`,
      data
    );
    return response.data;
  },

  // Update appointment status
  async updateStatus(
    id: number,
    status: Appointment['status']
  ): Promise<NileCareResponse<{ appointment: Appointment }>> {
    const response = await apiClient.patch<NileCareResponse<{ appointment: Appointment }>>(
      `/api/v1/appointments/${id}/status`,
      { status }
    );
    return response.data;
  },

  // Confirm appointment
  async confirm(id: number): Promise<NileCareResponse<{ appointment: Appointment }>> {
    const response = await apiClient.patch<NileCareResponse<{ appointment: Appointment }>>(
      `/api/v1/appointments/${id}/confirm`
    );
    return response.data;
  },

  // Complete appointment
  async complete(id: number): Promise<NileCareResponse<{ appointment: Appointment }>> {
    const response = await apiClient.patch<NileCareResponse<{ appointment: Appointment }>>(
      `/api/v1/appointments/${id}/complete`
    );
    return response.data;
  },

  // Cancel appointment
  async cancel(id: number): Promise<NileCareResponse<void>> {
    const response = await apiClient.delete<NileCareResponse<void>>(
      `/api/v1/appointments/${id}`
    );
    return response.data;
  },

  // Get available time slots
  async getAvailableSlots(params: {
    providerId: number;
    date: string;
    duration?: number;
  }): Promise<NileCareResponse<AvailableSlotsResponse>> {
    const response = await apiClient.get<NileCareResponse<AvailableSlotsResponse>>(
      '/api/v1/schedules/available-slots',
      { params }
    );
    return response.data;
  },

  // Get today's appointments
  async getToday(providerId?: number): Promise<NileCareResponse<AppointmentListResponse>> {
    const response = await apiClient.get<NileCareResponse<AppointmentListResponse>>(
      '/api/v1/appointments/today',
      { params: { providerId } }
    );
    return response.data;
  },

  // Get appointment statistics
  async getStatistics(params: {
    dateFrom?: string;
    dateTo?: string;
  }): Promise<NileCareResponse<any>> {
    const response = await apiClient.get<NileCareResponse<any>>(
      '/api/v1/appointments/stats',
      { params }
    );
    return response.data;
  },
};

