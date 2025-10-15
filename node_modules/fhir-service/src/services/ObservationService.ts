import { ResourceService } from './ResourceService';
import { v4 as uuidv4 } from 'uuid';

/**
 * Observation Service
 * Handles FHIR Observation resources (vital signs, lab results)
 */

export class ObservationService {
  private resourceService: ResourceService;

  constructor() {
    this.resourceService = new ResourceService();
  }

  /**
   * Create Observation resource
   */
  async createObservation(observationData: any, user: any): Promise<any> {
    const observation = {
      resourceType: 'Observation',
      id: uuidv4(),
      meta: {
        profile: ['http://hl7.org/fhir/StructureDefinition/Observation'],
        lastUpdated: new Date().toISOString(),
      },
      status: observationData.status || 'final',
      category: [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/observation-category',
          code: observationData.category || 'vital-signs',
          display: this.getCategoryDisplay(observationData.category || 'vital-signs'),
        }],
      }],
      code: {
        coding: [{
          system: 'http://loinc.org',
          code: observationData.loincCode,
          display: observationData.displayName,
        }],
        text: observationData.displayName,
      },
      subject: {
        reference: `Patient/${observationData.patientId}`,
        type: 'Patient',
      },
      encounter: observationData.encounterId ? {
        reference: `Encounter/${observationData.encounterId}`,
      } : undefined,
      effectiveDateTime: observationData.effectiveDateTime || new Date().toISOString(),
      issued: new Date().toISOString(),
      performer: observationData.performerId ? [{
        reference: `Practitioner/${observationData.performerId}`,
      }] : undefined,
      valueQuantity: observationData.value ? {
        value: observationData.value,
        unit: observationData.unit,
        system: 'http://unitsofmeasure.org',
        code: observationData.ucumCode,
      } : undefined,
      valueString: observationData.valueString,
      valueBoolean: observationData.valueBoolean,
      interpretation: observationData.interpretation ? [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
          code: observationData.interpretation,
          display: this.getInterpretationDisplay(observationData.interpretation),
        }],
      }] : undefined,
      referenceRange: observationData.referenceRange ? [{
        low: {
          value: observationData.referenceRange.low,
          unit: observationData.unit,
        },
        high: {
          value: observationData.referenceRange.high,
          unit: observationData.unit,
        },
      }] : undefined,
    };

    return this.resourceService.createResource('Observation', observation, user);
  }

  /**
   * Search observations
   */
  async searchObservations(searchParams: any, user: any): Promise<any> {
    return this.resourceService.searchResources('Observation', searchParams, user);
  }

  /**
   * Get observation by ID
   */
  async getObservationById(observationId: string, user: any): Promise<any> {
    return this.resourceService.getResource('Observation', observationId, user);
  }

  /**
   * Update observation
   */
  async updateObservation(observationId: string, observationData: any, user: any): Promise<any> {
    return this.resourceService.updateResource('Observation', observationId, observationData, user);
  }

  private getCategoryDisplay(code: string): string {
    const categories: Record<string, string> = {
      'vital-signs': 'Vital Signs',
      'laboratory': 'Laboratory',
      'imaging': 'Imaging',
      'exam': 'Exam',
      'survey': 'Survey',
    };
    return categories[code] || code;
  }

  private getInterpretationDisplay(code: string): string {
    const interpretations: Record<string, string> = {
      'N': 'Normal',
      'L': 'Low',
      'H': 'High',
      'LL': 'Critical Low',
      'HH': 'Critical High',
      'A': 'Abnormal',
    };
    return interpretations[code] || code;
  }
}

export default ObservationService;

