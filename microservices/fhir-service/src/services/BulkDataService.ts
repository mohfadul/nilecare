import { Pool } from 'pg';
import { getPostgreSQLPool } from '../utils/database';
import { v4 as uuidv4 } from 'uuid';
import { logBulkDataExport } from '../utils/logger';
import { logger } from '../utils/logger';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Bulk Data Service
 * Implements FHIR Bulk Data Access API ($export operation)
 * https://hl7.org/fhir/uv/bulkdata/
 */

export class BulkDataService {
  private pool: Pool;
  private exportDir: string;

  constructor() {
    this.pool = getPostgreSQLPool();
    this.exportDir = process.env.BULK_EXPORT_DIR || './exports';
    
    // Ensure export directory exists
    if (!fs.existsSync(this.exportDir)) {
      fs.mkdirSync(this.exportDir, { recursive: true });
    }
  }

  /**
   * Initiate bulk data export
   * Returns Content-Location header with status endpoint
   */
  async initiateExport(exportParams: {
    exportType: 'system' | 'patient' | 'group';
    resourceTypes?: string[];
    since?: string;
    patientId?: string;
    groupId?: string;
  }, user: any): Promise<{ requestId: string; statusUrl: string }> {
    const requestId = uuidv4();
    const resourceTypes = exportParams.resourceTypes || ['Patient', 'Observation', 'Condition', 'MedicationRequest', 'Encounter'];

    // Create export request record
    const query = `
      INSERT INTO bulk_export_requests (
        request_id, export_type, resource_types, since_date,
        patient_id, group_id, status, facility_id, created_by,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, 'processing', $7, $8, NOW(), NOW())
      RETURNING *
    `;

    await this.pool.query(query, [
      requestId,
      exportParams.exportType,
      JSON.stringify(resourceTypes),
      exportParams.since || null,
      exportParams.patientId || null,
      exportParams.groupId || null,
      user.facilityId,
      user.userId,
    ]);

    // Log export initiation
    logBulkDataExport({
      userId: user.userId,
      exportType: exportParams.exportType,
      resourceTypes,
      requestId,
      facilityId: user.facilityId,
    });

    // TODO: Start background export job

    const statusUrl = `/fhir/$export/${requestId}`;

    return { requestId, statusUrl };
  }

  /**
   * Get export status
   */
  async getExportStatus(requestId: string, user: any): Promise<any> {
    const query = `
      SELECT * FROM bulk_export_requests 
      WHERE request_id = $1 AND created_by = $2
    `;

    const result = await this.pool.query(query, [requestId, user.userId]);

    if (result.rows.length === 0) {
      return null;
    }

    const exportRequest = result.rows[0];

    // If still processing, return 202 Accepted
    if (exportRequest.status === 'processing') {
      return {
        status: 'processing',
        progress: exportRequest.progress || 0,
      };
    }

    // If completed, return download URLs
    if (exportRequest.status === 'completed') {
      const output = typeof exportRequest.output === 'string'
        ? JSON.parse(exportRequest.output)
        : exportRequest.output;

      return {
        status: 'completed',
        transactionTime: exportRequest.completed_at,
        request: `/fhir/$export/${requestId}`,
        requiresAccessToken: true,
        output: output || [],
        error: [],
      };
    }

    // If failed
    return {
      status: 'failed',
      error: exportRequest.error_message,
    };
  }

  /**
   * Cancel export request
   */
  async cancelExport(requestId: string, user: any): Promise<void> {
    const query = `
      UPDATE bulk_export_requests
      SET status = 'cancelled', updated_at = NOW()
      WHERE request_id = $1 AND created_by = $2 AND status = 'processing'
    `;

    await this.pool.query(query, [requestId, user.userId]);
  }

  /**
   * Download export file
   */
  async downloadExportFile(requestId: string, fileName: string, user: any): Promise<string> {
    const filePath = path.join(this.exportDir, requestId, fileName);

    if (!fs.existsSync(filePath)) {
      throw new Error('Export file not found');
    }

    return filePath;
  }
}

export default BulkDataService;

