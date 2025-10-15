# 🎨 NileCare 5-Phase Frontend Implementation Plan

**Date:** October 15, 2025  
**Duration:** 16 Weeks (4 months)  
**Framework:** React 18 + TypeScript + Vite  
**UI Library:** Material-UI 5 + Tailwind CSS  
**State Management:** React Query + Zustand  

---

## 📋 EXECUTIVE SUMMARY

This plan details the complete frontend implementation for NileCare Healthcare Platform, following strict architectural constraints and building only on verified backend APIs.

### Key Principles

1. **Single Source of Truth:** UI uses ONLY documented backend APIs
2. **No Hardcoded Actions:** Every button maps to an existing API endpoint
3. **Auth & RBAC:** Frontend uses Auth Service flow, shows/hides per role
4. **Consistent Data Contracts:** Use standardized response wrapper
5. **Accessibility & i18n:** Accessible components, externalized text (Arabic + English)
6. **Performance:** HTTP caching, rate limit respect, graceful degradation

### Timeline Overview

| Phase | Duration | Focus | Deliverables |
|-------|----------|-------|--------------|
| **Phase 1** | Weeks 1-2 | Foundation & Auth | Global shell, auth flow, role gates |
| **Phase 2** | Weeks 3-5 | Clinical & Patient | Patient management, encounters, appointments |
| **Phase 3** | Weeks 6-9 | Clinical Data | Labs, medications, devices, real-time monitoring |
| **Phase 4** | Weeks 10-12 | Billing & Payments | Invoicing, payment gateway, notifications |
| **Phase 5** | Weeks 13-16 | Admin & Operations | User management, facilities, inventory, health dashboard |

---

## 🔧 PREREQUISITES (Must Complete Before Starting)

### Backend Prerequisites ✅

