import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  MenuItem,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  Chip,
  OutlinedInput,
} from '@mui/material';
import { FilterList } from '@mui/icons-material';

interface AppointmentAdvancedSearchProps {
  open: boolean;
  onClose: () => void;
  onSearch: (filters: any) => void;
}

const AppointmentAdvancedSearch: React.FC<AppointmentAdvancedSearchProps> = ({
  open,
  onClose,
  onSearch,
}) => {
  const [filters, setFilters] = useState({
    searchTerm: '',
    status: '',
    statuses: [] as string[],
    dateFrom: '',
    dateTo: '',
    duration: '',
    appointmentType: '',
  });

  const statusOptions = [
    'scheduled',
    'confirmed',
    'checked-in',
    'in-progress',
    'completed',
    'cancelled',
    'no-show',
  ];

  const handleChange = (field: string, value: any) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleSearch = () => {
    const activeFilters: any = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        if (value.length > 0) activeFilters[key] = value;
      } else if (value !== '') {
        activeFilters[key] = value;
      }
    });
    onSearch(activeFilters);
    onClose();
  };

  const handleReset = () => {
    setFilters({
      searchTerm: '',
      status: '',
      statuses: [],
      dateFrom: '',
      dateTo: '',
      duration: '',
      appointmentType: '',
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <FilterList />
          <Typography variant="h6">Advanced Appointment Search</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            {/* Search Term */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Search (Patient, Provider, Reason)"
                value={filters.searchTerm}
                onChange={(e) => handleChange('searchTerm', e.target.value)}
                placeholder="Enter search term..."
              />
            </Grid>

            {/* Single Status */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Status (Single)"
                value={filters.status}
                onChange={(e) => handleChange('status', e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                {statusOptions.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Multiple Statuses */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Statuses (Multiple)</InputLabel>
                <Select
                  multiple
                  value={filters.statuses}
                  onChange={(e) => handleChange('statuses', e.target.value)}
                  input={<OutlinedInput label="Statuses (Multiple)" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(selected as string[]).map((value) => (
                        <Chip
                          key={value}
                          label={value.charAt(0).toUpperCase() + value.slice(1).replace('-', ' ')}
                          size="small"
                        />
                      ))}
                    </Box>
                  )}
                >
                  {statusOptions.map((status) => (
                    <MenuItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Date Range */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="Date From"
                value={filters.dateFrom}
                onChange={(e) => handleChange('dateFrom', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="Date To"
                value={filters.dateTo}
                onChange={(e) => handleChange('dateTo', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Duration */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Duration (minutes)"
                value={filters.duration}
                onChange={(e) => handleChange('duration', e.target.value)}
                inputProps={{ min: 0, step: 15 }}
              />
            </Grid>

            {/* Appointment Type */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Appointment Type"
                value={filters.appointmentType}
                onChange={(e) => handleChange('appointmentType', e.target.value)}
                placeholder="e.g., Consultation, Follow-up"
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleReset} color="inherit">
          Reset
        </Button>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button onClick={handleSearch} variant="contained" color="primary">
          Search
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AppointmentAdvancedSearch;

