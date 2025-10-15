/**
 * Medical Director Dashboard
 * Clinical oversight, quality metrics, compliance, staff performance
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
  LinearProgress,
  Alert,
} from '@mui/material';
import {
  Assessment,
  TrendingUp,
  Warning,
  CheckCircle,
  People,
  LocalHospital,
  Assignment,
  School,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../services/api.client';

interface MetricCardProps {
  title: string;
  value: string | number;
  target: string | number;
  percentage: number;
  icon: React.ReactNode;
  color?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, target, percentage, icon, color = 'primary' }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
        <Box sx={{ color: `${color}.main` }}>{icon}</Box>
      </Box>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        {value}
      </Typography>
      <Typography variant="caption" color="text.secondary" gutterBottom>
        Target: {target}
      </Typography>
      <LinearProgress
        variant="determinate"
        value={percentage}
        sx={{ mt: 1, height: 8, borderRadius: 1 }}
        color={percentage >= 90 ? 'success' : percentage >= 70 ? 'warning' : 'error'}
      />
      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
        {percentage}% of target
      </Typography>
    </CardContent>
  </Card>
);

const MedicalDirectorDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [qualityMetrics, setQualityMetrics] = useState({
    patientSatisfaction: 92,
    clinicalCompliance: 95,
    staffPerformance: 88,
    medicationErrors: 0.3,
  });
  const [clinicalAlerts, setClinicalAlerts] = useState<any[]>([]);
  const [staffPerformance, setStaffPerformance] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(false);

      // Mock clinical alerts (in production, from quality system)
      setClinicalAlerts([
        { severity: 'warning', message: 'Hand hygiene compliance below 95% in ICU', department: 'ICU', priority: 'High' },
        { severity: 'info', message: 'New clinical guideline: Antibiotic stewardship update', department: 'All', priority: 'Medium' },
        { severity: 'success', message: 'All departments passed Joint Commission standards', department: 'All', priority: 'Info' },
      ]);

      // Mock staff performance
      setStaffPerformance([
        { name: 'Dr. Ahmed Hassan', role: 'Physician', performance: 95, patients: 150, satisfaction: 4.8 },
        { name: 'Dr. Sarah Ali', role: 'Physician', performance: 92, patients: 145, satisfaction: 4.7 },
        { name: 'Nurse Fatima Mohamed', role: 'Nurse', performance: 98, patients: 200, satisfaction: 4.9 },
        { name: 'Dr. Omar Ibrahim', role: 'Physician', performance: 88, patients: 120, satisfaction: 4.5 },
        { name: 'Nurse Aisha Abdullah', role: 'Nurse', performance: 94, patients: 180, satisfaction: 4.6 },
      ]);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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
        🏥 Medical Director Dashboard
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Welcome, {user?.username || user?.email}! Clinical quality oversight and performance management.
      </Typography>

      {/* Clinical Alerts */}
      <Box sx={{ mb: 3, mt: 2 }}>
        {clinicalAlerts.map((alert, index) => (
          <Alert 
            key={index} 
            severity={alert.severity as any} 
            sx={{ mb: 1 }}
            action={
              <Chip label={alert.priority} size="small" color={
                alert.priority === 'High' ? 'error' : 
                alert.priority === 'Medium' ? 'warning' : 'default'
              } />
            }
          >
            <strong>{alert.department}:</strong> {alert.message}
          </Alert>
        ))}
      </Box>

      {/* Quality Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Patient Satisfaction"
            value={`${qualityMetrics.patientSatisfaction}%`}
            target="90%"
            percentage={qualityMetrics.patientSatisfaction}
            icon={<CheckCircle sx={{ fontSize: 40 }} />}
            color="success"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Clinical Compliance"
            value={`${qualityMetrics.clinicalCompliance}%`}
            target="95%"
            percentage={qualityMetrics.clinicalCompliance}
            icon={<Assessment sx={{ fontSize: 40 }} />}
            color="primary"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Staff Performance"
            value={`${qualityMetrics.staffPerformance}%`}
            target="85%"
            percentage={qualityMetrics.staffPerformance}
            icon={<People sx={{ fontSize: 40 }} />}
            color="info"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Medication Errors"
            value={`${qualityMetrics.medicationErrors}%`}
            target="< 0.5%"
            percentage={100 - (qualityMetrics.medicationErrors * 20)}
            icon={<Warning sx={{ fontSize: 40 }} />}
            color="success"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Clinical Actions */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" mb={2}>
                📊 Quality Management
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<Assessment />}
                    onClick={() => alert('Quality Metrics Dashboard - Coming soon!')}
                  >
                    Quality Metrics
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<Assignment />}
                    color="secondary"
                    onClick={() => alert('Clinical Guidelines - Coming soon!')}
                  >
                    Guidelines
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<People />}
                    color="info"
                    onClick={() => alert('Staff Performance - Coming soon!')}
                  >
                    Staff Review
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<School />}
                    color="success"
                    onClick={() => alert('Training Programs - Coming soon!')}
                  >
                    Training
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<LocalHospital />}
                    color="warning"
                    onClick={() => alert('Department Oversight - Coming soon!')}
                  >
                    Departments
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<TrendingUp />}
                    color="error"
                    onClick={() => alert('Performance Trends - Coming soon!')}
                  >
                    Trends
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Staff Performance Leaderboard */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" mb={2}>
                ⭐ Staff Performance Leaderboard
              </Typography>
              <List>
                {staffPerformance.map((staff, index) => (
                  <ListItem key={index} divider>
                    <ListItemText
                      primary={
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="body1" fontWeight="bold">
                            {index + 1}. {staff.name}
                          </Typography>
                          <Chip
                            label={`${staff.performance}%`}
                            size="small"
                            color={staff.performance >= 95 ? 'success' : staff.performance >= 90 ? 'primary' : 'warning'}
                          />
                        </Box>
                      }
                      secondary={
                        <Box mt={1}>
                          <Typography variant="caption" color="text.secondary">
                            {staff.role} • {staff.patients} patients • ⭐ {staff.satisfaction}/5.0
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={staff.performance}
                            sx={{ mt: 1, height: 6, borderRadius: 1 }}
                            color={staff.performance >= 95 ? 'success' : staff.performance >= 90 ? 'primary' : 'warning'}
                          />
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
                  onClick={() => alert('Full staff performance report - Coming soon!')}
                >
                  View Full Report
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default MedicalDirectorDashboard;

