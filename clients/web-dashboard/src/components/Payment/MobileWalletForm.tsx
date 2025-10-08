/**
 * Mobile Wallet Payment Form
 * For Zain Cash, MTN Money, Sudani Cash payments
 */

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent
} from '@mui/material';
import { QRCodeSVG } from 'qrcode.react';
import DOMPurify from 'dompurify';

interface MobileWalletFormProps {
  invoice: any;
  provider: any;
  onPaymentInitiated: (result: any) => void;
  onCancel?: () => void;
}

const MobileWalletForm: React.FC<MobileWalletFormProps> = ({
  invoice,
  provider,
  onPaymentInitiated,
  onCancel
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [qrCodeData, setQrCodeData] = useState('');
  const [paymentUrl, setPaymentUrl] = useState('');
  const [showQRDialog, setShowQRDialog] = useState(false);

  /**
   * Validate Sudan phone number
   */
  const validatePhoneNumber = (phone: string): boolean => {
    const sudanPhoneRegex = /^\+249[0-9]{9}$/;
    return sudanPhoneRegex.test(phone);
  };

  /**
   * Format phone number as user types
   */
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;

    // Auto-add +249 prefix
    if (!value.startsWith('+249')) {
      if (value.startsWith('249')) {
        value = '+' + value;
      } else if (value.startsWith('0')) {
        value = '+249' + value.substring(1);
      } else if (value.length > 0 && !value.startsWith('+')) {
        value = '+249' + value;
      }
    }

    setPhoneNumber(value);
  };

  /**
   * Submit payment
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate phone number
    if (!validatePhoneNumber(phoneNumber)) {
      setError('Invalid Sudan phone number. Format: +249XXXXXXXXX');
      return;
    }

    try {
      setLoading(true);

      // Call payment API
      const response = await fetch('/api/v1/payments/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          invoiceId: invoice.id,
          patientId: invoice.patientId,
          facilityId: invoice.facilityId,
          providerName: provider.id,
          amount: invoice.totalAmount,
          currency: invoice.currency || 'SDG',
          phoneNumber: phoneNumber,
          paymentMethodDetails: {
            phoneNumber: phoneNumber,
            walletName: provider.displayName
          }
        })
      });

      const result = await response.json();

      if (result.success) {
        // Check if payment URL or QR code is provided
        if (result.data.paymentUrl) {
          setPaymentUrl(result.data.paymentUrl);
          // Redirect to payment URL
          window.location.href = result.data.paymentUrl;
        } else if (result.data.qrCode) {
          // Show QR code dialog
          setQrCodeData(result.data.qrCode);
          setShowQRDialog(true);
        } else {
          // Payment completed immediately
          onPaymentInitiated(result.data);
        }
      } else {
        setError(result.error || 'Payment initiation failed');
      }

    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Calculate fee
   */
  const calculateFee = (): number => {
    return Math.round(invoice.totalAmount * (provider.feePercentage / 100) * 100) / 100;
  };

  /**
   * Calculate total with fee
   */
  const calculateTotal = (): number => {
    return invoice.totalAmount + calculateFee();
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {provider.displayName}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Mobile Wallet Number"
            value={phoneNumber}
            onChange={handlePhoneChange}
            placeholder="+249XXXXXXXXX"
            helperText="Enter your mobile wallet number in Sudan format"
            required
            disabled={loading}
            error={phoneNumber.length > 0 && !validatePhoneNumber(phoneNumber)}
            sx={{ mb: 2 }}
          />

          <Box sx={{ mb: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography variant="body2">Invoice Amount:</Typography>
              <Typography variant="body2">
                {invoice.totalAmount.toLocaleString()} {invoice.currency}
              </Typography>
            </Box>

            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography variant="body2">Transaction Fee ({provider.feePercentage}%):</Typography>
              <Typography variant="body2">
                {calculateFee().toLocaleString()} {invoice.currency}
              </Typography>
            </Box>

            <Box display="flex" justifyContent="space-between" sx={{ borderTop: '1px solid #ddd', pt: 1 }}>
              <Typography variant="body1" fontWeight="bold">Total to Pay:</Typography>
              <Typography variant="body1" fontWeight="bold" color="primary">
                {calculateTotal().toLocaleString()} {invoice.currency}
              </Typography>
            </Box>
          </Box>

          <Alert severity="info" sx={{ mb: 2 }}>
            <strong>Processing Time:</strong> {provider.processingTime}
            <br />
            You will receive an OTP to confirm the payment on your mobile wallet.
          </Alert>

          <Box display="flex" gap={2}>
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading || !validatePhoneNumber(phoneNumber)}
            >
              {loading ? <CircularProgress size={24} /> : 'Pay Now'}
            </Button>

            {onCancel && (
              <Button
                variant="outlined"
                onClick={onCancel}
                disabled={loading}
              >
                Cancel
              </Button>
            )}
          </Box>
        </Box>

        {/* QR Code Dialog */}
        <Dialog open={showQRDialog} onClose={() => setShowQRDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Scan QR Code to Pay</DialogTitle>
          <DialogContent>
            <Box display="flex" flexDirection="column" alignItems="center" p={3}>
              <Typography variant="body1" gutterBottom>
                Scan this QR code with your {provider.displayName} app
              </Typography>

              {qrCodeData && (
                <Box my={3}>
                  <QRCodeSVG value={qrCodeData} size={256} />
                </Box>
              )}

              <Typography variant="body2" color="text.secondary">
                Amount: {calculateTotal().toLocaleString()} {invoice.currency}
              </Typography>

              <Alert severity="info" sx={{ mt: 2, width: '100%' }}>
                Waiting for payment confirmation...
              </Alert>

              <Button
                variant="outlined"
                onClick={() => setShowQRDialog(false)}
                sx={{ mt: 2 }}
              >
                Close
              </Button>
            </Box>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default MobileWalletForm;

