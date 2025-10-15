/**
 * Dashboard Layout
 * Main layout with sidebar navigation and header
 */

import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  Divider,
  Tooltip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  People,
  CalendarMonth,
  LocalHospital,
  Medication,
  Science,
  Payment,
  Inventory,
  Settings,
  Notifications,
  AccountCircle,
  Logout,
  NightsStay,
  WbSunny,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const DRAWER_WIDTH = 260;

interface NavigationItem {
  title: string;
  icon: JSX.Element;
  path: string;
  roles?: string[];
}

const DashboardLayout: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, hasRole } = useAuth();

  const [drawerOpen, setDrawerOpen] = useState(!isMobile);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [darkMode, setDarkMode] = useState(false);

  const navigationItems: NavigationItem[] = [
    {
      title: 'Dashboard',
      icon: <Dashboard />,
      path: '/dashboard',
    },
    {
      title: 'Patients',
      icon: <People />,
      path: '/dashboard/patients',
      roles: ['doctor', 'nurse', 'admin'],
    },
    {
      title: 'Appointments',
      icon: <CalendarMonth />,
      path: '/dashboard/appointments',
      roles: ['doctor', 'nurse', 'receptionist', 'admin'],
    },
    {
      title: 'Clinical Notes',
      icon: <LocalHospital />,
      path: '/dashboard/clinical-notes',
      roles: ['doctor', 'nurse'],
    },
    {
      title: 'Medications',
      icon: <Medication />,
      path: '/dashboard/medications',
      roles: ['doctor', 'nurse', 'pharmacist'],
    },
    {
      title: 'Lab Orders',
      icon: <Science />,
      path: '/dashboard/lab-orders',
      roles: ['doctor', 'nurse', 'lab_technician'],
    },
    {
      title: 'Billing',
      icon: <Payment />,
      path: '/dashboard/billing',
      roles: ['billing_specialist', 'accountant', 'admin'],
    },
    {
      title: 'Inventory',
      icon: <Inventory />,
      path: '/dashboard/inventory',
      roles: ['pharmacist', 'inventory_manager', 'admin'],
    },
    {
      title: 'Settings',
      icon: <Settings />,
      path: '/dashboard/settings',
    },
  ];

  const filteredNavItems = navigationItems.filter((item) => {
    if (!item.roles) return true;
    return hasRole(item.roles);
  });

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      navigate('/login');
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    // Would integrate with theme context
  };

  const drawer = (
    <Box>
      {/* Logo Section */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <LocalHospital color="primary" sx={{ fontSize: 32 }} />
        <Box>
          <Typography variant="h6" fontWeight="bold">
            NileCare
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Healthcare Platform
          </Typography>
        </Box>
      </Box>

      <Divider />

      {/* Navigation Items */}
      <List>
        {filteredNavItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              onClick={() => navigate(item.path)}
              selected={location.pathname === item.path}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.title} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: 'white',
          color: 'text.primary',
          boxShadow: 1,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {user?.role && `${user.role.charAt(0).toUpperCase() + user.role.slice(1)} Dashboard`}
          </Typography>

          {/* Theme Toggle */}
          <Tooltip title={darkMode ? 'Light Mode' : 'Dark Mode'}>
            <IconButton onClick={toggleDarkMode} color="inherit">
              {darkMode ? <WbSunny /> : <NightsStay />}
            </IconButton>
          </Tooltip>

          {/* Notifications */}
          <Tooltip title="Notifications">
            <IconButton color="inherit">
              <Badge badgeContent={3} color="error">
                <Notifications />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* User Profile Menu */}
          <Tooltip title="Account">
            <IconButton onClick={handleProfileMenuOpen} color="inherit">
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                {user?.username?.charAt(0).toUpperCase() || <AccountCircle />}
              </Avatar>
            </IconButton>
          </Tooltip>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleProfileMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <Box sx={{ px: 2, py: 1 }}>
              <Typography variant="subtitle2">{user?.username}</Typography>
              <Typography variant="caption" color="text.secondary">
                {user?.email}
              </Typography>
            </Box>
            <Divider />
            <MenuItem onClick={() => navigate('/dashboard/profile')}>
              <AccountCircle sx={{ mr: 1 }} /> Profile
            </MenuItem>
            <MenuItem onClick={() => navigate('/dashboard/settings')}>
              <Settings sx={{ mr: 1 }} /> Settings
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <Logout sx={{ mr: 1 }} /> Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Sidebar Drawer */}
      <Drawer
        variant={isMobile ? 'temporary' : 'persistent'}
        open={drawerOpen}
        onClose={handleDrawerToggle}
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
          },
        }}
      >
        <Toolbar /> {/* Spacer for AppBar */}
        {drawer}
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerOpen ? DRAWER_WIDTH : 0}px)` },
          marginLeft: drawerOpen && !isMobile ? `${DRAWER_WIDTH}px` : 0,
          transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Toolbar /> {/* Spacer for AppBar */}
        <Outlet />
      </Box>
    </Box>
  );
};

export default DashboardLayout;

