import { Container, Typography, Paper, Box, Grid, Card, CardContent, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { authStore } from '../../store/authStore';
import { CalendarToday, PersonAdd, Phone, CheckCircle } from '@mui/icons-material';

export function ReceptionistDashboard() {
  const user = authStore((state) => state.user);
  const navigate = useNavigate();

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" gutterBottom>
        Welcome, {user?.firstName}!
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Front desk operations
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
              <Typography variant="h3">42</Typography>
              <Typography variant="body2" color="text.secondary">
                18 pending check-in
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <CheckCircle color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Checked In</Typography>
              </Box>
              <Typography variant="h3">24</Typography>
              <Typography variant="body2" color="text.secondary">
                Currently in facility
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <Phone color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Pending Calls</Typography>
              </Box>
              <Typography variant="h3">8</Typography>
              <Typography variant="body2" color="text.secondary">
                Confirmations, reschedules
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <PersonAdd color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">New Registrations</Typography>
              </Box>
              <Typography variant="h3">5</Typography>
              <Typography variant="body2" color="text.secondary">
                Today's new patients
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
              Today's Appointment Schedule
            </Typography>
            <Typography variant="body2" color="text.secondary">
              All appointments for today will appear here
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Button variant="contained" size="small" sx={{ mr: 1 }} onClick={() => navigate('/appointments')}>Check In Patient</Button>
              <Button variant="outlined" size="small" onClick={() => navigate('/appointments')}>View Schedule</Button>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Waiting Room
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Patients currently waiting
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="h4">12</Typography>
              <Button variant="outlined" size="small" sx={{ mt: 1 }}>View Queue</Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
              <Button variant="contained" onClick={() => navigate('/patients/new')}>Register New Patient</Button>
              <Button variant="contained" onClick={() => navigate('/appointments/new')}>Schedule Appointment</Button>
              <Button variant="outlined" onClick={() => navigate('/appointments')}>Check In Patient</Button>
              <Button variant="outlined" onClick={() => navigate('/patients')}>Search Patient</Button>
              <Button variant="outlined" onClick={() => navigate('/appointments')}>View Waitlist</Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

