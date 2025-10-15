/**
 * NileCare Web Dashboard - Main Application
 * Micro-frontend architecture with role-based routing
 * Sudan-specific: Arabic RTL support, Sudan localization
 */

import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import DashboardLoading from './components/DashboardLoading';

// Lazy load pages
const LoginPage = lazy(() => import('./pages/Login'));
const DashboardPage = lazy(() => import('./pages/Dashboard/Dashboard'));
const DashboardLayout = lazy(() => import('./components/Layout/DashboardLayout'));

// Lazy load role-based dashboards
const DoctorDashboard = lazy(() => import('./pages/Dashboards/DoctorDashboard'));
const NurseDashboard = lazy(() => import('./pages/Dashboards/NurseDashboard'));
const AdminDashboard = lazy(() => import('./pages/Dashboards/AdminDashboard'));
const PharmacistDashboard = lazy(() => import('./pages/Dashboards/PharmacistDashboard'));
const LabTechnicianDashboard = lazy(() => import('./pages/Dashboards/LabTechnicianDashboard'));
const ReceptionistDashboard = lazy(() => import('./pages/Dashboards/ReceptionistDashboard'));
const PatientPortal = lazy(() => import('./pages/Dashboards/PatientPortal'));
const SuperAdminDashboard = lazy(() => import('./pages/Dashboards/SuperAdminDashboard'));
const MedicalDirectorDashboard = lazy(() => import('./pages/Dashboards/MedicalDirectorDashboard'));
const ComplianceOfficerDashboard = lazy(() => import('./pages/Dashboards/ComplianceOfficerDashboard'));
const SudanHealthInspectorDashboard = lazy(() => import('./pages/Dashboards/SudanHealthInspectorDashboard'));

// Lazy load feature pages
const PatientList = lazy(() => import('./pages/Patients/PatientList'));
const PatientForm = lazy(() => import('./pages/Patients/PatientForm'));
const AppointmentList = lazy(() => import('./pages/Appointments/AppointmentList'));
const AppointmentForm = lazy(() => import('./pages/Appointments/AppointmentForm'));
const BusinessDashboard = lazy(() => import('./pages/BusinessDashboard'));
const SOAPNoteForm = lazy(() => import('./pages/Clinical/SOAPNoteForm'));
const LabOrderForm = lazy(() => import('./pages/Lab/LabOrderForm'));
const InvoiceList = lazy(() => import('./pages/Billing/InvoiceList'));
const InventoryList = lazy(() => import('./pages/Inventory/InventoryList'));
const UserManagement = lazy(() => import('./pages/Admin/UserManagement'));

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 3,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Create theme with RTL support for Arabic
const createAppTheme = (direction: 'ltr' | 'rtl', mode: 'light' | 'dark') => {
  return createTheme({
    direction,
    palette: {
      mode,
      primary: {
        main: '#0066CC', // NileCare Blue
        light: '#3384D6',
        dark: '#004C99',
        contrastText: '#FFFFFF',
      },
      secondary: {
        main: '#00A86B', // Medical Green
        light: '#33BA87',
        dark: '#007A4F',
        contrastText: '#FFFFFF',
      },
      error: {
        main: '#D32F2F',
        light: '#EF5350',
        dark: '#C62828',
      },
      warning: {
        main: '#FFA726',
        light: '#FFB74D',
        dark: '#F57C00',
      },
      success: {
        main: '#66BB6A',
        light: '#81C784',
        dark: '#388E3C',
      },
      background: {
        default: mode === 'light' ? '#F5F7FA' : '#121212',
        paper: mode === 'light' ? '#FFFFFF' : '#1E1E1E',
      },
    },
    typography: {
      fontFamily: direction === 'rtl' 
        ? '"Cairo", "Roboto", "Helvetica", "Arial", sans-serif'
        : '"Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontSize: '2.5rem',
        fontWeight: 600,
      },
      h2: {
        fontSize: '2rem',
        fontWeight: 600,
      },
      h3: {
        fontSize: '1.75rem',
        fontWeight: 500,
      },
      h4: {
        fontSize: '1.5rem',
        fontWeight: 500,
      },
      h5: {
        fontSize: '1.25rem',
        fontWeight: 500,
      },
      h6: {
        fontSize: '1rem',
        fontWeight: 500,
      },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            scrollbarColor: '#6b6b6b #2b2b2b',
            '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
              width: 8,
              height: 8,
            },
            '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
              borderRadius: 8,
              backgroundColor: '#6b6b6b',
              minHeight: 24,
            },
          },
        },
      },
    },
  });
};

