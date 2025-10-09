/**
 * Dashboard Loading Component
 * Shown while app is initializing
 */

import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { LocalHospital } from '@mui/icons-material';

const DashboardLoading: React.FC = () => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        background: 'linear-gradient(135deg, #0066CC 0%, #00A86B 100%)',
      }}
    >
      <LocalHospital sx={{ fontSize: 80, color: 'white' }} />
      <Typography variant="h4" color="white" fontWeight="bold">
        NileCare
      </Typography>
      <CircularProgress sx={{ color: 'white', mt: 2 }} />
      <Typography variant="body2" color="white" sx={{ mt: 1 }}>
        Loading...
      </Typography>
    </Box>
  );
};

export default DashboardLoading;