- [ ] All critical audit issues fixed (see NILECARE_COMPLETE_CODEBASE_AUDIT_REPORT.md)
- [ ] Standardized response wrapper implemented across all services
- [ ] All API endpoints documented with OpenAPI/Swagger
- [ ] Auth Service working end-to-end
- [ ] CORS configured for frontend origin (http://localhost:5173)
- [ ] Database audit columns added to all tables
- [ ] Main NileCare orchestrator refactored (no DB access)

### Technical Stack Setup ✅

- [ ] Node.js 18+ installed
- [ ] npm 9+ installed
- [ ] Git configured
- [ ] VS Code with extensions (ESLint, Prettier, TypeScript)
- [ ] Browser DevTools proficiency

### Team Requirements ✅

- [ ] 2-3 frontend developers
- [ ] 1 UX/UI designer
- [ ] 1 QA engineer
- [ ] Access to staging environment

---

## 📐 PHASE 0: Foundation Setup (Week 0)

### Project Setup

```bash
# Create Vite + React + TypeScript project
npm create vite@latest nilecare-frontend -- --template react-ts

cd nilecare-frontend

# Install core dependencies
npm install @mui/material @emotion/react @emotion/styled
npm install @tanstack/react-query axios
npm install react-router-dom zustand
npm install react-hook-form zod @hookform/resolvers
npm install react-i18next i18next
npm install date-fns recharts
npm install @mui/x-data-grid @mui/x-date-pickers

# Install dev dependencies
npm install -D @types/react @types/react-dom
npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
npm install -D prettier eslint-config-prettier
npm install -D vitest @testing-library/react @testing-library/jest-dom
npm install -D cypress @testing-library/cypress
npm install -D @axe-core/react
```

### Project Structure

```
nilecare-frontend/
├── public/
│   ├── locales/
│   │   ├── en/
│   │   │   └── translation.json
│   │   └── ar/
│   │       └── translation.json
│   └── assets/
├── src/
│   ├── api/                    # API clients
│   │   ├── client.ts          # Axios instance
│   │   ├── auth.api.ts        # Auth endpoints
│   │   ├── patients.api.ts    # Patient endpoints
│   │   └── ...
│   ├── components/             # Reusable components
│   │   ├── common/
│   │   │   ├── Button.tsx
│   │   │   ├── Table.tsx
│   │   │   ├── Form.tsx
│   │   │   └── ...
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── TopBar.tsx
│   │   └── auth/
│   │       ├── AuthGuard.tsx
│   │       ├── RoleGate.tsx
│   │       └── LoginForm.tsx
│   ├── pages/                  # Page components
│   │   ├── auth/
│   │   ├── patients/
│   │   ├── appointments/
│   │   └── ...
│   ├── hooks/                  # Custom hooks
│   │   ├── useAuth.ts
│   │   ├── usePatients.ts
│   │   └── ...
│   ├── store/                  # Zustand stores
│   │   ├── authStore.ts
│   │   └── uiStore.ts
│   ├── types/                  # TypeScript types
│   │   ├── api.types.ts
│   │   ├── patient.types.ts
│   │   └── ...
│   ├── utils/                  # Utility functions
│   │   ├── formatters.ts
│   │   ├── validators.ts
│   │   └── ...
│   ├── config/                 # Configuration
│   │   ├── api.config.ts
│   │   └── theme.config.ts
│   ├── i18n/                   # Internationalization
│   │   └── i18n.ts
│   ├── App.tsx
│   └── main.tsx
├── .env.example
├── .env.development
├── vite.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

### Base Configuration Files

**vite.config.ts:**
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@api': path.resolve(__dirname, './src/api'),
      '@components': path.resolve(__dirname, './src/components'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@types': path.resolve(__dirname, './src/types'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@store': path.resolve(__dirname, './src/store'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:7000',
        changeOrigin: true,
      },
    },
  },
});
```

**.env.example:**
```bash
VITE_API_URL=http://localhost:7000
VITE_AUTH_SERVICE_URL=http://localhost:7020
VITE_WS_URL=ws://localhost:7000
VITE_APP_VERSION=1.0.0
VITE_APP_NAME=NileCare
VITE_ENABLE_MOCK_API=false
```

---

## 🔐 PHASE 1: Foundation & Auth (Weeks 1-2)

### Objectives

- ✅ Global application shell
- ✅ Authentication flow (login, logout, session management)
- ✅ Route protection and role-based access
- ✅ Responsive layout (desktop + mobile)
- ✅ Error boundaries and loading states

### Deliverables

#### 1. API Client Setup

**File: `src/api/client.ts`**

```typescript
import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { authStore } from '@store/authStore';

// Standard response type (matches backend)
export interface NileCareResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata: {
    timestamp: string;
    requestId: string;
    version: string;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Create axios instance
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:7000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    const token = authStore.getState().token;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// Response interceptor - handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired, try refresh
      const refreshed = await authStore.getState().refreshToken();
      if (refreshed && error.config) {
        // Retry original request
        return apiClient.request(error.config);
      } else {
        // Refresh failed, logout
        authStore.getState().logout();
      }
    }
    return Promise.reject(error);
  }
);
```

#### 2. Auth API Client

**File: `src/api/auth.api.ts`**

```typescript
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
```

#### 3. Auth Store (Zustand)

**File: `src/store/authStore.ts`**

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi, LoginRequest, User } from '@api/auth.api';

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
  refreshToken: () => Promise<boolean>;
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

      refreshToken: async () => {
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
```

#### 4. Auth Components

**File: `src/components/auth/AuthGuard.tsx`**

```typescript
import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { authStore } from '@store/authStore';

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const isAuthenticated = authStore((state) => state.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
```

**File: `src/components/auth/RoleGate.tsx`**

```typescript
import { ReactNode } from 'react';
import { authStore } from '@store/authStore';

interface RoleGateProps {
  children: ReactNode;
  roles: string[];
  fallback?: ReactNode;
}

export function RoleGate({ children, roles, fallback = null }: RoleGateProps) {
  const user = authStore((state) => state.user);

  if (!user || !roles.includes(user.role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
```

**File: `src/pages/auth/LoginPage.tsx`**

```typescript
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authStore } from '@store/authStore';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = authStore((state) => state.login);
  const error = authStore((state) => state.error);
  const isLoading = authStore((state) => state.isLoading);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data);
      const from = (location.state as any)?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    } catch (err) {
      // Error handled by store
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography variant="h4" component="h1" gutterBottom>
            NileCare Login
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            <TextField
              {...register('email')}
              label="Email"
              type="email"
              fullWidth
              margin="normal"
              error={!!errors.email}
              helperText={errors.email?.message}
            />

            <TextField
              {...register('password')}
              label="Password"
              type="password"
              fullWidth
              margin="normal"
              error={!!errors.password}
              helperText={errors.password?.message}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={isLoading}
              sx={{ mt: 2 }}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
        </Paper>
      </Box>
    </Container>
  );
}
```

#### 5. Global Layout

**File: `src/components/layout/AppLayout.tsx`**

```typescript
import { ReactNode, useState } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  People,
  CalendarToday,
  LocalHospital,
  Payment,
  Settings,
  Logout,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { authStore } from '@store/authStore';
import { RoleGate } from '@components/auth/RoleGate';

interface AppLayoutProps {
  children: ReactNode;
}

const drawerWidth = 240;

export function AppLayout({ children }: AppLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const user = authStore((state) => state.user);
  const logout = authStore((state) => state.logout);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard', roles: ['*'] },
    { text: 'Patients', icon: <People />, path: '/patients', roles: ['doctor', 'nurse', 'receptionist'] },
    { text: 'Appointments', icon: <CalendarToday />, path: '/appointments', roles: ['doctor', 'nurse', 'receptionist'] },
    { text: 'Clinical', icon: <LocalHospital />, path: '/clinical', roles: ['doctor', 'nurse'] },
    { text: 'Billing', icon: <Payment />, path: '/billing', roles: ['billing_clerk', 'admin'] },
    { text: 'Settings', icon: <Settings />, path: '/settings', roles: ['admin', 'super_admin'] },
  ];

  const drawer = (
    <Box>
      <Toolbar>
        <Typography variant="h6" noWrap>
          NileCare
        </Typography>
      </Toolbar>
      <List>
        {menuItems.map((item) => (
          <RoleGate key={item.text} roles={item.roles}>
            <ListItem disablePadding>
              <ListItemButton onClick={() => navigate(item.path)}>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          </RoleGate>
        ))}
        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout}>
            <ListItemIcon>
              <Logout />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            NileCare Healthcare Platform
          </Typography>
          <Typography variant="body2">
            {user?.firstName} {user?.lastName} ({user?.role})
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
      >
        {drawer}
      </Drawer>

      {/* Desktop drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
        open
      >
        {drawer}
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` } }}>
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}
```

### Phase 1 Testing

**Test Scenarios:**

1. ✅ Login with valid credentials
2. ✅ Login with invalid credentials (shows error)
3. ✅ Logout clears session
4. ✅ Token refresh on 401 error
5. ✅ Protected routes redirect to login
6. ✅ Role-based menu items show/hide correctly
7. ✅ Session persists on page reload
8. ✅ Mobile responsive sidebar

**Accessibility Checks:**

```bash
npm install -D @axe-core/react

# Add to main.tsx (development only)
if (process.env.NODE_ENV !== 'production') {
  import('@axe-core/react').then(axe => {
    axe.default(React, ReactDOM, 1000);
  });
}
```

### Phase 1 Acceptance Criteria

- [ ] User can login with email/password
- [ ] User can logout
- [ ] Session persists across page reloads
- [ ] Token automatically refreshes when expired
- [ ] Protected routes redirect to login
- [ ] Menu items show/hide based on user role
- [ ] Layout is responsive (desktop + mobile)
- [ ] No console errors or warnings
- [ ] Lighthouse accessibility score > 90

---

## 📊 PHASE 2: Core Clinical & Patient Workflows (Weeks 3-5)

### Objectives

- ✅ Patient list with search and pagination
- ✅ Patient details (aggregated view)
- ✅ Patient registration form
- ✅ Appointment calendar and booking
- ✅ Encounter management

### API Contract Validation

**Before starting, verify these endpoints exist:**

```typescript
// Patients API
GET    /api/v1/patients?page=1&limit=20&search=Ahmed
POST   /api/v1/patients
GET    /api/v1/patients/:id
PUT    /api/v1/patients/:id
DELETE /api/v1/patients/:id
GET    /api/v1/patients/:id/complete // Aggregated data

// Appointments API
GET    /api/v1/appointments?patientId=1&providerId=2&date=2025-10-20
POST   /api/v1/appointments
GET    /api/v1/appointments/:id
PUT    /api/v1/appointments/:id
DELETE /api/v1/appointments/:id
GET    /api/v1/schedules/available-slots?providerId=2&date=2025-10-20

// Encounters API
GET    /api/v1/encounters?patientId=1
POST   /api/v1/encounters
GET    /api/v1/encounters/:id
PUT    /api/v1/encounters/:id
```

### Deliverables

#### 1. Patient API Client

**File: `src/api/patients.api.ts`**

```typescript
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
  createdAt: string;
  updatedAt: string;
}

export interface PatientListResponse {
  patients: Patient[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
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
};
```

#### 2. React Query Hooks

**File: `src/hooks/usePatients.ts`**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { patientsApi, CreatePatientRequest } from '@api/patients.api';

export function usePatients(params: { page?: number; limit?: number; search?: string }) {
  return useQuery({
    queryKey: ['patients', params],
    queryFn: () => patientsApi.list(params),
    keepPreviousData: true,
  });
}

export function usePatient(id: number) {
  return useQuery({
    queryKey: ['patients', id],
    queryFn: () => patientsApi.get(id),
    enabled: !!id,
  });
}

export function useCreatePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePatientRequest) => patientsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
  });
}

export function useUpdatePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreatePatientRequest> }) =>
      patientsApi.update(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['patients', variables.id] });
    },
  });
}

export function useDeletePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => patientsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
  });
}
```

#### 3. Patient List Page

**File: `src/pages/patients/PatientListPage.tsx`**

```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Button,
  TextField,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Add } from '@mui/icons-material';
import { usePatients } from '@hooks/usePatients';

export function PatientListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading, error } = usePatients({ page, limit: 20, search });

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'firstName', headerName: 'First Name', width: 130 },
    { field: 'lastName', headerName: 'Last Name', width: 130 },
    { field: 'email', headerName: 'Email', width: 200 },
    { field: 'phone', headerName: 'Phone', width: 150 },
    { field: 'nationalId', headerName: 'National ID', width: 150 },
  ];

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">Failed to load patients</Alert>;
  }

  const patients = data?.data?.patients || [];
  const pagination = data?.data?.pagination;

  return (
    <Container maxWidth="xl">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Patients</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/patients/new')}
        >
          Add Patient
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 2 }}>
        <TextField
          fullWidth
          label="Search patients"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or national ID"
        />
      </Paper>

      <Paper sx={{ height: 600 }}>
        <DataGrid
          rows={patients}
          columns={columns}
          pagination
          page={page - 1}
          pageSize={20}
          rowCount={pagination?.total || 0}
          paginationMode="server"
          onPageChange={(newPage) => setPage(newPage + 1)}
          onRowClick={(params) => navigate(`/patients/${params.id}`)}
        />
      </Paper>
    </Container>
  );
}
```

### Phase 2 Testing

**E2E Tests (Cypress):**

```typescript
// cypress/e2e/patients.cy.ts
describe('Patients Flow', () => {
  beforeEach(() => {
    cy.login('doctor@nilecare.sd', 'TestPass123!');
  });

  it('should display patient list', () => {
    cy.visit('/patients');
    cy.contains('Patients').should('be.visible');
    cy.get('[data-testid="patient-table"]').should('be.visible');
  });

  it('should search patients', () => {
    cy.visit('/patients');
    cy.get('[data-testid="search-input"]').type('Ahmed');
    cy.get('[data-testid="patient-table"]').should('contain', 'Ahmed');
  });

  it('should create new patient', () => {
    cy.visit('/patients/new');
    cy.get('[name="firstName"]').type('Test');
    cy.get('[name="lastName"]').type('Patient');
    cy.get('[name="email"]').type('test@example.com');
    cy.get('[name="phone"]').type('+249123456789');
    cy.get('[name="nationalId"]').type('12345678901234');
    cy.get('[name="dateOfBirth"]').type('1990-01-01');
    cy.get('[name="gender"]').select('male');
    cy.get('[type="submit"]').click();
    cy.url().should('match', /\/patients\/\d+$/);
  });
});
```

### Phase 2 Acceptance Criteria

- [ ] Patient list displays with pagination
- [ ] Search filters patients in real-time
- [ ] Can create new patient with validation
- [ ] Can view patient details
- [ ] Can update patient information
- [ ] Can soft-delete patient
- [ ] Appointments calendar displays available slots
- [ ] Can book appointment for patient
- [ ] Loading states show during API calls
- [ ] Error states show user-friendly messages
- [ ] All forms have client-side validation
- [ ] Accessibility score > 90

---

*Due to length constraints, I'll summarize Phases 3-5. Would you like me to continue with the complete detailed plans for Phases 3, 4, and 5, or would you prefer to proceed with executing Phase 1 now?*

---

## 📋 PHASES 3-5 SUMMARY

### Phase 3: Clinical Data (Labs, Meds, Devices) - Weeks 6-9
- Lab order creation and result viewing
- Medication prescriptions
- Device monitoring dashboard (WebSocket integration)
- Real-time vital signs display

### Phase 4: Billing, Payments & Notifications - Weeks 10-12
- Invoice generation
- Payment checkout flow
- Payment history
- Notification center inbox

### Phase 5: Admin, Facility, Inventory & Ops - Weeks 13-16
- User management (CRUD)
- Role management
- Facility management
- Inventory tracking
- System health dashboard

---

**Next Steps:**
1. Complete backend critical fixes
2. Generate OpenAPI docs for all services
3. Begin Phase 1 implementation
4. Weekly progress reviews


