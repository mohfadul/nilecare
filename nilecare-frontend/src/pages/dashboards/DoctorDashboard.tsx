import { Container, Typography, Paper, Box, Grid, Card, CardContent, CardActions, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { authStore } from '../../store/authStore';
import { People, CalendarToday, Assignment, LocalHospital } from '@mui/icons-material';

export function DoctorDashboard() {
  const user = authStore((state) => state.user);
  const navigate = useNavigate();

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" gutterBottom>
        Welcome, Dr. {user?.lastName}
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Here's your overview for today
      </Typography>

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <CalendarToday color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Today's Appointments</Typography>
              </Box>
              <Typography variant="h3">12</Typography>
              <Typography variant="body2" color="text.secondary">
                3 pending, 9 scheduled
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <People color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Active Patients</Typography>
              </Box>
              <Typography variant="h3">48</Typography>
              <Typography variant="body2" color="text.secondary">
                Under your care
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
              <Typography variant="h3">7</Typography>
              <Typography variant="body2" color="text.secondary">
                Labs to review, notes to sign
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <LocalHospital color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Critical Alerts</Typography>
              </Box>
              <Typography variant="h3" color="error">2</Typography>
              <Typography variant="body2" color="text.secondary">
                Require immediate attention
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Today's Schedule */}
      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Today's Schedule
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Your appointments will appear here once backend is connected
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Button variant="outlined" size="small" onClick={() => navigate('/appointments')}>View Full Calendar</Button>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Patients
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Recently seen patients will appear here
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Button variant="outlined" size="small" onClick={() => navigate('/patients')}>View All Patients</Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Pending Reviews */}
      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Pending Reviews
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Lab results, imaging reports, and clinical notes requiring your review
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Button variant="contained" size="small" sx={{ mr: 1 }} onClick={() => navigate('/clinical/labs')}>Review Lab Results (3)</Button>
              <Button variant="outlined" size="small" onClick={() => navigate('/clinical/medications')}>View Medications</Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

