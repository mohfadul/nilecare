import { useState } from 'react';
import {
  Badge,
  IconButton,
  Popover,
  List,
  ListItem,
  ListItemText,
  Typography,
  Box,
  Divider,
  Button,
  Chip,
} from '@mui/material';
import { Notifications, Circle } from '@mui/icons-material';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  timestamp: string;
}

export function NotificationCenter() {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  
  // TODO: Replace with real notifications from API
  const notifications: Notification[] = [
    {
      id: '1',
      title: 'Lab Results Ready',
      message: 'CBC results for Patient #1234 are now available',
      type: 'info',
      read: false,
      timestamp: new Date().toISOString(),
    },
    {
      id: '2',
      title: 'Payment Received',
      message: 'Payment of 500 SDG received for Invoice #INV-2025-001',
      type: 'success',
      read: false,
      timestamp: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: '3',
      title: 'Critical Alert',
      message: 'Abnormal vital signs detected for Patient #5678',
      type: 'error',
      read: true,
      timestamp: new Date(Date.now() - 7200000).toISOString(),
    },
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const getTypeColor = (type: Notification['type']) => {
    const colors: Record<Notification['type'], 'info' | 'success' | 'warning' | 'error'> = {
      'info': 'info',
      'success': 'success',
      'warning': 'warning',
      'error': 'error',
    };
    return colors[type];
  };

  const open = Boolean(anchorEl);
  const id = open ? 'notification-popover' : undefined;

  return (
    <>
      <IconButton color="inherit" onClick={handleClick}>
        <Badge badgeContent={unreadCount} color="error">
          <Notifications />
        </Badge>
      </IconButton>

      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <Box sx={{ width: 400, maxHeight: 500 }}>
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Notifications</Typography>
            {unreadCount > 0 && (
              <Button size="small">Mark All Read</Button>
            )}
          </Box>
          <Divider />

          {notifications.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No notifications
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0, maxHeight: 400, overflow: 'auto' }}>
              {notifications.map((notification, index) => (
                <Box key={notification.id}>
                  <ListItem
                    sx={{
                      bgcolor: notification.read ? 'transparent' : 'action.hover',
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'action.selected' },
                    }}
                  >
                    <Box sx={{ mr: 2 }}>
                      <Circle
                        fontSize="small"
                        color={getTypeColor(notification.type)}
                        sx={{ opacity: notification.read ? 0.3 : 1 }}
                      />
                    </Box>
                    <ListItemText
                      primary={
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="body2" fontWeight={notification.read ? 'normal' : 'bold'}>
                            {notification.title}
                          </Typography>
                          {!notification.read && (
                            <Chip label="New" size="small" color="primary" sx={{ ml: 1 }} />
                          )}
                        </Box>
                      }
                      secondary={
                        <>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            {notification.message}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                            {new Date(notification.timestamp).toLocaleString()}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                  {index < notifications.length - 1 && <Divider />}
                </Box>
              ))}
            </List>
          )}

          <Divider />
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Button size="small" fullWidth>
              View All Notifications
            </Button>
          </Box>
        </Box>
      </Popover>
    </>
  );
}

