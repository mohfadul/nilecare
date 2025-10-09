/**
 * Patient Form
 * Create or edit patient information
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Grid,
  MenuItem,
  Alert,
  CircularProgress,
  Stack,
} from '@mui/material';
import { Save, Cancel, Person } from '@mui/icons-material';
import { apiClient } from '../../services/api.client';
import { useSnackbar } from 'notistack';

interface PatientFormData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  phoneNumber: string;
  email: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  emergencyContact: {
    name: string;
    relationship: string;
    phoneNumber: string;
  };
  allergies: string;
  medicalHistory: string;
}

const SUDAN_STATES = [
  'Khartoum', 'North Kordofan', 'South Kordofan', 'Blue Nile', 'White Nile',
  'Gezira', 'Kassala', 'Red Sea', 'Northern', 'River Nile', 'Gedaref',
  'Sennar', 'West Kordofan', 'West Darfur', 'South Darfur', 'North Darfur',
  'East Darfur', 'Central Darfur',
];

const PatientForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { enqueueSnackbar } = useSnackbar();

  const isEditMode = !!id;

  const [formData, setFormData] = useState<PatientFormData>({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    phoneNumber: '',
    email: '',
    address: {
      street: '',
      city: '',
      state: 'Khartoum',
      zipCode: '',
      country: 'Sudan',
    },
    emergencyContact: {
      name: '',
      relationship: '',
      phoneNumber: '',
    },
    allergies: '',
    medicalHistory: '',
  });

  const [loading, setLoading] = useState(false);
  const [loadingPatient, setLoadingPatient] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEditMode) {
      loadPatient();
    }
  }, [id]);

  const loadPatient = async () => {
    try {
      setLoadingPatient(true);
      const result = await apiClient.getPatient(id!);
      
      if (result.success && result.data) {
        const patient = result.data;
        setFormData({
          firstName: patient.firstName || '',
          lastName: patient.lastName || '',
          dateOfBirth: patient.dateOfBirth?.split('T')[0] || '',
          gender: patient.gender || '',
          phoneNumber: patient.phoneNumber || '',
          email: patient.email || '',
          address: patient.address || formData.address,
          emergencyContact: patient.emergencyContact || formData.emergencyContact,
          allergies: patient.allergies?.join(', ') || '',
          medicalHistory: patient.medicalHistory?.join(', ') || '',
        });
      }
    } catch (err: any) {
      setError('Failed to load patient data');
      enqueueSnackbar('Failed to load patient', { variant: 'error' });
    } finally {
      setLoadingPatient(false);
    }
  };

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const keys = field.split('.');
    if (keys.length === 1) {
      setFormData({ ...formData, [field]: e.target.value });
    } else {
      setFormData({
        ...formData,
        [keys[0]]: {
          ...(formData as any)[keys[0]],
          [keys[1]]: e.target.value,
        },
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        phoneNumber: formData.phoneNumber,
        email: formData.email || undefined,
        address: formData.address,
        emergencyContact: formData.emergencyContact,
        allergies: formData.allergies ? formData.allergies.split(',').map(s => s.trim()) : [],
        medicalHistory: formData.medicalHistory ? formData.medicalHistory.split(',').map(s => s.trim()) : [],
      };

      let result;
      if (isEditMode) {
        result = await apiClient.updatePatient(id!, payload);
      } else {
        result = await apiClient.createPatient(payload);
      }

      if (result.success) {
        enqueueSnackbar(
          isEditMode ? 'Patient updated successfully' : 'Patient created successfully',
          { variant: 'success' }
        );
        navigate('/dashboard/patients');
      } else {
        throw new Error(result.error?.message || 'Operation failed');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save patient');
      enqueueSnackbar('Failed to save patient', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (loadingPatient) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Person sx={{ fontSize: 40, color: 'primary.main' }} />
        <Typography variant="h4" fontWeight="bold">
          {isEditMode ? 'Edit Patient / تعديل المريض' : 'New Patient / مريض جديد'}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Stack spacing={3}>
          {/* Personal Information */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Personal Information / المعلومات الشخصية
              </Typography>

              <Grid container spacing={2} mt={1}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    label="First Name / الاسم الأول"
                    value={formData.firstName}
                    onChange={handleChange('firstName')}
                    disabled={loading}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    label="Last Name / اسم العائلة"
                    value={formData.lastName}
                    onChange={handleChange('lastName')}
                    disabled={loading}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    type="date"
                    label="Date of Birth / تاريخ الميلاد"
                    value={formData.dateOfBirth}
                    onChange={handleChange('dateOfBirth')}
                    disabled={loading}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    select
                    label="Gender / الجنس"
                    value={formData.gender}
                    onChange={handleChange('gender')}
                    disabled={loading}
                  >
                    <MenuItem value="male">Male / ذكر</MenuItem>
                    <MenuItem value="female">Female / أنثى</MenuItem>
                    <MenuItem value="other">Other / آخر</MenuItem>
                    <MenuItem value="unknown">Unknown / غير معروف</MenuItem>
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    label="Phone Number / رقم الهاتف"
                    value={formData.phoneNumber}
                    onChange={handleChange('phoneNumber')}
                    disabled={loading}
                    placeholder="+249..."
                    helperText="Sudan format: +249XXXXXXXXX"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="email"
                    label="Email / البريد الإلكتروني"
                    value={formData.email}
                    onChange={handleChange('email')}
                    disabled={loading}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Address Information */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Address / العنوان
              </Typography>

              <Grid container spacing={2} mt={1}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Street Address / عنوان الشارع"
                    value={formData.address.street}
                    onChange={handleChange('address.street')}
                    disabled={loading}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="City / المدينة"
                    value={formData.address.city}
                    onChange={handleChange('address.city')}
                    disabled={loading}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    label="State / الولاية"
                    value={formData.address.state}
                    onChange={handleChange('address.state')}
                    disabled={loading}
                  >
                    {SUDAN_STATES.map((state) => (
                      <MenuItem key={state} value={state}>
                        {state}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Postal Code / الرمز البريدي"
                    value={formData.address.zipCode}
                    onChange={handleChange('address.zipCode')}
                    disabled={loading}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Country / البلد"
                    value={formData.address.country}
                    onChange={handleChange('address.country')}
                    disabled={loading}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Emergency Contact / جهة الاتصال في حالات الطوارئ
              </Typography>

              <Grid container spacing={2} mt={1}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Contact Name / الاسم"
                    value={formData.emergencyContact.name}
                    onChange={handleChange('emergencyContact.name')}
                    disabled={loading}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Relationship / العلاقة"
                    value={formData.emergencyContact.relationship}
                    onChange={handleChange('emergencyContact.relationship')}
                    disabled={loading}
                    placeholder="e.g., Spouse, Parent, Sibling"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Emergency Phone / هاتف الطوارئ"
                    value={formData.emergencyContact.phoneNumber}
                    onChange={handleChange('emergencyContact.phoneNumber')}
                    disabled={loading}
                    placeholder="+249..."
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Medical Information */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Medical Information / المعلومات الطبية
              </Typography>

              <Grid container spacing={2} mt={1}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Allergies / الحساسية"
                    value={formData.allergies}
                    onChange={handleChange('allergies')}
                    disabled={loading}
                    placeholder="Separate multiple allergies with commas"
                    helperText="e.g., Penicillin, Peanuts, Latex"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Medical History / التاريخ الطبي"
                    value={formData.medicalHistory}
                    onChange={handleChange('medicalHistory')}
                    disabled={loading}
                    placeholder="Separate multiple conditions with commas"
                    helperText="e.g., Diabetes, Hypertension, Asthma"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <Box display="flex" gap={2} justifyContent="flex-end">
            <Button
              variant="outlined"
              startIcon={<Cancel />}
              onClick={() => navigate('/dashboard/patients')}
              disabled={loading}
              size="large"
            >
              Cancel / إلغاء
            </Button>

            <Button
              type="submit"
              variant="contained"
              startIcon={loading ? <CircularProgress size={20} /> : <Save />}
              disabled={loading}
              size="large"
            >
              {loading
                ? 'Saving...'
                : isEditMode
                ? 'Update Patient / تحديث'
                : 'Create Patient / إنشاء'}
            </Button>
          </Box>
        </Stack>
      </form>
    </Box>
  );
};

export default PatientForm;

