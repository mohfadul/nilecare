/**
 * Patient Portal
 * Personal health records, appointments, messages
 */

import React, { useState, useEffect } from 'react';
import {
  Grid, Card, CardContent, Typography, Box, Button, List, ListItem,
  ListItemText, Avatar, Chip, CircularProgress,
} from '@mui/material';
import { Event, LocalHospital, Medication, Assessment, Message } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const StatCard: React.FC<{
  title: string; value: string | number; icon: React.ReactNode; color: string;
}> = ({ title, value, icon, color }) => (
  <Card>
    <CardContent>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography color="textSecondary" variant="body2">{title}</Typography>
          <Typography variant="h4" fontWeight="bold">{value}</Typography>
        </Box>
        <Avatar sx={{ bgcolor: color, width: 56, height: 56 }}>{icon}</Avatar>
      </Box>
    </CardContent>
  </Card>
);

const PatientPortal: React.FC = () => {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ appointments: 0, activeMeds: 0, labResults: 0, messages: 0 });
  const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([]);
  const [medications, setMedications] = useState<any[]>([]);
  const [recentResults, setRecentResults] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch stats
        const statsRes = await fetch('http://localhost:7001/api/v1/data/dashboard/stats');
        const statsData = await statsRes.json();
        if (statsData.success) {
          setStats({
            appointments: 2,
            activeMeds: statsData.data.activeMedications || 5,
            labResults: 3,
            messages: 2
          });
        }

        // Mock upcoming appointments
        setUpcomingAppointments([
          { date: 'Tomorrow, 10:00 AM', doctor: 'Dr. Hassan', type: 'Follow-up' },
          { date: 'Next Week, 02:00 PM', doctor: 'Dr. Ali', type: 'Check-up' },
        ]);

        // Mock medications
        setMedications([
          { name: 'Aspirin 100mg', dosage: '1 tablet daily', refills: '2 remaining' },
          { name: 'Metformin 500mg', dosage: '2 tablets daily', refills: '1 remaining' },
        ]);

        // Mock lab results
        setRecentResults([
          { test: 'Complete Blood Count', date: '2 days ago', status: 'Normal' },
          { test: 'Lipid Panel', date: '1 week ago', status: 'View Results' },
        ]);

      } catch (error) {
        console.error('Error fetching patient portal data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Welcome, {user?.username || user?.first_name} 👤
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={3}>
        Your personal health dashboard
      </Typography>

      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Appointments" value={stats.appointments} icon={<Event />} color="#1976d2" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Active Medications" value={stats.activeMeds} icon={<Medication />} color="#2e7d32" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Lab Results" value={stats.labResults} icon={<Assessment />} color="#ed6c02" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Messages" value={stats.messages} icon={<Message />} color="#9c27b0" />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" mb={2}>
                📅 Upcoming Appointments
              </Typography>
              <List>
                {upcomingAppointments.map((apt, idx) => (
                  <ListItem key={idx} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, mb: 1 }}>
                    <ListItemText
                      primary={apt.doctor}
                      secondary={`${apt.date} • ${apt.type}`}
                    />
                  </ListItem>
                ))}
              </List>
              <Button fullWidth variant="contained" sx={{ mt: 2 }}>
                Book Appointment
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" mb={2}>
                💊 Current Medications
              </Typography>
              <List>
                {medications.map((med, idx) => (
                  <ListItem key={idx} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, mb: 1 }}>
                    <ListItemText
                      primary={med.name}
                      secondary={`${med.dosage} • ${med.refills}`}
                    />
                  </ListItem>
                ))}
              </List>
              <Button fullWidth variant="outlined" sx={{ mt: 2 }}>
                Request Refill
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" mb={2}>
                🔬 Recent Lab Results
              </Typography>
              <List>
                {recentResults.map((result, idx) => (
                  <ListItem key={idx} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, mb: 1 }}>
                    <ListItemText
                      primary={result.test}
                      secondary={result.date}
                    />
                    <Chip label={result.status} size="small" color={result.status === 'Normal' ? 'success' : 'default'} />
                  </ListItem>
                ))}
              </List>
              <Button fullWidth variant="outlined" sx={{ mt: 2 }}>
                View All Results
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" mb={2}>
                🚀 Quick Actions
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Button fullWidth variant="contained" startIcon={<Event />}>Book Appointment</Button>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Button fullWidth variant="contained" startIcon={<Message />} color="secondary">Message Doctor</Button>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Button fullWidth variant="contained" startIcon={<Assessment />} color="info">Lab Results</Button>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Button fullWidth variant="contained" startIcon={<Medication />} color="success">Medications</Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PatientPortal;

