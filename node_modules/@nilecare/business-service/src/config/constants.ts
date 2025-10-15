/**
 * Business Service Configuration Constants
 * 
 * PRIORITY 1.3 - Dynamic Data Handling
 */

/**
 * Default organization ID for single-tenant deployments
 * 
 * NOTE: In production multi-tenant deployments, this should never be used.
 * The organizationId MUST come from the JWT token payload.
 * 
 * This is ONLY for:
 * - Single-tenant local development (XAMPP)
 * - Database schemas without organization_id columns
 * - Backward compatibility during migration
 */
export const DEFAULT_ORGANIZATION_ID = process.env.DEFAULT_ORGANIZATION_ID || 'single-tenant';

/**
 * Feature flags for multi-tenancy
 */
export const MULTI_TENANT_ENABLED = process.env.MULTI_TENANT_ENABLED === 'true';

/**
 * Organization isolation enforcement
 * 
 * When true, all queries MUST filter by organization_id
 * When false, organization_id is optional (single-tenant mode)
 */
export const ENFORCE_ORGANIZATION_ISOLATION = process.env.ENFORCE_ORGANIZATION_ISOLATION === 'true';

/**
 * Get organization ID from JWT with proper fallback
 * 
 * @param jwtOrganizationId - organizationId from JWT token
 * @returns Validated organization ID
 * @throws Error if multi-tenancy is enabled but no org ID in token
 */
export function getOrganizationId(jwtOrganizationId?: string): string {
  // In multi-tenant mode, organizationId is REQUIRED
  if (MULTI_TENANT_ENABLED) {
    if (!jwtOrganizationId) {
      throw new Error(
        'CRITICAL: Multi-tenancy enabled but no organizationId in JWT token. ' +
        'Ensure Auth Service includes organizationId in token payload.'
      );
    }
    return jwtOrganizationId;
  }
  
  // Single-tenant mode: use default if not provided
  return jwtOrganizationId || DEFAULT_ORGANIZATION_ID;
}

/**
 * Validate organization access
 * 
 * In multi-tenant mode, ensures user can only access their organization's data
 */
export function validateOrganizationAccess(
  userOrgId: string,
  resourceOrgId: string
): boolean {
  if (!MULTI_TENANT_ENABLED) {
    return true; // No isolation in single-tenant mode
  }
  
  return userOrgId === resourceOrgId;
}

/**
 * Permission definitions for the Business Service
 * 
 * Format: resource:action
 */
export const PERMISSIONS = {
  // Appointments
  APPOINTMENTS_READ: 'appointments:read',
  APPOINTMENTS_CREATE: 'appointments:create',
  APPOINTMENTS_UPDATE: 'appointments:update',
  APPOINTMENTS_DELETE: 'appointments:delete',
  APPOINTMENTS_CANCEL: 'appointments:cancel',
  APPOINTMENTS_CONFIRM: 'appointments:confirm',
  APPOINTMENTS_COMPLETE: 'appointments:complete',
  
  // Billing
  BILLING_READ: 'billing:read',
  BILLING_CREATE: 'billing:create',
  BILLING_UPDATE: 'billing:update',
  BILLING_DELETE: 'billing:delete',
  BILLING_CANCEL: 'billing:cancel',
  BILLING_PAY: 'billing:pay',
  
  // Scheduling
  SCHEDULING_READ: 'scheduling:read',
  SCHEDULING_CREATE: 'scheduling:create',
  SCHEDULING_UPDATE: 'scheduling:update',
  SCHEDULING_DELETE: 'scheduling:delete',
  
  // Staff
  STAFF_READ: 'staff:read',
  STAFF_CREATE: 'staff:create',
  STAFF_UPDATE: 'staff:update',
  STAFF_DELETE: 'staff:delete',
  
  // Admin
  ADMIN_ALL: '*'
} as const;

/**
 * Role definitions
 */
export const ROLES = {
  ADMIN: 'admin',
  DOCTOR: 'doctor',
  NURSE: 'nurse',
  RECEPTIONIST: 'receptionist',
  PHARMACIST: 'pharmacist',
  LAB_TECHNICIAN: 'lab_technician',
  PATIENT: 'patient'
} as const;

/**
 * Audit log retention period (days)
 */
export const AUDIT_LOG_RETENTION_DAYS = parseInt(process.env.AUDIT_LOG_RETENTION_DAYS || '2555'); // ~7 years default

/**
 * Rate limiting configuration
 */
export const RATE_LIMIT = {
  WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100')
};

