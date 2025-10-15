import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { LoginPage } from './pages/auth/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { PatientListPage } from './pages/patients/PatientListPage';
import { PatientDetailsPage } from './pages/patients/PatientDetailsPage';
import { PatientFormPage } from './pages/patients/PatientFormPage';
import { AppointmentListPage } from './pages/appointments/AppointmentListPage';
import { AppointmentBookingPage } from './pages/appointments/AppointmentBookingPage';
import { LabOrderListPage } from './pages/clinical/labs/LabOrderListPage';
import { LabOrderFormPage } from './pages/clinical/labs/LabOrderFormPage';
import { LabResultsPage } from './pages/clinical/labs/LabResultsPage';
import { MedicationListPage } from './pages/clinical/medications/MedicationListPage';
import { PrescriptionFormPage } from './pages/clinical/medications/PrescriptionFormPage';
import { InvoiceListPage } from './pages/billing/InvoiceListPage';
import { InvoiceDetailsPage } from './pages/billing/InvoiceDetailsPage';
import { PaymentCheckoutPage } from './pages/payments/PaymentCheckoutPage';
import { PaymentHistoryPage } from './pages/payments/PaymentHistoryPage';
import { UserManagementPage } from './pages/admin/users/UserManagementPage';
import { FacilityManagementPage } from './pages/admin/facilities/FacilityManagementPage';
import { InventoryManagementPage } from './pages/admin/inventory/InventoryManagementPage';
import { SystemHealthPage } from './pages/admin/system/SystemHealthPage';
import { AuthGuard } from './components/auth/AuthGuard';
import { AppLayout } from './components/layout/AppLayout';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected routes */}
            <Route
              path="/dashboard"
              element={
                <AuthGuard>
                  <AppLayout>
                    <DashboardPage />
                  </AppLayout>
                </AuthGuard>
              }
            />

            {/* Patient Routes */}
            <Route
              path="/patients"
              element={
                <AuthGuard>
                  <AppLayout>
                    <PatientListPage />
                  </AppLayout>
                </AuthGuard>
              }
            />
            <Route
              path="/patients/new"
              element={
                <AuthGuard>
                  <AppLayout>
                    <PatientFormPage />
                  </AppLayout>
                </AuthGuard>
              }
            />
            <Route
              path="/patients/:id"
              element={
                <AuthGuard>
                  <AppLayout>
                    <PatientDetailsPage />
                  </AppLayout>
                </AuthGuard>
              }
            />
            <Route
              path="/patients/:id/edit"
              element={
                <AuthGuard>
                  <AppLayout>
                    <PatientFormPage />
                  </AppLayout>
                </AuthGuard>
              }
            />

            {/* Appointment Routes */}
            <Route
              path="/appointments"
              element={
                <AuthGuard>
                  <AppLayout>
                    <AppointmentListPage />
                  </AppLayout>
                </AuthGuard>
              }
            />
            <Route
              path="/appointments/new"
              element={
                <AuthGuard>
                  <AppLayout>
                    <AppointmentBookingPage />
                  </AppLayout>
                </AuthGuard>
              }
            />

            {/* Clinical Routes - Labs */}
            <Route
              path="/clinical/labs"
              element={
                <AuthGuard>
                  <AppLayout>
                    <LabOrderListPage />
                  </AppLayout>
                </AuthGuard>
              }
            />
            <Route
              path="/clinical/labs/new"
              element={
                <AuthGuard>
                  <AppLayout>
                    <LabOrderFormPage />
                  </AppLayout>
                </AuthGuard>
              }
            />
            <Route
              path="/clinical/labs/:id"
              element={
                <AuthGuard>
                  <AppLayout>
                    <LabResultsPage />
                  </AppLayout>
                </AuthGuard>
              }
            />

            {/* Clinical Routes - Medications */}
            <Route
              path="/clinical/medications"
              element={
                <AuthGuard>
                  <AppLayout>
                    <MedicationListPage />
                  </AppLayout>
                </AuthGuard>
              }
            />
            <Route
              path="/clinical/medications/new"
              element={
                <AuthGuard>
                  <AppLayout>
                    <PrescriptionFormPage />
                  </AppLayout>
                </AuthGuard>
              }
            />

            {/* Billing Routes */}
            <Route
              path="/billing/invoices"
              element={
                <AuthGuard>
                  <AppLayout>
                    <InvoiceListPage />
                  </AppLayout>
                </AuthGuard>
              }
            />
            <Route
              path="/billing/invoices/:id"
              element={
                <AuthGuard>
                  <AppLayout>
                    <InvoiceDetailsPage />
                  </AppLayout>
                </AuthGuard>
              }
            />

            {/* Payment Routes */}
            <Route
              path="/billing/payments/checkout/:invoiceId"
              element={
                <AuthGuard>
                  <AppLayout>
                    <PaymentCheckoutPage />
                  </AppLayout>
                </AuthGuard>
              }
            />
            <Route
              path="/billing/payments/history"
              element={
                <AuthGuard>
                  <AppLayout>
                    <PaymentHistoryPage />
                  </AppLayout>
                </AuthGuard>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin/users"
              element={
                <AuthGuard>
                  <AppLayout>
                    <UserManagementPage />
                  </AppLayout>
                </AuthGuard>
              }
            />
            <Route
              path="/admin/facilities"
              element={
                <AuthGuard>
                  <AppLayout>
                    <FacilityManagementPage />
                  </AppLayout>
                </AuthGuard>
              }
            />
            <Route
              path="/admin/inventory"
              element={
                <AuthGuard>
                  <AppLayout>
                    <InventoryManagementPage />
                  </AppLayout>
                </AuthGuard>
              }
            />
            <Route
              path="/admin/system"
              element={
                <AuthGuard>
                  <AppLayout>
                    <SystemHealthPage />
                  </AppLayout>
                </AuthGuard>
              }
            />

            {/* Redirect root to dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Catch all - redirect to dashboard */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
