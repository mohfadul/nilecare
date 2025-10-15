import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Grid,
  TextField,
  MenuItem,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  CardActions,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Divider,
} from '@mui/material';
import { ArrowBack, Payment, CreditCard, AccountBalance, PhoneAndroid } from '@mui/icons-material';
import { useInvoice } from '../../hooks/useBilling';
import { usePaymentProviders, useCreatePayment } from '../../hooks/usePayments';
import { format } from 'date-fns';

export function PaymentCheckoutPage() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();
  const [selectedProvider, setSelectedProvider] = useState('');
  const [amount, setAmount] = useState('');

  const { data: invoiceData, isLoading: invoiceLoading } = useInvoice(invoiceId ? parseInt(invoiceId) : undefined);
  const { data: providersData, isLoading: providersLoading } = usePaymentProviders();
  const createPayment = useCreatePayment();

  const invoice = invoiceData?.data?.invoice;
  const providers = providersData?.data?.providers || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!invoice || !selectedProvider) return;

    try {
      const response = await createPayment.mutateAsync({
        patientId: invoice.patientId,
        amount: parseFloat(amount) || invoice.balanceAmount,
        currency: invoice.currency,
        provider: selectedProvider,
        description: `Payment for Invoice ${invoice.invoiceNumber}`,
        invoiceId: invoice.id,
        returnUrl: `${window.location.origin}/billing/payments/success`,
        cancelUrl: `${window.location.origin}/billing/payments/cancel`,
      });

      const payment = response.data?.payment;

      // If payment has a URL, redirect to payment gateway
      if (payment?.paymentUrl) {
        window.location.href = payment.paymentUrl;
      } else {
        // For cash/bank transfer, redirect to confirmation
        navigate(`/billing/payments/${payment?.id}`);
      }
    } catch (error) {
      console.error('Failed to process payment:', error);
    }
  };

  if (invoiceLoading || providersLoading) {
    return (
      <Container maxWidth="md">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!invoice) {
    return (
      <Container maxWidth="md">
        <Alert severity="error">Invoice not found.</Alert>
        <Button onClick={() => navigate('/billing/invoices')} sx={{ mt: 2 }}>
          Back to Invoices
        </Button>
      </Container>
    );
  }

  const getProviderIcon = (type: string) => {
    switch (type) {
      case 'mobile_wallet': return <PhoneAndroid />;
      case 'card': return <CreditCard />;
      case 'bank_transfer': return <AccountBalance />;
      default: return <Payment />;
    }
  };

  return (
    <Container maxWidth="md">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate(`/billing/invoices/${invoice.id}`)}>
          Back to Invoice
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Invoice Summary */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3, position: 'sticky', top: 20 }}>
            <Typography variant="h6" gutterBottom>
              Invoice Summary
            </Typography>
            <Divider sx={{ my: 2 }} />
            
            <Box mb={2}>
              <Typography variant="body2" color="text.secondary">
                Invoice Number
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {invoice.invoiceNumber}
              </Typography>
            </Box>

            <Box mb={2}>
              <Typography variant="body2" color="text.secondary">
                Patient
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {invoice.patientName || `Patient #${invoice.patientId}`}
              </Typography>
            </Box>

            <Box mb={2}>
              <Typography variant="body2" color="text.secondary">
                Due Date
              </Typography>
              <Typography variant="body1">
                {format(new Date(invoice.dueDate), 'PPP')}
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box mb={1} display="flex" justifyContent="space-between">
              <Typography variant="body1">Total Amount:</Typography>
              <Typography variant="body1" fontWeight="medium">
                {invoice.totalAmount.toLocaleString()} {invoice.currency}
              </Typography>
            </Box>

            <Box mb={1} display="flex" justifyContent="space-between">
              <Typography variant="body1" color="success.main">Amount Paid:</Typography>
              <Typography variant="body1" color="success.main">
                {invoice.paidAmount.toLocaleString()} {invoice.currency}
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box display="flex" justifyContent="space-between">
              <Typography variant="h6">Balance Due:</Typography>
              <Typography variant="h6" color="primary.main">
                {invoice.balanceAmount.toLocaleString()} {invoice.currency}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Payment Form */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Select Payment Method
            </Typography>

            {createPayment.error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                Failed to process payment. Please try again.
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
              <FormControl component="fieldset" fullWidth sx={{ mt: 2 }}>
                <FormLabel component="legend">Payment Provider</FormLabel>
                <RadioGroup
                  value={selectedProvider}
                  onChange={(e) => setSelectedProvider(e.target.value)}
                >
                  {providers.map((provider) => (
                    <Card key={provider.id} variant="outlined" sx={{ mb: 2 }}>
                      <CardContent>
                        <FormControlLabel
                          value={provider.id}
                          control={<Radio />}
                          label={
                            <Box display="flex" alignItems="center" width="100%">
                              {getProviderIcon(provider.type)}
                              <Box ml={2}>
                                <Typography variant="body1" fontWeight="medium">
                                  {provider.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {provider.type.replace('_', ' ')} • {provider.currencies.join(', ')}
                                </Typography>
                              </Box>
                            </Box>
                          }
                          sx={{ width: '100%', m: 0 }}
                        />
                      </CardContent>
                    </Card>
                  ))}
                </RadioGroup>
              </FormControl>

              <TextField
                label="Payment Amount"
                type="number"
                fullWidth
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={invoice.balanceAmount.toString()}
                helperText={`Full balance: ${invoice.balanceAmount.toLocaleString()} ${invoice.currency}`}
                sx={{ mt: 3 }}
                InputProps={{
                  endAdornment: <Typography variant="body2">{invoice.currency}</Typography>
                }}
              />

              <Box display="flex" gap={2} justifyContent="flex-end" sx={{ mt: 3 }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate(`/billing/invoices/${invoice.id}`)}
                  disabled={createPayment.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<Payment />}
                  disabled={!selectedProvider || createPayment.isPending}
                >
                  {createPayment.isPending ? 'Processing...' : 'Proceed to Payment'}
                </Button>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Existing Payments */}
      {payments.length > 0 && (
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Previous Payments
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Reference</TableCell>
                  <TableCell>Provider</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      {payment.confirmedAt ? format(new Date(payment.confirmedAt), 'PPp') : '-'}
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" fontFamily="monospace">
                        {payment.merchantReference || payment.id}
                      </Typography>
                    </TableCell>
                    <TableCell>{payment.provider}</TableCell>
                    <TableCell align="right">
                      {payment.amount.toLocaleString()} {payment.currency}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={payment.status}
                        size="small"
                        color={payment.status === 'completed' ? 'success' : 'default'}
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

