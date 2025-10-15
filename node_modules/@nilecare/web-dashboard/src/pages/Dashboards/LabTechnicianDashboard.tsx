/**
 * Lab Technician Dashboard
 * Lab orders, results, quality control
 */

import React, { useState, useEffect } from 'react';
import {
  Grid, Card, CardContent, Typography, Box, Button, List, ListItem,
  ListItemText, ListItemAvatar, Avatar, Chip, CircularProgress,
} from '@mui/material';
import { Science, Assignment, CheckCircle, HourglassEmpty } from '@mui/icons-material';
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

const LabTechnicianDashboard: React.FC = () => {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ pending: 0, inProgress: 0, completedToday: 0, qcDue: 0 });
  const [pendingTests, setPendingTests] = useState<any[]>([]);
  const [testsInProgress, setTestsInProgress] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch stats
        const statsRes = await fetch('http://localhost:7001/api/v1/data/dashboard/stats');
        const statsData = await statsRes.json();
        if (statsData.success) {
          setStats({
            pending: statsData.data.pendingLabs || 0,
            inProgress: 5,
            completedToday: 45,
            qcDue: 3
          });
        }

        // Fetch pending lab orders
        const labsRes = await fetch('http://localhost:7001/api/v1/data/lab-orders/pending');
        const labsData = await labsRes.json();
        if (labsData.success) {
          const tests = (labsData.data || []).slice(0, 2).map((lab: any) => ({
            patient: `${lab.patient_first_name} ${lab.patient_last_name}`,
            test: lab.test_name,
            priority: lab.priority.charAt(0).toUpperCase() + lab.priority.slice(1),
            orderedBy: `Dr. ${lab.provider_first_name} ${lab.provider_last_name}`
          }));
          setPendingTests(tests);

          // Get in-progress tests
          const inProgress = (labsData.data || [])
            .filter((lab: any) => lab.status === 'in_progress')
            .slice(0, 2)
            .map((lab: any) => ({
              patient: `${lab.patient_first_name} ${lab.patient_last_name}`,
              test: lab.test_name,
              progress: 50,
              eta: '30 min'
            }));
          setTestsInProgress(inProgress);
        }

      } catch (error) {
        console.error('Error fetching lab dashboard data:', error);
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
        Lab Dashboard - {user?.username || user?.first_name} 🔬
      </Typography>

      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Pending Tests" value={stats.pending} icon={<HourglassEmpty />} color="#ed6c02" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="In Progress" value={stats.inProgress} icon={<Science />} color="#1976d2" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Completed Today" value={stats.completedToday} icon={<CheckCircle />} color="#2e7d32" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="QC Tests Due" value={stats.qcDue} icon={<Assignment />} color="#9c27b0" />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" mb={2}>
                🔬 Pending Lab Orders
              </Typography>
              <List>
                {pendingTests.map((test, idx) => (
                  <ListItem key={idx} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, mb: 1 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: test.priority === 'Urgent' ? 'error.main' : 'primary.main' }}>
                        <Science />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={test.test}
                      secondary={`${test.patient} - Ordered by ${test.orderedBy}`}
                    />
                    <Chip
                      label={test.priority}
                      size="small"
                      color={test.priority === 'Urgent' ? 'error' : 'default'}
                    />
                  </ListItem>
                ))}
              </List>
              <Button fullWidth variant="contained" sx={{ mt: 2 }}>Process Next</Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" mb={2}>
                ⏱️ Tests In Progress
              </Typography>
              <List>
                {testsInProgress.map((test, idx) => (
                  <ListItem key={idx} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, mb: 1 }}>
                    <ListItemText
                      primary={test.test}
                      secondary={`${test.patient} - ETA: ${test.eta}`}
                    />
                  </ListItem>
                ))}
              </List>
              <Button fullWidth variant="outlined" sx={{ mt: 2 }}>View All</Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" mb={2}>🚀 Quick Actions</Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Button fullWidth variant="contained" startIcon={<Science />}>New Test</Button>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Button fullWidth variant="contained" color="success" startIcon={<CheckCircle />}>Enter Results</Button>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Button fullWidth variant="contained" color="secondary" startIcon={<Assignment />}>QC Tests</Button>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Button fullWidth variant="contained" color="info">Reports</Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default LabTechnicianDashboard;

