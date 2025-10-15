/**
 * SOAP Notes Service
 * 
 * Manages SOAP (Subjective, Objective, Assessment, Plan) clinical notes
 * Handles document lifecycle: draft → finalized → amendment
 * 
 * Reference: OpenEMR clinical notes module
 * @see https://github.com/mohfadul/openemr-nilecare
 */

import { v4 as uuidv4 } from 'uuid';
import { db } from '../utils/database';
import { logger, logClinicalDocumentAction, logDocumentFinalization } from '../utils/logger';
import { SOAPNote, SOAPNoteSummary, SOAPNoteModel, SOAPNoteVersion } from '../models/SOAPNote';

export class SOAPNotesService {
  /**
   * Create a new SOAP note (draft status)
   */
  async createSOAPNote(noteData: {
    encounterId: string;
    patientId: string;
    facilityId?: string;
    organizationId: string;
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
    chiefComplaint?: string;
    vitalSigns?: any;
    diagnoses?: any[];
    medications?: any[];
    orders?: any[];
    followUp?: any;
    templateId?: string;
    tags?: string[];
    createdBy: string;
  }): Promise<SOAPNote> {
    try {
      const noteId = uuidv4();
      const now = new Date();

      const query = `
        INSERT INTO soap_notes (
          id, patient_id, encounter_id, facility_id, organization_id,
          subjective, objective, assessment, plan,
          chief_complaint, vital_signs, diagnoses, medications, orders, follow_up,
          status, version, template_id, tags,
          created_by, document_date, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23
        )
        RETURNING *
      `;

      const values = [
        noteId,
        noteData.patientId,
        noteData.encounterId,
        noteData.facilityId || null,
        noteData.organizationId,
        noteData.subjective,
        noteData.objective,
        noteData.assessment,
        noteData.plan,
        noteData.chiefComplaint || null,
        noteData.vitalSigns ? JSON.stringify(noteData.vitalSigns) : null,
        noteData.diagnoses ? JSON.stringify(noteData.diagnoses) : null,
        noteData.medications ? JSON.stringify(noteData.medications) : null,
        noteData.orders ? JSON.stringify(noteData.orders) : null,
        noteData.followUp ? JSON.stringify(noteData.followUp) : null,
        'draft', // Initial status
        1, // Initial version
        noteData.templateId || null,
        noteData.tags || [],
        noteData.createdBy,
        now, // document_date
        now, // created_at
        now  // updated_at
      ];

      const result = await db.query(query, values);
      const note = SOAPNoteModel.fromDatabaseRow(result.rows[0]);

      logClinicalDocumentAction({
        action: 'created',
        documentType: 'soap-note',
        documentId: noteId,
        patientId: noteData.patientId,
        userId: noteData.createdBy,
        facilityId: noteData.facilityId
      });

      logger.info(`Created SOAP note ${noteId} for patient ${noteData.patientId}`);

      return note;
    } catch (error: any) {
      logger.error('Error creating SOAP note:', error);
      throw error;
    }
  }

  /**
   * Get SOAP note by ID
   */
  async getSOAPNoteById(noteId: string, userId: string): Promise<SOAPNote | null> {
    try {
      const query = `
        SELECT * FROM soap_notes
        WHERE id = $1 AND deleted_at IS NULL
      `;

      const result = await db.query(query, [noteId]);

      if (result.rows.length === 0) return null;

      const note = SOAPNoteModel.fromDatabaseRow(result.rows[0]);

      // Track view for HIPAA audit
      await this.trackView(noteId, userId);

      return note;
    } catch (error: any) {
      logger.error(`Error getting SOAP note ${noteId}:`, error);
      throw error;
    }
  }

