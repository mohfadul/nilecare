/**
 * Invoice List Page
 * View and manage patient invoices
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  IconButton,
  Chip,
  Typography,
  CircularProgress,
  Stack,
  TextField,
  MenuItem,
  Grid,
} from '@mui/material';
import {
  Add,
  Visibility,
  Payment as PaymentIcon,
  Receipt,
  Download,
} from '@mui/icons-material';
import { apiClient } from '../../services/api.client';
import { useSnackbar } from 'notistack';
import { format } from 'date-fns';

interface Invoice {
  id: string;
  invoiceNumber: string;
  patientId: string;
  patientName: string;
  facilityId: string;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  currency: string;
  status: 'draft' | 'pending' | 'paid' | 'partial' | 'overdue' | 'cancelled';
  dueDate: string;
  createdAt: string;
}

const InvoiceList: React.FC = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadInvoices();
  }, [page, rowsPerPage, statusFilter]);

  const loadInvoices = async () => {
    try {
      setLoading(true);

      // Mock data for now (replace with actual API call)
      const mockInvoices: Invoice[] = [
        {
          id: '1',
          invoiceNumber: 'INV-2025-001',
          patientId: 'p1',
          patientName: 'Ahmed Mohamed',
          facilityId: 'f1',
          totalAmount: 5000,
          paidAmount: 2000,
          balanceAmount: 3000,
          currency: 'SDG',
          status: 'partial',
          dueDate: '2025-10-15',
          createdAt: '2025-10-01',
        },
        {
          id: '2',
          invoiceNumber: 'INV-2025-002',
          patientId: 'p2',
          patientName: 'Fatima Ali',
          facilityId: 'f1',
          totalAmount: 3500,
          paidAmount: 3500,
          balanceAmount: 0,
          currency: 'SDG',
          status: 'paid',
          dueDate: '2025-10-10',
          createdAt: '2025-10-05',
        },
      ];

      setInvoices(mockInvoices);
      setTotalCount(mockInvoices.length);
    } catch (err: any) {
      enqueueSnackbar('Failed to load invoices', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string): 'default' | 'primary' | 'success' | 'warning' | 'error' => {
    const colors: Record<string, any> = {
      draft: 'default',
      pending: 'warning',
      paid: 'success',
      partial: 'info',
      overdue: 'error',
      cancelled: 'default',
    };
    return colors[status] || 'default';
  };

  const handlePayment = (invoice: Invoice) => {
    navigate(`/dashboard/payments/new?invoiceId=${invoice.id}`);
  };

  const handleDownload = async (invoiceId: string) => {
    enqueueSnackbar('Downloading invoice PDF...', { variant: 'info' });
    // Implement PDF download
  };

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Invoices / الفواتير
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/dashboard/billing/invoices/new')}
          size="large"
        >
          Create Invoice / إنشاء فاتورة
        </Button>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <Box p={2}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                select
                label="Status Filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="paid">Paid</MenuItem>
                <MenuItem value="partial">Partially Paid</MenuItem>
                <MenuItem value="overdue">Overdue</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </Box>
      </Card>

      {/* Invoices Table */}
      <Card>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Invoice #</strong></TableCell>
                <TableCell><strong>Patient</strong></TableCell>
                <TableCell><strong>Total Amount</strong></TableCell>
                <TableCell><strong>Paid</strong></TableCell>
                <TableCell><strong>Balance</strong></TableCell>
                <TableCell><strong>Due Date</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell align="right"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">
                      No invoices found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((invoice) => (
                  <TableRow key={invoice.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium" fontFamily="monospace">
                        {invoice.invoiceNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>{invoice.patientName}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {invoice.totalAmount.toLocaleString()} {invoice.currency}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="success.main">
                        {invoice.paidAmount.toLocaleString()} {invoice.currency}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        color={invoice.balanceAmount > 0 ? 'error.main' : 'success.main'}
                        fontWeight="bold"
                      >
                        {invoice.balanceAmount.toLocaleString()} {invoice.currency}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {format(new Date(invoice.dueDate), 'MMM dd, yyyy')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={invoice.status.toUpperCase()}
                        size="small"
                        color={getStatusColor(invoice.status)}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/dashboard/billing/invoices/${invoice.id}`)}
                      >
                        <Visibility fontSize="small" />
                      </IconButton>
                      {invoice.balanceAmount > 0 && (
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handlePayment(invoice)}
                        >
                          <PaymentIcon fontSize="small" />
                        </IconButton>
                      )}
                      <IconButton
                        size="small"
                        onClick={() => handleDownload(invoice.id)}
                      >
                        <Download fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={(_event, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(parseInt(event.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </Card>
    </Box>
  );
};

export default InvoiceList;

