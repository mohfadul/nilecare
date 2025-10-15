import { authStore } from '../store/authStore';
import {
  DoctorDashboard,
  NurseDashboard,
  ReceptionistDashboard,
  AdminDashboard,
  BillingClerkDashboard,
  LabTechnicianDashboard,
  PharmacistDashboard,
} from './dashboards';
import { Container, Typography, Paper, Box } from '@mui/material';

export function DashboardPage() {
  const user = authStore((state) => state.user);

  // Route to role-specific dashboard
  switch (user?.role?.toLowerCase()) {
    case 'doctor':
    case 'physician':
      return <DoctorDashboard />;
    
    case 'nurse':
      return <NurseDashboard />;
    
    case 'receptionist':
      return <ReceptionistDashboard />;
    
    case 'admin':
    case 'super_admin':
    case 'system_admin':
      return <AdminDashboard />;
    
    case 'billing_clerk':
    case 'billing':
      return <BillingClerkDashboard />;
    
    case 'lab_technician':
    case 'lab_tech':
    case 'laboratory':
      return <LabTechnicianDashboard />;
    
    case 'pharmacist':
    case 'pharmacy':
      return <PharmacistDashboard />;
    
    default:
      // Generic dashboard for unknown roles
      return (
        <Container maxWidth="xl">
          <Typography variant="h4" gutterBottom>
            Welcome to NileCare, {user?.firstName}!
          </Typography>
          <Paper sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Dashboard Not Configured
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Your role ({user?.role}) does not have a specific dashboard configured yet.
              Please contact your administrator.
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>User ID:</strong> {user?.id}
                <br />
                <strong>Email:</strong> {user?.email}
                <br />
                <strong>Role:</strong> {user?.role}
                <br />
                <strong>Status:</strong> {user?.status}
              </Typography>
            </Box>
          </Paper>
        </Container>
      );
  }
}
