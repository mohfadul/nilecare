/**
 * Sync Service - Offline/Online Data Synchronization
 * 
 * Handles synchronization between local facility databases and central database
 * Implements conflict resolution and change tracking
 * 
 * Architecture:
 * - Each facility has a local PostgreSQL database
 * - Central database aggregates all facility data
 * - Two-way sync: Local ↔ Central
 * - Conflict resolution based on timestamp and priority
 */

import { Pool, PoolClient } from 'pg';

export interface SyncRecord {
  id: string;
  entityType: string; // 'patient', 'medication', 'soap-note', etc.
  entityId: string;
  facilityId: string;
  organizationId: string;
  operation: 'create' | 'update' | 'delete';
  data: any; // JSON snapshot of the entity
  version: number;
  timestamp: Date;
  syncedAt?: Date;
  syncStatus: 'pending' | 'synced' | 'conflict' | 'failed';
  conflictReason?: string;
  retryCount: number;
  lastRetryAt?: Date;
}

export interface ConflictResolution {
  strategy: 'last-write-wins' | 'facility-priority' | 'manual-review' | 'merge';
  resolvedData: any;
  reason: string;
  resolvedBy?: string;
  resolvedAt: Date;
}

export interface SyncStatus {
  facilityId: string;
  lastSyncAt: Date;
  pendingChanges: number;
  conflicts: number;
  failedSyncs: number;
  status: 'healthy' | 'degraded' | 'offline';
}

export class SyncService {
  private centralDb: Pool;
  private localDb: Pool;

  constructor(centralDbConfig: any, localDbConfig?: any) {
    this.centralDb = new Pool(centralDbConfig);
    this.localDb = localDbConfig ? new Pool(localDbConfig) : this.centralDb;
  }

  /**
   * Initialize sync tables if they don't exist
   */
  async initializeSyncTables(): Promise<void> {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS sync_log (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        entity_type VARCHAR(50) NOT NULL,
        entity_id UUID NOT NULL,
        facility_id UUID NOT NULL,
        organization_id UUID NOT NULL,
        operation VARCHAR(20) NOT NULL CHECK (operation IN ('create', 'update', 'delete')),
        data JSONB NOT NULL,
        version INTEGER NOT NULL DEFAULT 1,
        timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
        synced_at TIMESTAMP,
        sync_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'conflict', 'failed')),
        conflict_reason TEXT,
        retry_count INTEGER DEFAULT 0,
        last_retry_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_sync_log_facility ON sync_log (facility_id, sync_status);
      CREATE INDEX IF NOT EXISTS idx_sync_log_entity ON sync_log (entity_type, entity_id);
      CREATE INDEX IF NOT EXISTS idx_sync_log_status ON sync_log (sync_status, timestamp);
      CREATE INDEX IF NOT EXISTS idx_sync_log_pending ON sync_log (facility_id, sync_status) WHERE sync_status = 'pending';

