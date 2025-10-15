import { apiClient, NileCareResponse } from './client';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  user: {
    userId: number;
    email: string;
    role: string;
    permissions: string[];
    facilityId?: number;
  };
}

export interface User {
  id: number;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  mfaEnabled: boolean;
  emailVerified: boolean;
  organizationId?: number;
  permissions: string[];
  createdAt: string;
}

export const authApi = {
  // Login
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>(
      '/api/v1/auth/login',
      credentials
    );
    return response.data;
  },

  // Logout
  async logout(): Promise<void> {
    await apiClient.post('/api/v1/auth/logout');
  },

  // Get current user
  async me(): Promise<NileCareResponse<{ user: User }>> {
    const response = await apiClient.get<NileCareResponse<{ user: User }>>(
      '/api/v1/auth/me'
    );
    return response.data;
  },

  // Refresh token
  async refreshToken(refreshToken: string): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>(
      '/api/v1/auth/refresh-token',
      { refreshToken }
    );
    return response.data;
  },

  // Password reset request
  async requestPasswordReset(email: string): Promise<void> {
    await apiClient.post('/api/v1/auth/password-reset/request', { email });
  },

  // Reset password
  async resetPassword(token: string, newPassword: string): Promise<void> {
    await apiClient.post('/api/v1/auth/password-reset/confirm', {
      token,
      newPassword,
    });
  },
};

