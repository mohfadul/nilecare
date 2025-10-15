/**
 * Doctor Dashboard
 * Clinical workflow, patient management, prescriptions
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  LinearProgress,
  IconButton,
  Badge,
  CircularProgress,
} from '@mui/material';
import {
  LocalHospital,
  People,
  Event,
  Medication,
  Science,
  Assignment,
  TrendingUp,
  Warning,
  Add,
  Notifications,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../services/api.client';

const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  change?: string;
}> = ({ title, value, icon, color, change }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box flex={1}>
          <Typography color="textSecondary" variant="body2" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h4" component="div" fontWeight="bold">
            {value}
          </Typography>
          {change && (
            <Chip
              label={change}
              size="small"
              color="success"
              sx={{ mt: 1 }}
            />
          )}
        </Box>
        <Avatar sx={{ bgcolor: color, width: 56, height: 56 }}>
          {icon}
        </Avatar>
      </Box>
    </CardContent>
  </Card>
);

const DoctorDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State for real data from API
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalPatients: 0, appointments: 0, pendingLabs: 0, prescriptions: 0 });
  const [todayAppointments, setTodayAppointments] = useState<any[]>([]);
  const [pendingTasks, setPendingTasks] = useState<any[]>([]);
  const [recentPatients, setRecentPatients] = useState<any[]>([]);

  // Fetch real data from backend
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch dashboard stats
        const statsResponse = await fetch('http://localhost:7001/api/v1/data/dashboard/stats');
        const statsData = await statsResponse.json();
        if (statsData.success) {
          setStats({
            totalPatients: statsData.data.totalPatients || 0,
            appointments: statsData.data.todayAppointments || 0,
            pendingLabs: statsData.data.pendingLabs || 0,
            prescriptions: statsData.data.activeMedications || 0
          });
        }

        // Fetch today's appointments
        const aptsResponse = await fetch('http://localhost:7001/api/v1/data/appointments/today');
        const aptsData = await aptsResponse.json();
        if (aptsData.success) {
          setTodayAppointments(aptsData.data || []);
        }

        // Fetch recent patients
        const patientsResponse = await fetch('http://localhost:7001/api/v1/data/patients/recent');
        const patientsData = await patientsResponse.json();
        if (patientsData.success) {
          const patients = (patientsData.data || []).slice(0, 3).map((p: any) => ({
            id: p.id,
            name: `${p.first_name} ${p.last_name}`,
            diagnosis: p.medical_conditions || 'N/A',
            lastVisit: new Date(p.created_at).toLocaleDateString(),
            status: 'stable'
          }));
          setRecentPatients(patients);
        }

        // Fetch pending tasks
        const tasksResponse = await fetch(`http://localhost:7001/api/v1/data/tasks/pending?userId=${user?.id || 'user_1'}`);
        const tasksData = await tasksResponse.json();
        if (tasksData.success) {
          const tasks = (tasksData.data || []).slice(0, 3).map((t: any) => ({
            id: t.id,
            task: t.title,
            priority: t.priority,
            time: new Date(t.created_at).toLocaleTimeString()
          }));
          setPendingTasks(tasks);
        }

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box mb={3}>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Good morning, Dr. {user?.username || 'Doctor'} 👨‍⚕️
        </Typography>
        <Typography variant="body1" color="text.secondary">
          You have {stats.appointments} appointments today. Total patients: {stats.totalPatients}
        </Typography>
      </Box>

      {/* Statistics Cards - REAL DATA */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Patients"
            value={stats.totalPatients}
            icon={<People />}
            color="#1976d2"
            change="Database"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Today's Appointments"
            value={stats.appointments}
            icon={<Event />}
            color="#2e7d32"
            change="Real-time"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Labs"
            value={stats.pendingLabs}
            icon={<Science />}
            color="#ed6c02"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Medications"
            value={stats.prescriptions}
            icon={<Medication />}
            color="#9c27b0"
            change="Active"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Today's Appointments */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight="bold">
                  📅 Today's Appointments
                </Typography>
                <Button startIcon={<Add />} size="small" variant="outlined">
                  New
                </Button>
              </Box>
              <List>
                {todayAppointments.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" p={2} textAlign="center">
                    No appointments scheduled for today
                  </Typography>
                ) : (
                  todayAppointments.map((apt) => (
                    <ListItem
                      key={apt.id}
                      sx={{
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        mb: 1,
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          {apt.patient?.charAt(0) || 'P'}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={apt.patient}
                        secondary={
                          <Box>
                            <Typography variant="body2">
                              {apt.time} • {apt.type || 'Consultation'}
                            </Typography>
                          </Box>
                        }
                      />
                      <Chip
                        label={apt.status}
                        size="small"
                        color={
                          apt.status === 'completed' ? 'success' :
                          apt.status === 'in_progress' ? 'warning' :
                          'default'
                        }
                      />
                    </ListItem>
                  ))
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Pending Tasks */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight="bold">
                  ⚡ Pending Tasks
                </Typography>
                <Badge badgeContent={pendingTasks.length} color="error">
                  <Notifications />
                </Badge>
              </Box>
              <List>
                {pendingTasks.map((task) => (
                  <ListItem
                    key={task.id}
                    sx={{
                      border: '1px solid',
                      borderColor: task.priority === 'high' ? 'error.main' : 'divider',
                      borderRadius: 1,
                      mb: 1,
                      bgcolor: task.priority === 'high' ? 'error.50' : 'transparent',
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: task.priority === 'high' ? 'error.main' : 'primary.main' }}>
                        <Assignment />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={task.task}
                      secondary={task.time}
                    />
                    <IconButton size="small" color="primary">
                      <TrendingUp />
                    </IconButton>
                  </ListItem>
                ))}
              </List>
              <Button fullWidth variant="outlined" sx={{ mt: 2 }}>
                View All Tasks
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Patients */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" mb={2}>
                🏥 Recent Patients
              </Typography>
              <Grid container spacing={2}>
                {recentPatients.map((patient) => (
                  <Grid item xs={12} sm={6} md={4} key={patient.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box display="flex" alignItems="center" mb={1}>
                          <Avatar sx={{ mr: 2 }}>{patient.name.charAt(0)}</Avatar>
                          <Box>
                            <Typography variant="subtitle1" fontWeight="bold">
                              {patient.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Last visit: {patient.lastVisit}
                            </Typography>
                          </Box>
                        </Box>
                        <Typography variant="body2" color="text.secondary" mb={1}>
                          {patient.diagnosis}
                        </Typography>
                        <Chip
                          label={patient.status}
                          size="small"
                          color={patient.status === 'improving' ? 'success' : 'default'}
                        />
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
              <Button fullWidth variant="outlined" sx={{ mt: 2 }} startIcon={<People />}>
                View All Patients
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" mb={2}>
                🚀 Quick Actions
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Button 
                    fullWidth 
                    variant="contained" 
                    startIcon={<Add />}
                    onClick={() => navigate('/dashboard/patients/new')}
                  >
                    New Patient
                  </Button>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Button 
                    fullWidth 
                    variant="contained" 
                    startIcon={<Medication />} 
                    color="secondary"
                    onClick={() => navigate('/dashboard/medications')}
                  >
                    Prescribe
                  </Button>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Button 
                    fullWidth 
                    variant="contained" 
                    startIcon={<Science />} 
                    color="info"
                    onClick={() => navigate('/dashboard/lab-orders')}
                  >
                    Order Lab
                  </Button>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Button 
                    fullWidth 
                    variant="contained" 
                    startIcon={<Assignment />} 
                    color="success"
                    onClick={() => navigate('/dashboard/clinical-notes')}
                  >
                    Write Note
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

export default DoctorDashboard;

