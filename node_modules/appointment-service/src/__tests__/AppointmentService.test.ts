/**
 * Appointment Service Tests
 */

import { AppointmentService } from '../services/AppointmentService';

// Mock database
jest.mock('../config/database', () => ({
  pool: {
    execute: jest.fn(),
  },
}));

describe('AppointmentService', () => {
  let appointmentService: AppointmentService;

  beforeEach(() => {
    appointmentService = new AppointmentService();
    jest.clearAllMocks();
  });

  describe('createAppointment', () => {
    it('should create a new appointment successfully', async () => {
      const mockAppointmentData = {
        patientId: '1',
        providerId: '2',
        appointmentDate: '2025-10-20',
        appointmentTime: '10:00:00',
        duration: 30,
        reason: 'Checkup',
      };

      // Mock conflict check (no conflict)
      const { pool } = require('../config/database');
      pool.execute
        .mockResolvedValueOnce([[{ count: 0 }]]) // checkAppointmentConflict
        .mockResolvedValueOnce([{ insertId: 123 }]) // INSERT
        .mockResolvedValueOnce([[{ // getAppointmentById
          id: 123,
          patient_id: '1',
          provider_id: '2',
          appointment_date: '2025-10-20',
          appointment_time: '10:00:00',
          duration: 30,
          status: 'scheduled',
          patient_first_name: 'John',
          patient_last_name: 'Doe',
          provider_first_name: 'Jane',
          provider_last_name: 'Smith',
        }]]);

      const result = await appointmentService.createAppointment(mockAppointmentData);

      expect(result).toBeDefined();
      expect(result.id).toBe(123);
      expect(result.status).toBe('scheduled');
    });

    it('should throw error if there is a conflict', async () => {
      const mockAppointmentData = {
        patientId: '1',
        providerId: '2',
        appointmentDate: '2025-10-20',
        appointmentTime: '10:00:00',
        duration: 30,
      };

      // Mock conflict check (conflict exists)
      const { pool } = require('../config/database');
      pool.execute.mockResolvedValueOnce([[{ count: 1 }]]);

      await expect(
        appointmentService.createAppointment(mockAppointmentData)
      ).rejects.toThrow('Provider already has an appointment at this time');
    });
  });

  describe('getAppointmentById', () => {
    it('should return appointment by ID', async () => {
      const mockAppointment = {
        id: '123',
        patient_id: '1',
        provider_id: '2',
        status: 'scheduled',
      };

      const { pool } = require('../config/database');
      pool.execute.mockResolvedValueOnce([[mockAppointment]]);

      const result = await appointmentService.getAppointmentById('123');

      expect(result).toEqual(mockAppointment);
    });

    it('should throw error if appointment not found', async () => {
      const { pool } = require('../config/database');
      pool.execute.mockResolvedValueOnce([[]]);

      await expect(
        appointmentService.getAppointmentById('999')
      ).rejects.toThrow('Appointment not found');
    });
  });

  describe('updateAppointmentStatus', () => {
    it('should update appointment status', async () => {
      const mockAppointment = {
        id: '123',
        status: 'scheduled',
      };

      const { pool } = require('../config/database');
      pool.execute
        .mockResolvedValueOnce([[mockAppointment]]) // getAppointmentById
        .mockResolvedValueOnce([{}]) // UPDATE
        .mockResolvedValueOnce([[{ ...mockAppointment, status: 'confirmed' }]]); // getAppointmentById

      const result = await appointmentService.updateAppointmentStatus('123', 'confirmed');

      expect(result.status).toBe('confirmed');
    });
  });

  describe('getTodayAppointments', () => {
    it('should return today\'s appointments', async () => {
      const mockAppointments = [
        { id: '1', appointment_date: '2025-10-13' },
        { id: '2', appointment_date: '2025-10-13' },
      ];

      const { pool } = require('../config/database');
      pool.execute.mockResolvedValueOnce([mockAppointments]);

      const result = await appointmentService.getTodayAppointments();

      expect(result).toHaveLength(2);
    });

    it('should filter by provider ID if provided', async () => {
      const mockAppointments = [
        { id: '1', provider_id: '2' },
      ];

      const { pool } = require('../config/database');
      pool.execute.mockResolvedValueOnce([mockAppointments]);

      const result = await appointmentService.getTodayAppointments('2');

      expect(result).toHaveLength(1);
      expect(result[0].provider_id).toBe('2');
    });
  });
});