// Main App Component
const App: React.FC = () => {
  const [mode, setMode] = React.useState<'light' | 'dark'>('light');

  const theme = React.useMemo(() => createAppTheme('ltr', mode), [mode]);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

// App Routes Component
const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/*" element={<ProtectedRoutes />} />
      </Routes>
    </Suspense>
  );
};

// Protected Routes Component
const ProtectedRoutes: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <DashboardLoading />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Routes>
      <Route path="/" element={<DashboardLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<RoleBasedDashboard />} />
        
        {/* Feature Routes */}
        <Route path="dashboard/patients" element={<PatientList />} />
        <Route path="dashboard/patients/new" element={<PatientForm />} />
        <Route path="dashboard/patients/:id" element={<PatientForm />} />
        <Route path="dashboard/patients/:id/edit" element={<PatientForm />} />
        
        <Route path="dashboard/appointments" element={<AppointmentList />} />
        <Route path="dashboard/appointments/new" element={<AppointmentForm />} />
        <Route path="dashboard/appointments/:id" element={<AppointmentForm />} />
        <Route path="dashboard/appointments/:id/edit" element={<AppointmentForm />} />
        
        <Route path="dashboard/business" element={<BusinessDashboard />} />
        
        <Route path="dashboard/clinical-notes" element={<SOAPNoteForm />} />
        <Route path="dashboard/medications" element={<DashboardPage />} />
        
        <Route path="dashboard/lab-orders" element={<LabOrderForm />} />
        
        <Route path="dashboard/billing" element={<InvoiceList />} />
        
        <Route path="dashboard/inventory" element={<InventoryList />} />
        
        <Route path="dashboard/admin/users" element={<UserManagement />} />
        
        <Route path="dashboard/settings" element={<DashboardPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

// Role-Based Dashboard Router
const RoleBasedDashboard: React.FC = () => {
  const { user } = useAuth();

  // Map user roles to their respective dashboards
  const getDashboardByRole = () => {
    const role = user?.role?.toLowerCase().replace(/[_\s]/g, '');

    switch (role) {
      case 'superadmin':
      case 'super-admin':
        return <SuperAdminDashboard />;
      
      case 'medicaldirector':
      case 'medical-director':
        return <MedicalDirectorDashboard />;
      
      case 'complianceofficer':
      case 'compliance-officer':
        return <ComplianceOfficerDashboard />;
      
      case 'sudanhealthinspector':
      case 'sudan-health-inspector':
      case 'healthinspector':
        return <SudanHealthInspectorDashboard />;
      
      case 'doctor':
      case 'physician':
        return <DoctorDashboard />;
      
      case 'nurse':
        return <NurseDashboard />;
      
      case 'admin':
      case 'systemadmin':
      case 'hospitaladmin':
        return <AdminDashboard />;
      
      case 'pharmacist':
        return <PharmacistDashboard />;
      
      case 'labtechnician':
      case 'labtech':
        return <LabTechnicianDashboard />;
      
      case 'receptionist':
        return <ReceptionistDashboard />;
      
      case 'patient':
        return <PatientPortal />;
      
      default:
        // Fallback to generic dashboard
        return <DashboardPage />;
    }
  };

  return (
    <Suspense fallback={<DashboardLoading />}>
      {getDashboardByRole()}
    </Suspense>
  );
};

export default App;