import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Grid,
  TextField,
  MenuItem,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import { ArrowBack, Save, AccessTime } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateAppointment } from '../../hooks/useAppointments';
import { useAvailableSlots } from '../../hooks/useAppointments';
import { CreateAppointmentRequest } from '../../api/appointments.api';

const appointmentSchema = z.object({
  patientId: z.number().min(1, 'Patient is required'),
  providerId: z.number().min(1, 'Provider is required'),
  appointmentDate: z.string().min(1, 'Date is required'),
  appointmentTime: z.string().min(1, 'Time is required'),
  duration: z.number().min(15, 'Duration must be at least 15 minutes'),
  reason: z.string().min(5, 'Reason must be at least 5 characters'),
  notes: z.string().optional(),
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

export function AppointmentBookingPage() {
  const navigate = useNavigate();
  const createAppointment = useCreateAppointment();
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<number | undefined>();

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      patientId: 1, // Default patient - should be selected by user
      providerId: 1, // Default provider - should be selected by user
      appointmentDate: '',
      appointmentTime: '',
      duration: 30,
      reason: '',
      notes: '',
    },
  });

  const watchProviderId = watch('providerId');
  const watchDate = watch('appointmentDate');
  const watchDuration = watch('duration');

  // Fetch available slots when provider, date, and duration are selected
  const { data: slotsData, isLoading: slotsLoading } = useAvailableSlots({
    providerId: watchProviderId,
    date: watchDate,
    duration: watchDuration,
  });

  const onSubmit = async (data: AppointmentFormData) => {
    try {
      const requestData: CreateAppointmentRequest = {
        patientId: data.patientId,
        providerId: data.providerId,
        appointmentDate: data.appointmentDate,
        appointmentTime: data.appointmentTime,
        duration: data.duration,
        reason: data.reason,
        notes: data.notes || undefined,
      };

      await createAppointment.mutateAsync(requestData);
      navigate('/appointments');
    } catch (error) {
      console.error('Failed to book appointment:', error);
    }
  };

  const availableSlots = slotsData?.data?.availableSlots || [];

  return (
    <Container maxWidth="md">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/appointments')}>
          Back to Appointments
        </Button>
      </Box>

      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>
          Book New Appointment
        </Typography>

        {createAppointment.error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            Failed to book appointment. Please try again.
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 3 }}>
          <Grid container spacing={3}>
            {/* Patient Selection */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Patient Information
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="patientId"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Patient"
                    select
                    fullWidth
                    required
                    error={!!errors.patientId}
                    helperText={errors.patientId?.message || 'Select the patient for this appointment'}
                  >
                    <MenuItem value={1}>John Doe - ID: 1</MenuItem>
                    <MenuItem value={2}>Jane Smith - ID: 2</MenuItem>
                    <MenuItem value={3}>Ahmed Mohamed - ID: 3</MenuItem>
                    {/* Add more patients from API */}
                  </TextField>
                )}
              />
            </Grid>

            {/* Provider Selection */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Provider & Schedule
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="providerId"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Provider"
                    select
                    fullWidth
                    required
                    error={!!errors.providerId}
                    helperText={errors.providerId?.message || 'Select a doctor'}
                  >
                    <MenuItem value={1}>Dr. Ahmed Hassan - Cardiology</MenuItem>
                    <MenuItem value={2}>Dr. Fatima Ali - Pediatrics</MenuItem>
                    <MenuItem value={3}>Dr. Mohamed Ibrahim - General Practice</MenuItem>
                    {/* Add more providers from API */}
                  </TextField>
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="duration"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Duration"
                    select
                    fullWidth
                    required
                    error={!!errors.duration}
                    helperText={errors.duration?.message}
                  >
                    <MenuItem value={15}>15 minutes</MenuItem>
                    <MenuItem value={30}>30 minutes</MenuItem>
                    <MenuItem value={45}>45 minutes</MenuItem>
                    <MenuItem value={60}>1 hour</MenuItem>
                  </TextField>
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="appointmentDate"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Appointment Date"
                    type="date"
                    fullWidth
                    required
                    InputLabelProps={{ shrink: true }}
                    error={!!errors.appointmentDate}
                    helperText={errors.appointmentDate?.message}
                    inputProps={{
                      min: new Date().toISOString().split('T')[0], // Today or later
                    }}
                  />
                )}
              />
            </Grid>

            {/* Available Time Slots */}
            {watchDate && watchProviderId && (
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  <AccessTime fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                  Available Time Slots
                </Typography>

                {slotsLoading ? (
                  <Box display="flex" justifyContent="center" py={2}>
                    <CircularProgress size={24} />
                  </Box>
                ) : availableSlots.length > 0 ? (
                  <Controller
                    name="appointmentTime"
                    control={control}
                    render={({ field }) => (
                      <Box display="flex" flexWrap="wrap" gap={1}>
                        {availableSlots.map((slot) => (
                          <Chip
                            key={slot}
                            label={slot}
                            onClick={() => field.onChange(slot)}
                            color={field.value === slot ? 'primary' : 'default'}
                            variant={field.value === slot ? 'filled' : 'outlined'}
                            clickable
                          />
                        ))}
                      </Box>
                    )}
                  />
                ) : (
                  <Alert severity="info">
                    No available slots for the selected date. Please choose a different date.
                  </Alert>
                )}

                {errors.appointmentTime && (
                  <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                    {errors.appointmentTime.message}
                  </Typography>
                )}
              </Grid>
            )}

            {/* Appointment Details */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Appointment Details
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="reason"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Reason for Visit"
                    fullWidth
                    required
                    multiline
                    rows={2}
                    error={!!errors.reason}
                    helperText={errors.reason?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="notes"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Additional Notes (Optional)"
                    fullWidth
                    multiline
                    rows={3}
                    helperText="Any additional information for the provider"
                  />
                )}
              />
            </Grid>

            {/* Action Buttons */}
            <Grid item xs={12}>
              <Box display="flex" gap={2} justifyContent="flex-end" sx={{ mt: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/appointments')}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<Save />}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Booking...' : 'Book Appointment'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
}

