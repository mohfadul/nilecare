/**
 * Reminder Service Tests
 */

import { ReminderService } from '../services/ReminderService';

// Mock dependencies
jest.mock('../config/database', () => ({
  pool: {
    execute: jest.fn(),
  },
}));

jest.mock('../services/EmailService', () => ({
  __esModule: true,
  default: {
    sendAppointmentReminder: jest.fn().mockResolvedValue(true),
  },
}));

jest.mock('../services/SMSService', () => ({
  __esModule: true,
  default: {
    sendAppointmentReminder: jest.fn().mockResolvedValue(true),
  },
}));

describe('ReminderService', () => {
  let reminderService: ReminderService;

  beforeEach(() => {
    reminderService = new ReminderService();
    jest.clearAllMocks();
  });

  describe('createReminder', () => {
    it('should create a reminder for an appointment', async () => {
      const mockAppointment = {
        appointment_date: '2025-10-20',
        appointment_time: '10:00:00',
      };

      const { pool } = require('../config/database');
      pool.execute
        .mockResolvedValueOnce([[mockAppointment]]) // Get appointment
        .mockResolvedValueOnce([{ insertId: 456 }]); // INSERT reminder

      const result = await reminderService.createReminder('123', 'email', 24);

      expect(result).toBeDefined();
      expect(result.id).toBe(456);
      expect(result.appointmentId).toBe('123');
      expect(result.reminderType).toBe('email');
    });

    it('should calculate reminder time correctly', async () => {
      const mockAppointment = {
        appointment_date: '2025-10-20',
        appointment_time: '10:00:00',
      };

      const { pool } = require('../config/database');
      pool.execute
        .mockResolvedValueOnce([[mockAppointment]])
        .mockResolvedValueOnce([{ insertId: 456 }]);

      const result = await reminderService.createReminder('123', 'email', 24);

      // Should schedule 24 hours before appointment
      const expectedTime = new Date('2025-10-20T10:00:00');
      expectedTime.setHours(expectedTime.getHours() - 24);

      expect(new Date(result.scheduledTime).getTime()).toBeCloseTo(expectedTime.getTime(), -4);
    });

    it('should throw error if appointment not found', async () => {
      const { pool } = require('../config/database');
      pool.execute.mockResolvedValueOnce([[]]);

      await expect(
        reminderService.createReminder('999', 'email', 24)
      ).rejects.toThrow('Appointment not found');
    });
  });

  describe('getPendingReminders', () => {
    it('should return pending reminders', async () => {
      const mockReminders = [
        {
          id: '1',
          appointment_id: '123',
          reminder_type: 'email',
          sent: false,
          patient_email: 'patient@example.com',
        },
      ];

      const { pool } = require('../config/database');
      pool.execute.mockResolvedValueOnce([mockReminders]);

      const result = await reminderService.getPendingReminders();

      expect(result).toHaveLength(1);
      expect(result[0].sent).toBe(false);
    });
  });

  describe('sendReminder', () => {
    it('should send email reminder successfully', async () => {
      const mockReminder = {
        id: '1',
        appointment_id: '123',
        reminder_type: 'email',
        patient_first_name: 'John',
        patient_last_name: 'Doe',
        patient_email: 'john@example.com',
        appointment_date: '2025-10-20',
        appointment_time: '10:00:00',
        provider_first_name: 'Jane',
        provider_last_name: 'Smith',
      };

      const { pool } = require('../config/database');
      pool.execute.mockResolvedValueOnce([{}]); // markReminderSent

      const EmailService = require('../services/EmailService').default;

      const result = await reminderService.sendReminder(mockReminder);

      expect(result.success).toBe(true);
      expect(EmailService.sendAppointmentReminder).toHaveBeenCalled();
    });

    it('should send SMS reminder successfully', async () => {
      const mockReminder = {
        id: '1',
        appointment_id: '123',
        reminder_type: 'sms',
        patient_first_name: 'John',
        patient_last_name: 'Doe',
        patient_phone: '+249123456789',
        appointment_date: '2025-10-20',
        appointment_time: '10:00:00',
        provider_first_name: 'Jane',
        provider_last_name: 'Smith',
      };

      const { pool } = require('../config/database');
      pool.execute.mockResolvedValueOnce([{}]); // markReminderSent

      const SMSService = require('../services/SMSService').default;

      const result = await reminderService.sendReminder(mockReminder);

      expect(result.success).toBe(true);
      expect(SMSService.sendAppointmentReminder).toHaveBeenCalled();
    });

    it('should handle missing contact info', async () => {
      const mockReminder = {
        id: '1',
        appointment_id: '123',
        reminder_type: 'email',
        patient_first_name: 'John',
        patient_last_name: 'Doe',
        patient_email: null, // No email
        appointment_date: '2025-10-20',
        appointment_time: '10:00:00',
      };

      const result = await reminderService.sendReminder(mockReminder);

      expect(result.success).toBe(false);
    });
  });

  describe('scheduleRemindersForAppointment', () => {
    it('should schedule multiple reminders', async () => {
      const mockAppointment = {
        appointment_date: '2025-10-20',
        appointment_time: '10:00:00',
      };

      const mockPatient = {
        phone: '+249123456789',
      };

      const { pool } = require('../config/database');
      pool.execute
        .mockResolvedValueOnce([[mockAppointment]]) // 24-hour email
        .mockResolvedValueOnce([{ insertId: 1 }])
        .mockResolvedValueOnce([[mockPatient]]) // Check phone
        .mockResolvedValueOnce([[mockAppointment]]) // 2-hour SMS
        .mockResolvedValueOnce([{ insertId: 2 }]);

      const result = await reminderService.scheduleRemindersForAppointment('123');

      expect(result.success).toBe(true);
      expect(pool.execute).toHaveBeenCalledTimes(5);
    });
  });
});

