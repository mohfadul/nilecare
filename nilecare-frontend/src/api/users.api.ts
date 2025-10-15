import { apiClient, NileCareResponse } from './client';

export interface User {
  id: number;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: string;
  status: 'active' | 'inactive' | 'suspended';
  mfaEnabled: boolean;
  emailVerified: boolean;
  organizationId?: number;
  facilityId?: number;
  permissions: string[];
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: number;
  name: string;
  description: string;
  permissions: string[];
  isActive: boolean;
  createdAt: string;
}

export interface CreateUserRequest {
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
  organizationId?: number;
  facilityId?: number;
}

export interface UpdateUserRequest {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  status?: string;
  organizationId?: number;
  facilityId?: number;
}

export const usersApi = {
  // Get users list
  async list(params: {
    page?: number;
    limit?: number;
    role?: string;
    status?: string;
    search?: string;
  }): Promise<NileCareResponse<{ users: User[] }>> {
    const response = await apiClient.get<NileCareResponse<{ users: User[] }>>(
      '/api/v1/users',
      { params }
    );
    return response.data;
  },

  // Get single user
  async get(id: number): Promise<NileCareResponse<{ user: User }>> {
    const response = await apiClient.get<NileCareResponse<{ user: User }>>(
      `/api/v1/users/${id}`
    );
    return response.data;
  },

  // Create user
  async create(data: CreateUserRequest): Promise<NileCareResponse<{ user: User }>> {
    const response = await apiClient.post<NileCareResponse<{ user: User }>>(
      '/api/v1/users',
      data
    );
    return response.data;
  },

  // Update user
  async update(id: number, data: UpdateUserRequest): Promise<NileCareResponse<{ user: User }>> {
    const response = await apiClient.put<NileCareResponse<{ user: User }>>(
      `/api/v1/users/${id}`,
      data
    );
    return response.data;
  },

  // Delete user (soft delete)
  async delete(id: number): Promise<NileCareResponse<void>> {
    const response = await apiClient.delete<NileCareResponse<void>>(
      `/api/v1/users/${id}`
    );
    return response.data;
  },

  // Get roles
  async getRoles(): Promise<NileCareResponse<{ roles: Role[] }>> {
    const response = await apiClient.get<NileCareResponse<{ roles: Role[] }>>(
      '/api/v1/roles'
    );
    return response.data;
  },

  // Update user status
  async updateStatus(id: number, status: string): Promise<NileCareResponse<{ user: User }>> {
    const response = await apiClient.patch<NileCareResponse<{ user: User }>>(
      `/api/v1/users/${id}/status`,
      { status }
    );
    return response.data;
  },

  // Reset user password
  async resetPassword(id: number, newPassword: string): Promise<NileCareResponse<void>> {
    const response = await apiClient.post<NileCareResponse<void>>(
      `/api/v1/users/${id}/reset-password`,
      { newPassword }
    );
    return response.data;
  },
};

