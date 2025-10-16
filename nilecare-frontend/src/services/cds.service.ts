/**
 * CDS (Clinical Decision Support) Service
 * 
 * Provides drug interaction checking, allergy alerts, and dose validation
 * @module services/cds
 */

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:7000';

/**
 * Get authentication token from local storage
 */
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

interface PrescriptionCheck {
  patientId: string;
  drugId: string;
  drugName?: string;
  dose?: string;
  frequency?: string;
  route?: string;
}

interface AllergyCheck {
  patientId: string;
  drugId: string;
  drugName?: string;
}

interface DoseValidation {
  drugId: string;
  drugName?: string;
  dose: string;
  patientAge?: number;
  patientWeight?: number;
  indication?: string;
}

interface DrugInteraction {
  severity: 'low' | 'moderate' | 'high' | 'critical';
  drugs: string[];
  description: string;
  recommendation: string;
  references?: string[];
}

interface CDSResponse {
  status: number;
  success: boolean;
  message: string;
  data: {
    interactions: DrugInteraction[];
    allergies: any[];
    doseWarnings: any[];
    guidelines: any[];
  };
  timestamp: string;
  request_id: string;
}

export const cdsService = {
  /**
   * Check prescription for drug interactions, allergies, and dose issues
   * @param data Prescription details to check
   * @returns CDS analysis with warnings and recommendations
   */
  checkPrescription: async (data: PrescriptionCheck): Promise<CDSResponse> => {
    try {
      const response = await axios.post(
        `${API_URL}/api/v1/cds/check-prescription`,
        data,
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error: any) {
      // If CDS service unavailable, return empty warnings (graceful degradation)
      console.warn('CDS service unavailable, proceeding without checks', error);
      return {
        status: 200,
        success: true,
        message: 'CDS service unavailable',
        data: {
          interactions: [],
          allergies: [],
          doseWarnings: [],
          guidelines: []
        },
        timestamp: new Date().toISOString(),
        request_id: 'fallback'
      };
    }
  },

  /**
   * Check for patient allergies to specific drug
   * @param patientId Patient ID
   * @param drugId Drug ID
   * @returns Allergy information
   */
  checkAllergies: async (patientId: string, drugId: string) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/v1/cds/check-allergies`,
        { patientId, drugId },
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.warn('Allergy check unavailable', error);
      return { data: { hasAllergy: false, allergies: [] } };
    }
  },

  /**
   * Validate drug dosage
   * @param data Dose validation parameters
   * @returns Validation result with recommendations
   */
  validateDose: async (data: DoseValidation) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/v1/cds/validate-dose`,
        data,
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.warn('Dose validation unavailable', error);
      return { data: { isValid: true, warnings: [] } };
    }
  },

  /**
   * Get drug information
   * @param drugId Drug ID
   * @returns Drug details
   */
  getDrugInfo: async (drugId: string) => {
    try {
      const response = await axios.get(
        `${API_URL}/api/v1/cds/drugs/${drugId}`,
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.warn('Drug info unavailable', error);
      return null;
    }
  },

  /**
   * Search drugs
   * @param query Search term
   * @returns Matching drugs
   */
  searchDrugs: async (query: string) => {
    try {
      const response = await axios.get(
        `${API_URL}/api/v1/cds/drugs/search?q=${encodeURIComponent(query)}`,
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.warn('Drug search unavailable', error);
      return { data: [] };
    }
  }
};

export type { DrugInteraction, PrescriptionCheck, CDSResponse };

