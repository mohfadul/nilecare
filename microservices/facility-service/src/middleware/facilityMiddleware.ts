import { Request, Response, NextFunction } from 'express';
import { AuthorizationError, NotFoundError } from './errorHandler';
import { logger, logFacilityAccess } from '../utils/logger';

/**
 * Facility Isolation Middleware
 * Ensures users can only access data from their assigned facility
 * Self-referential: Facility service validates its own facility data
 */

/**
 * Attach facility context to request
 * Extracts facility information from authenticated user
 */
export function attachFacilityContext(req: Request, res: Response, next: NextFunction): void {
  const user = (req as any).user;
  
  if (!user) {
    // No user attached (should be caught by authenticate middleware first)
    return next();
  }

  // Attach facility context
  (req as any).facilityContext = {
    facilityId: user.facilityId,
    facilityIds: user.facilityIds || [], // For multi-facility admins
    isMultiFacilityAdmin: user.isMultiFacilityAdmin || false,
    organizationId: user.organizationId,
  };

  next();
}

/**
 * Require facility context
 * Ensures user has a facility assigned
 */
export function requireFacility(req: Request, res: Response, next: NextFunction): void {
  const facilityContext = (req as any).facilityContext;
  
  if (!facilityContext || (!facilityContext.facilityId && facilityContext.facilityIds.length === 0)) {
    logger.warn('Access denied: No facility assigned', {
      userId: (req as any).user?.userId,
      url: req.originalUrl,
    });
    
    throw new AuthorizationError('User must be assigned to a facility');
  }

  next();
}

/**
 * Validate facility ownership
 * Ensures user can access the requested facility resource
 */
export function validateFacilityOwnership(resourceType: string = 'resource') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const facilityContext = (req as any).facilityContext;
    const user = (req as any).user;
    
    // Get facility ID from request (params, query, or body)
    const requestedFacilityId = req.params.facilityId || 
                                 req.query.facilityId || 
                                 req.body?.facilityId;

    // If no facility ID in request, allow (will be filtered in service layer)
    if (!requestedFacilityId) {
      return next();
    }

    // Multi-facility admins can access all facilities
    if (facilityContext.isMultiFacilityAdmin) {
      return next();
    }

    // Check if user has access to requested facility
    const hasAccess = facilityContext.facilityId === requestedFacilityId ||
                     facilityContext.facilityIds.includes(requestedFacilityId);

    if (!hasAccess) {
      logFacilityAccess({
        userId: user.userId,
        userRole: user.role,
        facilityId: requestedFacilityId,
        action: req.method,
        resourceType,
        success: false,
        reason: 'User does not have access to this facility',
      });

      throw new AuthorizationError(`You do not have access to this ${resourceType}`);
    }

    // Log successful access
    logFacilityAccess({
      userId: user.userId,
      userRole: user.role,
      facilityId: requestedFacilityId,
      action: req.method,
      resourceType,
      success: true,
    });

    next();
  };
}

/**
 * Filter by facility
 * Automatically adds facility filter to queries
 */
export function filterByFacility(req: Request, res: Response, next: NextFunction): void {
  const facilityContext = (req as any).facilityContext;
  
  // Multi-facility admins see all facilities (no filter)
  if (facilityContext?.isMultiFacilityAdmin) {
    return next();
  }

  // Add facility filter to query
  if (facilityContext?.facilityId) {
    req.query.facilityId = facilityContext.facilityId;
  }

  next();
}

/**
 * Require organization ownership
 * For facility creation - must be done by organization admin
 */
export function requireOrganizationOwnership(req: Request, res: Response, next: NextFunction): void {
  const user = (req as any).user;
  const requestedOrganizationId = req.body?.organizationId || req.params.organizationId;

  if (!requestedOrganizationId) {
    throw new NotFoundError('Organization ID is required');
  }

  // Check if user belongs to the organization
  if (user.organizationId !== requestedOrganizationId) {
    throw new AuthorizationError('You can only create facilities for your organization');
  }

  next();
}

export default {
  attachFacilityContext,
  requireFacility,
  validateFacilityOwnership,
  filterByFacility,
  requireOrganizationOwnership,
};

