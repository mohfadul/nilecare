import { Container, Typography, Paper, Box, Grid, Card, CardContent, Button } from '@mui/material';
import { authStore } from '../../store/authStore';
import { Receipt, AttachMoney, PendingActions, CheckCircle } from '@mui/icons-material';

export function BillingClerkDashboard() {
  const user = authStore((state) => state.user);

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" gutterBottom>
        Billing Dashboard
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Financial operations overview
      </Typography>

      {/* Financial Stats */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <Receipt color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Pending Invoices</Typography>
              </Box>
              <Typography variant="h3">34</Typography>
              <Typography variant="body2" color="text.secondary">
                Total: 125,500 SDG
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <AttachMoney color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Today's Revenue</Typography>
              </Box>
              <Typography variant="h3">42,300</Typography>
              <Typography variant="body2" color="text.secondary">
                SDG
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <PendingActions color="warning" sx={{ mr: 1 }} />
                <Typography variant="h6">Overdue Payments</Typography>
              </Box>
              <Typography variant="h3" color="warning.main">12</Typography>
              <Typography variant="body2" color="text.secondary">
                Total: 35,200 SDG
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <CheckCircle color="success" sx={{ mr: 1 }} />
                <Typography variant="h6">Processed Today</Typography>
              </Box>
              <Typography variant="h3" color="success.main">28</Typography>
              <Typography variant="body2" color="text.secondary">
                Payments received
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Pending Actions */}
      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Pending Invoices
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Invoices awaiting payment will appear here
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Button variant="contained" size="small" sx={{ mr: 1 }}>Process Payments</Button>
              <Button variant="outlined" size="small">Generate Report</Button>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Insurance Claims
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Pending: 15
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Approved: 23
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Button variant="outlined" size="small">Manage Claims</Button>
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
              <Button variant="contained">Create Invoice</Button>
              <Button variant="contained">Record Payment</Button>
              <Button variant="outlined">Search Invoice</Button>
              <Button variant="outlined">Generate Statement</Button>
              <Button variant="outlined">Submit Claim</Button>
              <Button variant="outlined">View Reports</Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

