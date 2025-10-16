/**
 * Dashboard Hooks
 * 
 * React Query hooks for fetching role-specific dashboard data
 * @module hooks/dashboard
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboard.service';

interface DashboardStats {
  [key: string]: number | string;
}

interface DashboardResponse {
  status: number;
  success: boolean;
  message: string;
  data: DashboardStats;
  timestamp: string;
  request_id: string;
}

/**
 * Hook for Doctor Dashboard
 * Auto-refreshes every 30 seconds
 */
export function useDoctorDashboard(): UseQueryResult<DashboardResponse> {
  return useQuery({
    queryKey: ['doctor-dashboard'],
    queryFn: dashboardService.getDoctorStats,
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 20000, // Consider data stale after 20 seconds
    retry: 3,
    retryDelay: 1000,
  });
}

/**
 * Hook for Nurse Dashboard
 * Auto-refreshes every 30 seconds
 */
export function useNurseDashboard(): UseQueryResult<DashboardResponse> {
  return useQuery({
    queryKey: ['nurse-dashboard'],
    queryFn: dashboardService.getNurseStats,
    refetchInterval: 30000,
    staleTime: 20000,
    retry: 3,
  });
}

/**
 * Hook for Receptionist Dashboard
 * Auto-refreshes every 30 seconds
 */
export function useReceptionistDashboard(): UseQueryResult<DashboardResponse> {
  return useQuery({
    queryKey: ['receptionist-dashboard'],
    queryFn: dashboardService.getReceptionistStats,
    refetchInterval: 30000,
    staleTime: 20000,
    retry: 3,
  });
}

/**
 * Hook for Admin Dashboard
 * Auto-refreshes every 60 seconds (less frequent)
 */
export function useAdminDashboard(): UseQueryResult<DashboardResponse> {
  return useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: dashboardService.getAdminStats,
    refetchInterval: 60000, // Refresh every minute
    staleTime: 40000,
    retry: 3,
  });
}

/**
 * Hook for Billing Clerk Dashboard
 * Auto-refreshes every 30 seconds
 */
export function useBillingDashboard(): UseQueryResult<DashboardResponse> {
  return useQuery({
    queryKey: ['billing-dashboard'],
    queryFn: dashboardService.getBillingStats,
    refetchInterval: 30000,
    staleTime: 20000,
    retry: 3,
  });
}

/**
 * Hook for Lab Tech Dashboard
 * Auto-refreshes every 30 seconds
 */
export function useLabDashboard(): UseQueryResult<DashboardResponse> {
  return useQuery({
    queryKey: ['lab-dashboard'],
    queryFn: dashboardService.getLabStats,
    refetchInterval: 30000,
    staleTime: 20000,
    retry: 3,
  });
}

/**
 * Hook for Pharmacist Dashboard
 * Auto-refreshes every 30 seconds
 */
export function usePharmacistDashboard(): UseQueryResult<DashboardResponse> {
  return useQuery({
    queryKey: ['pharmacist-dashboard'],
    queryFn: dashboardService.getPharmacistStats,
    refetchInterval: 30000,
    staleTime: 20000,
    retry: 3,
  });
}

