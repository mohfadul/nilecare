/**
 * Vital Signs Service
 * Processes and stores vital signs data from devices
 */

import { Pool } from 'pg';
import VitalSignsRepository from '../repositories/VitalSignsRepository';
import DeviceRepository from '../repositories/DeviceRepository';
import AlertRepository from '../repositories/AlertRepository';
import { VitalSignsDTO, VitalSignsQueryParams, IVitalSigns } from '../models/VitalSigns';
import { AlertDTO, AlertType, AlertSeverity } from '../models/Alert';
import FHIRIntegration from '../integrations/FHIRIntegration';
import HL7Integration from '../integrations/HL7Integration';
import NotificationIntegration from '../integrations/NotificationIntegration';
import { VitalSignsData, AlertThresholds } from '../types';
import { NotFoundError } from '../utils/errors';
import logger from '../utils/logger';
import { config } from '../config/env';

export class VitalSignsService {
  private vitalSignsRepository: VitalSignsRepository;
  private deviceRepository: DeviceRepository;
  private alertRepository: AlertRepository;
  private fhirIntegration: FHIRIntegration;
  private hl7Integration: HL7Integration;
  private notificationIntegration: NotificationIntegration;

  constructor(pool: Pool) {
    this.vitalSignsRepository = new VitalSignsRepository(pool);
    this.deviceRepository = new DeviceRepository(pool);
    this.alertRepository = new AlertRepository(pool);
    this.fhirIntegration = new FHIRIntegration();
    this.hl7Integration = new HL7Integration();
    this.notificationIntegration = new NotificationIntegration();
  }

  /**
   * Process and store vital signs data
   */
  async processVitalSigns(vitalSignsData: VitalSignsDTO): Promise<IVitalSigns> {
    logger.info('Processing vital signs', {
      deviceId: vitalSignsData.deviceId,
      patientId: vitalSignsData.patientId,
    });

    // Verify device exists
    const device = await this.deviceRepository.findById(
      vitalSignsData.deviceId,
      vitalSignsData.tenantId
    );

    if (!device) {
      throw new NotFoundError('Device', vitalSignsData.deviceId);
    }

    // Store vital signs in database
    const vitalSigns = await this.vitalSignsRepository.create(vitalSignsData);

    // Update device last seen
    await this.deviceRepository.updateLastSeen(vitalSignsData.deviceId, vitalSignsData.tenantId);

    // Check for critical values and create alerts
    const alerts = await this.checkCriticalValues(vitalSignsData, device.alertThresholds);

    // Send to FHIR server (async, don't block)
    const vitalSignsForFHIR: VitalSignsData = {
      deviceId: vitalSignsData.deviceId,
      patientId: vitalSignsData.patientId,
      timestamp: vitalSigns.observationTime,
      temperature: vitalSignsData.temperature,
      heartRate: vitalSignsData.heartRate,
      respiratoryRate: vitalSignsData.respiratoryRate,
      bloodPressureSystolic: vitalSignsData.bloodPressureSystolic,
      bloodPressureDiastolic: vitalSignsData.bloodPressureDiastolic,
      oxygenSaturation: vitalSignsData.oxygenSaturation,
      pulseRate: vitalSignsData.pulseRate,
      quality: vitalSignsData.quality,
    };

    this.fhirIntegration
      .sendObservations(this.fhirIntegration.convertVitalSignsToFHIR(vitalSignsForFHIR))
      .catch((error) => {
        logger.error('Failed to send observations to FHIR server:', error);
      });

    // Send to HL7 server (async, don't block)
    if (config.HL7_SERVER_URL) {
      const hl7Message = this.hl7Integration.convertVitalSignsToHL7(vitalSignsForFHIR);
      this.hl7Integration.sendMessage(hl7Message).catch((error) => {
        logger.error('Failed to send HL7 message:', error);
      });
    }

    logger.info('Vital signs processed successfully', {
      observationId: vitalSigns.observationId,
      alertsCreated: alerts.length,
    });

    return vitalSigns;
  }