  /**
   * Update SOAP note (only if draft)
   */
  async updateSOAPNote(
    noteId: string,
    updates: Partial<SOAPNote>,
    userId: string
  ): Promise<SOAPNote | null> {
    try {
      // Get existing note
      const existing = await this.getSOAPNoteById(noteId, userId);
      
      if (!existing) {
        throw new Error('SOAP note not found');
      }

      if (!SOAPNoteModel.canEdit(existing)) {
        throw new Error('Cannot edit finalized note. Use amendment process.');
      }

      if (SOAPNoteModel.isLocked(existing, userId)) {
        throw new Error(`Note is locked by another user until ${existing.lockedAt}`);
      }

      // Build dynamic update query
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (updates.subjective !== undefined) {
        updateFields.push(`subjective = $${paramIndex++}`);
        values.push(updates.subjective);
      }
      if (updates.objective !== undefined) {
        updateFields.push(`objective = $${paramIndex++}`);
        values.push(updates.objective);
      }
      if (updates.assessment !== undefined) {
        updateFields.push(`assessment = $${paramIndex++}`);
        values.push(updates.assessment);
      }
      if (updates.plan !== undefined) {
        updateFields.push(`plan = $${paramIndex++}`);
        values.push(updates.plan);
      }
      if (updates.chiefComplaint !== undefined) {
        updateFields.push(`chief_complaint = $${paramIndex++}`);
        values.push(updates.chiefComplaint);
      }
      if (updates.vitalSigns !== undefined) {
        updateFields.push(`vital_signs = $${paramIndex++}`);
        values.push(JSON.stringify(updates.vitalSigns));
      }
      if (updates.diagnoses !== undefined) {
        updateFields.push(`diagnoses = $${paramIndex++}`);
        values.push(JSON.stringify(updates.diagnoses));
      }
      if (updates.medications !== undefined) {
        updateFields.push(`medications = $${paramIndex++}`);
        values.push(JSON.stringify(updates.medications));
      }
      if (updates.orders !== undefined) {
        updateFields.push(`orders = $${paramIndex++}`);
        values.push(JSON.stringify(updates.orders));
      }
      if (updates.followUp !== undefined) {
        updateFields.push(`follow_up = $${paramIndex++}`);
        values.push(JSON.stringify(updates.followUp));
      }
      if (updates.tags !== undefined) {
        updateFields.push(`tags = $${paramIndex++}`);
        values.push(updates.tags);
      }

      // Always update these
      updateFields.push(`updated_by = $${paramIndex++}`);
      values.push(userId);
      updateFields.push(`updated_at = $${paramIndex++}`);
      values.push(new Date());

      // WHERE clause
      values.push(noteId);
      const whereClause = `WHERE id = $${paramIndex}`;

      const query = `
        UPDATE soap_notes
        SET ${updateFields.join(', ')}
        ${whereClause}
        RETURNING *
      `;

      const result = await db.query(query, values);

      if (result.rows.length === 0) return null;

      const updatedNote = SOAPNoteModel.fromDatabaseRow(result.rows[0]);

      logClinicalDocumentAction({
        action: 'updated',
        documentType: 'soap-note',
        documentId: noteId,
        patientId: updatedNote.patientId,
        userId,
        facilityId: updatedNote.facilityId
      });

      logger.info(`Updated SOAP note ${noteId}`);

      return updatedNote;
    } catch (error: any) {
      logger.error(`Error updating SOAP note ${noteId}:`, error);
      throw error;
    }
  }

