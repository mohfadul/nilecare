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
  FormControlLabel,
  Checkbox,
  Box,
  Typography,
} from '@mui/material';
import { FilterList } from '@mui/icons-material';

interface PatientAdvancedSearchProps {
  open: boolean;
  onClose: () => void;
  onSearch: (filters: any) => void;
}

const PatientAdvancedSearch: React.FC<PatientAdvancedSearchProps> = ({
  open,
  onClose,
  onSearch,
}) => {
  const [filters, setFilters] = useState({
    searchTerm: '',
    gender: '',
    minAge: '',
    maxAge: '',
    bloodType: '',
    city: '',
    state: '',
    hasAllergies: false,
    hasMedicalConditions: false,
    dateFrom: '',
    dateTo: '',
  });

  const handleChange = (field: string, value: any) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleSearch = () => {
    // Build filter object with only non-empty values
    const activeFilters: any = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== '' && value !== false) {
        activeFilters[key] = value;
      }
    });
    onSearch(activeFilters);
    onClose();
  };

  const handleReset = () => {
    setFilters({
      searchTerm: '',
      gender: '',
      minAge: '',
      maxAge: '',
      bloodType: '',
      city: '',
      state: '',
      hasAllergies: false,
      hasMedicalConditions: false,
      dateFrom: '',
      dateTo: '',
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <FilterList />
          <Typography variant="h6">Advanced Patient Search</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            {/* Search Term */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Search (Name, Phone, Email, National ID)"
                value={filters.searchTerm}
                onChange={(e) => handleChange('searchTerm', e.target.value)}
                placeholder="Enter search term..."
              />
            </Grid>

            {/* Gender */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Gender"
                value={filters.gender}
                onChange={(e) => handleChange('gender', e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="male">Male</MenuItem>
                <MenuItem value="female">Female</MenuItem>
              </TextField>
            </Grid>

            {/* Blood Type */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Blood Type"
                value={filters.bloodType}
                onChange={(e) => handleChange('bloodType', e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="A+">A+</MenuItem>
                <MenuItem value="A-">A-</MenuItem>
                <MenuItem value="B+">B+</MenuItem>
                <MenuItem value="B-">B-</MenuItem>
                <MenuItem value="AB+">AB+</MenuItem>
                <MenuItem value="AB-">AB-</MenuItem>
                <MenuItem value="O+">O+</MenuItem>
                <MenuItem value="O-">O-</MenuItem>
              </TextField>
            </Grid>

            {/* Age Range */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Min Age"
                value={filters.minAge}
                onChange={(e) => handleChange('minAge', e.target.value)}
                inputProps={{ min: 0, max: 120 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Max Age"
                value={filters.maxAge}
                onChange={(e) => handleChange('maxAge', e.target.value)}
                inputProps={{ min: 0, max: 120 }}
              />
            </Grid>

            {/* Location */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="City"
                value={filters.city}
                onChange={(e) => handleChange('city', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="State"
                value={filters.state}
                onChange={(e) => handleChange('state', e.target.value)}
              />
            </Grid>

            {/* Date Range */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="Registration From"
                value={filters.dateFrom}
                onChange={(e) => handleChange('dateFrom', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="Registration To"
                value={filters.dateTo}
                onChange={(e) => handleChange('dateTo', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Checkboxes */}
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={filters.hasAllergies}
                    onChange={(e) => handleChange('hasAllergies', e.target.checked)}
                  />
                }
                label="Has Allergies"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={filters.hasMedicalConditions}
                    onChange={(e) =>
                      handleChange('hasMedicalConditions', e.target.checked)
                    }
                  />
                }
                label="Has Medical Conditions"
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

export default PatientAdvancedSearch;

