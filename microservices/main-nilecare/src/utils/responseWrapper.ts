/**
 * Response Wrapper Utility
 * Standardizes API responses across all endpoints
 * 
 * ✅ Part of orchestration consolidation
 */

import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    timestamp: string;
    version?: string;
    requestId?: string;
  };
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Send standardized success response
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode: number = 200,
  metadata?: Record<string, any>
): void {
  const response: ApiResponse<T> = {
    success: true,
    data,
    metadata: {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      ...metadata,
    },
  };

  res.status(statusCode).json(response);
}

/**
 * Send standardized error response
 */
export function sendError(
  res: Response,
  code: string,
  message: string,
  statusCode: number = 400,
  details?: any
): void {
  const response: ApiResponse = {
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
    },
    metadata: {
      timestamp: new Date().toISOString(),
    },
  };

  res.status(statusCode).json(response);
}

/**
 * Send paginated response
 */
export function sendPaginated<T>(
  res: Response,
  data: T[],
  pagination: {
    page: number;
    limit: number;
    total: number;
  }
): void {
  const response: PaginatedResponse<T> = {
    success: true,
    data,
    pagination: {
      ...pagination,
      totalPages: Math.ceil(pagination.total / pagination.limit),
    },
    metadata: {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    },
  };

  res.status(200).json(response);
}

/**
 * Wrap existing response data into standardized format
 */
export function wrapResponse<T>(data: T, alreadyWrapped: boolean = false): ApiResponse<T> {
  // Check if already in standard format
  if (alreadyWrapped && typeof data === 'object' && data !== null && 'success' in data) {
    return data as any;
  }

  return {
    success: true,
    data,
    metadata: {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    },
  };
}

/**
 * Common error codes
 */
export const ErrorCodes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  BAD_REQUEST: 'BAD_REQUEST',
  PROXY_ERROR: 'PROXY_ERROR',
};

