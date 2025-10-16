/**
 * Drug Interaction Alert Component
 * ✅ PHASE 7: Clinical Decision Support Integration
 * 
 * Displays drug interaction warnings with severity levels
 */

import { Alert, AlertTitle, Typography, Box, Chip } from '@mui/material';
import { Warning, Error as ErrorIcon, Info, ReportProblem } from '@mui/icons-material';
import { DrugInteraction } from '../../services/cds.service';

interface DrugInteractionAlertProps {
  interaction: DrugInteraction;
}

/**
 * Get color and icon based on severity
 */
const getSeverityConfig = (severity: DrugInteraction['severity']) => {
  const configs = {
    low: {
      color: 'info' as const,
      icon: <Info />,
      chipColor: 'info' as const,
      bgColor: '#e3f2fd'
    },
    moderate: {
      color: 'warning' as const,
      icon: <Warning />,
      chipColor: 'warning' as const,
      bgColor: '#fff3e0'
    },
    high: {
      color: 'warning' as const,
      icon: <ReportProblem />,
      chipColor: 'warning' as const,
      bgColor: '#ffe0b2'
    },
    critical: {
      color: 'error' as const,
      icon: <ErrorIcon />,
      chipColor: 'error' as const,
      bgColor: '#ffebee'
    }
  };
  
  return configs[severity];
};

export function DrugInteractionAlert({ interaction }: DrugInteractionAlertProps) {
  const config = getSeverityConfig(interaction.severity);
  
  return (
    <Alert 
      severity={config.color} 
      icon={config.icon}
      sx={{ 
        mt: 2,
        backgroundColor: config.bgColor,
        '& .MuiAlert-icon': {
          fontSize: 28
        }
      }}
    >
      <AlertTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Typography variant="h6" component="span">
            Drug Interaction Detected
          </Typography>
          <Chip 
            label={interaction.severity.toUpperCase()} 
            color={config.chipColor}
            size="small"
            sx={{ fontWeight: 'bold' }}
          />
        </Box>
      </AlertTitle>
      
      {/* Interacting Drugs */}
      <Typography variant="body2" gutterBottom sx={{ mt: 1 }}>
        <strong>Interacting Medications:</strong>
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
        {interaction.drugs.map((drug, index) => (
          <Chip 
            key={index}
            label={drug}
            size="small"
            variant="outlined"
          />
        ))}
      </Box>
      
      {/* Description */}
      <Typography variant="body2" gutterBottom sx={{ mb: 1 }}>
        <strong>Description:</strong>
      </Typography>
      <Typography variant="body2" gutterBottom sx={{ pl: 2 }}>
        {interaction.description}
      </Typography>
      
      {/* Recommendation */}
      <Typography variant="body2" gutterBottom sx={{ mt: 2, mb: 1 }}>
        <strong>Clinical Recommendation:</strong>
      </Typography>
      <Typography 
        variant="body2" 
        sx={{ 
          pl: 2,
          fontWeight: interaction.severity === 'critical' ? 600 : 400,
          color: interaction.severity === 'critical' ? 'error.main' : 'text.primary'
        }}
      >
        {interaction.recommendation}
      </Typography>
      
      {/* References (if available) */}
      {interaction.references && interaction.references.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            <strong>References:</strong> {interaction.references.join(', ')}
          </Typography>
        </Box>
      )}
    </Alert>
  );
}

export default DrugInteractionAlert;

