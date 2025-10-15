/**
 * Vital Signs Repository
 * Handles time-series vital signs data storage and retrieval
 */

import { Pool, QueryResult } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { IVitalSigns, VitalSignsDTO, VitalSignsQueryParams } from '../models/VitalSigns';
import { DatabaseError } from '../utils/errors';
import logger from '../utils/logger';

export class VitalSignsRepository {
  constructor(private pool: Pool) {}

  async create(vitalSignsData: VitalSignsDTO): Promise<IVitalSigns> {
    const observationId = uuidv4();
    const observationTime = vitalSignsData.observationTime || new Date();

    const query = `
      INSERT INTO vital_signs_timeseries (
        observation_id, device_id, patient_id, observation_time,
        temperature, heart_rate, respiratory_rate,
        blood_pressure_systolic, blood_pressure_diastolic,
        oxygen_saturation, pulse_rate,
        signal_quality, lead_off, artifacts, confidence,
        waveform_data, metadata, tenant_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *
    `;

    try {
      const result: QueryResult = await this.pool.query(query, [
        observationId,
        vitalSignsData.deviceId,
        vitalSignsData.patientId,
        observationTime,
        vitalSignsData.temperature,
        vitalSignsData.heartRate,
        vitalSignsData.respiratoryRate,
        vitalSignsData.bloodPressureSystolic,
        vitalSignsData.bloodPressureDiastolic,
        vitalSignsData.oxygenSaturation,
        vitalSignsData.pulseRate,
        vitalSignsData.quality?.signalQuality,
        vitalSignsData.quality?.leadOff || false,
        vitalSignsData.quality?.artifacts || false,
        vitalSignsData.quality?.confidence,
        vitalSignsData.waveforms ? JSON.stringify(vitalSignsData.waveforms) : null,
        vitalSignsData.metadata ? JSON.stringify(vitalSignsData.metadata) : null,
        vitalSignsData.tenantId,
      ]);

      return this.mapRowToVitalSigns(result.rows[0]);
    } catch (error: any) {
      logger.error('Error creating vital signs:', error);
      throw new DatabaseError('Failed to create vital signs', error);
    }
  }

  async findByDevice(
    deviceId: string,
    params: VitalSignsQueryParams
  ): Promise<{ data: IVitalSigns[]; total: number }> {
    let query = `
      SELECT * FROM vital_signs_timeseries
      WHERE device_id = $1 AND tenant_id = $2
    `;
    const queryParams: any[] = [deviceId, params.tenantId];
    let paramCount = 2;

    if (params.startTime) {
      paramCount++;
      query += ` AND observation_time >= $${paramCount}`;
      queryParams.push(params.startTime);
    }

    if (params.endTime) {
      paramCount++;
      query += ` AND observation_time <= $${paramCount}`;
      queryParams.push(params.endTime);
    }

    // Count total
    const countQuery = `SELECT COUNT(*) as total FROM (${query}) as count_query`;
    const countResult = await this.pool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total, 10);

    // Add sorting and pagination
    query += ` ORDER BY observation_time DESC`;

    const page = params.page || 1;
    const limit = params.limit || 100;
    const offset = (page - 1) * limit;

    query += ` LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    queryParams.push(limit, offset);

    try {
      const result: QueryResult = await this.pool.query(query, queryParams);
      const data = result.rows.map((row) => this.mapRowToVitalSigns(row));
      return { data, total };
    } catch (error: any) {
      logger.error('Error finding vital signs by device:', error);
      throw new DatabaseError('Failed to find vital signs', error);
    }
  }

  async findByPatient(
    patientId: string,
    params: VitalSignsQueryParams
  ): Promise<{ data: IVitalSigns[]; total: number }> {
    let query = `
      SELECT * FROM vital_signs_timeseries
      WHERE patient_id = $1 AND tenant_id = $2
    `;
    const queryParams: any[] = [patientId, params.tenantId];
    let paramCount = 2;

    if (params.startTime) {
      paramCount++;
      query += ` AND observation_time >= $${paramCount}`;
      queryParams.push(params.startTime);
    }

    if (params.endTime) {
      paramCount++;
      query += ` AND observation_time <= $${paramCount}`;
      queryParams.push(params.endTime);
    }

    // Count total
    const countQuery = `SELECT COUNT(*) as total FROM (${query}) as count_query`;
    const countResult = await this.pool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total, 10);

    // Add sorting and pagination
    query += ` ORDER BY observation_time DESC`;

    const page = params.page || 1;
    const limit = params.limit || 100;
    const offset = (page - 1) * limit;

    query += ` LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    queryParams.push(limit, offset);

