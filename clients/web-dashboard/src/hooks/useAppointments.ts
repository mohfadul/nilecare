/**
 * useAppointments Hook
 * React hook for managing appointments
 */

import { useState, useEffect, useCallback } from 'react';
import { appointmentApi } from '../services/appointment.api';
import { useSnackbar } from 'notistack';

export interface Appointment {
  id: string;
  patient_id: string;
  provider_id: string;
  appointment_date: string;
  appointment_time: string;
  duration: number;
  status: string;
  reason?: string;
  notes?: string;
  patient_first_name?: string;
  patient_last_name?: string;
  provider_first_name?: string;
  provider_last_name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AppointmentFilters {
  page?: number;
  limit?: number;
  status?: string;
  providerId?: string;
  patientId?: string;
  date?: string;
}

export function useAppointments(initialFilters?: AppointmentFilters) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const { enqueueSnackbar } = useSnackbar();

  /**
   * Fetch appointments
   */
  const fetchAppointments = useCallback(async (filters?: AppointmentFilters) => {
    setLoading(true);
    setError(null);

    try {
      const response = await appointmentApi.getAppointments(filters || initialFilters);
      
      if (response.success) {
        setAppointments(response.data.appointments || response.data);
        if (response.data.pagination) {
          setPagination(response.data.pagination);
        }
      } else {
        throw new Error(response.error?.message || 'Failed to fetch appointments');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to fetch appointments';
      setError(errorMessage);
      console.error('Error fetching appointments:', err);
    } finally {
      setLoading(false);
    }
  }, [initialFilters]);

  /**
   * Create appointment
   */
  const createAppointment = async (data: {
    patientId: string;
    providerId: string;
    appointmentDate: string;
    appointmentTime: string;
    duration: number;
    reason?: string;
    notes?: string;
  }) => {
    try {
      const response = await appointmentApi.createAppointment(data);
      
      if (response.success) {
        enqueueSnackbar('Appointment created successfully', { variant: 'success' });
        await fetchAppointments();
        return response.data;
      } else {
        throw new Error(response.error?.message || 'Failed to create appointment');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message;
      enqueueSnackbar(errorMessage, { variant: 'error' });
      throw err;
    }
  };

  /**
   * Update appointment
   */
  const updateAppointment = async (id: string, data: Partial<Appointment>) => {
    try {
      const response = await appointmentApi.updateAppointment(id, data);
      
      if (response.success) {
        enqueueSnackbar('Appointment updated successfully', { variant: 'success' });
        await fetchAppointments();
        return response.data;
      } else {
        throw new Error(response.error?.message || 'Failed to update appointment');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message;
      enqueueSnackbar(errorMessage, { variant: 'error' });
      throw err;
    }
  };

  /**
   * Update appointment status
   */
  const updateStatus = async (id: string, status: string) => {
    try {
      const response = await appointmentApi.updateAppointmentStatus(id, status);
      
      if (response.success) {
        enqueueSnackbar(`Appointment ${status}`, { variant: 'success' });
        await fetchAppointments();
        return response.data;
      } else {
        throw new Error(response.error?.message || 'Failed to update status');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message;
      enqueueSnackbar(errorMessage, { variant: 'error' });
      throw err;
    }
  };

  /**
   * Confirm appointment
   */
  const confirmAppointment = async (id: string) => {
    return updateStatus(id, 'confirmed');
  };

  /**
   * Complete appointment
   */
  const completeAppointment = async (id: string) => {
    return updateStatus(id, 'completed');
  };

  /**
   * Cancel appointment
   */
  const cancelAppointment = async (id: string) => {
    try {
      const response = await appointmentApi.cancelAppointment(id);
      
      if (response.success) {
        enqueueSnackbar('Appointment cancelled successfully', { variant: 'success' });
        await fetchAppointments();
        return response.data;
      } else {
        throw new Error(response.error?.message || 'Failed to cancel appointment');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message;
      enqueueSnackbar(errorMessage, { variant: 'error' });
      throw err;
    }
  };

  /**
   * Get today's appointments
   */
  const fetchTodayAppointments = async (providerId?: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await appointmentApi.getTodayAppointments(providerId);
      
      if (response.success) {
        setAppointments(response.data);
      } else {
        throw new Error(response.error?.message || 'Failed to fetch appointments');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message;
      setError(errorMessage);
      console.error('Error fetching today appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get appointment statistics
   */
  const fetchStats = async (params?: {
    dateFrom?: string;
    dateTo?: string;
    providerId?: string;
  }) => {
    try {
      const response = await appointmentApi.getAppointmentStats(params);
      return response.success ? response.data : [];
    } catch (err: any) {
      console.error('Error fetching stats:', err);
      return [];
    }
  };

  // Load initial data
  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  return {
    appointments,
    loading,
    error,
    pagination,
    fetchAppointments,
    createAppointment,
    updateAppointment,
    updateStatus,
    confirmAppointment,
    completeAppointment,
    cancelAppointment,
    fetchTodayAppointments,
    fetchStats,
  };
}

export default useAppointments;

