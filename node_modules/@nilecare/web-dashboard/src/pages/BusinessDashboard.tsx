/**
 * Business Dashboard Page
 * Central dashboard for all business service operations
 */

import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Tab,
  Tabs,
} from '@mui/material';
import {
  CalendarMonth,
  Receipt,
  People,
  Schedule,
  TrendingUp,
  Refresh,
} from '@mui/icons-material';
import { businessService } from '../services/business.service';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`business-tabpanel-${index}`}
      aria-labelledby={`business-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const BusinessDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [serviceHealth, setServiceHealth] = useState<'checking' | 'healthy' | 'unhealthy'>('checking');
  
  const [appointments, setAppointments] = useState<any[]>([]);
  const [billingRecords, setBillingRecords] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Check service health first
      await businessService.checkHealth();
      setServiceHealth('healthy');

      // Load all data in parallel
      const [appointmentsRes, billingRes, staffRes] = await Promise.allSettled([
        businessService.getAppointments(),
        businessService.getBillingRecords(),
        businessService.getStaff(),
      ]);

      if (appointmentsRes.status === 'fulfilled') {
        // Handle nested data structure: response.data.appointments
        const appointmentsData = appointmentsRes.value?.data?.appointments || appointmentsRes.value?.data || [];
        setAppointments(Array.isArray(appointmentsData) ? appointmentsData : []);
      }
      if (billingRes.status === 'fulfilled') {
        const billingData = billingRes.value?.data?.billings || billingRes.value?.data || [];
        setBillingRecords(Array.isArray(billingData) ? billingData : []);
      }
      if (staffRes.status === 'fulfilled') {
        const staffData = staffRes.value?.data?.staff || staffRes.value?.data || [];
        setStaff(Array.isArray(staffData) ? staffData : []);
      }
    } catch (err: any) {
      setServiceHealth('unhealthy');
      setError(err.message || 'Failed to load business data');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const stats = [
    {
      title: 'Total Appointments',
      value: appointments.length,
      icon: <CalendarMonth sx={{ fontSize: 40 }} />,
      color: '#1976d2',
    },
    {
      title: 'Billing Records',
      value: billingRecords.length,
      icon: <Receipt sx={{ fontSize: 40 }} />,
      color: '#2e7d32',
    },
    {
      title: 'Staff Members',
      value: staff.length,
      icon: <People sx={{ fontSize: 40 }} />,
      color: '#ed6c02',
    },
    {
      title: 'Schedules',
      value: 0,
      icon: <Schedule sx={{ fontSize: 40 }} />,
      color: '#9c27b0',
    },
  ];

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Business Services Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage appointments, billing, staff, and scheduling
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Chip
            label={
              serviceHealth === 'checking' ? 'Checking...' : 
              serviceHealth === 'healthy' ? 'Service Online' : 
              'Service Offline'
            }
            color={
              serviceHealth === 'checking' ? 'default' : 
              serviceHealth === 'healthy' ? 'success' : 
              'error'
            }
          />
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadDashboardData}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {stat.title}
                    </Typography>
                    <Typography variant="h4" fontWeight="600">
                      {stat.value}
                    </Typography>
                  </Box>
                  <Box sx={{ color: stat.color }}>
                    {stat.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="business tabs">
          <Tab label="Appointments" />
          <Tab label="Billing" />
          <Tab label="Staff" />
          <Tab label="Scheduling" />
        </Tabs>
      </Paper>

      {/* Tab Panels */}
      <TabPanel value={activeTab} index={0}>
        <Typography variant="h6" gutterBottom>
          Recent Appointments
        </Typography>
        {appointments.length === 0 ? (
          <Alert severity="info">No appointments found</Alert>
        ) : (
          <Grid container spacing={2}>
            {appointments.slice(0, 6).map((appointment, index) => (
              <Grid item xs={12} md={6} lg={4} key={index}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1">
                      Appointment #{appointment.id}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Status: {appointment.status}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <Typography variant="h6" gutterBottom>
          Billing Records
        </Typography>
        {billingRecords.length === 0 ? (
          <Alert severity="info">No billing records found</Alert>
        ) : (
          <Grid container spacing={2}>
            {billingRecords.slice(0, 6).map((record, index) => (
              <Grid item xs={12} md={6} lg={4} key={index}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1">
                      Invoice #{record.id}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Status: {record.status}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        <Typography variant="h6" gutterBottom>
          Staff Members
        </Typography>
        {staff.length === 0 ? (
          <Alert severity="info">No staff members found</Alert>
        ) : (
          <Grid container spacing={2}>
            {staff.slice(0, 6).map((member, index) => (
              <Grid item xs={12} md={6} lg={4} key={index}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1">
                      {member.firstName} {member.lastName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Role: {member.role}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </TabPanel>

      <TabPanel value={activeTab} index={3}>
        <Typography variant="h6" gutterBottom>
          Schedules
        </Typography>
        <Alert severity="info">Scheduling feature coming soon</Alert>
      </TabPanel>
    </Container>
  );
};

export default BusinessDashboard;

