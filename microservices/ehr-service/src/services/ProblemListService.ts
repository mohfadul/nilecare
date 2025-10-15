/**
 * Problem List Service
 * 
 * Manages patient problem lists (active diagnoses and conditions)
 * Critical for clinical decision support and continuity of care
 * Integrates with CDS Service for contraindication checking
 * 
 * Reference: OpenEMR problem list module
 * @see https://github.com/mohfadul/openemr-nilecare
 */

import { v4 as uuidv4 } from 'uuid';
import { db } from '../utils/database';
import { logger, logClinicalDocumentAction } from '../utils/logger';
import { ProblemListItem, ProblemListSummary, ProblemListStats, ProblemListModel } from '../models/ProblemList';

export class ProblemListService {
  /**
   * Add problem to patient's problem list
   */
  async addProblem(problemData: {
    patientId: string;
    facilityId?: string;
    organizationId: string;
    problemName: string;
    icdCode: string;
    snomedCode?: string;
    onset?: Date;
    severity: ProblemListItem['severity'];
    status: ProblemListItem['status'];
    diagnosedBy?: string;
    diagnosedDate?: Date;
    notes?: string;
    clinicalSignificance?: ProblemListItem['clinicalSignificance'];
    category: ProblemListItem['category'];
    priority: ProblemListItem['priority'];
    relatedProblems?: string[];
    currentTreatments?: any[];
    tags?: string[];
    isChronicCondition?: boolean;
    requiresMonitoring?: boolean;
    monitoringInterval?: string;
    createdBy: string;
  }): Promise<ProblemListItem> {
    try {
      // Validate ICD-10 code
      if (!ProblemListModel.validateICD10(problemData.icdCode)) {
        throw new Error(`Invalid ICD-10 code format: ${problemData.icdCode}`);
      }

      // Validate SNOMED code if provided
      if (problemData.snomedCode && !ProblemListModel.validateSNOMED(problemData.snomedCode)) {
        throw new Error(`Invalid SNOMED code format: ${problemData.snomedCode}`);
      }

      const problemId = uuidv4();
      const now = new Date();

      const query = `
        INSERT INTO problem_list (
          id, patient_id, facility_id, organization_id,
          problem_name, icd_code, snomed_code,
          onset, severity, status,
          diagnosed_by, diagnosed_date, notes,
          clinical_significance, category, priority,
          related_problems, current_treatments, tags,
          is_chronic_condition, requires_monitoring, monitoring_interval,
          version, created_by, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26
        )
        RETURNING *
      `;

      const values = [
        problemId,
        problemData.patientId,
        problemData.facilityId || null,
        problemData.organizationId,
        problemData.problemName,
        problemData.icdCode,
        problemData.snomedCode || null,
        problemData.onset || null,
        problemData.severity,
        problemData.status,
        problemData.diagnosedBy || null,
        problemData.diagnosedDate || now,
        problemData.notes || null,
        problemData.clinicalSignificance || 'moderate',
        problemData.category,
        problemData.priority,
        problemData.relatedProblems || [],
        problemData.currentTreatments ? JSON.stringify(problemData.currentTreatments) : null,
        problemData.tags || [],
        problemData.isChronicCondition || false,
        problemData.requiresMonitoring || false,
        problemData.monitoringInterval || null,
        1, // Initial version
        problemData.createdBy,
        now,
        now
      ];

      const result = await db.query(query, values);
      const problem = ProblemListModel.fromDatabaseRow(result.rows[0]);

      logClinicalDocumentAction({
        action: 'created',
        documentType: 'problem-list',
        documentId: problemId,
        patientId: problemData.patientId,
        userId: problemData.createdBy,
        facilityId: problemData.facilityId
      });

      logger.info(`Added problem ${problemId} to patient ${problemData.patientId}: ${problemData.problemName}`);

      return problem;
    } catch (error: any) {
      logger.error('Error adding problem to problem list:', error);
      throw error;
    }
  }

