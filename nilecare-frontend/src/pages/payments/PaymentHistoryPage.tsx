import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import { AttachMoney, TrendingUp, CheckCircle, Warning } from '@mui/icons-material';
import { usePaymentHistory } from '../../hooks/usePayments';
import { format } from 'date-fns';
import { Payment } from '../../api/payments.api';

export function PaymentHistoryPage() {
  const navigate = useNavigate();
  const { data, isLoading, error } = usePaymentHistory();

  const getStatusColor = (status: Payment['status']) => {
    const colors: Record<Payment['status'], 'default' | 'primary' | 'success' | 'warning' | 'error'> = {
      'pending': 'primary',
      'processing': 'primary',
      'completed': 'success',
      'failed': 'error',
      'refunded': 'warning',
      'cancelled': 'error',
    };
    return colors[status] || 'default';
  };

  if (isLoading) {
    return (
      <Container maxWidth="xl">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl">
        <Alert severity="error">Failed to load payment history. Please try again.</Alert>
      </Container>
    );
  }

  const history = data?.data;
  const payments = history?.payments || [];

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" gutterBottom>
        Payment History
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        All payment transactions
      </Typography>

      {/* Summary Cards */}
      {history && (
        <Grid container spacing={3} sx={{ mt: 2, mb: 3 }}>
          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  <AttachMoney color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Total Payments</Typography>
                </Box>
                <Typography variant="h3">{history.totalPayments}</Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  <TrendingUp color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Total Amount</Typography>
                </Box>
                <Typography variant="h3">{history.totalAmount.toLocaleString()}</Typography>
                <Typography variant="caption" color="text.secondary">
                  SDG
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  <CheckCircle color="success" sx={{ mr: 1 }} />
                  <Typography variant="h6">Success Rate</Typography>
                </Box>
                <Typography variant="h3" color="success.main">
                  {history.successRate.toFixed(1)}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Payment List */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Payment ID</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Patient</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Provider</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {payments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                    No payment history found.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              payments.map((payment) => (
                <TableRow key={payment.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontFamily="monospace" fontSize="0.75rem">
                      {payment.merchantReference || payment.id}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {payment.confirmedAt 
                      ? format(new Date(payment.confirmedAt), 'MMM dd, yyyy HH:mm')
                      : format(new Date(payment.createdAt), 'MMM dd, yyyy HH:mm')
                    }
                  </TableCell>
                  <TableCell>
                    {payment.patientName || `Patient #${payment.patientId}`}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                      {payment.description}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={payment.provider} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body1" fontWeight="medium">
                      {payment.amount.toLocaleString()} {payment.currency}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={payment.status}
                      size="small"
                      color={getStatusColor(payment.status)}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}

