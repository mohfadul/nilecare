/**
 * Unit Tests for DoseValidationService
 * 
 * Tests medication dose validation logic
 */

import { DoseValidationService } from '../../src/services/DoseValidationService';
import { TherapeuticRangeModel } from '../../src/models/TherapeuticRange';

// Mock database
jest.mock('../../src/utils/database', () => ({
  db: {
    query: jest.fn()
  }
}));

// Mock logger
jest.mock('../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

import { db } from '../../src/utils/database';

describe('DoseValidationService', () => {
  let service: DoseValidationService;

  beforeEach(() => {
    service = new DoseValidationService();
    jest.clearAllMocks();
  });

  describe('validateDoses', () => {
    it('should validate dose within therapeutic range', async () => {
      const medications = [{
        name: 'Metformin',
        dose: '1000mg',
        frequency: 'twice daily',
        route: 'oral'
      }];

      const patientData = {
        patientId: 'patient-1',
        age: 45,
        weight: 75
      };

      // Mock therapeutic range
      (db.query as jest.Mock).mockResolvedValue({
        rows: [{
          medication_name: 'Metformin',
          rxnorm_code: '6809',
          route: 'oral',
          min_dose: 500,
          max_dose: 2550,
          unit: 'mg',
          frequency: 'daily',
          pediatric_dose: null,
          geriatric_dose: null,
          renal_adjustment: null,
          hepatic_adjustment: null,
          monitoring_required: ['Renal function'],
          contraindications: [],
          warnings: [],
          created_at: new Date(),
          updated_at: new Date()
        }]
      });

      const result = await service.validateDoses(medications, patientData);

      expect(result.hasErrors).toBe(false);
      expect(result.validations).toHaveLength(1);
      expect(result.validations[0].status).toBe('ok');
      expect(result.validations[0].isValid).toBe(true);
    });

    it('should detect dose above therapeutic range', async () => {
      const medications = [{
        name: 'Warfarin',
        dose: '15mg',
        frequency: 'daily',
        route: 'oral'
      }];

      const patientData = {
        patientId: 'patient-1',
        age: 65
      };

      // Mock therapeutic range
      (db.query as jest.Mock).mockResolvedValue({
        rows: [{
          medication_name: 'Warfarin',
          route: 'oral',
          min_dose: 1,
          max_dose: 10,
          unit: 'mg',
          frequency: 'daily',
          monitoring_required: ['INR'],
          warnings: ['Bleeding risk'],
          created_at: new Date(),
          updated_at: new Date()
        }]
      });

      const result = await service.validateDoses(medications, patientData);

      expect(result.hasErrors).toBe(true);
      expect(result.validations[0].status).toBe('toxic');
      expect(result.validations[0].isValid).toBe(false);
      expect(result.validations[0].recommendations.length).toBeGreaterThan(0);
    });

    it('should detect dose below therapeutic range', async () => {
      const medications = [{
        name: 'Lisinopril',
        dose: '1mg',
        frequency: 'daily',
        route: 'oral'
      }];

      const patientData = {
        patientId: 'patient-1'
      };

      // Mock therapeutic range
      (db.query as jest.Mock).mockResolvedValue({
        rows: [{
          medication_name: 'Lisinopril',
          route: 'oral',
          min_dose: 2.5,
          max_dose: 40,
          unit: 'mg',
          monitoring_required: ['Blood pressure'],
          created_at: new Date(),
          updated_at: new Date()
        }]
      });

      const result = await service.validateDoses(medications, patientData);

      expect(result.hasWarnings).toBe(true);
      expect(result.validations[0].status).toBe('sub-therapeutic');
      expect(result.validations[0].warnings).toContain('Dose below therapeutic range');
    });

    it('should handle pediatric dose calculation', async () => {
      const medications = [{
        name: 'Amoxicillin',
        dose: '250mg',
        frequency: 'TID',
        route: 'oral'
      }];

      const patientData = {
        patientId: 'patient-child',
        age: 5,
        weight: 20
      };

      // Mock therapeutic range with pediatric dosing
      (db.query as jest.Mock).mockResolvedValue({
        rows: [{
          medication_name: 'Amoxicillin',
          route: 'oral',
          min_dose: 250,
          max_dose: 1000,
          unit: 'mg',
          pediatric_dose: {
            ageMin: 0,
            ageMax: 216, // 18 years in months
            minDose: 20,
            maxDose: 50,
            calculationMethod: 'mg/kg'
          },
          created_at: new Date(),
          updated_at: new Date()
        }]
      });

      const result = await service.validateDoses(medications, patientData);

      expect(result.validations[0].warnings.some(w => w.includes('Pediatric'))).toBe(true);
    });

    it('should apply renal dose adjustment', async () => {
      const medications = [{
        name: 'Metformin',
        dose: '1000mg',
        frequency: 'twice daily',
        route: 'oral'
      }];

      const patientData = {
        patientId: 'patient-1',
        renalFunction: 25 // Low GFR
      };

      // Mock therapeutic range with renal adjustment
      (db.query as jest.Mock).mockResolvedValue({
        rows: [{
          medication_name: 'Metformin',
          route: 'oral',
          min_dose: 500,
          max_dose: 2550,
          unit: 'mg',
          renal_adjustment: {
            gfrThreshold: 30,
            adjustment: 50, // 50% reduction
            recommendation: 'Hold if GFR < 30'
          },
          created_at: new Date(),
          updated_at: new Date()
        }]
      });

      const result = await service.validateDoses(medications, patientData);

      expect(result.validations[0].warnings.some(w => w.includes('Renal'))).toBe(true);
      expect(result.validations[0].adjustmentNeeded).toBe(true);
    });

    it('should handle no therapeutic range data', async () => {
      const medications = [{
        name: 'UnknownDrug',
        dose: '100mg',
        frequency: 'daily',
        route: 'oral'
      }];

      const patientData = {
        patientId: 'patient-1'
      };

      // Mock no data found
      (db.query as jest.Mock).mockResolvedValue({ rows: [] });

      const result = await service.validateDoses(medications, patientData);

      expect(result.hasWarnings).toBe(true);
      expect(result.validations[0].warnings).toContain('No therapeutic range data available for validation');
      expect(result.validations[0].status).toBe('ok'); // Can't validate, so OK
    });
  });

  describe('TherapeuticRangeModel', () => {
    it('should parse dose string correctly', () => {
      expect(TherapeuticRangeModel.parseDose('500mg')).toEqual({ value: 500, unit: 'mg' });
      expect(TherapeuticRangeModel.parseDose('2.5g')).toEqual({ value: 2.5, unit: 'g' });
      expect(TherapeuticRangeModel.parseDose('100 mcg')).toEqual({ value: 100, unit: 'mcg' });
      expect(TherapeuticRangeModel.parseDose('invalid')).toBeNull();
    });

    it('should convert units correctly', () => {
      expect(TherapeuticRangeModel.convertUnit(1, 'g', 'mg')).toBe(1000);
      expect(TherapeuticRangeModel.convertUnit(1000, 'mg', 'g')).toBe(1);
      expect(TherapeuticRangeModel.convertUnit(1, 'mg', 'mcg')).toBe(1000);
      expect(TherapeuticRangeModel.convertUnit(1000, 'mcg', 'mg')).toBe(1);
    });

    it('should throw error for invalid unit conversion', () => {
      expect(() => TherapeuticRangeModel.convertUnit(100, 'mg', 'L')).toThrow('Cannot convert');
    });

    it('should calculate pediatric dose using Clark\'s Rule', () => {
      const adultDose = 100; // mg
      const childWeight = 20; // kg
      const childAge = 60; // months (5 years)

      const pediatricDose = TherapeuticRangeModel.calculatePediatricDose(
        'TestMed',
        childAge,
        childWeight,
        adultDose
      );

      // Clark's Rule: (20 / 70) * 100 = 28.57 mg
      expect(pediatricDose).toBeCloseTo(28.57, 1);
    });

    it('should calculate pediatric dose using Young\'s Rule for infants', () => {
      const adultDose = 100; // mg
      const infantWeight = 8; // kg
      const infantAge = 12; // months (1 year)

      const pediatricDose = TherapeuticRangeModel.calculatePediatricDose(
        'TestMed',
        infantAge,
        infantWeight,
        adultDose
      );

      // Young's Rule: (1 / (1 + 12)) * 100 = 7.69 mg
      expect(pediatricDose).toBeCloseTo(7.69, 1);
    });

    it('should apply renal dose adjustment correctly', () => {
      const dose = 1000; // mg
      const gfr = 25; // Low GFR
      const renalAdjustment = {
        gfrThreshold: 30,
        adjustment: 50, // 50% reduction
        recommendation: 'Reduce dose by 50%'
      };

      const result = TherapeuticRangeModel.applyRenalAdjustment(
        dose,
        gfr,
        renalAdjustment
      );

      expect(result.adjustedDose).toBe(500);
      expect(result.adjustment).toBe(50);
      expect(result.reason).toContain('Renal impairment');
    });

    it('should not adjust dose if GFR is adequate', () => {
      const dose = 1000;
      const gfr = 60; // Normal GFR
      const renalAdjustment = {
        gfrThreshold: 30,
        adjustment: 50,
        recommendation: 'Reduce dose'
      };

      const result = TherapeuticRangeModel.applyRenalAdjustment(
        dose,
        gfr,
        renalAdjustment
      );

      expect(result.adjustedDose).toBe(1000);
      expect(result.adjustment).toBe(0);
      expect(result.reason).toBe('No adjustment needed');
    });
  });
});

