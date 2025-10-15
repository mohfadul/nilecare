import { apiClient, NileCareResponse } from './client';

export interface Patient {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  nationalId: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  address: string;
  city: string;
  country: string;
  bloodType?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  allergies?: string[];
  medicalHistory?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PatientListResponse {
  patients: Patient[];
}

export interface CreatePatientRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  nationalId: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  address: string;
  city: string;
  country: string;
  bloodType?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  allergies?: string[];
  medicalHistory?: string[];
}

export const patientsApi = {
  // Get patients list
  async list(params: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<NileCareResponse<PatientListResponse>> {
    const response = await apiClient.get<NileCareResponse<PatientListResponse>>(
      '/api/v1/patients',
      { params }
    );
    return response.data;
  },

  // Get single patient
  async get(id: number): Promise<NileCareResponse<{ patient: Patient }>> {
    const response = await apiClient.get<NileCareResponse<{ patient: Patient }>>(
      `/api/v1/patients/${id}`
    );
    return response.data;
  },

  // Create patient
  async create(data: CreatePatientRequest): Promise<NileCareResponse<{ patient: Patient }>> {
    const response = await apiClient.post<NileCareResponse<{ patient: Patient }>>(
      '/api/v1/patients',
      data
    );
    return response.data;
  },

  // Update patient
  async update(
    id: number,
    data: Partial<CreatePatientRequest>
  ): Promise<NileCareResponse<{ patient: Patient }>> {
    const response = await apiClient.put<NileCareResponse<{ patient: Patient }>>(
      `/api/v1/patients/${id}`,
      data
    );
    return response.data;
  },

  // Delete patient (soft delete)
  async delete(id: number): Promise<NileCareResponse<void>> {
    const response = await apiClient.delete<NileCareResponse<void>>(
      `/api/v1/patients/${id}`
    );
    return response.data;
  },

  // Get complete patient data (aggregated)
  async getComplete(id: number): Promise<NileCareResponse<any>> {
    const response = await apiClient.get<NileCareResponse<any>>(
      `/api/v1/patients/${id}/complete`
    );
    return response.data;
  },

  // Search patients
  async search(query: string): Promise<NileCareResponse<PatientListResponse>> {
    const response = await apiClient.get<NileCareResponse<PatientListResponse>>(
      '/api/v1/patients',
      { params: { search: query } }
    );
    return response.data;
  },
};

