import { ResourceService } from './ResourceService';
import { v4 as uuidv4 } from 'uuid';

export class MedicationRequestService {
  private resourceService: ResourceService;

  constructor() {
    this.resourceService = new ResourceService();
  }

  async createMedicationRequest(data: any, user: any): Promise<any> {
    const medicationRequest = {
      resourceType: 'MedicationRequest',
      id: uuidv4(),
      meta: {
        profile: ['http://hl7.org/fhir/StructureDefinition/MedicationRequest'],
        lastUpdated: new Date().toISOString(),
      },
      status: data.status || 'active',
      intent: data.intent || 'order',
      priority: data.priority || 'routine',
      medicationCodeableConcept: {
        coding: [{
          system: data.medicationSystem || 'http://www.nlm.nih.gov/research/umls/rxnorm',
          code: data.medicationCode,
          display: data.medicationName,
        }],
        text: data.medicationName,
      },
      subject: {
        reference: `Patient/${data.patientId}`,
      },
      encounter: data.encounterId ? {
        reference: `Encounter/${data.encounterId}`,
      } : undefined,
      authoredOn: data.authoredOn || new Date().toISOString(),
      requester: data.requesterId ? {
        reference: `Practitioner/${data.requesterId}`,
      } : undefined,
      dosageInstruction: data.dosageInstruction ? [{
        text: data.dosageInstruction.text,
        timing: data.dosageInstruction.timing,
        route: data.dosageInstruction.route,
        doseAndRate: data.dosageInstruction.doseAndRate,
      }] : undefined,
      dispenseRequest: data.dispenseRequest ? {
        numberOfRepeatsAllowed: data.dispenseRequest.refills,
        quantity: {
          value: data.dispenseRequest.quantity,
          unit: data.dispenseRequest.unit,
        },
        expectedSupplyDuration: data.dispenseRequest.duration,
      } : undefined,
    };

    return this.resourceService.createResource('MedicationRequest', medicationRequest, user);
  }

  async searchMedicationRequests(searchParams: any, user: any): Promise<any> {
    return this.resourceService.searchResources('MedicationRequest', searchParams, user);
  }

  async getMedicationRequestById(id: string, user: any): Promise<any> {
    return this.resourceService.getResource('MedicationRequest', id, user);
  }

  async updateMedicationRequest(id: string, data: any, user: any): Promise<any> {
    return this.resourceService.updateResource('MedicationRequest', id, data, user);
  }
}

export default MedicationRequestService;

