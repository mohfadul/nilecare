/**
 * CDS Client - Clinical Decision Support Service Client
 * 
 * HTTP client for integrating with CDS Service
 * Performs medication safety checks before prescribing
 * 
 * Reference: CDS Integration Guide
 * @see microservices/clinical/CDS_INTEGRATION_GUIDE.md
 */

import axios, { AxiosInstance } from 'axios';
import { logger } from '../utils/logger';

export interface MedicationInput {
  id?: string;
  name: string;
  dose: string;
  frequency: string;
  route?: string;
  rxNormCode?: string;
}

export interface AllergyInput {
  allergen: string;
  severity: 'mild' | 'moderate' | 'severe' | 'life-threatening';
  reaction?: string;
}

export interface ConditionInput {
  code: string; // ICD-10 code
  name: string;
  status?: 'active' | 'inactive' | 'resolved';
}

export interface MedicationSafetyCheck {
  patientId: string;
  medications: MedicationInput[];
  allergies?: string[] | AllergyInput[];
  conditions?: ConditionInput[];
  patientAge?: number;
  patientWeight?: number;
  renalFunction?: number;
  hepaticFunction?: 'normal' | 'mild' | 'moderate' | 'severe';
}

export interface DrugInteraction {
  severity: 'minor' | 'moderate' | 'major' | 'critical';
  drug1: string;
  drug2: string;
  description: string;
  recommendation: string;
  evidenceLevel: string;
}

export interface AllergyAlert {
  severity: 'mild' | 'moderate' | 'severe' | 'life-threatening';
  allergen: string;
  medication: string;
  alertType: 'direct-match' | 'cross-reactivity' | 'class-warning';
  crossReactivityRisk?: number;
  description: string;
  recommendation: string;
}

export interface ContraindicationAlert {
  type: 'absolute' | 'relative';
  severity: 'mild' | 'moderate' | 'severe' | 'critical';
  medication: string;
  condition: string;
  description: string;
  clinicalRationale: string;
  alternatives: string[];
  recommendation: string;
  blocksAdministration: boolean;
}

export interface DoseValidationResult {
  medication: string;
  prescribedDose: string;
  therapeuticRange: {
    min: number;
    max: number;
    unit: string;
  } | null;
  status: 'ok' | 'below-range' | 'above-range' | 'sub-therapeutic' | 'toxic';
  warnings: string[];
  recommendations: string[];
  adjustmentNeeded: boolean;
  adjustedDose?: {
    dose: number;
    unit: string;
    reason: string;
  };
}

export interface GuidelineRecommendation {
  guideline: string;
  condition: string;
  recommendation: string;
  evidenceLevel: string;
  strength: string;
  applicability: 'high' | 'medium' | 'low';
  reasoning: string;
}

export interface SafetyAssessment {
  interactions: {
    hasInteractions: boolean;
    interactions: DrugInteraction[];
    highestSeverity: 'none' | 'minor' | 'moderate' | 'major' | 'critical';
    requiresAction: boolean;
  };
  allergyAlerts: {
    hasAlerts: boolean;
    alerts: AllergyAlert[];
    highestSeverity: 'none' | 'mild' | 'moderate' | 'severe' | 'life-threatening';
    blocksAdministration: boolean;
  };
  contraindications: {
    hasContraindications: boolean;
    contraindications: ContraindicationAlert[];
    absoluteContraindications: ContraindicationAlert[];
    relativeContraindications: ContraindicationAlert[];
    blocksAdministration: boolean;
  };
  doseValidation: {
    hasErrors: boolean;
    hasWarnings: boolean;
    validations: DoseValidationResult[];
  };
  guidelines: GuidelineRecommendation[];
  overallRisk: {
    score: number;
    level: 'low' | 'medium' | 'high';
    factors: {
      interactions: number;
      allergies: number;
      contraindications: number;
      doseIssues: number;
    };
    blocksAdministration: boolean;
  };
}

