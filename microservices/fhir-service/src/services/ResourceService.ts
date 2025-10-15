import { Pool } from 'pg';
import { getPostgreSQLPool } from '../utils/database';
import { v4 as uuidv4 } from 'uuid';
import { ResourceNotFoundError } from '../middleware/errorHandler';
import { logger, logFHIRResourceCreated, logFHIRResourceAccess } from '../utils/logger';

/**
 * Generic Resource Service
 * Handles CRUD operations for any FHIR R4 resource
 */

export class ResourceService {
  private pool: Pool;

  constructor() {
    this.pool = getPostgreSQLPool();
  }

  /**
   * Create FHIR resource
   */
  async createResource(resourceType: string, resource: any, user: any): Promise<any> {
    const resourceId = resource.id || uuidv4();
    const facilityId = user.facilityId;

    resource.id = resourceId;
    resource.meta = {
      ...resource.meta,
      versionId: '1',
      lastUpdated: new Date().toISOString(),
    };

    const query = `
      INSERT INTO fhir_resources (
        resource_id, resource_type, resource_data, version,
        facility_id, tenant_id, created_by, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING *
    `;

    await this.pool.query(query, [
      resourceId,
      resourceType,
      JSON.stringify(resource),
      '1',
      facilityId,
      user.organizationId,
      user.userId,
    ]);

    // Log creation
    logFHIRResourceCreated({
      userId: user.userId,
      resourceType,
      resourceId,
      patientId: resource.subject?.reference?.split('/')[1],
      facilityId,
    });

    return resource;
  }

  /**
   * Get FHIR resource by ID
   */
  async getResource(resourceType: string, resourceId: string, user: any): Promise<any> {
    const query = `
      SELECT * FROM fhir_resources 
      WHERE resource_id = $1 AND resource_type = $2 AND deleted = false
    `;

    const result = await this.pool.query(query, [resourceId, resourceType]);

    if (result.rows.length === 0) {
      throw new ResourceNotFoundError(resourceType, resourceId);
    }

    const resource = typeof result.rows[0].resource_data === 'string'
      ? JSON.parse(result.rows[0].resource_data)
      : result.rows[0].resource_data;

    // Log access
    logFHIRResourceAccess({
      userId: user.userId,
      resourceType,
      resourceId,
      action: 'read',
      success: true,
      facilityId: user.facilityId,
    });

    return resource;
  }

  /**
   * Update FHIR resource
   */
  async updateResource(resourceType: string, resourceId: string, resource: any, user: any): Promise<any> {
    // Get current version
    const existing = await this.getResource(resourceType, resourceId, user);
    const currentVersion = parseInt(existing.meta?.versionId || '1');

    // Update meta
    resource.id = resourceId;
    resource.meta = {
      ...resource.meta,
      versionId: (currentVersion + 1).toString(),
      lastUpdated: new Date().toISOString(),
    };

    const query = `
      UPDATE fhir_resources
      SET resource_data = $1, version = $2, updated_by = $3, updated_at = NOW()
      WHERE resource_id = $4 AND resource_type = $5 AND deleted = false
      RETURNING *
    `;

    const result = await this.pool.query(query, [
      JSON.stringify(resource),
      resource.meta.versionId,
      user.userId,
      resourceId,
      resourceType,
    ]);

    if (result.rows.length === 0) {
      throw new ResourceNotFoundError(resourceType, resourceId);
    }

    // Log update
    logFHIRResourceAccess({
      userId: user.userId,
      resourceType,
      resourceId,
      action: 'update',
      success: true,
      facilityId: user.facilityId,
    });

    return resource;
  }

  /**
   * Delete FHIR resource (soft delete)
   */
  async deleteResource(resourceType: string, resourceId: string, user: any): Promise<void> {
    const query = `
      UPDATE fhir_resources
      SET deleted = true, deleted_at = NOW(), deleted_by = $1
      WHERE resource_id = $2 AND resource_type = $3 AND deleted = false
    `;

    const result = await this.pool.query(query, [user.userId, resourceId, resourceType]);

    if (result.rowCount === 0) {
      throw new ResourceNotFoundError(resourceType, resourceId);
    }

    // Log deletion
    logFHIRResourceAccess({
      userId: user.userId,
      resourceType,
      resourceId,
      action: 'delete',
      success: true,
      facilityId: user.facilityId,
    });
  }

  /**
   * Search FHIR resources
   */
  async searchResources(resourceType: string, searchParams: any, user: any): Promise<any> {
    let query = `
      SELECT resource_data FROM fhir_resources 
      WHERE resource_type = $1 AND deleted = false AND facility_id = $2
    `;
    const values: any[] = [resourceType, user.facilityId];
    let paramIndex = 3;

    // Add search filters based on common FHIR search parameters
    // This is a simplified implementation - full FHIR search is complex

    if (searchParams._id) {
      query += ` AND resource_id = $${paramIndex}`;
      values.push(searchParams._id);
      paramIndex++;
    }

    // Pagination
    const count = searchParams._count || 20;
    const offset = searchParams._offset || 0;
    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    values.push(count, offset);

    const result = await this.pool.query(query, values);

    const resources = result.rows.map(row =>
      typeof row.resource_data === 'string' ? JSON.parse(row.resource_data) : row.resource_data
    );

    // Create FHIR Bundle response
    const bundle = {
      resourceType: 'Bundle',
      type: 'searchset',
      total: resources.length,
      entry: resources.map((resource: any) => ({
        fullUrl: `${resourceType}/${resource.id}`,
        resource,
      })),
    };

    // Log search
    logFHIRResourceAccess({
      userId: user.userId,
      resourceType,
      resourceId: 'search',
      action: 'search',
      success: true,
      facilityId: user.facilityId,
    });

    return bundle;
  }

  /**
   * Get resource version history
   */
  async getResourceHistory(resourceType: string, resourceId: string, user: any): Promise<any> {
    const query = `
      SELECT * FROM fhir_resource_history 
      WHERE resource_id = $1 AND resource_type = $2
      ORDER BY version DESC
    `;

    const result = await this.pool.query(query, [resourceId, resourceType]);

    const entries = result.rows.map(row => ({
      fullUrl: `${resourceType}/${resourceId}/_history/${row.version}`,
      resource: typeof row.resource_data === 'string' ? JSON.parse(row.resource_data) : row.resource_data,
    }));

    return {
      resourceType: 'Bundle',
      type: 'history',
      total: entries.length,
      entry: entries,
    };
  }
}

export default ResourceService;

