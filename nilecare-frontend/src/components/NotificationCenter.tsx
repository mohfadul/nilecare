/**
 * Notification Center Component
 * ✅ PHASE 8: Advanced Features - Notification Management
 * 
 * Displays real-time notifications with badge counter
 */

import { useState } from 'react';
import {
  IconButton,
  Badge,
  Drawer,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  Button,
  Chip
} from '@mui/material';
import {
  Notifications,
  NotificationsActive,
  Check,
  Delete,
  Info,
  Warning,
  Error as ErrorIcon,
  CheckCircle
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * Mock notification service (replace with real API)
 */
const notificationService = {
  getRecent: async () => {
    // Mock data - replace with real API call
    return {
      data: [
        {
          id: 1,
          title: 'Lab Results Available',
          message: 'Patient John Doe - CBC results are ready for review',
          type: 'info',
          read: false,
          timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString()
        },
        {
          id: 2,
          title: 'Critical Vital Signs',
          message: 'Patient Jane Smith - Heart rate 140 bpm',
          type: 'critical',
          read: false,
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString()
        },
        {
          id: 3,
          title: 'Appointment Reminder',
          message: 'Upcoming appointment in 30 minutes',
          type: 'warning',
          read: true,
          timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString()
        }
      ]
    };
  },
  
  markAsRead: async (id: number) => {
    console.log('Marking notification as read:', id);
    return { success: true };
  },
  
  markAllAsRead: async () => {
    console.log('Marking all notifications as read');
    return { success: true };
  },
  
  deleteNotification: async (id: number) => {
    console.log('Deleting notification:', id);
    return { success: true };
  }
};

/**
 * Get icon based on notification type
 */
const getNotificationIcon = (type: string) => {
  const icons = {
    info: <Info color="info" />,
    warning: <Warning color="warning" />,
    critical: <ErrorIcon color="error" />,
    success: <CheckCircle color="success" />
  };
  return icons[type as keyof typeof icons] || <Info />;
};

/**
 * Get color based on notification type
 */
const getNotificationColor = (type: string) => {
  const colors = {
    info: '#2196f3',
    warning: '#ff9800',
    critical: '#f44336',
    success: '#4caf50'
  };
  return colors[type as keyof typeof colors] || '#2196f3';
};

/**
 * Notification Center Component
 */
export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  
  // Fetch notifications
  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationService.getRecent,
    refetchInterval: 10000 // Refresh every 10 seconds
  });
  
  // Mark as read mutation
  const markAsRead = useMutation({
    mutationFn: notificationService.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });
  
  // Mark all as read mutation
  const markAllAsRead = useMutation({
    mutationFn: notificationService.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });
  
  // Delete notification mutation
  const deleteNotification = useMutation({
    mutationFn: notificationService.deleteNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });
  
  const unreadCount = notifications?.data?.filter(n => !n.read).length || 0;
  const hasUnread = unreadCount > 0;
  
  return (
    <>
      {/* Notification Bell Icon */}
      <IconButton 
        color="inherit" 
        onClick={() => setOpen(true)}
        sx={{ position: 'relative' }}
      >
        <Badge badgeContent={unreadCount} color="error">
          {hasUnread ? <NotificationsActive /> : <Notifications />}
        </Badge>
      </IconButton>
      
      {/* Notification Drawer */}
      <Drawer 
        anchor="right" 
        open={open} 
        onClose={() => setOpen(false)}
        PaperProps={{
          sx: { width: 400 }
        }}
      >
        <Box sx={{ p: 2 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Notifications ({unreadCount} unread)
            </Typography>
            {hasUnread && (
              <Button 
                size="small" 
                onClick={() => markAllAsRead.mutate()}
                startIcon={<Check />}
              >
                Mark All Read
              </Button>
            )}
          </Box>
          
          <Divider />
          
          {/* Notifications List */}
          {!notifications?.data || notifications.data.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Notifications sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="body2" color="text.secondary">
                No notifications
              </Typography>
            </Box>
          ) : (
            <List sx={{ pt: 2 }}>
              {notifications.data.map((notification) => (
                <Box key={notification.id}>
                  <ListItem
                    alignItems="flex-start"
                    sx={{
                      bgcolor: notification.read ? 'transparent' : 'action.hover',
                      borderLeft: `4px solid ${getNotificationColor(notification.type)}`,
                      mb: 1,
                      borderRadius: 1
                    }}
                    secondaryAction={
                      <IconButton 
                        edge="end" 
                        aria-label="delete"
                        onClick={() => deleteNotification.mutate(notification.id)}
                        size="small"
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    }
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: getNotificationColor(notification.type) }}>
                        {getNotificationIcon(notification.type)}
                      </Avatar>
                    </ListItemAvatar>
                    
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle2">
                            {notification.title}
                          </Typography>
                          {!notification.read && (
                            <Chip label="New" size="small" color="primary" sx={{ height: 20 }} />
                          )}
                        </Box>
                      }
                      secondary={
                        <>
                          <Typography variant="body2" color="text.primary" gutterBottom>
                            {notification.message}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(notification.timestamp).toLocaleString()}
                          </Typography>
                        </>
                      }
                      sx={{ cursor: 'pointer' }}
                      onClick={() => !notification.read && markAsRead.mutate(notification.id)}
                    />
                  </ListItem>
                  <Divider />
                </Box>
              ))}
            </List>
          )}
          
          {/* View All Button */}
          {notifications?.data && notifications.data.length > 0 && (
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Button variant="text" fullWidth>
                View All Notifications
              </Button>
            </Box>
          )}
        </Box>
      </Drawer>
    </>
  );
}

export default NotificationCenter;

