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
import { Add, Visibility, Science, Cancel } from '@mui/icons-material';
import { useLabOrders, useCancelLabOrder } from '../../../hooks/useLabs';
import { format } from 'date-fns';
import { LabOrder } from '../../../api/labs.api';

export function LabOrderListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  const { data, isLoading, error } = useLabOrders({
    page: page + 1,
    limit: rowsPerPage,
    status: statusFilter || undefined,
    priority: priorityFilter || undefined,
  });

  const cancelLabOrder = useCancelLabOrder();

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleCancel = async (id: number) => {
    if (window.confirm('Are you sure you want to cancel this lab order?')) {
      try {
        await cancelLabOrder.mutateAsync(id);
      } catch (error) {
        console.error('Failed to cancel lab order:', error);
      }
    }
  };

  const getPriorityColor = (priority: LabOrder['priority']) => {
    const colors: Record<LabOrder['priority'], 'default' | 'warning' | 'error'> = {
      'routine': 'default',
      'urgent': 'warning',
      'stat': 'error',
    };
    return colors[priority] || 'default';
  };

  const getStatusColor = (status: LabOrder['status']) => {
    const colors: Record<LabOrder['status'], 'default' | 'primary' | 'warning' | 'success' | 'error'> = {
      'ordered': 'default',
      'pending': 'primary',
      'in-progress': 'warning',
      'completed': 'success',
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
        <Alert severity="error">Failed to load lab orders. Please try again.</Alert>
      </Container>
    );
  }

  const labOrders = data?.data?.labOrders || [];
  const pagination = data?.pagination;

  return (
    <Container maxWidth="xl">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Laboratory Orders</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/clinical/labs/new')}
        >
          Order Lab Test
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
            <MenuItem value="ordered">Ordered</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="in-progress">In Progress</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
            <MenuItem value="cancelled">Cancelled</MenuItem>
          </TextField>

          <TextField
            select
            label="Priority"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            sx={{ minWidth: 200 }}
            size="small"
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="routine">Routine</MenuItem>
            <MenuItem value="urgent">Urgent</MenuItem>
            <MenuItem value="stat">STAT</MenuItem>
          </TextField>

          {(statusFilter || priorityFilter) && (
            <Button
              variant="outlined"
              onClick={() => {
                setStatusFilter('');
                setPriorityFilter('');
              }}
            >
              Clear Filters
            </Button>
          )}
        </Box>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Test Name</TableCell>
              <TableCell>Patient</TableCell>
              <TableCell>Ordered By</TableCell>
              <TableCell>Order Date</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {labOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                    No lab orders found. {statusFilter || priorityFilter ? 'Try different filters.' : 'Click "Order Lab Test" to create one.'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              labOrders.map((order) => (
                <TableRow key={order.id} hover>
                  <TableCell>{order.id}</TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <Science fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {order.testName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {order.testCode}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>{order.patientName || `Patient #${order.patientId}`}</TableCell>
                  <TableCell>{order.providerName || `Provider #${order.orderedBy}`}</TableCell>
                  <TableCell>
                    {order.orderDate ? format(new Date(order.orderDate), 'MMM dd, yyyy') : '-'}
                  </TableCell>
                  <TableCell>
                    <Chip label={order.category} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={order.priority.toUpperCase()}
                      size="small"
                      color={getPriorityColor(order.priority)}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={order.status}
                      size="small"
                      color={getStatusColor(order.status)}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => navigate(`/clinical/labs/${order.id}`)}
                      title="View details"
                    >
                      <Visibility fontSize="small" />
                    </IconButton>
                    {order.status === 'ordered' && (
                      <IconButton
                        size="small"
                        onClick={() => handleCancel(order.id)}
                        title="Cancel order"
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

