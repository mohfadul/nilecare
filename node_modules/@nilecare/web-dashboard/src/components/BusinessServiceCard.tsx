/**
 * Business Service Card Component
 * Quick access card for business service features
 */

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Grid,
  Box,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  BusinessCenter,
  CalendarMonth,
  Receipt,
  People,
  Schedule,
  TrendingUp,
} from '@mui/icons-material';
import { businessService } from '../services/business.service';
import { useAuth } from '../contexts/AuthContext';

interface BusinessServiceCardProps {
  onNavigate?: (path: string) => void;
}

const BusinessServiceCard: React.FC<BusinessServiceCardProps> = ({ onNavigate }) => {
  const { isAuthenticated } = useAuth();
  const [healthStatus, setHealthStatus] = useState<'checking' | 'healthy' | 'unhealthy'>('checking');
  const [stats, setStats] = useState({
    appointments: 0,
    billing: 0,
    staff: 0,
  });

  React.useEffect(() => {
    checkServiceHealth();
    // Only load stats if user is authenticated
    if (isAuthenticated) {
      loadStats();
    }
  }, [isAuthenticated]);

  const checkServiceHealth = async () => {
    try {
      await businessService.checkHealth();
      setHealthStatus('healthy');
    } catch (error) {
      setHealthStatus('unhealthy');
    }
  };

  const loadStats = async () => {
    try {
      const [appointments, billing, staff] = await Promise.allSettled([
        businessService.getAppointments(),
        businessService.getBillingRecords(),
        businessService.getStaff(),
      ]);

      setStats({
        appointments: appointments.status === 'fulfilled' ? appointments.value?.data?.length || 0 : 0,
        billing: billing.status === 'fulfilled' ? billing.value?.data?.length || 0 : 0,
        staff: staff.status === 'fulfilled' ? staff.value?.data?.length || 0 : 0,
      });
    } catch (error) {
      console.error('Failed to load business stats:', error);
    }
  };

  const features = [
    {
      icon: <CalendarMonth />,
      title: 'Appointments',
      description: 'Manage appointments and scheduling',
      count: stats.appointments,
      path: '/dashboard/appointments',
      color: '#1976d2',
    },
    {
      icon: <Receipt />,
      title: 'Billing',
      description: 'Handle invoices and payments',
      count: stats.billing,
      path: '/dashboard/billing',
      color: '#2e7d32',
    },
    {
      icon: <People />,
      title: 'Staff',
      description: 'Manage staff and roles',
      count: stats.staff,
      path: '/dashboard/business',
      color: '#ed6c02',
    },
    {
      icon: <Schedule />,
      title: 'Scheduling',
      description: 'View and manage schedules',
      count: 0,
      path: '/dashboard/business',
      color: '#9c27b0',
    },
  ];

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BusinessCenter sx={{ fontSize: 32, color: 'primary.main' }} />
            <Typography variant="h5" component="div">
              Business Services
            </Typography>
          </Box>
          
          <Chip
            label={
              healthStatus === 'checking' ? 'Checking...' : 
              healthStatus === 'healthy' ? 'Online' : 
              'Offline'
            }
            color={
              healthStatus === 'checking' ? 'default' : 
              healthStatus === 'healthy' ? 'success' : 
              'error'
            }
            size="small"
            icon={healthStatus === 'checking' ? <CircularProgress size={16} /> : undefined}
          />
        </Box>

        {healthStatus === 'unhealthy' && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Business service is currently unavailable. Some features may not work.
          </Alert>
        )}

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Access business operations including appointments, billing, staff management, and scheduling
        </Typography>

        <Grid container spacing={2}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} key={index}>
              <Card
                variant="outlined"
                sx={{
                  p: 2,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    boxShadow: 3,
                    transform: 'translateY(-2px)',
                  },
                }}
                onClick={() => onNavigate?.(feature.path)}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Box sx={{ color: feature.color }}>
                    {feature.icon}
                  </Box>
                  <Typography variant="subtitle1" fontWeight="600">
                    {feature.title}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {feature.description}
                </Typography>
                {feature.count > 0 && (
                  <Chip
                    label={`${feature.count} records`}
                    size="small"
                    sx={{ backgroundColor: `${feature.color}20`, color: feature.color }}
                  />
                )}
              </Card>
            </Grid>
          ))}
        </Grid>
      </CardContent>

      <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
        <Button
          size="small"
          startIcon={<TrendingUp />}
          onClick={() => onNavigate?.('/dashboard/business')}
        >
          View Reports
        </Button>
        <Button
          variant="contained"
          size="small"
          onClick={() => onNavigate?.('/dashboard/business')}
        >
          Open Business Dashboard
        </Button>
      </CardActions>
    </Card>
  );
};

export default BusinessServiceCard;

