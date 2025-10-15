/**
 * Payment Verification Dashboard
 * Admin dashboard for verifying pending payments
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  Tooltip
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Visibility,
  Refresh,
  FilterList
} from '@mui/icons-material';
import { sanitizeText } from '../../utils/sanitize';

interface PendingPayment {
  paymentId: string;
  merchantReference: string;
  transactionId: string;
  amount: number;
  currency: string;
  patientName: string;
  facilityName: string;
  providerName: string;
  createdAt: string;
  minutesPending: number;
  evidenceUrls?: Array<{
    type: string;
    url: string;
  }>;
}

const PaymentVerificationDashboard: React.FC = () => {
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PendingPayment | null>(null);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showVerifyDialog, setShowVerifyDialog] = useState(false);
  const [verifyAction, setVerifyAction] = useState<'approve' | 'reject'>('approve');
  
  // Filters
  const [selectedProvider, setSelectedProvider] = useState('all');
  const [selectedFacility, setSelectedFacility] = useState('all');

  useEffect(() => {
    loadPendingPayments();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadPendingPayments, 30000);
    return () => clearInterval(interval);
  }, [selectedProvider, selectedFacility]);

  /**
   * Load pending payments
   */
  const loadPendingPayments = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (selectedProvider !== 'all') params.append('provider', selectedProvider);
      if (selectedFacility !== 'all') params.append('facilityId', selectedFacility);

      const response = await fetch(
        `/api/v1/payments/pending-verification?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      const result = await response.json();

      if (result.success) {
        setPendingPayments(result.data);
      }

    } catch (err: any) {
      console.error('Error loading pending payments:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * View payment details
   */
  const viewDetails = (payment: PendingPayment) => {
    setSelectedPayment(payment);
    setShowDetailsDialog(true);
  };

  /**
   * Open verification dialog
   */
  const openVerifyDialog = (payment: PendingPayment, action: 'approve' | 'reject') => {
    setSelectedPayment(payment);
    setVerifyAction(action);
    setVerificationNotes('');
    setShowVerifyDialog(true);
  };

  /**
   * Verify payment
   */
  const handleVerifyPayment = async () => {
    if (!selectedPayment) return;

    try {
      const response = await fetch('/api/v1/payments/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          paymentId: selectedPayment.paymentId,
          verificationMethod: 'manual',
          verifiedBy: localStorage.getItem('userId'), // Would come from auth context
          verificationNotes: verificationNotes
        })
      });

      const result = await response.json();

      if (result.success) {
        // Refresh list
        await loadPendingPayments();
        
        // Close dialog
        setShowVerifyDialog(false);
        setSelectedPayment(null);

        // Show success message
        alert(`Payment ${verifyAction === 'approve' ? 'approved' : 'rejected'} successfully`);
      } else {
        alert('Verification failed: ' + result.error);
      }

    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  /**
   * Get status color
   */
  const getStatusColor = (minutesPending: number): 'success' | 'warning' | 'error' => {
    if (minutesPending < 30) return 'success';
    if (minutesPending < 120) return 'warning';
    return 'error';
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Payment Verification Queue</Typography>
        
        <Box display="flex" gap={2}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Provider</InputLabel>
            <Select
              value={selectedProvider}
              label="Provider"
              onChange={(e) => setSelectedProvider(e.target.value)}
            >
              <MenuItem value="all">All Providers</MenuItem>
              <MenuItem value="zain_cash">Zain Cash</MenuItem>
              <MenuItem value="mtn_money">MTN Money</MenuItem>
              <MenuItem value="bank_of_khartoum">Bank of Khartoum</MenuItem>
              <MenuItem value="cash">Cash</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadPendingPayments}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {loading && pendingPayments.length === 0 ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {pendingPayments.length === 0 ? (
            <Alert severity="success">
              No pending payments for verification
            </Alert>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Transaction ID</TableCell>
                    <TableCell>Patient</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Provider</TableCell>
                    <TableCell>Time Pending</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pendingPayments.map((payment) => (
                    <TableRow key={payment.paymentId}>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace">
                          {payment.transactionId}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {payment.merchantReference}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2">{payment.patientName}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {payment.facilityName}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {payment.amount.toLocaleString()} {payment.currency}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Chip 
                          label={payment.providerName} 
                          size="small" 
                          variant="outlined"
                        />
                      </TableCell>

                      <TableCell>
                        <Chip
                          label={`${payment.minutesPending} min`}
                          size="small"
                          color={getStatusColor(payment.minutesPending)}
                        />
                      </TableCell>

                      <TableCell>
                        <Box display="flex" gap={1}>
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() => viewDetails(payment)}
                            >
                              <Visibility />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Approve">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => openVerifyDialog(payment, 'approve')}
                            >
                              <CheckCircle />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Reject">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => openVerifyDialog(payment, 'reject')}
                            >
                              <Cancel />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}

      {/* Payment Details Dialog */}
      <Dialog
        open={showDetailsDialog}
        onClose={() => setShowDetailsDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Payment Details</DialogTitle>
        <DialogContent>
          {selectedPayment && (
            <Box>
              <Typography variant="body1" gutterBottom>
                <strong>Transaction ID:</strong> {selectedPayment.transactionId}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Merchant Reference:</strong> {selectedPayment.merchantReference}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Amount:</strong> {selectedPayment.amount.toLocaleString()} {selectedPayment.currency}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Patient:</strong> {selectedPayment.patientName}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Facility:</strong> {selectedPayment.facilityName}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Provider:</strong> {selectedPayment.providerName}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Created:</strong> {new Date(selectedPayment.createdAt).toLocaleString()}
              </Typography>

              {selectedPayment.evidenceUrls && selectedPayment.evidenceUrls.length > 0 && (
                <Box mt={2}>
                  <Typography variant="h6" gutterBottom>Evidence</Typography>
                  {selectedPayment.evidenceUrls.map((evidence, index) => (
                    <Box key={index} mb={1}>
                      <a href={evidence.url} target="_blank" rel="noopener noreferrer">
                        {evidence.type} - View Document
                      </a>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDetailsDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Verification Dialog */}
      <Dialog
        open={showVerifyDialog}
        onClose={() => setShowVerifyDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {verifyAction === 'approve' ? 'Approve Payment' : 'Reject Payment'}
        </DialogTitle>
        <DialogContent>
          {selectedPayment && (
            <Box>
              <Alert severity={verifyAction === 'approve' ? 'success' : 'warning'} sx={{ mb: 2 }}>
                You are about to {verifyAction} payment of{' '}
                <strong>{selectedPayment.amount.toLocaleString()} {selectedPayment.currency}</strong>
              </Alert>

              <TextField
                fullWidth
                multiline
                rows={4}
                label="Verification Notes"
                value={verificationNotes}
                onChange={(e) => {
                  // Sanitize input as user types
                  const sanitized = sanitizeText(e.target.value);
                  setVerificationNotes(sanitized);
                }}
                placeholder={
                  verifyAction === 'approve'
                    ? 'Enter verification notes (optional)'
                    : 'Enter rejection reason (required)'
                }
                required={verifyAction === 'reject'}
                helperText={
                  verifyAction === 'reject'
                    ? 'Please provide a reason for rejection'
                    : 'Optional notes about the verification'
                }
                inputProps={{
                  maxLength: 1000 // Limit input length
                }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowVerifyDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            color={verifyAction === 'approve' ? 'success' : 'error'}
            onClick={handleVerifyPayment}
            disabled={verifyAction === 'reject' && !verificationNotes}
          >
            {verifyAction === 'approve' ? 'Approve Payment' : 'Reject Payment'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PaymentVerificationDashboard;

