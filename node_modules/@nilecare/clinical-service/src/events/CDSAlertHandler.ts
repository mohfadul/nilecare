/**
 * CDS Alert Handler - Clinical Service
 * 
 * Connects to CDS Service via WebSocket to receive real-time clinical alerts
 * Forwards critical alerts to Clinical Service clients
 * 
 * Reference: CDS Integration Guide
 * @see microservices/clinical/CDS_INTEGRATION_GUIDE.md
 */

import { Server } from 'socket.io';
import io from 'socket.io-client';
import { logger } from '../utils/logger';

export interface ClinicalAlert {
  type: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  details: {
    patientId: string;
    organizationId?: string;
    facilityId?: string;
    [key: string]: any;
  };
  timestamp: string;
}

export class CDSAlertHandler {
  private cdsSocket: any;
  private clinicalIO: Server;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;

  constructor(clinicalIO: Server) {
    this.clinicalIO = clinicalIO;
    this.connectToCDS();
  }

  /**
   * Connect to CDS Service WebSocket
   */
  private connectToCDS() {
    const cdsUrl = process.env.CDS_SERVICE_URL || 'http://localhost:4002';
    const serviceAuthToken = process.env.SERVICE_AUTH_TOKEN || process.env.AUTH_SERVICE_API_KEY;

    logger.info(`🔌 Attempting to connect to CDS Service at ${cdsUrl}...`);
    
    this.cdsSocket = io(cdsUrl, {
      auth: {
        // Use service-to-service authentication token
        token: serviceAuthToken
      },
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 5000
    });

    // Connection events
    this.cdsSocket.on('connect', () => {
      logger.info('✅ Connected to CDS Service for real-time alerts');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      // Join clinical staff room to receive all alerts
      this.cdsSocket.emit('join-clinical-team', 'all-staff');
      logger.info('📢 Joined CDS clinical team room for alerts');
    });

    this.cdsSocket.on('reconnect', (attemptNumber: number) => {
      logger.info(`✅ Reconnected to CDS Service (attempt ${attemptNumber})`);
      this.reconnectAttempts = 0;
      // Rejoin rooms after reconnection
      this.cdsSocket.emit('join-clinical-team', 'all-staff');
    });

    this.cdsSocket.on('reconnect_attempt', (attemptNumber: number) => {
      this.reconnectAttempts = attemptNumber;
      logger.warn(`🔄 Reconnecting to CDS Service (attempt ${attemptNumber}/${this.maxReconnectAttempts})...`);
    });

    this.cdsSocket.on('reconnect_error', (error: any) => {
      logger.error('❌ CDS Service reconnection error:', error.message);
    });

    this.cdsSocket.on('reconnect_failed', () => {
      logger.error('❌ Failed to reconnect to CDS Service after maximum attempts');
      this.isConnected = false;
    });

    // ================================================================
    // CRITICAL ALERT HANDLERS
    // ================================================================

    /**
     * Handle clinical alerts from CDS Service
     * These are triggered when high-risk medication combinations are detected
     */
    this.cdsSocket.on('clinical-alert', (alert: ClinicalAlert) => {
      logger.warn('⚠️  CRITICAL ALERT received from CDS:', {
        type: alert.type,
        severity: alert.severity,
        patientId: alert.details.patientId
      });
      
      // Broadcast to Clinical Service clients
      
      // 1. Broadcast to patient-specific room
      this.clinicalIO.to(`patient-${alert.details.patientId}`).emit('medication-safety-alert', {
        type: 'medication-safety',
        source: 'cds-service',
        severity: alert.severity,
        message: alert.message,
        details: alert.details,
        timestamp: alert.timestamp,
        requiresAcknowledgment: alert.severity === 'critical'
      });

      // 2. Broadcast to organization room (all staff in organization)
      if (alert.details.organizationId) {
        this.clinicalIO.to(`organization-${alert.details.organizationId}`).emit('clinical-alert', alert);
      }

      // 3. Broadcast to facility room
      if (alert.details.facilityId) {
        this.clinicalIO.to(`facility-${alert.details.facilityId}`).emit('clinical-alert', alert);
      }

      // 4. If critical, broadcast to all medical staff
      if (alert.severity === 'critical') {
        this.clinicalIO.to('medical-staff').emit('critical-alert', {
          ...alert,
          priority: 'immediate',
          requiresAcknowledgment: true
        });
      }

      logger.info(`📢 Forwarded ${alert.severity} alert to Clinical Service clients`);
    });

    /**
     * Handle alert acknowledgment events
     */
    this.cdsSocket.on('alert:acknowledged', (data: any) => {
      logger.info(`✅ Alert ${data.alertId} acknowledged`);
      // Forward to clinical clients
      this.clinicalIO.to(`patient-${data.patientId}`).emit('alert:acknowledged', data);
    });

    /**
     * Handle alert resolution events
     */
    this.cdsSocket.on('alert:resolved', (data: any) => {
      logger.info(`✅ Alert ${data.alertId} resolved`);
      // Forward to clinical clients
      this.clinicalIO.to(`patient-${data.patientId}`).emit('alert:resolved', data);
    });

    // ================================================================
    // CONNECTION ERROR HANDLERS
    // ================================================================

    this.cdsSocket.on('disconnect', (reason: string) => {
      logger.warn(`⚠️  Disconnected from CDS Service: ${reason}`);
      this.isConnected = false;
      
      if (reason === 'io server disconnect') {
        // Server disconnected us, reconnect manually
        logger.info('🔄 Manually reconnecting to CDS Service...');
        this.cdsSocket.connect();
      }
    });

    this.cdsSocket.on('connect_error', (error: any) => {
      logger.error('❌ CDS WebSocket connection error:', error.message);
      this.isConnected = false;
      
      // If CDS service is completely down, continue without it
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        logger.error('⚠️  CDS Service appears to be offline');
        logger.error('⚠️  Clinical Service will continue without real-time alerts');
        logger.error('⚠️  Safety checks will still run via HTTP if CDS is reachable');
      }
    });

