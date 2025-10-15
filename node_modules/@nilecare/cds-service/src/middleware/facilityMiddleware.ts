/**
 * Facility Middleware for CDS Service
 * 
 * Enforces facility isolation for clinical decision support data
 * Uses shared facility isolation utilities
 */

import { Request, Response, NextFunction } from 'express';
import { 
  extractFacilityContext, 
  enforceFacilityIsolation,
  FacilityAccessError 
} from '../../../shared/middleware/facilityIsolation';
import { logger } from '../utils/logger';

/**
 * Extract and attach facility context to request
 */
export function attachFacilityContext(req: Request, res: Response, next: NextFunction): void {
  const context = extractFacilityContext(req);

  if (!context) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Authentication required for facility context',
        code: 'AUTH_REQUIRED'
      }
    });
  }

  // Attach to request for use in controllers/services
  (req as any).facilityContext = context;

  logger.debug(`Facility context attached: facilityId=${context.facilityId}, organizationId=${context.organizationId}`);

  next();
}

/**
 * Require facility assignment
 * Users must have a facilityId (except multi-facility admins)
 */
export function requireFacility(req: Request, res: Response, next: NextFunction): void {
  const context = (req as any).facilityContext || extractFacilityContext(req);

  if (!context) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      }
    });
  }

  if (!context.facilityId && !context.canAccessMultipleFacilities) {
    logger.warn(`User ${context.userId} attempted access without facility assignment`);
    return res.status(403).json({
      success: false,
      error: {
        message: 'User must be assigned to a facility to access this resource',
        code: 'FACILITY_REQUIRED'
      }
    });
  }

  next();
}

/**
 * Validate facility ownership of clinical data
 * Prevents cross-facility access to sensitive clinical information
 */
export function validateFacilityOwnership(req: Request, res: Response, next: NextFunction): void {
  const context = (req as any).facilityContext || extractFacilityContext(req);

  if (!context) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      }
    });
  }

  // Extract facility ID from request
  const requestedFacilityId = 
    req.body.facilityId || 
    req.query.facilityId || 
    req.params.facilityId ||
    (req.body.patientId && req.body.facilityId); // From nested objects

  // If requesting specific facility data
  if (requestedFacilityId) {
    // Multi-facility users can access any facility
    if (context.canAccessMultipleFacilities) {
      logger.debug(`Multi-facility user ${context.userId} accessing facility ${requestedFacilityId}`);
      next();
      return;
    }

    // Regular users can only access their own facility
    if (requestedFacilityId !== context.facilityId) {
      logger.warn(`User ${context.userId} attempted cross-facility access: own=${context.facilityId}, requested=${requestedFacilityId}`);
      return res.status(403).json({
        success: false,
        error: {
          message: 'Access denied to requested facility data',
          code: 'CROSS_FACILITY_ACCESS_DENIED'
        }
      });
    }
  }

  // If no facility specified, use user's facility
  if (!req.body.facilityId && context.facilityId) {
    req.body.facilityId = context.facilityId;
  }

  next();
}

/**
 * Log facility access for HIPAA audit
 */
export function logFacilityAccess(req: Request, res: Response, next: NextFunction): void {
  const context = (req as any).facilityContext || extractFacilityContext(req);

  if (context) {
    logger.info('Facility access', {
      userId: context.userId,
      facilityId: context.facilityId,
      organizationId: context.organizationId,
      endpoint: req.path,
      method: req.method,
      timestamp: new Date().toISOString()
    });
  }

  next();
}

export default {
  attachFacilityContext,
  requireFacility,
  validateFacilityOwnership,
  logFacilityAccess
};