  /**
   * Finalize SOAP note (make it permanent, no further edits)
   */
  async finalizeSOAPNote(
    noteId: string,
    finalizationData: {
      userId: string;
      attestation: string;
      signature?: string;
      finalDiagnoses?: any[];
    }
  ): Promise<SOAPNote | null> {
    try {
      // Get existing note
      const existing = await this.getSOAPNoteById(noteId, finalizationData.userId);
      
      if (!existing) {
        throw new Error('SOAP note not found');
      }

      if (!SOAPNoteModel.canFinalize(existing)) {
        throw new Error('Note cannot be finalized - incomplete sections');
      }

      if (existing.status !== 'draft') {
        throw new Error('Only draft notes can be finalized');
      }

      const now = new Date();

      // Create version snapshot before finalizing
      await this.createVersionSnapshot(noteId, existing, finalizationData.userId, 'Finalization');

      const query = `
        UPDATE soap_notes
        SET 
          status = 'finalized',
          finalized_at = $2,
          finalized_by = $3,
          attestation = $4,
          signature = $5,
          diagnoses = $6,
          version = version + 1,
          updated_by = $3,
          updated_at = $2,
          locked_by = NULL,
          locked_at = NULL
        WHERE id = $1
        RETURNING *
      `;

      const values = [
        noteId,
        now,
        finalizationData.userId,
        finalizationData.attestation,
        finalizationData.signature || null,
        finalizationData.finalDiagnoses ? JSON.stringify(finalizationData.finalDiagnoses) : existing.diagnoses
      ];

      const result = await db.query(query, values);

      if (result.rows.length === 0) return null;

      const finalizedNote = SOAPNoteModel.fromDatabaseRow(result.rows[0]);

      logDocumentFinalization({
        documentId: noteId,
        documentType: 'soap-note',
        patientId: finalizedNote.patientId,
        finalizedBy: finalizationData.userId
      });

      logger.info(`Finalized SOAP note ${noteId} by user ${finalizationData.userId}`);

      return finalizedNote;
    } catch (error: any) {
      logger.error(`Error finalizing SOAP note ${noteId}:`, error);
      throw error;
    }
  }

  /**
   * Create amendment to a finalized SOAP note
   */
  async createAmendment(
    originalNoteId: string,
    amendmentData: {
      reason: string;
      changes: string;
      section: 'subjective' | 'objective' | 'assessment' | 'plan' | 'all';
      userId: string;
    }
  ): Promise<SOAPNote | null> {
    try {
      // Get original note
      const original = await this.getSOAPNoteById(originalNoteId, amendmentData.userId);
      
      if (!original) {
        throw new Error('Original SOAP note not found');
      }

      if (original.status !== 'finalized') {
        throw new Error('Can only amend finalized notes');
      }

      const amendmentId = uuidv4();
      const now = new Date();

      // Calculate amendment number
      const countQuery = `
        SELECT COUNT(*) as count 
        FROM soap_notes 
        WHERE original_note_id = $1
      `;
      const countResult = await db.query(countQuery, [originalNoteId]);
      const amendmentNumber = parseInt(countResult.rows[0].count) + 1;

      // Create amendment as a new note
      const query = `
        INSERT INTO soap_notes (
          id, patient_id, encounter_id, facility_id, organization_id,
          subjective, objective, assessment, plan,
          chief_complaint, vital_signs, diagnoses, medications, orders, follow_up,
          status, is_amendment, original_note_id, amendment_reason, amendment_date, amendment_number,
          version, created_by, document_date, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26
        )
        RETURNING *
      `;

      const values = [
        amendmentId,
        original.patientId,
        original.encounterId,
        original.facilityId || null,
        original.organizationId,
        original.subjective + `\n\n[AMENDMENT ${amendmentNumber}]: ${amendmentData.changes}`,
        original.objective,
        original.assessment,
        original.plan,
        original.chiefComplaint,
        original.vitalSigns ? JSON.stringify(original.vitalSigns) : null,
        original.diagnoses ? JSON.stringify(original.diagnoses) : null,
        original.medications ? JSON.stringify(original.medications) : null,
        original.orders ? JSON.stringify(original.orders) : null,
        original.followUp ? JSON.stringify(original.followUp) : null,
        'amended', // Status
        true, // is_amendment
        originalNoteId,
        amendmentData.reason,
        now,
        amendmentNumber,
        1, // Version (new document)
        amendmentData.userId,
        original.documentDate,
        now,
        now
      ];

      const result = await db.query(query, values);
      const amendment = SOAPNoteModel.fromDatabaseRow(result.rows[0]);

      // Update original note status
      await db.query(
        `UPDATE soap_notes SET status = 'amended' WHERE id = $1`,
        [originalNoteId]
      );

      logClinicalDocumentAction({
        action: 'amended',
        documentType: 'soap-note',
        documentId: amendmentId,
        patientId: original.patientId,
        userId: amendmentData.userId,
        facilityId: original.facilityId
      });

      logger.info(`Created amendment ${amendmentId} for SOAP note ${originalNoteId}`);

      return amendment;
    } catch (error: any) {
      logger.error(`Error creating amendment for SOAP note ${originalNoteId}:`, error);
      throw error;
    }
  }

