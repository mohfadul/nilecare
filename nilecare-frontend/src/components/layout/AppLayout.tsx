import { ReactNode, useState } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  People,
  CalendarToday,
  LocalHospital,
  Payment,
  Settings,
  Logout,
  Science,
  Medication,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { authStore } from '../../store/authStore';
import { RoleGate } from '../auth/RoleGate';
import { NotificationCenter } from '../notifications/NotificationCenter';

interface AppLayoutProps {
  children: ReactNode;
}

const drawerWidth = 240;

export function AppLayout({ children }: AppLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const user = authStore((state) => state.user);
  const logout = authStore((state) => state.logout);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard', roles: ['*'] },
    { text: 'Patients', icon: <People />, path: '/patients', roles: ['doctor', 'nurse', 'receptionist', 'admin'] },
    { text: 'Appointments', icon: <CalendarToday />, path: '/appointments', roles: ['doctor', 'nurse', 'receptionist', 'admin'] },
    { text: 'Lab Orders', icon: <Science />, path: '/clinical/labs', roles: ['doctor', 'nurse', 'lab_technician', 'lab_tech', 'laboratory', 'admin'] },
    { text: 'Medications', icon: <Medication />, path: '/clinical/medications', roles: ['doctor', 'nurse', 'pharmacist', 'pharmacy', 'admin'] },
    { text: 'Billing', icon: <Payment />, path: '/billing/invoices', roles: ['billing_clerk', 'billing', 'admin'] },
    { text: 'Settings', icon: <Settings />, path: '/settings', roles: ['admin', 'super_admin'] },
  ];

  const drawer = (
    <Box>
      <Toolbar>
        <Typography variant="h6" noWrap>
          NileCare
        </Typography>
      </Toolbar>
      <List>
        {menuItems.map((item) => (
          <RoleGate key={item.text} roles={item.roles}>
            <ListItem disablePadding>
              <ListItemButton onClick={() => navigate(item.path)}>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          </RoleGate>
        ))}
        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout}>
            <ListItemIcon>
              <Logout />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            NileCare Healthcare Platform
          </Typography>
          <NotificationCenter />
          <Typography variant="body2" sx={{ ml: 2 }}>
            {user?.firstName} {user?.lastName} ({user?.role})
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
      >
        {drawer}
      </Drawer>

      {/* Desktop drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
        open
      >
        {drawer}
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` } }}>
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}

