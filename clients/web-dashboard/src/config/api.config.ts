/**
 * API Configuration
 * Centralized API endpoint configuration for the NileCare dashboard
 * 
 * Environment Variables:
 * - VITE_API_URL: Main orchestrator base URL (default: http://localhost:7000)
 * - VITE_AUTH_SERVICE_URL: Auth service URL (default: http://localhost:7020)
 * 
 * Note: The orchestrator (main-nilecare) runs on port 7000 as per documentation.
 * All API calls should go through the orchestrator, not directly to microservices.
 * 
 * Port Configuration (as per NileCare documentation - single source of truth):
 * - Main NileCare (Orchestrator): 7000
 * - API Gateway: 7001
 * - Business Service: 7010
 * - Auth Service: 7020
 * - Payment Service: 7030
 * - Appointment Service: 7040
 * - Web Dashboard: 5173
 */

// Main orchestrator URL
// This should match the PORT in microservices/main-nilecare/.env
export const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:7000';

// Individual service URLs (if needed for direct access - NOT RECOMMENDED)
export const AUTH_SERVICE_URL = import.meta.env.VITE_AUTH_SERVICE_URL || 'http://localhost:7020';

// API endpoints
export const API_ENDPOINTS = {
  // Main orchestrator routes
  health: `${API_BASE_URL}/health`,
  
  // Data routes
  data: `${API_BASE_URL}/api/v1/data`,
  dashboard: `${API_BASE_URL}/api/v1/data/dashboard`,
  dashboardStats: `${API_BASE_URL}/api/v1/data/dashboard/stats`,
  
  // Business service routes (via orchestrator)
  business: `${API_BASE_URL}/api/business`,
  businessHealth: `${API_BASE_URL}/api/business/health`,
  businessSummary: `${API_BASE_URL}/api/business/summary`,
  businessStats: `${API_BASE_URL}/api/business/stats`,
  
  // Other service routes
  search: `${API_BASE_URL}/api/v1/search`,
  bulk: `${API_BASE_URL}/api/v1/bulk`,
  audit: `${API_BASE_URL}/api/v1/audit`,
};

export default {
  API_BASE_URL,
  AUTH_SERVICE_URL,
  API_ENDPOINTS,
};