  /**
   * Get SOAP notes for a patient
   */
  async getSOAPNotesByPatient(
    patientId: string,
    options?: {
      encounterId?: string;
      status?: SOAPNote['status'];
      fromDate?: Date;
      toDate?: Date;
      page?: number;
      limit?: number;
    }
  ): Promise<{ notes: SOAPNote[]; total: number }> {
    try {
      let query = `
        SELECT * FROM soap_notes
        WHERE patient_id = $1 AND deleted_at IS NULL
      `;
      const params: any[] = [patientId];
      let paramIndex = 2;

      if (options?.encounterId) {
        query += ` AND encounter_id = $${paramIndex}`;
        params.push(options.encounterId);
        paramIndex++;
      }

      if (options?.status) {
        query += ` AND status = $${paramIndex}`;
        params.push(options.status);
        paramIndex++;
      }

      if (options?.fromDate) {
        query += ` AND document_date >= $${paramIndex}`;
        params.push(options.fromDate);
        paramIndex++;
      }

      if (options?.toDate) {
        query += ` AND document_date <= $${paramIndex}`;
        params.push(options.toDate);
        paramIndex++;
      }

      query += ` ORDER BY document_date DESC, created_at DESC`;

      // Pagination
      const page = options?.page || 1;
      const limit = options?.limit || 10;
      const offset = (page - 1) * limit;

      query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const result = await db.query(query, params);

      // Get total count
      let countQuery = `
        SELECT COUNT(*) as total FROM soap_notes
        WHERE patient_id = $1 AND deleted_at IS NULL
      `;
      const countParams: any[] = [patientId];
      let countParamIndex = 2;

      if (options?.encounterId) {
        countQuery += ` AND encounter_id = $${countParamIndex}`;
        countParams.push(options.encounterId);
        countParamIndex++;
      }
      if (options?.status) {
        countQuery += ` AND status = $${countParamIndex}`;
        countParams.push(options.status);
        countParamIndex++;
      }

      const countResult = await db.query(countQuery, countParams);
      const total = parseInt(countResult.rows[0].total);

      const notes = result.rows.map(row => SOAPNoteModel.fromDatabaseRow(row));

      return { notes, total };
    } catch (error: any) {
      logger.error(`Error getting SOAP notes for patient ${patientId}:`, error);
      throw error;
    }
  }

  /**
   * Lock note for editing (prevent concurrent edits)
   */
  async lockNote(noteId: string, userId: string): Promise<boolean> {
    try {
      const query = `
        UPDATE soap_notes
        SET locked_by = $2, locked_at = $3
        WHERE id = $1 AND (locked_by IS NULL OR locked_by = $2 OR locked_at < NOW() - INTERVAL '30 minutes')
        RETURNING id
      `;

      const result = await db.query(query, [noteId, userId, new Date()]);

      return result.rows.length > 0;
    } catch (error: any) {
      logger.error(`Error locking SOAP note ${noteId}:`, error);
      return false;
    }
  }

  /**
   * Unlock note
   */
  async unlockNote(noteId: string, userId: string): Promise<boolean> {
    try {
      const query = `
        UPDATE soap_notes
        SET locked_by = NULL, locked_at = NULL
        WHERE id = $1 AND locked_by = $2
        RETURNING id
      `;

      const result = await db.query(query, [noteId, userId]);

      return result.rows.length > 0;
    } catch (error: any) {
      logger.error(`Error unlocking SOAP note ${noteId}:`, error);
      return false;
    }
  }

