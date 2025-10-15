import { Container, Typography, Paper, Box, Grid, Card, CardContent, Button } from '@mui/material';
import { authStore } from '../../store/authStore';
import { People, Medication, LocalHospital, Assignment } from '@mui/icons-material';

export function NurseDashboard() {
  const user = authStore((state) => state.user);

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" gutterBottom>
        Welcome, Nurse {user?.lastName}
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Your shift overview
      </Typography>

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <People color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Assigned Patients</Typography>
              </Box>
              <Typography variant="h3">15</Typography>
              <Typography variant="body2" color="text.secondary">
                Ward A: 8, Ward B: 7
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <Medication color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Medications Due</Typography>
              </Box>
              <Typography variant="h3">23</Typography>
              <Typography variant="body2" color="text.secondary">
                Next round in 1 hour
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <LocalHospital color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Vital Signs Due</Typography>
              </Box>
              <Typography variant="h3">8</Typography>
              <Typography variant="body2" color="text.secondary">
                Overdue: 2
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <Assignment color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Pending Tasks</Typography>
              </Box>
              <Typography variant="h3">12</Typography>
              <Typography variant="body2" color="text.secondary">
                Documentation, labs
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Patient List */}
      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              My Patients
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Patient list will appear here once backend is connected
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Button variant="outlined" size="small">View All Patients</Button>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Urgent Tasks
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Priority items requiring attention
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Button variant="contained" size="small">View Tasks</Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Medication Schedule */}
      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Medication Administration Schedule
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Upcoming medication rounds and administration tasks
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Button variant="contained" size="small" sx={{ mr: 1 }}>Current Round (23)</Button>
              <Button variant="outlined" size="small">Next Round Schedule</Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

