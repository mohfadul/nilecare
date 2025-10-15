/**
 * Response Transformation Middleware
 * Transforms and normalizes responses from backend services
 */

import { Request, Response, NextFunction } from 'express';

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
    wrapResponse = false,
    addMetadata = true,
    removeFields = [],
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
      if (wrapResponse && !data.success) {
        transformedData = {
          success: true,
          data: transformedData,
        };
      }

      // Add metadata if requested
      if (addMetadata && typeof transformedData === 'object') {
        transformedData = {
          ...transformedData,
          _metadata: {
            timestamp: new Date().toISOString(),
            requestId: (req as any).id,
            path: req.path,
            method: req.method,
          },
        };
      }

      return originalJson(transformedData);
    };

    next();
  };
};

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
  addMetadata: false, // Don't add metadata by default
  removeFields: ['password', 'passwordHash', 'salt', 'secret'], // Remove sensitive fields
});

