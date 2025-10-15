/**
 * Clinical Service Client
 * API client for Clinical/EHR Service communication
 */

import { BaseServiceClient, ServiceClientConfig } from './BaseServiceClient';

export interface Patient {
  id: string;
  mrn: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  phone?: string;
  email?: string;
  isActive: boolean;
}

export interface Encounter {
  id: string;
  patientId: string;
  encounterNumber: string;
  encounterType: string;
  status: string;
  admissionDate: string;
  dischargeDate?: string;
}

export interface PatientSummary {
  patient: Patient;
  activeEncounter?: Encounter;
  activeDiagnoses: any[];
  activeMedications: any[];
  allergies: any[];
  recentVitals: any[];
}

export class ClinicalServiceClient extends BaseServiceClient {
  constructor(config: ServiceClientConfig) {
    super(config);
  }

  /**
   * Get patient by ID
   */
  async getPatient(patientId: string): Promise<Patient> {
    return await this.get<Patient>(`/api/v1/patients/${patientId}`);
  }

  /**
   * Get patient summary
   */
  async getPatientSummary(patientId: string): Promise<PatientSummary> {
    return await this.get<PatientSummary>(`/api/v1/patients/${patientId}/summary`);
  }

  /**
   * Get encounter
   */
  async getEncounter(encounterId: string): Promise<Encounter> {
    return await this.get<Encounter>(`/api/v1/encounters/${encounterId}`);
  }

  /**
   * Validate patient exists
   */
  async validatePatientExists(patientId: string): Promise<boolean> {
    try {
      await this.getPatient(patientId);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Search patients
   */
  async searchPatients(query: {
    mrn?: string;
    name?: string;
    dob?: string;
    phone?: string;
  }): Promise<Patient[]> {
    return await this.get<Patient[]>('/api/v1/patients/search', {
      params: query
    });
  }

  /**
   * Create patient
   */
  async createPatient(patientData: Partial<Patient>): Promise<Patient> {
    return await this.post<Patient>('/api/v1/patients', patientData);
  }

  /**
   * Update patient
   */
  async updatePatient(patientId: string, updates: Partial<Patient>): Promise<Patient> {
    return await this.patch<Patient>(`/api/v1/patients/${patientId}`, updates);
  }
}

export default ClinicalServiceClient;

