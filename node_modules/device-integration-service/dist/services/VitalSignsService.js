"use strict";
/**
 * Vital Signs Service
 * Processes and stores vital signs data from devices
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VitalSignsService = void 0;
const VitalSignsRepository_1 = __importDefault(require("../repositories/VitalSignsRepository"));
const DeviceRepository_1 = __importDefault(require("../repositories/DeviceRepository"));
const AlertRepository_1 = __importDefault(require("../repositories/AlertRepository"));
const Alert_1 = require("../models/Alert");
const FHIRIntegration_1 = __importDefault(require("../integrations/FHIRIntegration"));
const HL7Integration_1 = __importDefault(require("../integrations/HL7Integration"));
const NotificationIntegration_1 = __importDefault(require("../integrations/NotificationIntegration"));
const errors_1 = require("../utils/errors");
const logger_1 = __importDefault(require("../utils/logger"));
const env_1 = require("../config/env");
class VitalSignsService {
    constructor(pool) {
        this.vitalSignsRepository = new VitalSignsRepository_1.default(pool);
        this.deviceRepository = new DeviceRepository_1.default(pool);
        this.alertRepository = new AlertRepository_1.default(pool);
        this.fhirIntegration = new FHIRIntegration_1.default();
        this.hl7Integration = new HL7Integration_1.default();
        this.notificationIntegration = new NotificationIntegration_1.default();
    }
    /**
     * Process and store vital signs data
     */
    async processVitalSigns(vitalSignsData) {
        logger_1.default.info('Processing vital signs', {
            deviceId: vitalSignsData.deviceId,
            patientId: vitalSignsData.patientId,
        });
        // Verify device exists
        const device = await this.deviceRepository.findById(vitalSignsData.deviceId, vitalSignsData.tenantId);
        if (!device) {
            throw new errors_1.NotFoundError('Device', vitalSignsData.deviceId);
        }
        // Store vital signs in database
        const vitalSigns = await this.vitalSignsRepository.create(vitalSignsData);
        // Update device last seen
        await this.deviceRepository.updateLastSeen(vitalSignsData.deviceId, vitalSignsData.tenantId);
        // Check for critical values and create alerts
        const alerts = await this.checkCriticalValues(vitalSignsData, device.alertThresholds);
        // Send to FHIR server (async, don't block)
        const vitalSignsForFHIR = {
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
            logger_1.default.error('Failed to send observations to FHIR server:', error);
        });
        // Send to HL7 server (async, don't block)
        if (env_1.config.HL7_SERVER_URL) {
            const hl7Message = this.hl7Integration.convertVitalSignsToHL7(vitalSignsForFHIR);
            this.hl7Integration.sendMessage(hl7Message).catch((error) => {
                logger_1.default.error('Failed to send HL7 message:', error);
            });
        }
        logger_1.default.info('Vital signs processed successfully', {
            observationId: vitalSigns.observationId,
        });
        return vitalSigns;
    }
    /**
     * Check for critical values
     */
    async checkCriticalValues(vitalSigns, alertThresholds) {
        const thresholds = alertThresholds || this.getDefaultThresholds();
        const alerts = [];
        // Check heart rate
        if (vitalSigns.heartRate !== undefined && thresholds.heartRate) {
            if (vitalSigns.heartRate < thresholds.heartRate.critical_min) {
                alerts.push({
                    deviceId: vitalSigns.deviceId,
                    patientId: vitalSigns.patientId,
                    alertType: Alert_1.AlertType.CRITICAL_VALUE,
                    severity: Alert_1.AlertSeverity.CRITICAL,
                    parameter: 'heartRate',
                    value: vitalSigns.heartRate,
                    threshold: thresholds.heartRate.critical_min,
                    message: `Critical bradycardia: Heart rate ${vitalSigns.heartRate} BPM`,
                    tenantId: vitalSigns.tenantId,
                });
            }
            else if (vitalSigns.heartRate > thresholds.heartRate.critical_max) {
                alerts.push({
                    deviceId: vitalSigns.deviceId,
                    patientId: vitalSigns.patientId,
                    alertType: Alert_1.AlertType.CRITICAL_VALUE,
                    severity: Alert_1.AlertSeverity.CRITICAL,
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
                    alertType: Alert_1.AlertType.CRITICAL_VALUE,
                    severity: Alert_1.AlertSeverity.CRITICAL,
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
                    alertType: Alert_1.AlertType.CRITICAL_VALUE,
                    severity: Alert_1.AlertSeverity.CRITICAL,
                    parameter: 'bloodPressureSystolic',
                    value: vitalSigns.bloodPressureSystolic,
                    threshold: thresholds.bloodPressureSystolic.critical_min,
                    message: `Critical hypotension: BP ${vitalSigns.bloodPressureSystolic}/${vitalSigns.bloodPressureDiastolic} mmHg`,
                    tenantId: vitalSigns.tenantId,
                });
            }
            else if (vitalSigns.bloodPressureSystolic > thresholds.bloodPressureSystolic.critical_max) {
                alerts.push({
                    deviceId: vitalSigns.deviceId,
                    patientId: vitalSigns.patientId,
                    alertType: Alert_1.AlertType.CRITICAL_VALUE,
                    severity: Alert_1.AlertSeverity.CRITICAL,
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
            await this.notificationIntegration.sendCriticalAlert(alert).catch((error) => {
                logger_1.default.error('Failed to send critical alert notification:', error);
            });
        }
    }
    /**
     * Get vital signs by device
     */
    async getVitalSignsByDevice(deviceId, params) {
        return await this.vitalSignsRepository.findByDevice(deviceId, params);
    }
    /**
     * Get vital signs by patient
     */
    async getVitalSignsByPatient(patientId, params) {
        return await this.vitalSignsRepository.findByPatient(patientId, params);
    }
    /**
     * Get latest vital signs for a device
     */
    async getLatestVitalSigns(deviceId, tenantId) {
        return await this.vitalSignsRepository.getLatest(deviceId, tenantId);
    }
    /**
     * Get vital signs trends
     */
    async getVitalSignsTrends(patientId, parameter, startTime, endTime, tenantId, interval) {
        return await this.vitalSignsRepository.getTrends(patientId, parameter, startTime, endTime, tenantId, interval);
    }
    /**
     * Get default alert thresholds (Sudan healthcare standards)
     */
    getDefaultThresholds() {
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
exports.VitalSignsService = VitalSignsService;
exports.default = VitalSignsService;
//# sourceMappingURL=VitalSignsService.js.map