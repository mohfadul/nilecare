/**
 * Validation Utilities
 * Common validation functions for device integration
 */

import { DeviceType, DeviceProtocol, DeviceStatus } from '../models/Device';
import { AlertType, AlertSeverity } from '../models/Alert';

export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

export const isValidDeviceType = (type: string): boolean => {
  return Object.values(DeviceType).includes(type as DeviceType);
};

export const isValidDeviceProtocol = (protocol: string): boolean => {
  return Object.values(DeviceProtocol).includes(protocol as DeviceProtocol);
};

export const isValidDeviceStatus = (status: string): boolean => {
  return Object.values(DeviceStatus).includes(status as DeviceStatus);
};

export const isValidAlertType = (type: string): boolean => {
  return Object.values(AlertType).includes(type as AlertType);
};

export const isValidAlertSeverity = (severity: string): boolean => {
  return Object.values(AlertSeverity).includes(severity as AlertSeverity);
};

export const isValidVitalSign = (value: number, min: number, max: number): boolean => {
  return value >= min && value <= max;
};

export const sanitizeString = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

export const validateConnectionParams = (protocol: DeviceProtocol, params: any): boolean => {
  switch (protocol) {
    case DeviceProtocol.MQTT:
      return !!(params.mqttBroker && params.mqttTopic);
    case DeviceProtocol.SERIAL:
      return !!(params.serialPort && params.baudRate);
    case DeviceProtocol.MODBUS:
      return !!(params.modbusHost && params.modbusPort);
    case DeviceProtocol.WEBSOCKET:
      return !!params.wsUrl;
    case DeviceProtocol.HL7:
      return !!(params.hl7Host && params.hl7Port);
    case DeviceProtocol.FHIR:
      return !!params.fhirEndpoint;
    case DeviceProtocol.REST_API:
      return !!params.apiUrl;
    default:
      return false;
  }
};

export const validateVitalSignsRange = (parameter: string, value: number): boolean => {
  const ranges: Record<string, { min: number; max: number }> = {
    temperature: { min: 30, max: 45 },
    heartRate: { min: 0, max: 300 },
    respiratoryRate: { min: 0, max: 60 },
    bloodPressureSystolic: { min: 0, max: 300 },
    bloodPressureDiastolic: { min: 0, max: 200 },
    oxygenSaturation: { min: 0, max: 100 },
    pulseRate: { min: 0, max: 300 },
  };

  const range = ranges[parameter];
  if (!range) return true; // Unknown parameter, allow it

  return value >= range.min && value <= range.max;
};

export default {
  isValidUUID,
  isValidDeviceType,
  isValidDeviceProtocol,
  isValidDeviceStatus,
  isValidAlertType,
  isValidAlertSeverity,
  isValidVitalSign,
  sanitizeString,
  validateConnectionParams,
  validateVitalSignsRange,
};

