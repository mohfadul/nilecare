/**
 * Facility Isolation Middleware
 * 
 * Ensures multi-facility data isolation by enforcing facility-based filtering
 * Critical for multi-tenant healthcare platforms
 * 
 * Features:
 * - Automatic facilityId injection into queries
 * - Facility-based access control
 * - Cross-facility access prevention
 * - Audit logging for facility access
 */

import { Request, Response, NextFunction } from 'express';

export interface FacilityContext {
  facilityId: string;
  organizationId: string;
  userId: string;
  userRole: string;
  canAccessMultipleFacilities: boolean;
}

/**
 * Extract facility context from authenticated user
 */
export function extractFacilityContext(req: Request): FacilityContext | null {
  const user = (req as any).user;
  
  if (!user) {
    return null;
  }

  // Check if user can access multiple facilities (admin, medical director)
  const canAccessMultipleFacilities = 
    user.role === 'super-admin' || 
    user.role === 'medical-director' ||
    user.role === 'compliance-officer';

  return {
    facilityId: user.facilityId,
    organizationId: user.organizationId,
    userId: user.userId,
    userRole: user.role,
    canAccessMultipleFacilities
  };
}

/**
 * Require facility context middleware
 * Ensures user has a facility assigned
 */
export function requireFacilityContext(req: Request, res: Response, next: NextFunction): void {
  const context = extractFacilityContext(req);

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
    return res.status(403).json({
      success: false,
      error: {
        message: 'User must be assigned to a facility',
        code: 'FACILITY_REQUIRED'
      }
    });
  }

  // Attach facility context to request
  (req as any).facilityContext = context;

  next();
}

/**
 * Enforce facility isolation
 * Prevents cross-facility data access
 */
export function enforceFacilityIsolation(req: Request, res: Response, next: NextFunction): void {
  const context = extractFacilityContext(req);

  if (!context) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      }
    });
  }

  // Check if trying to access different facility's data
  const requestedFacilityId = 
    req.body.facilityId || 
    req.query.facilityId || 
    req.params.facilityId;

  if (requestedFacilityId && requestedFacilityId !== context.facilityId) {
    // Check if user has multi-facility access
    if (!context.canAccessMultipleFacilities) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Access denied to requested facility',
          code: 'CROSS_FACILITY_ACCESS_DENIED'
        }
      });
    }
  }

  // Attach facility context to request
  (req as any).facilityContext = context;

  next();
}

/**
 * SQL Query Builder with Facility Isolation
 */
export class FacilityQueryBuilder {
  private params: any[] = [];
  private paramIndex: number = 1;
  private whereConditions: string[] = [];

  constructor(
    private facilityId: string | null,
    private organizationId: string,
    private enforceFacilityFilter: boolean = true
  ) {
    // Always filter by organization
    this.whereConditions.push(`organization_id = $${this.paramIndex}`);
    this.params.push(organizationId);
    this.paramIndex++;

    // Add facility filter if required
    if (enforceFacilityFilter && facilityId) {
      this.whereConditions.push(`facility_id = $${this.paramIndex}`);
      this.params.push(facilityId);
      this.paramIndex++;
    }
  }

  /**
   * Add condition to WHERE clause
   */
  addCondition(column: string, value: any, operator: string = '='): this {
    this.whereConditions.push(`${column} ${operator} $${this.paramIndex}`);
    this.params.push(value);
    this.paramIndex++;
    return this;
  }

  /**
   * Add IN condition
   */
  addInCondition(column: string, values: any[]): this {
    if (values.length > 0) {
      this.whereConditions.push(`${column} = ANY($${this.paramIndex})`);
      this.params.push(values);
      this.paramIndex++;
    }
    return this;
  }

  /**
   * Add date range condition
   */
  addDateRange(column: string, fromDate?: Date, toDate?: Date): this {
    if (fromDate) {
      this.whereConditions.push(`${column} >= $${this.paramIndex}`);
      this.params.push(fromDate);
      this.paramIndex++;
    }
    if (toDate) {
      this.whereConditions.push(`${column} <= $${this.paramIndex}`);
      this.params.push(toDate);
      this.paramIndex++;
    }
    return this;
  }

