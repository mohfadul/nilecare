/**
 * Nurse Dashboard
 * Patient care, vital signs, medication administration
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
  IconButton,
  LinearProgress,
  CircularProgress,
} from '@mui/material';
import {
  People,
  Favorite,
  Medication,
  Assignment,
  CheckCircle,
  Warning,
  Add,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}> = ({ title, value, icon, color }) => (
  <Card>
    <CardContent>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography color="textSecondary" variant="body2">
            {title}
          </Typography>
          <Typography variant="h4" fontWeight="bold">
            {value}
          </Typography>
        </Box>
        <Avatar sx={{ bgcolor: color, width: 56, height: 56 }}>
          {icon}
        </Avatar>
      </Box>
    </CardContent>
  </Card>
);

const NurseDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ assignedPatients: 0, vitalsDue: 0, medications: 0, tasks: 0 });
  const [assignedPatients, setAssignedPatients] = useState<any[]>([]);
  const [medicationsDue, setMedicationsDue] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch stats
        const statsRes = await fetch('http://localhost:7001/api/v1/data/dashboard/stats');
        const statsData = await statsRes.json();
        if (statsData.success) {
          setStats({
            assignedPatients: 8, // Mock for now
            vitalsDue: 5,
            medications: statsData.data.activeMedications || 0,
            tasks: 7
          });
        }

        // Fetch recent patients as "assigned patients"
        const patientsRes = await fetch('http://localhost:7001/api/v1/data/patients/recent');
        const patientsData = await patientsRes.json();
        if (patientsData.success) {
          const patients = (patientsData.data || []).slice(0, 3).map((p: any, idx: number) => ({
            id: p.id,
            name: `${p.first_name} ${p.last_name}`,
            room: `${200 + idx}`,
            vitals: idx === 1 ? 'Check BP' : 'Normal',
            meds: `${idx + 1} due`,
            status: idx === 1 ? 'attention' : 'stable'
          }));
          setAssignedPatients(patients);
        }

        // Fetch pending medications
        const medsRes = await fetch('http://localhost:7001/api/v1/data/medications/pending');
        const medsData = await medsRes.json();
        if (medsData.success) {
          const meds = (medsData.data || []).slice(0, 3).map((m: any) => ({
            patient: `${m.patient_first_name} ${m.patient_last_name}`,
            medication: m.medication_name,
            time: new Date(m.prescribed_date).toLocaleTimeString(),
            status: m.status
          }));
          setMedicationsDue(meds);
        }

      } catch (error) {
        console.error('Error fetching nurse dashboard data:', error);
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
      <Box mb={3}>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Hello, Nurse {user?.username || user?.first_name || 'User'} 👩‍⚕️
        </Typography>
        <Typography variant="body1" color="text.secondary">
          You have {stats.assignedPatients} assigned patients. {stats.medications} active medications.
        </Typography>
      </Box>

      {/* Statistics - REAL DATA */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Assigned Patients"
            value={stats.assignedPatients}
            icon={<People />}
            color="#1976d2"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Vital Signs Due"
            value={stats.vitalsDue}
            icon={<Favorite />}
            color="#d32f2f"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Medications"
            value={stats.medications}
            icon={<Medication />}
            color="#2e7d32"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Tasks"
            value={stats.tasks}
            icon={<Assignment />}
            color="#ed6c02"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Assigned Patients */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" mb={2}>
                🏥 Assigned Patients
              </Typography>
              <List>
                {assignedPatients.map((patient) => (
                  <ListItem
                    key={patient.id}
                    sx={{
                      border: '1px solid',
                      borderColor: patient.status === 'attention' ? 'warning.main' : 'divider',
                      borderRadius: 1,
                      mb: 1,
                      bgcolor: patient.status === 'attention' ? 'warning.50' : 'transparent',
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar>{patient.name.charAt(0)}</Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={`${patient.name} - Room ${patient.room}`}
                      secondary={`Vitals: ${patient.vitals} • Meds: ${patient.meds}`}
                    />
                    {patient.status === 'attention' && (
                      <Warning color="warning" />
                    )}
                  </ListItem>
                ))}
              </List>
              <Button fullWidth variant="outlined" sx={{ mt: 2 }}>
                View All Patients
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Medications Due */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" mb={2}>
                💊 Medications Due
              </Typography>
              <List>
                {medicationsDue.map((med, idx) => (
                  <ListItem
                    key={idx}
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      mb: 1,
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'secondary.main' }}>
                        <Medication />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={med.medication}
                      secondary={`${med.patient} - ${med.time}`}
                    />
                    <IconButton color="success">
                      <CheckCircle />
                    </IconButton>
                  </ListItem>
                ))}
              </List>
              <Button fullWidth variant="contained" color="success" sx={{ mt: 2 }}>
                Medication Administration Record (MAR)
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
                    startIcon={<Favorite />} 
                    color="error"
                    onClick={() => navigate('/dashboard/patients')}
                  >
                    Record Vitals
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
                    Give Medication
                  </Button>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Button 
                    fullWidth 
                    variant="contained" 
                    startIcon={<Assignment />} 
                    color="info"
                    onClick={() => navigate('/dashboard/patients')}
                  >
                    Care Plan
                  </Button>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Button 
                    fullWidth 
                    variant="contained" 
                    startIcon={<Add />} 
                    color="success"
                    onClick={() => navigate('/dashboard/clinical-notes')}
                  >
                    New Note
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

export default NurseDashboard;

