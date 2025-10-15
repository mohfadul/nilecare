"use strict";
/**
 * Alert Repository
 * Handles device alerts and notifications
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlertRepository = void 0;
const uuid_1 = require("uuid");
const errors_1 = require("../utils/errors");
const logger_1 = __importDefault(require("../utils/logger"));
class AlertRepository {
    constructor(pool) {
        this.pool = pool;
    }
    async create(alertData) {
        const alertId = (0, uuid_1.v4)();
        const query = `
      INSERT INTO device_alerts (
        alert_id, device_id, patient_id, alert_type, severity,
        parameter, value, threshold, message, timestamp, tenant_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, $10)
      RETURNING *
    `;
        try {
            const result = await this.pool.query(query, [
                alertId,
                alertData.deviceId,
                alertData.patientId,
                alertData.alertType,
                alertData.severity,
                alertData.parameter,
                alertData.value,
                alertData.threshold,
                alertData.message,
                alertData.tenantId,
            ]);
            logger_1.default.info(`Alert created: ${alertId}`, {
                severity: alertData.severity,
                type: alertData.alertType,
            });
            return this.mapRowToAlert(result.rows[0]);
        }
        catch (error) {
            logger_1.default.error('Error creating alert:', error);
            throw new errors_1.DatabaseError('Failed to create alert', error);
        }
    }
    async findById(alertId, tenantId) {
        const query = `
      SELECT * FROM device_alerts
      WHERE alert_id = $1 AND tenant_id = $2
    `;
        try {
            const result = await this.pool.query(query, [alertId, tenantId]);
            return result.rows.length > 0 ? this.mapRowToAlert(result.rows[0]) : null;
        }
        catch (error) {
            logger_1.default.error('Error finding alert by ID:', error);
            throw new errors_1.DatabaseError('Failed to find alert', error);
        }
    }
    async findAll(params) {
        let query = `
      SELECT * FROM device_alerts
      WHERE tenant_id = $1
    `;
        const queryParams = [params.tenantId];
        let paramCount = 1;
        // Add filters
        if (params.deviceId) {
            paramCount++;
            query += ` AND device_id = $${paramCount}`;
            queryParams.push(params.deviceId);
        }
        if (params.patientId) {
            paramCount++;
            query += ` AND patient_id = $${paramCount}`;
            queryParams.push(params.patientId);
        }
        if (params.alertType) {
            paramCount++;
            query += ` AND alert_type = $${paramCount}`;
            queryParams.push(params.alertType);
        }
        if (params.severity) {
            paramCount++;
            query += ` AND severity = $${paramCount}`;
            queryParams.push(params.severity);
        }
        if (params.acknowledged !== undefined) {
            paramCount++;
            query += ` AND acknowledged = $${paramCount}`;
            queryParams.push(params.acknowledged);
        }
        if (params.resolved !== undefined) {
            paramCount++;
            query += ` AND resolved = $${paramCount}`;
            queryParams.push(params.resolved);
        }
        if (params.startTime) {
            paramCount++;
            query += ` AND timestamp >= $${paramCount}`;
            queryParams.push(params.startTime);
        }
        if (params.endTime) {
            paramCount++;
            query += ` AND timestamp <= $${paramCount}`;
            queryParams.push(params.endTime);
        }
        // Count total
        const countQuery = `SELECT COUNT(*) as total FROM (${query}) as count_query`;
        const countResult = await this.pool.query(countQuery, queryParams);
        const total = parseInt(countResult.rows[0].total, 10);
        // Add sorting and pagination
        query += ` ORDER BY timestamp DESC`;
        const page = params.page || 1;
        const limit = params.limit || 50;
        const offset = (page - 1) * limit;
        query += ` LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
        queryParams.push(limit, offset);
        try {
            const result = await this.pool.query(query, queryParams);
            const alerts = result.rows.map((row) => this.mapRowToAlert(row));
            return { alerts, total };
        }
        catch (error) {
            logger_1.default.error('Error finding alerts:', error);
            throw new errors_1.DatabaseError('Failed to find alerts', error);
        }
    }
    async acknowledge(acknowledgeData, tenantId) {
        const query = `
      UPDATE device_alerts
      SET acknowledged = TRUE,
          acknowledged_by = $1,
          acknowledged_at = CURRENT_TIMESTAMP
      WHERE alert_id = $2 AND tenant_id = $3
      RETURNING *
    `;
        try {
            const result = await this.pool.query(query, [
                acknowledgeData.acknowledgedBy,
                acknowledgeData.alertId,
                tenantId,
            ]);
            if (result.rows.length === 0) {
                throw new errors_1.NotFoundError('Alert', acknowledgeData.alertId);
            }
            logger_1.default.info(`Alert acknowledged: ${acknowledgeData.alertId}`);
            return this.mapRowToAlert(result.rows[0]);
        }
        catch (error) {
            if (error instanceof errors_1.NotFoundError)
                throw error;
            logger_1.default.error('Error acknowledging alert:', error);
            throw new errors_1.DatabaseError('Failed to acknowledge alert', error);
        }
    }
    async resolve(resolveData, tenantId) {
        const query = `
      UPDATE device_alerts
      SET resolved = TRUE,
          resolved_by = $1,
          resolved_at = CURRENT_TIMESTAMP,
          resolution_notes = $2,
          acknowledged = TRUE,
          acknowledged_by = COALESCE(acknowledged_by, $1),
          acknowledged_at = COALESCE(acknowledged_at, CURRENT_TIMESTAMP)
      WHERE alert_id = $3 AND tenant_id = $4
      RETURNING *
    `;
        try {
            const result = await this.pool.query(query, [
                resolveData.resolvedBy,
                resolveData.resolutionNotes,
                resolveData.alertId,
                tenantId,
            ]);
            if (result.rows.length === 0) {
                throw new errors_1.NotFoundError('Alert', resolveData.alertId);
            }
            logger_1.default.info(`Alert resolved: ${resolveData.alertId}`);
            return this.mapRowToAlert(result.rows[0]);
        }
        catch (error) {
            if (error instanceof errors_1.NotFoundError)
                throw error;
            logger_1.default.error('Error resolving alert:', error);
            throw new errors_1.DatabaseError('Failed to resolve alert', error);
        }
    }
    async markNotificationSent(alertId, channels, tenantId) {
        const query = `
      UPDATE device_alerts
      SET notification_sent = TRUE,
          notification_channels = $1
      WHERE alert_id = $2 AND tenant_id = $3
    `;
        try {
            await this.pool.query(query, [JSON.stringify(channels), alertId, tenantId]);
        }
        catch (error) {
            logger_1.default.error('Error marking notification sent:', error);
            // Don't throw, this is a non-critical operation
        }
    }
    async getCriticalAlertsCount(deviceId, tenantId) {
        const query = `
      SELECT COUNT(*) as count
      FROM device_alerts
      WHERE device_id = $1 
        AND tenant_id = $2
        AND severity = 'critical'
        AND acknowledged = FALSE
        AND timestamp >= NOW() - INTERVAL '24 hours'
    `;
        try {
            const result = await this.pool.query(query, [deviceId, tenantId]);
            return parseInt(result.rows[0].count, 10);
        }
        catch (error) {
            logger_1.default.error('Error getting critical alerts count:', error);
            return 0;
        }
    }
    async getUnacknowledgedAlerts(tenantId) {
        const query = `
      SELECT * FROM device_alerts
      WHERE tenant_id = $1
        AND acknowledged = FALSE
        AND severity IN ('high', 'critical')
      ORDER BY severity DESC, timestamp DESC
      LIMIT 100
    `;
        try {
            const result = await this.pool.query(query, [tenantId]);
            return result.rows.map((row) => this.mapRowToAlert(row));
        }
        catch (error) {
            logger_1.default.error('Error getting unacknowledged alerts:', error);
            throw new errors_1.DatabaseError('Failed to get unacknowledged alerts', error);
        }
    }
    mapRowToAlert(row) {
        return {
            alertId: row.alert_id,
            deviceId: row.device_id,
            patientId: row.patient_id,
            alertType: row.alert_type,
            severity: row.severity,
            parameter: row.parameter,
            value: row.value,
            threshold: row.threshold,
            message: row.message,
            acknowledged: row.acknowledged,
            acknowledgedBy: row.acknowledged_by,
            acknowledgedAt: row.acknowledged_at,
            resolved: row.resolved,
            resolvedBy: row.resolved_by,
            resolvedAt: row.resolved_at,
            resolutionNotes: row.resolution_notes,
            notificationSent: row.notification_sent,
            notificationChannels: row.notification_channels,
            timestamp: row.timestamp,
            createdAt: row.created_at,
            tenantId: row.tenant_id,
        };
    }
}
exports.AlertRepository = AlertRepository;
exports.default = AlertRepository;
//# sourceMappingURL=AlertRepository.js.map