  /**
   * Update problem
   */
  async updateProblem(
    problemId: string,
    updates: Partial<ProblemListItem>,
    userId: string
  ): Promise<ProblemListItem | null> {
    try {
      // Get existing problem
      const existing = await this.getProblemById(problemId);
      
      if (!existing) {
        throw new Error('Problem not found');
      }

      // Build dynamic update query
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (updates.problemName !== undefined) {
        updateFields.push(`problem_name = $${paramIndex++}`);
        values.push(updates.problemName);
      }
      if (updates.icdCode !== undefined) {
        if (!ProblemListModel.validateICD10(updates.icdCode)) {
          throw new Error(`Invalid ICD-10 code format: ${updates.icdCode}`);
        }
        updateFields.push(`icd_code = $${paramIndex++}`);
        values.push(updates.icdCode);
      }
      if (updates.snomedCode !== undefined) {
        if (updates.snomedCode && !ProblemListModel.validateSNOMED(updates.snomedCode)) {
          throw new Error(`Invalid SNOMED code format: ${updates.snomedCode}`);
        }
        updateFields.push(`snomed_code = $${paramIndex++}`);
        values.push(updates.snomedCode);
      }
      if (updates.onset !== undefined) {
        updateFields.push(`onset = $${paramIndex++}`);
        values.push(updates.onset);
      }
      if (updates.severity !== undefined) {
        updateFields.push(`severity = $${paramIndex++}`);
        values.push(updates.severity);
      }
      if (updates.status !== undefined) {
        updateFields.push(`status = $${paramIndex++}`);
        values.push(updates.status);
        
        // If status is changed to resolved, record resolved date
        if (updates.status === 'resolved' && !existing.resolvedDate) {
          updateFields.push(`resolved_date = $${paramIndex++}`);
          values.push(new Date());
          updateFields.push(`resolved_by = $${paramIndex++}`);
          values.push(userId);
        }
      }
      if (updates.notes !== undefined) {
        updateFields.push(`notes = $${paramIndex++}`);
        values.push(updates.notes);
      }
      if (updates.clinicalSignificance !== undefined) {
        updateFields.push(`clinical_significance = $${paramIndex++}`);
        values.push(updates.clinicalSignificance);
      }
      if (updates.priority !== undefined) {
        updateFields.push(`priority = $${paramIndex++}`);
        values.push(updates.priority);
      }
      if (updates.relatedProblems !== undefined) {
        updateFields.push(`related_problems = $${paramIndex++}`);
        values.push(updates.relatedProblems);
      }
      if (updates.currentTreatments !== undefined) {
        updateFields.push(`current_treatments = $${paramIndex++}`);
        values.push(JSON.stringify(updates.currentTreatments));
      }
      if (updates.outcome !== undefined) {
        updateFields.push(`outcome = $${paramIndex++}`);
        values.push(updates.outcome);
        updateFields.push(`outcome_notes = $${paramIndex++}`);
        values.push(updates.outcomeNotes || null);
      }
      if (updates.requiresMonitoring !== undefined) {
        updateFields.push(`requires_monitoring = $${paramIndex++}`);
        values.push(updates.requiresMonitoring);
      }
      if (updates.monitoringInterval !== undefined) {
        updateFields.push(`monitoring_interval = $${paramIndex++}`);
        values.push(updates.monitoringInterval);
      }
      if (updates.tags !== undefined) {
        updateFields.push(`tags = $${paramIndex++}`);
        values.push(updates.tags);
      }

      // Always update these
      updateFields.push(`version = version + 1`);
      updateFields.push(`updated_by = $${paramIndex++}`);
      values.push(userId);
      updateFields.push(`updated_at = $${paramIndex++}`);
      values.push(new Date());

      // WHERE clause
      values.push(problemId);
      const whereClause = `WHERE id = $${paramIndex}`;

      const query = `
        UPDATE problem_list
        SET ${updateFields.join(', ')}
        ${whereClause}
        RETURNING *
      `;

      const result = await db.query(query, values);

      if (result.rows.length === 0) return null;

      const updatedProblem = ProblemListModel.fromDatabaseRow(result.rows[0]);

      logClinicalDocumentAction({
        action: 'updated',
        documentType: 'problem-list',
        documentId: problemId,
        patientId: updatedProblem.patientId,
        userId,
        facilityId: updatedProblem.facilityId
      });

      logger.info(`Updated problem ${problemId}`);

      return updatedProblem;
    } catch (error: any) {
      logger.error(`Error updating problem ${problemId}:`, error);
      throw error;
    }
  }

