/**
 * FHIR Service Implementation
 * HL7 FHIR R4 compliant service
 * Sudan-specific: Includes Sudan National ID extension
 */

import { v4 as uuidv4 } from 'uuid';
import { Pool } from 'pg';
import axios from 'axios';
import { EventEmitter } from 'events';

// FHIR R4 Types
export namespace fhir {
  export type PatientGender = 'male' | 'female' | 'other' | 'unknown';
  export type BundleType = 'document' | 'message' | 'transaction' | 'transaction-response' | 'batch' | 'batch-response' | 'history' | 'searchset' | 'collection';
  export type ResourceType = 'Patient' | 'Observation' | 'Condition' | 'MedicationRequest' | 'Encounter' | 'Procedure' | 'DiagnosticReport' | 'AllergyIntolerance';

  export interface Resource {
    resourceType: ResourceType;
    id?: string;
    meta?: Meta;
    implicitRules?: string;
    language?: string;
  }

  export interface Meta {
    versionId?: string;
    lastUpdated?: string;
    source?: string;
    profile?: string[];
    security?: Coding[];
    tag?: Coding[];
  }

  export interface Coding {
    system?: string;
    version?: string;
    code?: string;
    display?: string;
    userSelected?: boolean;
  }

  export interface Identifier {
    use?: 'usual' | 'official' | 'temp' | 'secondary' | 'old';
    type?: CodeableConcept;
    system?: string;
    value?: string;
    period?: Period;
    assigner?: Reference;
  }

  export interface CodeableConcept {
    coding?: Coding[];
    text?: string;
  }

  export interface Period {
    start?: string;
    end?: string;
  }

  export interface Reference {
    reference?: string;
    type?: string;
    identifier?: Identifier;
    display?: string;
  }

  export interface HumanName {
    use?: 'usual' | 'official' | 'temp' | 'nickname' | 'anonymous' | 'old' | 'maiden';
    text?: string;
    family?: string;
    given?: string[];
    prefix?: string[];
    suffix?: string[];
    period?: Period;
  }

  export interface ContactPoint {
    system?: 'phone' | 'fax' | 'email' | 'pager' | 'url' | 'sms' | 'other';
    value?: string;
    use?: 'home' | 'work' | 'temp' | 'old' | 'mobile';
    rank?: number;
    period?: Period;
  }

  export interface Address {
    use?: 'home' | 'work' | 'temp' | 'old' | 'billing';
    type?: 'postal' | 'physical' | 'both';
    text?: string;
    line?: string[];
    city?: string;
    district?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    period?: Period;
  }

  export interface Extension {
    url: string;
    valueString?: string;
    valueCode?: string;
    valueBoolean?: boolean;
    valueInteger?: number;
    valueDecimal?: number;
    valueDateTime?: string;
    valueIdentifier?: Identifier;
    valueCodeableConcept?: CodeableConcept;
  }

  export interface Patient extends Resource {
    resourceType: 'Patient';
    identifier?: Identifier[];
    active?: boolean;
    name?: HumanName[];
    telecom?: ContactPoint[];
    gender?: PatientGender;
    birthDate?: string;
    deceasedBoolean?: boolean;
    deceasedDateTime?: string;
    address?: Address[];
    maritalStatus?: CodeableConcept;
    multipleBirthBoolean?: boolean;
    multipleBirthInteger?: number;
    photo?: Attachment[];
    contact?: PatientContact[];
    communication?: PatientCommunication[];
    generalPractitioner?: Reference[];
    managingOrganization?: Reference;
    link?: PatientLink[];
    extension?: Extension[];
  }

  export interface Attachment {
    contentType?: string;
    language?: string;
    data?: string;
    url?: string;
    size?: number;
    hash?: string;
    title?: string;
    creation?: string;
  }

  export interface PatientContact {
    relationship?: CodeableConcept[];
    name?: HumanName;
    telecom?: ContactPoint[];
    address?: Address;
    gender?: PatientGender;
    organization?: Reference;
    period?: Period;
  }

  export interface PatientCommunication {
    language: CodeableConcept;
    preferred?: boolean;
  }

  export interface PatientLink {
    other: Reference;
    type: 'replaced-by' | 'replaces' | 'refer' | 'seealso';
  }

  export interface Bundle extends Resource {
    resourceType: 'Bundle';
    type: BundleType;
    total?: number;
    link?: BundleLink[];
    entry?: BundleEntry[];
    signature?: Signature;
  }

