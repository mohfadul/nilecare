/**
 * Pharmacist Dashboard
 * Medication management, prescriptions, inventory
 */

import React, { useState, useEffect } from 'react';
import {
  Grid, Card, CardContent, Typography, Box, Button, List, ListItem,
  ListItemText, ListItemAvatar, Avatar, Chip, CircularProgress,
} from '@mui/material';
import { Medication, Inventory, LocalShipping, Warning } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const StatCard: React.FC<{
  title: string; value: string | number; icon: React.ReactNode; color: string;
}> = ({ title, value, icon, color }) => (
  <Card>
    <CardContent>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography color="textSecondary" variant="body2">{title}</Typography>
          <Typography variant="h4" fontWeight="bold">{value}</Typography>
        </Box>
        <Avatar sx={{ bgcolor: color, width: 56, height: 56 }}>{icon}</Avatar>
      </Box>
    </CardContent>
  </Card>
);

const PharmacistDashboard: React.FC = () => {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ pendingScripts: 0, lowStock: 0, dispensedToday: 0, ordersArriving: 0 });
  const [pendingPrescriptions, setPendingPrescriptions] = useState<any[]>([]);
  const [lowStock, setLowStock] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch stats
        const statsRes = await fetch('http://localhost:7001/api/v1/data/dashboard/stats');
        const statsData = await statsRes.json();
        if (statsData.success) {
          setStats({
            pendingScripts: 24,
            lowStock: statsData.data.lowStockItems || 0,
            dispensedToday: 156,
            ordersArriving: 5
          });
        }

        // Fetch pending prescriptions
        const rxRes = await fetch('http://localhost:7001/api/v1/data/prescriptions/pending');
        const rxData = await rxRes.json();
        if (rxData.success) {
          const prescriptions = (rxData.data || []).slice(0, 2).map((rx: any) => ({
            patient: `${rx.patient_first_name} ${rx.patient_last_name}`,
            medication: rx.medication_name,
            quantity: `${rx.quantity} tablets`,
            status: rx.status
          }));
          setPendingPrescriptions(prescriptions);
        }

        // Fetch low stock items
        const invRes = await fetch('http://localhost:7001/api/v1/data/inventory/low-stock');
        const invData = await invRes.json();
        if (invData.success) {
          const items = (invData.data || []).slice(0, 2).map((item: any) => ({
            medication: item.item_name,
            current: item.quantity.toString(),
            reorder: item.reorder_level.toString(),
            status: item.quantity < 50 ? 'critical' : 'low'
          }));
          setLowStock(items);
        }

      } catch (error) {
        console.error('Error fetching pharmacist dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Pharmacy Dashboard - {user?.username || user?.first_name} 💊
      </Typography>

      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Pending Scripts" value={stats.pendingScripts} icon={<Medication />} color="#1976d2" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Low Stock Items" value={stats.lowStock} icon={<Warning />} color="#d32f2f" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Dispensed Today" value={stats.dispensedToday} icon={<Medication />} color="#2e7d32" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Orders Arriving" value={stats.ordersArriving} icon={<LocalShipping />} color="#ed6c02" />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" mb={2}>
                📋 Pending Prescriptions
              </Typography>
              <List>
                {pendingPrescriptions.map((rx, idx) => (
                  <ListItem key={idx} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, mb: 1 }}>
                    <ListItemAvatar>
                      <Avatar><Medication /></Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={rx.medication}
                      secondary={`${rx.patient} - ${rx.quantity}`}
                    />
                    <Button size="small" variant="contained">Dispense</Button>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" mb={2}>
                ⚠️ Low Stock Items
              </Typography>
              <List>
                {lowStock.map((item, idx) => (
                  <ListItem key={idx} sx={{ border: '1px solid', borderColor: 'warning.main', borderRadius: 1, mb: 1 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'warning.main' }}><Warning /></Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={item.medication}
                      secondary={`Current: ${item.current} • Reorder: ${item.reorder}`}
                    />
                    <Button size="small" variant="outlined" color="warning">Order</Button>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" mb={2}>🚀 Quick Actions</Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Button fullWidth variant="contained" startIcon={<Medication />}>Dispense</Button>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Button fullWidth variant="contained" startIcon={<Inventory />} color="secondary">Inventory</Button>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Button fullWidth variant="contained" startIcon={<LocalShipping />} color="info">Orders</Button>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Button fullWidth variant="contained" color="success">Reports</Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PharmacistDashboard;

