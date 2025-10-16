/**
 * Analytics Service
 * ✅ PHASE 8: Advanced Features - Analytics & Reporting
 * 
 * Provides business intelligence and reporting capabilities
 * @module services/analytics
 */

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:7000';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

interface DateRange {
  startDate: string;
  endDate: string;
}

interface RevenueStats {
  total: number;
  byDay: Array<{ date: string; revenue: number }>;
  byService: Array<{ service: string; revenue: number }>;
  byPaymentMethod: Array<{ method: string; amount: number }>;
}

interface PatientStats {
  total: number;
  new: number;
  active: number;
  byAge: Array<{ ageGroup: string; count: number }>;
  byGender: Array<{ gender: string; count: number }>;
}

interface AppointmentTrends {
  byDay: Array<{ date: string; count: number; completed: number; cancelled: number }>;
  bySpecialty: Array<{ specialty: string; count: number }>;
  averageWaitTime: number;
}

export const analyticsService = {
  /**
   * Get revenue analytics for date range
   * @param startDate Start date (YYYY-MM-DD)
   * @param endDate End date (YYYY-MM-DD)
   * @returns Revenue statistics and breakdowns
   */
  getRevenueStats: async (startDate: string, endDate: string) => {
    try {
      const response = await axios.get<{ data: RevenueStats }>(
        `${API_URL}/api/v1/analytics/revenue`,
        { 
          params: { startDate, endDate },
          headers: getAuthHeaders() 
        }
      );
      return response.data;
    } catch (error) {
      console.warn('Revenue analytics unavailable', error);
      // Return mock data for demonstration
      return {
        data: {
          total: 0,
          byDay: [],
          byService: [],
          byPaymentMethod: []
        }
      };
    }
  },
  
  /**
   * Get patient statistics
   * @param facilityId Optional facility filter
   * @returns Patient demographics and counts
   */
  getPatientStats: async (facilityId?: string) => {
    try {
      const response = await axios.get<{ data: PatientStats }>(
        `${API_URL}/api/v1/analytics/patients`,
        { 
          params: facilityId ? { facilityId } : {},
          headers: getAuthHeaders() 
        }
      );
      return response.data;
    } catch (error) {
      console.warn('Patient analytics unavailable', error);
      return {
        data: {
          total: 0,
          new: 0,
          active: 0,
          byAge: [],
          byGender: []
        }
      };
    }
  },
  
  /**
   * Get appointment trends
   * @param days Number of days to analyze (default: 30)
   * @returns Appointment statistics and trends
   */
  getAppointmentTrends: async (days: number = 30) => {
    try {
      const response = await axios.get<{ data: AppointmentTrends }>(
        `${API_URL}/api/v1/analytics/appointments/trends`,
        { 
          params: { days },
          headers: getAuthHeaders() 
        }
      );
      return response.data;
    } catch (error) {
      console.warn('Appointment analytics unavailable', error);
      return {
        data: {
          byDay: [],
          bySpecialty: [],
          averageWaitTime: 0
        }
      };
    }
  },
  
  /**
   * Get lab performance metrics
   * @returns Lab turnaround times and efficiency stats
   */
  getLabPerformance: async () => {
    try {
      const response = await axios.get(
        `${API_URL}/api/v1/analytics/lab-performance`,
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.warn('Lab analytics unavailable', error);
      return {
        data: {
          averageTurnaround: 0,
          pendingTests: 0,
          completedToday: 0
        }
      };
    }
  },
  
  /**
   * Export report as PDF or Excel
   * @param reportType Type of report to export
   * @param format Export format (pdf or excel)
   */
  exportReport: async (reportType: string, format: 'pdf' | 'excel' = 'pdf') => {
    try {
      const response = await axios.get(
        `${API_URL}/api/v1/analytics/export/${reportType}`,
        {
          params: { format },
          headers: getAuthHeaders(),
          responseType: 'blob'
        }
      );
      
      // Download file
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${reportType}-report.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      return true;
    } catch (error) {
      console.error('Report export failed', error);
      return false;
    }
  }
};

export type { RevenueStats, PatientStats, AppointmentTrends };

