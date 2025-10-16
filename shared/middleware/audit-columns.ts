/**
 * Audit Columns Middleware
 * 
 * Automatically populates audit columns (created_by, updated_by, deleted_by)
 * based on authenticated user context
 * 
 * USAGE:
 * ```typescript
 * import { populateAuditColumns, softDelete } from '../../shared/middleware/audit-columns';
 * 
 * // For CREATE operations
 * const patient = {
 *   ...patientData,
 *   ...populateAuditColumns('create', req.user)
 * };
 * 
 * // For UPDATE operations
 * const updates = {
 *   ...updateData,
 *   ...populateAuditColumns('update', req.user)
 * };
 * 
 * // For DELETE operations (soft delete)
 * const deleted = {
 *   ...softDelete(req.user)
 * };
 * ```
 */

export interface AuditUser {
  userId: string;
  email?: string;
  role?: string;
}

/**
 * Populate audit columns based on operation type
 */
export function populateAuditColumns(
  operation: 'create' | 'update',
  user?: AuditUser
): Record<string, any> {
  if (!user || !user.userId) {
    console.warn('[Audit] No user context provided for audit columns');
    return {};
  }

  const timestamp = new Date();

  if (operation === 'create') {
    return {
      created_at: timestamp,
      created_by: user.userId,
      updated_at: timestamp,
      updated_by: user.userId,
    };
  }

  if (operation === 'update') {
    return {
      updated_at: timestamp,
      updated_by: user.userId,
    };
  }

  return {};
}

/**
 * Soft delete helper
 * Marks record as deleted instead of actually deleting it
 */
export function softDelete(user?: AuditUser): Record<string, any> {
  if (!user || !user.userId) {
    console.warn('[Audit] No user context provided for soft delete');
    return {
      deleted_at: new Date(),
    };
  }

  return {
    deleted_at: new Date(),
    deleted_by: user.userId,
  };
}

/**
 * Check if record is soft deleted
 */
export function isDeleted(record: any): boolean {
  return record.deleted_at !== null && record.deleted_at !== undefined;
}

/**
 * Get active records query filter (for use in WHERE clauses)
 */
export function getActiveRecordsFilter(): string {
  return 'deleted_at IS NULL';
}

/**
 * Express middleware to add audit column helpers to request
 */
export function auditMiddleware(req: any, res: any, next: any) {
  // Add helper methods to request object
  req.audit = {
    create: () => populateAuditColumns('create', req.user),
    update: () => populateAuditColumns('update', req.user),
    delete: () => softDelete(req.user),
  };

  next();
}

/**
 * Database query helper for soft delete
 * Use this instead of DELETE FROM queries
 */
export function createSoftDeleteQuery(
  tableName: string,
  whereClause: string,
  user?: AuditUser
): string {
  const deleteData = softDelete(user);
  const timestamp = deleteData.deleted_at.toISOString().slice(0, 19).replace('T', ' ');
  
  let query = `UPDATE ${tableName} SET deleted_at = '${timestamp}'`;
  
  if (deleteData.deleted_by) {
    query += `, deleted_by = '${deleteData.deleted_by}'`;
  }
  
  query += ` WHERE ${whereClause} AND deleted_at IS NULL`;
  
  return query;
}

/**
 * Validate audit columns exist in data
 */
export function validateAuditColumns(data: any, operation: 'create' | 'update'): boolean {
  if (operation === 'create') {
    return !!(data.created_at && data.created_by);
  }

  if (operation === 'update') {
    return !!(data.updated_at && data.updated_by);
  }

  return true;
}

export default {
  populateAuditColumns,
  softDelete,
  isDeleted,
  getActiveRecordsFilter,
  auditMiddleware,
  createSoftDeleteQuery,
  validateAuditColumns,
};

