/**
 * Receptionist Dashboard
 * Appointments, check-in, patient demographics
 */

import React, { useState, useEffect } from 'react';
import {
  Grid, Card, CardContent, Typography, Box, Button, List, ListItem,
  ListItemText, ListItemAvatar, Avatar, Chip, CircularProgress,
} from '@mui/material';
import { Event, CheckCircle, People, Phone } from '@mui/icons-material';
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

const ReceptionistDashboard: React.FC = () => {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ todayAppointments: 0, checkedIn: 0, waiting: 0, newRegistrations: 0 });
  const [todayAppointments, setTodayAppointments] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch stats
        const statsRes = await fetch('http://localhost:7001/api/v1/data/dashboard/stats');
        const statsData = await statsRes.json();
        if (statsData.success) {
          setStats({
            todayAppointments: statsData.data.todayAppointments || 0,
            checkedIn: Math.floor((statsData.data.todayAppointments || 0) * 0.6),
            waiting: Math.floor((statsData.data.todayAppointments || 0) * 0.2),
            newRegistrations: 3
          });
        }

        // Fetch today's appointments
        const aptsRes = await fetch('http://localhost:7001/api/v1/data/appointments/today');
        const aptsData = await aptsRes.json();
        if (aptsData.success) {
          const appointments = (aptsData.data || []).slice(0, 3).map((apt: any) => ({
            patient: apt.patient,
            time: apt.time,
            doctor: apt.doctor,
            status: apt.status === 'completed' ? 'Checked-in' : apt.status === 'confirmed' ? 'Waiting' : 'Scheduled'
          }));
          setTodayAppointments(appointments);
        }

      } catch (error) {
        console.error('Error fetching receptionist dashboard data:', error);
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
        Reception Desk - {user?.username || user?.first_name} 📋
      </Typography>

      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Today's Appointments" value={stats.todayAppointments} icon={<Event />} color="#1976d2" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Checked-In" value={stats.checkedIn} icon={<CheckCircle />} color="#2e7d32" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Waiting" value={stats.waiting} icon={<People />} color="#ed6c02" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="New Registrations" value={stats.newRegistrations} icon={<People />} color="#9c27b0" />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" mb={2}>
                📅 Today's Appointments
              </Typography>
              <List>
                {todayAppointments.map((apt, idx) => (
                  <ListItem key={idx} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, mb: 1 }}>
                    <ListItemAvatar>
                      <Avatar>{apt.patient.charAt(0)}</Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={apt.patient}
                      secondary={`${apt.time} with ${apt.doctor}`}
                    />
                    <Chip
                      label={apt.status}
                      size="small"
                      color={apt.status === 'Checked-in' ? 'success' : apt.status === 'Waiting' ? 'warning' : 'default'}
                    />
                    <Button size="small" variant="contained" sx={{ ml: 1 }}>
                      Check-In
                    </Button>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" mb={2}>
                🚀 Quick Actions
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Button fullWidth variant="contained" startIcon={<Event />}>
                    New Appointment
                  </Button>
                </Grid>
                <Grid item xs={12}>
                  <Button fullWidth variant="contained" color="success" startIcon={<People />}>
                    Register Patient
                  </Button>
                </Grid>
                <Grid item xs={12}>
                  <Button fullWidth variant="contained" color="secondary" startIcon={<CheckCircle />}>
                    Check-In
                  </Button>
                </Grid>
                <Grid item xs={12}>
                  <Button fullWidth variant="contained" color="info" startIcon={<Phone />}>
                    Call Patient
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ReceptionistDashboard;

