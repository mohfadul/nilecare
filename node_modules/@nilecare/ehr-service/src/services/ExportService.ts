/**
 * Export Service
 * 
 * Exports clinical documents to various formats (PDF, HTML, XML, FHIR)
 * Generates patient-facing summaries and provider-facing reports
 * 
 * Note: PDF generation requires external libraries in production
 * This implementation provides the structure and basic HTML export
 */

import { db } from '../utils/database';
import { logger, logClinicalDocumentAction } from '../utils/logger';
import { SOAPNote } from '../models/SOAPNote';
import { ProblemListItem } from '../models/ProblemList';
import { ProgressNote } from '../models/ProgressNote';

export class ExportService {
  /**
   * Export SOAP note to HTML
   */
  async exportSOAPNoteToHTML(
    noteId: string,
    options?: {
      includeSignatures?: boolean;
      includeWatermark?: boolean;
      letterhead?: boolean;
    }
  ): Promise<string> {
    try {
      // Get SOAP note
      const query = `SELECT * FROM soap_notes WHERE id = $1`;
      const result = await db.query(query, [noteId]);

      if (result.rows.length === 0) {
        throw new Error('SOAP note not found');
      }

      const note = result.rows[0];

      // Generate HTML
      const html = this.generateSOAPNoteHTML(note, options);

      logger.info(`Exported SOAP note ${noteId} to HTML`);

      return html;
    } catch (error: any) {
      logger.error(`Error exporting SOAP note ${noteId} to HTML:`, error);
      throw error;
    }
  }