  /**
   * Create version snapshot (for audit trail)
   */
  private async createVersionSnapshot(
    noteId: string,
    note: SOAPNote,
    userId: string,
    reason: string
  ): Promise<void> {
    try {
      const versionId = uuidv4();
      
      const query = `
        INSERT INTO soap_note_versions (
          id, note_id, version, snapshot, changed_by, changed_at, change_reason
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `;

      const snapshot = {
        subjective: note.subjective,
        objective: note.objective,
        assessment: note.assessment,
        plan: note.plan,
        diagnoses: note.diagnoses,
        medications: note.medications
      };

      await db.query(query, [
        versionId,
        noteId,
        note.version,
        JSON.stringify(snapshot),
        userId,
        new Date(),
        reason
      ]);

      logger.info(`Created version snapshot for SOAP note ${noteId} (version ${note.version})`);
    } catch (error: any) {
      // Non-critical error - log but don't throw
      logger.warn(`Failed to create version snapshot for SOAP note ${noteId}:`, error.message);
    }
  }

  /**
   * Track document view (HIPAA audit requirement)
   */
  private async trackView(noteId: string, userId: string): Promise<void> {
    try {
      const query = `
        UPDATE soap_notes
        SET viewed_by = array_append(viewed_by, $2)
        WHERE id = $1 AND NOT ($2 = ANY(viewed_by))
      `;

      await db.query(query, [noteId, userId]);

      logClinicalDocumentAction({
        action: 'viewed',
        documentType: 'soap-note',
        documentId: noteId,
        patientId: 'tracked-separately', // Don't duplicate in this log
        userId
      });
    } catch (error: any) {
      // Non-critical - log but don't throw
      logger.warn(`Failed to track view for SOAP note ${noteId}:`, error.message);
    }
  }

  /**
   * Get note versions/history
   */
  async getNoteVersions(noteId: string): Promise<SOAPNoteVersion[]> {
    try {
      const query = `
        SELECT * FROM soap_note_versions
        WHERE note_id = $1
        ORDER BY version DESC
      `;

      const result = await db.query(query, [noteId]);

      return result.rows.map(row => ({
        versionId: row.id,
        noteId: row.note_id,
        version: row.version,
        snapshot: row.snapshot,
        changedBy: row.changed_by,
        changedAt: row.changed_at,
        changeReason: row.change_reason
      }));
    } catch (error: any) {
      logger.error(`Error getting versions for SOAP note ${noteId}:`, error);
      return [];
    }
  }

  /**
   * Delete SOAP note (soft delete)
   */
  async deleteSOAPNote(noteId: string, userId: string, reason: string): Promise<boolean> {
    try {
      const query = `
        UPDATE soap_notes
        SET 
          deleted_at = $2,
          deleted_by = $3,
          deletion_reason = $4,
          updated_at = $2
        WHERE id = $1 AND status = 'draft'
        RETURNING id
      `;

      const result = await db.query(query, [noteId, new Date(), userId, reason]);

      if (result.rows.length === 0) {
        throw new Error('Cannot delete finalized note');
      }

      logger.info(`Soft deleted SOAP note ${noteId} by user ${userId}`);

      return true;
    } catch (error: any) {
      logger.error(`Error deleting SOAP note ${noteId}:`, error);
      throw error;
    }
  }

