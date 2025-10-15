/**
 * Common types used across all microservices
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
  timestamp?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  stack?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ServiceHealthCheck {
  status: 'healthy' | 'unhealthy' | 'degraded';
  service: string;
  version: string;
  uptime: number;
  timestamp: string;
  dependencies?: Record<string, boolean>;
}

export interface ServiceRegistry {
  name: string;
  url: string;
  port: number;
  version: string;
  healthEndpoint: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  organizationId?: string;
  iat?: number;
  exp?: number;
}

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

export interface LogContext {
  service: string;
  userId?: string;
  requestId?: string;
  correlationId?: string;
  [key: string]: any;
}