  /**
   * Get problem by ID
   */
  async getProblemById(problemId: string): Promise<ProblemListItem | null> {
    try {
      const query = `
        SELECT * FROM problem_list
        WHERE id = $1 AND deleted_at IS NULL
      `;

      const result = await db.query(query, [problemId]);

      if (result.rows.length === 0) return null;

      return ProblemListModel.fromDatabaseRow(result.rows[0]);
    } catch (error: any) {
      logger.error(`Error getting problem ${problemId}:`, error);
      throw error;
    }
  }

  /**
   * Get problem list for a patient
   */
  async getPatientProblemList(
    patientId: string,
    options?: {
      status?: ProblemListItem['status'] | 'all';
      activeOnly?: boolean;
      category?: ProblemListItem['category'];
      includeResolved?: boolean;
    }
  ): Promise<ProblemListItem[]> {
    try {
      let query = `
        SELECT * FROM problem_list
        WHERE patient_id = $1 AND deleted_at IS NULL
      `;
      const params: any[] = [patientId];
      let paramIndex = 2;

      if (options?.status && options.status !== 'all') {
        query += ` AND status = $${paramIndex}`;
        params.push(options.status);
        paramIndex++;
      }

      if (options?.activeOnly) {
        query += ` AND status IN ('active', 'chronic', 'intermittent', 'recurrent')`;
      }

      if (options?.category) {
        query += ` AND category = $${paramIndex}`;
        params.push(options.category);
        paramIndex++;
      }

      if (!options?.includeResolved) {
        query += ` AND status != 'resolved'`;
      }

      query += ` ORDER BY 
        CASE priority 
          WHEN 'high' THEN 1 
          WHEN 'medium' THEN 2 
          WHEN 'low' THEN 3 
        END,
        CASE severity
          WHEN 'severe' THEN 1
          WHEN 'moderate' THEN 2
          WHEN 'mild' THEN 3
        END,
        created_at DESC
      `;

      const result = await db.query(query, params);

      return result.rows.map(row => ProblemListModel.fromDatabaseRow(row));
    } catch (error: any) {
      logger.error(`Error getting problem list for patient ${patientId}:`, error);
      throw error;
    }
  }

  /**
   * Resolve a problem
   */
  async resolveProblem(
    problemId: string,
    resolutionData: {
      userId: string;
      resolvedDate?: Date;
      reason: string;
      outcome?: ProblemListItem['outcome'];
      outcomeNotes?: string;
    }
  ): Promise<ProblemListItem | null> {
    try {
      const query = `
        UPDATE problem_list
        SET 
          status = 'resolved',
          resolved_date = $2,
          resolved_by = $3,
          resolved_reason = $4,
          outcome = $5,
          outcome_notes = $6,
          version = version + 1,
          updated_by = $3,
          updated_at = $2
        WHERE id = $1 AND deleted_at IS NULL
        RETURNING *
      `;

      const resolvedDate = resolutionData.resolvedDate || new Date();

      const values = [
        problemId,
        resolvedDate,
        resolutionData.userId,
        resolutionData.reason,
        resolutionData.outcome || 'resolved',
        resolutionData.outcomeNotes || null
      ];

      const result = await db.query(query, values);

      if (result.rows.length === 0) return null;

      const problem = ProblemListModel.fromDatabaseRow(result.rows[0]);

      logClinicalDocumentAction({
        action: 'updated',
        documentType: 'problem-list',
        documentId: problemId,
        patientId: problem.patientId,
        userId: resolutionData.userId,
        facilityId: problem.facilityId
      });

      logger.info(`Resolved problem ${problemId} for patient ${problem.patientId}`);

      return problem;
    } catch (error: any) {
      logger.error(`Error resolving problem ${problemId}:`, error);
      throw error;
    }
  }

