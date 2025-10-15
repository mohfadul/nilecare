-- ================================================================
-- Sync Tables Initialization Script
-- ================================================================
--
-- This script creates the necessary tables for offline/online
-- synchronization across multiple facilities
--
-- Run this on BOTH central and local facility databases
--
-- Usage:
--   psql -U postgres -d nilecare_central -f scripts/init-sync-tables.sql
--   psql -U postgres -d facility_a_db -f scripts/init-sync-tables.sql
--
-- ================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================================
-- SYNC LOG TABLE
-- ================================================================
-- Tracks all changes made to clinical data for synchronization

CREATE TABLE IF NOT EXISTS sync_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Entity identification
  entity_type VARCHAR(50) NOT NULL, -- 'patient', 'medication', 'soap-note', etc.
  entity_id UUID NOT NULL,
  
  -- Facility context
  facility_id UUID NOT NULL,
  organization_id UUID NOT NULL,
  
  -- Change details
  operation VARCHAR(20) NOT NULL CHECK (operation IN ('create', 'update', 'delete')),
  data JSONB NOT NULL, -- Full snapshot of the entity
  
  -- Versioning
  version INTEGER NOT NULL DEFAULT 1,
  
  -- Sync tracking
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  synced_at TIMESTAMP,
  sync_status VARCHAR(20) NOT NULL DEFAULT 'pending' 
    CHECK (sync_status IN ('pending', 'synced', 'conflict', 'failed')),
  conflict_reason TEXT,
  
  -- Retry tracking
  retry_count INTEGER DEFAULT 0,
  last_retry_at TIMESTAMP,
  max_retries INTEGER DEFAULT 5,
  
  -- Audit
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_entity_version UNIQUE (entity_type, entity_id, version)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sync_log_facility_status 
  ON sync_log (facility_id, sync_status);

CREATE INDEX IF NOT EXISTS idx_sync_log_entity 
  ON sync_log (entity_type, entity_id, version DESC);

CREATE INDEX IF NOT EXISTS idx_sync_log_pending 
  ON sync_log (facility_id, sync_status, timestamp) 
  WHERE sync_status = 'pending';

