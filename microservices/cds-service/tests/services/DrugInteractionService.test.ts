/**
 * Unit Tests for DrugInteractionService
 * 
 * Tests drug-drug interaction checking logic
 */

import { DrugInteractionService } from '../../src/services/DrugInteractionService';
import { DrugInteractionModel } from '../../src/models/DrugInteraction';

// Mock database
jest.mock('../../src/utils/database', () => ({
  db: {
    query: jest.fn()
  },
  cache: {
    getCachedInteractionCheck: jest.fn(),
    cacheInteractionCheck: jest.fn()
  }
}));

// Mock logger
jest.mock('../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  },
  logSafetyCheck: jest.fn()
}));

import { db, cache } from '../../src/utils/database';

describe('DrugInteractionService', () => {
  let service: DrugInteractionService;

  beforeEach(() => {
    service = new DrugInteractionService();
    jest.clearAllMocks();
  });

  describe('checkInteractions', () => {
    it('should return no interactions for single medication', async () => {
      const medications = [{ name: 'Aspirin' }];

      const result = await service.checkInteractions(medications);

      expect(result.hasInteractions).toBe(false);
      expect(result.interactions).toHaveLength(0);
      expect(result.highestSeverity).toBe('none');
      expect(result.requiresAction).toBe(false);
    });

    it('should detect major interaction between Warfarin and Aspirin', async () => {
      const medications = [
        { name: 'Warfarin' },
        { name: 'Aspirin' }
      ];

      // Mock database response
      (db.query as jest.Mock).mockResolvedValue({
        rows: [{
          id: 'interaction-1',
          drug1_name: 'Warfarin',
          drug2_name: 'Aspirin',
          severity: 'major',
          description: 'Increased risk of bleeding',
          clinical_effects: 'Enhanced anticoagulant effect',
          mechanism: 'Additive platelet inhibition',
          recommendation: 'Monitor INR closely',
          evidence_level: 'A',
          references: [],
          created_at: new Date(),
          updated_at: new Date()
        }]
      });

      // Mock cache miss
      (cache.getCachedInteractionCheck as jest.Mock).mockResolvedValue(null);

      const result = await service.checkInteractions(medications);

      expect(result.hasInteractions).toBe(true);
      expect(result.interactions).toHaveLength(1);
      expect(result.interactions[0].severity).toBe('major');
      expect(result.interactions[0].drug1).toBe('Warfarin');
      expect(result.interactions[0].drug2).toBe('Aspirin');
      expect(result.highestSeverity).toBe('major');
      expect(result.requiresAction).toBe(true);
    });

    it('should return cached result if available', async () => {
      const medications = [
        { name: 'Metformin' },
        { name: 'Lisinopril' }
      ];

      const cachedResult = {
        hasInteractions: false,
        interactions: [],
        highestSeverity: 'none' as const,
        requiresAction: false
      };

      (cache.getCachedInteractionCheck as jest.Mock).mockResolvedValue(cachedResult);

      const result = await service.checkInteractions(medications);

      expect(result).toEqual(cachedResult);
      expect(db.query).not.toHaveBeenCalled();
    });

    it('should detect multiple interactions', async () => {
      const medications = [
        { name: 'Warfarin' },
        { name: 'Aspirin' },
        { name: 'Ibuprofen' }
      ];

      // Mock database response with 2 interactions
      (db.query as jest.Mock).mockResolvedValue({
        rows: [
          {
            id: 'interaction-1',
            drug1_name: 'Warfarin',
            drug2_name: 'Aspirin',
            severity: 'major',
            description: 'Increased risk of bleeding',
            mechanism: 'Additive anticoagulation',
            recommendation: 'Monitor INR',
            evidence_level: 'A',
            references: [],
            created_at: new Date(),
            updated_at: new Date()
          },
          {
            id: 'interaction-2',
            drug1_name: 'Warfarin',
            drug2_name: 'Ibuprofen',
            severity: 'major',
            description: 'Increased bleeding risk',
            mechanism: 'Platelet inhibition',
            recommendation: 'Avoid combination',
            evidence_level: 'A',
            references: [],
            created_at: new Date(),
            updated_at: new Date()
          }
        ]
      });

      (cache.getCachedInteractionCheck as jest.Mock).mockResolvedValue(null);

      const result = await service.checkInteractions(medications);

      expect(result.hasInteractions).toBe(true);
      expect(result.interactions).toHaveLength(2);
      expect(result.highestSeverity).toBe('major');
      expect(result.requiresAction).toBe(true);
    });

    it('should determine highest severity correctly', async () => {
      const medications = [
        { name: 'Drug A' },
        { name: 'Drug B' },
        { name: 'Drug C' }
      ];

      // Mock interactions with different severities
      (db.query as jest.Mock).mockResolvedValue({
        rows: [
          {
            id: '1',
            drug1_name: 'Drug A',
            drug2_name: 'Drug B',
            severity: 'minor',
            description: 'Minor interaction',
            mechanism: 'Unknown',
            recommendation: 'Monitor',
            evidence_level: 'C',
            references: [],
            created_at: new Date(),
            updated_at: new Date()
          },
          {
            id: '2',
            drug1_name: 'Drug A',
            drug2_name: 'Drug C',
            severity: 'critical',
            description: 'Critical interaction',
            mechanism: 'Life-threatening',
            recommendation: 'Do not combine',
            evidence_level: 'A',
            references: [],
            created_at: new Date(),
            updated_at: new Date()
          }
        ]
      });

      (cache.getCachedInteractionCheck as jest.Mock).mockResolvedValue(null);

      const result = await service.checkInteractions(medications);

      expect(result.highestSeverity).toBe('critical');
      expect(result.requiresAction).toBe(true);
    });
  });

  describe('getInteractionsForMedication', () => {
    it('should return all interactions for a medication', async () => {
      (db.query as jest.Mock).mockResolvedValue({
        rows: [
          {
            id: '1',
            drug1_name: 'Warfarin',
            drug2_name: 'Aspirin',
            severity: 'major',
            description: 'Bleeding risk',
            mechanism: 'Additive effect',
            recommendation: 'Monitor',
            evidence_level: 'A',
            references: [],
            created_at: new Date(),
            updated_at: new Date()
          }
        ]
      });

      const result = await service.getInteractionsForMedication('Warfarin');

      expect(result).toHaveLength(1);
      expect(result[0].drug1).toBe('Warfarin');
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE LOWER(drug1_name) = LOWER($1)'),
        ['Warfarin']
      );
    });

    it('should handle medication with no interactions', async () => {
      (db.query as jest.Mock).mockResolvedValue({ rows: [] });

      const result = await service.getInteractionsForMedication('Metformin');

      expect(result).toHaveLength(0);
    });
  });

  describe('getStatistics', () => {
    it('should return interaction statistics', async () => {
      (db.query as jest.Mock).mockResolvedValue({
        rows: [{
          total: '5',
          minor: '1',
          moderate: '1',
          major: '2',
          critical: '1',
          last_updated: new Date('2025-10-14')
        }]
      });

      const stats = await service.getStatistics();

      expect(stats.totalInteractions).toBe(5);
      expect(stats.bySeverity.minor).toBe(1);
      expect(stats.bySeverity.moderate).toBe(1);
      expect(stats.bySeverity.major).toBe(2);
      expect(stats.bySeverity.critical).toBe(1);
      expect(stats.lastUpdated).toBeInstanceOf(Date);
    });

    it('should handle empty database', async () => {
      (db.query as jest.Mock).mockResolvedValue({
        rows: [{
          total: '0',
          minor: '0',
          moderate: '0',
          major: '0',
          critical: '0',
          last_updated: null
        }]
      });

      const stats = await service.getStatistics();

      expect(stats.totalInteractions).toBe(0);
      expect(stats.bySeverity.major).toBe(0);
      expect(stats.lastUpdated).toBeNull();
    });
  });

  describe('Error handling', () => {
    it('should handle database errors gracefully', async () => {
      (db.query as jest.Mock).mockRejectedValue(new Error('Database connection failed'));
      (cache.getCachedInteractionCheck as jest.Mock).mockResolvedValue(null);

      const medications = [{ name: 'Drug A' }, { name: 'Drug B' }];

      await expect(service.checkInteractions(medications)).rejects.toThrow('Database connection failed');
    });

    it('should handle table not found error (development mode)', async () => {
      const error: any = new Error('Table not found');
      error.code = '42P01';
      (db.query as jest.Mock).mockRejectedValue(error);
      (cache.getCachedInteractionCheck as jest.Mock).mockResolvedValue(null);

      const medications = [{ name: 'Drug A' }, { name: 'Drug B' }];

      const result = await service.checkInteractions(medications);

      // Should return empty result in development mode
      expect(result.hasInteractions).toBe(false);
      expect(result.interactions).toHaveLength(0);
    });
  });

  describe('DrugInteractionModel', () => {
    it('should calculate severity weight correctly', () => {
      expect(DrugInteractionModel.getSeverityWeight('minor')).toBe(1);
      expect(DrugInteractionModel.getSeverityWeight('moderate')).toBe(2);
      expect(DrugInteractionModel.getSeverityWeight('major')).toBe(4);
      expect(DrugInteractionModel.getSeverityWeight('critical')).toBe(8);
    });

    it('should determine if action is required', () => {
      expect(DrugInteractionModel.requiresAction('minor')).toBe(false);
      expect(DrugInteractionModel.requiresAction('moderate')).toBe(false);
      expect(DrugInteractionModel.requiresAction('major')).toBe(true);
      expect(DrugInteractionModel.requiresAction('critical')).toBe(true);
    });

    it('should map database row correctly', () => {
      const row = {
        id: 'interaction-id',
        drug1_name: 'Warfarin',
        drug1_rxnorm: '11289',
        drug2_name: 'Aspirin',
        drug2_rxnorm: '1191',
        severity: 'major',
        description: 'Increased bleeding',
        clinical_effects: 'Enhanced anticoagulation',
        mechanism: 'Additive effect',
        recommendation: 'Monitor INR',
        evidence_level: 'A',
        references: ['Study 1', 'Study 2'],
        created_at: new Date('2025-01-01'),
        updated_at: new Date('2025-01-02')
      };

      const interaction = DrugInteractionModel.fromDatabaseRow(row);

      expect(interaction.id).toBe('interaction-id');
      expect(interaction.drug1).toBe('Warfarin');
      expect(interaction.drug2).toBe('Aspirin');
      expect(interaction.severity).toBe('major');
      expect(interaction.evidenceLevel).toBe('A');
    });
  });
});

