/**
 * Appointment List Page
 * View and manage appointments
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
  Edit,
  Cancel,
  CheckCircle,
  Visibility,
  EventAvailable,
} from '@mui/icons-material';
import { apiClient } from '../../services/api.client';
import { useSnackbar } from 'notistack';
import { format } from 'date-fns';

interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  providerId: string;
  providerName: string;
  appointmentDate: string;
  appointmentType: string;
  duration: number;
  status: string;
  reason?: string;
}

const AppointmentList: React.FC = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    loadAppointments();
  }, [page, rowsPerPage, statusFilter, dateFilter]);

  const loadAppointments = async () => {
    try {
      setLoading(true);

      const filters: any = {
        page: page + 1,
        limit: rowsPerPage,
      };

      if (statusFilter !== 'all') {
        filters.status = statusFilter;
      }

      if (dateFilter) {
        filters.date = dateFilter;
      }

      const result = await apiClient.getAppointments(filters);

      if (result.success && result.data) {
        setAppointments(result.data.appointments || []);
        setTotalCount(result.data.pagination?.total || 0);
      }
    } catch (err: any) {
      enqueueSnackbar('Failed to load appointments', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (appointmentId: string) => {
    try {
      const result = await apiClient.confirmAppointment(appointmentId);
      if (result.success) {
        enqueueSnackbar('Appointment confirmed', { variant: 'success' });
        loadAppointments();
      }
    } catch (err) {
      enqueueSnackbar('Failed to confirm appointment', { variant: 'error' });
    }
  };

  const handleCancel = async (appointmentId: string) => {
    const reason = window.prompt('Enter cancellation reason:');
    if (!reason) return;

    try {
      const result = await apiClient.cancelAppointment(appointmentId, reason);
      if (result.success) {
        enqueueSnackbar('Appointment cancelled', { variant: 'success' });
        loadAppointments();
      }
    } catch (err) {
      enqueueSnackbar('Failed to cancel appointment', { variant: 'error' });
    }
  };

  const getStatusColor = (status: string): 'default' | 'primary' | 'success' | 'warning' | 'error' => {
    const statusColors: Record<string, any> = {
      scheduled: 'primary',
      confirmed: 'success',
      'in-progress': 'warning',
      completed: 'default',
      cancelled: 'error',
      'no-show': 'error',
    };
    return statusColors[status] || 'default';
  };

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Appointments / المواعيد
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/dashboard/appointments/new')}
          size="large"
        >
          Book Appointment / حجز موعد
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
                <MenuItem value="scheduled">Scheduled</MenuItem>
                <MenuItem value="confirmed">Confirmed</MenuItem>
                <MenuItem value="in-progress">In Progress</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                type="date"
                label="Date Filter"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </Box>
      </Card>

      {/* Appointments Table */}
      <Card>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Date & Time</strong></TableCell>
                <TableCell><strong>Patient</strong></TableCell>
                <TableCell><strong>Provider</strong></TableCell>
                <TableCell><strong>Type</strong></TableCell>
                <TableCell><strong>Duration</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell align="right"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && appointments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : appointments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">
                      No appointments found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                appointments.map((appointment) => (
                  <TableRow key={appointment.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {format(new Date(appointment.appointmentDate), 'MMM dd, yyyy')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {format(new Date(appointment.appointmentDate), 'hh:mm a')}
                      </Typography>
                    </TableCell>
                    <TableCell>{appointment.patientName || 'N/A'}</TableCell>
                    <TableCell>{appointment.providerName || 'N/A'}</TableCell>
                    <TableCell>
                      <Chip label={appointment.appointmentType} size="small" variant="outlined" />
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
                      <IconButton size="small" onClick={() => navigate(`/dashboard/appointments/${appointment.id}`)}>
                        <Visibility fontSize="small" />
                      </IconButton>
                      {appointment.status === 'scheduled' && (
                        <>
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => handleConfirm(appointment.id)}
                          >
                            <CheckCircle fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleCancel(appointment.id)}
                          >
                            <Cancel fontSize="small" />
                          </IconButton>
                        </>
                      )}
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

export default AppointmentList;

