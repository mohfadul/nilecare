import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Button,
  Grid,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { Edit, ArrowBack, Person, Phone, Email, CalendarToday, LocationOn, Bloodtype } from '@mui/icons-material';
import { usePatient } from '../../hooks/usePatients';
import { format } from 'date-fns';
import { VitalSignsMonitor } from '../../components/clinical/VitalSignsMonitor';

export function PatientDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, error } = usePatient(id ? parseInt(id) : undefined);

  if (isLoading) {
    return (
      <Container maxWidth="lg">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error || !data?.success) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error">Failed to load patient details.</Alert>
        <Button onClick={() => navigate('/patients')} sx={{ mt: 2 }}>
          Back to Patients
        </Button>
      </Container>
    );
  }

  const patient = data.data?.patient;

  if (!patient) {
    return (
      <Container maxWidth="lg">
        <Alert severity="warning">Patient not found.</Alert>
        <Button onClick={() => navigate('/patients')} sx={{ mt: 2 }}>
          Back to Patients
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/patients')}>
          Back to Patients
        </Button>
        <Button
          variant="contained"
          startIcon={<Edit />}
          onClick={() => navigate(`/patients/${id}/edit`)}
        >
          Edit Patient
        </Button>
      </Box>

      {/* Patient Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <Person sx={{ fontSize: 60, color: 'primary.main', mr: 2 }} />
          <Box>
            <Typography variant="h4">
              {patient.firstName} {patient.lastName}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Patient ID: {patient.id}
            </Typography>
          </Box>
        </Box>

        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Box display="flex" alignItems="center">
              <Email sx={{ mr: 1, color: 'action.active' }} />
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Email
                </Typography>
                <Typography variant="body2">{patient.email}</Typography>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Box display="flex" alignItems="center">
              <Phone sx={{ mr: 1, color: 'action.active' }} />
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Phone
                </Typography>
                <Typography variant="body2">{patient.phone}</Typography>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Box display="flex" alignItems="center">
              <CalendarToday sx={{ mr: 1, color: 'action.active' }} />
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Date of Birth
                </Typography>
                <Typography variant="body2">
                  {patient.dateOfBirth ? format(new Date(patient.dateOfBirth), 'MMM dd, yyyy') : '-'}
                </Typography>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Box display="flex" alignItems="center">
              <Person sx={{ mr: 1, color: 'action.active' }} />
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Gender
                </Typography>
                <Typography variant="body2">
                  <Chip label={patient.gender} size="small" />
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* ✅ PHASE 7: Real-Time Vital Signs Monitor */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12}>
          <VitalSignsMonitor patientId={id || ''} />
        </Grid>
      </Grid>

      {/* Demographic Information */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Demographic Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <List disablePadding>
              <ListItem disablePadding sx={{ mb: 2 }}>
                <ListItemText
                  primary="National ID"
                  secondary={patient.nationalId}
                  primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                  secondaryTypographyProps={{ variant: 'body1' }}
                />
              </ListItem>

              <ListItem disablePadding sx={{ mb: 2 }}>
                <ListItemText
                  primary={<Box display="flex" alignItems="center"><LocationOn fontSize="small" sx={{ mr: 0.5 }} /> Address</Box>}
                  secondary={`${patient.address}, ${patient.city}, ${patient.country}`}
                  primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                  secondaryTypographyProps={{ variant: 'body1' }}
                />
              </ListItem>

              {patient.bloodType && (
                <ListItem disablePadding sx={{ mb: 2 }}>
                  <ListItemText
                    primary={<Box display="flex" alignItems="center"><Bloodtype fontSize="small" sx={{ mr: 0.5 }} /> Blood Type</Box>}
                    secondary={patient.bloodType}
                    primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                    secondaryTypographyProps={{ variant: 'body1' }}
                  />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Emergency Contact
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {patient.emergencyContact ? (
              <List disablePadding>
                <ListItem disablePadding sx={{ mb: 2 }}>
                  <ListItemText
                    primary="Name"
                    secondary={patient.emergencyContact.name}
                    primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                    secondaryTypographyProps={{ variant: 'body1' }}
                  />
                </ListItem>
                <ListItem disablePadding sx={{ mb: 2 }}>
                  <ListItemText
                    primary="Phone"
                    secondary={patient.emergencyContact.phone}
                    primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                    secondaryTypographyProps={{ variant: 'body1' }}
                  />
                </ListItem>
                <ListItem disablePadding sx={{ mb: 2 }}>
                  <ListItemText
                    primary="Relationship"
                    secondary={patient.emergencyContact.relationship}
                    primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                    secondaryTypographyProps={{ variant: 'body1' }}
                  />
                </ListItem>
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No emergency contact information
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Medical Information */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Allergies
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {patient.allergies && patient.allergies.length > 0 ? (
              <Box display="flex" flexWrap="wrap" gap={1}>
                {patient.allergies.map((allergy, index) => (
                  <Chip key={index} label={allergy} color="error" variant="outlined" />
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No known allergies
              </Typography>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Medical History
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {patient.medicalHistory && patient.medicalHistory.length > 0 ? (
              <Box display="flex" flexWrap="wrap" gap={1}>
                {patient.medicalHistory.map((condition, index) => (
                  <Chip key={index} label={condition} variant="outlined" />
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No medical history recorded
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Metadata */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Record Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  Created At
                </Typography>
                <Typography variant="body2">
                  {patient.createdAt ? format(new Date(patient.createdAt), 'PPpp') : '-'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  Last Updated
                </Typography>
                <Typography variant="body2">
                  {patient.updatedAt ? format(new Date(patient.updatedAt), 'PPpp') : '-'}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

