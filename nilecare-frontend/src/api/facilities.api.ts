import { apiClient, NileCareResponse } from './client';

export interface Facility {
  id: number;
  facilityCode: string;
  name: string;
  type: 'hospital' | 'clinic' | 'lab' | 'pharmacy' | 'rehabilitation' | 'other';
  address: string;
  city: string;
  state: string;
  country: string;
  phone: string;
  email: string;
  capacity: number;
  status: 'active' | 'inactive' | 'maintenance';
  organizationId?: number;
  licenseNumber?: string;
  licenseExpiry?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  id: number;
  facilityId: number;
  name: string;
  description?: string;
  headOfDepartment?: number;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface CreateFacilityRequest {
  facilityCode: string;
  name: string;
  type: string;
  address: string;
  city: string;
  state: string;
  country: string;
  phone: string;
  email: string;
  capacity: number;
  organizationId?: number;
  licenseNumber?: string;
  licenseExpiry?: string;
}

export const facilitiesApi = {
  // Get facilities list
  async list(params: {
    page?: number;
    limit?: number;
    type?: string;
    status?: string;
  }): Promise<NileCareResponse<{ facilities: Facility[] }>> {
    const response = await apiClient.get<NileCareResponse<{ facilities: Facility[] }>>(
      '/api/v1/facilities',
      { params }
    );
    return response.data;
  },

  // Get single facility
  async get(id: number): Promise<NileCareResponse<{ facility: Facility }>> {
    const response = await apiClient.get<NileCareResponse<{ facility: Facility }>>(
      `/api/v1/facilities/${id}`
    );
    return response.data;
  },

  // Create facility
  async create(data: CreateFacilityRequest): Promise<NileCareResponse<{ facility: Facility }>> {
    const response = await apiClient.post<NileCareResponse<{ facility: Facility }>>(
      '/api/v1/facilities',
      data
    );
    return response.data;
  },

  // Update facility
  async update(id: number, data: Partial<CreateFacilityRequest>): Promise<NileCareResponse<{ facility: Facility }>> {
    const response = await apiClient.put<NileCareResponse<{ facility: Facility }>>(
      `/api/v1/facilities/${id}`,
      data
    );
    return response.data;
  },

  // Delete facility
  async delete(id: number): Promise<NileCareResponse<void>> {
    const response = await apiClient.delete<NileCareResponse<void>>(
      `/api/v1/facilities/${id}`
    );
    return response.data;
  },

  // Get facility departments
  async getDepartments(facilityId: number): Promise<NileCareResponse<{ departments: Department[] }>> {
    const response = await apiClient.get<NileCareResponse<{ departments: Department[] }>>(
      `/api/v1/facilities/${facilityId}/departments`
    );
    return response.data;
  },

  // Get facility capacity
  async getCapacity(facilityId: number): Promise<NileCareResponse<any>> {
    const response = await apiClient.get<NileCareResponse<any>>(
      `/api/v1/facilities/${facilityId}/capacity`
    );
    return response.data;
  },
};