  /**
   * Check for critical values
   */
  private async checkCriticalValues(
    vitalSigns: VitalSignsDTO,
    alertThresholds?: AlertThresholds
  ): Promise<void> {
    const thresholds = alertThresholds || this.getDefaultThresholds();
    const alerts: AlertDTO[] = [];

    // Check heart rate
    if (vitalSigns.heartRate !== undefined && thresholds.heartRate) {
      if (vitalSigns.heartRate < thresholds.heartRate.critical_min) {
        alerts.push({
          deviceId: vitalSigns.deviceId,
          patientId: vitalSigns.patientId,
          alertType: AlertType.CRITICAL_VALUE,
          severity: AlertSeverity.CRITICAL,
          parameter: 'heartRate',
          value: vitalSigns.heartRate,
          threshold: thresholds.heartRate.critical_min,
          message: `Critical bradycardia: Heart rate ${vitalSigns.heartRate} BPM`,
          tenantId: vitalSigns.tenantId,
        });
      } else if (vitalSigns.heartRate > thresholds.heartRate.critical_max) {
        alerts.push({
          deviceId: vitalSigns.deviceId,
          patientId: vitalSigns.patientId,
          alertType: AlertType.CRITICAL_VALUE,
          severity: AlertSeverity.CRITICAL,
          parameter: 'heartRate',
          value: vitalSigns.heartRate,
          threshold: thresholds.heartRate.critical_max,
          message: `Critical tachycardia: Heart rate ${vitalSigns.heartRate} BPM`,
          tenantId: vitalSigns.tenantId,
        });
      }
    }

    // Check oxygen saturation
    if (vitalSigns.oxygenSaturation !== undefined && thresholds.oxygenSaturation) {
      if (vitalSigns.oxygenSaturation < thresholds.oxygenSaturation.critical_min) {
        alerts.push({
          deviceId: vitalSigns.deviceId,
          patientId: vitalSigns.patientId,
          alertType: AlertType.CRITICAL_VALUE,
          severity: AlertSeverity.CRITICAL,
          parameter: 'oxygenSaturation',
          value: vitalSigns.oxygenSaturation,
          threshold: thresholds.oxygenSaturation.critical_min,
          message: `Critical hypoxemia: SpO2 ${vitalSigns.oxygenSaturation}%`,
          tenantId: vitalSigns.tenantId,
        });
      }
    }

    // Check blood pressure
    if (vitalSigns.bloodPressureSystolic !== undefined && thresholds.bloodPressureSystolic) {
      if (vitalSigns.bloodPressureSystolic < thresholds.bloodPressureSystolic.critical_min) {
        alerts.push({
          deviceId: vitalSigns.deviceId,
          patientId: vitalSigns.patientId,
          alertType: AlertType.CRITICAL_VALUE,
          severity: AlertSeverity.CRITICAL,
          parameter: 'bloodPressureSystolic',
          value: vitalSigns.bloodPressureSystolic,
          threshold: thresholds.bloodPressureSystolic.critical_min,
          message: `Critical hypotension: BP ${vitalSigns.bloodPressureSystolic}/${vitalSigns.bloodPressureDiastolic} mmHg`,
          tenantId: vitalSigns.tenantId,
        });
      } else if (vitalSigns.bloodPressureSystolic > thresholds.bloodPressureSystolic.critical_max) {
        alerts.push({
          deviceId: vitalSigns.deviceId,
          patientId: vitalSigns.patientId,
          alertType: AlertType.CRITICAL_VALUE,
          severity: AlertSeverity.CRITICAL,
          parameter: 'bloodPressureSystolic',
          value: vitalSigns.bloodPressureSystolic,
          threshold: thresholds.bloodPressureSystolic.critical_max,
          message: `Critical hypertension: BP ${vitalSigns.bloodPressureSystolic}/${vitalSigns.bloodPressureDiastolic} mmHg`,
          tenantId: vitalSigns.tenantId,
        });
      }
    }

    // Create alerts and send notifications
    for (const alertData of alerts) {
      const alert = await this.alertRepository.create(alertData);
      
      // Send critical notification
      await this.notificationIntegration.sendCriticalAlert({
        alertId: alert.alertId,
        deviceId: alert.deviceId,
        patientId: alert.patientId,
        alertType: alert.alertType,
        severity: alert.severity,
        parameter: alert.parameter,
        value: alert.value,
        threshold: alert.threshold,
        message: alert.message,
        timestamp: alert.timestamp,
        acknowledged: alert.acknowledged,
      }).catch((error) => {
        logger.error('Failed to send critical alert notification:', error);
      });
    }
  }

  /**
   * Get vital signs by device
   */
  async getVitalSignsByDevice(
    deviceId: string,
    params: VitalSignsQueryParams
  ): Promise<{ data: IVitalSigns[]; total: number }> {
    return await this.vitalSignsRepository.findByDevice(deviceId, params);
  }

  /**
   * Get vital signs by patient
   */
  async getVitalSignsByPatient(
    patientId: string,
    params: VitalSignsQueryParams
  ): Promise<{ data: IVitalSigns[]; total: number }> {
    return await this.vitalSignsRepository.findByPatient(patientId, params);
  }

  /**
   * Get latest vital signs for a device
   */
  async getLatestVitalSigns(deviceId: string, tenantId: string): Promise<IVitalSigns | null> {
    return await this.vitalSignsRepository.getLatest(deviceId, tenantId);
  }

  /**
   * Get vital signs trends
   */
  async getVitalSignsTrends(
    patientId: string,
    parameter: string,
    startTime: Date,
    endTime: Date,
    tenantId: string,
    interval?: string
  ): Promise<any[]> {
    return await this.vitalSignsRepository.getTrends(
      patientId,
      parameter,
      startTime,
      endTime,
      tenantId,
      interval
    );
  }

  /**
   * Get default alert thresholds (Sudan healthcare standards)
   */
  private getDefaultThresholds(): AlertThresholds {
    return {
      heartRate: { min: 60, max: 100, critical_min: 40, critical_max: 150 },
      bloodPressureSystolic: { min: 90, max: 140, critical_min: 70, critical_max: 180 },
      bloodPressureDiastolic: { min: 60, max: 90, critical_min: 40, critical_max: 110 },
      oxygenSaturation: { min: 95, critical_min: 90 },
      temperature: { min: 36.0, max: 37.5, critical_min: 35.0, critical_max: 39.0 },
      respiratoryRate: { min: 12, max: 20, critical_min: 8, critical_max: 30 },
    };
  }
}

export default VitalSignsService;

