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
import { Add, Visibility, Edit, Cancel, CheckCircle } from '@mui/icons-material';
import { useAppointments, useCancelAppointment, useUpdateAppointmentStatus } from '../../hooks/useAppointments';
import { format } from 'date-fns';
import { Appointment } from '../../api/appointments.api';

export function AppointmentListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const { data, isLoading, error } = useAppointments({
    page: page + 1,
    limit: rowsPerPage,
    status: statusFilter || undefined,
    date: dateFilter || undefined,
  });

  const cancelAppointment = useCancelAppointment();
  const updateStatus = useUpdateAppointmentStatus();

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleCancel = async (id: number) => {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      try {
        await cancelAppointment.mutateAsync(id);
      } catch (error) {
        console.error('Failed to cancel appointment:', error);
      }
    }
  };

  const handleConfirm = async (id: number) => {
    try {
      await updateStatus.mutateAsync({ id, status: 'confirmed' });
    } catch (error) {
      console.error('Failed to confirm appointment:', error);
    }
  };

  const getStatusColor = (status: Appointment['status']) => {
    const colors: Record<Appointment['status'], 'default' | 'primary' | 'success' | 'warning' | 'error'> = {
      'scheduled': 'default',
      'confirmed': 'primary',
      'checked-in': 'info' as any,
      'in-progress': 'warning',
      'completed': 'success',
      'cancelled': 'error',
      'no-show': 'error',
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
        <Alert severity="error">Failed to load appointments. Please try again.</Alert>
      </Container>
    );
  }

  const appointments = data?.data?.appointments || [];
  const pagination = data?.pagination;

  return (
    <Container maxWidth="xl">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Appointments</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/appointments/new')}
        >
          Book Appointment
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
            <MenuItem value="scheduled">Scheduled</MenuItem>
            <MenuItem value="confirmed">Confirmed</MenuItem>
            <MenuItem value="checked-in">Checked In</MenuItem>
            <MenuItem value="in-progress">In Progress</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
            <MenuItem value="cancelled">Cancelled</MenuItem>
            <MenuItem value="no-show">No Show</MenuItem>
          </TextField>

          <TextField
            type="date"
            label="Date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            sx={{ minWidth: 200 }}
            size="small"
            InputLabelProps={{ shrink: true }}
          />

          {(statusFilter || dateFilter) && (
            <Button
              variant="outlined"
              onClick={() => {
                setStatusFilter('');
                setDateFilter('');
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
              <TableCell>Date & Time</TableCell>
              <TableCell>Patient</TableCell>
              <TableCell>Provider</TableCell>
              <TableCell>Reason</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {appointments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                    No appointments found. {statusFilter || dateFilter ? 'Try different filters.' : 'Click "Book Appointment" to create one.'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              appointments.map((appointment) => (
                <TableRow key={appointment.id} hover>
                  <TableCell>{appointment.id}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {format(new Date(`${appointment.appointmentDate}T${appointment.appointmentTime}`), 'MMM dd, yyyy')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {format(new Date(`${appointment.appointmentDate}T${appointment.appointmentTime}`), 'h:mm a')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {appointment.patientFirstName} {appointment.patientLastName}
                  </TableCell>
                  <TableCell>
                    Dr. {appointment.providerLastName}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                      {appointment.reason}
                    </Typography>
                  </TableCell>
                  <TableCell>{appointment.duration} min</TableCell>
                  <TableCell>
                    <Chip
                      label={appointment.status}
                      size="small"
                      color={getStatusColor(appointment.status)}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => navigate(`/appointments/${appointment.id}`)}
                      title="View details"
                    >
                      <Visibility fontSize="small" />
                    </IconButton>
                    {appointment.status === 'scheduled' && (
                      <IconButton
                        size="small"
                        onClick={() => handleConfirm(appointment.id)}
                        title="Confirm appointment"
                        color="success"
                      >
                        <CheckCircle fontSize="small" />
                      </IconButton>
                    )}
                    <IconButton
                      size="small"
                      onClick={() => navigate(`/appointments/${appointment.id}/edit`)}
                      title="Edit appointment"
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                    {!['completed', 'cancelled', 'no-show'].includes(appointment.status) && (
                      <IconButton
                        size="small"
                        onClick={() => handleCancel(appointment.id)}
                        title="Cancel appointment"
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