  /**
   * Reactivate a resolved problem
   */
  async reactivateProblem(
    problemId: string,
    reactivationData: {
      userId: string;
      reason: string;
      newSeverity?: ProblemListItem['severity'];
    }
  ): Promise<ProblemListItem | null> {
    try {
      const query = `
        UPDATE problem_list
        SET 
          status = 'recurrent',
          severity = COALESCE($2, severity),
          notes = CONCAT(COALESCE(notes, ''), E'\n\nReactivated: ', $3),
          resolved_date = NULL,
          resolved_by = NULL,
          resolved_reason = NULL,
          version = version + 1,
          updated_by = $4,
          updated_at = $5
        WHERE id = $1 AND status = 'resolved' AND deleted_at IS NULL
        RETURNING *
      `;

      const values = [
        problemId,
        reactivationData.newSeverity || null,
        reactivationData.reason,
        reactivationData.userId,
        new Date()
      ];

      const result = await db.query(query, values);

      if (result.rows.length === 0) return null;

      const problem = ProblemListModel.fromDatabaseRow(result.rows[0]);

      logger.info(`Reactivated problem ${problemId}`);

      return problem;
    } catch (error: any) {
      logger.error(`Error reactivating problem ${problemId}:`, error);
      throw error;
    }
  }

  /**
   * Get active problems (for CDS contraindication checking)
   */
  async getActiveProblemsForCDS(patientId: string): Promise<Array<{
    code: string;
    name: string;
    status: string;
  }>> {
    try {
      const query = `
        SELECT icd_code, problem_name, status
        FROM problem_list
        WHERE patient_id = $1 
          AND status IN ('active', 'chronic', 'intermittent', 'recurrent')
          AND deleted_at IS NULL
        ORDER BY priority DESC, severity DESC
      `;

      const result = await db.query(query, [patientId]);

      return result.rows.map(row => ({
        code: row.icd_code,
        name: row.problem_name,
        status: row.status
      }));
    } catch (error: any) {
      logger.error(`Error getting active problems for patient ${patientId}:`, error);
      throw error;
    }
  }

