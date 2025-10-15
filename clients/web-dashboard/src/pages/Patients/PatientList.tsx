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
  FileDownload,
  PictureAsPdf,
  TableChart,
  DeleteSweep,
  FilterList,
} from '@mui/icons-material';
import { apiClient } from '../../services/api.client';
import { useSnackbar } from 'notistack';
import { exportPatientsToExcel, exportPatientsToPDF } from '../../utils/exportUtils';
import PatientAdvancedSearch from '../../components/AdvancedSearch/PatientAdvancedSearch';

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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [advancedSearchOpen, setAdvancedSearchOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<any>(null);

  useEffect(() => {
    loadPatients();
  }, [page, rowsPerPage, searchTerm, activeFilters]);

  const loadPatients = async () => {
    try {
      setLoading(true);
      setError('');

      let result;
      
      // Use advanced search if filters are active
      if (activeFilters && Object.keys(activeFilters).length > 0) {
        result = await apiClient.advancedSearchPatients({
          ...activeFilters,
          page: page + 1,
          limit: rowsPerPage,
        });
      } else {
        // Use simple search
        result = await apiClient.getPatients({
          page: page + 1,
          limit: rowsPerPage,
          search: searchTerm || undefined,
        });
      }

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

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(patients.map(p => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) {
      enqueueSnackbar('Please select patients to delete', { variant: 'warning' });
      return;
    }

    if (!window.confirm(`Delete ${selectedIds.length} selected patients?`)) {
      return;
    }

    try {
      const result = await apiClient.bulkDeletePatients(selectedIds);
      if (result.success) {
        enqueueSnackbar(`${selectedIds.length} patients deleted successfully`, { variant: 'success' });
        setSelectedIds([]);
        loadPatients();
      }
    } catch (err: any) {
      enqueueSnackbar('Bulk delete failed', { variant: 'error' });
    }
  };

  const handleExportExcel = () => {
    const success = exportPatientsToExcel(patients);
    if (success) {
      enqueueSnackbar('Exported to Excel successfully', { variant: 'success' });
    } else {
      enqueueSnackbar('Export failed', { variant: 'error' });
    }
  };

  const handleExportPDF = () => {
    const success = exportPatientsToPDF(patients);
    if (success) {
      enqueueSnackbar('Exported to PDF successfully', { variant: 'success' });
    } else {
      enqueueSnackbar('Export failed', { variant: 'error' });
    }
  };

  const handleAdvancedSearch = (filters: any) => {
    setActiveFilters(filters);
    setPage(0); // Reset to first page when applying filters
    enqueueSnackbar(
      `Applied ${Object.keys(filters).length} filter(s)`,
      { variant: 'info' }
    );
  };

  const handleClearFilters = () => {
    setActiveFilters(null);
    setSearchTerm('');
    setPage(0);
    enqueueSnackbar('Filters cleared', { variant: 'info' });
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
        <Stack direction="row" spacing={1}>
          {selectedIds.length > 0 && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteSweep />}
              onClick={handleBulkDelete}
            >
              Delete Selected ({selectedIds.length})
            </Button>
          )}
          <Button
            variant="outlined"
            startIcon={<TableChart />}
            onClick={handleExportExcel}
          >
            Export Excel
          </Button>
          <Button
            variant="outlined"
            startIcon={<PictureAsPdf />}
            onClick={handleExportPDF}
          >
            Export PDF
          </Button>
          <Button
            variant="contained"
            startIcon={<PersonAdd />}
            onClick={() => navigate('/dashboard/patients/new')}
            size="large"
          >
            Add Patient / إضافة مريض
          </Button>
        </Stack>
      </Box>

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
            <TextField
              fullWidth
              placeholder="Search patients by name, ID, or phone..."
              value={searchTerm}
              onChange={handleSearch}
              disabled={activeFilters !== null}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
            <Button
              variant="outlined"
              startIcon={<FilterList />}
              onClick={() => setAdvancedSearchOpen(true)}
              sx={{ minWidth: 180 }}
            >
              Advanced Search
            </Button>
            {activeFilters && (
              <Button
                variant="outlined"
                color="secondary"
                onClick={handleClearFilters}
                sx={{ minWidth: 120 }}
              >
                Clear Filters
              </Button>
            )}
          </Stack>
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
                <TableCell padding="checkbox">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === patients.length && patients.length > 0}
                    onChange={handleSelectAll}
                    style={{ cursor: 'pointer', width: 18, height: 18 }}
                  />
                </TableCell>
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
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : patients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      No patients found. Click "Add Patient" to create one.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                patients.map((patient) => (
                  <TableRow 
                    key={patient.id} 
                    hover 
                    selected={selectedIds.includes(patient.id)}
                  >
                    <TableCell padding="checkbox">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(patient.id)}
                        onChange={() => handleSelectOne(patient.id)}
                        style={{ cursor: 'pointer', width: 18, height: 18 }}
                      />
                    </TableCell>
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

      {/* Advanced Search Dialog */}
      <PatientAdvancedSearch
        open={advancedSearchOpen}
        onClose={() => setAdvancedSearchOpen(false)}
        onSearch={handleAdvancedSearch}
      />
    </Box>
  );
};

export default PatientList;

