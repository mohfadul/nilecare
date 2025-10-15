/**
 * Validation Middleware
 * Request validation for device integration endpoints
 */

import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../utils/errors';
import {
  isValidUUID,
  isValidDeviceType,
  isValidDeviceProtocol,
  isValidDeviceStatus,
  isValidAlertType,
  isValidAlertSeverity,
  validateConnectionParams,
  validateVitalSignsRange,
} from '../utils/validators';

export const validateDeviceRegistration = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const { deviceName, deviceType, protocol, connectionParams, facilityId, tenantId, createdBy } =
      req.body;

    if (!deviceName || deviceName.trim().length === 0) {
      throw new ValidationError('Device name is required');
    }

    if (!deviceType || !isValidDeviceType(deviceType)) {
      throw new ValidationError('Invalid device type');
    }

    if (!protocol || !isValidDeviceProtocol(protocol)) {
      throw new ValidationError('Invalid protocol');
    }

    if (!connectionParams || typeof connectionParams !== 'object') {
      throw new ValidationError('Connection parameters are required');
    }

    if (!validateConnectionParams(protocol, connectionParams)) {
      throw new ValidationError('Invalid connection parameters for the specified protocol');
    }

    if (!facilityId || !isValidUUID(facilityId)) {
      throw new ValidationError('Valid facility ID is required');
    }

    if (!tenantId || !isValidUUID(tenantId)) {
      throw new ValidationError('Valid tenant ID is required');
    }

    if (!createdBy || !isValidUUID(createdBy)) {
      throw new ValidationError('Valid creator ID is required');
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const validateDeviceUpdate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { deviceType, protocol, status, connectionParams } = req.body;

    if (deviceType && !isValidDeviceType(deviceType)) {
      throw new ValidationError('Invalid device type');
    }

    if (protocol && !isValidDeviceProtocol(protocol)) {
      throw new ValidationError('Invalid protocol');
    }

    if (status && !isValidDeviceStatus(status)) {
      throw new ValidationError('Invalid device status');
    }

    if (connectionParams && protocol) {
      if (!validateConnectionParams(protocol, connectionParams)) {
        throw new ValidationError('Invalid connection parameters for the specified protocol');
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const validateDeviceId = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { deviceId } = req.params;

    if (!deviceId || !isValidUUID(deviceId)) {
      throw new ValidationError('Valid device ID is required');
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const validateVitalSignsData = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { deviceId, patientId, temperature, heartRate, bloodPressureSystolic, oxygenSaturation } =
      req.body;

    if (!deviceId || !isValidUUID(deviceId)) {
      throw new ValidationError('Valid device ID is required');
    }

    if (!patientId || !isValidUUID(patientId)) {
      throw new ValidationError('Valid patient ID is required');
    }

    // Validate vital signs ranges
    if (temperature !== undefined && !validateVitalSignsRange('temperature', temperature)) {
      throw new ValidationError('Temperature value out of valid range (30-45°C)');
    }

    if (heartRate !== undefined && !validateVitalSignsRange('heartRate', heartRate)) {
      throw new ValidationError('Heart rate value out of valid range (0-300 BPM)');
    }

    if (
      bloodPressureSystolic !== undefined &&
      !validateVitalSignsRange('bloodPressureSystolic', bloodPressureSystolic)
    ) {
      throw new ValidationError('Blood pressure systolic value out of valid range (0-300 mmHg)');
    }

    if (
      oxygenSaturation !== undefined &&
      !validateVitalSignsRange('oxygenSaturation', oxygenSaturation)
    ) {
      throw new ValidationError('Oxygen saturation value out of valid range (0-100%)');
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const validateAlertCreation = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { deviceId, patientId, alertType, severity, message } = req.body;

    if (!deviceId || !isValidUUID(deviceId)) {
      throw new ValidationError('Valid device ID is required');
    }

    if (!patientId || !isValidUUID(patientId)) {
      throw new ValidationError('Valid patient ID is required');
    }

    if (!alertType || !isValidAlertType(alertType)) {
      throw new ValidationError('Invalid alert type');
    }

    if (!severity || !isValidAlertSeverity(severity)) {
      throw new ValidationError('Invalid alert severity');
    }

    if (!message || message.trim().length === 0) {
      throw new ValidationError('Alert message is required');
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const validatePagination = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const page = parseInt(req.query.page as string, 10);
    const limit = parseInt(req.query.limit as string, 10);

    if (req.query.page && (isNaN(page) || page < 1)) {
      throw new ValidationError('Page must be a positive integer');
    }

    if (req.query.limit && (isNaN(limit) || limit < 1 || limit > 500)) {
      throw new ValidationError('Limit must be between 1 and 500');
    }

    next();
  } catch (error) {
    next(error);
  }
};

export default {
  validateDeviceRegistration,
  validateDeviceUpdate,
  validateDeviceId,
  validateVitalSignsData,
  validateAlertCreation,
  validatePagination,
};

