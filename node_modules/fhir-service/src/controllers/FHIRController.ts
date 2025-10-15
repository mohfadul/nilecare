/**
 * FHIR Controller
 * Handles FHIR R4 API endpoints
 * Sudan-specific: Includes Sudan National ID handling
 */

import { Request, Response, NextFunction } from 'express';
import { FHIRService } from '../services/FHIRService';
import { Pool } from 'pg';

export class FHIRController {
  private fhirService: FHIRService;

  constructor(pool: Pool) {
    this.fhirService = new FHIRService(pool);
  }

  /**
   * Create Patient
   * POST /fhir/Patient
   */
  createPatient = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const patientData = req.body;

      // Validate FHIR Patient resource
      if (patientData.resourceType !== 'Patient') {
        return res.status(400).json({
          resourceType: 'OperationOutcome',
          issue: [{
            severity: 'error',
            code: 'invalid',
            diagnostics: 'Resource type must be Patient'
          }]
        });
      }

      // Convert to DTO if needed
      const patient = await this.fhirService.createPatient(patientData);

      res.status(201)
        .header('Location', `/fhir/Patient/${patient.id}`)
        .header('ETag', `W/"${patient.meta?.versionId}"`)
        .header('Last-Modified', patient.meta?.lastUpdated || new Date().toISOString())
        .json(patient);

    } catch (error) {
      next(error);
    }
  };

  /**
   * Search Patients
   * GET /fhir/Patient?name=...
   */
  searchPatients = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const searchParams = req.query as any;

      const bundle = await this.fhirService.searchPatients(searchParams);

      res.status(200).json(bundle);

    } catch (error) {
      next(error);
    }
  };

  /**
   * Get Patient by ID
   * GET /fhir/Patient/:id
   */
  getPatientById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const patient = await this.fhirService.getPatientById(id);

      res.status(200)
        .header('ETag', `W/"${patient.meta?.versionId}"`)
        .header('Last-Modified', patient.meta?.lastUpdated || new Date().toISOString())
        .json(patient);

    } catch (error) {
      next(error);
    }
  };

  /**
   * Update Patient
   * PUT /fhir/Patient/:id
   */
  updatePatient = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const patientData = req.body;

      // Validate resource type
      if (patientData.resourceType !== 'Patient') {
        return res.status(400).json({
          resourceType: 'OperationOutcome',
          issue: [{
            severity: 'error',
            code: 'invalid',
            diagnostics: 'Resource type must be Patient'
          }]
        });
      }

      // Validate ID matches
      if (patientData.id && patientData.id !== id) {
        return res.status(400).json({
          resourceType: 'OperationOutcome',
          issue: [{
            severity: 'error',
            code: 'invalid',
            diagnostics: 'Resource ID does not match URL'
          }]
        });
      }

      const patient = await this.fhirService.updatePatient(id, patientData);

      res.status(200)
        .header('ETag', `W/"${patient.meta?.versionId}"`)
        .header('Last-Modified', patient.meta?.lastUpdated || new Date().toISOString())
        .json(patient);

    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete Patient
   * DELETE /fhir/Patient/:id
   */
  deletePatient = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      await this.fhirService.deletePatient(id);

      res.status(204).send();

    } catch (error) {
      next(error);
    }
  };

  /**
   * Get Patient history
   * GET /fhir/Patient/:id/_history
   */
  getPatientHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { _count = 10, _offset = 0 } = req.query;

      // Implementation would fetch version history
      const bundle: any = {
        resourceType: 'Bundle',
        type: 'history',
        total: 0,
        entry: []
      };

      res.status(200).json(bundle);

    } catch (error) {
      next(error);
    }
  };

  /**
   * Process Bundle (batch/transaction)
   * POST /fhir
   */
  processBundle = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const bundle = req.body;

      if (bundle.resourceType !== 'Bundle') {
        return res.status(400).json({
          resourceType: 'OperationOutcome',
          issue: [{
            severity: 'error',
            code: 'invalid',
            diagnostics: 'Resource type must be Bundle'
          }]
        });
      }

      const responseBundle = await this.fhirService.processBundle(bundle);

      res.status(200).json(responseBundle);

    } catch (error) {
      next(error);
    }
  };

  /**
   * Create Observation
   * POST /fhir/Observation
   */
  createObservation = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const observationData = req.body;

      const observation = await this.fhirService.createObservation(observationData);

      res.status(201)
        .header('Location', `/fhir/Observation/${observation.id}`)
        .json(observation);

    } catch (error) {
      next(error);
    }
  };
}

export default FHIRController;
