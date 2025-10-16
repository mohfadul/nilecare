/**
 * Vital Signs Monitor Component
 * ✅ PHASE 7: Device Integration - Real-Time Vital Signs
 * 
 * Displays live vital signs data from medical devices via WebSocket
 */

import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Grid, 
  Box, 
  Chip, 
  CircularProgress,
  Alert,
  AlertTitle
} from '@mui/material';
import { 
  Favorite, 
  Thermostat, 
  Air, 
  MonitorHeart,
  Warning
} from '@mui/icons-material';
import { useWebSocket } from '../../services/websocket.service';

interface VitalSigns {
  heartRate?: number;
  bloodPressure?: string;
  spo2?: number;
  temperature?: number;
  respiratoryRate?: number;
  timestamp?: string;
}

interface VitalSignsMonitorProps {
  patientId: string;
}

/**
 * Individual Vital Sign Display Card
 */
function VitalCard({ 
  label, 
  value, 
  unit, 
  icon, 
  isNormal, 
  normalRange 
}: {
  label: string;
  value?: number | string;
  unit?: string;
  icon: React.ReactNode;
  isNormal?: boolean;
  normalRange?: string;
}) {
  const getColor = () => {
    if (value === undefined || value === null) return 'text.secondary';
    if (isNormal === false) return 'error.main';
    if (isNormal === true) return 'success.main';
    return 'text.primary';
  };

  return (
    <Box 
      sx={{ 
        p: 2, 
        border: 1, 
        borderColor: isNormal === false ? 'error.main' : 'divider',
        borderRadius: 2,
        backgroundColor: isNormal === false ? 'error.light' : 'background.paper',
        transition: 'all 0.3s ease'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Box sx={{ color: getColor() }}>
          {icon}
        </Box>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
      </Box>
      
      <Typography variant="h4" sx={{ color: getColor(), fontWeight: 600 }}>
        {value !== undefined && value !== null ? (
          <>
            {value}
            {unit && <Typography component="span" variant="h6" sx={{ ml: 0.5 }}>{unit}</Typography>}
          </>
        ) : (
          <Typography variant="body2" color="text.secondary">--</Typography>
        )}
      </Typography>
      
      {normalRange && (
        <Typography variant="caption" color="text.secondary">
          Normal: {normalRange}
        </Typography>
      )}
      
      {isNormal === false && (
        <Chip 
          label="ABNORMAL" 
          size="small" 
          color="error" 
          sx={{ mt: 1, fontWeight: 'bold' }}
        />
      )}
    </Box>
  );
}

/**
 * Main Vital Signs Monitor Component
 */
export function VitalSignsMonitor({ patientId }: VitalSignsMonitorProps) {
  const [vitals, setVitals] = useState<VitalSigns | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const { subscribe, unsubscribe } = useWebSocket();
  
  useEffect(() => {
    // Subscribe to patient's vital signs channel
    const channel = `patient:${patientId}:vitals`;
    
    const handler = (data: VitalSigns) => {
      console.log('Received vital signs:', data);
      setVitals(data);
      setLastUpdate(new Date());
      setIsConnected(true);
    };
    
    // Subscribe to channel
    subscribe(channel, handler);
    setIsConnected(true);
    
    // Cleanup on unmount
    return () => {
      unsubscribe(channel, handler);
      setIsConnected(false);
    };
  }, [patientId, subscribe, unsubscribe]);
  
  // Check if vitals are critical
  const hasCriticalVitals = vitals && (
    (vitals.heartRate && (vitals.heartRate < 50 || vitals.heartRate > 120)) ||
    (vitals.spo2 && vitals.spo2 < 90) ||
    (vitals.temperature && (vitals.temperature < 95 || vitals.temperature > 102))
  );
  
  return (
    <Card>
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <MonitorHeart color="primary" />
            <Typography variant="h6">
              Live Vital Signs Monitor
            </Typography>
          </Box>
          
          <Chip 
            label={isConnected ? 'CONNECTED' : 'DISCONNECTED'} 
            color={isConnected ? 'success' : 'default'}
            size="small"
            sx={{ animation: isConnected ? 'pulse 2s infinite' : 'none' }}
          />
        </Box>
        
        {/* Critical Alert */}
        {hasCriticalVitals && (
          <Alert severity="error" icon={<Warning />} sx={{ mb: 3 }}>
            <AlertTitle>Critical Vital Signs Detected!</AlertTitle>
            One or more vital signs are outside normal range. Immediate attention required.
          </Alert>
        )}
        
        {/* Vital Signs Grid */}
        {!vitals && !isConnected ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CircularProgress />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Connecting to vital signs monitor...
            </Typography>
          </Box>
        ) : !vitals ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              Waiting for vital signs data from devices...
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {/* Heart Rate */}
            <Grid item xs={12} sm={6} md={3}>
              <VitalCard
                label="Heart Rate"
                value={vitals.heartRate}
                unit="bpm"
                icon={<Favorite />}
                isNormal={vitals.heartRate ? (vitals.heartRate >= 60 && vitals.heartRate <= 100) : undefined}
                normalRange="60-100 bpm"
              />
            </Grid>
            
            {/* Blood Pressure */}
            <Grid item xs={12} sm={6} md={3}>
              <VitalCard
                label="Blood Pressure"
                value={vitals.bloodPressure}
                icon={<MonitorHeart />}
                normalRange="120/80 mmHg"
              />
            </Grid>
            
            {/* SpO2 (Oxygen Saturation) */}
            <Grid item xs={12} sm={6} md={3}>
              <VitalCard
                label="SpO₂"
                value={vitals.spo2}
                unit="%"
                icon={<Air />}
                isNormal={vitals.spo2 ? vitals.spo2 >= 95 : undefined}
                normalRange="95-100%"
              />
            </Grid>
            
            {/* Temperature */}
            <Grid item xs={12} sm={6} md={3}>
              <VitalCard
                label="Temperature"
                value={vitals.temperature}
                unit="°F"
                icon={<Thermostat />}
                isNormal={vitals.temperature ? (vitals.temperature >= 97 && vitals.temperature <= 99) : undefined}
                normalRange="97-99°F"
              />
            </Grid>
            
            {/* Respiratory Rate (if available) */}
            {vitals.respiratoryRate && (
              <Grid item xs={12} sm={6} md={3}>
                <VitalCard
                  label="Respiratory Rate"
                  value={vitals.respiratoryRate}
                  unit="rpm"
                  icon={<Air />}
                  isNormal={vitals.respiratoryRate >= 12 && vitals.respiratoryRate <= 20}
                  normalRange="12-20 rpm"
                />
              </Grid>
            )}
          </Grid>
        )}
        
        {/* Last Update Time */}
        {lastUpdate && (
          <Typography 
            variant="caption" 
            color="text.secondary" 
            sx={{ mt: 3, display: 'block', textAlign: 'center' }}
          >
            Last updated: {lastUpdate.toLocaleTimeString()}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

export default VitalSignsMonitor;

