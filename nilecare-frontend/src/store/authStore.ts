import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi, LoginRequest, User } from '../api/auth.api';

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  refreshTokenAction: () => Promise<boolean>;
  fetchUser: () => Promise<void>;
  clearError: () => void;
}

export const authStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.login(credentials);
          set({
            token: response.token,
            refreshToken: response.refreshToken,
            user: response.user as any,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          set({
            error: error.response?.data?.message || 'Login failed',
            isLoading: false,
          });
          throw error;
        }
      },

      logout: () => {
        authApi.logout().catch(() => {});
        set({
          token: null,
          refreshToken: null,
          user: null,
          isAuthenticated: false,
          error: null,
        });
      },

      refreshTokenAction: async () => {
        const { refreshToken } = get();
        if (!refreshToken) return false;

        try {
          const response = await authApi.refreshToken(refreshToken);
          set({
            token: response.token,
            refreshToken: response.refreshToken,
            isAuthenticated: true,
          });
          return true;
        } catch (error) {
          get().logout();
          return false;
        }
      },

      fetchUser: async () => {
        try {
          const response = await authApi.me();
          if (response.success && response.data) {
            set({ user: response.data.user as any });
          }
        } catch (error) {
          console.error('Failed to fetch user:', error);
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'nilecare-auth',
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

