/**
 * NileCare Web Dashboard - Main Application
 * Micro-frontend architecture with role-based routing
 * Sudan-specific: Arabic RTL support, Sudan localization
 */

import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '@nilecare/auth';
import { I18nProvider } from '@nilecare/i18n';
import { ErrorBoundary } from './components/ErrorBoundary';
import { DashboardLoading } from './components/DashboardLoading';

// Lazy load micro-frontends
const SuperAdminDashboard = lazy(() => import('./apps/super-admin-dashboard'));
const HospitalAdminDashboard = lazy(() => import('./apps/hospital-admin-dashboard'));
const DoctorDashboard = lazy(() => import('./apps/doctor-dashboard'));
const NurseDashboard = lazy(() => import('./apps/nurse-dashboard'));
const PharmacistDashboard = lazy(() => import('./apps/pharmacist-dashboard'));
const LabTechnicianDashboard = lazy(() => import('./apps/lab-technician-dashboard'));
const ReceptionistDashboard = lazy(() => import('./apps/receptionist-dashboard'));
const PatientPortal = lazy(() => import('./apps/patient-portal'));
const LoginPage = lazy(() => import('./pages/Login'));

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
  const [direction, setDirection] = React.useState<'ltr' | 'rtl'>('rtl'); // Default Arabic
  const [mode, setMode] = React.useState<'light' | 'dark'>('light');

  const theme = React.useMemo(() => createAppTheme(direction, mode), [direction, mode]);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <I18nProvider defaultLanguage="ar" direction={direction}>
            <AuthProvider>
              <Router>
                <AppRoutes />
              </Router>
            </AuthProvider>
          </I18nProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

// App Routes Component
const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/*" element={<ProtectedRoutes />} />
    </Routes>
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
      <Route path="/" element={<DashboardRouter />} />
      <Route path="/dashboard/*" element={<DashboardRouter />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

// Dynamic Dashboard Router
const DashboardRouter: React.FC = () => {
  const { user, facility } = useAuth();

  const getDashboardComponent = (): JSX.Element => {
    if (!user || !user.role) {
      return <Navigate to="/login" replace />;
    }

    const role = user.role;
    const facilityType = facility?.type || 'hospital';

    // Role-based dashboard mapping
    const dashboardMap: Record<string, JSX.Element> = {
      // Administrative Roles
      super_admin: <SuperAdminDashboard />,
      system_admin: <SuperAdminDashboard />,
      
      // Facility Admin Roles (by facility type)
      hospital_admin: <HospitalAdminDashboard />,
      clinic_admin: <HospitalAdminDashboard />, // Same as hospital
      dental_admin: <DentalAdminDashboard />,
      lab_admin: <LabAdminDashboard />,
      pharmacy_admin: <PharmacyAdminDashboard />,
      
      // Clinical Roles
      physician: <DoctorDashboard />,
      doctor: <DoctorDashboard />,
      dentist: <DentistDashboard />,
      nurse: <NurseDashboard />,
      pharmacist: <PharmacistDashboard />,
      lab_technician: <LabTechnicianDashboard />,
      radiologist: <RadiologistDashboard />,
      
      // Administrative Staff
      accountant: <AccountantDashboard />,
      billing_specialist: <BillingDashboard />,
      receptionist: <ReceptionistDashboard />,
      
      // Patient
      patient: <PatientPortal />,
      
      // Sudan-specific roles
      medical_director: <MedicalDirectorDashboard />,
      compliance_officer: <ComplianceDashboard />,
      sudan_health_inspector: <HealthInspectorDashboard />
    };

    return dashboardMap[role] || <DefaultDashboard role={role} />;
  };

  return (
    <Suspense fallback={<DashboardLoading />}>
      {getDashboardComponent()}
    </Suspense>
  );
};

// Lazy load additional dashboards
const DentalAdminDashboard = lazy(() => import('./apps/dental-admin-dashboard'));
const LabAdminDashboard = lazy(() => import('./apps/lab-admin-dashboard'));
const PharmacyAdminDashboard = lazy(() => import('./apps/pharmacy-admin-dashboard'));
const DentistDashboard = lazy(() => import('./apps/dentist-dashboard'));
const RadiologistDashboard = lazy(() => import('./apps/radiologist-dashboard'));
const AccountantDashboard = lazy(() => import('./apps/accountant-dashboard'));
const BillingDashboard = lazy(() => import('./apps/billing-dashboard'));
const MedicalDirectorDashboard = lazy(() => import('./apps/medical-director-dashboard'));
const ComplianceDashboard = lazy(() => import('./apps/compliance-dashboard'));
const HealthInspectorDashboard = lazy(() => import('./apps/health-inspector-dashboard'));
const DefaultDashboard = lazy(() => import('./apps/default-dashboard'));

export default App;