  /**
   * Search problems
   */
  async searchProblems(searchOptions: {
    organizationId: string;
    facilityId?: string;
    patientId?: string;
    icdCode?: string;
    status?: ProblemListItem['status'];
    severity?: ProblemListItem['severity'];
    category?: ProblemListItem['category'];
    searchText?: string;
    tags?: string[];
    activeOnly?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ problems: ProblemListItem[]; total: number }> {
    try {
      let query = `
        SELECT * FROM problem_list
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

      if (searchOptions.icdCode) {
        query += ` AND icd_code = $${paramIndex}`;
        params.push(searchOptions.icdCode);
        paramIndex++;
      }

      if (searchOptions.status) {
        query += ` AND status = $${paramIndex}`;
        params.push(searchOptions.status);
        paramIndex++;
      }

      if (searchOptions.severity) {
        query += ` AND severity = $${paramIndex}`;
        params.push(searchOptions.severity);
        paramIndex++;
      }

      if (searchOptions.category) {
        query += ` AND category = $${paramIndex}`;
        params.push(searchOptions.category);
        paramIndex++;
      }

      if (searchOptions.activeOnly) {
        query += ` AND status IN ('active', 'chronic', 'intermittent', 'recurrent')`;
      }

      if (searchOptions.searchText) {
        query += ` AND (
          problem_name ILIKE $${paramIndex} OR 
          notes ILIKE $${paramIndex} OR
          icd_code ILIKE $${paramIndex}
        )`;
        params.push(`%${searchOptions.searchText}%`);
        paramIndex++;
      }

      if (searchOptions.tags && searchOptions.tags.length > 0) {
        query += ` AND tags && $${paramIndex}`;
        params.push(searchOptions.tags);
        paramIndex++;
      }

      query += ` ORDER BY 
        CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
        CASE severity WHEN 'severe' THEN 1 WHEN 'moderate' THEN 2 ELSE 3 END,
        created_at DESC
      `;

      // Pagination
      const page = searchOptions.page || 1;
      const limit = searchOptions.limit || 10;
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

      const problems = result.rows.map(row => ProblemListModel.fromDatabaseRow(row));

      return { problems, total };
    } catch (error: any) {
      logger.error('Error searching problems:', error);
      throw error;
    }
  }

  /**
   * Get problem list statistics
   */
  async getStatistics(organizationId: string, facilityId?: string): Promise<ProblemListStats> {
    try {
      let query = `
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status IN ('active', 'chronic', 'intermittent', 'recurrent') THEN 1 END) as active,
          COUNT(CASE WHEN is_chronic_condition = true THEN 1 END) as chronic,
          COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved,
          status,
          severity,
          category,
          COUNT(*) as count
        FROM problem_list
        WHERE organization_id = $1 AND deleted_at IS NULL
      `;
      const params: any[] = [organizationId];

      if (facilityId) {
        query += ` AND facility_id = $2`;
        params.push(facilityId);
      }

      query += ` GROUP BY status, severity, category`;

      const result = await db.query(query, params);

      const stats: ProblemListStats = {
        totalProblems: 0,
        activeProblems: 0,
        chronicProblems: 0,
        resolvedProblems: 0,
        byCategory: {
          diagnosis: 0,
          symptom: 0,
          finding: 0,
          complaint: 0
        },
        bySeverity: {
          mild: 0,
          moderate: 0,
          severe: 0
        },
        byStatus: {
          active: 0,
          chronic: 0,
          intermittent: 0,
          recurrent: 0,
          inactive: 0,
          resolved: 0
        }
      };

      result.rows.forEach(row => {
        if (row.total) {
          stats.totalProblems = parseInt(row.total);
          stats.activeProblems = parseInt(row.active || '0');
          stats.chronicProblems = parseInt(row.chronic || '0');
          stats.resolvedProblems = parseInt(row.resolved || '0');
        }
        
        if (row.status) {
          stats.byStatus[row.status as ProblemListItem['status']] = 
            (stats.byStatus[row.status as ProblemListItem['status']] || 0) + parseInt(row.count);
        }
        
        if (row.severity) {
          stats.bySeverity[row.severity as ProblemListItem['severity']] = 
            (stats.bySeverity[row.severity as ProblemListItem['severity']] || 0) + parseInt(row.count);
        }
        
        if (row.category) {
          stats.byCategory[row.category as ProblemListItem['category']] = 
            (stats.byCategory[row.category as ProblemListItem['category']] || 0) + parseInt(row.count);
        }
      });

      return stats;
    } catch (error: any) {
      logger.error('Error getting problem list statistics:', error);
      throw error;
    }
  }

  /**
   * Delete problem (soft delete)
   */
  async deleteProblem(
    problemId: string,
    userId: string,
    reason: string
  ): Promise<boolean> {
    try {
      const query = `
        UPDATE problem_list
        SET 
          deleted_at = $2,
          deleted_by = $3,
          deletion_reason = $4,
          updated_at = $2
        WHERE id = $1 AND deleted_at IS NULL
        RETURNING id
      `;

      const result = await db.query(query, [problemId, new Date(), userId, reason]);

      if (result.rows.length === 0) {
        return false;
      }

      logger.info(`Soft deleted problem ${problemId} by user ${userId}: ${reason}`);

      return true;
    } catch (error: any) {
      logger.error(`Error deleting problem ${problemId}:`, error);
      throw error;
    }
  }

  /**
   * Link problem to encounter
   */
  async linkProblemToEncounter(
    problemId: string,
    encounterId: string,
    userId: string
  ): Promise<boolean> {
    try {
      const query = `
        UPDATE problem_list
        SET 
          related_encounters = array_append(related_encounters, $2),
          updated_by = $3,
          updated_at = $4
        WHERE id = $1 AND NOT ($2 = ANY(related_encounters))
        RETURNING id
      `;

      const result = await db.query(query, [problemId, encounterId, userId, new Date()]);

      return result.rows.length > 0;
    } catch (error: any) {
      logger.error(`Error linking problem ${problemId} to encounter ${encounterId}:`, error);
      return false;
    }
  }
}

export default ProblemListService;

