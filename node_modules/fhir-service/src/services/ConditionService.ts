import { ResourceService } from './ResourceService';
import { v4 as uuidv4 } from 'uuid';

/**
 * Condition Service
 * Handles FHIR Condition resources (diagnoses, problems)
 */

export class ConditionService {
  private resourceService: ResourceService;

  constructor() {
    this.resourceService = new ResourceService();
  }

  /**
   * Create Condition resource
   */
  async createCondition(conditionData: any, user: any): Promise<any> {
    const condition = {
      resourceType: 'Condition',
      id: uuidv4(),
      meta: {
        profile: ['http://hl7.org/fhir/StructureDefinition/Condition'],
        lastUpdated: new Date().toISOString(),
      },
      clinicalStatus: {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
          code: conditionData.clinicalStatus || 'active',
          display: this.getClinicalStatusDisplay(conditionData.clinicalStatus || 'active'),
        }],
      },
      verificationStatus: conditionData.verificationStatus ? {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
          code: conditionData.verificationStatus,
          display: this.getVerificationStatusDisplay(conditionData.verificationStatus),
        }],
      } : undefined,
      category: conditionData.category ? [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/condition-category',
          code: conditionData.category,
          display: this.getCategoryDisplay(conditionData.category),
        }],
      }] : undefined,
      severity: conditionData.severity ? {
        coding: [{
          system: 'http://snomed.info/sct',
          code: conditionData.severityCode,
          display: conditionData.severity,
        }],
      } : undefined,
      code: {
        coding: [{
          system: conditionData.codeSystem || 'http://snomed.info/sct',
          code: conditionData.code,
          display: conditionData.displayName,
        }],
        text: conditionData.displayName,
      },
      subject: {
        reference: `Patient/${conditionData.patientId}`,
        type: 'Patient',
      },
      encounter: conditionData.encounterId ? {
        reference: `Encounter/${conditionData.encounterId}`,
      } : undefined,
      onsetDateTime: conditionData.onsetDateTime,
      onsetAge: conditionData.onsetAge,
      abatementDateTime: conditionData.abatementDateTime,
      recordedDate: conditionData.recordedDate || new Date().toISOString(),
      recorder: conditionData.recorderId ? {
        reference: `Practitioner/${conditionData.recorderId}`,
      } : undefined,
      asserter: conditionData.asserterId ? {
        reference: `Practitioner/${conditionData.asserterId}`,
      } : undefined,
      note: conditionData.notes ? [{
        text: conditionData.notes,
        time: new Date().toISOString(),
      }] : undefined,
    };

    return this.resourceService.createResource('Condition', condition, user);
  }

  /**
   * Search conditions
   */
  async searchConditions(searchParams: any, user: any): Promise<any> {
    return this.resourceService.searchResources('Condition', searchParams, user);
  }

  /**
   * Get condition by ID
   */
  async getConditionById(conditionId: string, user: any): Promise<any> {
    return this.resourceService.getResource('Condition', conditionId, user);
  }

  /**
   * Update condition
   */
  async updateCondition(conditionId: string, conditionData: any, user: any): Promise<any> {
    return this.resourceService.updateResource('Condition', conditionId, conditionData, user);
  }

  private getClinicalStatusDisplay(code: string): string {
    const statuses: Record<string, string> = {
      'active': 'Active',
      'recurrence': 'Recurrence',
      'relapse': 'Relapse',
      'inactive': 'Inactive',
      'remission': 'Remission',
      'resolved': 'Resolved',
    };
    return statuses[code] || code;
  }

  private getVerificationStatusDisplay(code: string): string {
    const statuses: Record<string, string> = {
      'unconfirmed': 'Unconfirmed',
      'provisional': 'Provisional',
      'differential': 'Differential',
      'confirmed': 'Confirmed',
      'refuted': 'Refuted',
      'entered-in-error': 'Entered in Error',
    };
    return statuses[code] || code;
  }

  private getCategoryDisplay(code: string): string {
    const categories: Record<string, string> = {
      'problem-list-item': 'Problem List Item',
      'encounter-diagnosis': 'Encounter Diagnosis',
    };
    return categories[code] || code;
  }
}

export default ConditionService;

