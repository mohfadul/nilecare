import { Router, Request, Response } from 'express';

const router = Router();

/**
 * GET /fhir/metadata
 * FHIR Capability Statement
 */
router.get('/', (req: Request, res: Response) => {
  const baseUrl = process.env.FHIR_BASE_URL || 'http://localhost:6001';

  const capabilityStatement = {
    resourceType: 'CapabilityStatement',
    id: 'nilecare-fhir-server',
    status: 'active',
    date: new Date().toISOString(),
    publisher: 'NileCare Healthcare Platform',
    kind: 'instance',
    software: {
      name: 'NileCare FHIR Server',
      version: '1.0.0',
    },
    implementation: {
      description: 'NileCare FHIR R4 Server',
      url: baseUrl,
    },
    fhirVersion: '4.0.1',
    format: ['application/fhir+json', 'application/fhir+xml'],
    rest: [{
      mode: 'server',
      security: {
        cors: true,
        service: [{
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/restful-security-service',
            code: 'SMART-on-FHIR',
            display: 'SMART on FHIR',
          }],
        }],
        extension: [{
          url: 'http://fhir-registry.smarthealthit.org/StructureDefinition/oauth-uris',
          extension: [
            {
              url: 'token',
              valueUri: `${baseUrl}/oauth2/token`,
            },
            {
              url: 'authorize',
              valueUri: `${baseUrl}/oauth2/authorize`,
            },
          ],
        }],
      },
      resource: [
        {
          type: 'Patient',
          profile: 'http://hl7.org/fhir/StructureDefinition/Patient',
          interaction: [
            { code: 'read' },
            { code: 'search-type' },
            { code: 'create' },
            { code: 'update' },
          ],
          searchParam: [
            { name: '_id', type: 'token' },
            { name: 'identifier', type: 'token' },
            { name: 'name', type: 'string' },
            { name: 'family', type: 'string' },
            { name: 'given', type: 'string' },
            { name: 'birthdate', type: 'date' },
            { name: 'gender', type: 'token' },
          ],
        },
        {
          type: 'Observation',
          profile: 'http://hl7.org/fhir/StructureDefinition/Observation',
          interaction: [
            { code: 'read' },
            { code: 'search-type' },
            { code: 'create' },
            { code: 'update' },
          ],
        },
        {
          type: 'Condition',
          profile: 'http://hl7.org/fhir/StructureDefinition/Condition',
          interaction: [
            { code: 'read' },
            { code: 'search-type' },
            { code: 'create' },
            { code: 'update' },
          ],
        },
        {
          type: 'MedicationRequest',
          profile: 'http://hl7.org/fhir/StructureDefinition/MedicationRequest',
          interaction: [
            { code: 'read' },
            { code: 'search-type' },
            { code: 'create' },
            { code: 'update' },
          ],
        },
        {
          type: 'Encounter',
          profile: 'http://hl7.org/fhir/StructureDefinition/Encounter',
          interaction: [
            { code: 'read' },
            { code: 'search-type' },
            { code: 'create' },
            { code: 'update' },
          ],
        },
      ],
      interaction: [
        { code: 'transaction' },
        { code: 'batch' },
        { code: 'search-system' },
      ],
    }],
  };

  res.json(capabilityStatement);
});

export default router;

