import { Card, CardContent, Typography, Box, CircularProgress } from '@mui/material';
import { ReactNode } from 'react';

/**
 * Shared StatCard Component
 * ✅ PHASE 3: Reusable statistics card for all dashboards
 * 
 * Used in all 7 dashboards to display key metrics
 */

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  trend?: {
    value: number;
    label: string;
  };
  loading?: boolean;
  onClick?: () => void;
}

const colorMap = {
  primary: '#667eea',
  secondary: '#764ba2',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
};

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  color = 'primary',
  trend,
  loading = false,
  onClick,
}: StatCardProps) {
  const bgColor = colorMap[color];
  
  return (
    <Card
      sx={{
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': onClick ? {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        } : {},
      }}
      onClick={onClick}
    >
      <CardContent>
        {/* Header with icon */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          {icon && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 48,
                height: 48,
                borderRadius: 2,
                bgcolor: `${bgColor}15`,
                color: bgColor,
                mr: 2,
              }}
            >
              {icon}
            </Box>
          )}
          
          <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
            {title}
          </Typography>
        </Box>

        {/* Main value */}
        <Box sx={{ mb: 1 }}>
          {loading ? (
            <CircularProgress size={32} />
          ) : (
            <Typography variant="h4" component="div" fontWeight="600">
              {value}
            </Typography>
          )}
        </Box>

        {/* Subtitle or trend */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {subtitle && (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          )}
          
          {trend && (
            <Typography
              variant="body2"
              sx={{
                color: trend.value >= 0 ? 'success.main' : 'error.main',
                fontWeight: 500,
              }}
            >
              {trend.value >= 0 ? '+' : ''}
              {trend.value}% {trend.label}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

export default StatCard;

