/**
 * Progress Note Service
 * 
 * Manages progress notes (daily notes, shift notes, discharge summaries, etc.)
 * Supports various clinical note types with type-specific validation
 * 
 * Reference: OpenEMR clinical notes module
 * @see https://github.com/mohfadul/openemr-nilecare
 */

import { v4 as uuidv4 } from 'uuid';
import { db } from '../utils/database';
import { logger, logClinicalDocumentAction, logDocumentFinalization } from '../utils/logger';
import { ProgressNote, ProgressNoteSummary, ProgressNoteModel } from '../models/ProgressNote';

export class ProgressNoteService {
  /**
   * Create a new progress note
   */
  async createProgressNote(noteData: {
    patientId: string;
    encounterId?: string;
    facilityId?: string;
    organizationId: string;
    noteType: ProgressNote['noteType'];
    content: string;
    vitalSigns?: any;
    condition: ProgressNote['condition'];
    consciousness?: ProgressNote['consciousness'];
    medications?: any[];
    interventions?: any[];
    observations?: string[];
    concerns?: string[];
    followUpNeeded?: boolean;
    followUpDate?: Date;
    followUpInstructions?: string;
    shiftStart?: Date;
    shiftEnd?: Date;
    shiftType?: ProgressNote['shiftType'];
    handoff?: any;
    procedureDetails?: any;
    dischargeDetails?: any;
    consultationDetails?: any;
    tags?: string[];
    createdBy: string;
  }): Promise<ProgressNote> {
    try {
      const noteId = uuidv4();
      const now = new Date();

      const query = `
        INSERT INTO progress_notes (
          id, patient_id, encounter_id, facility_id, organization_id,
          note_type, note_date, content,
          vital_signs, condition, consciousness,
          medications, interventions, observations, concerns,
          follow_up_needed, follow_up_date, follow_up_instructions,
          shift_start, shift_end, shift_type, handoff,
          procedure_details, discharge_details, consultation_details,
          status, version, tags,
          created_by, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31
        )
        RETURNING *
      `;

      const values = [
        noteId,
        noteData.patientId,
        noteData.encounterId || null,
        noteData.facilityId || null,
        noteData.organizationId,
        noteData.noteType,
        now, // note_date
        noteData.content,
        noteData.vitalSigns ? JSON.stringify(noteData.vitalSigns) : null,
        noteData.condition,
        noteData.consciousness || null,
        noteData.medications ? JSON.stringify(noteData.medications) : null,
        noteData.interventions ? JSON.stringify(noteData.interventions) : null,
        noteData.observations || [],
        noteData.concerns || [],
        noteData.followUpNeeded || false,
        noteData.followUpDate || null,
        noteData.followUpInstructions || null,
        noteData.shiftStart || null,
        noteData.shiftEnd || null,
        noteData.shiftType || null,
        noteData.handoff ? JSON.stringify(noteData.handoff) : null,
        noteData.procedureDetails ? JSON.stringify(noteData.procedureDetails) : null,
        noteData.dischargeDetails ? JSON.stringify(noteData.dischargeDetails) : null,
        noteData.consultationDetails ? JSON.stringify(noteData.consultationDetails) : null,
        'draft', // Initial status
        1, // Initial version
        noteData.tags || [],
        noteData.createdBy,
        now,
        now
      ];

      const result = await db.query(query, values);
      const note = ProgressNoteModel.fromDatabaseRow(result.rows[0]);

      logClinicalDocumentAction({
        action: 'created',
        documentType: 'progress-note',
        documentId: noteId,
        patientId: noteData.patientId,
        userId: noteData.createdBy,
        facilityId: noteData.facilityId
      });

      logger.info(`Created ${noteData.noteType} progress note ${noteId} for patient ${noteData.patientId}`);

      return note;
    } catch (error: any) {
      logger.error('Error creating progress note:', error);
      throw error;
    }
  }

