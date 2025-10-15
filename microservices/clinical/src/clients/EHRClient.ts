/**
 * EHR Client - Electronic Health Record Service Client
 * 
 * HTTP client for integrating with EHR Service
 * Creates clinical documentation (SOAP notes, problem lists, progress notes)
 * 
 * Reference: EHR Service API
 */

import axios, { AxiosInstance } from 'axios';
import { logger } from '../utils/logger';

export interface SOAPNoteInput {
  encounterId: string;
  patientId: string;
  facilityId?: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  chiefComplaint?: string;
  vitalSigns?: any;
  diagnoses?: Array<{
    code: string;
    description: string;
    type: 'primary' | 'secondary' | 'differential';
  }>;
  medications?: Array<{
    name: string;
    dosage: string;
    frequency: string;
    route?: string;
    action: 'continue' | 'start' | 'stop' | 'modify';
  }>;
  orders?: Array<{
    type: 'lab' | 'imaging' | 'procedure' | 'referral';
    description: string;
    urgency: 'routine' | 'urgent' | 'stat';
  }>;
  followUp?: {
    interval: string;
    instructions: string;
    provider?: string;
  };
  tags?: string[];
}

export interface ProblemListInput {
  patientId: string;
  facilityId?: string;
  problemName: string;
  icdCode: string;
  snomedCode?: string;
  onset?: Date;
  severity: 'mild' | 'moderate' | 'severe';
  status: 'active' | 'chronic' | 'intermittent' | 'recurrent' | 'inactive' | 'resolved';
  diagnosedBy?: string;
  diagnosedDate?: Date;
  notes?: string;
  category: 'diagnosis' | 'symptom' | 'finding' | 'complaint';
  priority: 'low' | 'medium' | 'high';
  tags?: string[];
  isChronicCondition?: boolean;
  requiresMonitoring?: boolean;
  monitoringInterval?: string;
}

export interface ProgressNoteInput {
  patientId: string;
  encounterId?: string;
  facilityId?: string;
  noteType: 'daily' | 'shift' | 'discharge' | 'procedure' | 'consultation' | 'transfer' | 'phone' | 'other';
  content: string;
  vitalSigns?: any;
  condition: 'improving' | 'stable' | 'declining' | 'critical';
  consciousness?: 'alert' | 'drowsy' | 'confused' | 'unresponsive';
  medications?: any[];
  interventions?: any[];
  observations?: string[];
  concerns?: string[];
  followUpNeeded?: boolean;
  followUpDate?: Date;
  followUpInstructions?: string;
  tags?: string[];
}

export class EHRClient {
  private client: AxiosInstance;
  private enabled: boolean;
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.EHR_SERVICE_URL || 'http://localhost:4001';
    this.enabled = process.env.ENABLE_EHR_INTEGRATION === 'true' || process.env.NODE_ENV === 'production';
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: parseInt(process.env.EHR_TIMEOUT || '5000'),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Add interceptors for logging
    this.client.interceptors.request.use(
      (config) => {
        logger.debug(`EHR Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        logger.error('EHR Request Error:', error);
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => {
        logger.debug(`EHR Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        if (error.code === 'ECONNREFUSED') {
          logger.error('❌ EHR Service unavailable (connection refused)');
        } else if (error.code === 'ETIMEDOUT') {
          logger.error('❌ EHR Service timeout');
        } else {
          logger.error('EHR Response Error:', error.message);
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Create SOAP note
   */
  async createSOAPNote(
    noteData: SOAPNoteInput,
    authToken: string
  ): Promise<any | null> {
    if (!this.enabled) {
      logger.warn('⚠️  EHR integration disabled - skipping SOAP note creation');
      return null;
    }

    try {
      logger.info(`📝 Creating SOAP note for patient ${noteData.patientId}`);

      const response = await this.client.post(
        '/api/v1/soap-notes',
        noteData,
        {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      );

      if (response.data.success) {
        logger.info(`✅ SOAP note created: ${response.data.data.id}`);
        return response.data.data;
      }

      return null;
    } catch (error: any) {
      logger.error('Error creating SOAP note:', error.message);
      return null;
    }
  }

  /**
   * Add problem to patient's problem list
   */
  async addProblem(
    problemData: ProblemListInput,
    authToken: string
  ): Promise<any | null> {
    if (!this.enabled) {
      logger.warn('⚠️  EHR integration disabled - skipping problem list update');
      return null;
    }

    try {
      logger.info(`📋 Adding problem to patient ${problemData.patientId}: ${problemData.problemName}`);

      const response = await this.client.post(
        '/api/v1/problem-list',
        problemData,
        {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      );

      if (response.data.success) {
        logger.info(`✅ Problem added: ${response.data.data.id}`);
        return response.data.data;
      }

      return null;
    } catch (error: any) {
      logger.error('Error adding problem:', error.message);
      return null;
    }
  }

  /**
   * Get patient's active problems (for CDS integration)
   */
  async getActiveProblems(
    patientId: string,
    authToken: string
  ): Promise<Array<{ code: string; name: string; status: string }> | null> {
    if (!this.enabled) return null;

    try {
      const response = await this.client.get(
        `/api/v1/problem-list/patient/${patientId}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`
          },
          params: {
            activeOnly: true
          }
        }
      );

      if (response.data.success) {
        const problems = response.data.data.problems || [];
        return problems.map((p: any) => ({
          code: p.icdCode,
          name: p.problemName,
          status: p.status
        }));
      }

      return null;
    } catch (error: any) {
      logger.error('Error getting active problems:', error.message);
      return null;
    }
  }

  /**
   * Create progress note
   */
  async createProgressNote(
    noteData: ProgressNoteInput,
    authToken: string
  ): Promise<any | null> {
    if (!this.enabled) {
      logger.warn('⚠️  EHR integration disabled - skipping progress note creation');
      return null;
    }

    try {
      logger.info(`📝 Creating ${noteData.noteType} progress note for patient ${noteData.patientId}`);

      const response = await this.client.post(
        '/api/v1/progress-notes',
        noteData,
        {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      );

      if (response.data.success) {
        logger.info(`✅ Progress note created: ${response.data.data.id}`);
        return response.data.data;
      }

      return null;
    } catch (error: any) {
      logger.error('Error creating progress note:', error.message);
      return null;
    }
  }

  /**
   * Check if EHR service is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health', { timeout: 2000 });
      return response.status === 200;
    } catch (error: any) {
      logger.warn('EHR Service health check failed:', error.message);
      return false;
    }
  }

  /**
   * Get EHR service status
   */
  getStatus(): {
    enabled: boolean;
    baseURL: string;
    timeout: number;
  } {
    return {
      enabled: this.enabled,
      baseURL: this.baseURL,
      timeout: parseInt(process.env.EHR_TIMEOUT || '5000')
    };
  }
}

export default EHRClient;

