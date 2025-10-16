/**
 * React Query Configuration
 * ✅ PHASE 3: Optimized caching and data fetching
 * 
 * Centralized configuration for all React Query usage
 */

import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import toast from 'react-hot-toast';

/**
 * Global Query Client with optimized settings
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: Data considered fresh for 5 minutes
      staleTime: 5 * 60 * 1000,
      
      // Cache time: Keep unused data in cache for 10 minutes
      cacheTime: 10 * 60 * 1000,
      
      // Refetch on window focus (user comes back to tab)
      refetchOnWindowFocus: true,
      
      // Refetch when network reconnects
      refetchOnReconnect: true,
      
      // Retry failed requests 2 times
      retry: (failureCount, error: any) => {
        // Don't retry on 404 or 401
        if (error?.response?.status === 404 || error?.response?.status === 401) {
          return false;
        }
        return failureCount < 2;
      },
      
      // Exponential backoff for retries
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Suspense mode disabled (use loading states instead)
      suspense: false,
      
      // Keep previous data while fetching new data
      keepPreviousData: true,
    },
    
    mutations: {
      // Retry mutations once
      retry: 1,
      
      // Retry delay for mutations
      retryDelay: 1000,
    },
  },
  
  // Global query cache
  queryCache: new QueryCache({
    onError: (error: any) => {
      console.error('[QueryCache] Error:', error);
      
      // Show error toast for failed queries
      if (error?.response?.status === 401) {
        toast.error('Session expired. Please log in again.');
        // Redirect to login
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else if (error?.response?.status === 403) {
        toast.error('You don\'t have permission to access this resource');
      } else if (error?.response?.status >= 500) {
        toast.error('Server error. Please try again later.');
      } else if (error?.message) {
        toast.error(error.message);
      }
    },
    
    onSuccess: (data) => {
      console.log('[QueryCache] Success:', data);
    },
  }),
  
  // Global mutation cache
  mutationCache: new MutationCache({
    onError: (error: any) => {
      console.error('[MutationCache] Error:', error);
      
      // Show error toast for failed mutations
      const message = error?.response?.data?.message || 
                     error?.response?.data?.error?.message ||
                     error?.message ||
                     'An error occurred';
      toast.error(message);
    },
    
    onSuccess: (data: any) => {
      // Show success toast for successful mutations
      const message = data?.message || 'Operation successful';
      if (data?.success !== false) {
        toast.success(message);
      }
    },
  }),
});

/**
 * Query key factory
 * Centralized query key management
 */
export const queryKeys = {
  // Auth
  me: ['me'] as const,
  users: (filters?: any) => ['users', filters] as const,
  user: (id: string) => ['users', id] as const,
  
  // Patients
  patients: (filters?: any) => ['patients', filters] as const,
  patient: (id: string) => ['patients', id] as const,
  patientComplete: (id: string) => ['patients', id, 'complete'] as const,
  
  // Appointments
  appointments: (filters?: any) => ['appointments', filters] as const,
  appointment: (id: string) => ['appointments', id] as const,
  appointmentAvailability: (doctorId: string, date: string) => 
    ['appointments', 'availability', doctorId, date] as const,
  
  // Billing
  invoices: (filters?: any) => ['invoices', filters] as const,
  invoice: (id: string) => ['invoices', id] as const,
  
  // Payments
  payments: (filters?: any) => ['payments', filters] as const,
  payment: (id: string) => ['payments', id] as const,
  
  // Labs
  labOrders: (filters?: any) => ['lab-orders', filters] as const,
  labOrder: (id: string) => ['lab-orders', id] as const,
  labResults: (orderId: string) => ['lab-orders', orderId, 'results'] as const,
  
  // Medications
  medications: (filters?: any) => ['medications', filters] as const,
  prescriptions: (patientId?: string) => ['prescriptions', patientId] as const,
  
  // Inventory
  inventory: (filters?: any) => ['inventory', filters] as const,
  inventoryItem: (id: string) => ['inventory', id] as const,
  
  // Facilities
  facilities: () => ['facilities'] as const,
  facility: (id: string) => ['facilities', id] as const,
  
  // Dashboard
  dashboardStats: (role: string) => ['dashboard', 'stats', role] as const,
  dashboardActivities: (role: string) => ['dashboard', 'activities', role] as const,
};

/**
 * Query invalidation helpers
 */
export const invalidateQueries = {
  patients: () => queryClient.invalidateQueries(['patients']),
  appointments: () => queryClient.invalidateQueries(['appointments']),
  invoices: () => queryClient.invalidateQueries(['invoices']),
  allDashboards: () => queryClient.invalidateQueries(['dashboard']),
};

export default queryClient;

