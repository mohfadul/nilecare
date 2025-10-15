import { apiClient, NileCareResponse } from './client';

export interface LabOrder {
  id: number;
  patientId: number;
  orderedBy: number;
  testName: string;
  testCode: string;
  category: string;
  priority: 'routine' | 'urgent' | 'stat';
  status: 'ordered' | 'pending' | 'in-progress' | 'completed' | 'cancelled';
  orderDate: string;
  sampleCollectedAt?: string;
  resultDate?: string;
  notes?: string;
  patientName?: string;
  providerName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LabResult {
  id: number;
  labOrderId: number;
  testName: string;
  value: string;
  unit: string;
  referenceRange: string;
  isAbnormal: boolean;
  interpretation?: string;
  performedBy?: number;
  performedAt: string;
}

export interface CreateLabOrderRequest {
  patientId: number;
  orderedBy: number;
  testName: string;
  testCode: string;
  category: string;
  priority: 'routine' | 'urgent' | 'stat';
  notes?: string;
}

export interface SubmitLabResultRequest {
  testName: string;
  value: string;
  unit: string;
  referenceRange: string;
  isAbnormal: boolean;
  interpretation?: string;
  performedBy: number;
}

export const labsApi = {
  // Get lab orders list
  async list(params: {
    page?: number;
    limit?: number;
    status?: string;
    patientId?: number;
    priority?: string;
  }): Promise<NileCareResponse<{ labOrders: LabOrder[] }>> {
    const response = await apiClient.get<NileCareResponse<{ labOrders: LabOrder[] }>>(
      '/api/v1/labs',
      { params }
    );
    return response.data;
  },

  // Get single lab order
  async get(id: number): Promise<NileCareResponse<{ labOrder: LabOrder }>> {
    const response = await apiClient.get<NileCareResponse<{ labOrder: LabOrder }>>(
      `/api/v1/labs/${id}`
    );
    return response.data;
  },

  // Create lab order
  async create(data: CreateLabOrderRequest): Promise<NileCareResponse<{ labOrder: LabOrder }>> {
    const response = await apiClient.post<NileCareResponse<{ labOrder: LabOrder }>>(
      '/api/v1/labs',
      data
    );
    return response.data;
  },

  // Update lab order
  async update(id: number, data: Partial<CreateLabOrderRequest>): Promise<NileCareResponse<{ labOrder: LabOrder }>> {
    const response = await apiClient.put<NileCareResponse<{ labOrder: LabOrder }>>(
      `/api/v1/labs/${id}`,
      data
    );
    return response.data;
  },

  // Cancel lab order
  async cancel(id: number): Promise<NileCareResponse<void>> {
    const response = await apiClient.delete<NileCareResponse<void>>(
      `/api/v1/labs/${id}`
    );
    return response.data;
  },

  // Get lab results
  async getResults(labOrderId: number): Promise<NileCareResponse<{ results: LabResult[] }>> {
    const response = await apiClient.get<NileCareResponse<{ results: LabResult[] }>>(
      `/api/v1/labs/${labOrderId}/results`
    );
    return response.data;
  },

  // Submit lab results (lab technician)
  async submitResults(
    labOrderId: number,
    results: SubmitLabResultRequest[]
  ): Promise<NileCareResponse<{ results: LabResult[] }>> {
    const response = await apiClient.post<NileCareResponse<{ results: LabResult[] }>>(
      `/api/v1/labs/${labOrderId}/results`,
      { results }
    );
    return response.data;
  },

  // Get pending lab orders
  async getPending(): Promise<NileCareResponse<{ labOrders: LabOrder[] }>> {
    const response = await apiClient.get<NileCareResponse<{ labOrders: LabOrder[] }>>(
      '/api/v1/labs/pending'
    );
    return response.data;
  },

  // Get patient lab history
  async getPatientLabs(patientId: number): Promise<NileCareResponse<{ labOrders: LabOrder[] }>> {
    const response = await apiClient.get<NileCareResponse<{ labOrders: LabOrder[] }>>(
      `/api/v1/labs/patient/${patientId}`
    );
    return response.data;
  },
};