  export interface BundleLink {
    relation: string;
    url: string;
  }

  export interface BundleEntry {
    link?: BundleLink[];
    fullUrl?: string;
    resource?: Resource;
    search?: BundleEntrySearch;
    request?: BundleEntryRequest;
    response?: BundleEntryResponse;
  }

  export interface BundleEntrySearch {
    mode?: 'match' | 'include' | 'outcome';
    score?: number;
  }

  export interface BundleEntryRequest {
    method: 'GET' | 'HEAD' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    url: string;
    ifNoneMatch?: string;
    ifModifiedSince?: string;
    ifMatch?: string;
    ifNoneExist?: string;
  }

  export interface BundleEntryResponse {
    status: string;
    location?: string;
    etag?: string;
    lastModified?: string;
    outcome?: Resource;
  }

  export interface Signature {
    type: Coding[];
    when: string;
    who: Reference;
    onBehalfOf?: Reference;
    targetFormat?: string;
    sigFormat?: string;
    data?: string;
  }

  export interface OperationOutcome extends Resource {
    resourceType: 'OperationOutcome';
    issue: OperationOutcomeIssue[];
  }

  export interface OperationOutcomeIssue {
    severity: 'fatal' | 'error' | 'warning' | 'information';
    code: string;
    details?: CodeableConcept;
    diagnostics?: string;
    location?: string[];
    expression?: string[];
  }

  export interface PatientSearchParams {
    _id?: string;
    identifier?: string;
    name?: string;
    family?: string;
    given?: string;
    birthdate?: string;
    gender?: string;
    address?: string;
    'address-city'?: string;
    'address-state'?: string;
    'address-postalcode'?: string;
    telecom?: string;
    active?: boolean;
    _count?: number;
    _offset?: number;
    _sort?: string;
    _include?: string;
    _revinclude?: string;
  }
}

export interface PatientDTO {
  mrn: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other' | 'unknown';
  sudanNationalId?: string;
  phone?: string;
  email?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  primaryLanguage?: string;
  maritalStatus?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;
}

export class FHIRService extends EventEmitter {
  private readonly fhirServerUrl: string;
  private readonly pool: Pool;
  private readonly baseUrl: string;

  // Sudan-specific FHIR extensions
  private readonly SUDAN_EXTENSIONS = {
    NATIONAL_ID: 'http://nilecare.sd/fhir/StructureDefinition/sudan-national-id',
    STATE: 'http://nilecare.sd/fhir/StructureDefinition/sudan-state',
    FACILITY_ID: 'http://nilecare.sd/fhir/StructureDefinition/facility-id',
    TENANT_ID: 'http://nilecare.sd/fhir/StructureDefinition/tenant-id'
  };

  constructor(pool: Pool) {
    super();
    this.pool = pool;
    this.fhirServerUrl = process.env.FHIR_SERVER_URL || 'http://localhost:6001';
    this.baseUrl = `${this.fhirServerUrl}/fhir`;
  }

