/**
 * Appointment Form
 * Book or edit appointments
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
  Autocomplete,
} from '@mui/material';
import { Save, Cancel, EventAvailable, Schedule } from '@mui/icons-material';
import { apiClient } from '../../services/api.client';
import { appointmentApi } from '../../services/appointment.api';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../contexts/AuthContext';

interface AppointmentFormData {
  patientId: string;
  providerId: string;
  appointmentDate: string;
  appointmentTime: string;
  duration: number;
  reason: string;
  appointmentType: string;
}

const AppointmentForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuth();

  const isEditMode = !!id;

  const [formData, setFormData] = useState<AppointmentFormData>({
    patientId: '',
    providerId: user?.id || '',
    appointmentDate: new Date().toISOString().split('T')[0],
    appointmentTime: '09:00',
    duration: 30,
    reason: '',
    appointmentType: 'General Consultation',
  });

  const [patients, setPatients] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingAppointment, setLoadingAppointment] = useState(false);
  const [loadingLookups, setLoadingLookups] = useState(true);
  const [error, setError] = useState('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    loadLookupData();
  }, []);

  useEffect(() => {
    if (isEditMode) {
      loadAppointment();
    }
  }, [id]);

  const loadLookupData = async () => {
    try {
      setLoadingLookups(true);

      // Load patients and providers
      const [patientsResult, usersResult] = await Promise.all([
        apiClient.getPatients({ page: 1, limit: 100 }),
        apiClient.getUsers({ page: 1, limit: 100 }),
      ]);

      if (patientsResult.success && patientsResult.data) {
        const patientList = patientsResult.data.patients || patientsResult.data || [];
        setPatients(patientList);
      }

      if (usersResult.success && usersResult.data) {
        const userList = Array.isArray(usersResult.data) ? usersResult.data : [];
        const providerList = userList.filter((u: any) => 
          u.role === 'doctor' || u.role === 'physician' || u.role === 'nurse'
        );
        setProviders(providerList);
      }

    } catch (error) {
      console.error('Error loading lookup data:', error);
      enqueueSnackbar('Failed to load patients/providers', { variant: 'error' });
    } finally {
      setLoadingLookups(false);
    }
  };

  const loadAppointment = async () => {
    try {
      setLoadingAppointment(true);
      const result = await appointmentApi.getAppointmentById(id!);

      if (result.success && result.data) {
        const appointment = result.data;
        setFormData({
          patientId: appointment.patient_id || '',
          providerId: appointment.provider_id || '',
          appointmentDate: appointment.appointment_date?.split('T')[0] || '',
          appointmentTime: appointment.appointment_time || '09:00',
          duration: appointment.duration || 30,
          reason: appointment.reason || '',
          appointmentType: appointment.appointmentType || appointment.reason || 'General Consultation',
        });
      }
    } catch (err: any) {
      setError('Failed to load appointment data');
      enqueueSnackbar('Failed to load appointment', { variant: 'error' });
    } finally {
      setLoadingAppointment(false);
    }
  };

  const loadAvailableSlots = async () => {
    if (!formData.providerId || !formData.appointmentDate) {
      return;
    }

    try {
      setLoadingSlots(true);
      const result = await appointmentApi.getAvailableSlots(
        formData.providerId,
        formData.appointmentDate,
        formData.duration
      );

      if (result.success && result.data) {
        setAvailableSlots(result.data.availableSlots || []);
      }
    } catch (err: any) {
      console.error('Failed to load available slots:', err);
    } finally {
      setLoadingSlots(false);
    }
  };

  useEffect(() => {
    if (!isEditMode) {
      loadAvailableSlots();
    }
  }, [formData.providerId, formData.appointmentDate, formData.duration]);

  const handleChange = (field: keyof AppointmentFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  const handlePatientChange = (event: any, value: any) => {
    setFormData({ ...formData, patientId: value?.id || '' });
  };

  const handleProviderChange = (event: any, value: any) => {
    setFormData({ ...formData, providerId: value?.id || '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validation
      if (!formData.patientId || !formData.providerId) {
        throw new Error('Patient and Provider are required');
      }

      const payload = {
        patientId: formData.patientId,
        providerId: formData.providerId,
        appointmentDate: formData.appointmentDate,
        appointmentTime: formData.appointmentTime,
        duration: formData.duration,
        reason: formData.reason || formData.appointmentType,
      };

      let result;
      if (isEditMode) {
        result = await appointmentApi.updateAppointment(id!, payload);
      } else {
        result = await appointmentApi.createAppointment(payload);
      }

      if (result.success) {
        enqueueSnackbar(
          isEditMode ? 'Appointment updated successfully' : 'Appointment booked successfully',
          { variant: 'success' }
        );
        
        // Schedule reminders for new appointments
        if (!isEditMode && result.data?.id) {
          try {
            await appointmentApi.scheduleReminders(result.data.id);
            enqueueSnackbar('Reminders scheduled', { variant: 'info' });
          } catch (err) {
            console.error('Failed to schedule reminders:', err);
          }
        }
        
        navigate('/dashboard/appointments');
      } else {
        throw new Error(result.error?.message || 'Operation failed');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save appointment');
      enqueueSnackbar(err.response?.data?.error?.message || 'Failed to save appointment', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (loadingAppointment || loadingLookups) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const selectedPatient = patients.find((p) => p.id === formData.patientId);
  const selectedProvider = providers.find((p) => p.id === formData.providerId);

  return (
    <Box>
      {/* Header */}
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <EventAvailable sx={{ fontSize: 40, color: 'primary.main' }} />
        <Typography variant="h4" fontWeight="bold">
          {isEditMode ? 'Edit Appointment / تعديل الموعد' : 'Book Appointment / حجز موعد'}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Stack spacing={3}>
          {/* Appointment Details */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Appointment Details / تفاصيل الموعد
              </Typography>

              <Grid container spacing={2} mt={1}>
                {/* Patient Selection */}
                <Grid item xs={12} sm={6}>
                  <Autocomplete
                    options={patients}
                    getOptionLabel={(option) => `${option.firstName} ${option.lastName} (${option.id})`}
                    value={selectedPatient || null}
                    onChange={handlePatientChange}
                    disabled={loading}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        required
                        label="Patient / المريض"
                        placeholder="Search patient..."
                      />
                    )}
                  />
                </Grid>

                {/* Provider Selection */}
                <Grid item xs={12} sm={6}>
                  <Autocomplete
                    options={providers}
                    getOptionLabel={(option) => 
                      `${option.first_name} ${option.last_name} (${option.specialty || option.role})`
                    }
                    value={selectedProvider || null}
                    onChange={handleProviderChange}
                    disabled={loading}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        required
                        label="Provider / مقدم الرعاية"
                        placeholder="Search provider..."
                      />
                    )}
                  />
                </Grid>

                {/* Appointment Date */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    type="date"
                    label="Appointment Date / التاريخ"
                    value={formData.appointmentDate}
                    onChange={handleChange('appointmentDate')}
                    disabled={loading}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{
                      min: new Date().toISOString().split('T')[0],
                    }}
                  />
                </Grid>

                {/* Appointment Time */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    type="time"
                    label="Time / الوقت"
                    value={formData.appointmentTime}
                    onChange={handleChange('appointmentTime')}
                    disabled={loading}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                {/* Duration */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    select
                    label="Duration / المدة"
                    value={formData.duration}
                    onChange={handleChange('duration')}
                    disabled={loading}
                  >
                    <MenuItem value={15}>15 minutes</MenuItem>
                    <MenuItem value={30}>30 minutes</MenuItem>
                    <MenuItem value={45}>45 minutes</MenuItem>
                    <MenuItem value={60}>1 hour</MenuItem>
                    <MenuItem value={90}>1.5 hours</MenuItem>
                    <MenuItem value={120}>2 hours</MenuItem>
                  </TextField>
                </Grid>

                {/* Appointment Type */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    select
                    label="Appointment Type / نوع الموعد"
                    value={formData.appointmentType}
                    onChange={handleChange('appointmentType')}
                    disabled={loading}
                  >
                    <MenuItem value="General Consultation">General Consultation / استشارة عامة</MenuItem>
                    <MenuItem value="Follow-up">Follow-up / متابعة</MenuItem>
                    <MenuItem value="Emergency">Emergency / طوارئ</MenuItem>
                    <MenuItem value="Vaccination">Vaccination / تطعيم</MenuItem>
                    <MenuItem value="Physical Exam">Physical Exam / فحص طبي</MenuItem>
                    <MenuItem value="Laboratory">Laboratory / مختبر</MenuItem>
                    <MenuItem value="X-Ray">X-Ray / أشعة</MenuItem>
                    <MenuItem value="Surgery Consultation">Surgery Consultation / استشارة جراحية</MenuItem>
                  </TextField>
                </Grid>

                {/* Reason */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Reason for Visit / سبب الزيارة"
                    value={formData.reason}
                    onChange={handleChange('reason')}
                    disabled={loading}
                    placeholder="Describe the reason for this appointment..."
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
              onClick={() => navigate('/dashboard/appointments')}
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
                ? 'Update Appointment / تحديث'
                : 'Book Appointment / حجز'}
            </Button>
          </Box>
        </Stack>
      </form>
    </Box>
  );
};

export default AppointmentForm;

