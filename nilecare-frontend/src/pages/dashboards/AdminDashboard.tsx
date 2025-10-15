import { Container, Typography, Paper, Box, Grid, Card, CardContent, Button } from '@mui/material';
import { authStore } from '../../store/authStore';
import { People, Business, Assessment, Security } from '@mui/icons-material';

export function AdminDashboard() {
  const user = authStore((state) => state.user);

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        System overview and management
      </Typography>

      {/* System Stats */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <People color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Total Users</Typography>
              </Box>
              <Typography variant="h3">248</Typography>
              <Typography variant="body2" color="text.secondary">
                Active: 195, Inactive: 53
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
              <Typography variant="h3">12</Typography>
              <Typography variant="body2" color="text.secondary">
                All operational
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <Assessment color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">System Health</Typography>
              </Box>
              <Typography variant="h3" color="success.main">98%</Typography>
              <Typography variant="body2" color="text.secondary">
                All services running
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <Security color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Security Alerts</Typography>
              </Box>
              <Typography variant="h3">3</Typography>
              <Typography variant="body2" color="text.secondary">
                Require review
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Management Sections */}
      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              User Management
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Manage users, roles, and permissions
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Button variant="contained" size="small" sx={{ mr: 1 }}>Manage Users</Button>
              <Button variant="outlined" size="small">Manage Roles</Button>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Facility Management
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Configure facilities, departments, and resources
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Button variant="contained" size="small" sx={{ mr: 1 }}>Manage Facilities</Button>
              <Button variant="outlined" size="small">View Resources</Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* System Monitoring */}
      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              System Monitoring
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Service health, performance, and logs
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Button variant="outlined" size="small" sx={{ mr: 1 }}>View Metrics</Button>
              <Button variant="outlined" size="small">System Logs</Button>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Configuration
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              System settings and configurations
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Button variant="outlined" size="small" sx={{ mr: 1 }}>System Settings</Button>
              <Button variant="outlined" size="small">API Keys</Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Recent Activity */}
      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent System Activity
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Audit logs and recent administrative actions
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Button variant="outlined" size="small">View Audit Logs</Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

