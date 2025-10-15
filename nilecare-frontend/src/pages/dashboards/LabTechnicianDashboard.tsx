import { Container, Typography, Paper, Box, Grid, Card, CardContent, Button } from '@mui/material';
import { authStore } from '../../store/authStore';
import { Science, PendingActions, CheckCircle, Assignment } from '@mui/icons-material';

export function LabTechnicianDashboard() {
  const user = authStore((state) => state.user);

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" gutterBottom>
        Laboratory Dashboard
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Lab operations overview
      </Typography>

      {/* Lab Stats */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <Science color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Pending Tests</Typography>
              </Box>
              <Typography variant="h3">18</Typography>
              <Typography variant="body2" color="text.secondary">
                Awaiting processing
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <PendingActions color="warning" sx={{ mr: 1 }} />
                <Typography variant="h6">In Progress</Typography>
              </Box>
              <Typography variant="h3" color="warning.main">7</Typography>
              <Typography variant="body2" color="text.secondary">
                Currently running
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <CheckCircle color="success" sx={{ mr: 1 }} />
                <Typography variant="h6">Completed Today</Typography>
              </Box>
              <Typography variant="h3" color="success.main">42</Typography>
              <Typography variant="body2" color="text.secondary">
                Ready for review
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <Assignment color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Urgent Tests</Typography>
              </Box>
              <Typography variant="h3" color="error">5</Typography>
              <Typography variant="body2" color="text.secondary">
                High priority
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Test Queue */}
      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Test Queue
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Ordered tests will appear here
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Button variant="contained" size="small" sx={{ mr: 1 }}>Start Test</Button>
              <Button variant="outlined" size="small">View Queue</Button>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Equipment Status
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              All systems operational
            </Typography>
            <Typography variant="body2" color="success.main">
              ✓ Analyzer A: Ready
            </Typography>
            <Typography variant="body2" color="success.main">
              ✓ Analyzer B: Ready
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Button variant="outlined" size="small">View Details</Button>
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
              <Button variant="contained">Enter Results</Button>
              <Button variant="contained">View Pending</Button>
              <Button variant="outlined">Sample Receipt</Button>
              <Button variant="outlined">Quality Control</Button>
              <Button variant="outlined">Inventory Check</Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

