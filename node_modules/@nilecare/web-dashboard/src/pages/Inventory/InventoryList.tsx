/**
 * Inventory List Page
 * Manage medical supplies and medications inventory
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
  Alert,
  LinearProgress,
} from '@mui/material';
import {
  Add,
  Edit,
  Warning,
  CheckCircle,
  Inventory2,
  TrendingDown,
} from '@mui/icons-material';
import { apiClient } from '../../services/api.client';
import { useSnackbar } from 'notistack';
import { format } from 'date-fns';

interface InventoryItem {
  id: string;
  itemCode: string;
  itemName: string;
  category: string;
  currentStock: number;
  minimumStock: number;
  maximumStock: number;
  unit: string;
  unitPrice: number;
  expiryDate?: string;
  location: string;
  supplier: string;
}

const InventoryList: React.FC = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');

  useEffect(() => {
    loadInventory();
  }, [page, rowsPerPage, categoryFilter, stockFilter]);

  const loadInventory = async () => {
    try {
      setLoading(true);

      // Mock data (replace with actual API)
      const mockItems: InventoryItem[] = [
        {
          id: '1',
          itemCode: 'MED-001',
          itemName: 'Paracetamol 500mg Tablets',
          category: 'Medication',
          currentStock: 500,
          minimumStock: 200,
          maximumStock: 1000,
          unit: 'tablets',
          unitPrice: 0.5,
          expiryDate: '2026-06-30',
          location: 'Pharmacy A',
          supplier: 'Sudan Pharma',
        },
        {
          id: '2',
          itemCode: 'SUP-001',
          itemName: 'Surgical Gloves (Medium)',
          category: 'Supplies',
          currentStock: 50,
          minimumStock: 100,
          maximumStock: 500,
          unit: 'boxes',
          unitPrice: 15,
          location: 'Storage Room 2',
          supplier: 'Medical Supplies Ltd',
        },
      ];

      setItems(mockItems);
      setTotalCount(mockItems.length);
    } catch (err: any) {
      enqueueSnackbar('Failed to load inventory', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const getStockStatus = (item: InventoryItem): 'low' | 'ok' | 'high' => {
    if (item.currentStock <= item.minimumStock) return 'low';
    if (item.currentStock >= item.maximumStock) return 'high';
    return 'ok';
  };

  const getStockPercentage = (item: InventoryItem): number => {
    return Math.min((item.currentStock / item.maximumStock) * 100, 100);
  };

  const isExpiringSoon = (expiryDate?: string): boolean => {
    if (!expiryDate) return false;
    const daysUntilExpiry = Math.floor(
      (new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry <= 90; // 3 months
  };

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Inventory / المخزون
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/dashboard/inventory/new')}
          size="large"
        >
          Add Item / إضافة صنف
        </Button>
      </Box>

      {/* Alerts */}
      <Stack spacing={1} mb={3}>
        <Alert severity="warning" icon={<Warning />}>
          <strong>2 items</strong> are low on stock and need reordering
        </Alert>
        <Alert severity="error" icon={<TrendingDown />}>
          <strong>1 item</strong> is expiring within 90 days
        </Alert>
      </Stack>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <Box p={2}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                select
                label="Category"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <MenuItem value="all">All Categories</MenuItem>
                <MenuItem value="medication">Medications</MenuItem>
                <MenuItem value="supplies">Medical Supplies</MenuItem>
                <MenuItem value="equipment">Equipment</MenuItem>
                <MenuItem value="consumables">Consumables</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                select
                label="Stock Level"
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
              >
                <MenuItem value="all">All Levels</MenuItem>
                <MenuItem value="low">Low Stock</MenuItem>
                <MenuItem value="ok">Normal Stock</MenuItem>
                <MenuItem value="high">Overstocked</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </Box>
      </Card>

      {/* Inventory Table */}
      <Card>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Item Code</strong></TableCell>
                <TableCell><strong>Item Name</strong></TableCell>
                <TableCell><strong>Category</strong></TableCell>
                <TableCell><strong>Stock Level</strong></TableCell>
                <TableCell><strong>Unit Price</strong></TableCell>
                <TableCell><strong>Expiry</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell align="right"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">
                      No inventory items found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace" fontWeight="medium">
                        {item.itemCode}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {item.itemName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.location}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={item.category} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                          <Typography variant="body2" fontWeight="bold">
                            {item.currentStock} {item.unit}
                          </Typography>
                          {getStockStatus(item) === 'low' && (
                            <Warning color="error" fontSize="small" />
                          )}
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={getStockPercentage(item)}
                          color={
                            getStockStatus(item) === 'low'
                              ? 'error'
                              : getStockStatus(item) === 'high'
                              ? 'warning'
                              : 'success'
                          }
                        />
                        <Typography variant="caption" color="text.secondary">
                          Min: {item.minimumStock} / Max: {item.maximumStock}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {item.unitPrice} SDG
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {item.expiryDate ? (
                        <Box>
                          <Typography
                            variant="body2"
                            color={isExpiringSoon(item.expiryDate) ? 'error' : 'inherit'}
                          >
                            {format(new Date(item.expiryDate), 'MMM yyyy')}
                          </Typography>
                          {isExpiringSoon(item.expiryDate) && (
                            <Chip
                              label="Expiring Soon"
                              size="small"
                              color="error"
                              sx={{ mt: 0.5 }}
                            />
                          )}
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          N/A
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {getStockStatus(item) === 'low' ? (
                        <Chip label="Low Stock" size="small" color="error" />
                      ) : getStockStatus(item) === 'high' ? (
                        <Chip label="Overstocked" size="small" color="warning" />
                      ) : (
                        <Chip label="Normal" size="small" color="success" icon={<CheckCircle />} />
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/dashboard/inventory/${item.id}`)}
                      >
                        <Visibility fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => navigate(`/dashboard/inventory/${item.id}/edit`)}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
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

export default InventoryList;