export class CDSClient {
  private client: AxiosInstance;
  private enabled: boolean;
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.CDS_SERVICE_URL || 'http://localhost:4002';
    this.enabled = process.env.ENABLE_CDS_INTEGRATION === 'true' || process.env.NODE_ENV === 'production';
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: parseInt(process.env.CDS_TIMEOUT || '5000'), // 5 second timeout
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Add request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        logger.debug(`CDS Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        logger.error('CDS Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        logger.debug(`CDS Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        if (error.code === 'ECONNREFUSED') {
          logger.error('❌ CDS Service unavailable (connection refused)');
        } else if (error.code === 'ETIMEDOUT') {
          logger.error('❌ CDS Service timeout');
        } else {
          logger.error('CDS Response Error:', error.message);
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Check medication safety
   * Comprehensive check including interactions, allergies, dose, contraindications, guidelines
   */
  async checkMedicationSafety(
    data: MedicationSafetyCheck,
    authToken: string
  ): Promise<SafetyAssessment | null> {
    if (!this.enabled) {
      logger.warn('⚠️  CDS integration disabled - skipping safety check');
      return null;
    }

    const startTime = Date.now();

    try {
      logger.info(`🔍 Checking medication safety for patient ${data.patientId} (${data.medications.length} medications)`);

      const response = await this.client.post<{ success: boolean; data: SafetyAssessment }>(
        '/api/v1/check-medication',
        data,
        {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      );

      const duration = Date.now() - startTime;

      if (response.data.success) {
        const assessment = response.data.data;
        logger.info(`✅ Safety check complete in ${duration}ms - Risk: ${assessment.overallRisk.level}`);
        
        // Log findings
        if (assessment.interactions.hasInteractions) {
          logger.warn(`⚠️  Found ${assessment.interactions.interactions.length} drug interactions`);
        }
        if (assessment.allergyAlerts.hasAlerts) {
          logger.warn(`⚠️  Found ${assessment.allergyAlerts.alerts.length} allergy alerts`);
        }
        if (assessment.contraindications.hasContraindications) {
          logger.warn(`⚠️  Found ${assessment.contraindications.contraindications.length} contraindications`);
        }
        if (assessment.doseValidation.hasErrors) {
          logger.warn(`⚠️  Dose validation errors detected`);
        }
        
        return assessment;
      }

      logger.warn('⚠️  CDS Service returned unsuccessful response');
      return null;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      logger.error(`❌ CDS service error after ${duration}ms:`, error.message);
      
      // Don't block prescription if CDS service is down
      // but log the error for investigation
      if (error.code === 'ECONNREFUSED') {
        logger.error('⚠️  CDS Service unavailable - proceeding without safety check');
        logger.error('⚠️  MANUAL SAFETY REVIEW REQUIRED');
      } else if (error.code === 'ETIMEDOUT') {
        logger.error('⚠️  CDS Service timeout - proceeding without safety check');
        logger.error('⚠️  MANUAL SAFETY REVIEW REQUIRED');
      }
      
      return null; // Return null instead of throwing - allow prescription with warning
    }
  }

  /**
   * Check drug interactions only
   */
  async checkDrugInteractions(
    medications: MedicationInput[],
    authToken: string
  ): Promise<DrugInteraction[] | null> {
    if (!this.enabled) return null;

    try {
      const response = await this.client.post(
        '/api/v1/drug-interactions/check',
        { medications },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      if (response.data.success) {
        return response.data.data.interactions || [];
      }

      return null;
    } catch (error: any) {
      logger.error('Error checking drug interactions:', error.message);
      return null;
    }
  }

  /**
   * Check allergy alerts only
   */
  async checkAllergyAlerts(
    medications: MedicationInput[],
    allergies: string[] | AllergyInput[],
    authToken: string
  ): Promise<AllergyAlert[] | null> {
    if (!this.enabled) return null;

    try {
      const response = await this.client.post(
        '/api/v1/allergy-alerts/check',
        { medications, allergies },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      if (response.data.success) {
        return response.data.data.alerts || [];
      }

      return null;
    } catch (error: any) {
      logger.error('Error checking allergy alerts:', error.message);
      return null;
    }
  }

  /**
   * Validate doses only
   */
  async validateDoses(
    medications: MedicationInput[],
    patientContext: {
      patientId: string;
      age?: number;
      weight?: number;
      renalFunction?: number;
      hepaticFunction?: 'normal' | 'mild' | 'moderate' | 'severe';
    },
    authToken: string
  ): Promise<DoseValidationResult[] | null> {
    if (!this.enabled) return null;

    try {
      const response = await this.client.post(
        '/api/v1/dose-validation/validate',
        { medications, patientContext },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      if (response.data.success) {
        return response.data.data.validations || [];
      }

      return null;
    } catch (error: any) {
      logger.error('Error validating doses:', error.message);
      return null;
    }
  }

  /**
   * Check if CDS service is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health', { timeout: 2000 });
      return response.status === 200;
    } catch (error: any) {
      logger.warn('CDS Service health check failed:', error.message);
      return false;
    }
  }

  /**
   * Get CDS service status
   */
  getStatus(): {
    enabled: boolean;
    baseURL: string;
    timeout: number;
  } {
    return {
      enabled: this.enabled,
      baseURL: this.baseURL,
      timeout: parseInt(process.env.CDS_TIMEOUT || '5000')
    };
  }

  /**
   * Enable CDS integration at runtime
   */
  enable(): void {
    this.enabled = true;
    logger.info('✅ CDS integration enabled');
  }

  /**
   * Disable CDS integration at runtime
   */
  disable(): void {
    this.enabled = false;
    logger.warn('⚠️  CDS integration disabled');
  }
}

export default CDSClient;

