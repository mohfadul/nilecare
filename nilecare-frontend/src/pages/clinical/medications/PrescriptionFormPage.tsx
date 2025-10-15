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
  Alert,
} from '@mui/material';
import { ArrowBack, Save } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateMedication } from '../../../hooks/useMedications';
import { CreateMedicationRequest } from '../../../api/medications.api';
import { authStore } from '../../../store/authStore';

const medicationSchema = z.object({
  patientId: z.number().min(1, 'Patient is required'),
  medicationName: z.string().min(2, 'Medication name is required'),
  dosage: z.string().min(1, 'Dosage is required'),
  frequency: z.string().min(1, 'Frequency is required'),
  route: z.enum(['oral', 'intravenous', 'intramuscular', 'subcutaneous', 'topical', 'inhalation', 'other']),
  duration: z.string().optional(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional(),
  instructions: z.string().optional(),
  reason: z.string().optional(),
});

type MedicationFormData = z.infer<typeof medicationSchema>;

export function PrescriptionFormPage() {
  const navigate = useNavigate();
  const user = authStore((state) => state.user);
  const createMedication = useCreateMedication();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<MedicationFormData>({
    resolver: zodResolver(medicationSchema),
    defaultValues: {
      patientId: 1,
      medicationName: '',
      dosage: '',
      frequency: '',
      route: 'oral',
      duration: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      instructions: '',
      reason: '',
    },
  });

  const onSubmit = async (data: MedicationFormData) => {
    try {
      const requestData: CreateMedicationRequest = {
        patientId: data.patientId,
        prescribedBy: user?.id || 1,
        medicationName: data.medicationName,
        dosage: data.dosage,
        frequency: data.frequency,
        route: data.route,
        duration: data.duration || undefined,
        startDate: data.startDate,
        endDate: data.endDate || undefined,
        instructions: data.instructions || undefined,
        reason: data.reason || undefined,
      };

      await createMedication.mutateAsync(requestData);
      navigate('/clinical/medications');
    } catch (error) {
      console.error('Failed to prescribe medication:', error);
    }
  };

  return (
    <Container maxWidth="md">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/clinical/medications')}>
          Back to Medications
        </Button>
      </Box>

      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>
          Prescribe Medication
        </Typography>

        {createMedication.error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            Failed to prescribe medication. Please try again.
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
                    helperText={errors.patientId?.message}
                  >
                    <MenuItem value={1}>John Doe - MRN: 1001</MenuItem>
                    <MenuItem value={2}>Jane Smith - MRN: 1002</MenuItem>
                    <MenuItem value={3}>Ahmed Mohamed - MRN: 1003</MenuItem>
                  </TextField>
                )}
              />
            </Grid>

            {/* Medication Details */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Medication Details
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="medicationName"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Medication Name"
                    fullWidth
                    required
                    error={!!errors.medicationName}
                    helperText={errors.medicationName?.message}
                    placeholder="e.g., Metformin, Lisinopril, Amoxicillin"
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="dosage"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Dosage"
                    fullWidth
                    required
                    error={!!errors.dosage}
                    helperText={errors.dosage?.message}
                    placeholder="e.g., 500mg, 10mg, 2 tablets"
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="frequency"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Frequency"
                    fullWidth
                    required
                    error={!!errors.frequency}
                    helperText={errors.frequency?.message}
                    placeholder="e.g., twice daily, every 8 hours"
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="route"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Route of Administration"
                    select
                    fullWidth
                    required
                    error={!!errors.route}
                    helperText={errors.route?.message}
                  >
                    <MenuItem value="oral">Oral</MenuItem>
                    <MenuItem value="intravenous">Intravenous (IV)</MenuItem>
                    <MenuItem value="intramuscular">Intramuscular (IM)</MenuItem>
                    <MenuItem value="subcutaneous">Subcutaneous (SC)</MenuItem>
                    <MenuItem value="topical">Topical</MenuItem>
                    <MenuItem value="inhalation">Inhalation</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
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
                    fullWidth
                    helperText="e.g., 7 days, 2 weeks, ongoing"
                  />
                )}
              />
            </Grid>

            {/* Dates */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="startDate"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Start Date"
                    type="date"
                    fullWidth
                    required
                    InputLabelProps={{ shrink: true }}
                    error={!!errors.startDate}
                    helperText={errors.startDate?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="endDate"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="End Date (Optional)"
                    type="date"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    helperText="Leave blank for ongoing medication"
                  />
                )}
              />
            </Grid>

            {/* Instructions */}
            <Grid item xs={12}>
              <Controller
                name="reason"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Reason for Prescription"
                    fullWidth
                    placeholder="e.g., Type 2 Diabetes, Hypertension, Infection"
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="instructions"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Instructions for Patient"
                    fullWidth
                    multiline
                    rows={3}
                    placeholder="e.g., Take with food, Avoid alcohol, Complete full course"
                  />
                )}
              />
            </Grid>

            {/* Action Buttons */}
            <Grid item xs={12}>
              <Box display="flex" gap={2} justifyContent="flex-end" sx={{ mt: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/clinical/medications')}
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
                  {isSubmitting ? 'Prescribing...' : 'Prescribe Medication'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
}

