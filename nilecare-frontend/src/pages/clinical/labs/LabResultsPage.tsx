import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Divider,
} from '@mui/material';
import { ArrowBack, Print } from '@mui/icons-material';
import { useLabOrder, useLabResults } from '../../../hooks/useLabs';
import { format } from 'date-fns';

export function LabResultsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: orderData, isLoading: orderLoading } = useLabOrder(id ? parseInt(id) : undefined);
  const { data: resultsData, isLoading: resultsLoading } = useLabResults(id ? parseInt(id) : undefined);

  const isLoading = orderLoading || resultsLoading;

  if (isLoading) {
    return (
      <Container maxWidth="lg">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  const labOrder = orderData?.data?.labOrder;
  const results = resultsData?.data?.results || [];

  if (!labOrder) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error">Lab order not found.</Alert>
        <Button onClick={() => navigate('/clinical/labs')} sx={{ mt: 2 }}>
          Back to Lab Orders
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/clinical/labs')}>
          Back to Lab Orders
        </Button>
        <Button variant="outlined" startIcon={<Print />}>
          Print Results
        </Button>
      </Box>

      {/* Lab Order Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          {labOrder.testName}
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Order ID: {labOrder.id} | Test Code: {labOrder.testCode}
        </Typography>

        <Divider sx={{ my: 2 }} />

        <Box display="flex" gap={4} flexWrap="wrap">
          <Box>
            <Typography variant="caption" color="text.secondary">
              Patient
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {labOrder.patientName || `Patient #${labOrder.patientId}`}
            </Typography>
          </Box>

          <Box>
            <Typography variant="caption" color="text.secondary">
              Ordered By
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {labOrder.providerName || `Provider #${labOrder.orderedBy}`}
            </Typography>
          </Box>

          <Box>
            <Typography variant="caption" color="text.secondary">
              Order Date
            </Typography>
            <Typography variant="body1">
              {labOrder.orderDate ? format(new Date(labOrder.orderDate), 'PPpp') : '-'}
            </Typography>
          </Box>

          <Box>
            <Typography variant="caption" color="text.secondary">
              Priority
            </Typography>
            <Typography variant="body1">
              <Chip label={labOrder.priority.toUpperCase()} size="small" color={labOrder.priority === 'stat' ? 'error' : labOrder.priority === 'urgent' ? 'warning' : 'default'} />
            </Typography>
          </Box>

          <Box>
            <Typography variant="caption" color="text.secondary">
              Status
            </Typography>
            <Typography variant="body1">
              <Chip label={labOrder.status} size="small" color={labOrder.status === 'completed' ? 'success' : 'primary'} />
            </Typography>
          </Box>
        </Box>

        {labOrder.notes && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Clinical Notes
            </Typography>
            <Typography variant="body2">{labOrder.notes}</Typography>
          </Box>
        )}
      </Paper>

      {/* Lab Results */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Test Results
        </Typography>

        {results.length === 0 ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            {labOrder.status === 'completed' 
              ? 'Results are being processed.' 
              : 'Results will appear here once the test is completed.'}
          </Alert>
        ) : (
          <TableContainer sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Test Name</TableCell>
                  <TableCell>Value</TableCell>
                  <TableCell>Unit</TableCell>
                  <TableCell>Reference Range</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Interpretation</TableCell>
                  <TableCell>Performed At</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {results.map((result) => (
                  <TableRow 
                    key={result.id}
                    sx={{
                      backgroundColor: result.isAbnormal ? 'error.light' : 'inherit',
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {result.testName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography 
                        variant="body1" 
                        fontWeight="bold"
                        color={result.isAbnormal ? 'error.main' : 'text.primary'}
                      >
                        {result.value}
                      </Typography>
                    </TableCell>
                    <TableCell>{result.unit}</TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {result.referenceRange}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={result.isAbnormal ? 'ABNORMAL' : 'NORMAL'}
                        size="small"
                        color={result.isAbnormal ? 'error' : 'success'}
                      />
                    </TableCell>
                    <TableCell>
                      {result.interpretation || '-'}
                    </TableCell>
                    <TableCell>
                      {result.performedAt ? format(new Date(result.performedAt), 'MMM dd, yyyy HH:mm') : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Container>
  );
}

