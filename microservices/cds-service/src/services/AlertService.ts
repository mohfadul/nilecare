/**
 * Alert Service
 * 
 * Manages clinical alerts and notifications
 * Tracks alert lifecycle and acknowledgments
 * 
 * Integrates with WebSocket for real-time broadcasting
 */

import { v4 as uuidv4 } from 'uuid';
import { Server } from 'socket.io';
import { db } from '../utils/database';
import { logger, logHighRiskAlert } from '../utils/logger';
import { Alert, AlertSummary, AlertModel } from '../models/Alert';

export class AlertService {
  private io?: Server;

  /**
   * Set Socket.IO instance for real-time alerts
   */
  setSocketServer(io: Server): void {
    this.io = io;
    logger.info('✅ AlertService: Socket.IO instance configured');
  }

  /**
   * Create a new clinical alert
   * 
   * @param alertData - Alert information
   * @returns Created alert
   */
  async createAlert(alertData: {
    patientId: string;
    facilityId?: string;
    organizationId?: string;
    alertType: Alert['alertType'];
    severity: Alert['severity'];
    priority: Alert['priority'];
    message: string;
    clinicalContext: Alert['clinicalContext'];
    riskScore: number;
    riskLevel: Alert['riskLevel'];
    recommendations: string[];
    alternatives?: string[];
    triggeredBy: string;
    source?: Alert['source'];
    confidence?: number;
  }): Promise<Alert> {
    try {
      const alertId = uuidv4();
      const now = new Date();

      const title = AlertModel.generateTitle(alertData.alertType, alertData.clinicalContext);
      const expiresAt = AlertModel.calculateExpiry(alertData.alertType);

      const query = `
        INSERT INTO alerts (
          id, patient_id, facility_id, organization_id, alert_type, severity, priority,
          title, message, clinical_context, risk_score, risk_level,
          recommendations, alternatives, status, triggered_by, source, confidence,
          created_at, updated_at, expires_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
        )
        RETURNING *
      `;

      const values = [
        alertId,
        alertData.patientId,
        alertData.facilityId || null,
        alertData.organizationId || null,
        alertData.alertType,
        alertData.severity,
        alertData.priority,
        title,
        alertData.message,
        JSON.stringify(alertData.clinicalContext),
        alertData.riskScore,
        alertData.riskLevel,
        alertData.recommendations,
        alertData.alternatives || null,
        'active',
        alertData.triggeredBy,
        alertData.source || 'automated',
        alertData.confidence || 100,
        now,
        now,
        expiresAt
      ];

      const result = await db.query(query, values);
      const alert = AlertModel.fromDatabaseRow(result.rows[0]);

      // Log high-risk alerts
      if (alertData.severity === 'critical' || alertData.riskLevel === 'high') {
        logHighRiskAlert({
          alertType: alertData.alertType,
          patientId: alertData.patientId,
          severity: alertData.severity,
          details: alertData.clinicalContext
        });
      }

      // Broadcast real-time alert if critical
      if (this.io && AlertModel.requiresImmediateAction(alert)) {
        this.broadcastAlert(alert);
      }

      logger.info(`Created ${alertData.severity} alert: ${title}`);

      return alert;
    } catch (error: any) {
      if (error.code === '42P01') {
        logger.warn('Alerts table not found - skipping alert creation');
        // Return mock alert in development
        return {
          id: uuidv4(),
          ...alertData,
          title: AlertModel.generateTitle(alertData.alertType, alertData.clinicalContext),
          status: 'active',
          source: alertData.source || 'automated',
          confidence: alertData.confidence || 100,
          createdAt: new Date(),
          updatedAt: new Date()
        } as Alert;
      }
      logger.error('Error creating alert:', error);
      throw error;
    }
  }

  /**
   * Get alerts for a patient
   */
  async getAlerts(
    patientId: string,
    options?: {
      status?: Alert['status'];
      severity?: Alert['severity'];
      activeOnly?: boolean;
    }
  ): Promise<Alert[]> {
    try {
      let query = `
        SELECT * FROM alerts
        WHERE patient_id = $1
      `;
      const params: any[] = [patientId];
      let paramIndex = 2;

      if (options?.status) {
        query += ` AND status = $${paramIndex}`;
        params.push(options.status);
        paramIndex++;
      }

      if (options?.severity) {
        query += ` AND severity = $${paramIndex}`;
        params.push(options.severity);
        paramIndex++;
      }

      if (options?.activeOnly) {
        query += ` AND status = 'active'`;
        query += ` AND (expires_at IS NULL OR expires_at > NOW())`;
      }

      query += ` ORDER BY created_at DESC LIMIT 100`;

      const result = await db.query(query, params);

      return result.rows.map(row => AlertModel.fromDatabaseRow(row));
    } catch (error: any) {
      if (error.code === '42P01') {
        return [];
      }
      throw error;
    }
  }

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(
    alertId: string,
    userId: string,
    note?: string
  ): Promise<Alert | null> {
    try {
      const query = `
        UPDATE alerts
        SET 
          status = 'acknowledged',
          acknowledged_by = $2,
          acknowledged_at = NOW(),
          acknowledgment_note = $3,
          updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `;

      const result = await db.query(query, [alertId, userId, note || null]);

      if (result.rows.length === 0) return null;

      logger.info(`Alert ${alertId} acknowledged by user ${userId}`);

      return AlertModel.fromDatabaseRow(result.rows[0]);
    } catch (error: any) {
      if (error.code === '42P01') {
        return null;
      }
      throw error;
    }
  }

