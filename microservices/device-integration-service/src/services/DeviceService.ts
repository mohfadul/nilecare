/**
 * Device Service
 * Core business logic for device management
 */

import { Pool } from 'pg';
import DeviceRepository from '../repositories/DeviceRepository';
import {
  DeviceRegistrationDTO,
  DeviceUpdateDTO,
  DeviceStatusUpdateDTO,
  DeviceQueryParams,
  IDevice,
} from '../models/Device';
import FHIRIntegration from '../integrations/FHIRIntegration';
import NotificationIntegration from '../integrations/NotificationIntegration';
import { NotFoundError, ValidationError } from '../utils/errors';
import logger from '../utils/logger';

export class DeviceService {
  private deviceRepository: DeviceRepository;
  private fhirIntegration: FHIRIntegration;
  private notificationIntegration: NotificationIntegration;

  constructor(pool: Pool) {
    this.deviceRepository = new DeviceRepository(pool);
    this.fhirIntegration = new FHIRIntegration();
    this.notificationIntegration = new NotificationIntegration();
  }

  /**
   * Register a new device
   */
  async registerDevice(deviceData: DeviceRegistrationDTO): Promise<IDevice> {
    logger.info('Registering new device', { deviceName: deviceData.deviceName });

    // Check if serial number already exists
    if (deviceData.serialNumber) {
      const existing = await this.deviceRepository.findBySerialNumber(
        deviceData.serialNumber,
        deviceData.tenantId
      );
      if (existing) {
        throw new ValidationError('Device with this serial number already exists');
      }
    }

    // Create device in database
    const device = await this.deviceRepository.create(deviceData);

    // Create FHIR Device resource (async, don't block)
    this.fhirIntegration
      .createDevice({
        deviceId: device.deviceId,
        deviceName: device.deviceName,
        manufacturer: device.manufacturer,
        modelNumber: device.modelNumber,
        serialNumber: device.serialNumber,
        deviceType: device.deviceType,
      })
      .catch((error) => {
        logger.error('Failed to create FHIR device:', error);
      });

    // Send notification (async, don't block)
    this.notificationIntegration
      .sendDeviceRegistrationNotification(
        device.deviceId,
        device.deviceName,
        device.facilityId,
        device.createdBy
      )
      .catch((error) => {
        logger.error('Failed to send registration notification:', error);
      });

    logger.info('Device registered successfully', { deviceId: device.deviceId });
    return device;
  }

  /**
   * Get device by ID
   */
  async getDevice(deviceId: string, tenantId: string): Promise<IDevice> {
    const device = await this.deviceRepository.findById(deviceId, tenantId);
    if (!device) {
      throw new NotFoundError('Device', deviceId);
    }
    return device;
  }

  /**
   * Get all devices with filtering and pagination
   */
  async getAllDevices(params: DeviceQueryParams): Promise<{ devices: IDevice[]; total: number }> {
    return await this.deviceRepository.findAll(params);
  }

  /**
   * Update device
   */
  async updateDevice(
    deviceId: string,
    updateData: DeviceUpdateDTO,
    tenantId: string
  ): Promise<IDevice> {
    logger.info('Updating device', { deviceId });

    const device = await this.deviceRepository.update(deviceId, updateData, tenantId);

    // Update FHIR Device resource (async, don't block)
    this.fhirIntegration
      .updateDevice(deviceId, {
        deviceName: device.deviceName,
        manufacturer: device.manufacturer,
        modelNumber: device.modelNumber,
        serialNumber: device.serialNumber,
        status: device.status,
      })
      .catch((error) => {
        logger.error('Failed to update FHIR device:', error);
      });

    logger.info('Device updated successfully', { deviceId });
    return device;
  }

  /**
   * Update device status
   */
  async updateDeviceStatus(
    deviceId: string,
    statusData: DeviceStatusUpdateDTO,
    tenantId: string
  ): Promise<IDevice> {
    logger.info('Updating device status', { deviceId, status: statusData.status });

    const device = await this.deviceRepository.updateStatus(deviceId, statusData, tenantId);

    // Send notification if device went offline or into error state
    if (statusData.status === 'error') {
      this.notificationIntegration
        .sendDeviceConnectionLostNotification(
          device.deviceId,
          device.deviceName,
          device.lastSeen || new Date()
        )
        .catch((error) => {
          logger.error('Failed to send connection lost notification:', error);
        });
    }

    return device;
  }

  /**
   * Delete device
   */
  async deleteDevice(deviceId: string, tenantId: string): Promise<void> {
    logger.info('Deleting device', { deviceId });
    await this.deviceRepository.delete(deviceId, tenantId);
    logger.info('Device deleted successfully', { deviceId });
  }

  /**
   * Get devices by facility
   */
  async getDevicesByFacility(facilityId: string, tenantId: string): Promise<IDevice[]> {
    return await this.deviceRepository.getDevicesByFacility(facilityId, tenantId);
  }

  /**
   * Get online devices
   */
  async getOnlineDevices(tenantId: string): Promise<IDevice[]> {
    return await this.deviceRepository.getOnlineDevices(tenantId);
  }

  /**
   * Update device heartbeat
   */
  async updateHeartbeat(deviceId: string, tenantId: string): Promise<void> {
    await this.deviceRepository.updateLastSeen(deviceId, tenantId);
  }

  /**
   * Check device health
   */
  async checkDeviceHealth(deviceId: string, tenantId: string): Promise<any> {
    const device = await this.getDevice(deviceId, tenantId);

    const isOnline = device.lastSeen && device.lastSeen > new Date(Date.now() - 5 * 60 * 1000);
    const isLowBattery = device.batteryLevel !== undefined && device.batteryLevel < 20;
    const needsCalibration =
      device.nextCalibrationDue && device.nextCalibrationDue <= new Date();

    let healthStatus: 'healthy' | 'warning' | 'critical' | 'offline' = 'healthy';

    if (!isOnline) {
      healthStatus = 'offline';
    } else if (device.status === 'error') {
      healthStatus = 'critical';
    } else if (isLowBattery || needsCalibration) {
      healthStatus = 'warning';
    }

    return {
      deviceId: device.deviceId,
      deviceName: device.deviceName,
      status: device.status,
      healthStatus,
      isOnline,
      lastSeen: device.lastSeen,
      batteryLevel: device.batteryLevel,
      needsCalibration,
      calibrationStatus: device.calibrationStatus,
      nextCalibrationDue: device.nextCalibrationDue,
    };
  }
}

export default DeviceService;

