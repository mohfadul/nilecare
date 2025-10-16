import { Skeleton, Box, Card, CardContent } from '@mui/material';

/**
 * Loading Skeleton Components
 * ✅ PHASE 3: Loading states for better UX
 * 
 * Provides consistent loading experience across the application
 */

/**
 * Table loading skeleton
 */
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <Box>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <Box
          key={rowIndex}
          sx={{
            display: 'flex',
            gap: 2,
            mb: 1,
            p: 2,
            bgcolor: 'background.paper',
            borderRadius: 1,
          }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={colIndex}
              variant="rectangular"
              height={20}
              sx={{ flex: 1 }}
            />
          ))}
        </Box>
      ))}
    </Box>
  );
}

/**
 * Card loading skeleton
 */
export function CardSkeleton({ count = 1 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} sx={{ mb: 2 }}>
          <CardContent>
            <Skeleton variant="text" width="60%" height={30} sx={{ mb: 2 }} />
            <Skeleton variant="rectangular" height={100} sx={{ mb: 2 }} />
            <Skeleton variant="text" width="40%" />
          </CardContent>
        </Card>
      ))}
    </>
  );
}

/**
 * Stat card loading skeleton
 */
export function StatCardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2 }}>
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index}>
          <CardContent>
            <Skeleton variant="text" width="70%" sx={{ mb: 2 }} />
            <Skeleton variant="text" width="50%" height={40} sx={{ mb: 1 }} />
            <Skeleton variant="text" width="40%" />
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}

/**
 * Page loading skeleton
 */
export function PageSkeleton() {
  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Skeleton variant="text" width="30%" height={40} sx={{ mb: 3 }} />
      
      {/* Stats cards */}
      <StatCardSkeleton count={4} />
      
      {/* Table */}
      <Box sx={{ mt: 4 }}>
        <Skeleton variant="text" width="20%" height={30} sx={{ mb: 2 }} />
        <TableSkeleton rows={8} columns={5} />
      </Box>
    </Box>
  );
}

/**
 * Form loading skeleton
 */
export function FormSkeleton({ fields = 6 }: { fields?: number }) {
  return (
    <Box sx={{ p: 3 }}>
      <Skeleton variant="text" width="40%" height={40} sx={{ mb: 4 }} />
      
      {Array.from({ length: fields }).map((_, index) => (
        <Box key={index} sx={{ mb: 3 }}>
          <Skeleton variant="text" width="30%" sx={{ mb: 1 }} />
          <Skeleton variant="rectangular" height={56} />
        </Box>
      ))}
      
      <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
        <Skeleton variant="rectangular" width={120} height={40} />
        <Skeleton variant="rectangular" width={120} height={40} />
      </Box>
    </Box>
  );
}

/**
 * Dashboard loading skeleton
 */
export function DashboardSkeleton() {
  return (
    <Box sx={{ p: 3 }}>
      {/* Welcome message */}
      <Skeleton variant="text" width="50%" height={40} sx={{ mb: 1 }} />
      <Skeleton variant="text" width="30%" sx={{ mb: 4 }} />
      
      {/* Stat cards grid */}
      <StatCardSkeleton count={4} />
      
      {/* Charts */}
      <Box sx={{ mt: 4, display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 3 }}>
        <Card>
          <CardContent>
            <Skeleton variant="text" width="30%" sx={{ mb: 2 }} />
            <Skeleton variant="rectangular" height={300} />
          </CardContent>
        </Card>
        
        <Card>
          <CardContent>
            <Skeleton variant="text" width="40%" sx={{ mb: 2 }} />
            <Skeleton variant="rectangular" height={300} />
          </CardContent>
        </Card>
      </Box>
      
      {/* Recent activity */}
      <Box sx={{ mt: 4 }}>
        <Skeleton variant="text" width="25%" height={30} sx={{ mb: 2 }} />
        <CardSkeleton count={3} />
      </Box>
    </Box>
  );
}

export default {
  TableSkeleton,
  CardSkeleton,
  StatCardSkeleton,
  PageSkeleton,
  FormSkeleton,
  DashboardSkeleton,
};

