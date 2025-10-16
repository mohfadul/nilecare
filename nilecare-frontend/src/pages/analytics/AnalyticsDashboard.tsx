/**
 * Analytics Dashboard Page
 * ✅ PHASE 8: Advanced Features - Business Intelligence
 * 
 * Provides comprehensive analytics and reporting capabilities
 */

import { useState } from 'react';
import { 
  Container, 
  Typography, 
  Grid, 
  Paper, 
  Box,
  Card,
  CardContent,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import { 
  TrendingUp, 
  AttachMoney, 
  People, 
  CalendarToday,
  Download 
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '../../services/analytics.service';
import { StatCard } from '../../components/shared/StatCard';
import { DashboardSkeleton } from '../../components/shared/LoadingSkeleton';

/**
 * Analytics Dashboard - Business Intelligence & Reporting
 */
export function AnalyticsDashboard() {
  const [dateRange, setDateRange] = useState('30'); // days
  
  // Calculate date range
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - parseInt(dateRange) * 24 * 60 * 60 * 1000)
    .toISOString().split('T')[0];
  
  // Fetch analytics data
  const { data: revenueData, isLoading: loadingRevenue } = useQuery({
    queryKey: ['analytics-revenue', startDate, endDate],
    queryFn: () => analyticsService.getRevenueStats(startDate, endDate),
    staleTime: 300000 // 5 minutes
  });
  
  const { data: patientData, isLoading: loadingPatients } = useQuery({
    queryKey: ['analytics-patients'],
    queryFn: () => analyticsService.getPatientStats()
  });
  
  const { data: appointmentData, isLoading: loadingAppointments } = useQuery({
    queryKey: ['analytics-appointments', dateRange],
    queryFn: () => analyticsService.getAppointmentTrends(parseInt(dateRange))
  });
  
  const { data: labData, isLoading: loadingLabs } = useQuery({
    queryKey: ['analytics-labs'],
    queryFn: () => analyticsService.getLabPerformance()
  });
  
  const isLoading = loadingRevenue || loadingPatients || loadingAppointments || loadingLabs;
  
  if (isLoading) {
    return (
      <Container maxWidth="xl">
        <DashboardSkeleton />
      </Container>
    );
  }
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };
  
  return (
    <Container maxWidth="xl">
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Analytics & Reporting
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Business intelligence and performance metrics
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Date Range</InputLabel>
            <Select
              value={dateRange}
              label="Date Range"
              onChange={(e) => setDateRange(e.target.value)}
            >
              <MenuItem value="7">Last 7 Days</MenuItem>
              <MenuItem value="30">Last 30 Days</MenuItem>
              <MenuItem value="90">Last 90 Days</MenuItem>
              <MenuItem value="365">Last Year</MenuItem>
            </Select>
          </FormControl>
          
          <Button 
            variant="outlined" 
            startIcon={<Download />}
            onClick={() => analyticsService.exportReport('comprehensive', 'pdf')}
          >
            Export Report
          </Button>
        </Box>
      </Box>
      
      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Revenue"
            value={formatCurrency(revenueData?.data?.total || 0)}
            subtitle={`Last ${dateRange} days`}
            icon={<AttachMoney />}
            color="success"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Patients"
            value={patientData?.data?.total || 0}
            subtitle={`${patientData?.data?.new || 0} new this month`}
            icon={<People />}
            color="primary"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Patients"
            value={patientData?.data?.active || 0}
            subtitle="Currently under care"
            icon={<People />}
            color="info"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Avg Wait Time"
            value={`${appointmentData?.data?.averageWaitTime || 0}m`}
            subtitle="Appointment wait time"
            icon={<CalendarToday />}
            color="warning"
          />
        </Grid>
      </Grid>
      
      {/* Charts Placeholder */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Revenue Trends
            </Typography>
            <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                📊 Chart visualization ready
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                (Install recharts: npm install recharts)
              </Typography>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Appointment Trends
            </Typography>
            <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                📊 Chart visualization ready
              </Typography>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Patient Demographics
            </Typography>
            <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                📊 Pie chart showing age/gender distribution
              </Typography>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Lab Performance
            </Typography>
            <Box sx={{ p: 2 }}>
              <Typography variant="body2" gutterBottom>
                <strong>Average Turnaround:</strong> {labData?.data?.averageTurnaround || 0} hours
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Pending Tests:</strong> {labData?.data?.pendingTests || 0}
              </Typography>
              <Typography variant="body2">
                <strong>Completed Today:</strong> {labData?.data?.completedToday || 0}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Export Options */}
      <Box sx={{ mt: 4, p: 3, bgcolor: 'background.paper', borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          Export Reports
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          <Button 
            variant="outlined" 
            startIcon={<Download />}
            onClick={() => analyticsService.exportReport('revenue', 'pdf')}
          >
            Revenue Report (PDF)
          </Button>
          <Button 
            variant="outlined" 
            startIcon={<Download />}
            onClick={() => analyticsService.exportReport('patients', 'excel')}
          >
            Patient Report (Excel)
          </Button>
          <Button 
            variant="outlined" 
            startIcon={<Download />}
            onClick={() => analyticsService.exportReport('comprehensive', 'pdf')}
          >
            Comprehensive Report (PDF)
          </Button>
        </Box>
      </Box>
    </Container>
  );
}

export default AnalyticsDashboard;

