/**
 * Device Repository
 * Handles all database operations for devices
 */

import { Pool, QueryResult } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import {
  IDevice,
  DeviceRegistrationDTO,
  DeviceUpdateDTO,
  DeviceStatusUpdateDTO,
  DeviceQueryParams,
} from '../models/Device';
import { DatabaseError, NotFoundError } from '../utils/errors';
import logger from '../utils/logger';

export class DeviceRepository {
  constructor(private pool: Pool) {}

  async create(deviceData: DeviceRegistrationDTO): Promise<IDevice> {
    const deviceId = uuidv4();
    const query = `
      INSERT INTO devices (
        device_id, device_name, device_type, manufacturer, model_number,
        serial_number, protocol, firmware_version, connection_params,
        status, facility_id, linked_patient_id, location, alert_thresholds,
        metadata, created_by, tenant_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *
    `;

    try {
      const result: QueryResult = await this.pool.query(query, [
        deviceId,
        deviceData.deviceName,
        deviceData.deviceType,
        deviceData.manufacturer,
        deviceData.modelNumber,
        deviceData.serialNumber,
        deviceData.protocol,
        deviceData.firmwareVersion,
        JSON.stringify(deviceData.connectionParams),
        'inactive', // Initial status
        deviceData.facilityId,
        deviceData.linkedPatientId,
        deviceData.location,
        deviceData.alertThresholds ? JSON.stringify(deviceData.alertThresholds) : null,
        deviceData.metadata ? JSON.stringify(deviceData.metadata) : null,
        deviceData.createdBy,
        deviceData.tenantId,
      ]);

      logger.info(`Device created: ${deviceId}`, { deviceName: deviceData.deviceName });
      return this.mapRowToDevice(result.rows[0]);
    } catch (error: any) {
      logger.error('Error creating device:', error);
      throw new DatabaseError('Failed to create device', error);
    }
  }

  async findById(deviceId: string, tenantId: string): Promise<IDevice | null> {
    const query = `
      SELECT * FROM devices
      WHERE device_id = $1 AND tenant_id = $2
    `;

    try {
      const result: QueryResult = await this.pool.query(query, [deviceId, tenantId]);
      return result.rows.length > 0 ? this.mapRowToDevice(result.rows[0]) : null;
    } catch (error: any) {
      logger.error('Error finding device by ID:', error);
      throw new DatabaseError('Failed to find device', error);
    }
  }

  async findBySerialNumber(serialNumber: string, tenantId: string): Promise<IDevice | null> {
    const query = `
      SELECT * FROM devices
      WHERE serial_number = $1 AND tenant_id = $2
    `;

    try {
      const result: QueryResult = await this.pool.query(query, [serialNumber, tenantId]);
      return result.rows.length > 0 ? this.mapRowToDevice(result.rows[0]) : null;
    } catch (error: any) {
      logger.error('Error finding device by serial number:', error);
      throw new DatabaseError('Failed to find device', error);
    }
  }

  async findAll(params: DeviceQueryParams): Promise<{ devices: IDevice[]; total: number }> {
    let query = `
      SELECT * FROM devices
      WHERE tenant_id = $1
    `;
    const queryParams: any[] = [params.tenantId];
    let paramCount = 1;

    // Add filters
    if (params.facilityId) {
      paramCount++;
      query += ` AND facility_id = $${paramCount}`;
      queryParams.push(params.facilityId);
    }

    if (params.deviceType) {
      paramCount++;
      query += ` AND device_type = $${paramCount}`;
      queryParams.push(params.deviceType);
    }

    if (params.status) {
      paramCount++;
      query += ` AND status = $${paramCount}`;
      queryParams.push(params.status);
    }

    if (params.linkedPatientId) {
      paramCount++;
      query += ` AND linked_patient_id = $${paramCount}`;
      queryParams.push(params.linkedPatientId);
    }

    if (params.protocol) {
      paramCount++;
      query += ` AND protocol = $${paramCount}`;
      queryParams.push(params.protocol);
    }

    if (params.calibrationStatus) {
      paramCount++;
      query += ` AND calibration_status = $${paramCount}`;
      queryParams.push(params.calibrationStatus);
    }

    // Count total
    const countQuery = `SELECT COUNT(*) as total FROM (${query}) as count_query`;
    const countResult = await this.pool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total, 10);