      -- Conflict resolution table
      CREATE TABLE IF NOT EXISTS sync_conflicts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        sync_log_id UUID NOT NULL REFERENCES sync_log(id),
        entity_type VARCHAR(50) NOT NULL,
        entity_id UUID NOT NULL,
        facility_id UUID NOT NULL,
        local_version INTEGER NOT NULL,
        central_version INTEGER NOT NULL,
        local_data JSONB NOT NULL,
        central_data JSONB NOT NULL,
        resolution_strategy VARCHAR(50),
        resolved_data JSONB,
        resolved_by UUID,
        resolved_at TIMESTAMP,
        status VARCHAR(20) NOT NULL DEFAULT 'unresolved' CHECK (status IN ('unresolved', 'resolved', 'merged')),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_sync_conflicts_facility ON sync_conflicts (facility_id, status);
      CREATE INDEX IF NOT EXISTS idx_sync_conflicts_entity ON sync_conflicts (entity_type, entity_id);
      CREATE INDEX IF NOT EXISTS idx_sync_conflicts_unresolved ON sync_conflicts (facility_id) WHERE status = 'unresolved';
    `;

    await this.centralDb.query(createTableSQL);
    
    if (this.localDb !== this.centralDb) {
      await this.localDb.query(createTableSQL);
    }
  }

  /**
   * Log a change for synchronization
   */
  async logChange(change: {
    entityType: string;
    entityId: string;
    facilityId: string;
    organizationId: string;
    operation: 'create' | 'update' | 'delete';
    data: any;
  }): Promise<SyncRecord> {
    const query = `
      INSERT INTO sync_log (
        entity_type, entity_id, facility_id, organization_id, operation, data, version
      )
      VALUES ($1, $2, $3, $4, $5, $6, 
        COALESCE((
          SELECT MAX(version) + 1 
          FROM sync_log 
          WHERE entity_type = $1 AND entity_id = $2
        ), 1)
      )
      RETURNING *
    `;

    const result = await this.localDb.query(query, [
      change.entityType,
      change.entityId,
      change.facilityId,
      change.organizationId,
      change.operation,
      JSON.stringify(change.data)
    ]);

    return this.mapRowToSyncRecord(result.rows[0]);
  }

  /**
   * Get pending changes for facility
   */
  async getPendingChanges(facilityId: string, limit: number = 100): Promise<SyncRecord[]> {
    const query = `
      SELECT * FROM sync_log
      WHERE facility_id = $1
        AND sync_status = 'pending'
      ORDER BY timestamp ASC
      LIMIT $2
    `;

    const result = await this.localDb.query(query, [facilityId, limit]);
    return result.rows.map(row => this.mapRowToSyncRecord(row));
  }

  /**
   * Sync changes to central database
   */
  async syncToCenter(facilityId: string): Promise<{
    synced: number;
    conflicts: number;
    failed: number;
  }> {
    const pendingChanges = await this.getPendingChanges(facilityId);
    
    let synced = 0;
    let conflicts = 0;
    let failed = 0;

    for (const change of pendingChanges) {
      try {
        await this.syncSingleRecord(change);
        synced++;
      } catch (error: any) {
        if (error.code === 'SYNC_CONFLICT') {
          conflicts++;
        } else {
          failed++;
        }
      }
    }

    return { synced, conflicts, failed };
  }

  /**
   * Sync a single record
   */
  private async syncSingleRecord(syncRecord: SyncRecord): Promise<void> {
    const client = await this.centralDb.connect();
    
    try {
      await client.query('BEGIN');

      // Check for conflicts
      const existingVersion = await this.getCentralVersion(
        syncRecord.entityType,
        syncRecord.entityId,
        client
      );

      if (existingVersion && existingVersion >= syncRecord.version) {
        // Conflict detected - central has newer or same version
        await this.handleConflict(syncRecord, existingVersion, client);
        throw new Error('SYNC_CONFLICT');
      }

      // No conflict - apply change
      await this.applyChange(syncRecord, client);

      // Mark as synced
      await this.markAsSynced(syncRecord.id, client);

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get central database version of entity
   */
  private async getCentralVersion(
    entityType: string,
    entityId: string,
    client: PoolClient
  ): Promise<number | null> {
    const tableName = this.getTableName(entityType);
    const query = `SELECT version FROM ${tableName} WHERE id = $1`;
    
    try {
      const result = await client.query(query, [entityId]);
      return result.rows.length > 0 ? result.rows[0].version : null;
    } catch (error: any) {
      // Table might not have version column
      return null;
    }
  }

  /**
   * Apply change to central database
   */
  private async applyChange(syncRecord: SyncRecord, client: PoolClient): Promise<void> {
    const tableName = this.getTableName(syncRecord.entityType);

    switch (syncRecord.operation) {
      case 'create':
        await this.insertRecord(tableName, syncRecord.data, client);
        break;
      
      case 'update':
        await this.updateRecord(tableName, syncRecord.entityId, syncRecord.data, client);
        break;
      
      case 'delete':
        await this.deleteRecord(tableName, syncRecord.entityId, client);
        break;
    }
  }

  /**
   * Handle sync conflict
   */
  private async handleConflict(
    syncRecord: SyncRecord,
    centralVersion: number,
    client: PoolClient
  ): Promise<void> {
    // Get central data
    const tableName = this.getTableName(syncRecord.entityType);
    const centralDataResult = await client.query(
      `SELECT * FROM ${tableName} WHERE id = $1`,
      [syncRecord.entityId]
    );

    if (centralDataResult.rows.length === 0) {
      // Entity was deleted in central - mark as conflict
      await this.createConflictRecord({
        syncLogId: syncRecord.id,
        entityType: syncRecord.entityType,
        entityId: syncRecord.entityId,
        facilityId: syncRecord.facilityId,
        localVersion: syncRecord.version,
        centralVersion: centralVersion,
        localData: syncRecord.data,
        centralData: null,
        client
      });
      return;
    }

    const centralData = centralDataResult.rows[0];

    // Create conflict record
    await this.createConflictRecord({
      syncLogId: syncRecord.id,
      entityType: syncRecord.entityType,
      entityId: syncRecord.entityId,
      facilityId: syncRecord.facilityId,
      localVersion: syncRecord.version,
      centralVersion: centralVersion,
      localData: syncRecord.data,
      centralData: centralData,
      client
    });

    // Update sync log status
    await client.query(
      `UPDATE sync_log SET sync_status = 'conflict', conflict_reason = $1 WHERE id = $2`,
      ['Version conflict detected', syncRecord.id]
    );
  }

  /**
   * Create conflict record
   */
  private async createConflictRecord(conflictData: {
    syncLogId: string;
    entityType: string;
    entityId: string;
    facilityId: string;
    localVersion: number;
    centralVersion: number;
    localData: any;
    centralData: any;
    client: PoolClient;
  }): Promise<void> {
    const query = `
      INSERT INTO sync_conflicts (
        sync_log_id, entity_type, entity_id, facility_id,
        local_version, central_version, local_data, central_data
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `;

    await conflictData.client.query(query, [
      conflictData.syncLogId,
      conflictData.entityType,
      conflictData.entityId,
      conflictData.facilityId,
      conflictData.localVersion,
      conflictData.centralVersion,
      JSON.stringify(conflictData.localData),
      conflictData.centralData ? JSON.stringify(conflictData.centralData) : null
    ]);
  }

  /**
   * Resolve conflict
   */
  async resolveConflict(
    conflictId: string,
    resolution: ConflictResolution
  ): Promise<void> {
    const client = await this.centralDb.connect();

    try {
      await client.query('BEGIN');

      // Get conflict details
      const conflictQuery = `SELECT * FROM sync_conflicts WHERE id = $1`;
      const conflictResult = await client.query(conflictQuery, [conflictId]);

      if (conflictResult.rows.length === 0) {
        throw new Error('Conflict not found');
      }

      const conflict = conflictResult.rows[0];

      // Apply resolution
      const tableName = this.getTableName(conflict.entity_type);
      await this.updateRecord(tableName, conflict.entity_id, resolution.resolvedData, client);

      // Update conflict record
      await client.query(
        `UPDATE sync_conflicts 
         SET status = 'resolved', 
             resolution_strategy = $1,
             resolved_data = $2,
             resolved_by = $3,
             resolved_at = NOW()
         WHERE id = $4`,
        [
          resolution.strategy,
          JSON.stringify(resolution.resolvedData),
          resolution.resolvedBy,
          conflictId
        ]
      );

      // Update sync log
      await client.query(
        `UPDATE sync_log SET sync_status = 'synced', synced_at = NOW() WHERE id = $1`,
        [conflict.sync_log_id]
      );

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get conflicts for facility
   */
  async getConflicts(facilityId: string, limit: number = 50): Promise<any[]> {
    const query = `
      SELECT * FROM sync_conflicts
      WHERE facility_id = $1 AND status = 'unresolved'
      ORDER BY created_at DESC
      LIMIT $2
    `;

    const result = await this.centralDb.query(query, [facilityId, limit]);
    return result.rows;
  }

  /**
   * Get sync status for facility
   */
  async getSyncStatus(facilityId: string): Promise<SyncStatus> {
    // Get last sync time
    const lastSyncQuery = `
      SELECT MAX(synced_at) as last_sync
      FROM sync_log
      WHERE facility_id = $1 AND sync_status = 'synced'
    `;
    const lastSyncResult = await this.localDb.query(lastSyncQuery, [facilityId]);
    const lastSyncAt = lastSyncResult.rows[0]?.last_sync || new Date(0);

    // Count pending changes
    const pendingQuery = `
      SELECT COUNT(*) as count FROM sync_log
      WHERE facility_id = $1 AND sync_status = 'pending'
    `;
    const pendingResult = await this.localDb.query(pendingQuery, [facilityId]);
    const pendingChanges = parseInt(pendingResult.rows[0]?.count || '0');

    // Count conflicts
    const conflictsQuery = `
      SELECT COUNT(*) as count FROM sync_conflicts
      WHERE facility_id = $1 AND status = 'unresolved'
    `;
    const conflictsResult = await this.centralDb.query(conflictsQuery, [facilityId]);
    const conflicts = parseInt(conflictsResult.rows[0]?.count || '0');

    // Count failed syncs
    const failedQuery = `
      SELECT COUNT(*) as count FROM sync_log
      WHERE facility_id = $1 AND sync_status = 'failed'
    `;
    const failedResult = await this.localDb.query(failedQuery, [facilityId]);
    const failedSyncs = parseInt(failedResult.rows[0]?.count || '0');

    // Determine status
    let status: SyncStatus['status'] = 'healthy';
    const hoursSinceLastSync = (Date.now() - lastSyncAt.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceLastSync > 24 || conflicts > 10 || failedSyncs > 5) {
      status = 'degraded';
    }
    
    if (hoursSinceLastSync > 72 || pendingChanges > 1000) {
      status = 'offline';
    }

    return {
      facilityId,
      lastSyncAt,
      pendingChanges,
      conflicts,
      failedSyncs,
      status
    };
  }

  /**
   * Pull changes from central to local
   */
  async pullFromCenter(facilityId: string, since?: Date): Promise<number> {
    const sinceDate = since || new Date(Date.now() - 24 * 60 * 60 * 1000); // Last 24 hours

    const query = `
      SELECT * FROM sync_log
      WHERE facility_id != $1
        AND timestamp > $2
        AND sync_status = 'synced'
      ORDER BY timestamp ASC
      LIMIT 500
    `;

    const result = await this.centralDb.query(query, [facilityId, sinceDate]);
    const changes = result.rows.map(row => this.mapRowToSyncRecord(row));

    let applied = 0;

    for (const change of changes) {
      try {
        await this.applyChange(change, await this.localDb.connect());
        applied++;
      } catch (error: any) {
        console.error(`Failed to apply change ${change.id}:`, error);
      }
    }

    return applied;
  }

  /**
   * Mark sync record as synced
   */
  private async markAsSynced(syncRecordId: string, client: PoolClient): Promise<void> {
    await client.query(
      `UPDATE sync_log SET sync_status = 'synced', synced_at = NOW() WHERE id = $1`,
      [syncRecordId]
    );
  }

  /**
   * Insert record into table
   */
  private async insertRecord(tableName: string, data: any, client: PoolClient): Promise<void> {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');

    const query = `
      INSERT INTO ${tableName} (${columns.join(', ')})
      VALUES (${placeholders})
      ON CONFLICT (id) DO UPDATE SET ${columns.map((col, i) => `${col} = $${i + 1}`).join(', ')}
    `;

    await client.query(query, values);
  }

  /**
   * Update record in table
   */
  private async updateRecord(
    tableName: string,
    entityId: string,
    data: any,
    client: PoolClient
  ): Promise<void> {
    const updates = Object.keys(data)
      .filter(key => key !== 'id')
      .map((key, i) => `${key} = $${i + 2}`)
      .join(', ');

    const values = [
      entityId,
      ...Object.keys(data).filter(key => key !== 'id').map(key => data[key])
    ];

    const query = `UPDATE ${tableName} SET ${updates} WHERE id = $1`;
    await client.query(query, values);
  }

  /**
   * Delete record from table (soft delete)
   */
  private async deleteRecord(tableName: string, entityId: string, client: PoolClient): Promise<void> {
    // Try soft delete first
    try {
      await client.query(
        `UPDATE ${tableName} SET deleted_at = NOW() WHERE id = $1`,
        [entityId]
      );
    } catch {
      // If no deleted_at column, do hard delete
      await client.query(`DELETE FROM ${tableName} WHERE id = $1`, [entityId]);
    }
  }

  /**
   * Get table name from entity type
   */
  private getTableName(entityType: string): string {
    const tableMap: Record<string, string> = {
      'patient': 'patients',
      'encounter': 'encounters',
      'medication': 'medications',
      'soap-note': 'soap_notes',
      'problem-list': 'problem_list',
      'progress-note': 'progress_notes',
      'diagnostic': 'diagnostics',
      'alert': 'alerts',
      'drug-interaction': 'drug_interactions',
      'clinical-guideline': 'clinical_guidelines'
    };

    return tableMap[entityType] || entityType;
  }

  /**
   * Map database row to SyncRecord
   */
  private mapRowToSyncRecord(row: any): SyncRecord {
    return {
      id: row.id,
      entityType: row.entity_type,
      entityId: row.entity_id,
      facilityId: row.facility_id,
      organizationId: row.organization_id,
      operation: row.operation,
      data: typeof row.data === 'string' ? JSON.parse(row.data) : row.data,
      version: row.version,
      timestamp: row.timestamp,
      syncedAt: row.synced_at,
      syncStatus: row.sync_status,
      conflictReason: row.conflict_reason,
      retryCount: row.retry_count || 0,
      lastRetryAt: row.last_retry_at
    };
  }

  /**
   * Auto-sync daemon
   * Runs in background to sync changes periodically
   */
  async startAutoSync(facilityId: string, intervalMs: number = 60000): Promise<NodeJS.Timer> {
    console.log(`🔄 Starting auto-sync for facility ${facilityId} every ${intervalMs}ms`);

    return setInterval(async () => {
      try {
        const result = await this.syncToCenter(facilityId);
        console.log(`✅ Auto-sync complete: ${result.synced} synced, ${result.conflicts} conflicts, ${result.failed} failed`);
      } catch (error: any) {
        console.error('❌ Auto-sync error:', error);
      }
    }, intervalMs);
  }

  /**
   * Stop auto-sync
   */
  stopAutoSync(timer: NodeJS.Timer): void {
    clearInterval(timer);
    console.log('⏹️  Auto-sync stopped');
  }

  /**
   * Close database connections
   */
  async close(): Promise<void> {
    await this.centralDb.end();
    if (this.localDb !== this.centralDb) {
      await this.localDb.end();
    }
  }
}

/**
 * Conflict resolution strategies
 */
export class ConflictResolver {
  /**
   * Last Write Wins - Use the most recent timestamp
   */
  static lastWriteWins(localData: any, centralData: any): ConflictResolution {
    const localTimestamp = new Date(localData.updated_at || localData.created_at);
    const centralTimestamp = new Date(centralData.updated_at || centralData.created_at);

    const resolvedData = localTimestamp > centralTimestamp ? localData : centralData;

    return {
      strategy: 'last-write-wins',
      resolvedData,
      reason: `Selected ${localTimestamp > centralTimestamp ? 'local' : 'central'} version based on timestamp`,
      resolvedAt: new Date()
    };
  }

  /**
   * Facility Priority - Always prefer facility's local data
   */
  static facilityPriority(localData: any, centralData: any): ConflictResolution {
    return {
      strategy: 'facility-priority',
      resolvedData: localData,
      reason: 'Facility data takes precedence (local source of truth)',
      resolvedAt: new Date()
    };
  }

  /**
   * Merge - Combine both versions intelligently
   */
  static merge(localData: any, centralData: any): ConflictResolution {
    // Merge arrays
    const resolvedData = { ...centralData };

    for (const key in localData) {
      if (localData[key] !== centralData[key]) {
        // For arrays, merge unique items
        if (Array.isArray(localData[key]) && Array.isArray(centralData[key])) {
          resolvedData[key] = [...new Set([...centralData[key], ...localData[key]])];
        }
        // For objects, merge recursively
        else if (typeof localData[key] === 'object' && localData[key] !== null) {
          resolvedData[key] = { ...centralData[key], ...localData[key] };
        }
        // For primitives, prefer local if it's newer
        else {
          const localTimestamp = new Date(localData.updated_at || localData.created_at);
          const centralTimestamp = new Date(centralData.updated_at || centralData.created_at);
          resolvedData[key] = localTimestamp > centralTimestamp ? localData[key] : centralData[key];
        }
      }
    }

    return {
      strategy: 'merge',
      resolvedData,
      reason: 'Merged local and central data intelligently',
      resolvedAt: new Date()
    };
  }

  /**
   * Manual Review - Flag for human intervention
   */
  static manualReview(): ConflictResolution {
    return {
      strategy: 'manual-review',
      resolvedData: null,
      reason: 'Conflict requires manual review by administrator',
      resolvedAt: new Date()
    };
  }
}

export default SyncService;

