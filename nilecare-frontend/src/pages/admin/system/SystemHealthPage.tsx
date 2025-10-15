import {
  Container,
  Typography,
  Paper,
  Box,
  Grid,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import { CheckCircle, Error, Warning, Info, Storage, Cloud, Speed, Memory } from '@mui/icons-material';

export function SystemHealthPage() {
  // TODO: Replace with real system health data from API
  const services = [
    { name: 'Auth Service', port: 7020, status: 'healthy', uptime: '99.9%', responseTime: '45ms' },
    { name: 'Main Service', port: 7000, status: 'healthy', uptime: '99.8%', responseTime: '120ms' },
    { name: 'Appointment Service', port: 7040, status: 'healthy', uptime: '99.7%', responseTime: '80ms' },
    { name: 'Lab Service', port: 4005, status: 'healthy', uptime: '99.6%', responseTime: '95ms' },
    { name: 'Medication Service', port: 4003, status: 'healthy', uptime: '99.5%', responseTime: '110ms' },
    { name: 'Billing Service', port: 5003, status: 'healthy', uptime: '99.9%', responseTime: '75ms' },
    { name: 'Payment Gateway', port: 7030, status: 'healthy', uptime: '99.8%', responseTime: '150ms' },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle color="success" />;
      case 'degraded': return <Warning color="warning" />;
      case 'down': return <Error color="error" />;
      default: return <Info color="info" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'success';
      case 'degraded': return 'warning';
      case 'down': return 'error';
      default: return 'default';
    }
  };

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" gutterBottom>
        System Health Dashboard
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Real-time system monitoring and performance metrics
      </Typography>

      {/* System Overview */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <CheckCircle color="success" sx={{ mr: 1 }} />
                <Typography variant="h6">System Status</Typography>
              </Box>
              <Typography variant="h3" color="success.main">Healthy</Typography>
              <Typography variant="caption" color="text.secondary">
                All services operational
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <Speed color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Uptime</Typography>
              </Box>
              <Typography variant="h3">99.8%</Typography>
              <Typography variant="caption" color="text.secondary">
                Last 30 days
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <Memory color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Avg Response</Typography>
              </Box>
              <Typography variant="h3">95ms</Typography>
              <Typography variant="caption" color="text.secondary">
                Across all services
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <Cloud color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Active Services</Typography>
              </Box>
              <Typography variant="h3">7/7</Typography>
              <Typography variant="caption" color="text.secondary">
                All services running
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Microservices Status */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Microservices Health
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <List>
          {services.map((service) => (
            <ListItem key={service.name}>
              <ListItemIcon>
                {getStatusIcon(service.status)}
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body1" fontWeight="medium">
                      {service.name}
                    </Typography>
                    <Chip
                      label={service.status}
                      size="small"
                      color={getStatusColor(service.status) as any}
                    />
                  </Box>
                }
                secondary={
                  <Box display="flex" gap={3} mt={0.5}>
                    <Typography variant="caption">Port: {service.port}</Typography>
                    <Typography variant="caption">Uptime: {service.uptime}</Typography>
                    <Typography variant="caption">Response: {service.responseTime}</Typography>
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>
      </Paper>

      {/* Database Status */}
      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" mb={2}>
              <Storage color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">MySQL Database</Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />

            <Box mb={2}>
              <Typography variant="body2" color="text.secondary">Connection Pool</Typography>
              <Box display="flex" alignItems="center" mt={1}>
                <LinearProgress
                  variant="determinate"
                  value={35}
                  sx={{ flexGrow: 1, mr: 2, height: 8, borderRadius: 4 }}
                />
                <Typography variant="body2">35/100</Typography>
              </Box>
            </Box>

            <Box mb={2}>
              <Typography variant="body2" color="text.secondary">Storage Used</Typography>
              <Box display="flex" alignItems="center" mt={1}>
                <LinearProgress
                  variant="determinate"
                  value={45}
                  sx={{ flexGrow: 1, mr: 2, height: 8, borderRadius: 4 }}
                />
                <Typography variant="body2">45 GB / 100 GB</Typography>
              </Box>
            </Box>

            <Box>
              <Typography variant="body2" color="text.secondary">Active Queries</Typography>
              <Typography variant="h4">127</Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" mb={2}>
              <Storage color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">PostgreSQL Database</Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />

            <Box mb={2}>
              <Typography variant="body2" color="text.secondary">Connection Pool</Typography>
              <Box display="flex" alignItems="center" mt={1}>
                <LinearProgress
                  variant="determinate"
                  value={28}
                  sx={{ flexGrow: 1, mr: 2, height: 8, borderRadius: 4 }}
                />
                <Typography variant="body2">28/100</Typography>
              </Box>
            </Box>

            <Box mb={2}>
              <Typography variant="body2" color="text.secondary">Storage Used</Typography>
              <Box display="flex" alignItems="center" mt={1}>
                <LinearProgress
                  variant="determinate"
                  value={32}
                  sx={{ flexGrow: 1, mr: 2, height: 8, borderRadius: 4 }}
                />
                <Typography variant="body2">32 GB / 100 GB</Typography>
              </Box>
            </Box>

            <Box>
              <Typography variant="body2" color="text.secondary">Active Queries</Typography>
              <Typography variant="h4">84</Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* System Metrics */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          System Metrics (Last 24 Hours)
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="body2" color="text.secondary">Total Requests</Typography>
            <Typography variant="h4">1.2M</Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="body2" color="text.secondary">Error Rate</Typography>
            <Typography variant="h4" color="success.main">0.03%</Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="body2" color="text.secondary">Avg Response Time</Typography>
            <Typography variant="h4">95ms</Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="body2" color="text.secondary">Active Users</Typography>
            <Typography variant="h4">248</Typography>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
}