    this.cdsSocket.on('error', (error: any) => {
      logger.error('❌ CDS Socket error:', error);
    });
  }

  /**
   * Manually join a patient alert room
   * Called when a healthcare provider opens a patient's chart
   */
  public joinPatientAlerts(patientId: string): void {
    if (this.isConnected && this.cdsSocket) {
      this.cdsSocket.emit('join-patient-alerts', patientId);
      logger.info(`📢 Joined CDS alerts for patient ${patientId}`);
    } else {
      logger.warn(`⚠️  Cannot join patient alerts - not connected to CDS Service`);
    }
  }

  /**
   * Join facility alerts
   */
  public joinFacilityAlerts(facilityId: string): void {
    if (this.isConnected && this.cdsSocket) {
      this.cdsSocket.emit('join-facility-alerts', facilityId);
      logger.info(`📢 Joined CDS alerts for facility ${facilityId}`);
    }
  }

  /**
   * Join organization alerts
   */
  public joinOrganizationAlerts(organizationId: string): void {
    if (this.isConnected && this.cdsSocket) {
      this.cdsSocket.emit('join-organization-alerts', organizationId);
      logger.info(`📢 Joined CDS alerts for organization ${organizationId}`);
    }
  }

  /**
   * Check connection status
   */
  public isHealthy(): boolean {
    return this.isConnected;
  }

  /**
   * Get connection status
   */
  public getStatus(): {
    connected: boolean;
    reconnectAttempts: number;
    cdsServiceUrl: string;
  } {
    return {
      connected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      cdsServiceUrl: process.env.CDS_SERVICE_URL || 'http://localhost:4002'
    };
  }

  /**
   * Disconnect from CDS Service
   */
  public disconnect(): void {
    if (this.cdsSocket) {
      logger.info('🔌 Disconnecting from CDS Service...');
      this.cdsSocket.disconnect();
      this.isConnected = false;
      logger.info('✅ Disconnected from CDS Service');
    }
  }

  /**
   * Manually reconnect
   */
  public reconnect(): void {
    if (this.cdsSocket) {
      logger.info('🔄 Manually reconnecting to CDS Service...');
      this.cdsSocket.connect();
    } else {
      logger.warn('⚠️  CDS Socket not initialized');
      this.connectToCDS();
    }
  }
}

export default CDSAlertHandler;

