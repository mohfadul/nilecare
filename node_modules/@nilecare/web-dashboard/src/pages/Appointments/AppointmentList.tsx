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
  FilterList,
  Schedule,
  MeetingRoom,
  Notifications,
  Queue,
  CalendarToday,
} from '@mui/icons-material';
import { apiClient } from '../../services/api.client';
import { appointmentApi } from '../../services/appointment.api';
import { useSnackbar } from 'notistack';
import { format } from 'date-fns';
import AppointmentAdvancedSearch from '../../components/AdvancedSearch/AppointmentAdvancedSearch';

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
  const [advancedSearchOpen, setAdvancedSearchOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<any>(null);

  useEffect(() => {
    loadAppointments();
  }, [page, rowsPerPage, statusFilter, dateFilter, activeFilters]);

  const loadAppointments = async () => {
    try {
      setLoading(true);

      // Build filters
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

      // Use appointment microservice API
      const result = await appointmentApi.getAppointments(filters);

      if (result.success && result.data) {
        const appointmentData = result.data.appointments || result.data;
        setAppointments(appointmentData);
        setTotalCount(result.data.pagination?.total || appointmentData.length);
      }
    } catch (err: any) {
      console.error('Failed to load appointments:', err);
      enqueueSnackbar('Failed to load appointments', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (appointmentId: string) => {
    try {
      const result = await appointmentApi.updateAppointmentStatus(appointmentId, 'in_progress');
      if (result.success) {
        enqueueSnackbar('Patient checked-in successfully', { variant: 'success' });
        loadAppointments();
      }
    } catch (err) {
      enqueueSnackbar('Failed to check-in patient', { variant: 'error' });
    }
  };

  const handleConfirm = async (appointmentId: string) => {
    try {
      const result = await appointmentApi.confirmAppointment(appointmentId);
      if (result.success) {
        enqueueSnackbar('Appointment confirmed', { variant: 'success' });
        loadAppointments();
      }
    } catch (err) {
      enqueueSnackbar('Failed to confirm appointment', { variant: 'error' });
    }
  };

  const handleComplete = async (appointmentId: string) => {
    try {
      const result = await appointmentApi.completeAppointment(appointmentId);
      if (result.success) {
        enqueueSnackbar('Appointment completed', { variant: 'success' });
        loadAppointments();
      }
    } catch (err) {
      enqueueSnackbar('Failed to complete appointment', { variant: 'error' });
    }
  };

  const handleCancel = async (appointmentId: string) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }

    try {
      const result = await appointmentApi.cancelAppointment(appointmentId);
      if (result.success) {
        enqueueSnackbar('Appointment cancelled', { variant: 'success' });
        loadAppointments();
      }
    } catch (err) {
      enqueueSnackbar('Failed to cancel appointment', { variant: 'error' });
    }
  };

  const handleScheduleReminder = async (appointmentId: string) => {
    try {
      const result = await appointmentApi.scheduleReminders(appointmentId);
      if (result.success) {
        enqueueSnackbar('Reminders scheduled successfully', { variant: 'success' });
      }
    } catch (err) {
      enqueueSnackbar('Failed to schedule reminders', { variant: 'error' });
    }
  };

  const handleViewSchedule = () => {
    navigate('/dashboard/appointments/schedule');
  };

  const handleViewWaitlist = () => {
    navigate('/dashboard/appointments/waitlist');
  };

  const handleViewResources = () => {
    navigate('/dashboard/appointments/resources');
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

  const handleAdvancedSearch = (filters: any) => {
    setActiveFilters(filters);
    setPage(0);
    // Clear simple filters when using advanced search
    setStatusFilter('all');
    setDateFilter('');
    enqueueSnackbar(
      `Applied ${Object.keys(filters).length} filter(s)`,
      { variant: 'info' }
    );
  };

  const handleClearFilters = () => {
    setActiveFilters(null);
    setStatusFilter('all');
    setDateFilter('');
    setPage(0);
    enqueueSnackbar('Filters cleared', { variant: 'info' });
  };

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Appointments / المواعيد
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<Schedule />}
            onClick={handleViewSchedule}
          >
            Schedules
          </Button>
          <Button
            variant="outlined"
            startIcon={<Queue />}
            onClick={handleViewWaitlist}
          >
            Waitlist
          </Button>
          <Button
            variant="outlined"
            startIcon={<MeetingRoom />}
            onClick={handleViewResources}
          >
            Resources
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/dashboard/appointments/new')}
            size="large"
          >
            Book Appointment
          </Button>
        </Stack>
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
                disabled={activeFilters !== null}
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
                disabled={activeFilters !== null}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Stack direction="row" spacing={1}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<FilterList />}
                  onClick={() => setAdvancedSearchOpen(true)}
                >
                  Advanced Search
                </Button>
                {activeFilters && (
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={handleClearFilters}
                  >
                    Clear
                  </Button>
                )}
              </Stack>
            </Grid>
          </Grid>
          
          {activeFilters && (
            <Box sx={{ mt: 2 }}>
              <Chip
                label={`${Object.keys(activeFilters).length} filter(s) applied`}
                color="primary"
                onDelete={handleClearFilters}
                size="small"
              />
            </Box>
          )}
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
                        {appointment.appointmentDate ? format(new Date(appointment.appointmentDate), 'MMM dd, yyyy') : 'N/A'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {(appointment as any).appointmentTime || 'N/A'}
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
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        <IconButton 
                          size="small" 
                          onClick={() => navigate(`/dashboard/appointments/${appointment.id}`)}
                          title="View Details"
                        >
                          <Visibility fontSize="small" />
                        </IconButton>
                        
                        {(appointment.status === 'scheduled' || appointment.status === 'confirmed') && (
                          <IconButton
                            size="small"
                            color="secondary"
                            onClick={() => handleScheduleReminder(appointment.id)}
                            title="Schedule Reminder"
                          >
                            <Notifications fontSize="small" />
                          </IconButton>
                        )}
                        
                        {appointment.status === 'scheduled' && (
                          <>
                            <IconButton
                              size="small"
                              color="info"
                              onClick={() => handleCheckIn(appointment.id)}
                              title="Check-In"
                            >
                              <CheckCircle fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleCancel(appointment.id)}
                              title="Cancel"
                            >
                              <Cancel fontSize="small" />
                            </IconButton>
                          </>
                        )}

                        {appointment.status === 'confirmed' && (
                          <>
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => handleCheckIn(appointment.id)}
                              title="Check-In"
                            >
                              <CheckCircle fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleCancel(appointment.id)}
                              title="Cancel"
                            >
                              <Cancel fontSize="small" />
                            </IconButton>
                          </>
                        )}

                        {appointment.status === 'checked-in' && (
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => handleComplete(appointment.id)}
                            title="Complete"
                          >
                            <CheckCircle fontSize="small" />
                          </IconButton>
                        )}

                        {(appointment.status === 'scheduled' || appointment.status === 'confirmed') && (
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => navigate(`/dashboard/appointments/${appointment.id}/edit`)}
                            title="Edit"
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        )}
                      </Stack>
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

      {/* Advanced Search Dialog */}
      <AppointmentAdvancedSearch
        open={advancedSearchOpen}
        onClose={() => setAdvancedSearchOpen(false)}
        onSearch={handleAdvancedSearch}
      />
    </Box>
  );
};

export default AppointmentList;

