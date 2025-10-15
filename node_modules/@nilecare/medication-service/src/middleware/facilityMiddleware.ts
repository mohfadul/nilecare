import { Request, Response, NextFunction } from 'express';
import { 
  extractFacilityContext, 
  FacilityAccessError 
} from '../../../shared/middleware/facilityIsolation';
import { logger } from '../utils/logger';

/**
 * Medication Service - Facility Isolation Middleware
 * Ensures medication data is isolated per facility for compliance and security
 */

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

  logger.debug(`Facility context attached: facilityId=${context.facilityId}, user=${context.userId}`);

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
    logger.warn(`User ${context.userId} attempted medication access without facility assignment`);
    return res.status(403).json({
      success: false,
      error: {
        message: 'User must be assigned to a facility to access medication records',
        code: 'FACILITY_REQUIRED'
      }
    });
  }

  next();
}

/**
 * Validate facility ownership of medication data
 * CRITICAL: Prevents unauthorized access to medication records across facilities
 */
export function validateMedicationAccess(req: Request, res: Response, next: NextFunction): void {
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
    req.params.facilityId;

  // If requesting specific facility data
  if (requestedFacilityId) {
    // Multi-facility users (medical director, pharmacy director) can access any facility
    if (context.canAccessMultipleFacilities) {
      logger.info(`Multi-facility user accessing medication data`, {
        userId: context.userId,
        role: context.userRole,
        requestedFacility: requestedFacilityId
      });
      next();
      return;
    }

    // Regular users can only access their own facility's medication data
    if (requestedFacilityId !== context.facilityId) {
      logger.warn(`SECURITY VIOLATION: Cross-facility medication access denied`, {
        userId: context.userId,
        userFacility: context.facilityId,
        requestedFacility: requestedFacilityId,
        endpoint: req.path,
        method: req.method,
        ip: req.ip
      });

      return res.status(403).json({
        success: false,
        error: {
          message: 'Access denied to requested facility medication data',
          code: 'CROSS_FACILITY_ACCESS_DENIED'
        }
      });
    }
  }

  // If no facility specified in request, inject user's facility
  if (!req.body.facilityId && context.facilityId) {
    req.body.facilityId = context.facilityId;
  }

  next();
}

/**
 * Log medication access for audit compliance
 * Required for HIPAA and regulatory compliance
 */
export function logMedicationAccess(req: Request, res: Response, next: NextFunction): void {
  const context = (req as any).facilityContext || extractFacilityContext(req);

  if (context) {
    // Determine if this is a sensitive medication access
    const isSensitiveAccess = 
      req.path.includes('/dispense') || 
      req.path.includes('/administer') ||
      req.path.includes('/high-alert') ||
      req.path.includes('/controlled-substance');

    if (isSensitiveAccess) {
      logger.info('Medication access (audit log)', {
        userId: context.userId,
        userRole: context.userRole,
        facilityId: context.facilityId,
        organizationId: context.organizationId,
        endpoint: req.path,
        method: req.method,
        patientId: req.params.patientId || req.body.patientId || 'unknown',
        medicationId: req.params.medicationId || req.body.medicationId || 'unknown',
        ip: req.ip,
        timestamp: new Date().toISOString(),
        accessType: req.method === 'GET' ? 'view' : req.method === 'POST' ? 'create' : 'update'
      });
    }
  }

  next();
}

/**
 * Enforce facility for write operations
 * All create/update operations must include valid facility ID
 */
export function enforceFacilityForWrites(req: Request, res: Response, next: NextFunction): void {
  // Only enforce on write operations
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return next();
  }

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

  // Ensure facilityId is present for write operations
  if (req.body && typeof req.body === 'object') {
    if (!req.body.facilityId) {
      if (context.facilityId) {
        // Auto-inject user's facility
        req.body.facilityId = context.facilityId;
        logger.debug(`Auto-injected facilityId: ${context.facilityId}`);
      } else if (!context.canAccessMultipleFacilities) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Facility ID required for this operation',
            code: 'FACILITY_ID_REQUIRED'
          }
        });
      }
    } else {
      // Validate user can write to requested facility
      if (!context.canAccessMultipleFacilities && req.body.facilityId !== context.facilityId) {
        logger.warn(`User ${context.userId} attempted to write to different facility`);
        return res.status(403).json({
          success: false,
          error: {
            message: 'Cannot create/update medication data in different facility',
            code: 'CROSS_FACILITY_WRITE_DENIED'
          }
        });
      }
    }

    // Always set organization ID
    if (!req.body.organizationId) {
      req.body.organizationId = context.organizationId;
    }
  }

  next();
}

export default {
  attachFacilityContext,
  requireFacility,
  validateMedicationAccess,
  logMedicationAccess,
  enforceFacilityForWrites
};

