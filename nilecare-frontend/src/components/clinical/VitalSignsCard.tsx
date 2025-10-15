import { Card, CardContent, Typography, Box, Grid, Chip } from '@mui/material';
import { Favorite, Thermostat, LocalHospital, TrendingUp } from '@mui/icons-material';

interface VitalSignsCardProps {
  temperature?: number;
  heartRate?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
  weight?: number;
  height?: number;
  timestamp?: string;
}

export function VitalSignsCard(props: VitalSignsCardProps) {
  const {
    temperature,
    heartRate,
    bloodPressureSystolic,
    bloodPressureDiastolic,
    respiratoryRate,
    oxygenSaturation,
    weight,
    height,
    timestamp,
  } = props;

  const isAbnormal = (value: number | undefined, min: number, max: number): boolean => {
    if (value === undefined) return false;
    return value < min || value > max;
  };

  const getValueColor = (isAbnormal: boolean) => {
    return isAbnormal ? 'error.main' : 'text.primary';
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Vital Signs</Typography>
          {timestamp && (
            <Typography variant="caption" color="text.secondary">
              Recorded: {new Date(timestamp).toLocaleString()}
            </Typography>
          )}
        </Box>

        <Grid container spacing={2}>
          {/* Temperature */}
          {temperature !== undefined && (
            <Grid item xs={6} sm={4} md={3}>
              <Box display="flex" alignItems="center" mb={0.5}>
                <Thermostat fontSize="small" color="primary" sx={{ mr: 0.5 }} />
                <Typography variant="caption" color="text.secondary">
                  Temperature
                </Typography>
              </Box>
              <Typography 
                variant="h6"
                color={getValueColor(isAbnormal(temperature, 36.1, 37.2))}
              >
                {temperature}°C
              </Typography>
              {isAbnormal(temperature, 36.1, 37.2) && (
                <Chip label="Abnormal" size="small" color="error" sx={{ mt: 0.5 }} />
              )}
            </Grid>
          )}

          {/* Heart Rate */}
          {heartRate !== undefined && (
            <Grid item xs={6} sm={4} md={3}>
              <Box display="flex" alignItems="center" mb={0.5}>
                <Favorite fontSize="small" color="primary" sx={{ mr: 0.5 }} />
                <Typography variant="caption" color="text.secondary">
                  Heart Rate
                </Typography>
              </Box>
              <Typography 
                variant="h6"
                color={getValueColor(isAbnormal(heartRate, 60, 100))}
              >
                {heartRate} bpm
              </Typography>
              {isAbnormal(heartRate, 60, 100) && (
                <Chip label="Abnormal" size="small" color="error" sx={{ mt: 0.5 }} />
              )}
            </Grid>
          )}

          {/* Blood Pressure */}
          {bloodPressureSystolic !== undefined && bloodPressureDiastolic !== undefined && (
            <Grid item xs={6} sm={4} md={3}>
              <Box display="flex" alignItems="center" mb={0.5}>
                <TrendingUp fontSize="small" color="primary" sx={{ mr: 0.5 }} />
                <Typography variant="caption" color="text.secondary">
                  Blood Pressure
                </Typography>
              </Box>
              <Typography 
                variant="h6"
                color={getValueColor(
                  isAbnormal(bloodPressureSystolic, 90, 120) || 
                  isAbnormal(bloodPressureDiastolic, 60, 80)
                )}
              >
                {bloodPressureSystolic}/{bloodPressureDiastolic}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                mmHg
              </Typography>
              {(isAbnormal(bloodPressureSystolic, 90, 120) || isAbnormal(bloodPressureDiastolic, 60, 80)) && (
                <Chip label="Abnormal" size="small" color="error" sx={{ mt: 0.5 }} />
              )}
            </Grid>
          )}

          {/* Oxygen Saturation */}
          {oxygenSaturation !== undefined && (
            <Grid item xs={6} sm={4} md={3}>
              <Box display="flex" alignItems="center" mb={0.5}>
                <LocalHospital fontSize="small" color="primary" sx={{ mr: 0.5 }} />
                <Typography variant="caption" color="text.secondary">
                  O2 Saturation
                </Typography>
              </Box>
              <Typography 
                variant="h6"
                color={getValueColor(isAbnormal(oxygenSaturation, 95, 100))}
              >
                {oxygenSaturation}%
              </Typography>
              {isAbnormal(oxygenSaturation, 95, 100) && (
                <Chip label="Low" size="small" color="error" sx={{ mt: 0.5 }} />
              )}
            </Grid>
          )}

          {/* Respiratory Rate */}
          {respiratoryRate !== undefined && (
            <Grid item xs={6} sm={4} md={3}>
              <Box display="flex" alignItems="center" mb={0.5}>
                <Typography variant="caption" color="text.secondary">
                  Respiratory Rate
                </Typography>
              </Box>
              <Typography 
                variant="h6"
                color={getValueColor(isAbnormal(respiratoryRate, 12, 20))}
              >
                {respiratoryRate} /min
              </Typography>
              {isAbnormal(respiratoryRate, 12, 20) && (
                <Chip label="Abnormal" size="small" color="error" sx={{ mt: 0.5 }} />
              )}
            </Grid>
          )}

          {/* Weight */}
          {weight !== undefined && (
            <Grid item xs={6} sm={4} md={3}>
              <Box display="flex" alignItems="center" mb={0.5}>
                <Typography variant="caption" color="text.secondary">
                  Weight
                </Typography>
              </Box>
              <Typography variant="h6">
                {weight} kg
              </Typography>
            </Grid>
          )}

          {/* Height */}
          {height !== undefined && (
            <Grid item xs={6} sm={4} md={3}>
              <Box display="flex" alignItems="center" mb={0.5}>
                <Typography variant="caption" color="text.secondary">
                  Height
                </Typography>
              </Box>
              <Typography variant="h6">
                {height} cm
              </Typography>
            </Grid>
          )}
        </Grid>

        {!temperature && !heartRate && !bloodPressureSystolic && !oxygenSaturation && (
          <Alert severity="info" sx={{ mt: 2 }}>
            No vital signs recorded yet. Click "Record Vitals" to add measurements.
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

