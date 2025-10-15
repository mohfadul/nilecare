import React, { useEffect, useState } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  IconButton,
  Button,
} from '@mui/material';
import {
  TrendingUp,
  People,
  Event,
  LocalHospital,
  Warning,
  CheckCircle,
  Schedule,
  Assessment,
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

import { useAuth } from '../../contexts/AuthContext';
// import { useSocket } from '../../contexts/SocketContext'; // TODO: Implement socket context

// Mock data - in real app, this would come from API
const mockDashboardData = {
  stats: {
    totalPatients: 1247,
    activeAppointments: 23,
    completedEncounters: 156,
    pendingDiagnostics: 8,
  },
  recentActivity: [
    { id: 1, type: 'appointment', patient: 'John Doe', time: '10:30 AM', status: 'completed' },
    { id: 2, type: 'encounter', patient: 'Jane Smith', time: '11:15 AM', status: 'in-progress' },
    { id: 3, type: 'diagnostic', patient: 'Bob Johnson', time: '11:45 AM', status: 'pending' },
    { id: 4, type: 'medication', patient: 'Alice Brown', time: '12:00 PM', status: 'prescribed' },
  ],
  weeklyStats: [
    { day: 'Mon', patients: 45, appointments: 32, encounters: 28 },
    { day: 'Tue', patients: 52, appointments: 38, encounters: 35 },
    { day: 'Wed', patients: 48, appointments: 35, encounters: 31 },
    { day: 'Thu', patients: 61, appointments: 42, encounters: 39 },
    { day: 'Fri', patients: 55, appointments: 40, encounters: 36 },
    { day: 'Sat', patients: 32, appointments: 25, encounters: 22 },
    { day: 'Sun', patients: 28, appointments: 20, encounters: 18 },
  ],
  appointmentTypes: [
    { name: 'Consultation', value: 45, color: '#8884d8' },
    { name: 'Follow-up', value: 30, color: '#82ca9d' },
    { name: 'Procedure', value: 15, color: '#ffc658' },
    { name: 'Emergency', value: 10, color: '#ff7300' },
  ],
  alerts: [
    { id: 1, type: 'warning', message: 'Patient John Doe has overdue medication', severity: 'high' },
    { id: 2, type: 'info', message: 'New diagnostic results available for Jane Smith', severity: 'medium' },
    { id: 3, type: 'success', message: 'Appointment confirmed for Bob Johnson', severity: 'low' },
  ],
};

const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  trend?: number;
}> = ({ title, value, icon, color, trend }) => (
  <Card>
    <CardContent>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography color="textSecondary" gutterBottom variant="h6">
            {title}
          </Typography>
          <Typography variant="h4" component="h2" color={color}>
            {value}
          </Typography>
          {trend !== undefined && (
            <Box display="flex" alignItems="center" mt={1}>
              <TrendingUp fontSize="small" color={trend > 0 ? 'success' : 'error'} />
              <Typography variant="body2" color={trend > 0 ? 'success.main' : 'error.main'} ml={0.5}>
                {trend > 0 ? '+' : ''}{trend}%
              </Typography>
            </Box>
          )}
        </Box>
        <Avatar sx={{ bgcolor: color, width: 56, height: 56 }}>
          {icon}
        </Avatar>
      </Box>
    </CardContent>
  </Card>
);

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  // const { socket } = useSocket(); // TODO: Enable when socket context is ready
  const [dashboardData, setDashboardData] = useState(mockDashboardData);

  useEffect(() => {
    // TODO: Subscribe to real-time updates when socket is ready
    // if (socket) {
    //   socket.on('dashboard:update', (data) => {
    //     setDashboardData(prev => ({
    //       ...prev,
    //       stats: { ...prev.stats, ...data.stats }
    //     }));
    //   });

    //   socket.on('appointment:created', (data) => {
    //     setDashboardData(prev => ({
    //       ...prev,
    //       recentActivity: [data, ...prev.recentActivity.slice(0, 3)]
    //     }));
    //   });

    //   return () => {
    //     socket.off('dashboard:update');
    //     socket.off('appointment:created');
    //   };
    // }
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in-progress': return 'warning';
      case 'pending': return 'info';
      default: return 'default';
    }
  };

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Welcome Header */}
      <Box mb={3}>
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome back, {user?.username || user?.email || 'User'}!
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Here's what's happening at your healthcare facility today. Role: {user?.role}
        </Typography>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Patients"
            value={dashboardData.stats.totalPatients.toLocaleString()}
            icon={<People />}
            color="#1976d2"
            trend={5.2}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Appointments"
            value={dashboardData.stats.activeAppointments}
            icon={<Event />}
            color="#2e7d32"
            trend={12.5}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Completed Encounters"
            value={dashboardData.stats.completedEncounters}
            icon={<LocalHospital />}
            color="#ed6c02"
            trend={8.1}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Diagnostics"
            value={dashboardData.stats.pendingDiagnostics}
            icon={<Assessment />}
            color="#d32f2f"
            trend={-2.3}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Weekly Statistics Chart */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Weekly Activity Overview
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dashboardData.weeklyStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="patients" stroke="#1976d2" strokeWidth={2} />
                  <Line type="monotone" dataKey="appointments" stroke="#2e7d32" strokeWidth={2} />
                  <Line type="monotone" dataKey="encounters" stroke="#ed6c02" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Appointment Types Distribution */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Appointment Types
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={dashboardData.appointmentTypes}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {dashboardData.appointmentTypes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Activity
              </Typography>
              <List>
                {dashboardData.recentActivity.map((activity) => (
                  <ListItem key={activity.id} divider>
                    <ListItemAvatar>
                      <Avatar>
                        {activity.type === 'appointment' && <Event />}
                        {activity.type === 'encounter' && <LocalHospital />}
                        {activity.type === 'diagnostic' && <Assessment />}
                        {activity.type === 'medication' && <CheckCircle />}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={activity.patient}
                      secondary={
                        <Box display="flex" alignItems="center" justifyContent="space-between">
                          <Typography variant="body2" color="textSecondary">
                            {activity.time}
                          </Typography>
                          <Chip
                            label={activity.status}
                            color={getStatusColor(activity.status) as any}
                            size="small"
                          />
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Alerts and Notifications */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Alerts & Notifications
              </Typography>
              <List>
                {dashboardData.alerts.map((alert) => (
                  <ListItem key={alert.id} divider>
                    <ListItemAvatar>
                      <Avatar>
                        {alert.type === 'warning' && <Warning />}
                        {alert.type === 'info' && <Assessment />}
                        {alert.type === 'success' && <CheckCircle />}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={alert.message}
                      secondary={
                        <Box display="flex" alignItems="center" justifyContent="space-between">
                          <Chip
                            label={alert.severity}
                            color={getAlertColor(alert.severity) as any}
                            size="small"
                          />
                          <IconButton size="small">
                            <Schedule fontSize="small" />
                          </IconButton>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
              <Box mt={2}>
                <Button variant="outlined" fullWidth>
                  View All Alerts
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
