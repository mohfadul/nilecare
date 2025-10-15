/**
 * Unit Tests for SOAPNotesService
 * 
 * Tests SOAP note lifecycle management
 */

import { SOAPNotesService } from '../../src/services/SOAPNotesService';
import { SOAPNoteModel } from '../../src/models/SOAPNote';

// Mock database
jest.mock('../../src/utils/database', () => ({
  db: {
    query: jest.fn(),
    getClient: jest.fn()
  }
}));

// Mock logger
jest.mock('../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  },
  logClinicalDocumentAction: jest.fn(),
  logDocumentFinalization: jest.fn()
}));

import { db } from '../../src/utils/database';

describe('SOAPNotesService', () => {
  let service: SOAPNotesService;

  beforeEach(() => {
    service = new SOAPNotesService();
    jest.clearAllMocks();
  });

  describe('createSOAPNote', () => {
    it('should create a new SOAP note in draft status', async () => {
      const noteData = {
        encounterId: 'encounter-1',
        patientId: 'patient-1',
        facilityId: 'facility-1',
        organizationId: 'org-1',
        subjective: 'Patient reports headache for 3 days',
        objective: 'BP 130/85, HR 78, Temp 98.6',
        assessment: 'Likely tension headache',
        plan: 'Ibuprofen 400mg TID PRN',
        createdBy: 'doctor-1'
      };

      // Mock successful insert
      (db.query as jest.Mock).mockResolvedValue({
        rows: [{
          id: 'note-1',
          ...noteData,
          status: 'draft',
          version: 1,
          created_at: new Date(),
          updated_at: new Date()
        }]
      });

      const note = await service.createSOAPNote(noteData);

      expect(note.id).toBe('note-1');
      expect(note.status).toBe('draft');
      expect(note.subjective).toBe(noteData.subjective);
      expect(db.query).toHaveBeenCalledTimes(1);
    });

    it('should include diagnoses if provided', async () => {
      const noteData = {
        encounterId: 'encounter-1',
        patientId: 'patient-1',
        organizationId: 'org-1',
        subjective: 'Chest pain',
        objective: 'EKG normal',
        assessment: 'Non-cardiac chest pain',
        plan: 'Observation',
        diagnoses: [
          { code: 'R07.9', description: 'Chest pain, unspecified', type: 'primary' as const }
        ],
        createdBy: 'doctor-1'
      };

      (db.query as jest.Mock).mockResolvedValue({
        rows: [{
          id: 'note-1',
          ...noteData,
          status: 'draft',
          version: 1,
          created_at: new Date(),
          updated_at: new Date()
        }]
      });

      const note = await service.createSOAPNote(noteData);

      expect(note.diagnoses).toHaveLength(1);
      expect(note.diagnoses![0].code).toBe('R07.9');
    });
  });

  describe('updateSOAPNote', () => {
    it('should update draft SOAP note', async () => {
      const noteId = 'note-1';
      const userId = 'doctor-1';
      const updates = {
        assessment: 'Updated assessment: Migraine headache'
      };

      // Mock getting existing note (draft status)
      (db.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [{
            id: noteId,
            status: 'draft',
            locked_by: null,
            created_at: new Date(),
            updated_at: new Date()
          }]
        })
        .mockResolvedValueOnce({
          rows: [{
            id: noteId,
            assessment: updates.assessment,
            version: 2,
            updated_at: new Date()
          }]
        });

      const updated = await service.updateSOAPNote(noteId, updates, userId);

      expect(updated).not.toBeNull();
      expect(db.query).toHaveBeenCalledTimes(2);
    });

    it('should not update finalized SOAP note', async () => {
      const noteId = 'note-1';
      const userId = 'doctor-1';

      // Mock getting finalized note
      (db.query as jest.Mock).mockResolvedValue({
        rows: [{
          id: noteId,
          status: 'finalized',
          finalized_at: new Date(),
          created_at: new Date(),
          updated_at: new Date()
        }]
      });

      const updated = await service.updateSOAPNote(noteId, { assessment: 'New' }, userId);

      expect(updated).toBeNull();
    });

    it('should not update note locked by another user', async () => {
      const noteId = 'note-1';
      const userId = 'doctor-1';
      const lockedBy = 'doctor-2';

      // Mock getting locked note
      (db.query as jest.Mock).mockResolvedValue({
        rows: [{
          id: noteId,
          status: 'draft',
          locked_by: lockedBy,
          locked_at: new Date(),
          created_at: new Date(),
          updated_at: new Date()
        }]
      });

      const updated = await service.updateSOAPNote(noteId, { assessment: 'New' }, userId);

      expect(updated).toBeNull();
    });
  });

  describe('finalizeSOAPNote', () => {
    it('should finalize draft SOAP note', async () => {
      const noteId = 'note-1';
      const finalizationData = {
        userId: 'doctor-1',
        attestation: 'I attest that this note is accurate',
        signature: 'Dr. John Smith, MD'
      };

      // Mock getting draft note
      (db.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [{
            id: noteId,
            status: 'draft',
            created_at: new Date(),
            updated_at: new Date()
          }]
        })
        .mockResolvedValueOnce({
          rows: [{
            id: noteId,
            status: 'finalized',
            finalized_at: new Date(),
            finalized_by: finalizationData.userId,
            attestation: finalizationData.attestation,
            signature: finalizationData.signature,
            version: 1,
            created_at: new Date(),
            updated_at: new Date()
          }]
        });

      const finalized = await service.finalizeSOAPNote(noteId, finalizationData);

      expect(finalized).not.toBeNull();
      expect(finalized!.status).toBe('finalized');
      expect(finalized!.finalizedBy).toBe(finalizationData.userId);
    });

    it('should not finalize already finalized note', async () => {
      const noteId = 'note-1';

      // Mock getting already finalized note
      (db.query as jest.Mock).mockResolvedValue({
        rows: [{
          id: noteId,
          status: 'finalized',
          finalized_at: new Date(),
          created_at: new Date(),
          updated_at: new Date()
        }]
      });

      const result = await service.finalizeSOAPNote(noteId, {
        userId: 'doctor-1',
        attestation: 'Test'
      });

      expect(result).toBeNull();
    });
  });

  describe('createAmendment', () => {
    it('should create amendment to finalized note', async () => {
      const originalNoteId = 'note-1';
      const amendmentData = {
        reason: 'Correcting diagnosis',
        changes: 'Updated assessment to reflect lab results',
        section: 'assessment' as const,
        userId: 'doctor-1'
      };

      // Mock getting original finalized note
      (db.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [{
            id: originalNoteId,
            status: 'finalized',
            patient_id: 'patient-1',
            encounter_id: 'encounter-1',
            subjective: 'Original subjective',
            objective: 'Original objective',
            assessment: 'Original assessment',
            plan: 'Original plan',
            finalized_at: new Date(),
            version: 1,
            organization_id: 'org-1',
            created_at: new Date(),
            updated_at: new Date()
          }]
        })
        .mockResolvedValueOnce({
          rows: [{
            id: 'note-amendment-1',
            is_amendment: true,
            original_note_id: originalNoteId,
            amendment_reason: amendmentData.reason,
            status: 'draft',
            version: 1,
            created_at: new Date(),
            updated_at: new Date()
          }]
        });

      const amendment = await service.createAmendment(originalNoteId, amendmentData);

      expect(amendment).not.toBeNull();
      expect(amendment!.isAmendment).toBe(true);
      expect(amendment!.originalNoteId).toBe(originalNoteId);
      expect(amendment!.amendmentReason).toBe(amendmentData.reason);
    });

    it('should not create amendment for draft note', async () => {
      const noteId = 'note-1';

      // Mock getting draft note
      (db.query as jest.Mock).mockResolvedValue({
        rows: [{
          id: noteId,
          status: 'draft',
          created_at: new Date(),
          updated_at: new Date()
        }]
      });

      const result = await service.createAmendment(noteId, {
        reason: 'Test',
        changes: 'Test',
        section: 'assessment',
        userId: 'doctor-1'
      });

      expect(result).toBeNull();
    });
  });

  describe('SOAPNoteModel', () => {
    it('should determine if note can be edited', () => {
      const draftNote: any = { status: 'draft', lockedBy: null };
      const finalizedNote: any = { status: 'finalized' };

      expect(SOAPNoteModel.canEdit(draftNote)).toBe(true);
      expect(SOAPNoteModel.canEdit(finalizedNote)).toBe(false);
    });

    it('should determine if note can be finalized', () => {
      const draftNote: any = { 
        status: 'draft',
        subjective: 'S',
        objective: 'O',
        assessment: 'A',
        plan: 'P'
      };
      const incompleteNote: any = { status: 'draft', subjective: '', objective: '', assessment: '', plan: '' };
      const finalizedNote: any = { status: 'finalized' };

      expect(SOAPNoteModel.canFinalize(draftNote)).toBe(true);
      expect(SOAPNoteModel.canFinalize(incompleteNote)).toBe(false);
      expect(SOAPNoteModel.canFinalize(finalizedNote)).toBe(false);
    });

    it('should detect if note is locked', () => {
      const unlockedNote: any = { lockedBy: null };
      const lockedBySelf: any = { lockedBy: 'user-1', lockedAt: new Date() };
      const lockedByOther: any = { lockedBy: 'user-2', lockedAt: new Date() };

      expect(SOAPNoteModel.isLocked(unlockedNote, 'user-1')).toBe(false);
      expect(SOAPNoteModel.isLocked(lockedBySelf, 'user-1')).toBe(false);
      expect(SOAPNoteModel.isLocked(lockedByOther, 'user-1')).toBe(true);
    });

    it('should generate appropriate title', () => {
      const noteWithComplaint: any = {
        chiefComplaint: 'Chest pain',
        documentDate: new Date('2025-10-14')
      };
      const noteWithoutComplaint: any = {
        documentDate: new Date('2025-10-14')
      };

      expect(SOAPNoteModel.generateTitle(noteWithComplaint)).toContain('Chest pain');
      expect(SOAPNoteModel.generateTitle(noteWithoutComplaint)).toContain('SOAP Note');
    });

    it('should extract primary diagnosis', () => {
      const noteWithDiagnoses: any = {
        diagnoses: [
          { code: 'I10', description: 'Hypertension', type: 'primary' },
          { code: 'E11.9', description: 'Type 2 Diabetes', type: 'secondary' }
        ]
      };
      const noteWithoutDiagnoses: any = { diagnoses: [] };

      expect(SOAPNoteModel.getPrimaryDiagnosis(noteWithDiagnoses)).toBe('Hypertension');
      expect(SOAPNoteModel.getPrimaryDiagnosis(noteWithoutDiagnoses)).toBeNull();
    });
  });

  describe('getSOAPNotesByPatient', () => {
    it('should retrieve patient SOAP notes with pagination', async () => {
      const patientId = 'patient-1';
      const options = {
        page: 1,
        limit: 10
      };

      // Mock count query
      (db.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [{ count: '5' }]
        })
        .mockResolvedValueOnce({
          rows: [
            { id: 'note-1', patient_id: patientId, status: 'finalized' },
            { id: 'note-2', patient_id: patientId, status: 'draft' }
          ]
        });

      const result = await service.getSOAPNotesByPatient(patientId, options);

      expect(result.notes).toHaveLength(2);
      expect(result.total).toBe(5);
    });

    it('should filter by status', async () => {
      const patientId = 'patient-1';
      const options = {
        status: 'finalized' as const,
        page: 1,
        limit: 10
      };

      (db.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ count: '3' }] })
        .mockResolvedValueOnce({
          rows: [
            { id: 'note-1', patient_id: patientId, status: 'finalized' },
            { id: 'note-2', patient_id: patientId, status: 'finalized' }
          ]
        });

      const result = await service.getSOAPNotesByPatient(patientId, options);

      expect(result.notes).toHaveLength(2);
      expect(result.notes.every((n: any) => n.status === 'finalized')).toBe(true);
    });
  });

  describe('lockNote and unlockNote', () => {
    it('should lock note for editing', async () => {
      const noteId = 'note-1';
      const userId = 'doctor-1';

      // Mock getting unlocked note
      (db.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [{
            id: noteId,
            status: 'draft',
            locked_by: null
          }]
        })
        .mockResolvedValueOnce({
          rowCount: 1
        });

      const locked = await service.lockNote(noteId, userId);

      expect(locked).toBe(true);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('locked_by'),
        expect.arrayContaining([userId, noteId])
      );
    });

    it('should unlock note', async () => {
      const noteId = 'note-1';
      const userId = 'doctor-1';

      (db.query as jest.Mock).mockResolvedValue({ rowCount: 1 });

      const unlocked = await service.unlockNote(noteId, userId);

      expect(unlocked).toBe(true);
    });

    it('should not lock already locked note', async () => {
      const noteId = 'note-1';
      const userId = 'doctor-1';

      // Mock getting locked note
      (db.query as jest.Mock).mockResolvedValue({
        rows: [{
          id: noteId,
          status: 'draft',
          locked_by: 'doctor-2',
          locked_at: new Date()
        }]
      });

      const locked = await service.lockNote(noteId, userId);

      expect(locked).toBe(false);
    });
  });

  describe('deleteSOAPNote', () => {
    it('should soft delete SOAP note', async () => {
      const noteId = 'note-1';
      const userId = 'doctor-1';
      const reason = 'Created in error';

      (db.query as jest.Mock).mockResolvedValue({ rowCount: 1 });

      const deleted = await service.deleteSOAPNote(noteId, userId, reason);

      expect(deleted).toBe(true);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('deleted_at'),
        expect.arrayContaining([noteId, userId, reason])
      );
    });

    it('should return false if note not found', async () => {
      (db.query as jest.Mock).mockResolvedValue({ rowCount: 0 });

      const deleted = await service.deleteSOAPNote('nonexistent', 'user-1', 'Test');

      expect(deleted).toBe(false);
    });
  });
});

