import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Box, Container, Typography, CircularProgress, Button, Paper, Alert } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import axios from 'axios';

/**
 * Email Verification Page
 * ✅ FIX #5: Email verification implementation
 * 
 * Verifies user email using token from verification link
 */
export function VerifyEmailPage() {
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  useEffect(() => {
    async function verifyEmail() {
      if (!token) {
        setStatus('error');
        setMessage('No verification token provided in the URL');
        return;
      }
      
      try {
        const authServiceUrl = import.meta.env.VITE_AUTH_SERVICE_URL || 'http://localhost:7020';
        
        const response = await axios.post(
          `${authServiceUrl}/api/v1/auth/verify-email`,
          { token },
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (response.data.success) {
          setStatus('success');
          setMessage('Your email has been verified successfully!');
          
          // Redirect to login after 3 seconds
          setTimeout(() => {
            navigate('/login', { 
              state: { message: 'Email verified! Please log in.' }
            });
          }, 3000);
        } else {
          setStatus('error');
          setMessage(response.data.message || 'Verification failed');
        }
      } catch (error: any) {
        console.error('Verification error:', error);
        setStatus('error');
        
        if (error.response?.data?.error?.code === 'INVALID_TOKEN') {
          setMessage('This verification link is invalid or has expired');
        } else {
          setMessage(error.response?.data?.message || 'Verification failed. Please try again.');
        }
      }
    }
    
    verifyEmail();
  }, [token, navigate]);
  
  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: '100%',
            textAlign: 'center',
          }}
        >
          {status === 'verifying' && (
            <>
              <CircularProgress size={60} sx={{ mb: 3 }} />
              <Typography variant="h5" gutterBottom>
                Verifying Your Email
              </Typography>
              <Typography color="text.secondary">
                Please wait while we verify your email address...
              </Typography>
            </>
          )}
          
          {status === 'success' && (
            <>
              <CheckCircleIcon 
                sx={{ fontSize: 80, color: 'success.main', mb: 2 }} 
              />
              <Typography variant="h5" gutterBottom color="success.main">
                Email Verified Successfully!
              </Typography>
              <Alert severity="success" sx={{ mt: 2, mb: 2 }}>
                {message}
              </Alert>
              <Typography color="text.secondary" sx={{ mb: 2 }}>
                Redirecting you to login...
              </Typography>
              <CircularProgress size={30} />
            </>
          )}
          
          {status === 'error' && (
            <>
              <ErrorIcon 
                sx={{ fontSize: 80, color: 'error.main', mb: 2 }} 
              />
              <Typography variant="h5" gutterBottom color="error.main">
                Verification Failed
              </Typography>
              <Alert severity="error" sx={{ mt: 2, mb: 3 }}>
                {message}
              </Alert>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  onClick={() => navigate('/login')}
                >
                  Go to Login
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/register')}
                >
                  Register Again
                </Button>
              </Box>
            </>
          )}
        </Paper>
      </Box>
    </Container>
  );
}

