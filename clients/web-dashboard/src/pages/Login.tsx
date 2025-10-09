/**
 * Login Page
 * Secure authentication with Sudan localization
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  IconButton,
  InputAdornment,
  Link,
  Stack,
  Divider,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  LocalHospital,
  Email,
  Lock,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0066CC 0%, #00A86B 100%)',
        padding: 2,
      }}
    >
      <Card sx={{ maxWidth: 450, width: '100%', boxShadow: 6 }}>
        <CardContent sx={{ p: 4 }}>
          {/* Logo and Title */}
          <Box textAlign="center" mb={3}>
            <LocalHospital sx={{ fontSize: 64, color: 'primary.main', mb: 1 }} />
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              NileCare
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              منصة الرعاية الصحية السودانية
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Sudan Healthcare Platform
            </Typography>
          </Box>

          <Divider sx={{ my: 2 }} />

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Stack spacing={2}>
              {/* Email Field */}
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email color="action" />
                    </InputAdornment>
                  ),
                }}
              />

              {/* Password Field */}
              <TextField
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        disabled={loading}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              {/* Remember Me & Forgot Password */}
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Link href="#" variant="body2" underline="hover">
                  Forgot password?
                </Link>
              </Box>

              {/* Login Button */}
              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={loading}
                sx={{ py: 1.5 }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'تسجيل الدخول / Login'}
              </Button>

              {/* Register Link */}
              <Box textAlign="center" mt={2}>
                <Typography variant="body2" color="text.secondary">
                  Don't have an account?{' '}
                  <Link href="/register" variant="body2" fontWeight="bold">
                    Register
                  </Link>
                </Typography>
              </Box>
            </Stack>
          </form>

          {/* Demo Credentials */}
          <Box mt={3} p={2} bgcolor="grey.100" borderRadius={1}>
            <Typography variant="caption" fontWeight="bold" display="block" mb={0.5}>
              Demo Credentials:
            </Typography>
            <Typography variant="caption" display="block">
              Doctor: doctor@nilecare.sd / Password123!
            </Typography>
            <Typography variant="caption" display="block">
              Nurse: nurse@nilecare.sd / Password123!
            </Typography>
            <Typography variant="caption" display="block">
              Admin: admin@nilecare.sd / Password123!
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Login;