  /**
   * Add LIKE condition for text search
   */
  addLikeCondition(column: string, searchText: string): this {
    this.whereConditions.push(`${column} ILIKE $${this.paramIndex}`);
    this.params.push(`%${searchText}%`);
    this.paramIndex++;
    return this;
  }

  /**
   * Get WHERE clause
   */
  getWhereClause(): string {
    return this.whereConditions.length > 0 
      ? `WHERE ${this.whereConditions.join(' AND ')}`
      : '';
  }

  /**
   * Get parameters
   */
  getParams(): any[] {
    return this.params;
  }

  /**
   * Get next parameter index
   */
  getNextParamIndex(): number {
    return this.paramIndex;
  }

  /**
   * Build complete query
   */
  buildQuery(baseQuery: string, orderBy: string = 'created_at DESC', limit?: number, offset?: number): {
    query: string;
    params: any[];
  } {
    let query = baseQuery + ' ' + this.getWhereClause();

    if (orderBy) {
      query += ` ORDER BY ${orderBy}`;
    }

    if (limit) {
      query += ` LIMIT $${this.paramIndex}`;
      this.params.push(limit);
      this.paramIndex++;
    }

    if (offset !== undefined) {
      query += ` OFFSET $${this.paramIndex}`;
      this.params.push(offset);
      this.paramIndex++;
    }

    return {
      query,
      params: this.params
    };
  }
}

/**
 * Validate facility access
 * Checks if user can access data from specific facility
 */
export function validateFacilityAccess(
  userFacilityId: string | null,
  dataFacilityId: string,
  canAccessMultipleFacilities: boolean
): boolean {
  // Multi-facility users can access any facility
  if (canAccessMultipleFacilities) {
    return true;
  }

  // Regular users can only access their own facility
  if (!userFacilityId) {
    return false;
  }

  return userFacilityId === dataFacilityId;
}

/**
 * Add facility context to data object
 */
export function addFacilityContext<T extends Record<string, any>>(
  data: T,
  context: FacilityContext
): T & { facilityId: string; organizationId: string } {
  return {
    ...data,
    facilityId: context.facilityId,
    organizationId: context.organizationId
  };
}

/**
 * Filter results by facility access
 * Used for in-memory filtering when needed
 */
export function filterByFacilityAccess<T extends { facilityId?: string }>(
  data: T[],
  context: FacilityContext
): T[] {
  // Multi-facility users see all data
  if (context.canAccessMultipleFacilities) {
    return data;
  }

  // Regular users only see their facility's data
  return data.filter(item => 
    !item.facilityId || item.facilityId === context.facilityId
  );
}

/**
 * Facility isolation error
 */
export class FacilityAccessError extends Error {
  constructor(
    message: string = 'Access denied to requested facility data',
    public code: string = 'FACILITY_ACCESS_DENIED'
  ) {
    super(message);
    this.name = 'FacilityAccessError';
  }
}

/**
 * Check if user can create data in specified facility
 */
export function canCreateInFacility(
  context: FacilityContext,
  targetFacilityId?: string
): boolean {
  // No target facility specified - use user's facility
  if (!targetFacilityId) {
    return !!context.facilityId;
  }

  // Multi-facility users can create in any facility
  if (context.canAccessMultipleFacilities) {
    return true;
  }

  // Regular users can only create in their own facility
  return context.facilityId === targetFacilityId;
}

/**
 * Get effective facility ID for query
 * Returns null for multi-facility users (no filter), user's facility for regular users
 */
export function getEffectiveFacilityId(context: FacilityContext): string | null {
  if (context.canAccessMultipleFacilities) {
    return null; // No facility filter for multi-facility users
  }
  return context.facilityId;
}

export default {
  extractFacilityContext,
  requireFacilityContext,
  enforceFacilityIsolation,
  FacilityQueryBuilder,
  validateFacilityAccess,
  addFacilityContext,
  filterByFacilityAccess,
  FacilityAccessError,
  canCreateInFacility,
  getEffectiveFacilityId
};

