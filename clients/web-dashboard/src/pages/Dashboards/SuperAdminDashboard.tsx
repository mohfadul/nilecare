/**
 * Super Admin Dashboard
 * System-wide management, user management, system configuration, analytics
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
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Settings,
  People,
  Assessment,
  Security,
  CloudQueue,
  Storage,
  Speed,
  BugReport,
  Business,
  LocalHospital,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../services/api.client';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
  subtitle?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color = 'primary.main', subtitle }) => (
  <Card sx={{ height: '100%', borderLeft: 4, borderColor: color }}>
    <CardContent>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography color="text.secondary" gutterBottom variant="body2">
            {title}
          </Typography>
          <Typography variant="h4" fontWeight="bold">
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        <Box sx={{ color }}>{icon}</Box>
      </Box>
    </CardContent>
  </Card>
);

const SuperAdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [systemStats, setSystemStats] = useState({
    totalUsers: 0,
    totalFacilities: 0,
    totalPatients: 0,
    systemUptime: '99.9%',
    activeUsers: 0,
    storageUsed: '450 GB',
    apiCalls: '1.2M',
    errorRate: '0.05%',
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [systemAlerts, setSystemAlerts] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch system statistics
      const [usersResult, patientsResult] = await Promise.all([
        apiClient.getUsers({ page: 1, limit: 1 }),
        apiClient.getPatients({ page: 1, limit: 1 }),
      ]);

      if (usersResult.success && usersResult.data) {
        const users = Array.isArray(usersResult.data) ? usersResult.data : [];
        setSystemStats(prev => ({
          ...prev,
          totalUsers: users.length,
          activeUsers: users.filter((u: any) => u.status === 'active').length,
        }));
      }

      if (patientsResult.success && patientsResult.data) {
        const patients = patientsResult.data.patients || patientsResult.data || [];
        setSystemStats(prev => ({
          ...prev,
          totalPatients: patients.length,
        }));
      }

      // Mock recent activity (in production, this would come from audit logs)
      setRecentActivity([
        { action: 'New facility registered', user: 'System', time: '2 minutes ago', type: 'facility' },
        { action: 'User role changed', user: 'admin@nilecare.sd', time: '15 minutes ago', type: 'user' },
        { action: 'System backup completed', user: 'Automated', time: '1 hour ago', type: 'system' },
        { action: 'Security scan completed', user: 'Security System', time: '2 hours ago', type: 'security' },
        { action: 'API key rotated', user: 'admin@nilecare.sd', time: '3 hours ago', type: 'security' },
      ]);

      // Mock system alerts
      setSystemAlerts([
        { severity: 'info', message: 'System backup scheduled for tonight at 2 AM', time: 'Scheduled' },
        { severity: 'warning', message: 'Certificate renewal required in 30 days', time: '30 days' },
        { severity: 'success', message: 'All systems operational', time: 'Current' },
      ]);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        🏛️ Super Admin Dashboard
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Welcome back, {user?.username || user?.email}! System-wide management and oversight.
      </Typography>

      {/* System Alerts */}
      <Box sx={{ mb: 3, mt: 2 }}>
        {systemAlerts.map((alert, index) => (
          <Alert key={index} severity={alert.severity as any} sx={{ mb: 1 }}>
            {alert.message} - {alert.time}
          </Alert>
        ))}
      </Box>

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Users"
            value={systemStats.totalUsers}
            icon={<People sx={{ fontSize: 40 }} />}
            subtitle={`${systemStats.activeUsers} active`}
            color="primary.main"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Healthcare Facilities"
            value={systemStats.totalFacilities}
            icon={<LocalHospital sx={{ fontSize: 40 }} />}
            subtitle="Registered facilities"
            color="secondary.main"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Patients"
            value={systemStats.totalPatients.toLocaleString()}
            icon={<People sx={{ fontSize: 40 }} />}
            subtitle="Across all facilities"
            color="success.main"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="System Uptime"
            value={systemStats.systemUptime}
            icon={<Speed sx={{ fontSize: 40 }} />}
            subtitle="Last 30 days"
            color="info.main"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Storage Used"
            value={systemStats.storageUsed}
            icon={<Storage sx={{ fontSize: 40 }} />}
            subtitle="of 1 TB"
            color="warning.main"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="API Calls (Today)"
            value={systemStats.apiCalls}
            icon={<CloudQueue sx={{ fontSize: 40 }} />}
            subtitle="Across all services"
            color="primary.main"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Error Rate"
            value={systemStats.errorRate}
            icon={<BugReport sx={{ fontSize: 40 }} />}
            subtitle="Last 24 hours"
            color="success.main"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Sessions"
            value={systemStats.activeUsers}
            icon={<People sx={{ fontSize: 40 }} />}
            subtitle="Currently logged in"
            color="secondary.main"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* System Actions */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" mb={2}>
                ⚙️ System Management
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<People />}
                    onClick={() => navigate('/dashboard/admin/users')}
                  >
                    Manage Users
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<Business />}
                    color="secondary"
                    onClick={() => alert('Facility Management - Coming soon!')}
                  >
                    Facilities
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<Settings />}
                    color="info"
                    onClick={() => navigate('/dashboard/settings')}
                  >
                    System Config
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<Security />}
                    color="error"
                    onClick={() => alert('Security Settings - Coming soon!')}
                  >
                    Security
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<Assessment />}
                    color="success"
                    onClick={() => alert('Analytics Dashboard - Coming soon!')}
                  >
                    Analytics
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<Storage />}
                    color="warning"
                    onClick={() => alert('Database Management - Coming soon!')}
                  >
                    Database
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" mb={2}>
                📋 Recent System Activity
              </Typography>
              <List>
                {recentActivity.map((activity, index) => (
                  <ListItem key={index} divider>
                    <ListItemText
                      primary={activity.action}
                      secondary={
                        <Box display="flex" gap={1} alignItems="center" mt={0.5}>
                          <Chip
                            label={activity.type}
                            size="small"
                            color={
                              activity.type === 'security' ? 'error' :
                              activity.type === 'system' ? 'info' :
                              activity.type === 'facility' ? 'success' : 'primary'
                            }
                          />
                          <Typography variant="caption" color="text.secondary">
                            by {activity.user} • {activity.time}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
              <Box mt={2}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => alert('Full audit log - Coming soon!')}
                >
                  View Full Audit Log
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SuperAdminDashboard;

