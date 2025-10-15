/**
 * User Management Page
 * Admin interface for managing system users
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  TablePagination,
  Button,
  TextField,
  InputAdornment,
  Card,
  CardContent,
  Avatar,
  Grid,
} from '@mui/material';
import { Edit, Delete, Add, Search, Person } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../services/api.client';
import { useSnackbar } from 'notistack';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  status: string;
  phone?: string;
  specialty?: string;
}

const UserManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    doctors: 0,
    nurses: 0,
  });

  useEffect(() => {
    fetchUsers();
  }, [page, rowsPerPage, searchTerm]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const result = await apiClient.getUsers({
        page: page + 1,
        limit: rowsPerPage,
        search: searchTerm,
      });

      if (result.success && result.data) {
        const allUsers = result.data as User[];
        setUsers(allUsers);

        // Calculate stats
        const activeUsers = allUsers.filter((u: User) => u.status === 'active');
        const doctors = allUsers.filter((u: User) => u.role === 'doctor');
        const nurses = allUsers.filter((u: User) => u.role === 'nurse');

        setStats({
          total: allUsers.length,
          active: activeUsers.length,
          doctors: doctors.length,
          nurses: nurses.length,
        });
      } else {
        enqueueSnackbar(result.error?.message || 'Failed to fetch users', { variant: 'error' });
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      enqueueSnackbar('Error fetching users', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to deactivate this user?')) return;

    try {
      const result = await apiClient.deleteUser(userId);
      if (result.success) {
        enqueueSnackbar('User deactivated successfully', { variant: 'success' });
        fetchUsers();
      } else {
        enqueueSnackbar(result.error?.message || 'Failed to deactivate user', { variant: 'error' });
      }
    } catch (error) {
      console.error('Error deactivating user:', error);
      enqueueSnackbar('Error deactivating user', { variant: 'error' });
    }
  };

  const getRoleColor = (role: string): 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info' => {
    switch (role) {
      case 'doctor':
        return 'primary';
      case 'nurse':
        return 'secondary';
      case 'admin':
        return 'error';
      case 'pharmacist':
        return 'success';
      case 'lab_technician':
        return 'info';
      case 'receptionist':
        return 'warning';
      default:
        return 'primary';
    }
  };

  if (loading && users.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        👥 User Management
      </Typography>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Users
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {stats.total}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Active Users
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="success.main">
                {stats.active}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Doctors
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="primary">
                {stats.doctors}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Nurses
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="secondary">
                {stats.nurses}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <TextField
              label="Search Users"
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={handleSearchChange}
              sx={{ minWidth: 300 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => alert('Add User form - Coming soon!')}
            >
              Add New User
            </Button>
          </Box>

          {loading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TableContainer component={Paper} sx={{ mt: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>User</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Specialty</TableCell>
                      <TableCell>Phone</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          No users found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((user) => (
                        <TableRow key={user.id} hover>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={1}>
                              <Avatar sx={{ width: 32, height: 32 }}>
                                <Person />
                              </Avatar>
                              <Box>
                                <Typography variant="body2" fontWeight="bold">
                                  {`${user.first_name} ${user.last_name}`}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {user.id}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Chip label={user.role} size="small" color={getRoleColor(user.role)} />
                          </TableCell>
                          <TableCell>{user.specialty || '-'}</TableCell>
                          <TableCell>{user.phone || '-'}</TableCell>
                          <TableCell>
                            <Chip
                              label={user.status}
                              size="small"
                              color={user.status === 'active' ? 'success' : 'error'}
                              icon={user.status === 'active' ? <Person /> : undefined}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              color="info"
                              onClick={() => alert('Edit user form - Coming soon!')}
                            >
                              <Edit />
                            </IconButton>
                            {currentUser?.id !== user.id && ( // Prevent user from deleting themselves
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteUser(user.id)}
                              >
                                <Delete />
                              </IconButton>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={stats.total}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handlePageChange}
                onRowsPerPageChange={handleRowsPerPageChange}
              />
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default UserManagement;
