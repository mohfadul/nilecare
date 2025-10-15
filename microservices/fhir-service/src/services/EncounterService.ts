import { ResourceService } from './ResourceService';
import { v4 as uuidv4 } from 'uuid';

export class EncounterService {
  private resourceService: ResourceService;

  constructor() {
    this.resourceService = new ResourceService();
  }

  async createEncounter(data: any, user: any): Promise<any> {
    const encounter = {
      resourceType: 'Encounter',
      id: uuidv4(),
      meta: {
        profile: ['http://hl7.org/fhir/StructureDefinition/Encounter'],
        lastUpdated: new Date().toISOString(),
      },
      status: data.status || 'in-progress',
      class: {
        system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
        code: data.classCode || 'AMB',
        display: this.getClassDisplay(data.classCode || 'AMB'),
      },
      type: data.encounterType ? [{
        coding: [{
          system: 'http://snomed.info/sct',
          code: data.encounterType.code,
          display: data.encounterType.display,
        }],
      }] : undefined,
      priority: data.priority ? {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/v3-ActPriority',
          code: data.priority,
        }],
      } : undefined,
      subject: {
        reference: `Patient/${data.patientId}`,
      },
      participant: data.practitioners ? data.practitioners.map((p: any) => ({
        type: [{
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/v3-ParticipationType',
            code: p.role || 'PPRF',
            display: 'Primary Performer',
          }],
        }],
        individual: {
          reference: `Practitioner/${p.practitionerId}`,
        },
      })) : undefined,
      period: {
        start: data.startDate || new Date().toISOString(),
        end: data.endDate,
      },
      reasonCode: data.reasonCodes ? data.reasonCodes.map((r: any) => ({
        coding: [{
          system: 'http://snomed.info/sct',
          code: r.code,
          display: r.display,
        }],
      })) : undefined,
      serviceProvider: data.facilityId ? {
        reference: `Organization/${data.facilityId}`,
      } : undefined,
    };

    return this.resourceService.createResource('Encounter', encounter, user);
  }

  async searchEncounters(searchParams: any, user: any): Promise<any> {
    return this.resourceService.searchResources('Encounter', searchParams, user);
  }

  async getEncounterById(id: string, user: any): Promise<any> {
    return this.resourceService.getResource('Encounter', id, user);
  }

  async updateEncounter(id: string, data: any, user: any): Promise<any> {
    return this.resourceService.updateResource('Encounter', id, data, user);
  }

  private getClassDisplay(code: string): string {
    const classes: Record<string, string> = {
      'AMB': 'Ambulatory',
      'EMER': 'Emergency',
      'IMP': 'Inpatient',
      'OBSENC': 'Observation',
      'HH': 'Home Health',
    };
    return classes[code] || code;
  }
}

export default EncounterService;

