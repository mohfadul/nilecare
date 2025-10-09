/**
 * Patient List Page
 * Browse, search, and manage patients
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  InputAdornment,
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
  Alert,
  Stack,
} from '@mui/material';
import {
  Search,
  Add,
  Edit,
  Visibility,
  Delete,
  PersonAdd,
} from '@mui/icons-material';
import { apiClient } from '../../services/api.client';
import { useSnackbar } from 'notistack';

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  phoneNumber: string;
  email?: string;
  createdAt: string;
}

const PatientList: React.FC = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    loadPatients();
  }, [page, rowsPerPage, searchTerm]);

  const loadPatients = async () => {
    try {
      setLoading(true);
      setError('');

      const result = await apiClient.getPatients({
        page: page + 1,
        limit: rowsPerPage,
        search: searchTerm || undefined,
      });

      if (result.success && result.data) {
        setPatients(result.data.patients || []);
        setTotalCount(result.data.pagination?.total || 0);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load patients');
      enqueueSnackbar('Failed to load patients', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(0); // Reset to first page on search
  };

  const handleView = (patientId: string) => {
    navigate(`/dashboard/patients/${patientId}`);
  };

  const handleEdit = (patientId: string) => {
    navigate(`/dashboard/patients/${patientId}/edit`);
  };

  const handleDelete = async (patientId: string) => {
    if (!window.confirm('Are you sure you want to delete this patient?')) {
      return;
    }

    try {
      const result = await apiClient.deletePatient(patientId);
      if (result.success) {
        enqueueSnackbar('Patient deleted successfully', { variant: 'success' });
        loadPatients();
      }
    } catch (err: any) {
      enqueueSnackbar('Failed to delete patient', { variant: 'error' });
    }
  };

  const calculateAge = (dateOfBirth: string): number => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const getGenderDisplay = (gender: string): string => {
    const genderMap: Record<string, string> = {
      male: 'Male / ذكر',
      female: 'Female / أنثى',
      other: 'Other / آخر',
      unknown: 'Unknown / غير معروف',
    };
    return genderMap[gender] || gender;
  };

  return (
    <Box>
      {/* Page Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Patients / المرضى
        </Typography>
        <Button
          variant="contained"
          startIcon={<PersonAdd />}
          onClick={() => navigate('/dashboard/patients/new')}
          size="large"
        >
          Add Patient / إضافة مريض
        </Button>
      </Box>

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              fullWidth
              placeholder="Search patients by name, ID, or phone..."
              value={searchTerm}
              onChange={handleSearch}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Stack>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Patient Table */}
      <Card>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>ID</strong></TableCell>
                <TableCell><strong>Name</strong></TableCell>
                <TableCell><strong>Age</strong></TableCell>
                <TableCell><strong>Gender</strong></TableCell>
                <TableCell><strong>Phone</strong></TableCell>
                <TableCell><strong>Email</strong></TableCell>
                <TableCell align="right"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && patients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : patients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      No patients found. Click "Add Patient" to create one.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                patients.map((patient) => (
                  <TableRow key={patient.id} hover>
                    <TableCell>
                      <Typography variant="caption" fontFamily="monospace">
                        {patient.id.substring(0, 8)}...
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {patient.firstName} {patient.lastName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`${calculateAge(patient.dateOfBirth)} years`}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getGenderDisplay(patient.gender)}
                        size="small"
                        color={patient.gender === 'male' ? 'primary' : 'secondary'}
                      />
                    </TableCell>
                    <TableCell>{patient.phoneNumber}</TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {patient.email || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => handleView(patient.id)}
                        color="primary"
                      >
                        <Visibility fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(patient.id)}
                        color="info"
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(patient.id)}
                        color="error"
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
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

export default PatientList;

