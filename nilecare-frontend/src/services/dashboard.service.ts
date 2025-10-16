/**
 * Dashboard Service
 * 
 * Handles API calls for role-specific dashboard statistics
 * @module services/dashboard
 */

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:7000';

/**
 * Get authentication token from local storage
 */
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

export const dashboardService = {
  /**
   * Get Doctor Dashboard Statistics
   * @returns Promise with doctor dashboard data
   */
  getDoctorStats: async () => {
    const response = await axios.get(
      `${API_URL}/api/v1/dashboard/doctor-stats`,
      { headers: getAuthHeaders() }
    );
    return response.data;
  },

  /**
   * Get Nurse Dashboard Statistics
   * @returns Promise with nurse dashboard data
   */
  getNurseStats: async () => {
    const response = await axios.get(
      `${API_URL}/api/v1/dashboard/nurse-stats`,
      { headers: getAuthHeaders() }
    );
    return response.data;
  },

  /**
   * Get Receptionist Dashboard Statistics
   * @returns Promise with receptionist dashboard data
   */
  getReceptionistStats: async () => {
    const response = await axios.get(
      `${API_URL}/api/v1/dashboard/receptionist-stats`,
      { headers: getAuthHeaders() }
    );
    return response.data;
  },

  /**
   * Get Admin Dashboard Statistics
   * @returns Promise with admin dashboard data
   */
  getAdminStats: async () => {
    const response = await axios.get(
      `${API_URL}/api/v1/dashboard/admin-stats`,
      { headers: getAuthHeaders() }
    );
    return response.data;
  },

  /**
   * Get Billing Clerk Dashboard Statistics
   * @returns Promise with billing dashboard data
   */
  getBillingStats: async () => {
    const response = await axios.get(
      `${API_URL}/api/v1/dashboard/billing-stats`,
      { headers: getAuthHeaders() }
    );
    return response.data;
  },

  /**
   * Get Lab Tech Dashboard Statistics
   * @returns Promise with lab tech dashboard data
   */
  getLabStats: async () => {
    const response = await axios.get(
      `${API_URL}/api/v1/dashboard/lab-stats`,
      { headers: getAuthHeaders() }
    );
    return response.data;
  },

  /**
   * Get Pharmacist Dashboard Statistics
   * @returns Promise with pharmacist dashboard data
   */
  getPharmacistStats: async () => {
    const response = await axios.get(
      `${API_URL}/api/v1/dashboard/pharmacist-stats`,
      { headers: getAuthHeaders() }
    );
    return response.data;
  }
};

