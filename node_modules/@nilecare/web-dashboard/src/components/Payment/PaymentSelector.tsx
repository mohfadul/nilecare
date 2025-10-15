/**
 * Payment Selector Component
 * Allows users to select and initiate payments using various payment methods
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Radio,
  RadioGroup,
  FormControlLabel,
  Button,
  CircularProgress,
  Alert,
  Chip
} from '@mui/material';
import {
  CreditCard,
  AccountBalance,
  Phone,
  Payment as PaymentIcon,
  LocalAtm
} from '@mui/icons-material';

// Import payment method components
import BankPaymentForm from './BankPaymentForm';
import MobileWalletForm from './MobileWalletForm';
import CashPaymentForm from './CashPaymentForm';

interface PaymentProvider {
  id: string;
  name: string;
  displayName: string;
  type: 'bank_card' | 'local_bank' | 'mobile_wallet' | 'cash' | 'cheque' | 'bank_transfer';
  logo: string;
  isActive: boolean;
  feePercentage: number;
  processingTime: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  patientId: string;
  facilityId: string;
  totalAmount: number;
  currency: string;
  status: string;
}

interface PaymentSelectorProps {
  invoice: Invoice;
  onPaymentCompleted: (payment: any) => void;
  onCancel?: () => void;
}

const PaymentSelector: React.FC<PaymentSelectorProps> = ({
  invoice,
  onPaymentCompleted,
  onCancel
}) => {
  const [availableProviders, setAvailableProviders] = useState<PaymentProvider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadAvailableProviders();
  }, []);

  /**
   * Load available payment providers
   */
  const loadAvailableProviders = async () => {
    try {
      setLoading(true);
      
      // In production: Fetch from API
      // const response = await fetch('/api/v1/payment-providers?active=true');
      // const providers = await response.json();
      
      // Mock data for demonstration
      const providers: PaymentProvider[] = [
        {
          id: 'zain_cash',
          name: 'Zain Cash',
          displayName: 'Zain Cash - Mobile Wallet',
          type: 'mobile_wallet',
          logo: '/assets/logos/zain-cash.png',
          isActive: true,
          feePercentage: 1.0,
          processingTime: 'Instant'
        },
        {
          id: 'mtn_money',
          name: 'MTN Money',
          displayName: 'MTN Mobile Money',
          type: 'mobile_wallet',
          logo: '/assets/logos/mtn-money.png',
          isActive: true,
          feePercentage: 1.0,
          processingTime: 'Instant'
        },
        {
          id: 'bank_of_khartoum',
          name: 'Bank of Khartoum',
          displayName: 'Bank of Khartoum',
          type: 'local_bank',
          logo: '/assets/logos/bank-of-khartoum.png',
          isActive: true,
          feePercentage: 1.5,
          processingTime: '1-2 hours'
        },
        {
          id: 'cash',
          name: 'Cash',
          displayName: 'Cash Payment',
          type: 'cash',
          logo: '/assets/logos/cash.png',
          isActive: true,
          feePercentage: 0,
          processingTime: 'Instant'
        }
      ];

      setAvailableProviders(providers);

    } catch (err: any) {
      setError('Failed to load payment methods');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Select payment provider
   */
  const selectProvider = (provider: PaymentProvider) => {
    if (provider.isActive) {
      setSelectedProvider(provider.id);
      setError('');
    }
  };

  /**
   * Get provider icon
   */
  const getProviderIcon = (type: string) => {
    switch (type) {
      case 'bank_card':
      case 'local_bank':
        return <AccountBalance />;
      case 'mobile_wallet':
        return <Phone />;
      case 'cash':
        return <LocalAtm />;
      default:
        return <PaymentIcon />;
    }
  };

  /**
   * Get selected provider details
   */
  const getSelectedProviderDetails = () => {
    return availableProviders.find(p => p.id === selectedProvider);
  };

  /**
   * Check if bank provider
   */
  const isBankProvider = (providerId: string): boolean => {
    const provider = availableProviders.find(p => p.id === providerId);
    return provider?.type === 'bank_card' || provider?.type === 'local_bank';
  };

  /**
   * Check if mobile provider
   */
  const isMobileProvider = (providerId: string): boolean => {
    const provider = availableProviders.find(p => p.id === providerId);
    return provider?.type === 'mobile_wallet';
  };

  /**
   * Check if cash provider
   */
  const isCashProvider = (providerId: string): boolean => {
    const provider = availableProviders.find(p => p.id === providerId);
    return provider?.type === 'cash';
  };

  /**
   * Handle payment initiated
   */
  const handlePaymentInitiated = (result: any) => {
    if (result.success) {
      onPaymentCompleted(result);
    } else {
      setError(result.message || 'Payment failed');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box className="payment-selector" p={3}>
      <Typography variant="h5" gutterBottom>
        Select Payment Method
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        <strong>Amount to Pay:</strong> {invoice.totalAmount.toLocaleString()} {invoice.currency}
        <br />
        <strong>Invoice:</strong> {invoice.invoiceNumber}
      </Alert>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {availableProviders.map((provider) => (
          <Grid item xs={12} sm={6} md={4} key={provider.id}>
            <Card
              sx={{
                cursor: provider.isActive ? 'pointer' : 'not-allowed',
                border: selectedProvider === provider.id ? '2px solid #1976d2' : '1px solid #e0e0e0',
                opacity: provider.isActive ? 1 : 0.5,
                transition: 'all 0.3s',
                '&:hover': {
                  boxShadow: provider.isActive ? 3 : 0
                }
              }}
              onClick={() => selectProvider(provider)}
            >
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  {getProviderIcon(provider.type)}
                  <Typography variant="h6" ml={1}>
                    {provider.displayName}
                  </Typography>
                </Box>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Fee: {provider.feePercentage}%
                </Typography>
                
                <Typography variant="body2" color="text.secondary">
                  Processing: {provider.processingTime}
                </Typography>

                {selectedProvider === provider.id && (
                  <Chip 
                    label="Selected" 
                    color="primary" 
                    size="small" 
                    sx={{ mt: 1 }}
                  />
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {selectedProvider && (
        <Box mt={3}>
          {isBankProvider(selectedProvider) && (
            <BankPaymentForm
              invoice={invoice}
              provider={getSelectedProviderDetails()!}
              onPaymentInitiated={handlePaymentInitiated}
              onCancel={onCancel}
            />
          )}

          {isMobileProvider(selectedProvider) && (
            <MobileWalletForm
              invoice={invoice}
              provider={getSelectedProviderDetails()!}
              onPaymentInitiated={handlePaymentInitiated}
              onCancel={onCancel}
            />
          )}

          {isCashProvider(selectedProvider) && (
            <CashPaymentForm
              invoice={invoice}
              provider={getSelectedProviderDetails()!}
              onPaymentInitiated={handlePaymentInitiated}
              onCancel={onCancel}
            />
          )}
        </Box>
      )}
    </Box>
  );
};

export default PaymentSelector;

