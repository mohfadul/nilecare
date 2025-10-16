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
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { ArrowBack, Save, Warning } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { useCreateMedication } from '../../../hooks/useMedications';
import { CreateMedicationRequest } from '../../../api/medications.api';
import { authStore } from '../../../store/authStore';
import { cdsService } from '../../../services/cds.service';
import { DrugInteractionAlert } from '../../../components/clinical/DrugInteractionAlert';

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
  
  // ✅ PHASE 7: CDS Integration State
  const [selectedPatientId, setSelectedPatientId] = useState<number>(1);
  const [selectedMedication, setSelectedMedication] = useState<string>('');
  const [selectedDosage, setSelectedDosage] = useState<string>('');
  const [showOverrideDialog, setShowOverrideDialog] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');

  const {
    control,
    handleSubmit,
    watch,
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
  
  // Watch form fields for CDS check
  const watchedPatientId = watch('patientId');
  const watchedMedication = watch('medicationName');
  const watchedDosage = watch('dosage');
  const watchedFrequency = watch('frequency');
  
  // ✅ PHASE 7: CDS Check Query
  const { data: cdsCheck, isLoading: checkingCDS } = useQuery({
    queryKey: ['cds-check', watchedPatientId, watchedMedication, watchedDosage],
    queryFn: () => cdsService.checkPrescription({
      patientId: watchedPatientId?.toString() || '',
      drugName: watchedMedication,
      dose: watchedDosage,
      frequency: watchedFrequency
    }),
    enabled: !!watchedMedication && !!watchedDosage && watchedMedication.length > 2,
    retry: 1
  });
  
  // Check if there are critical interactions
  const hasCriticalInteraction = cdsCheck?.data?.interactions?.some(
    (i) => i.severity === 'critical'
  ) || false;

  const onSubmit = async (data: MedicationFormData) => {
    // ✅ PHASE 7: Check for critical interactions before submitting
    if (hasCriticalInteraction && !overrideReason) {
      setShowOverrideDialog(true);
      return;
    }
    
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
      
      // Log override if critical interaction was bypassed
      if (hasCriticalInteraction && overrideReason) {
        console.log('Critical interaction overridden:', { overrideReason, interactions: cdsCheck?.data?.interactions });
      }
      
      navigate('/clinical/medications');
    } catch (error) {
      console.error('Failed to prescribe medication:', error);
    }
  };
  
  const handleOverrideConfirm = () => {
    if (overrideReason.trim()) {
      setShowOverrideDialog(false);
      // Re-submit the form with override
      handleSubmit(onSubmit)();
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
                    InputProps={{
                      endAdornment: checkingCDS && <CircularProgress size={20} />
                    }}
                  />
                )}
              />
              {checkingCDS && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Checking for drug interactions...
                </Typography>
              )}
            </Grid>
            
            {/* ✅ PHASE 7: CDS Drug Interaction Warnings */}
            {cdsCheck?.data?.interactions && cdsCheck.data.interactions.length > 0 && (
              <Grid item xs={12}>
                <Box sx={{ mt: 1 }}>
                  <Typography variant="h6" color="error" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Warning /> Drug Interaction Warnings ({cdsCheck.data.interactions.length})
                  </Typography>
                  {cdsCheck.data.interactions.map((interaction, index) => (
                    <DrugInteractionAlert key={index} interaction={interaction} />
                  ))}
                </Box>
              </Grid>
            )}

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
                  color={hasCriticalInteraction ? 'error' : 'primary'}
                >
                  {isSubmitting ? 'Prescribing...' : hasCriticalInteraction ? 'Prescribe (Override Required)' : 'Prescribe Medication'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
      
      {/* ✅ PHASE 7: Override Dialog for Critical Interactions */}
      <Dialog open={showOverrideDialog} onClose={() => setShowOverrideDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: 'error.main', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Warning /> Critical Drug Interaction Override Required
        </DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 3 }}>
            This prescription has CRITICAL drug interactions. Override should only be done with careful consideration and clinical justification.
          </Alert>
          
          <TextField
            label="Clinical Justification for Override (Required)"
            multiline
            rows={4}
            fullWidth
            required
            value={overrideReason}
            onChange={(e) => setOverrideReason(e.target.value)}
            placeholder="Explain why the benefits outweigh the risks..."
            helperText="This justification will be logged in the patient's medical record"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setShowOverrideDialog(false);
            setOverrideReason('');
          }}>
            Cancel Prescription
          </Button>
          <Button 
            onClick={handleOverrideConfirm} 
            variant="contained" 
            color="error"
            disabled={!overrideReason.trim()}
          >
            Confirm Override & Prescribe
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

