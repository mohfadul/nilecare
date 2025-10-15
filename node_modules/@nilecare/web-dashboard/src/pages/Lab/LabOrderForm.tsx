/**
 * Lab Order Form
 * Create lab test orders for patients
 */

import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Grid,
  Alert,
  CircularProgress,
  Stack,
  Chip,
  Autocomplete,
  MenuItem,
  FormGroup,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { Save, Cancel, Science } from '@mui/icons-material';
import { apiClient } from '../../services/api.client';
import { useSnackbar } from 'notistack';

interface LabTest {
  code: string;
  name: string;
  category: string;
  price: number;
}

const COMMON_LAB_TESTS: LabTest[] = [
  { code: 'CBC', name: 'Complete Blood Count', category: 'Hematology', price: 50 },
  { code: 'BMP', name: 'Basic Metabolic Panel', category: 'Chemistry', price: 75 },
  { code: 'LFT', name: 'Liver Function Tests', category: 'Chemistry', price: 80 },
  { code: 'LIPID', name: 'Lipid Panel', category: 'Chemistry', price: 60 },
  { code: 'TSH', name: 'Thyroid Stimulating Hormone', category: 'Endocrinology', price: 45 },
  { code: 'HBA1C', name: 'Hemoglobin A1C', category: 'Diabetes', price: 55 },
  { code: 'URINE', name: 'Urinalysis', category: 'Urine', price: 30 },
  { code: 'CULTURE', name: 'Blood Culture', category: 'Microbiology', price: 100 },
  { code: 'XRAY', name: 'X-Ray Chest', category: 'Radiology', price: 120 },
  { code: 'ECG', name: 'Electrocardiogram', category: 'Cardiology', price: 85 },
];

const LabOrderForm: React.FC = () => {
  const navigate = useNavigate();
  const { patientId } = useParams<{ patientId: string }>();
  const { enqueueSnackbar } = useSnackbar();

  const [selectedTests, setSelectedTests] = useState<LabTest[]>([]);
  const [priority, setPriority] = useState('routine');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [isFasting, setIsFasting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTestSelection = (event: any, newValue: LabTest[]) => {
    setSelectedTests(newValue);
  };

  const calculateTotal = (): number => {
    return selectedTests.reduce((sum, test) => sum + test.price, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedTests.length === 0) {
      setError('Please select at least one test');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const payload = {
        patientId,
        tests: selectedTests.map(t => ({
          testCode: t.code,
          testName: t.name,
          category: t.category,
        })),
        priority,
        clinicalNotes,
        isFasting,
        totalAmount: calculateTotal(),
      };

      const result = await apiClient.createLabOrder(payload);

      if (result.success) {
        enqueueSnackbar('Lab order created successfully', { variant: 'success' });
        navigate(`/dashboard/patients/${patientId}/lab-orders`);
      } else {
        throw new Error(result.error?.message || 'Failed to create lab order');
      }
    } catch (err: any) {
      setError(err.message);
      enqueueSnackbar('Failed to create lab order', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Science sx={{ fontSize: 40, color: 'primary.main' }} />
        <Typography variant="h4" fontWeight="bold">
          New Lab Order / طلب فحص مخبري جديد
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Stack spacing={3}>
          {/* Test Selection */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Select Tests / اختر الفحوصات
              </Typography>

              <Autocomplete
                multiple
                options={COMMON_LAB_TESTS}
                getOptionLabel={(option) => `${option.name} (${option.code})`}
                value={selectedTests}
                onChange={handleTestSelection}
                groupBy={(option) => option.category}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Lab Tests"
                    placeholder="Search and select tests..."
                    helperText="You can select multiple tests"
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      label={option.code}
                      {...getTagProps({ index })}
                      color="primary"
                      size="small"
                    />
                  ))
                }
                disabled={loading}
              />

              {selectedTests.length > 0 && (
                <Box mt={2}>
                  <Typography variant="subtitle2" gutterBottom>
                    Selected Tests:
                  </Typography>
                  {selectedTests.map((test) => (
                    <Box
                      key={test.code}
                      display="flex"
                      justifyContent="space-between"
                      py={1}
                      borderBottom="1px solid #eee"
                    >
                      <Typography variant="body2">
                        {test.name} ({test.code})
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {test.price} SDG
                      </Typography>
                    </Box>
                  ))}
                  <Box display="flex" justifyContent="space-between" mt={2} pt={1} borderTop="2px solid #333">
                    <Typography variant="h6">Total:</Typography>
                    <Typography variant="h6" color="primary">
                      {calculateTotal()} SDG
                    </Typography>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Order Details */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Order Details / تفاصيل الطلب
              </Typography>

              <Grid container spacing={2} mt={1}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    required
                    label="Priority / الأولوية"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    disabled={loading}
                  >
                    <MenuItem value="routine">Routine / عادي</MenuItem>
                    <MenuItem value="urgent">Urgent / عاجل</MenuItem>
                    <MenuItem value="stat">STAT / طارئ</MenuItem>
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={isFasting}
                          onChange={(e) => setIsFasting(e.target.checked)}
                          disabled={loading}
                        />
                      }
                      label="Fasting Required / صيام مطلوب"
                    />
                  </FormGroup>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Clinical Notes / ملاحظات سريرية"
                    value={clinicalNotes}
                    onChange={(e) => setClinicalNotes(e.target.value)}
                    placeholder="Reason for test, clinical indication, relevant history..."
                    disabled={loading}
                    helperText="Provide clinical context for the lab"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Patient Info Alert */}
          <Alert severity="info">
            <strong>Patient ID:</strong> {patientId}
            <br />
            <strong>Total Tests:</strong> {selectedTests.length}
            <br />
            <strong>Total Cost:</strong> {calculateTotal()} SDG
            <br />
            <strong>Priority:</strong> {priority.toUpperCase()}
            {isFasting && (
              <>
                <br />
                <strong>⚠️ Fasting Required:</strong> Patient must fast for 8-12 hours
              </>
            )}
          </Alert>

          {/* Action Buttons */}
          <Box display="flex" gap={2} justifyContent="flex-end">
            <Button
              variant="outlined"
              startIcon={<Cancel />}
              onClick={() => navigate(-1)}
              disabled={loading}
              size="large"
            >
              Cancel / إلغاء
            </Button>

            <Button
              type="submit"
              variant="contained"
              startIcon={loading ? <CircularProgress size={20} /> : <Save />}
              disabled={loading || selectedTests.length === 0}
              size="large"
            >
              {loading ? 'Creating Order...' : 'Create Lab Order / إنشاء الطلب'}
            </Button>
          </Box>
        </Stack>
      </form>
    </Box>
  );
};

export default LabOrderForm;