  /**
   * Create FHIR Patient resource from DTO
   * @param patientData - Patient data transfer object
   * @returns FHIR Patient resource
   */
  async createPatient(patientData: PatientDTO): Promise<fhir.Patient> {
    const fhirPatient: fhir.Patient = {
      resourceType: 'Patient',
      id: uuidv4(),
      meta: {
        profile: ['http://hl7.org/fhir/StructureDefinition/Patient'],
        lastUpdated: new Date().toISOString(),
        versionId: '1'
      },
      
      // Identifiers
      identifier: [
        {
          use: 'official',
          system: `${this.fhirServerUrl}/identifier/mrn`,
          value: patientData.mrn,
          type: {
            coding: [{
              system: 'http://terminology.hl7.org/CodeSystem/v2-0203',
              code: 'MR',
              display: 'Medical Record Number'
            }]
          }
        }
      ],
      
      // Active status
      active: true,
      
      // Name
      name: [
        {
          use: 'official',
          family: patientData.lastName,
          given: patientData.middleName 
            ? [patientData.firstName, patientData.middleName]
            : [patientData.firstName],
          text: `${patientData.firstName} ${patientData.middleName || ''} ${patientData.lastName}`.trim()
        }
      ],
      
      // Telecom
      telecom: [],
      
      // Gender
      gender: patientData.gender,
      
      // Birth Date
      birthDate: patientData.dateOfBirth,
      
      // Address
      address: [],
      
      // Marital Status
      maritalStatus: this.mapMaritalStatus(patientData.maritalStatus),
      
      // Communication (Language)
      communication: [
        {
          language: {
            coding: [{
              system: 'urn:ietf:bcp:47',
              code: patientData.primaryLanguage === 'Arabic' ? 'ar' : 'en',
              display: patientData.primaryLanguage || 'Arabic'
            }],
            text: patientData.primaryLanguage || 'Arabic'
          },
          preferred: true
        }
      ],
      
      // Extensions for Sudan-specific data
      extension: []
    };

    // Add Sudan National ID extension
    if (patientData.sudanNationalId) {
      fhirPatient.extension!.push({
        url: this.SUDAN_EXTENSIONS.NATIONAL_ID,
        valueString: patientData.sudanNationalId  // Encrypted before storage
      });
    }

    // Add phone
    if (patientData.phone) {
      fhirPatient.telecom!.push({
        system: 'phone',
        value: patientData.phone,
        use: 'mobile',
        rank: 1
      });
    }

    // Add email
    if (patientData.email) {
      fhirPatient.telecom!.push({
        system: 'email',
        value: patientData.email,
        use: 'home',
        rank: 2
      });
    }

    // Add address
    if (patientData.addressLine1) {
      fhirPatient.address!.push({
        use: 'home',
        type: 'physical',
        line: [
          patientData.addressLine1,
          ...(patientData.addressLine2 ? [patientData.addressLine2] : [])
        ],
        city: patientData.city,
        state: patientData.state,  // Sudan state
        postalCode: patientData.postalCode,
        country: patientData.country || 'Sudan'
      });

      // Add Sudan state extension
      if (patientData.state) {
        fhirPatient.extension!.push({
          url: this.SUDAN_EXTENSIONS.STATE,
          valueString: patientData.state
        });
      }
    }

    // Add emergency contact
    if (patientData.emergencyContactName) {
      fhirPatient.contact = [{
        relationship: [{
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/v2-0131',
            code: 'C',
            display: 'Emergency Contact'
          }],
          text: patientData.emergencyContactRelationship || 'Emergency Contact'
        }],
        name: {
          text: patientData.emergencyContactName
        },
        telecom: patientData.emergencyContactPhone ? [{
          system: 'phone',
          value: patientData.emergencyContactPhone,
          use: 'mobile'
        }] : undefined
      }];
    }

    // Store in FHIR repository
    const stored = await this.storeFHIRResource(fhirPatient);

    // Emit event
    this.emit('patient_created', stored);

    return stored;
  }

  /**
   * Search for patients
   * @param params - FHIR search parameters
   * @returns FHIR Bundle with search results
   */
  async searchPatients(params: fhir.PatientSearchParams): Promise<fhir.Bundle> {
    const queryParts: string[] = [];

    // Build search query
    if (params._id) queryParts.push(`_id=${params._id}`);
    if (params.identifier) queryParts.push(`identifier=${params.identifier}`);
    if (params.name) queryParts.push(`name=${params.name}`);
    if (params.family) queryParts.push(`family=${params.family}`);
    if (params.given) queryParts.push(`given=${params.given}`);
    if (params.birthdate) queryParts.push(`birthdate=${params.birthdate}`);
    if (params.gender) queryParts.push(`gender=${params.gender}`);
    if (params.address) queryParts.push(`address=${params.address}`);
    if (params['address-city']) queryParts.push(`address-city=${params['address-city']}`);
    if (params['address-state']) queryParts.push(`address-state=${params['address-state']}`);
    if (params.telecom) queryParts.push(`telecom=${params.telecom}`);
    if (params.active !== undefined) queryParts.push(`active=${params.active}`);
    if (params._count) queryParts.push(`_count=${params._count}`);
    if (params._offset) queryParts.push(`_offset=${params._offset}`);
    if (params._sort) queryParts.push(`_sort=${params._sort}`);

    const queryString = queryParts.join('&');
    const searchUrl = `${this.baseUrl}/Patient?${queryString}`;

    try {
      const response = await axios.get(searchUrl);
      return response.data as fhir.Bundle;
    } catch (error) {
      console.error('Error searching patients:', error);
      throw this.createOperationOutcome('error', 'processing', 'Error searching patients');
    }
  }

  /**
   * Get patient by ID
   * @param patientId - Patient ID
   * @returns FHIR Patient resource
   */
  async getPatientById(patientId: string): Promise<fhir.Patient> {
    try {
      const response = await axios.get(`${this.baseUrl}/Patient/${patientId}`);
      return response.data as fhir.Patient;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw this.createOperationOutcome('error', 'not-found', `Patient ${patientId} not found`);
      }
      throw error;
    }
  }

  /**
   * Update patient
   * @param patientId - Patient ID
   * @param patientData - Updated patient data
   * @returns Updated FHIR Patient resource
   */
  async updatePatient(patientId: string, patientData: Partial<PatientDTO>): Promise<fhir.Patient> {
    // Get existing patient
    const existingPatient = await this.getPatientById(patientId);

    // Update fields
    if (patientData.firstName || patientData.lastName) {
      existingPatient.name = [{
        use: 'official',
        family: patientData.lastName || existingPatient.name?.[0]?.family,
        given: patientData.firstName ? [patientData.firstName] : existingPatient.name?.[0]?.given,
        text: `${patientData.firstName || existingPatient.name?.[0]?.given?.[0]} ${patientData.lastName || existingPatient.name?.[0]?.family}`.trim()
      }];
    }

    if (patientData.phone) {
      const phoneIndex = existingPatient.telecom?.findIndex(t => t.system === 'phone');
      if (phoneIndex !== undefined && phoneIndex >= 0) {
        existingPatient.telecom![phoneIndex].value = patientData.phone;
      } else {
        existingPatient.telecom = existingPatient.telecom || [];
        existingPatient.telecom.push({
          system: 'phone',
          value: patientData.phone,
          use: 'mobile'
        });
      }
    }

    // Update meta
    existingPatient.meta = {
      ...existingPatient.meta,
      lastUpdated: new Date().toISOString(),
      versionId: (parseInt(existingPatient.meta?.versionId || '1') + 1).toString()
    };

    // Store updated resource
    const updated = await this.updateFHIRResource(existingPatient);

    // Emit event
    this.emit('patient_updated', updated);

    return updated;
  }

  /**
   * Delete patient (soft delete)
   * @param patientId - Patient ID
   */
  async deletePatient(patientId: string): Promise<void> {
    // FHIR uses soft delete (set active = false)
    const patient = await this.getPatientById(patientId);
    patient.active = false;
    patient.meta = {
      ...patient.meta,
      lastUpdated: new Date().toISOString()
    };

    await this.updateFHIRResource(patient);

    // Emit event
    this.emit('patient_deleted', { patientId });
  }

  /**
   * Create FHIR Observation (for vital signs, lab results)
   * @param observationData - Observation data
   * @returns FHIR Observation resource
   */
  async createObservation(observationData: any): Promise<any> {
    const observation = {
      resourceType: 'Observation',
      id: uuidv4(),
      meta: {
        profile: ['http://hl7.org/fhir/StructureDefinition/Observation'],
        lastUpdated: new Date().toISOString()
      },
      status: observationData.status || 'final',
      category: [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/observation-category',
          code: observationData.category || 'vital-signs',
          display: 'Vital Signs'
        }]
      }],
      code: {
        coding: [{
          system: 'http://loinc.org',
          code: observationData.loincCode,
          display: observationData.displayName
        }],
        text: observationData.displayName
      },
      subject: {
        reference: `Patient/${observationData.patientId}`,
        type: 'Patient'
      },
      encounter: observationData.encounterId ? {
        reference: `Encounter/${observationData.encounterId}`,
        type: 'Encounter'
      } : undefined,
      effectiveDateTime: observationData.effectiveDateTime || new Date().toISOString(),
      issued: new Date().toISOString(),
      performer: observationData.performerId ? [{
        reference: `Practitioner/${observationData.performerId}`,
        type: 'Practitioner'
      }] : undefined,
      valueQuantity: observationData.value ? {
        value: observationData.value,
        unit: observationData.unit,
        system: 'http://unitsofmeasure.org',
        code: observationData.ucumCode
      } : undefined,
      interpretation: observationData.interpretation ? [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
          code: observationData.interpretation,
          display: this.getInterpretationDisplay(observationData.interpretation)
        }]
      }] : undefined,
      referenceRange: observationData.referenceRange ? [{
        low: {
          value: observationData.referenceRange.low,
          unit: observationData.unit
        },
        high: {
          value: observationData.referenceRange.high,
          unit: observationData.unit
        }
      }] : undefined,
      device: observationData.deviceId ? {
        reference: `Device/${observationData.deviceId}`,
        type: 'Device'
      } : undefined
    };

    const stored = await this.storeFHIRResource(observation);
    this.emit('observation_created', stored);

    return stored;
  }

  /**
   * Process FHIR Bundle (batch/transaction)
   * @param bundle - FHIR Bundle
   * @returns Response Bundle
   */
  async processBundle(bundle: fhir.Bundle): Promise<fhir.Bundle> {
    if (bundle.type !== 'batch' && bundle.type !== 'transaction') {
      throw this.createOperationOutcome('error', 'invalid', 'Bundle type must be batch or transaction');
    }

    const responseBundle: fhir.Bundle = {
      resourceType: 'Bundle',
      type: bundle.type === 'batch' ? 'batch-response' : 'transaction-response',
      entry: []
    };

    // Process each entry
    for (const entry of bundle.entry || []) {
      try {
        const request = entry.request!;
        let response: fhir.BundleEntryResponse;

        switch (request.method) {
          case 'POST':
            const created = await this.createResource(entry.resource!);
            response = {
              status: '201 Created',
              location: `${entry.resource!.resourceType}/${created.id}`,
              etag: `W/"${created.meta?.versionId}"`,
              lastModified: created.meta?.lastUpdated
            };
            break;

          case 'PUT':
            const updated = await this.updateResource(entry.resource!);
            response = {
              status: '200 OK',
              location: `${entry.resource!.resourceType}/${updated.id}`,
              etag: `W/"${updated.meta?.versionId}"`,
              lastModified: updated.meta?.lastUpdated
            };
            break;

          case 'DELETE':
            await this.deleteResource(entry.resource!.resourceType, entry.resource!.id!);
            response = {
              status: '204 No Content'
            };
            break;

          case 'GET':
            const resource = await this.getResource(request.url);
            response = {
              status: '200 OK',
              etag: `W/"${resource.meta?.versionId}"`,
              lastModified: resource.meta?.lastUpdated
            };
            break;

          default:
            response = {
              status: '400 Bad Request',
              outcome: this.createOperationOutcome('error', 'invalid', `Unsupported method: ${request.method}`)
            };
        }

        responseBundle.entry!.push({
          response,
          resource: entry.resource
        });

      } catch (error: any) {
        responseBundle.entry!.push({
          response: {
            status: '500 Internal Server Error',
            outcome: this.createOperationOutcome('error', 'exception', error.message)
          }
        });
      }
    }

    return responseBundle;
  }

  /**
   * Create any FHIR resource
   * @param resource - FHIR resource
   * @returns Created resource
   */
  async createResource(resource: fhir.Resource): Promise<fhir.Resource> {
    resource.id = resource.id || uuidv4();
    resource.meta = {
      ...resource.meta,
      lastUpdated: new Date().toISOString(),
      versionId: '1'
    };

    return this.storeFHIRResource(resource);
  }

  /**
   * Update FHIR resource
   * @param resource - FHIR resource
   * @returns Updated resource
   */
  async updateResource(resource: fhir.Resource): Promise<fhir.Resource> {
    return this.updateFHIRResource(resource);
  }

  /**
   * Delete FHIR resource
   * @param resourceType - Resource type
   * @param resourceId - Resource ID
   */
  async deleteResource(resourceType: string, resourceId: string): Promise<void> {
    const query = `
      UPDATE fhir_resources
      SET deleted = true, deleted_at = NOW()
      WHERE resource_type = $1 AND resource_id = $2
    `;

    await this.pool.query(query, [resourceType, resourceId]);
  }

  /**
   * Get FHIR resource
   * @param url - Resource URL
   * @returns FHIR resource
   */
  async getResource(url: string): Promise<fhir.Resource> {
    const response = await axios.get(`${this.baseUrl}/${url}`);
    return response.data;
  }

  /**
   * Store FHIR resource in database
   * @param resource - FHIR resource
   * @returns Stored resource
   */
  private async storeFHIRResource(resource: fhir.Resource): Promise<any> {
    const query = `
      INSERT INTO fhir_resources (
        resource_id, resource_type, resource_data, version, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING *
    `;

    const result = await this.pool.query(query, [
      resource.id,
      resource.resourceType,
      JSON.stringify(resource),
      resource.meta?.versionId || '1'
    ]);

    return resource;
  }

  /**
   * Update FHIR resource in database
   * @param resource - FHIR resource
   * @returns Updated resource
   */
  private async updateFHIRResource(resource: fhir.Resource): Promise<any> {
    // Increment version
    const currentVersion = parseInt(resource.meta?.versionId || '1');
    resource.meta = {
      ...resource.meta,
      versionId: (currentVersion + 1).toString(),
      lastUpdated: new Date().toISOString()
    };

    const query = `
      UPDATE fhir_resources
      SET resource_data = $1, version = $2, updated_at = NOW()
      WHERE resource_id = $3 AND resource_type = $4
      RETURNING *
    `;

    await this.pool.query(query, [
      JSON.stringify(resource),
      resource.meta.versionId,
      resource.id,
      resource.resourceType
    ]);

    return resource;
  }

  /**
   * Create FHIR OperationOutcome
   * @param severity - Issue severity
   * @param code - Issue code
   * @param diagnostics - Diagnostic message
   * @returns OperationOutcome resource
   */
  private createOperationOutcome(
    severity: 'fatal' | 'error' | 'warning' | 'information',
    code: string,
    diagnostics: string
  ): fhir.OperationOutcome {
    return {
      resourceType: 'OperationOutcome',
      issue: [{
        severity,
        code,
        diagnostics
      }]
    };
  }

  /**
   * Map marital status to FHIR CodeableConcept
   */
  private mapMaritalStatus(status?: string): fhir.CodeableConcept | undefined {
    if (!status) return undefined;

    const maritalStatusMap: Record<string, { code: string; display: string }> = {
      'single': { code: 'S', display: 'Never Married' },
      'married': { code: 'M', display: 'Married' },
      'divorced': { code: 'D', display: 'Divorced' },
      'widowed': { code: 'W', display: 'Widowed' },
      'separated': { code: 'L', display: 'Legally Separated' }
    };

    const mapped = maritalStatusMap[status.toLowerCase()];
    if (!mapped) return undefined;

    return {
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/v3-MaritalStatus',
        code: mapped.code,
        display: mapped.display
      }],
      text: mapped.display
    };
  }

  /**
   * Get interpretation display text
   */
  private getInterpretationDisplay(code: string): string {
    const interpretationMap: Record<string, string> = {
      'N': 'Normal',
      'L': 'Low',
      'H': 'High',
      'LL': 'Critical Low',
      'HH': 'Critical High',
      'A': 'Abnormal'
    };

    return interpretationMap[code] || code;
  }

  /**
   * Convert DTO to FHIR Patient
   * @param dto - Patient DTO
   * @returns FHIR Patient
   */
  dtoToFHIR(dto: PatientDTO): fhir.Patient {
    return this.createPatient(dto) as any;
  }

  /**
   * Convert FHIR Patient to DTO
   * @param fhirPatient - FHIR Patient resource
   * @returns Patient DTO
   */
  fhirToDTO(fhirPatient: fhir.Patient): PatientDTO {
    // Extract Sudan National ID from extension
    const sudanNationalIdExt = fhirPatient.extension?.find(
      ext => ext.url === this.SUDAN_EXTENSIONS.NATIONAL_ID
    );

    // Extract phone
    const phone = fhirPatient.telecom?.find(t => t.system === 'phone')?.value;

    // Extract email
    const email = fhirPatient.telecom?.find(t => t.system === 'email')?.value;

    // Extract address
    const address = fhirPatient.address?.[0];

    // Extract emergency contact
    const emergencyContact = fhirPatient.contact?.[0];

    return {
      mrn: fhirPatient.identifier?.find(i => i.type?.coding?.[0]?.code === 'MR')?.value || '',
      firstName: fhirPatient.name?.[0]?.given?.[0] || '',
      middleName: fhirPatient.name?.[0]?.given?.[1],
      lastName: fhirPatient.name?.[0]?.family || '',
      dateOfBirth: fhirPatient.birthDate || '',
      gender: fhirPatient.gender || 'unknown',
      sudanNationalId: sudanNationalIdExt?.valueString,
      phone,
      email,
      addressLine1: address?.line?.[0],
      addressLine2: address?.line?.[1],
      city: address?.city,
      state: address?.state,
      postalCode: address?.postalCode,
      country: address?.country || 'Sudan',
      primaryLanguage: fhirPatient.communication?.[0]?.language.text || 'Arabic',
      emergencyContactName: emergencyContact?.name?.text,
      emergencyContactPhone: emergencyContact?.telecom?.[0]?.value,
      emergencyContactRelationship: emergencyContact?.relationship?.[0]?.text
    };
  }
}

export default FHIRService;