CREATE INDEX IF NOT EXISTS idx_sync_log_timestamp 
  ON sync_log (timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_sync_log_organization 
  ON sync_log (organization_id, sync_status);

-- ================================================================
-- SYNC CONFLICTS TABLE
-- ================================================================
-- Stores conflicts detected during synchronization

CREATE TABLE IF NOT EXISTS sync_conflicts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Reference to sync log
  sync_log_id UUID NOT NULL REFERENCES sync_log(id) ON DELETE CASCADE,
  
  -- Entity identification
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  facility_id UUID NOT NULL,
  
  -- Conflict data
  local_version INTEGER NOT NULL,
  central_version INTEGER NOT NULL,
  local_data JSONB NOT NULL,
  central_data JSONB, -- NULL if deleted in central
  
  -- Resolution
  resolution_strategy VARCHAR(50) CHECK (resolution_strategy IN (
    'last-write-wins', 'facility-priority', 'merge', 'manual-review'
  )),
  resolved_data JSONB,
  resolved_by UUID, -- User who resolved the conflict
  resolved_at TIMESTAMP,
  resolution_notes TEXT,
  
  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'unresolved' 
    CHECK (status IN ('unresolved', 'resolved', 'merged', 'cancelled')),
  
  -- Priority
  priority VARCHAR(20) DEFAULT 'medium' 
    CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  
  -- Audit
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sync_conflicts_facility_status 
  ON sync_conflicts (facility_id, status);

CREATE INDEX IF NOT EXISTS idx_sync_conflicts_entity 
  ON sync_conflicts (entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_sync_conflicts_unresolved 
  ON sync_conflicts (facility_id, priority DESC) 
  WHERE status = 'unresolved';

CREATE INDEX IF NOT EXISTS idx_sync_conflicts_created 
  ON sync_conflicts (created_at DESC);

-- ================================================================
-- SYNC STATUS TABLE
-- ================================================================
-- Tracks overall sync health for each facility

CREATE TABLE IF NOT EXISTS sync_status (
  facility_id UUID PRIMARY KEY,
  organization_id UUID NOT NULL,
  
  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'unknown' 
    CHECK (status IN ('healthy', 'degraded', 'offline', 'unknown')),
  
  -- Sync metrics
  last_sync_at TIMESTAMP,
  last_successful_sync_at TIMESTAMP,
  pending_changes INTEGER DEFAULT 0,
  synced_changes_today INTEGER DEFAULT 0,
  
  -- Conflicts
  unresolved_conflicts INTEGER DEFAULT 0,
  resolved_conflicts_today INTEGER DEFAULT 0,
  
  -- Errors
  failed_syncs INTEGER DEFAULT 0,
  last_error TEXT,
  last_error_at TIMESTAMP,
  
  -- Performance
  avg_sync_duration_ms INTEGER,
  last_sync_duration_ms INTEGER,
  
  -- Network
  network_status VARCHAR(20) DEFAULT 'online' 
    CHECK (network_status IN ('online', 'offline', 'intermittent')),
  last_online_at TIMESTAMP,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sync_status_organization 
  ON sync_status (organization_id, status);

CREATE INDEX IF NOT EXISTS idx_sync_status_health 
  ON sync_status (status, last_sync_at) 
  WHERE status IN ('degraded', 'offline');

-- ================================================================
-- FUNCTIONS
-- ================================================================

-- Function to update sync status
CREATE OR REPLACE FUNCTION update_sync_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update sync_status table based on sync_log changes
  INSERT INTO sync_status (
    facility_id, 
    organization_id, 
    last_sync_at,
    pending_changes,
    updated_at
  )
  VALUES (
    NEW.facility_id,
    NEW.organization_id,
    CASE WHEN NEW.sync_status = 'synced' THEN NOW() ELSE NULL END,
    (SELECT COUNT(*) FROM sync_log WHERE facility_id = NEW.facility_id AND sync_status = 'pending'),
    NOW()
  )
  ON CONFLICT (facility_id) DO UPDATE SET
    last_sync_at = CASE WHEN NEW.sync_status = 'synced' THEN NOW() ELSE sync_status.last_sync_at END,
    last_successful_sync_at = CASE WHEN NEW.sync_status = 'synced' THEN NOW() ELSE sync_status.last_successful_sync_at END,
    pending_changes = (SELECT COUNT(*) FROM sync_log WHERE facility_id = NEW.facility_id AND sync_status = 'pending'),
    synced_changes_today = CASE WHEN NEW.sync_status = 'synced' THEN sync_status.synced_changes_today + 1 ELSE sync_status.synced_changes_today END,
    failed_syncs = CASE WHEN NEW.sync_status = 'failed' THEN sync_status.failed_syncs + 1 ELSE sync_status.failed_syncs END,
    last_error = CASE WHEN NEW.sync_status = 'failed' THEN NEW.conflict_reason ELSE sync_status.last_error END,
    last_error_at = CASE WHEN NEW.sync_status = 'failed' THEN NOW() ELSE sync_status.last_error_at END,
    status = CASE 
      WHEN (SELECT COUNT(*) FROM sync_log WHERE facility_id = NEW.facility_id AND sync_status = 'failed') > 5 THEN 'degraded'
      WHEN (SELECT COUNT(*) FROM sync_log WHERE facility_id = NEW.facility_id AND sync_status = 'pending') > 1000 THEN 'degraded'
      WHEN (SELECT MAX(last_sync_at) FROM sync_status WHERE facility_id = NEW.facility_id) < NOW() - INTERVAL '24 hours' THEN 'degraded'
      WHEN (SELECT MAX(last_sync_at) FROM sync_status WHERE facility_id = NEW.facility_id) < NOW() - INTERVAL '72 hours' THEN 'offline'
      ELSE 'healthy'
    END,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update sync status
DROP TRIGGER IF EXISTS trigger_update_sync_status ON sync_log;
CREATE TRIGGER trigger_update_sync_status
  AFTER INSERT OR UPDATE ON sync_log
  FOR EACH ROW
  EXECUTE FUNCTION update_sync_status();

-- Function to clean up old sync logs
CREATE OR REPLACE FUNCTION cleanup_old_sync_logs(retention_days INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM sync_log
  WHERE sync_status = 'synced'
    AND synced_at < NOW() - (retention_days || ' days')::INTERVAL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get sync statistics
CREATE OR REPLACE FUNCTION get_facility_sync_stats(facility_uuid UUID)
RETURNS TABLE (
  facility_id UUID,
  pending_changes BIGINT,
  synced_today BIGINT,
  failed_today BIGINT,
  conflicts BIGINT,
  last_sync TIMESTAMP,
  status VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ss.facility_id,
    COUNT(*) FILTER (WHERE sl.sync_status = 'pending') as pending_changes,
    COUNT(*) FILTER (WHERE sl.sync_status = 'synced' AND DATE(sl.synced_at) = CURRENT_DATE) as synced_today,
    COUNT(*) FILTER (WHERE sl.sync_status = 'failed' AND DATE(sl.timestamp) = CURRENT_DATE) as failed_today,
    COUNT(DISTINCT sc.id) FILTER (WHERE sc.status = 'unresolved') as conflicts,
    ss.last_sync_at,
    ss.status
  FROM sync_status ss
  LEFT JOIN sync_log sl ON sl.facility_id = ss.facility_id
  LEFT JOIN sync_conflicts sc ON sc.facility_id = ss.facility_id
  WHERE ss.facility_id = facility_uuid
  GROUP BY ss.facility_id, ss.last_sync_at, ss.status;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- SAMPLE DATA (for testing)
-- ================================================================

-- Sample sync status entries
-- INSERT INTO sync_status (facility_id, organization_id, status, last_sync_at, network_status)
-- VALUES 
--   ('facility-a-uuid', 'org-uuid', 'healthy', NOW(), 'online'),
--   ('facility-b-uuid', 'org-uuid', 'healthy', NOW(), 'online'),
--   ('facility-c-uuid', 'org-uuid', 'offline', NOW() - INTERVAL '3 days', 'offline');

-- ================================================================
-- GRANTS
-- ================================================================

-- Grant permissions to service users
-- GRANT SELECT, INSERT, UPDATE, DELETE ON sync_log TO nilecare_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON sync_conflicts TO nilecare_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON sync_status TO nilecare_user;
-- GRANT EXECUTE ON FUNCTION update_sync_status() TO nilecare_user;
-- GRANT EXECUTE ON FUNCTION cleanup_old_sync_logs(INTEGER) TO nilecare_user;
-- GRANT EXECUTE ON FUNCTION get_facility_sync_stats(UUID) TO nilecare_user;

-- ================================================================
-- COMMENTS
-- ================================================================

COMMENT ON TABLE sync_log IS 'Tracks all changes for offline/online synchronization';
COMMENT ON TABLE sync_conflicts IS 'Stores synchronization conflicts for resolution';
COMMENT ON TABLE sync_status IS 'Overall sync health status for each facility';
COMMENT ON FUNCTION update_sync_status() IS 'Automatically updates sync_status table when sync_log changes';
COMMENT ON FUNCTION cleanup_old_sync_logs(INTEGER) IS 'Removes synced logs older than retention period';
COMMENT ON FUNCTION get_facility_sync_stats(UUID) IS 'Gets comprehensive sync statistics for a facility';

-- ================================================================
-- VERIFICATION
-- ================================================================

-- Verify tables were created
SELECT 
  tablename, 
  schemaname 
FROM pg_tables 
WHERE tablename IN ('sync_log', 'sync_conflicts', 'sync_status')
ORDER BY tablename;

-- Verify indexes were created
SELECT 
  indexname, 
  tablename 
FROM pg_indexes 
WHERE tablename IN ('sync_log', 'sync_conflicts', 'sync_status')
ORDER BY tablename, indexname;

-- ================================================================
-- SUCCESS MESSAGE
-- ================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Sync tables initialized successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'Created tables:';
  RAISE NOTICE '  - sync_log (change tracking)';
  RAISE NOTICE '  - sync_conflicts (conflict resolution)';
  RAISE NOTICE '  - sync_status (facility health monitoring)';
  RAISE NOTICE '';
  RAISE NOTICE 'Created functions:';
  RAISE NOTICE '  - update_sync_status() (auto-update trigger)';
  RAISE NOTICE '  - cleanup_old_sync_logs() (maintenance)';
  RAISE NOTICE '  - get_facility_sync_stats() (statistics)';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Configure facility IDs in service .env files';
  RAISE NOTICE '  2. Enable ENABLE_OFFLINE_SYNC=true';
  RAISE NOTICE '  3. Start services with sync enabled';
  RAISE NOTICE '  4. Monitor sync status via API endpoints';
END $$;

