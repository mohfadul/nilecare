import { Request, Response, NextFunction } from 'express';
import { 
  extractFacilityContext, 
  FacilityAccessError 
} from '../../../shared/middleware/facilityIsolation';
import { logger } from '../utils/logger';

/**
 * Inventory Service - Facility Isolation Middleware
 * Critical for multi-facility inventory isolation
 */

/**
 * Extract and attach facility context
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

  (req as any).facilityContext = context;
  logger.debug(`Facility context attached: facilityId=${context.facilityId}`);

  next();
}

/**
 * Require facility assignment
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
    logger.warn(`User ${context.userId} attempted inventory access without facility`);
    return res.status(403).json({
      success: false,
      error: {
        message: 'User must be assigned to a facility to access inventory',
        code: 'FACILITY_REQUIRED'
      }
    });
  }

  next();
}

/**
 * Validate inventory access (critical for stock data)
 */
export function validateInventoryAccess(req: Request, res: Response, next: NextFunction): void {
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

  const requestedFacilityId = 
    req.body.facilityId || 
    req.query.facilityId || 
    req.params.facilityId;

  if (requestedFacilityId) {
    if (context.canAccessMultipleFacilities) {
      logger.info(`Multi-facility user accessing inventory`, {
        userId: context.userId,
        requestedFacility: requestedFacilityId
      });
      next();
      return;
    }

    if (requestedFacilityId !== context.facilityId) {
      logger.warn(`SECURITY: Cross-facility inventory access denied`, {
        userId: context.userId,
        userFacility: context.facilityId,
        requestedFacility: requestedFacilityId,
      });

      return res.status(403).json({
        success: false,
        error: {
          message: 'Access denied to requested facility inventory',
          code: 'CROSS_FACILITY_ACCESS_DENIED'
        }
      });
    }
  }

  if (!req.body.facilityId && context.facilityId) {
    req.body.facilityId = context.facilityId;
  }

  next();
}

/**
 * Log inventory access for audit
 */
export function logInventoryAccess(req: Request, res: Response, next: NextFunction): void {
  const context = (req as any).facilityContext || extractFacilityContext(req);

  if (context) {
    const isSensitiveOperation = 
      req.method !== 'GET' || 
      req.path.includes('/stock') ||
      req.path.includes('/reserve') ||
      req.path.includes('/commit');

    if (isSensitiveOperation) {
      logger.info('Inventory access (audit)', {
        userId: context.userId,
        userRole: context.userRole,
        facilityId: context.facilityId,
        endpoint: req.path,
        method: req.method,
        ip: req.ip,
        timestamp: new Date().toISOString(),
      });
    }
  }

  next();
}

/**
 * Enforce facility for writes
 */
export function enforceFacilityForWrites(req: Request, res: Response, next: NextFunction): void {
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

  if (req.body && typeof req.body === 'object') {
    if (!req.body.facilityId) {
      if (context.facilityId) {
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
      if (!context.canAccessMultipleFacilities && req.body.facilityId !== context.facilityId) {
        logger.warn(`User ${context.userId} attempted cross-facility write`);
        return res.status(403).json({
          success: false,
          error: {
            message: 'Cannot modify inventory in different facility',
            code: 'CROSS_FACILITY_WRITE_DENIED'
          }
        });
      }
    }

    if (!req.body.organizationId) {
      req.body.organizationId = context.organizationId;
    }
  }

  next();
}

export default {
  attachFacilityContext,
  requireFacility,
  validateInventoryAccess,
  logInventoryAccess,
  enforceFacilityForWrites
};