    // Add sorting
    const sortBy = params.sortBy || 'created_at';
    const sortOrder = params.sortOrder || 'DESC';
    query += ` ORDER BY ${sortBy} ${sortOrder}`;

    // Add pagination
    const page = params.page || 1;
    const limit = params.limit || 50;
    const offset = (page - 1) * limit;

    query += ` LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    queryParams.push(limit, offset);

    try {
      const result: QueryResult = await this.pool.query(query, queryParams);
      const devices = result.rows.map((row) => this.mapRowToDevice(row));
      return { devices, total };
    } catch (error: any) {
      logger.error('Error finding devices:', error);
      throw new DatabaseError('Failed to find devices', error);
    }
  }

  async update(deviceId: string, updateData: DeviceUpdateDTO, tenantId: string): Promise<IDevice> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 0;

    // Build dynamic update query
    Object.entries(updateData).forEach(([key, value]) => {
      if (value !== undefined && key !== 'updatedBy') {
        paramCount++;
        const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        
        if (['connection_params', 'alert_thresholds', 'metadata'].includes(snakeKey)) {
          fields.push(`${snakeKey} = $${paramCount}`);
          values.push(JSON.stringify(value));
        } else {
          fields.push(`${snakeKey} = $${paramCount}`);
          values.push(value);
        }
      }
    });

    if (fields.length === 0) {
      throw new DatabaseError('No fields to update');
    }

    paramCount++;
    fields.push(`updated_by = $${paramCount}`);
    values.push(updateData.updatedBy);

    paramCount++;
    fields.push(`updated_at = CURRENT_TIMESTAMP`);

    values.push(deviceId, tenantId);

    const query = `
      UPDATE devices
      SET ${fields.join(', ')}
      WHERE device_id = $${paramCount + 1} AND tenant_id = $${paramCount + 2}
      RETURNING *
    `;

    try {
      const result: QueryResult = await this.pool.query(query, values);
      if (result.rows.length === 0) {
        throw new NotFoundError('Device', deviceId);
      }
      logger.info(`Device updated: ${deviceId}`);
      return this.mapRowToDevice(result.rows[0]);
    } catch (error: any) {
      if (error instanceof NotFoundError) throw error;
      logger.error('Error updating device:', error);
      throw new DatabaseError('Failed to update device', error);
    }
  }

  async updateStatus(
    deviceId: string,
    statusData: DeviceStatusUpdateDTO,
    tenantId: string
  ): Promise<IDevice> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Get current status
      const currentResult = await client.query(
        'SELECT status FROM devices WHERE device_id = $1 AND tenant_id = $2',
        [deviceId, tenantId]
      );

      if (currentResult.rows.length === 0) {
        throw new NotFoundError('Device', deviceId);
      }

      const previousStatus = currentResult.rows[0].status;

      // Update device status
      const updateQuery = `
        UPDATE devices
        SET status = $1, updated_by = $2, updated_at = CURRENT_TIMESTAMP
        WHERE device_id = $3 AND tenant_id = $4
        RETURNING *
      `;

      const updateResult = await client.query(updateQuery, [
        statusData.status,
        statusData.updatedBy,
        deviceId,
        tenantId,
      ]);

      // Record status history
      const historyQuery = `
        INSERT INTO device_status_history (
          device_id, previous_status, new_status, change_reason,
          error_message, error_code, changed_by, tenant_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `;

      await client.query(historyQuery, [
        deviceId,
        previousStatus,
        statusData.status,
        statusData.changeReason,
        statusData.errorMessage,
        statusData.errorCode,
        statusData.updatedBy,
        tenantId,
      ]);

      await client.query('COMMIT');

      logger.info(`Device status updated: ${deviceId} -> ${statusData.status}`);
      return this.mapRowToDevice(updateResult.rows[0]);
    } catch (error: any) {
      await client.query('ROLLBACK');
      if (error instanceof NotFoundError) throw error;
      logger.error('Error updating device status:', error);
      throw new DatabaseError('Failed to update device status', error);
    } finally {
      client.release();
    }
  }

  async updateLastSeen(deviceId: string, tenantId: string): Promise<void> {
    const query = `
      UPDATE devices
      SET last_seen = CURRENT_TIMESTAMP, last_heartbeat = CURRENT_TIMESTAMP
      WHERE device_id = $1 AND tenant_id = $2
    `;

    try {
      await this.pool.query(query, [deviceId, tenantId]);
    } catch (error: any) {
      logger.error('Error updating last seen:', error);
      // Don't throw, this is a non-critical operation
    }
  }

  async delete(deviceId: string, tenantId: string): Promise<void> {
    const query = `
      DELETE FROM devices
      WHERE device_id = $1 AND tenant_id = $2
    `;

    try {
      const result: QueryResult = await this.pool.query(query, [deviceId, tenantId]);
      if (result.rowCount === 0) {
        throw new NotFoundError('Device', deviceId);
      }
      logger.info(`Device deleted: ${deviceId}`);
    } catch (error: any) {
      if (error instanceof NotFoundError) throw error;
      logger.error('Error deleting device:', error);
      throw new DatabaseError('Failed to delete device', error);
    }
  }

  async getDevicesByFacility(facilityId: string, tenantId: string): Promise<IDevice[]> {
    const query = `
      SELECT * FROM devices
      WHERE facility_id = $1 AND tenant_id = $2
      ORDER BY device_name ASC
    `;

    try {
      const result: QueryResult = await this.pool.query(query, [facilityId, tenantId]);
      return result.rows.map((row) => this.mapRowToDevice(row));
    } catch (error: any) {
      logger.error('Error getting devices by facility:', error);
      throw new DatabaseError('Failed to get devices by facility', error);
    }
  }

  async getOnlineDevices(tenantId: string): Promise<IDevice[]> {
    const query = `
      SELECT * FROM devices
      WHERE tenant_id = $1
        AND last_seen > NOW() - INTERVAL '5 minutes'
        AND status = 'active'
      ORDER BY last_seen DESC
    `;

    try {
      const result: QueryResult = await this.pool.query(query, [tenantId]);
      return result.rows.map((row) => this.mapRowToDevice(row));
    } catch (error: any) {
      logger.error('Error getting online devices:', error);
      throw new DatabaseError('Failed to get online devices', error);
    }
  }

  private mapRowToDevice(row: any): IDevice {
    return {
      deviceId: row.device_id,
      deviceName: row.device_name,
      deviceType: row.device_type,
      manufacturer: row.manufacturer,
      modelNumber: row.model_number,
      serialNumber: row.serial_number,
      protocol: row.protocol,
      firmwareVersion: row.firmware_version,
      connectionParams: row.connection_params,
      status: row.status,
      facilityId: row.facility_id,
      linkedPatientId: row.linked_patient_id,
      location: row.location,
      lastSyncTime: row.last_sync_time,
      lastSeen: row.last_seen,
      lastHeartbeat: row.last_heartbeat,
      batteryLevel: row.battery_level,
      signalStrength: row.signal_strength,
      calibrationDate: row.calibration_date,
      nextCalibrationDue: row.next_calibration_due,
      calibrationStatus: row.calibration_status,
      alertThresholds: row.alert_thresholds,
      metadata: row.metadata,
      payload: row.payload,
      createdBy: row.created_by,
      updatedBy: row.updated_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      tenantId: row.tenant_id,
    };
  }
}

export default DeviceRepository;

