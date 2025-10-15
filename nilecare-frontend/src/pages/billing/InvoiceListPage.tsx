import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  TextField,
  MenuItem,
} from '@mui/material';
import { Add, Visibility, Cancel, Payment } from '@mui/icons-material';
import { useInvoices, useCancelInvoice } from '../../hooks/useBilling';
import { format } from 'date-fns';
import { Invoice } from '../../api/billing.api';

export function InvoiceListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading, error } = useInvoices({
    page: page + 1,
    limit: rowsPerPage,
    status: statusFilter || undefined,
  });

  const cancelInvoice = useCancelInvoice();

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleCancel = async (id: number) => {
    if (window.confirm('Are you sure you want to cancel this invoice?')) {
      try {
        await cancelInvoice.mutateAsync(id);
      } catch (error) {
        console.error('Failed to cancel invoice:', error);
      }
    }
  };

  const getStatusColor = (status: Invoice['status']) => {
    const colors: Record<Invoice['status'], 'default' | 'primary' | 'success' | 'warning' | 'error'> = {
      'draft': 'default',
      'pending': 'primary',
      'paid': 'success',
      'partially_paid': 'warning',
      'overdue': 'error',
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
        <Alert severity="error">Failed to load invoices. Please try again.</Alert>
      </Container>
    );
  }

  const invoices = data?.data?.invoices || [];
  const pagination = data?.pagination;

  return (
    <Container maxWidth="xl">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Invoices</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/billing/invoices/new')}
        >
          Create Invoice
        </Button>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box display="flex" gap={2}>
          <TextField
            select
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            sx={{ minWidth: 200 }}
            size="small"
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="draft">Draft</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="paid">Paid</MenuItem>
            <MenuItem value="partially_paid">Partially Paid</MenuItem>
            <MenuItem value="overdue">Overdue</MenuItem>
            <MenuItem value="cancelled">Cancelled</MenuItem>
          </TextField>

          {statusFilter && (
            <Button variant="outlined" onClick={() => setStatusFilter('')}>
              Clear Filter
            </Button>
          )}
        </Box>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Invoice #</TableCell>
              <TableCell>Patient</TableCell>
              <TableCell>Invoice Date</TableCell>
              <TableCell>Due Date</TableCell>
              <TableCell align="right">Total Amount</TableCell>
              <TableCell align="right">Paid Amount</TableCell>
              <TableCell align="right">Balance</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                    No invoices found. {statusFilter ? 'Try different filter.' : 'Click "Create Invoice" to create one.'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((invoice) => (
                <TableRow key={invoice.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {invoice.invoiceNumber}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {invoice.invoiceType}
                    </Typography>
                  </TableCell>
                  <TableCell>{invoice.patientName || `Patient #${invoice.patientId}`}</TableCell>
                  <TableCell>
                    {invoice.invoiceDate ? format(new Date(invoice.invoiceDate), 'MMM dd, yyyy') : '-'}
                  </TableCell>
                  <TableCell>
                    {invoice.dueDate ? format(new Date(invoice.dueDate), 'MMM dd, yyyy') : '-'}
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="medium">
                      {invoice.totalAmount.toLocaleString()} {invoice.currency}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" color="success.main">
                      {invoice.paidAmount.toLocaleString()} {invoice.currency}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" color={invoice.balanceAmount > 0 ? 'error.main' : 'text.secondary'}>
                      {invoice.balanceAmount.toLocaleString()} {invoice.currency}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={invoice.status}
                      size="small"
                      color={getStatusColor(invoice.status)}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => navigate(`/billing/invoices/${invoice.id}`)}
                      title="View details"
                    >
                      <Visibility fontSize="small" />
                    </IconButton>
                    {invoice.balanceAmount > 0 && invoice.status !== 'cancelled' && (
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/billing/payments/checkout/${invoice.id}`)}
                        title="Process payment"
                        color="primary"
                      >
                        <Payment fontSize="small" />
                      </IconButton>
                    )}
                    {invoice.status === 'draft' && (
                      <IconButton
                        size="small"
                        onClick={() => handleCancel(invoice.id)}
                        title="Cancel invoice"
                        color="error"
                      >
                        <Cancel fontSize="small" />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {pagination && (
          <TablePagination
            rowsPerPageOptions={[10, 20, 50, 100]}
            component="div"
            count={pagination.total || 0}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        )}
      </TableContainer>
    </Container>
  );
}

