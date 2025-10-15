import { apiClient, NileCareResponse } from './client';

export interface Medication {
  id: number;
  patientId: number;
  prescribedBy: number;
  medicationName: string;
  dosage: string;
  frequency: string;
  route: 'oral' | 'intravenous' | 'intramuscular' | 'subcutaneous' | 'topical' | 'inhalation' | 'other';
  duration?: string;
  startDate: string;
  endDate?: string;
  status: 'active' | 'discontinued' | 'completed' | 'on-hold';
  instructions?: string;
  reason?: string;
  discontinuedBy?: number;
  discontinuedAt?: string;
  discontinuedReason?: string;
  patientName?: string;
  providerName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMedicationRequest {
  patientId: number;
  prescribedBy: number;
  medicationName: string;
  dosage: string;
  frequency: string;
  route: 'oral' | 'intravenous' | 'intramuscular' | 'subcutaneous' | 'topical' | 'inhalation' | 'other';
  duration?: string;
  startDate: string;
  endDate?: string;
  instructions?: string;
  reason?: string;
}

export interface DiscontinueMedicationRequest {
  discontinuedBy: number;
  discontinuedReason: string;
}

export const medicationsApi = {
  // Get medications list
  async list(params: {
    page?: number;
    limit?: number;
    status?: string;
    patientId?: number;
  }): Promise<NileCareResponse<{ medications: Medication[] }>> {
    const response = await apiClient.get<NileCareResponse<{ medications: Medication[] }>>(
      '/api/v1/medications',
      { params }
    );
    return response.data;
  },

  // Get single medication
  async get(id: number): Promise<NileCareResponse<{ medication: Medication }>> {
    const response = await apiClient.get<NileCareResponse<{ medication: Medication }>>(
      `/api/v1/medications/${id}`
    );
    return response.data;
  },

  // Create medication (prescribe)
  async create(data: CreateMedicationRequest): Promise<NileCareResponse<{ medication: Medication }>> {
    const response = await apiClient.post<NileCareResponse<{ medication: Medication }>>(
      '/api/v1/medications',
      data
    );
    return response.data;
  },

  // Update medication
  async update(
    id: number,
    data: Partial<CreateMedicationRequest>
  ): Promise<NileCareResponse<{ medication: Medication }>> {
    const response = await apiClient.put<NileCareResponse<{ medication: Medication }>>(
      `/api/v1/medications/${id}`,
      data
    );
    return response.data;
  },

  // Discontinue medication
  async discontinue(
    id: number,
    data: DiscontinueMedicationRequest
  ): Promise<NileCareResponse<{ medication: Medication }>> {
    const response = await apiClient.patch<NileCareResponse<{ medication: Medication }>>(
      `/api/v1/medications/${id}/discontinue`,
      data
    );
    return response.data;
  },

  // Get patient medications
  async getPatientMedications(patientId: number): Promise<NileCareResponse<{ medications: Medication[] }>> {
    const response = await apiClient.get<NileCareResponse<{ medications: Medication[] }>>(
      `/api/v1/medications/patient/${patientId}`
    );
    return response.data;
  },

  // Get active medications
  async getActive(): Promise<NileCareResponse<{ medications: Medication[] }>> {
    const response = await apiClient.get<NileCareResponse<{ medications: Medication[] }>>(
      '/api/v1/medications/active'
    );
    return response.data;
  },
};

