/**
 * SOAP Note Form
 * Subjective, Objective, Assessment, Plan clinical documentation
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
} from '@mui/material';
import { Save, Cancel, Description } from '@mui/icons-material';
import { apiClient } from '../../services/api.client';
import { useSnackbar } from 'notistack';

interface SOAPNoteData {
  patientId: string;
  encounterId: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  vitalSigns: {
    bloodPressure?: string;
    heartRate?: number;
    temperature?: number;
    respiratoryRate?: number;
    oxygenSaturation?: number;
    weight?: number;
    height?: number;
  };
}

const SOAPNoteForm: React.FC = () => {
  const navigate = useNavigate();
  const { patientId, encounterId } = useParams<{ patientId: string; encounterId: string }>();
  const { enqueueSnackbar } = useSnackbar();

  const [formData, setFormData] = useState<SOAPNoteData>({
    patientId: patientId || '',
    encounterId: encounterId || '',
    subjective: '',
    objective: '',
    assessment: '',
    plan: '',
    vitalSigns: {},
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      const result = await apiClient.saveSoapNote(formData);

      if (result.success) {
        enqueueSnackbar('SOAP note saved successfully', { variant: 'success' });
        navigate(`/dashboard/patients/${patientId}`);
      } else {
        throw new Error(result.error?.message || 'Failed to save SOAP note');
      }
    } catch (err: any) {
      setError(err.message);
      enqueueSnackbar('Failed to save SOAP note', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Description sx={{ fontSize: 40, color: 'primary.main' }} />
        <Typography variant="h4" fontWeight="bold">
          SOAP Note / ملاحظات SOAP
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Stack spacing={3}>
          {/* Vital Signs */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Vital Signs / العلامات الحيوية
              </Typography>

              <Grid container spacing={2} mt={1}>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    label="Blood Pressure / ضغط الدم"
                    value={formData.vitalSigns.bloodPressure || ''}
                    onChange={handleChange('vitalSigns.bloodPressure')}
                    placeholder="120/80"
                    helperText="Systolic/Diastolic mmHg"
                    disabled={loading}
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Heart Rate / معدل القلب"
                    value={formData.vitalSigns.heartRate || ''}
                    onChange={handleChange('vitalSigns.heartRate')}
                    placeholder="72"
                    helperText="beats per minute"
                    disabled={loading}
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Temperature / درجة الحرارة"
                    value={formData.vitalSigns.temperature || ''}
                    onChange={handleChange('vitalSigns.temperature')}
                    placeholder="98.6"
                    helperText="°F or °C"
                    disabled={loading}
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Respiratory Rate / معدل التنفس"
                    value={formData.vitalSigns.respiratoryRate || ''}
                    onChange={handleChange('vitalSigns.respiratoryRate')}
                    placeholder="16"
                    helperText="breaths per minute"
                    disabled={loading}
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    type="number"
                    label="O₂ Saturation / تشبع الأكسجين"
                    value={formData.vitalSigns.oxygenSaturation || ''}
                    onChange={handleChange('vitalSigns.oxygenSaturation')}
                    placeholder="98"
                    helperText="SpO₂ %"
                    disabled={loading}
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Weight / الوزن"
                    value={formData.vitalSigns.weight || ''}
                    onChange={handleChange('vitalSigns.weight')}
                    placeholder="70"
                    helperText="kg"
                    disabled={loading}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Subjective */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Chip label="S" color="primary" size="small" sx={{ mr: 1 }} />
                Subjective / الموضوعية
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                Patient's description of symptoms, concerns, and history
              </Typography>

              <TextField
                fullWidth
                multiline
                rows={6}
                required
                label="Chief Complaint & History"
                value={formData.subjective}
                onChange={handleChange('subjective')}
                placeholder="Patient reports pain in lower back for 3 days, worse with movement..."
                disabled={loading}
                helperText="What the patient tells you"
              />
            </CardContent>
          </Card>

          {/* Objective */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Chip label="O" color="info" size="small" sx={{ mr: 1 }} />
                Objective / الموضوعية
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                Observable findings, examination results, test results
              </Typography>

              <TextField
                fullWidth
                multiline
                rows={6}
                required
                label="Physical Examination & Findings"
                value={formData.objective}
                onChange={handleChange('objective')}
                placeholder="On examination: tenderness in L4-L5 region, no neurological deficits..."
                disabled={loading}
                helperText="What you observe and measure"
              />
            </CardContent>
          </Card>

          {/* Assessment */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Chip label="A" color="warning" size="small" sx={{ mr: 1 }} />
                Assessment / التقييم
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                Diagnosis, differential diagnosis, clinical interpretation
              </Typography>

              <TextField
                fullWidth
                multiline
                rows={4}
                required
                label="Diagnosis & Clinical Impression"
                value={formData.assessment}
                onChange={handleChange('assessment')}
                placeholder="Acute mechanical low back pain, likely muscular strain..."
                disabled={loading}
                helperText="Your clinical diagnosis"
              />
            </CardContent>
          </Card>

          {/* Plan */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Chip label="P" color="success" size="small" sx={{ mr: 1 }} />
                Plan / الخطة
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                Treatment plan, medications, follow-up, patient instructions
              </Typography>

              <TextField
                fullWidth
                multiline
                rows={6}
                required
                label="Treatment Plan & Follow-up"
                value={formData.plan}
                onChange={handleChange('plan')}
                placeholder="1. NSAIDs for pain management\n2. Physical therapy referral\n3. Follow-up in 1 week..."
                disabled={loading}
                helperText="Treatment and next steps"
              />
            </CardContent>
          </Card>

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
              disabled={loading}
              size="large"
            >
              {loading ? 'Saving...' : 'Save SOAP Note / حفظ'}
            </Button>
          </Box>
        </Stack>
      </form>
    </Box>
  );
};

export default SOAPNoteForm;

