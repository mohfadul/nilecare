import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  TableSortLabel,
  Checkbox,
  IconButton,
  Toolbar,
  Typography,
  TextField,
  InputAdornment,
  Box,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';

/**
 * Shared DataTable Component
 * ✅ PHASE 3: Reusable table component for all list pages
 * 
 * Features:
 * - Sorting
 * - Pagination
 * - Search
 * - Row selection
 * - Customizable columns
 * - Loading state
 * - Empty state
 */

export interface Column<T> {
  id: keyof T | string;
  label: string;
  minWidth?: number;
  align?: 'left' | 'right' | 'center';
  format?: (value: any, row: T) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  onRowClick?: (row: T) => void;
  selectable?: boolean;
  onSelectionChange?: (selected: T[]) => void;
  searchable?: boolean;
  searchPlaceholder?: string;
  title?: string;
  emptyMessage?: string;
}

export function DataTable<T extends { id: string | number }>({
  columns,
  data,
  loading = false,
  onRowClick,
  selectable = false,
  onSelectionChange,
  searchable = true,
  searchPlaceholder = 'Search...',
  title,
  emptyMessage = 'No data available',
}: DataTableProps<T>) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState<keyof T | string>('');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [selected, setSelected] = useState<Set<string | number>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  // Handle sort
  const handleSort = (columnId: keyof T | string) => {
    const isAsc = orderBy === columnId && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(columnId);
  };

  // Handle pagination
  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle selection
  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelected = new Set(filteredData.map(row => row.id));
      setSelected(newSelected);
      onSelectionChange?.(filteredData);
    } else {
      setSelected(new Set());
      onSelectionChange?.([]);
    }
  };

  const handleSelectRow = (id: string | number) => {
    const newSelected = new Set(selected);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelected(newSelected);
    
    const selectedRows = data.filter(row => newSelected.has(row.id));
    onSelectionChange?.(selectedRows);
  };

  // Filter data by search term
  const filteredData = searchTerm
    ? data.filter((row) => {
        const searchLower = searchTerm.toLowerCase();
        return columns.some((column) => {
          const value = row[column.id as keyof T];
          return String(value).toLowerCase().includes(searchLower);
        });
      })
    : data;

  // Sort data
  const sortedData = [...filteredData].sort((a, b) => {
    if (!orderBy) return 0;
    
    const aValue = a[orderBy as keyof T];
    const bValue = b[orderBy as keyof T];
    
    if (aValue < bValue) return order === 'asc' ? -1 : 1;
    if (aValue > bValue) return order === 'asc' ? 1 : -1;
    return 0;
  });

  // Paginate data
  const paginatedData = sortedData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      {/* Toolbar */}
      <Toolbar sx={{ pl: { sm: 2 }, pr: { xs: 1, sm: 1 } }}>
        <Typography
          sx={{ flex: '1 1 100%' }}
          variant="h6"
          component="div"
        >
          {title}
          {selected.size > 0 && ` (${selected.size} selected)`}
        </Typography>

        {searchable && (
          <TextField
            size="small"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ width: 300 }}
          />
        )}
      </Toolbar>

      {/* Table */}
      <TableContainer sx={{ maxHeight: 600 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {selectable && (
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selected.size > 0 && selected.size < filteredData.length}
                    checked={filteredData.length > 0 && selected.size === filteredData.length}
                    onChange={handleSelectAll}
                  />
                </TableCell>
              )}
              
              {columns.map((column) => (
                <TableCell
                  key={String(column.id)}
                  align={column.align}
                  style={{ minWidth: column.minWidth }}
                >
                  {column.sortable !== false ? (
                    <TableSortLabel
                      active={orderBy === column.id}
                      direction={orderBy === column.id ? order : 'asc'}
                      onClick={() => handleSort(column.id)}
                    >
                      {column.label}
                    </TableSortLabel>
                  ) : (
                    column.label
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              // Loading skeleton rows
              Array.from({ length: rowsPerPage }).map((_, index) => (
                <TableRow key={`skeleton-${index}`}>
                  {selectable && <TableCell />}
                  {columns.map((column) => (
                    <TableCell key={String(column.id)}>
                      <Box sx={{ bgcolor: 'action.hover', height: 20, borderRadius: 1 }} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : paginatedData.length === 0 ? (
              // Empty state
              <TableRow>
                <TableCell
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  align="center"
                  sx={{ py: 8 }}
                >
                  <Typography color="text.secondary">
                    {searchTerm ? 'No results found' : emptyMessage}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              // Data rows
              paginatedData.map((row) => {
                const isSelected = selected.has(row.id);
                
                return (
                  <TableRow
                    hover
                    key={row.id}
                    selected={isSelected}
                    onClick={() => onRowClick?.(row)}
                    sx={{ cursor: onRowClick ? 'pointer' : 'default' }}
                  >
                    {selectable && (
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={isSelected}
                          onChange={() => handleSelectRow(row.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </TableCell>
                    )}
                    
                    {columns.map((column) => {
                      const value = row[column.id as keyof T];
                      return (
                        <TableCell key={String(column.id)} align={column.align}>
                          {column.format ? column.format(value, row) : String(value)}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50, 100]}
        component="div"
        count={filteredData.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  );
}

export default DataTable;

