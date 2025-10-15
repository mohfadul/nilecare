import { Container, Typography, Paper, Box, Grid, Card, CardContent, Button } from '@mui/material';
import { authStore } from '../../store/authStore';
import { Medication, Inventory, Warning, CheckCircle } from '@mui/icons-material';

export function PharmacistDashboard() {
  const user = authStore((state) => state.user);

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" gutterBottom>
        Pharmacy Dashboard
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Pharmacy operations overview
      </Typography>

      {/* Pharmacy Stats */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <Medication color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Pending Prescriptions</Typography>
              </Box>
              <Typography variant="h3">23</Typography>
              <Typography variant="body2" color="text.secondary">
                Awaiting dispensing
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <CheckCircle color="success" sx={{ mr: 1 }} />
                <Typography variant="h6">Dispensed Today</Typography>
              </Box>
              <Typography variant="h3" color="success.main">67</Typography>
              <Typography variant="body2" color="text.secondary">
                Prescriptions filled
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <Warning color="warning" sx={{ mr: 1 }} />
                <Typography variant="h6">Drug Interactions</Typography>
              </Box>
              <Typography variant="h3" color="warning.main">3</Typography>
              <Typography variant="body2" color="text.secondary">
                Require review
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <Inventory color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Low Stock Items</Typography>
              </Box>
              <Typography variant="h3" color="error">8</Typography>
              <Typography variant="body2" color="text.secondary">
                Need reordering
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Prescription Queue */}
      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Prescription Queue
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Pending prescriptions will appear here
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Button variant="contained" size="small" sx={{ mr: 1 }}>Fill Prescription</Button>
              <Button variant="outlined" size="small">View Queue</Button>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Alerts & Warnings
            </Typography>
            <Typography variant="body2" color="warning.main" gutterBottom>
              ⚠ 3 Drug interactions
            </Typography>
            <Typography variant="body2" color="error" gutterBottom>
              ⚠ 8 Low stock items
            </Typography>
            <Typography variant="body2" color="warning.main">
              ⚠ 2 Expiring soon
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Button variant="outlined" size="small">View All Alerts</Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Inventory Management */}
      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Inventory Management
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Stock levels and ordering
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Button variant="outlined" size="small" sx={{ mr: 1 }}>Check Stock</Button>
              <Button variant="outlined" size="small">Create Order</Button>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Drug Information
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Lookup and verification
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Button variant="outlined" size="small" sx={{ mr: 1 }}>Search Drug</Button>
              <Button variant="outlined" size="small">Interaction Check</Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
              <Button variant="contained">Dispense Medication</Button>
              <Button variant="outlined">Search Prescription</Button>
              <Button variant="outlined">Check Interactions</Button>
              <Button variant="outlined">Inventory Count</Button>
              <Button variant="outlined">Generate Report</Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

