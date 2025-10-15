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
import { useCreateLabOrder } from '../../../hooks/useLabs';
import { CreateLabOrderRequest } from '../../../api/labs.api';
import { authStore } from '../../../store/authStore';

const labOrderSchema = z.object({
  patientId: z.number().min(1, 'Patient is required'),
  testName: z.string().min(2, 'Test name is required'),
  testCode: z.string().min(1, 'Test code is required'),
  category: z.string().min(1, 'Category is required'),
  priority: z.enum(['routine', 'urgent', 'stat']),
  notes: z.string().optional(),
});

type LabOrderFormData = z.infer<typeof labOrderSchema>;

export function LabOrderFormPage() {
  const navigate = useNavigate();
  const user = authStore((state) => state.user);
  const createLabOrder = useCreateLabOrder();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LabOrderFormData>({
    resolver: zodResolver(labOrderSchema),
    defaultValues: {
      patientId: 1,
      testName: '',
      testCode: '',
      category: '',
      priority: 'routine',
      notes: '',
    },
  });

  const onSubmit = async (data: LabOrderFormData) => {
    try {
      const requestData: CreateLabOrderRequest = {
        patientId: data.patientId,
        orderedBy: user?.id || 1,
        testName: data.testName,
        testCode: data.testCode,
        category: data.category,
        priority: data.priority,
        notes: data.notes || undefined,
      };

      await createLabOrder.mutateAsync(requestData);
      navigate('/clinical/labs');
    } catch (error) {
      console.error('Failed to create lab order:', error);
    }
  };

  return (
    <Container maxWidth="md">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/clinical/labs')}>
          Back to Lab Orders
        </Button>
      </Box>

      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>
          Order Lab Test
        </Typography>

        {createLabOrder.error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            Failed to create lab order. Please try again.
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 3 }}>
          <Grid container spacing={3}>
            {/* Patient Selection */}
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

            {/* Test Selection */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="testName"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Test Name"
                    select
                    fullWidth
                    required
                    error={!!errors.testName}
                    helperText={errors.testName?.message}
                  >
                    <MenuItem value="Complete Blood Count">Complete Blood Count (CBC)</MenuItem>
                    <MenuItem value="Basic Metabolic Panel">Basic Metabolic Panel (BMP)</MenuItem>
                    <MenuItem value="Comprehensive Metabolic Panel">Comprehensive Metabolic Panel (CMP)</MenuItem>
                    <MenuItem value="Lipid Panel">Lipid Panel</MenuItem>
                    <MenuItem value="Liver Function Test">Liver Function Test (LFT)</MenuItem>
                    <MenuItem value="Kidney Function Test">Kidney Function Test (KFT)</MenuItem>
                    <MenuItem value="Thyroid Function Test">Thyroid Function Test (TFT)</MenuItem>
                    <MenuItem value="HbA1c">HbA1c (Diabetes)</MenuItem>
                    <MenuItem value="Urinalysis">Urinalysis</MenuItem>
                    <MenuItem value="Chest X-Ray">Chest X-Ray</MenuItem>
                  </TextField>
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="testCode"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Test Code"
                    fullWidth
                    required
                    error={!!errors.testCode}
                    helperText={errors.testCode?.message || 'e.g., CBC, BMP, LFT'}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Category"
                    select
                    fullWidth
                    required
                    error={!!errors.category}
                    helperText={errors.category?.message}
                  >
                    <MenuItem value="Hematology">Hematology</MenuItem>
                    <MenuItem value="Chemistry">Chemistry</MenuItem>
                    <MenuItem value="Microbiology">Microbiology</MenuItem>
                    <MenuItem value="Immunology">Immunology</MenuItem>
                    <MenuItem value="Radiology">Radiology</MenuItem>
                    <MenuItem value="Pathology">Pathology</MenuItem>
                  </TextField>
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="priority"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Priority"
                    select
                    fullWidth
                    required
                    error={!!errors.priority}
                    helperText={errors.priority?.message}
                  >
                    <MenuItem value="routine">Routine</MenuItem>
                    <MenuItem value="urgent">Urgent</MenuItem>
                    <MenuItem value="stat">STAT (Immediate)</MenuItem>
                  </TextField>
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
                    label="Clinical Notes"
                    fullWidth
                    multiline
                    rows={3}
                    helperText="Additional information for the lab technician"
                  />
                )}
              />
            </Grid>

            {/* Action Buttons */}
            <Grid item xs={12}>
              <Box display="flex" gap={2} justifyContent="flex-end" sx={{ mt: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/clinical/labs')}
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
                  {isSubmitting ? 'Ordering...' : 'Order Test'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
}