  /**
   * Dismiss an alert
   */
  async dismissAlert(
    alertId: string,
    userId: string,
    reason: string
  ): Promise<Alert | null> {
    try {
      const query = `
        UPDATE alerts
        SET 
          status = 'dismissed',
          dismissed_by = $2,
          dismissed_at = NOW(),
          dismissal_reason = $3,
          updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `;

      const result = await db.query(query, [alertId, userId, reason]);

      if (result.rows.length === 0) return null;

      logger.info(`Alert ${alertId} dismissed by user ${userId}: ${reason}`);

      return AlertModel.fromDatabaseRow(result.rows[0]);
    } catch (error: any) {
      if (error.code === '42P01') {
        return null;
      }
      throw error;
    }
  }

  /**
   * Broadcast alert via WebSocket
   */
  broadcastAlert(alert: Alert): void {
    if (!this.io) {
      logger.warn('Socket.IO not configured - cannot broadcast alert');
      return;
    }

    try {
      // Broadcast to patient-specific room
      this.io.to(`patient-${alert.patientId}`).emit('clinical-alert', {
        type: alert.alertType,
        severity: alert.severity,
        message: alert.message,
        title: alert.title,
        recommendations: alert.recommendations,
        alertId: alert.id,
        timestamp: alert.createdAt.toISOString()
      });

      // Broadcast to facility if specified
      if (alert.facilityId) {
        this.io.to(`facility-${alert.facilityId}`).emit('clinical-alert', alert);
      }

      // Broadcast to organization
      if (alert.organizationId) {
        this.io.to(`organization-${alert.organizationId}`).emit('clinical-alert', alert);
      }

      // Broadcast to all clinical staff for critical alerts
      if (alert.severity === 'critical') {
        this.io.to('clinical-team-all').emit('critical-alert', alert);
      }

      logger.info(`Broadcasted ${alert.severity} alert to ${alert.patientId}`);
    } catch (error: any) {
      logger.error('Error broadcasting alert:', error);
    }
  }

  /**
   * Get alert summary for dashboard
   */
  async getAlertSummary(
    organizationId?: string,
    facilityId?: string
  ): Promise<AlertSummary> {
    try {
      let query = `
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
          COUNT(CASE WHEN severity = 'critical' THEN 1 END) as critical,
          alert_type,
          severity,
          COUNT(*) as count
        FROM alerts
        WHERE 1=1
      `;
      const params: any[] = [];
      let paramIndex = 1;

      if (organizationId) {
        query += ` AND organization_id = $${paramIndex}`;
        params.push(organizationId);
        paramIndex++;
      }

      if (facilityId) {
        query += ` AND facility_id = $${paramIndex}`;
        params.push(facilityId);
        paramIndex++;
      }

      query += ` GROUP BY alert_type, severity`;

      const result = await db.query(query, params);

      const summary: AlertSummary = {
        totalAlerts: 0,
        activeAlerts: 0,
        criticalAlerts: 0,
        byType: {
          'drug-interaction': 0,
          'allergy': 0,
          'contraindication': 0,
          'dose-error': 0,
          'guideline-deviation': 0
        },
        bySeverity: {
          'info': 0,
          'warning': 0,
          'critical': 0
        }
      };

      result.rows.forEach(row => {
        summary.totalAlerts += parseInt(row.count);
        if (row.total) summary.totalAlerts = parseInt(row.total);
        if (row.active) summary.activeAlerts = parseInt(row.active);
        if (row.critical) summary.criticalAlerts = parseInt(row.critical);
        
        if (row.alert_type) {
          summary.byType[row.alert_type as Alert['alertType']] = 
            (summary.byType[row.alert_type as Alert['alertType']] || 0) + parseInt(row.count);
        }
        
        if (row.severity) {
          summary.bySeverity[row.severity as Alert['severity']] = 
            (summary.bySeverity[row.severity as Alert['severity']] || 0) + parseInt(row.count);
        }
      });

      return summary;
    } catch (error: any) {
      if (error.code === '42P01') {
        return {
          totalAlerts: 0,
          activeAlerts: 0,
          criticalAlerts: 0,
          byType: {
            'drug-interaction': 0,
            'allergy': 0,
            'contraindication': 0,
            'dose-error': 0,
            'guideline-deviation': 0
          },
          bySeverity: { 'info': 0, 'warning': 0, 'critical': 0 }
        };
      }
      throw error;
    }
  }
}

export default AlertService;