  /**
   * Search SOAP notes
   */
  async searchNotes(searchOptions: {
    organizationId: string;
    facilityId?: string;
    patientId?: string;
    encounterId?: string;
    status?: SOAPNote['status'];
    fromDate?: Date;
    toDate?: Date;
    createdBy?: string;
    searchText?: string;
    tags?: string[];
    page?: number;
    limit?: number;
  }): Promise<{ notes: SOAPNote[]; total: number }> {
    try {
      let query = `
        SELECT * FROM soap_notes
        WHERE organization_id = $1 AND deleted_at IS NULL
      `;
      const params: any[] = [searchOptions.organizationId];
      let paramIndex = 2;

      if (searchOptions.facilityId) {
        query += ` AND facility_id = $${paramIndex}`;
        params.push(searchOptions.facilityId);
        paramIndex++;
      }

      if (searchOptions.patientId) {
        query += ` AND patient_id = $${paramIndex}`;
        params.push(searchOptions.patientId);
        paramIndex++;
      }

      if (searchOptions.encounterId) {
        query += ` AND encounter_id = $${paramIndex}`;
        params.push(searchOptions.encounterId);
        paramIndex++;
      }

      if (searchOptions.status) {
        query += ` AND status = $${paramIndex}`;
        params.push(searchOptions.status);
        paramIndex++;
      }

      if (searchOptions.createdBy) {
        query += ` AND created_by = $${paramIndex}`;
        params.push(searchOptions.createdBy);
        paramIndex++;
      }

      if (searchOptions.fromDate) {
        query += ` AND document_date >= $${paramIndex}`;
        params.push(searchOptions.fromDate);
        paramIndex++;
      }

      if (searchOptions.toDate) {
        query += ` AND document_date <= $${paramIndex}`;
        params.push(searchOptions.toDate);
        paramIndex++;
      }

      if (searchOptions.searchText) {
        query += ` AND (
          subjective ILIKE $${paramIndex} OR 
          objective ILIKE $${paramIndex} OR 
          assessment ILIKE $${paramIndex} OR 
          plan ILIKE $${paramIndex} OR
          chief_complaint ILIKE $${paramIndex}
        )`;
        params.push(`%${searchOptions.searchText}%`);
        paramIndex++;
      }

      if (searchOptions.tags && searchOptions.tags.length > 0) {
        query += ` AND tags && $${paramIndex}`;
        params.push(searchOptions.tags);
        paramIndex++;
      }

      query += ` ORDER BY document_date DESC, created_at DESC`;

      // Pagination
      const page = searchOptions.page || 1;
      const limit = searchOptions.limit || 10;
      const offset = (page - 1) * limit;

      query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const result = await db.query(query, params);

      // Get total count (simplified count query)
      const countQuery = query.replace(/SELECT \* FROM/, 'SELECT COUNT(*) as total FROM')
                              .replace(/ORDER BY.*$/, '')
                              .replace(/LIMIT.*$/, '');
      const countResult = await db.query(countQuery, params.slice(0, -2)); // Remove LIMIT/OFFSET params
      const total = parseInt(countResult.rows[0].total);

      const notes = result.rows.map(row => SOAPNoteModel.fromDatabaseRow(row));

      return { notes, total };
    } catch (error: any) {
      logger.error('Error searching SOAP notes:', error);
      throw error;
    }
  }

  /**
   * Get statistics for dashboard
   */
  async getStatistics(organizationId: string, facilityId?: string): Promise<{
    total: number;
    byStatus: Record<SOAPNote['status'], number>;
    recentNotes: number; // Last 7 days
    needsFinalization: number;
  }> {
    try {
      let query = `
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft,
          COUNT(CASE WHEN status = 'finalized' THEN 1 END) as finalized,
          COUNT(CASE WHEN status = 'amended' THEN 1 END) as amended,
          COUNT(CASE WHEN status = 'addended' THEN 1 END) as addended,
          COUNT(CASE WHEN document_date > NOW() - INTERVAL '7 days' THEN 1 END) as recent
        FROM soap_notes
        WHERE organization_id = $1 AND deleted_at IS NULL
      `;
      const params: any[] = [organizationId];

      if (facilityId) {
        query += ` AND facility_id = $2`;
        params.push(facilityId);
      }

      const result = await db.query(query, params);
      const row = result.rows[0];

      return {
        total: parseInt(row.total || '0'),
        byStatus: {
          draft: parseInt(row.draft || '0'),
          finalized: parseInt(row.finalized || '0'),
          amended: parseInt(row.amended || '0'),
          addended: parseInt(row.addended || '0')
        },
        recentNotes: parseInt(row.recent || '0'),
        needsFinalization: parseInt(row.draft || '0')
      };
    } catch (error: any) {
      logger.error('Error getting SOAP note statistics:', error);
      throw error;
    }
  }
}

export default SOAPNotesService;