  /**
   * Generate HTML for SOAP note
   */
  private generateSOAPNoteHTML(note: any, options?: any): string {
    const includeSignatures = options?.includeSignatures !== false;
    const includeWatermark = options?.includeWatermark || false;
    const letterhead = options?.letterhead || false;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SOAP Note - ${note.document_date}</title>
  <style>
    body {
      font-family: 'Arial', sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      ${includeWatermark ? 'background-image: url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCI+PHRleHQgeD0iNTAiIHk9IjUwIiBmb250LXNpemU9IjMwIiBvcGFjaXR5PSIwLjEiPkNPTkZJREVOVElBTDwvdGV4dD48L3N2Zz4=);' : ''}
    }
    .header {
      border-bottom: 2px solid #2c3e50;
      padding-bottom: 10px;
      margin-bottom: 20px;
    }
    h1 {
      color: #2c3e50;
      margin: 0;
    }
    .metadata {
      color: #7f8c8d;
      font-size: 14px;
      margin-top: 5px;
    }
    .section {
      margin-bottom: 25px;
      padding: 15px;
      background-color: #f8f9fa;
      border-left: 4px solid #3498db;
    }
    .section-title {
      font-weight: bold;
      color: #2c3e50;
      font-size: 18px;
      margin-bottom: 10px;
    }
    .vital-signs {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 10px;
      margin-top: 10px;
    }
    .vital-item {
      background-color: white;
      padding: 8px;
      border-radius: 4px;
      border: 1px solid #ddd;
    }
    .vital-label {
      font-size: 12px;
      color: #7f8c8d;
    }
    .vital-value {
      font-size: 16px;
      font-weight: bold;
      color: #2c3e50;
    }
    .diagnosis-item {
      background-color: white;
      padding: 8px;
      margin-bottom: 8px;
      border-radius: 4px;
      border-left: 3px solid #e74c3c;
    }
    .medication-item {
      background-color: white;
      padding: 8px;
      margin-bottom: 8px;
      border-radius: 4px;
      border-left: 3px solid #27ae60;
    }
    .signature {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #2c3e50;
      text-align: center;
      color: #7f8c8d;
      font-size: 12px;
    }
    .confidential-notice {
      background-color: #fff3cd;
      border: 1px solid #ffc107;
      padding: 10px;
      margin: 20px 0;
      text-align: center;
      font-weight: bold;
    }
  </style>
</head>
<body>
  ${letterhead ? '<div class="letterhead"><!-- Facility letterhead would go here --></div>' : ''}
  
  <div class="confidential-notice">
    ⚠️ CONFIDENTIAL MEDICAL RECORD - Protected Health Information (PHI)
  </div>

  <div class="header">
    <h1>SOAP Note</h1>
    <div class="metadata">
      <div>Date: ${new Date(note.document_date).toLocaleDateString()}</div>
      <div>Status: ${note.status.toUpperCase()}</div>
      ${note.chief_complaint ? `<div>Chief Complaint: ${note.chief_complaint}</div>` : ''}
    </div>
  </div>

  ${note.vital_signs ? this.generateVitalSignsHTML(note.vital_signs) : ''}

  <div class="section">
    <div class="section-title">S - Subjective</div>
    <div>${this.escapeHTML(note.subjective)}</div>
  </div>

  <div class="section">
    <div class="section-title">O - Objective</div>
    <div>${this.escapeHTML(note.objective)}</div>
  </div>

  <div class="section">
    <div class="section-title">A - Assessment</div>
    <div>${this.escapeHTML(note.assessment)}</div>
    ${note.diagnoses ? this.generateDiagnosesHTML(note.diagnoses) : ''}
  </div>

  <div class="section">
    <div class="section-title">P - Plan</div>
    <div>${this.escapeHTML(note.plan)}</div>
    ${note.medications ? this.generateMedicationsHTML(note.medications) : ''}
    ${note.orders ? this.generateOrdersHTML(note.orders) : ''}
  </div>

  ${note.follow_up ? this.generateFollowUpHTML(note.follow_up) : ''}

  ${includeSignatures && note.status === 'finalized' ? `
  <div class="signature">
    <div><strong>Finalized by:</strong> ${note.finalized_by || 'Unknown'}</div>
    <div><strong>Date:</strong> ${note.finalized_at ? new Date(note.finalized_at).toLocaleString() : 'N/A'}</div>
    ${note.attestation ? `<div><strong>Attestation:</strong> ${this.escapeHTML(note.attestation)}</div>` : ''}
    ${note.signature ? `<div><strong>Signature:</strong> ${note.signature}</div>` : ''}
  </div>
  ` : ''}

  <div class="footer">
    <div>Generated: ${new Date().toLocaleString()}</div>
    <div>Document ID: ${note.id}</div>
    <div>NileCare Electronic Health Record System</div>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Generate vital signs HTML
   */
  private generateVitalSignsHTML(vitalSigns: any): string {
    if (!vitalSigns) return '';

    const vs = typeof vitalSigns === 'string' ? JSON.parse(vitalSigns) : vitalSigns;

    return `
<div class="section">
  <div class="section-title">Vital Signs</div>
  <div class="vital-signs">
    ${vs.bloodPressure ? `
      <div class="vital-item">
        <div class="vital-label">Blood Pressure</div>
        <div class="vital-value">${vs.bloodPressure.systolic}/${vs.bloodPressure.diastolic} mmHg</div>
      </div>
    ` : ''}
    ${vs.heartRate ? `
      <div class="vital-item">
        <div class="vital-label">Heart Rate</div>
        <div class="vital-value">${vs.heartRate} bpm</div>
      </div>
    ` : ''}
    ${vs.temperature ? `
      <div class="vital-item">
        <div class="vital-label">Temperature</div>
        <div class="vital-value">${vs.temperature}°F</div>
      </div>
    ` : ''}
    ${vs.respiratoryRate ? `
      <div class="vital-item">
        <div class="vital-label">Respiratory Rate</div>
        <div class="vital-value">${vs.respiratoryRate} /min</div>
      </div>
    ` : ''}
    ${vs.oxygenSaturation ? `
      <div class="vital-item">
        <div class="vital-label">O₂ Saturation</div>
        <div class="vital-value">${vs.oxygenSaturation}%</div>
      </div>
    ` : ''}
  </div>
</div>
    `;
  }

  /**
   * Generate diagnoses HTML
   */
  private generateDiagnosesHTML(diagnoses: any): string {
    if (!diagnoses) return '';

    const diagList = typeof diagnoses === 'string' ? JSON.parse(diagnoses) : diagnoses;
    if (!Array.isArray(diagList) || diagList.length === 0) return '';

    return `
<div style="margin-top: 15px;">
  <strong>Diagnoses:</strong>
  ${diagList.map((d: any) => `
    <div class="diagnosis-item">
      <strong>${d.type?.toUpperCase() || 'DIAGNOSIS'}:</strong> ${this.escapeHTML(d.description || '')}
      ${d.code ? `<span style="color: #7f8c8d;"> (${d.code})</span>` : ''}
    </div>
  `).join('')}
</div>
    `;
  }

  /**
   * Generate medications HTML
   */
  private generateMedicationsHTML(medications: any): string {
    if (!medications) return '';

    const medList = typeof medications === 'string' ? JSON.parse(medications) : medications;
    if (!Array.isArray(medList) || medList.length === 0) return '';

    return `
<div style="margin-top: 15px;">
  <strong>Medications:</strong>
  ${medList.map((m: any) => `
    <div class="medication-item">
      <strong>${this.escapeHTML(m.name || '')}</strong> - ${this.escapeHTML(m.dosage || '')} ${this.escapeHTML(m.frequency || '')}
      ${m.action ? `<span style="color: #3498db;"> [${m.action.toUpperCase()}]</span>` : ''}
    </div>
  `).join('')}
</div>
    `;
  }

  /**
   * Generate orders HTML
   */
  private generateOrdersHTML(orders: any): string {
    if (!orders) return '';

    const orderList = typeof orders === 'string' ? JSON.parse(orders) : orders;
    if (!Array.isArray(orderList) || orderList.length === 0) return '';

    return `
<div style="margin-top: 15px;">
  <strong>Orders:</strong>
  <ul>
    ${orderList.map((o: any) => `
      <li><strong>${o.type?.toUpperCase()}:</strong> ${this.escapeHTML(o.description || '')}
        ${o.urgency ? ` <span style="color: #e74c3c;">[${o.urgency.toUpperCase()}]</span>` : ''}
      </li>
    `).join('')}
  </ul>
</div>
    `;
  }

  /**
   * Generate follow-up HTML
   */
  private generateFollowUpHTML(followUp: any): string {
    if (!followUp) return '';

    const fu = typeof followUp === 'string' ? JSON.parse(followUp) : followUp;

    return `
<div class="section">
  <div class="section-title">Follow-Up</div>
  ${fu.interval ? `<div><strong>Interval:</strong> ${this.escapeHTML(fu.interval)}</div>` : ''}
  ${fu.instructions ? `<div><strong>Instructions:</strong> ${this.escapeHTML(fu.instructions)}</div>` : ''}
  ${fu.provider ? `<div><strong>Provider:</strong> ${this.escapeHTML(fu.provider)}</div>` : ''}
</div>
    `;
  }

  /**
   * Export problem list to HTML
   */
  async exportProblemListToHTML(
    patientId: string,
    options?: {
      activeOnly?: boolean;
      includeResolved?: boolean;
    }
  ): Promise<string> {
    try {
      let query = `
        SELECT * FROM problem_list
        WHERE patient_id = $1 AND deleted_at IS NULL
      `;
      const params: any[] = [patientId];

      if (options?.activeOnly) {
        query += ` AND status IN ('active', 'chronic', 'intermittent', 'recurrent')`;
      }

      if (!options?.includeResolved) {
        query += ` AND status != 'resolved'`;
      }

      query += ` ORDER BY 
        CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
        CASE severity WHEN 'severe' THEN 1 WHEN 'moderate' THEN 2 ELSE 3 END
      `;

      const result = await db.query(query, params);

      const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Problem List</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { padding: 10px; text-align: left; border: 1px solid #ddd; }
    th { background-color: #2c3e50; color: white; }
    .severe { color: #e74c3c; font-weight: bold; }
    .moderate { color: #f39c12; }
    .mild { color: #27ae60; }
    .header { border-bottom: 2px solid #2c3e50; padding-bottom: 10px; margin-bottom: 20px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Problem List</h1>
    <div>Patient ID: ${patientId}</div>
    <div>Generated: ${new Date().toLocaleString()}</div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Problem</th>
        <th>ICD-10</th>
        <th>Status</th>
        <th>Severity</th>
        <th>Onset</th>
        <th>Notes</th>
      </tr>
    </thead>
    <tbody>
      ${result.rows.map(problem => `
        <tr>
          <td><strong>${this.escapeHTML(problem.problem_name)}</strong></td>
          <td>${problem.icd_code}</td>
          <td>${problem.status}</td>
          <td class="${problem.severity}">${problem.severity}</td>
          <td>${problem.onset ? new Date(problem.onset).toLocaleDateString() : 'Unknown'}</td>
          <td>${this.escapeHTML(problem.notes || '')}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div style="margin-top: 40px; text-align: center; color: #7f8c8d; font-size: 12px;">
    <div>NileCare Electronic Health Record System</div>
    <div>CONFIDENTIAL MEDICAL RECORD</div>
  </div>
</body>
</html>
      `.trim();

      logger.info(`Exported problem list for patient ${patientId} to HTML`);

      return html;
    } catch (error: any) {
      logger.error(`Error exporting problem list for patient ${patientId}:`, error);
      throw error;
    }
  }

  /**
   * Export progress note to HTML
   */
  async exportProgressNoteToHTML(noteId: string): Promise<string> {
    try {
      const query = `SELECT * FROM progress_notes WHERE id = $1`;
      const result = await db.query(query, [noteId]);

      if (result.rows.length === 0) {
        throw new Error('Progress note not found');
      }

      const note = result.rows[0];

      const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${note.note_type} Note - ${note.note_date}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
    .header { border-bottom: 2px solid #2c3e50; padding-bottom: 10px; margin-bottom: 20px; }
    h1 { color: #2c3e50; }
    .condition-badge {
      display: inline-block;
      padding: 5px 10px;
      border-radius: 4px;
      font-weight: bold;
      color: white;
      ${this.getConditionBadgeStyle(note.condition)}
    }
    .content { line-height: 1.8; white-space: pre-wrap; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${this.capitalizeFirstLetter(note.note_type)} Note</h1>
    <div>Date: ${new Date(note.note_date).toLocaleString()}</div>
    <div>Condition: <span class="condition-badge">${note.condition?.toUpperCase()}</span></div>
  </div>

  <div class="content">
    ${this.escapeHTML(note.content)}
  </div>

  ${note.concerns && Array.isArray(note.concerns) && note.concerns.length > 0 ? `
  <div style="margin-top: 20px; padding: 15px; background-color: #fff3cd; border-left: 4px solid #ffc107;">
    <strong>⚠️ Concerns:</strong>
    <ul>
      ${note.concerns.map((c: string) => `<li>${this.escapeHTML(c)}</li>`).join('')}
    </ul>
  </div>
  ` : ''}

  ${note.follow_up_needed ? `
  <div style="margin-top: 20px; padding: 15px; background-color: #e3f2fd; border-left: 4px solid #2196f3;">
    <strong>Follow-Up Required</strong>
    ${note.follow_up_date ? `<div>Date: ${new Date(note.follow_up_date).toLocaleDateString()}</div>` : ''}
    ${note.follow_up_instructions ? `<div>Instructions: ${this.escapeHTML(note.follow_up_instructions)}</div>` : ''}
  </div>
  ` : ''}

  <div style="margin-top: 40px; text-align: center; color: #7f8c8d; font-size: 12px;">
    <div>NileCare EHR System | Document ID: ${note.id}</div>
  </div>
</body>
</html>
      `.trim();

      logger.info(`Exported progress note ${noteId} to HTML`);

      return html;
    } catch (error: any) {
      logger.error(`Error exporting progress note ${noteId}:`, error);
      throw error;
    }
  }

  /**
   * Export to FHIR format (placeholder - full FHIR implementation would be more complex)
   */
  async exportSOAPNoteToFHIR(noteId: string): Promise<any> {
    try {
      const query = `SELECT * FROM soap_notes WHERE id = $1`;
      const result = await db.query(query, [noteId]);

      if (result.rows.length === 0) {
        throw new Error('SOAP note not found');
      }

      const note = result.rows[0];

      // FHIR DocumentReference resource
      const fhirResource = {
        resourceType: 'DocumentReference',
        id: note.id,
        status: note.status === 'finalized' ? 'current' : 'preliminary',
        docStatus: note.status,
        type: {
          coding: [{
            system: 'http://loinc.org',
            code: '34133-9',
            display: 'Summarization of episode note'
          }]
        },
        category: [{
          coding: [{
            system: 'http://loinc.org',
            code: '11488-4',
            display: 'Consultation note'
          }]
        }],
        subject: {
          reference: `Patient/${note.patient_id}`
        },
        date: note.document_date,
        author: [{
          reference: `Practitioner/${note.created_by}`
        }],
        content: [{
          attachment: {
            contentType: 'text/plain',
            data: Buffer.from(`${note.subjective}\n\n${note.objective}\n\n${note.assessment}\n\n${note.plan}`).toString('base64'),
            title: 'SOAP Note'
          }
        }],
        context: {
          encounter: [{
            reference: `Encounter/${note.encounter_id}`
          }],
          period: {
            start: note.document_date,
            end: note.finalized_at || note.document_date
          }
        }
      };

      logger.info(`Exported SOAP note ${noteId} to FHIR format`);

      return fhirResource;
    } catch (error: any) {
      logger.error(`Error exporting SOAP note ${noteId} to FHIR:`, error);
      throw error;
    }
  }

  /**
   * Helper: Escape HTML
   */
  private escapeHTML(text: string): string {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
      .replace(/\n/g, '<br>');
  }

  /**
   * Helper: Capitalize first letter
   */
  private capitalizeFirstLetter(str: string): string {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Helper: Get condition badge style
   */
  private getConditionBadgeStyle(condition: string): string {
    switch (condition) {
      case 'critical':
        return 'background-color: #e74c3c;';
      case 'declining':
        return 'background-color: #f39c12;';
      case 'stable':
        return 'background-color: #3498db;';
      case 'improving':
        return 'background-color: #27ae60;';
      default:
        return 'background-color: #95a5a6;';
    }
  }

  /**
   * Export to XML (CDA - Clinical Document Architecture)
   */
  async exportToXML(documentId: string, documentType: string): Promise<string> {
    // Placeholder for CDA XML export
    // Full implementation would require HL7 CDA schema compliance
    
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<ClinicalDocument xmlns="urn:hl7-org:v3">
  <typeId root="2.16.840.1.113883.1.3" extension="POCD_HD000040"/>
  <id root="${documentId}"/>
  <code code="34133-9" codeSystem="2.16.840.1.113883.6.1" displayName="SOAP Note"/>
  <title>Clinical Document</title>
  <effectiveTime value="${new Date().toISOString()}"/>
  <confidentialityCode code="N" codeSystem="2.16.840.1.113883.5.25"/>
  <!-- Full CDA document would continue here -->
</ClinicalDocument>`;

    logger.info(`Exported document ${documentId} to XML format`);

    return xml;
  }

  /**
   * Log export action
   */
  private async logExport(
    documentId: string,
    documentType: string,
    format: string,
    userId: string,
    patientId: string
  ): Promise<void> {
    logClinicalDocumentAction({
      action: 'exported',
      documentType: documentType as any,
      documentId,
      patientId,
      userId
    });

    logger.info(`Document ${documentId} exported to ${format} by user ${userId}`);
  }
}

export default ExportService;

