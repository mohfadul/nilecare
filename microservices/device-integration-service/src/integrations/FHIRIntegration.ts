/**
 * FHIR Integration
 * Handles FHIR R4 resource conversion and synchronization
 */

import axios, { AxiosInstance } from 'axios';
import { config } from '../config/env';
import { VitalSignsData } from '../types';
import { ExternalServiceError } from '../utils/errors';
import logger from '../utils/logger';

export class FHIRIntegration {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.FHIR_SERVER_URL,
      headers: {
        'Content-Type': 'application/fhir+json',
        'X-API-Key': config.FHIR_API_KEY,
      },
      timeout: 10000,
    });
  }

  /**
   * Convert vital signs to FHIR Observation resources
   */
  convertVitalSignsToFHIR(vitalSigns: VitalSignsData): any[] {
    const observations: any[] = [];

    // Temperature Observation
    if (vitalSigns.temperature !== undefined) {
      observations.push({
        resourceType: 'Observation',
        status: 'final',
        category: [
          {
            coding: [
              {
                system: 'http://terminology.hl7.org/CodeSystem/observation-category',
                code: 'vital-signs',
                display: 'Vital Signs',
              },
            ],
          },
        ],
        code: {
          coding: [
            {
              system: 'http://loinc.org',
              code: '8310-5',
              display: 'Body temperature',
            },
          ],
        },
        subject: {
          reference: `Patient/${vitalSigns.patientId}`,
        },
        effectiveDateTime: vitalSigns.timestamp.toISOString(),
        valueQuantity: {
          value: vitalSigns.temperature,
          unit: '°C',
          system: 'http://unitsofmeasure.org',
          code: 'Cel',
        },
        device: {
          reference: `Device/${vitalSigns.deviceId}`,
        },
      });
    }

    // Heart Rate Observation
    if (vitalSigns.heartRate !== undefined) {
      observations.push({
        resourceType: 'Observation',
        status: 'final',
        category: [
          {
            coding: [
              {
                system: 'http://terminology.hl7.org/CodeSystem/observation-category',
                code: 'vital-signs',
                display: 'Vital Signs',
              },
            ],
          },
        ],
        code: {
          coding: [
            {
              system: 'http://loinc.org',
              code: '8867-4',
              display: 'Heart rate',
            },
          ],
        },
        subject: {
          reference: `Patient/${vitalSigns.patientId}`,
        },
        effectiveDateTime: vitalSigns.timestamp.toISOString(),
        valueQuantity: {
          value: vitalSigns.heartRate,
          unit: 'beats/minute',
          system: 'http://unitsofmeasure.org',
          code: '/min',
        },
        device: {
          reference: `Device/${vitalSigns.deviceId}`,
        },
      });
    }

    // Blood Pressure Observation
    if (vitalSigns.bloodPressureSystolic && vitalSigns.bloodPressureDiastolic) {
      observations.push({
        resourceType: 'Observation',
        status: 'final',
        category: [
          {
            coding: [
              {
                system: 'http://terminology.hl7.org/CodeSystem/observation-category',
                code: 'vital-signs',
                display: 'Vital Signs',
              },
            ],
          },
        ],
        code: {
          coding: [
            {
              system: 'http://loinc.org',
              code: '85354-9',
              display: 'Blood pressure panel',
            },
          ],
        },
        subject: {
          reference: `Patient/${vitalSigns.patientId}`,
        },
        effectiveDateTime: vitalSigns.timestamp.toISOString(),
        component: [
          {
            code: {
              coding: [
                {
                  system: 'http://loinc.org',
                  code: '8480-6',
                  display: 'Systolic blood pressure',
                },
              ],
            },
            valueQuantity: {
              value: vitalSigns.bloodPressureSystolic,
              unit: 'mmHg',
              system: 'http://unitsofmeasure.org',
              code: 'mm[Hg]',
            },
          },
          {
            code: {
              coding: [
                {
                  system: 'http://loinc.org',
                  code: '8462-4',
                  display: 'Diastolic blood pressure',
                },
              ],
            },
            valueQuantity: {
              value: vitalSigns.bloodPressureDiastolic,
              unit: 'mmHg',
              system: 'http://unitsofmeasure.org',
              code: 'mm[Hg]',
            },
          },
        ],
        device: {
          reference: `Device/${vitalSigns.deviceId}`,
        },
      });
    }

    // Oxygen Saturation Observation
    if (vitalSigns.oxygenSaturation !== undefined) {
      observations.push({
        resourceType: 'Observation',
        status: 'final',
        category: [
          {
            coding: [
              {
                system: 'http://terminology.hl7.org/CodeSystem/observation-category',
                code: 'vital-signs',
                display: 'Vital Signs',
              },
            ],
          },
        ],
        code: {
          coding: [
            {
              system: 'http://loinc.org',
              code: '2708-6',
              display: 'Oxygen saturation in Arterial blood',
            },
          ],
        },
        subject: {
          reference: `Patient/${vitalSigns.patientId}`,
        },
        effectiveDateTime: vitalSigns.timestamp.toISOString(),
        valueQuantity: {
          value: vitalSigns.oxygenSaturation,
          unit: '%',
          system: 'http://unitsofmeasure.org',
          code: '%',
        },
        device: {
          reference: `Device/${vitalSigns.deviceId}`,
        },
      });
    }

    // Respiratory Rate Observation
    if (vitalSigns.respiratoryRate !== undefined) {
      observations.push({
        resourceType: 'Observation',
        status: 'final',
        category: [
          {
            coding: [
              {
                system: 'http://terminology.hl7.org/CodeSystem/observation-category',
                code: 'vital-signs',
                display: 'Vital Signs',
              },
            ],
          },
        ],
        code: {
          coding: [
            {
              system: 'http://loinc.org',
              code: '9279-1',
              display: 'Respiratory rate',
            },
          ],
        },
        subject: {
          reference: `Patient/${vitalSigns.patientId}`,
        },
        effectiveDateTime: vitalSigns.timestamp.toISOString(),
        valueQuantity: {
          value: vitalSigns.respiratoryRate,
          unit: 'breaths/minute',
          system: 'http://unitsofmeasure.org',
          code: '/min',
        },
        device: {
          reference: `Device/${vitalSigns.deviceId}`,
        },
      });
    }

    return observations;
  }

  /**
   * Send observations to FHIR server
   */
  async sendObservations(observations: any[]): Promise<void> {
    try {
      for (const observation of observations) {
        await this.client.post('/Observation', observation);
        logger.info('FHIR Observation created', { code: observation.code.coding[0].code });
      }
    } catch (error: any) {
      logger.error('Error sending observations to FHIR server:', error);
      throw new ExternalServiceError('FHIR Server', 'Failed to send observations', error.response?.data);
    }
  }

  /**
   * Create FHIR Device resource
   */
  async createDevice(deviceData: any): Promise<any> {
    try {
      const fhirDevice = {
        resourceType: 'Device',
        identifier: [
          {
            system: 'urn:nilecare:device',
            value: deviceData.deviceId,
          },
        ],
        status: 'active',
        manufacturer: deviceData.manufacturer,
        deviceName: [
          {
            name: deviceData.deviceName,
            type: 'user-friendly-name',
          },
        ],
        modelNumber: deviceData.modelNumber,
        serialNumber: deviceData.serialNumber,
        type: {
          text: deviceData.deviceType,
        },
      };

      const response = await this.client.post('/Device', fhirDevice);
      logger.info('FHIR Device created', { deviceId: deviceData.deviceId });
      return response.data;
    } catch (error: any) {
      logger.error('Error creating FHIR device:', error);
      throw new ExternalServiceError('FHIR Server', 'Failed to create device', error.response?.data);
    }
  }

  /**
   * Update FHIR Device resource
   */
  async updateDevice(deviceId: string, deviceData: any): Promise<any> {
    try {
      const fhirDevice = {
        resourceType: 'Device',
        id: deviceId,
        status: deviceData.status === 'active' ? 'active' : 'inactive',
        manufacturer: deviceData.manufacturer,
        deviceName: [
          {
            name: deviceData.deviceName,
            type: 'user-friendly-name',
          },
        ],
        modelNumber: deviceData.modelNumber,
        serialNumber: deviceData.serialNumber,
      };

      const response = await this.client.put(`/Device/${deviceId}`, fhirDevice);
      logger.info('FHIR Device updated', { deviceId });
      return response.data;
    } catch (error: any) {
      logger.error('Error updating FHIR device:', error);
      throw new ExternalServiceError('FHIR Server', 'Failed to update device', error.response?.data);
    }
  }

  /**
   * Get FHIR Observations for a patient
   */
  async getPatientObservations(patientId: string, params?: any): Promise<any> {
    try {
      const response = await this.client.get('/Observation', {
        params: {
          subject: `Patient/${patientId}`,
          category: 'vital-signs',
          _sort: '-date',
          _count: params?.limit || 50,
          ...params,
        },
      });
      return response.data;
    } catch (error: any) {
      logger.error('Error fetching patient observations from FHIR server:', error);
      throw new ExternalServiceError(
        'FHIR Server',
        'Failed to fetch observations',
        error.response?.data
      );
    }
  }
}

export default FHIRIntegration;

