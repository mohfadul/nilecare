import { Container, Typography, Paper, Box, Grid } from '@mui/material';
import { authStore } from '../store/authStore';

export function DashboardPage() {
  const user = authStore((state) => state.user);

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" gutterBottom>
        Welcome to NileCare, {user?.firstName}!
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Quick Stats
            </Typography>
            <Typography variant="body2">
              Your dashboard is being prepared...
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Activities
            </Typography>
            <Typography variant="body2">
              No recent activities
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Notifications
            </Typography>
            <Typography variant="body2">
              No new notifications
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Box sx={{ mt: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            System Information
          </Typography>
          <Typography variant="body2">
            <strong>User ID:</strong> {user?.id}
            <br />
            <strong>Email:</strong> {user?.email}
            <br />
            <strong>Role:</strong> {user?.role}
            <br />
            <strong>Status:</strong> {user?.status}
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
}

