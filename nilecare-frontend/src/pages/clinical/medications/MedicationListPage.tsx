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
import { Add, Visibility, Edit, Stop } from '@mui/icons-material';
import { useMedications, useDiscontinueMedication } from '../../../hooks/useMedications';
import { format } from 'date-fns';
import { Medication } from '../../../api/medications.api';
import { authStore } from '../../../store/authStore';

export function MedicationListPage() {
  const navigate = useNavigate();
  const user = authStore((state) => state.user);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading, error } = useMedications({
    page: page + 1,
    limit: rowsPerPage,
    status: statusFilter || undefined,
  });

  const discontinueMedication = useDiscontinueMedication();

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleDiscontinue = async (id: number) => {
    const reason = window.prompt('Please enter reason for discontinuation:');
    if (reason) {
      try {
        await discontinueMedication.mutateAsync({
          id,
          data: {
            discontinuedBy: user?.id || 1,
            discontinuedReason: reason,
          },
        });
      } catch (error) {
        console.error('Failed to discontinue medication:', error);
      }
    }
  };

  const getStatusColor = (status: Medication['status']) => {
    const colors: Record<Medication['status'], 'default' | 'success' | 'error' | 'warning'> = {
      'active': 'success',
      'discontinued': 'error',
      'completed': 'default',
      'on-hold': 'warning',
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
        <Alert severity="error">Failed to load medications. Please try again.</Alert>
      </Container>
    );
  }

  const medications = data?.data?.medications || [];
  const pagination = data?.pagination;

  return (
    <Container maxWidth="xl">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Medications & Prescriptions</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/clinical/medications/new')}
        >
          Prescribe Medication
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
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="discontinued">Discontinued</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
            <MenuItem value="on-hold">On Hold</MenuItem>
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
              <TableCell>ID</TableCell>
              <TableCell>Medication Name</TableCell>
              <TableCell>Patient</TableCell>
              <TableCell>Dosage</TableCell>
              <TableCell>Frequency</TableCell>
              <TableCell>Route</TableCell>
              <TableCell>Start Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {medications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                    No medications found. {statusFilter ? 'Try different filter.' : 'Click "Prescribe Medication" to create one.'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              medications.map((medication) => (
                <TableRow key={medication.id} hover>
                  <TableCell>{medication.id}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {medication.medicationName}
                    </Typography>
                    {medication.reason && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        For: {medication.reason}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>{medication.patientName || `Patient #${medication.patientId}`}</TableCell>
                  <TableCell>{medication.dosage}</TableCell>
                  <TableCell>{medication.frequency}</TableCell>
                  <TableCell>
                    <Chip label={medication.route} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    {medication.startDate ? format(new Date(medication.startDate), 'MMM dd, yyyy') : '-'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={medication.status}
                      size="small"
                      color={getStatusColor(medication.status)}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => navigate(`/clinical/medications/${medication.id}`)}
                      title="View details"
                    >
                      <Visibility fontSize="small" />
                    </IconButton>
                    {medication.status === 'active' && (
                      <IconButton
                        size="small"
                        onClick={() => handleDiscontinue(medication.id)}
                        title="Discontinue medication"
                        color="error"
                      >
                        <Stop fontSize="small" />
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