    try {
      const result: QueryResult = await this.pool.query(query, queryParams);
      const data = result.rows.map((row) => this.mapRowToVitalSigns(row));
      return { data, total };
    } catch (error: any) {
      logger.error('Error finding vital signs by patient:', error);
      throw new DatabaseError('Failed to find vital signs', error);
    }
  }

  async getLatest(deviceId: string, tenantId: string): Promise<IVitalSigns | null> {
    const query = `
      SELECT * FROM vital_signs_timeseries
      WHERE device_id = $1 AND tenant_id = $2
      ORDER BY observation_time DESC
      LIMIT 1
    `;

    try {
      const result: QueryResult = await this.pool.query(query, [deviceId, tenantId]);
      return result.rows.length > 0 ? this.mapRowToVitalSigns(result.rows[0]) : null;
    } catch (error: any) {
      logger.error('Error getting latest vital signs:', error);
      throw new DatabaseError('Failed to get latest vital signs', error);
    }
  }

  async getAverages(
    deviceId: string,
    startTime: Date,
    endTime: Date,
    tenantId: string
  ): Promise<any> {
    const query = `
      SELECT 
        AVG(temperature) as avg_temperature,
        AVG(heart_rate) as avg_heart_rate,
        AVG(respiratory_rate) as avg_respiratory_rate,
        AVG(blood_pressure_systolic) as avg_blood_pressure_systolic,
        AVG(blood_pressure_diastolic) as avg_blood_pressure_diastolic,
        AVG(oxygen_saturation) as avg_oxygen_saturation,
        AVG(pulse_rate) as avg_pulse_rate,
        COUNT(*) as total_readings
      FROM vital_signs_timeseries
      WHERE device_id = $1 
        AND tenant_id = $2
        AND observation_time BETWEEN $3 AND $4
    `;

    try {
      const result: QueryResult = await this.pool.query(query, [
        deviceId,
        tenantId,
        startTime,
        endTime,
      ]);
      return result.rows[0];
    } catch (error: any) {
      logger.error('Error calculating vital signs averages:', error);
      throw new DatabaseError('Failed to calculate averages', error);
    }
  }

  async getTrends(
    patientId: string,
    parameter: string,
    startTime: Date,
    endTime: Date,
    tenantId: string,
    interval: string = '1 hour'
  ): Promise<any[]> {
    const query = `
      SELECT 
        time_bucket($1, observation_time) AS time_bucket,
        AVG(${parameter}) as avg_value,
        MIN(${parameter}) as min_value,
        MAX(${parameter}) as max_value,
        COUNT(*) as reading_count
      FROM vital_signs_timeseries
      WHERE patient_id = $2
        AND tenant_id = $3
        AND observation_time BETWEEN $4 AND $5
        AND ${parameter} IS NOT NULL
      GROUP BY time_bucket
      ORDER BY time_bucket DESC
    `;

    try {
      const result: QueryResult = await this.pool.query(query, [
        interval,
        patientId,
        tenantId,
        startTime,
        endTime,
      ]);
      return result.rows;
    } catch (error: any) {
      logger.error('Error getting vital signs trends:', error);
      throw new DatabaseError('Failed to get trends', error);
    }
  }

  private mapRowToVitalSigns(row: any): IVitalSigns {
    return {
      observationId: row.observation_id,
      deviceId: row.device_id,
      patientId: row.patient_id,
      observationTime: row.observation_time,
      temperature: row.temperature,
      heartRate: row.heart_rate,
      respiratoryRate: row.respiratory_rate,
      bloodPressureSystolic: row.blood_pressure_systolic,
      bloodPressureDiastolic: row.blood_pressure_diastolic,
      oxygenSaturation: row.oxygen_saturation,
      pulseRate: row.pulse_rate,
      signalQuality: row.signal_quality,
      leadOff: row.lead_off,
      artifacts: row.artifacts,
      confidence: row.confidence,
      waveformData: row.waveform_data,
      metadata: row.metadata,
      tenantId: row.tenant_id,
    };
  }
}

export default VitalSignsRepository;