  /**
   * Get progress note by ID
   */
  async getProgressNoteById(noteId: string, userId: string): Promise<ProgressNote | null> {
    try {
      const query = `
        SELECT * FROM progress_notes
        WHERE id = $1
      `;

      const result = await db.query(query, [noteId]);

      if (result.rows.length === 0) return null;

      const note = ProgressNoteModel.fromDatabaseRow(result.rows[0]);

      // Track view for HIPAA audit
      await this.trackView(noteId, userId);

      return note;
    } catch (error: any) {
      logger.error(`Error getting progress note ${noteId}:`, error);
      throw error;
    }
  }

  /**
   * Update progress note (only if draft)
   */
  async updateProgressNote(
    noteId: string,
    updates: Partial<ProgressNote>,
    userId: string
  ): Promise<ProgressNote | null> {
    try {
      const existing = await this.getProgressNoteById(noteId, userId);
      
      if (!existing) {
        throw new Error('Progress note not found');
      }

      if (!ProgressNoteModel.canEdit(existing)) {
        throw new Error('Cannot edit finalized note');
      }

      if (ProgressNoteModel.isLocked(existing, userId)) {
        throw new Error('Note is locked by another user');
      }

      // Build dynamic update query
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (updates.content !== undefined) {
        updateFields.push(`content = $${paramIndex++}`);
        values.push(updates.content);
      }
      if (updates.vitalSigns !== undefined) {
        updateFields.push(`vital_signs = $${paramIndex++}`);
        values.push(JSON.stringify(updates.vitalSigns));
      }
      if (updates.condition !== undefined) {
        updateFields.push(`condition = $${paramIndex++}`);
        values.push(updates.condition);
      }
      if (updates.consciousness !== undefined) {
        updateFields.push(`consciousness = $${paramIndex++}`);
        values.push(updates.consciousness);
      }
      if (updates.medications !== undefined) {
        updateFields.push(`medications = $${paramIndex++}`);
        values.push(JSON.stringify(updates.medications));
      }
      if (updates.interventions !== undefined) {
        updateFields.push(`interventions = $${paramIndex++}`);
        values.push(JSON.stringify(updates.interventions));
      }
      if (updates.observations !== undefined) {
        updateFields.push(`observations = $${paramIndex++}`);
        values.push(updates.observations);
      }
      if (updates.concerns !== undefined) {
        updateFields.push(`concerns = $${paramIndex++}`);
        values.push(updates.concerns);
      }
      if (updates.followUpNeeded !== undefined) {
        updateFields.push(`follow_up_needed = $${paramIndex++}`);
        values.push(updates.followUpNeeded);
      }
      if (updates.followUpDate !== undefined) {
        updateFields.push(`follow_up_date = $${paramIndex++}`);
        values.push(updates.followUpDate);
      }
      if (updates.followUpInstructions !== undefined) {
        updateFields.push(`follow_up_instructions = $${paramIndex++}`);
        values.push(updates.followUpInstructions);
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
        UPDATE progress_notes
        SET ${updateFields.join(', ')}
        ${whereClause}
        RETURNING *
      `;

      const result = await db.query(query, values);

      if (result.rows.length === 0) return null;

      const updatedNote = ProgressNoteModel.fromDatabaseRow(result.rows[0]);

      logClinicalDocumentAction({
        action: 'updated',
        documentType: 'progress-note',
        documentId: noteId,
        patientId: updatedNote.patientId,
        userId,
        facilityId: updatedNote.facilityId
      });

      logger.info(`Updated progress note ${noteId}`);

      return updatedNote;
    } catch (error: any) {
      logger.error(`Error updating progress note ${noteId}:`, error);
      throw error;
    }
  }

  /**
   * Finalize progress note
   */
  async finalizeProgressNote(
    noteId: string,
    userId: string
  ): Promise<ProgressNote | null> {
    try {
      const existing = await this.getProgressNoteById(noteId, userId);
      
      if (!existing) {
        throw new Error('Progress note not found');
      }

      if (!ProgressNoteModel.canFinalize(existing)) {
        throw new Error('Note cannot be finalized - content is incomplete');
      }

      if (existing.status !== 'draft') {
        throw new Error('Only draft notes can be finalized');
      }

      // Type-specific validation
      if (existing.noteType === 'shift' && !ProgressNoteModel.validateShiftNote(existing)) {
        throw new Error('Shift note is missing required fields (shift start/end/type)');
      }

      if (existing.noteType === 'discharge' && !ProgressNoteModel.validateDischargeNote(existing)) {
        throw new Error('Discharge note is missing required fields (disposition/instructions)');
      }

      if (existing.noteType === 'procedure' && !ProgressNoteModel.validateProcedureNote(existing)) {
        throw new Error('Procedure note is missing required fields (procedure details)');
      }

      const now = new Date();

      const query = `
        UPDATE progress_notes
        SET 
          status = 'finalized',
          finalized_at = $2,
          finalized_by = $3,
          version = version + 1,
          updated_by = $3,
          updated_at = $2,
          locked_by = NULL,
          locked_at = NULL
        WHERE id = $1
        RETURNING *
      `;

      const result = await db.query(query, [noteId, now, userId]);

      if (result.rows.length === 0) return null;

      const finalizedNote = ProgressNoteModel.fromDatabaseRow(result.rows[0]);

      logDocumentFinalization({
        documentId: noteId,
        documentType: 'progress-note',
        patientId: finalizedNote.patientId,
        finalizedBy: userId
      });

      logger.info(`Finalized progress note ${noteId} by user ${userId}`);

      return finalizedNote;
    } catch (error: any) {
      logger.error(`Error finalizing progress note ${noteId}:`, error);
      throw error;
    }
  }

  /**
   * Get progress notes for a patient
   */
  async getProgressNotesByPatient(
    patientId: string,
    options?: {
      noteType?: ProgressNote['noteType'];
      encounterId?: string;
      condition?: ProgressNote['condition'];
      fromDate?: Date;
      toDate?: Date;
      page?: number;
      limit?: number;
    }
  ): Promise<{ notes: ProgressNote[]; total: number }> {
    try {
      let query = `
        SELECT * FROM progress_notes
        WHERE patient_id = $1
      `;
      const params: any[] = [patientId];
      let paramIndex = 2;

      if (options?.noteType) {
        query += ` AND note_type = $${paramIndex}`;
        params.push(options.noteType);
        paramIndex++;
      }

      if (options?.encounterId) {
        query += ` AND encounter_id = $${paramIndex}`;
        params.push(options.encounterId);
        paramIndex++;
      }

      if (options?.condition) {
        query += ` AND condition = $${paramIndex}`;
        params.push(options.condition);
        paramIndex++;
      }

      if (options?.fromDate) {
        query += ` AND note_date >= $${paramIndex}`;
        params.push(options.fromDate);
        paramIndex++;
      }

      if (options?.toDate) {
        query += ` AND note_date <= $${paramIndex}`;
        params.push(options.toDate);
        paramIndex++;
      }

      query += ` ORDER BY note_date DESC, created_at DESC`;

      // Pagination
      const page = options?.page || 1;
      const limit = options?.limit || 10;
      const offset = (page - 1) * limit;

      query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const result = await db.query(query, params);

      // Get total count
      const countQuery = query.replace(/SELECT \* FROM/, 'SELECT COUNT(*) as total FROM')
                              .replace(/ORDER BY.*$/, '')
                              .replace(/LIMIT.*$/, '');
      const countResult = await db.query(countQuery, params.slice(0, -2));
      const total = parseInt(countResult.rows[0].total);

      const notes = result.rows.map(row => ProgressNoteModel.fromDatabaseRow(row));

      return { notes, total };
    } catch (error: any) {
      logger.error(`Error getting progress notes for patient ${patientId}:`, error);
      throw error;
    }
  }

  /**
   * Get recent notes requiring attention
   */
  async getNotesRequiringAttention(
    organizationId: string,
    facilityId?: string
  ): Promise<ProgressNote[]> {
    try {
      let query = `
        SELECT * FROM progress_notes
        WHERE organization_id = $1
          AND (
            condition IN ('critical', 'declining')
            OR (concerns IS NOT NULL AND array_length(concerns, 1) > 0)
            OR follow_up_needed = true
          )
          AND note_date > NOW() - INTERVAL '48 hours'
        ORDER BY 
          CASE condition 
            WHEN 'critical' THEN 1 
            WHEN 'declining' THEN 2 
            ELSE 3 
          END,
          note_date DESC
        LIMIT 50
      `;
      const params: any[] = [organizationId];

      if (facilityId) {
        query = query.replace('WHERE organization_id = $1', 'WHERE organization_id = $1 AND facility_id = $2');
        params.push(facilityId);
      }

      const result = await db.query(query, params);

      return result.rows.map(row => ProgressNoteModel.fromDatabaseRow(row));
    } catch (error: any) {
      logger.error('Error getting notes requiring attention:', error);
      throw error;
    }
  }

  /**
   * Lock note for editing
   */
  async lockNote(noteId: string, userId: string): Promise<boolean> {
    try {
      const query = `
        UPDATE progress_notes
        SET locked_by = $2, locked_at = $3
        WHERE id = $1 AND (locked_by IS NULL OR locked_by = $2 OR locked_at < NOW() - INTERVAL '30 minutes')
        RETURNING id
      `;

      const result = await db.query(query, [noteId, userId, new Date()]);

      return result.rows.length > 0;
    } catch (error: any) {
      logger.error(`Error locking progress note ${noteId}:`, error);
      return false;
    }
  }

  /**
   * Unlock note
   */
  async unlockNote(noteId: string, userId: string): Promise<boolean> {
    try {
      const query = `
        UPDATE progress_notes
        SET locked_by = NULL, locked_at = NULL
        WHERE id = $1 AND locked_by = $2
        RETURNING id
      `;

      const result = await db.query(query, [noteId, userId]);

      return result.rows.length > 0;
    } catch (error: any) {
      logger.error(`Error unlocking progress note ${noteId}:`, error);
      return false;
    }
  }

  /**
   * Track document view (HIPAA audit)
   */
  private async trackView(noteId: string, userId: string): Promise<void> {
    try {
      const query = `
        UPDATE progress_notes
        SET viewed_by = array_append(viewed_by, $2)
        WHERE id = $1 AND NOT ($2 = ANY(viewed_by))
      `;

      await db.query(query, [noteId, userId]);

      logClinicalDocumentAction({
        action: 'viewed',
        documentType: 'progress-note',
        documentId: noteId,
        patientId: 'tracked-separately',
        userId
      });
    } catch (error: any) {
      logger.warn(`Failed to track view for progress note ${noteId}:`, error.message);
    }
  }

  /**
   * Get statistics
   */
  async getStatistics(organizationId: string, facilityId?: string): Promise<{
    total: number;
    byType: Record<ProgressNote['noteType'], number>;
    byCondition: Record<ProgressNote['condition'], number>;
    recentNotes: number;
    needsFinalization: number;
    criticalNotes: number;
  }> {
    try {
      let query = `
        SELECT 
          COUNT(*) as total,
          note_type,
          condition,
          status,
          COUNT(*) as count,
          COUNT(CASE WHEN note_date > NOW() - INTERVAL '7 days' THEN 1 END) as recent,
          COUNT(CASE WHEN condition = 'critical' THEN 1 END) as critical
        FROM progress_notes
        WHERE organization_id = $1
      `;
      const params: any[] = [organizationId];

      if (facilityId) {
        query += ` AND facility_id = $2`;
        params.push(facilityId);
      }

      query += ` GROUP BY note_type, condition, status`;

      const result = await db.query(query, params);

      const stats: any = {
        total: 0,
        byType: {},
        byCondition: {},
        recentNotes: 0,
        needsFinalization: 0,
        criticalNotes: 0
      };

      result.rows.forEach(row => {
        if (row.total) stats.total = parseInt(row.total);
        if (row.recent) stats.recentNotes = parseInt(row.recent);
        if (row.critical) stats.criticalNotes = parseInt(row.critical);
        
        if (row.note_type) {
          stats.byType[row.note_type] = (stats.byType[row.note_type] || 0) + parseInt(row.count);
        }
        
        if (row.condition) {
          stats.byCondition[row.condition] = (stats.byCondition[row.condition] || 0) + parseInt(row.count);
        }
        
        if (row.status === 'draft') {
          stats.needsFinalization += parseInt(row.count);
        }
      });

      return stats;
    } catch (error: any) {
      logger.error('Error getting progress note statistics:', error);
      throw error;
    }
  }
}

export default ProgressNoteService;

