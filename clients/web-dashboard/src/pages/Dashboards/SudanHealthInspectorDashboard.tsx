/**
 * Sudan Health Inspector Dashboard
 * Regulatory oversight for Sudan Ministry of Health
 * Facility inspections, compliance status, public health monitoring
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
  LinearProgress,
} from '@mui/material';
import {
  VerifiedUser,
  Assignment,
  Business,
  Assessment,
  LocalHospital,
  Report,
  Flag,
  CheckCircle,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

interface InspectionCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
  subtitle?: string;
}

const InspectionCard: React.FC<InspectionCardProps> = ({ title, value, icon, color = 'primary.main', subtitle }) => (
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
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        <Box sx={{ color }}>{icon}</Box>
      </Box>
    </CardContent>
  </Card>
);

const SudanHealthInspectorDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [inspectionStats, setInspectionStats] = useState({
    totalFacilities: 45,
    compliantFacilities: 38,
    pendingInspections: 7,
    criticalIssues: 3,
  });
  const [facilityInspections, setFacilityInspections] = useState<any[]>([]);
  const [criticalFindings, setCriticalFindings] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Mock inspection data for Sudan facilities
      setFacilityInspections([
        {
          facility: 'Khartoum Teaching Hospital',
          state: 'Khartoum',
          lastInspection: '2025-09-15',
          nextInspection: '2025-12-15',
          complianceScore: 92,
          status: 'Compliant',
          license: 'Active'
        },
        {
          facility: 'Omdurman General Hospital',
          state: 'Khartoum',
          lastInspection: '2025-08-20',
          nextInspection: '2025-11-20',
          complianceScore: 88,
          status: 'Compliant',
          license: 'Active'
        },
        {
          facility: 'Port Sudan Medical Center',
          state: 'Red Sea',
          lastInspection: '2025-07-10',
          nextInspection: '2025-10-10',
          complianceScore: 75,
          status: 'Warning',
          license: 'Conditional'
        },
        {
          facility: 'Kassala Regional Hospital',
          state: 'Kassala',
          lastInspection: '2025-09-01',
          nextInspection: '2026-01-01',
          complianceScore: 95,
          status: 'Compliant',
          license: 'Active'
        },
      ]);

      setCriticalFindings([
        {
          id: 'FIND-001',
          facility: 'Port Sudan Medical Center',
          issue: 'Sterilization equipment not properly maintained',
          severity: 'High',
          reportedDate: '2025-10-08',
          status: 'Action Required'
        },
        {
          id: 'FIND-002',
          facility: 'Nyala Central Hospital',
          issue: 'Staff infection control training incomplete',
          severity: 'Medium',
          reportedDate: '2025-10-07',
          status: 'Under Review'
        },
        {
          id: 'FIND-003',
          facility: 'Gedaref Health Center',
          issue: 'Medical waste disposal procedures not followed',
          severity: 'High',
          reportedDate: '2025-10-06',
          status: 'Corrective Action Plan Submitted'
        },
      ]);

      setAlerts([
        { severity: 'warning', message: '7 facilities due for inspection within 30 days' },
        { severity: 'info', message: 'New Sudan Ministry of Health guidelines published - facility notification required' },
        { severity: 'error', message: '3 critical findings require immediate follow-up' },
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

  const compliancePercentage = Math.round((inspectionStats.compliantFacilities / inspectionStats.totalFacilities) * 100);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        🇸🇩 Sudan Health Inspector Dashboard
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Welcome, {user?.username || user?.email}! Sudan Ministry of Health regulatory oversight.
      </Typography>

      {/* Alerts */}
      <Box sx={{ mb: 3, mt: 2 }}>
        {alerts.map((alert, index) => (
          <Alert key={index} severity={alert.severity as any} sx={{ mb: 1 }}>
            {alert.message}
          </Alert>
        ))}
      </Box>

      {/* Inspection Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <InspectionCard
            title="Total Healthcare Facilities"
            value={inspectionStats.totalFacilities}
            icon={<LocalHospital sx={{ fontSize: 40 }} />}
            subtitle="Across Sudan"
            color="primary.main"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <InspectionCard
            title="Compliant Facilities"
            value={inspectionStats.compliantFacilities}
            icon={<CheckCircle sx={{ fontSize: 40 }} />}
            subtitle={`${compliancePercentage}% compliance rate`}
            color="success.main"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <InspectionCard
            title="Pending Inspections"
            value={inspectionStats.pendingInspections}
            icon={<Assignment sx={{ fontSize: 40 }} />}
            subtitle="Next 30 days"
            color="warning.main"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <InspectionCard
            title="Critical Issues"
            value={inspectionStats.criticalIssues}
            icon={<Report sx={{ fontSize: 40 }} />}
            subtitle="Require action"
            color="error.main"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Inspector Actions */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" mb={2}>
                🔍 Inspector Actions
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<Assignment />}
                    onClick={() => alert('Schedule Inspection - Coming soon!')}
                  >
                    Schedule Inspection
                  </Button>
                </Grid>
                <Grid item xs={12}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<Business />}
                    color="secondary"
                    onClick={() => alert('Facility Directory - Coming soon!')}
                  >
                    Facility Directory
                  </Button>
                </Grid>
                <Grid item xs={12}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<Report />}
                    color="error"
                    onClick={() => alert('Violations Report - Coming soon!')}
                  >
                    Critical Findings
                  </Button>
                </Grid>
                <Grid item xs={12}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<Assessment />}
                    color="info"
                    onClick={() => alert('Compliance Reports - Coming soon!')}
                  >
                    Reports
                  </Button>
                </Grid>
                <Grid item xs={12}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<Flag />}
                    color="success"
                    onClick={() => alert('Sudan MOH Guidelines - Coming soon!')}
                  >
                    MOH Guidelines
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Facility Inspections */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" mb={2}>
                🏥 Healthcare Facility Inspections
              </Typography>
              <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Facility</TableCell>
                      <TableCell>State</TableCell>
                      <TableCell>Compliance</TableCell>
                      <TableCell>Last Inspection</TableCell>
                      <TableCell>Next Inspection</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {facilityInspections.map((facility, index) => (
                      <TableRow key={index} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            {facility.facility}
                          </Typography>
                        </TableCell>
                        <TableCell>{facility.state}</TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="caption" fontWeight="bold">
                              {facility.complianceScore}%
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={facility.complianceScore}
                              sx={{ mt: 0.5, height: 6, borderRadius: 1 }}
                              color={
                                facility.complianceScore >= 90 ? 'success' :
                                facility.complianceScore >= 75 ? 'warning' : 'error'
                              }
                            />
                          </Box>
                        </TableCell>
                        <TableCell>{facility.lastInspection}</TableCell>
                        <TableCell>{facility.nextInspection}</TableCell>
                        <TableCell>
                          <Chip
                            label={facility.status}
                            size="small"
                            color={facility.status === 'Compliant' ? 'success' : 'warning'}
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
                  onClick={() => alert('View all facilities - Coming soon!')}
                >
                  View All Facilities
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Critical Findings */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" mb={2}>
                ⚠️ Critical Inspection Findings
              </Typography>
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Finding ID</TableCell>
                      <TableCell>Facility</TableCell>
                      <TableCell>Issue</TableCell>
                      <TableCell>Severity</TableCell>
                      <TableCell>Reported Date</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {criticalFindings.map((finding) => (
                      <TableRow key={finding.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            {finding.id}
                          </Typography>
                        </TableCell>
                        <TableCell>{finding.facility}</TableCell>
                        <TableCell>{finding.issue}</TableCell>
                        <TableCell>
                          <Chip
                            label={finding.severity}
                            size="small"
                            color={finding.severity === 'High' ? 'error' : 'warning'}
                          />
                        </TableCell>
                        <TableCell>{finding.reportedDate}</TableCell>
                        <TableCell>
                          <Chip
                            label={finding.status}
                            size="small"
                            color={finding.status.includes('Submitted') ? 'info' : 'warning'}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SudanHealthInspectorDashboard;

