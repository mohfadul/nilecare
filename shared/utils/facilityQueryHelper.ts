/**
 * Facility Query Helper
 * 
 * Utility functions for building facility-aware database queries
 * Ensures consistent facility isolation across all services
 */

import { Pool, PoolClient, QueryResult } from 'pg';

export interface FacilityFilterOptions {
  facilityId?: string | null;
  organizationId: string;
  enforceFacilityFilter?: boolean;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface QueryOptions extends FacilityFilterOptions, PaginationOptions {
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
}

/**
 * Build WHERE clause with facility isolation
 */
export function buildFacilityWhereClause(
  options: FacilityFilterOptions,
  startParamIndex: number = 1
): {
  whereClause: string;
  params: any[];
  nextParamIndex: number;
} {
  const conditions: string[] = [];
  const params: any[] = [];
  let paramIndex = startParamIndex;

  // Always filter by organization
  conditions.push(`organization_id = $${paramIndex}`);
  params.push(options.organizationId);
  paramIndex++;

  // Add facility filter if specified
  if (options.enforceFacilityFilter !== false && options.facilityId) {
    conditions.push(`facility_id = $${paramIndex}`);
    params.push(options.facilityId);
    paramIndex++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  return {
    whereClause,
    params,
    nextParamIndex: paramIndex
  };
}

/**
 * Execute query with facility isolation
 */
export async function executeFacilityQuery(
  db: Pool | PoolClient,
  baseQuery: string,
  options: QueryOptions,
  additionalParams: any[] = []
): Promise<QueryResult> {
  const { whereClause, params, nextParamIndex } = buildFacilityWhereClause(
    options,
    additionalParams.length + 1
  );

  let query = baseQuery + ' ' + whereClause;

  // Add ordering
  if (options.orderBy) {
    query += ` ORDER BY ${options.orderBy} ${options.orderDirection || 'DESC'}`;
  }

  // Add pagination
  if (options.limit) {
    query += ` LIMIT $${nextParamIndex}`;
    params.push(options.limit);
    
    const offset = options.offset || ((options.page || 1) - 1) * options.limit;
    if (offset > 0) {
      query += ` OFFSET $${nextParamIndex + 1}`;
      params.push(offset);
    }
  }

  const allParams = [...additionalParams, ...params];
  return await db.query(query, allParams);
}

/**
 * Count records with facility isolation
 */
export async function countFacilityRecords(
  db: Pool | PoolClient,
  tableName: string,
  options: FacilityFilterOptions,
  additionalConditions?: string,
  additionalParams: any[] = []
): Promise<number> {
  const { whereClause, params } = buildFacilityWhereClause(
    options,
    additionalParams.length + 1
  );

  let query = `SELECT COUNT(*) as count FROM ${tableName} ${whereClause}`;

  if (additionalConditions) {
    query += ` AND (${additionalConditions})`;
  }

  const allParams = [...additionalParams, ...params];
  const result = await db.query(query, allParams);
  
  return parseInt(result.rows[0]?.count || '0');
}

/**
 * Get record by ID with facility validation
 */
export async function getFacilityRecordById(
  db: Pool | PoolClient,
  tableName: string,
  recordId: string,
  options: FacilityFilterOptions
): Promise<any | null> {
  const { whereClause, params, nextParamIndex } = buildFacilityWhereClause(options);

  const query = `
    SELECT * FROM ${tableName} 
    ${whereClause}
    ${whereClause ? 'AND' : 'WHERE'} id = $${nextParamIndex}
    LIMIT 1
  `;

  const result = await db.query(query, [...params, recordId]);
  return result.rows.length > 0 ? result.rows[0] : null;
}

/**
 * Update record with facility validation
 */
export async function updateFacilityRecord(
  db: Pool | PoolClient,
  tableName: string,
  recordId: string,
  updates: Record<string, any>,
  options: FacilityFilterOptions
): Promise<boolean> {
  // First check if record exists and belongs to facility
  const existing = await getFacilityRecordById(db, tableName, recordId, options);
  
  if (!existing) {
    throw new Error('Record not found or access denied');
  }

  // Build UPDATE query
  const updateFields = Object.keys(updates).filter(key => key !== 'id');
  const setClause = updateFields.map((field, i) => `${field} = $${i + 1}`).join(', ');
  const values = updateFields.map(field => updates[field]);

  const query = `
    UPDATE ${tableName}
    SET ${setClause}, updated_at = NOW()
    WHERE id = $${values.length + 1}
      AND organization_id = $${values.length + 2}
      ${options.facilityId ? `AND facility_id = $${values.length + 3}` : ''}
    RETURNING *
  `;

  const params = [
    ...values,
    recordId,
    options.organizationId,
    ...(options.facilityId ? [options.facilityId] : [])
  ];

  const result = await db.query(query, params);
  return result.rowCount > 0;
}

/**
 * Delete record with facility validation (soft delete)
 */
export async function deleteFacilityRecord(
  db: Pool | PoolClient,
  tableName: string,
  recordId: string,
  options: FacilityFilterOptions,
  userId?: string,
  reason?: string
): Promise<boolean> {
  // First check if record exists and belongs to facility
  const existing = await getFacilityRecordById(db, tableName, recordId, options);
  
  if (!existing) {
    throw new Error('Record not found or access denied');
  }

  // Try soft delete
  let query: string;
  let params: any[];

  // Check if table has deleted_at column
  if (existing.hasOwnProperty('deleted_at')) {
    query = `
      UPDATE ${tableName}
      SET deleted_at = NOW(),
          deleted_by = $1,
          deletion_reason = $2
      WHERE id = $3
        AND organization_id = $4
        ${options.facilityId ? 'AND facility_id = $5' : ''}
    `;
    params = [
      userId || null,
      reason || null,
      recordId,
      options.organizationId,
      ...(options.facilityId ? [options.facilityId] : [])
    ];
  } else {
    // Hard delete if no soft delete support
    query = `
      DELETE FROM ${tableName}
      WHERE id = $1
        AND organization_id = $2
        ${options.facilityId ? 'AND facility_id = $3' : ''}
    `;
    params = [
      recordId,
      options.organizationId,
      ...(options.facilityId ? [options.facilityId] : [])
    ];
  }

  const result = await db.query(query, params);
  return result.rowCount > 0;
}

/**
 * Build pagination metadata
 */
export function buildPaginationMetadata(
  totalRecords: number,
  page: number,
  limit: number
): {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
} {
  const pages = Math.ceil(totalRecords / limit);
  
  return {
    page,
    limit,
    total: totalRecords,
    pages,
    hasNext: page < pages,
    hasPrev: page > 1
  };
}

/**
 * Validate facility ownership of multiple records
 */
export async function validateFacilityOwnership(
  db: Pool | PoolClient,
  tableName: string,
  recordIds: string[],
  facilityId: string,
  organizationId: string
): Promise<{ valid: boolean; invalidIds: string[] }> {
  if (recordIds.length === 0) {
    return { valid: true, invalidIds: [] };
  }

  const query = `
    SELECT id FROM ${tableName}
    WHERE id = ANY($1)
      AND organization_id = $2
      AND facility_id = $3
  `;

  const result = await db.query(query, [recordIds, organizationId, facilityId]);
  const validIds = result.rows.map(row => row.id);
  const invalidIds = recordIds.filter(id => !validIds.includes(id));

  return {
    valid: invalidIds.length === 0,
    invalidIds
  };
}

/**
 * Get facility statistics
 */
export async function getFacilityStatistics(
  db: Pool | PoolClient,
  tableName: string,
  facilityId: string,
  organizationId: string
): Promise<{
  total: number;
  active: number;
  inactive: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
}> {
  const query = `
    SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN deleted_at IS NULL THEN 1 END) as active,
      COUNT(CASE WHEN deleted_at IS NOT NULL THEN 1 END) as inactive,
      COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 END) as today,
      COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as this_week,
      COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as this_month
    FROM ${tableName}
    WHERE organization_id = $1
      AND facility_id = $2
  `;

  const result = await db.query(query, [organizationId, facilityId]);
  const row = result.rows[0];

  return {
    total: parseInt(row.total || '0'),
    active: parseInt(row.active || '0'),
    inactive: parseInt(row.inactive || '0'),
    today: parseInt(row.today || '0'),
    thisWeek: parseInt(row.this_week || '0'),
    thisMonth: parseInt(row.this_month || '0')
  };
}

export default {
  buildFacilityWhereClause,
  executeFacilityQuery,
  countFacilityRecords,
  getFacilityRecordById,
  updateFacilityRecord,
  deleteFacilityRecord,
  buildPaginationMetadata,
  validateFacilityOwnership,
  getFacilityStatistics
};

