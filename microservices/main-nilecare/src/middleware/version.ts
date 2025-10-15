/**
 * API Versioning Middleware
 * Phase 3: Support multiple API versions simultaneously
 * 
 * Supports version detection from:
 * 1. URL path: /api/v1/patients or /api/v2/patients
 * 2. Header: X-API-Version: v1
 * 3. Accept header: Accept: application/vnd.nilecare.v1+json
 */

import { Request, Response, NextFunction } from 'express';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      apiVersion?: string;
    }
  }
}

/**
 * Detect API version from request
 */
export function detectApiVersion(req: Request, res: Response, next: NextFunction): void {
  // 1. Version from URL: /api/v1/patients or /api/v2/patients
  const urlVersion = req.path.match(/^\/api\/(v\d+)\//)?.[1];
  
  // 2. Version from header: X-API-Version: v1
  const headerVersion = req.headers['x-api-version'] as string;
  
  // 3. Accept header: application/vnd.nilecare.v1+json
  const acceptHeader = req.headers.accept;
  const acceptVersion = acceptHeader?.match(/vnd\.nilecare\.(v\d+)/)?.[1];
  
  // Priority: URL > Header > Accept > Default (v1)
  req.apiVersion = urlVersion || headerVersion || acceptVersion || 'v1';
  
  // Add version to response headers for client visibility
  res.setHeader('X-API-Version', req.apiVersion);
  
  next();
}

/**
 * Require specific API version
 */
export function requireVersion(version: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.apiVersion !== version) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_API_VERSION',
          message: `This endpoint requires API version ${version}, but got ${req.apiVersion}`,
          supportedVersions: ['v1', 'v2']
        }
      });
      return;
    }
    
    next();
  };
}

/**
 * Version-based response transformation
 */
export function transformResponse(version: string, data: any): any {
  switch (version) {
    case 'v1':
      // V1 format: simple success/data
      return {
        success: true,
        data: data.data || data
      };
    
    case 'v2':
      // V2 format: includes metadata, pagination, links
      return {
        success: true,
        data: data.data || data,
        meta: {
          version: 'v2',
          timestamp: new Date().toISOString(),
          ...(data.pagination && { pagination: data.pagination })
        },
        ...(data.links && { links: data.links })
      };
    
    default:
      return data;
  }
}

export default { detectApiVersion, requireVersion, transformResponse };

