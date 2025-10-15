/**
 * Response Transformation Middleware
 * Transforms and normalizes responses from backend services
 * 
 * ✅ Integrated from gateway-service into main-nilecare
 */

import { Request, Response, NextFunction } from 'express';
import { wrapResponse } from '../utils/responseWrapper';

export interface TransformConfig {
  wrapResponse?: boolean;
  addMetadata?: boolean;
  removeFields?: string[];
}

/**
 * Response transformer middleware
 * Can be configured to wrap responses, add metadata, or remove sensitive fields
 */
export const responseTransformer = (config: TransformConfig = {}) => {
  const {
    wrapResponse: shouldWrap = false,
    addMetadata = true,
    removeFields = ['password', 'passwordHash', 'salt', 'secret', 'privateKey'],
  } = config;

  return (req: Request, res: Response, next: NextFunction): void => {
    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method
    res.json = function (data: any): Response {
      let transformedData = data;

      // Remove sensitive fields if specified
      if (removeFields.length > 0 && typeof transformedData === 'object') {
        transformedData = removeFieldsRecursive(transformedData, removeFields);
      }

      // Wrap response if requested
      if (shouldWrap && !isAlreadyWrapped(data)) {
        transformedData = wrapResponse(transformedData);
      }

      // Add metadata if requested
      if (addMetadata && typeof transformedData === 'object' && !isAlreadyWrapped(data)) {
        transformedData = {
          ...transformedData,
          metadata: {
            ...(transformedData.metadata || {}),
            timestamp: new Date().toISOString(),
            requestId: (req as any).id || req.get('x-request-id'),
          },
        };
      }

      return originalJson(transformedData);
    };

    next();
  };
};

/**
 * Check if response is already in standard format
 */
function isAlreadyWrapped(data: any): boolean {
  return (
    typeof data === 'object' &&
    data !== null &&
    ('success' in data || 'error' in data || 'metadata' in data)
  );
}

/**
 * Helper function to remove fields recursively from an object
 */
function removeFieldsRecursive(obj: any, fields: string[]): any {
  if (Array.isArray(obj)) {
    return obj.map(item => removeFieldsRecursive(item, fields));
  }

  if (obj !== null && typeof obj === 'object') {
    const newObj: any = {};
    for (const key in obj) {
      if (!fields.includes(key)) {
        newObj[key] = removeFieldsRecursive(obj[key], fields);
      }
    }
    return newObj;
  }

  return obj;
}

/**
 * Default export with common configuration
 */
export default responseTransformer({
  wrapResponse: false, // Don't wrap by default (services already wrap)
  addMetadata: false, // Don't add metadata by default
  removeFields: ['password', 'passwordHash', 'salt', 'secret', 'privateKey'], // Remove sensitive fields
});

