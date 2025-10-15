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
  Grid,
} from '@mui/material';
import { Add, Visibility, Edit, Delete, Business } from '@mui/icons-material';
import { useFacilities, useDeleteFacility } from '../../../hooks/useFacilities';
import { Facility } from '../../../api/facilities.api';

export function FacilityManagementPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading, error } = useFacilities({
    page: page + 1,
    limit: rowsPerPage,
    type: typeFilter || undefined,
    status: statusFilter || undefined,
  });

  const deleteFacility = useDeleteFacility();

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this facility? This action cannot be undone.')) {
      try {
        await deleteFacility.mutateAsync(id);
      } catch (error) {
        console.error('Failed to delete facility:', error);
      }
    }
  };

  const getStatusColor = (status: Facility['status']) => {
    const colors: Record<Facility['status'], 'success' | 'error' | 'warning'> = {
      'active': 'success',
      'inactive': 'error',
      'maintenance': 'warning',
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
        <Alert severity="error">Failed to load facilities. Please try again.</Alert>
      </Container>
    );
  }

  const facilities = data?.data?.facilities || [];
  const pagination = data?.pagination;

  return (
    <Container maxWidth="xl">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Facility Management</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/admin/facilities/new')}
        >
          Add Facility
        </Button>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              select
              label="Type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              fullWidth
              size="small"
            >
              <MenuItem value="">All Types</MenuItem>
              <MenuItem value="hospital">Hospital</MenuItem>
              <MenuItem value="clinic">Clinic</MenuItem>
              <MenuItem value="lab">Laboratory</MenuItem>
              <MenuItem value="pharmacy">Pharmacy</MenuItem>
              <MenuItem value="rehabilitation">Rehabilitation</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              select
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              fullWidth
              size="small"
            >
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
              <MenuItem value="maintenance">Maintenance</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Code</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell>Capacity</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {facilities.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                    No facilities found. {typeFilter || statusFilter ? 'Try different filters.' : 'Click "Add Facility" to create one.'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              facilities.map((facility) => (
                <TableRow key={facility.id} hover>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <Business fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="body2" fontWeight="medium">
                        {facility.facilityCode}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {facility.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={facility.type} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {facility.city}, {facility.state}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {facility.country}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{facility.phone}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {facility.email}
                    </Typography>
                  </TableCell>
                  <TableCell>{facility.capacity}</TableCell>
                  <TableCell>
                    <Chip
                      label={facility.status}
                      size="small"
                      color={getStatusColor(facility.status)}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => navigate(`/admin/facilities/${facility.id}`)}
                      title="View details"
                    >
                      <Visibility fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => navigate(`/admin/facilities/${facility.id}/edit`)}
                      title="Edit facility"
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(facility.id)}
                      title="Delete facility"
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
        {pagination && (
          <TablePagination
            rowsPerPageOptions={[10, 20, 50]}
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

