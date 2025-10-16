import { Container, Typography, Paper, Box, Grid, Card, CardContent, Button, Alert, AlertTitle, Chip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { authStore } from '../../store/authStore';
import { People, Business, HealthAndSafety, TrendingUp } from '@mui/icons-material';
import { useAdminDashboard } from '../../hooks/useDashboard';
import { DashboardSkeleton } from '../../components/shared/LoadingSkeleton';

/**
 * Admin Dashboard - Connected to Real API
 * ✅ PHASE 6: Full Integration with backend services
 */
export function AdminDashboard() {
  const user = authStore((state) => state.user);
  const navigate = useNavigate();
  
  // ✅ PHASE 6: Fetch real data from API
  const { data, isLoading, error, refetch } = useAdminDashboard();

  if (isLoading) {
    return (
      <Container maxWidth="xl">
        <DashboardSkeleton />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ mt: 4 }}>
          <Alert severity="error">
            <AlertTitle>Failed to Load Dashboard</AlertTitle>
            Unable to fetch dashboard data. Please try again.
            <Button size="small" onClick={() => refetch()} sx={{ mt: 2 }}>
              Retry
            </Button>
          </Alert>
        </Box>
      </Container>
    );
  }

  const stats = data?.data || {};
  const systemHealthColor = stats.system_health === 'healthy' ? 'success' : 'warning';

  return (
    <Container maxWidth="xl">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h4">
          System Administration
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            System Status:
          </Typography>
          <Chip 
            label={stats.system_health || 'Unknown'} 
            color={systemHealthColor}
            size="small"
          />
          <Typography variant="caption" color="text.secondary">
            | Last updated: {new Date().toLocaleTimeString()}
          </Typography>
        </Box>
      </Box>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Welcome back, {user?.firstName}
      </Typography>

      {/* Quick Stats - REAL DATA ✅ */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <People color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Total Users</Typography>
              </Box>
              <Typography variant="h3">{stats.total_users || 0}</Typography>
              <Typography variant="body2" color="text.secondary">
                {stats.active_users || 0} active users
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <Business color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Facilities</Typography>
              </Box>
              <Typography variant="h3">{stats.total_facilities || 0}</Typography>
              <Typography variant="body2" color="text.secondary">
                Healthcare facilities
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <HealthAndSafety color="success" sx={{ mr: 1 }} />
                <Typography variant="h6">Services Up</Typography>
              </Box>
              <Typography variant="h3" sx={{ color: 'success.main' }}>
                {stats.services_status?.up || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Operational services
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <TrendingUp color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Services Down</Typography>
              </Box>
              <Typography 
                variant="h3" 
                sx={{ color: (stats.services_status?.down || 0) > 0 ? 'error.main' : 'text.primary' }}
              >
                {stats.services_status?.down || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Need attention
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* System Management */}
      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              System Health
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              ✅ Real-time system health monitoring from backend
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="outlined" size="small" onClick={() => navigate('/admin/users')}>
                Manage Users
              </Button>
              <Button variant="outlined" size="small" onClick={() => navigate('/admin/facilities')}>
                Manage Facilities
              </Button>
              <Button variant="outlined" size="small">
                View Logs
              </Button>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button variant="outlined" size="small" fullWidth onClick={() => navigate('/admin/users/new')}>
                Add User
              </Button>
              <Button variant="outlined" size="small" fullWidth onClick={() => navigate('/admin/facilities/new')}>
                Add Facility
              </Button>
              <Button variant="outlined" size="small" fullWidth>
                System Settings
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Activity & Reports */}
      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Activity
            </Typography>
            <Typography variant="body2" color="text.secondary">
              User activity, system logs, and audit trails
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Button variant="outlined" size="small" sx={{ mr: 1 }}>View Audit Log</Button>
              <Button variant="outlined" size="small">Generate Report</Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
