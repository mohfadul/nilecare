import { ADTMessage } from '../models/ADTMessage';
import { ORUMessage } from '../models/ORUMessage';
import { logHL7Transformation } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * Transformation Service
 * Transforms between HL7 v2.x and FHIR R4 formats
 */

export class TransformationService {
  /**
   * Transform ADT message to FHIR Patient resource
   */
  async transformADTToFHIRPatient(adtMessage: ADTMessage, facilityId: string): Promise<any> {
    const patient = adtMessage.patient;

    const fhirPatient = {
      resourceType: 'Patient',
      id: uuidv4(),
      meta: {
        profile: ['http://hl7.org/fhir/StructureDefinition/Patient'],
        lastUpdated: new Date().toISOString(),
      },
      identifier: [{
        use: 'official',
        value: patient.patientId,
        system: `urn:oid:${facilityId}`,
      }],
      name: [{
        use: 'official',
        family: patient.familyName,
        given: patient.middleName ? [patient.givenName, patient.middleName] : [patient.givenName],
      }],
      gender: this.mapGender(patient.gender),
      birthDate: patient.dateOfBirth.toISOString().split('T')[0],
      address: patient.address ? [{
        use: 'home',
        line: [patient.address.street],
        city: patient.address.city,
        state: patient.address.state,
        postalCode: patient.address.zipCode,
        country: patient.address.country,
      }] : undefined,
      telecom: patient.phoneNumbers?.map(phone => ({
        system: 'phone',
        value: phone,
        use: 'home',
      })),
      maritalStatus: patient.maritalStatus ? {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/v3-MaritalStatus',
          code: patient.maritalStatus,
        }],
      } : undefined,
    };

    logHL7Transformation({
      sourceFormat: 'HL7',
      targetFormat: 'FHIR',
      messageType: 'ADT',
      success: true,
      facilityId,
    });

    return fhirPatient;
  }

  /**
   * Transform ORU message to FHIR Observation resources
   */
  async transformORUToFHIRObservations(oruMessage: ORUMessage, facilityId: string): Promise<any[]> {
    const observations = oruMessage.observations.map(obs => ({
      resourceType: 'Observation',
      id: uuidv4(),
      meta: {
        profile: ['http://hl7.org/fhir/StructureDefinition/Observation'],
        lastUpdated: new Date().toISOString(),
      },
      status: this.mapObservationStatus(obs.observationResultStatus),
      category: [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/observation-category',
          code: 'laboratory',
          display: 'Laboratory',
        }],
      }],
      code: {
        coding: [{
          system: 'http://loinc.org',
          code: obs.observationIdentifier,
          display: obs.observationName,
        }],
        text: obs.observationName,
      },
      subject: {
        reference: `Patient/${oruMessage.patientIdentifier}`,
      },
      effectiveDateTime: obs.observationDateTime.toISOString(),
      issued: new Date().toISOString(),
      valueQuantity: typeof obs.observationValue === 'number' ? {
        value: obs.observationValue,
        unit: obs.units,
        system: 'http://unitsofmeasure.org',
      } : undefined,
      valueString: typeof obs.observationValue === 'string' ? obs.observationValue : undefined,
      interpretation: obs.abnormalFlags.length > 0 ? [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
          code: obs.abnormalFlags[0],
          display: this.mapAbnormalFlag(obs.abnormalFlags[0]),
        }],
      }] : undefined,
      referenceRange: obs.referenceRange ? [{
        text: obs.referenceRange,
      }] : undefined,
    }));

    logHL7Transformation({
      sourceFormat: 'HL7',
      targetFormat: 'FHIR',
      messageType: 'ORU',
      success: true,
      facilityId,
    });

    return observations;
  }

  /**
   * Transform FHIR Patient to HL7 ADT message
   */
  async transformFHIRPatientToADT(fhirPatient: any, eventCode: string = 'A08'): Promise<string> {
    // TODO: Build HL7 ADT message from FHIR Patient
    // This is a complex transformation that requires building each segment

    logHL7Transformation({
      sourceFormat: 'FHIR',
      targetFormat: 'HL7',
      messageType: 'ADT',
      success: true,
      facilityId: 'system',
    });

    return ''; // Placeholder
  }

  /**
   * Map HL7 gender to FHIR gender
   */
  private mapGender(hl7Gender: string): 'male' | 'female' | 'other' | 'unknown' {
    const genderMap: Record<string, any> = {
      'M': 'male',
      'F': 'female',
      'O': 'other',
      'U': 'unknown',
      'A': 'other',
      'N': 'unknown',
    };
    return genderMap[hl7Gender] || 'unknown';
  }

  /**
   * Map HL7 observation status to FHIR
   */
  private mapObservationStatus(hl7Status: string): 'registered' | 'preliminary' | 'final' | 'amended' | 'corrected' | 'cancelled' {
    const statusMap: Record<string, any> = {
      'P': 'preliminary',
      'F': 'final',
      'C': 'corrected',
      'X': 'cancelled',
    };
    return statusMap[hl7Status] || 'final';
  }

  /**
   * Map abnormal flag to interpretation
   */
  private mapAbnormalFlag(flag: string): string {
    const flagMap: Record<string, string> = {
      'L': 'Low',
      'H': 'High',
      'LL': 'Critical Low',
      'HH': 'Critical High',
      'N': 'Normal',
      'A': 'Abnormal',
      '<': 'Below low normal',
      '>': 'Above high normal',
    };
    return flagMap[flag] || flag;
  }
}

export default TransformationService;

