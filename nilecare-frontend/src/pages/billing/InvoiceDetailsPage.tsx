import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  CircularProgress,
  Alert,
  Grid,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import { ArrowBack, Print, Payment as PaymentIcon } from '@mui/icons-material';
import { useInvoice } from '../../hooks/useBilling';
import { useInvoicePayments } from '../../hooks/usePayments';
import { format } from 'date-fns';

export function InvoiceDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: invoiceData, isLoading } = useInvoice(id ? parseInt(id) : undefined);
  const { data: paymentsData } = useInvoicePayments(id ? parseInt(id) : undefined);

  if (isLoading) {
    return (
      <Container maxWidth="lg">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  const invoice = invoiceData?.data?.invoice;
  const lineItems = invoiceData?.data?.lineItems || [];
  const payments = paymentsData?.data?.payments || [];

  if (!invoice) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error">Invoice not found.</Alert>
        <Button onClick={() => navigate('/billing/invoices')} sx={{ mt: 2 }}>
          Back to Invoices
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/billing/invoices')}>
          Back to Invoices
        </Button>
        <Box display="flex" gap={1}>
          <Button variant="outlined" startIcon={<Print />}>
            Print Invoice
          </Button>
          {invoice.balanceAmount > 0 && invoice.status !== 'cancelled' && (
            <Button
              variant="contained"
              startIcon={<PaymentIcon />}
              onClick={() => navigate(`/billing/payments/checkout/${invoice.id}`)}
            >
              Process Payment
            </Button>
          )}
        </Box>
      </Box>

      {/* Invoice Header */}
      <Paper sx={{ p: 4, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h5" gutterBottom>
              Invoice {invoice.invoiceNumber}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Type: {invoice.invoiceType}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6} textAlign="right">
            <Chip
              label={invoice.status.toUpperCase()}
              color={invoice.status === 'paid' ? 'success' : invoice.status === 'overdue' ? 'error' : 'primary'}
              sx={{ fontSize: '1rem', padding: '10px' }}
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Bill To
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {invoice.patientName || `Patient #${invoice.patientId}`}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Patient ID: {invoice.patientId}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Invoice Details
            </Typography>
            <Typography variant="body2">
              <strong>Invoice Date:</strong> {format(new Date(invoice.invoiceDate), 'PPP')}
            </Typography>
            <Typography variant="body2">
              <strong>Due Date:</strong> {format(new Date(invoice.dueDate), 'PPP')}
            </Typography>
            <Typography variant="body2">
              <strong>Facility:</strong> {invoice.facilityName || `Facility #${invoice.facilityId}`}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Line Items */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Line Items
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Item</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="center">Quantity</TableCell>
                <TableCell align="right">Unit Price</TableCell>
                <TableCell align="right">Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {lineItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {item.itemName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {item.itemType}
                    </Typography>
                  </TableCell>
                  <TableCell>{item.description || '-'}</TableCell>
                  <TableCell align="center">{item.quantity}</TableCell>
                  <TableCell align="right">
                    {item.unitPrice.toLocaleString()} {invoice.currency}
                  </TableCell>
                  <TableCell align="right">
                    {item.finalAmount.toLocaleString()} {invoice.currency}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Divider sx={{ my: 2 }} />

        {/* Totals */}
        <Box display="flex" justifyContent="flex-end">
          <Box sx={{ minWidth: 300 }}>
            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography variant="body1">Subtotal:</Typography>
              <Typography variant="body1">
                {invoice.totalAmount.toLocaleString()} {invoice.currency}
              </Typography>
            </Box>
            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography variant="body1" color="success.main">Amount Paid:</Typography>
              <Typography variant="body1" color="success.main">
                {invoice.paidAmount.toLocaleString()} {invoice.currency}
              </Typography>
            </Box>
            <Divider sx={{ my: 1 }} />
            <Box display="flex" justifyContent="space-between">
              <Typography variant="h6">Balance Due:</Typography>
              <Typography variant="h6" color={invoice.balanceAmount > 0 ? 'error.main' : 'text.primary'}>
                {invoice.balanceAmount.toLocaleString()} {invoice.currency}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Payment History */}
      {payments.length > 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Payment History
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Payment ID</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Provider</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">
                        {payment.merchantReference || payment.id}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {payment.confirmedAt ? format(new Date(payment.confirmedAt), 'PPpp') : '-'}
                    </TableCell>
                    <TableCell>
                      <Chip label={payment.provider} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell align="right">
                      {payment.amount.toLocaleString()} {payment.currency}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={payment.status}
                        size="small"
                        color={payment.status === 'completed' ? 'success' : 'primary'}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Container>
  );
}

