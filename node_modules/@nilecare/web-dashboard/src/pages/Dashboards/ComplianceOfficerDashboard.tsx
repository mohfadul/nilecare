/**
 * Compliance Officer Dashboard
 * HIPAA compliance, audits, violations, regulatory reports
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  Security,
  Gavel,
  Description,
  Warning,
  CheckCircle,
  Assessment,
  Policy,
  VerifiedUser,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

interface ComplianceCardProps {
  title: string;
  value: string | number;
  status: 'compliant' | 'warning' | 'violation';
  icon: React.ReactNode;
  subtitle?: string;
}

const ComplianceCard: React.FC<ComplianceCardProps> = ({ title, value, status, icon, subtitle }) => {
  const getColor = () => {
    switch (status) {
      case 'compliant': return 'success.main';
      case 'warning': return 'warning.main';
      case 'violation': return 'error.main';
    }
  };

  return (
    <Card sx={{ height: '100%', borderLeft: 4, borderColor: getColor() }}>
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
              <Chip
                label={subtitle}
                size="small"
                color={status === 'compliant' ? 'success' : status === 'warning' ? 'warning' : 'error'}
                sx={{ mt: 1 }}
              />
            )}
          </Box>
          <Box sx={{ color: getColor() }}>{icon}</Box>
        </Box>
      </CardContent>
    </Card>
  );
};

const ComplianceOfficerDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [complianceStats, setComplianceStats] = useState({
    overallCompliance: 96,
    activeViolations: 2,
    pendingAudits: 3,
    completedTrainings: 98,
  });
  const [recentViolations, setRecentViolations] = useState<any[]>([]);
  const [upcomingAudits, setUpcomingAudits] = useState<any[]>([]);
  const [complianceAlerts, setComplianceAlerts] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Mock compliance data
      setRecentViolations([
        {
          id: 'VIOL-001',
          type: 'Access Control',
          severity: 'Medium',
          department: 'Emergency',
          date: '2025-10-10',
          status: 'Under Review',
          description: 'Unauthorized PHI access attempt'
        },
        {
          id: 'VIOL-002',
          type: 'Data Retention',
          severity: 'Low',
          department: 'Records',
          date: '2025-10-09',
          status: 'Remediated',
          description: 'Records retention policy not followed'
        },
      ]);

      setUpcomingAudits([
        { name: 'HIPAA Security Audit', date: '2025-10-20', department: 'IT', status: 'Scheduled' },
        { name: 'Access Control Review', date: '2025-10-22', department: 'All', status: 'Scheduled' },
        { name: 'PHI Disclosure Audit', date: '2025-10-25', department: 'Admin', status: 'Scheduled' },
      ]);

      setComplianceAlerts([
        { severity: 'warning', message: 'HIPAA training due for 5 staff members in Emergency department' },
        { severity: 'info', message: 'Annual compliance report due in 15 days' },
        { severity: 'success', message: 'All critical systems passed security scan' },
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
        ⚖️ Compliance Officer Dashboard
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Welcome, {user?.username || user?.email}! HIPAA compliance monitoring and regulatory oversight.
      </Typography>

      {/* Compliance Alerts */}
      <Box sx={{ mb: 3, mt: 2 }}>
        {complianceAlerts.map((alert, index) => (
          <Alert key={index} severity={alert.severity as any} sx={{ mb: 1 }}>
            {alert.message}
          </Alert>
        ))}
      </Box>

      {/* Compliance Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <ComplianceCard
            title="Overall Compliance"
            value={`${complianceStats.overallCompliance}%`}
            status="compliant"
            icon={<VerifiedUser sx={{ fontSize: 40 }} />}
            subtitle="Above Target"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <ComplianceCard
            title="Active Violations"
            value={complianceStats.activeViolations}
            status="warning"
            icon={<Warning sx={{ fontSize: 40 }} />}
            subtitle="Under Review"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <ComplianceCard
            title="Pending Audits"
            value={complianceStats.pendingAudits}
            status="warning"
            icon={<Assessment sx={{ fontSize: 40 }} />}
            subtitle="Scheduled"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <ComplianceCard
            title="Training Completion"
            value={`${complianceStats.completedTrainings}%`}
            status="compliant"
            icon={<CheckCircle sx={{ fontSize: 40 }} />}
            subtitle="On Track"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Compliance Actions */}
        <Grid item xs={12} md={6} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" mb={2}>
                🛡️ Compliance Actions
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<Security />}
                    onClick={() => alert('HIPAA Audit Dashboard - Coming soon!')}
                  >
                    HIPAA Audits
                  </Button>
                </Grid>
                <Grid item xs={12}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<Gavel />}
                    color="error"
                    onClick={() => alert('Violations Management - Coming soon!')}
                  >
                    Manage Violations
                  </Button>
                </Grid>
                <Grid item xs={12}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<Description />}
                    color="secondary"
                    onClick={() => alert('Compliance Reports - Coming soon!')}
                  >
                    Reports
                  </Button>
                </Grid>
                <Grid item xs={12}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<Policy />}
                    color="info"
                    onClick={() => alert('Policy Management - Coming soon!')}
                  >
                    Policies
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Violations */}
        <Grid item xs={12} md={6} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" mb={2}>
                ⚠️ Recent Compliance Violations
              </Typography>
              <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>ID</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Severity</TableCell>
                      <TableCell>Department</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentViolations.map((violation) => (
                      <TableRow key={violation.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            {violation.id}
                          </Typography>
                        </TableCell>
                        <TableCell>{violation.type}</TableCell>
                        <TableCell>
                          <Chip
                            label={violation.severity}
                            size="small"
                            color={
                              violation.severity === 'High' ? 'error' :
                              violation.severity === 'Medium' ? 'warning' : 'info'
                            }
                          />
                        </TableCell>
                        <TableCell>{violation.department}</TableCell>
                        <TableCell>{violation.date}</TableCell>
                        <TableCell>
                          <Chip
                            label={violation.status}
                            size="small"
                            color={violation.status === 'Remediated' ? 'success' : 'warning'}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Box mt={2}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => alert('Full violations report - Coming soon!')}
                >
                  View All Violations
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Upcoming Audits */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" mb={2}>
                📋 Upcoming Compliance Audits
              </Typography>
              <List>
                {upcomingAudits.map((audit, index) => (
                  <ListItem key={index} divider>
                    <ListItemText
                      primary={
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="body1" fontWeight="bold">
                            {audit.name}
                          </Typography>
                          <Chip label={audit.status} size="small" color="primary" />
                        </Box>
                      }
                      secondary={
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          📅 {audit.date} • 🏢 {audit.department}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ComplianceOfficerDashboard;

