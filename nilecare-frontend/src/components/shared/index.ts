/**
 * Shared Components Index
 * ✅ PHASE 3: Export all shared components from one place
 * 
 * Makes imports cleaner:
 * import { DataTable, StatCard, LoadingSkeleton } from '@/components/shared';
 */

// Core components
export { DataTable } from './DataTable';
export { StatCard } from './StatCard';
export { ErrorBoundary } from './ErrorBoundary';

// Loading states
export {
  TableSkeleton,
  CardSkeleton,
  StatCardSkeleton,
  PageSkeleton,
  FormSkeleton,
  DashboardSkeleton,
} from './LoadingSkeleton';

// Types
export type { Column } from './DataTable';

