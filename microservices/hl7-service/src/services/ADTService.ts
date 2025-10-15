import HL7Parser from '../utils/hl7Parser';
import { HL7Message } from '../models/HL7Message';
import { ADTMessage, PatientDemographics, VisitInformation } from '../models/ADTMessage';

/**
 * ADT Service
 * Processes Admission, Discharge, Transfer messages
 * Supported: ADT^A01 (Admit), ADT^A03 (Discharge), ADT^A08 (Update)
 */

export class ADTService {
  private parser: HL7Parser;

  constructor() {
    this.parser = new HL7Parser();
  }

  /**
   * Process ADT message
   */
  async processADTMessage(hl7Message: HL7Message): Promise<ADTMessage> {
    const eventType = this.getEventType(hl7Message.messageType);
    
    // Extract PID segment (Patient Identification)
    const pidSegment = hl7Message.segments.find(s => s.segmentType === 'PID');
    if (!pidSegment) {
      throw new Error('ADT message missing PID segment');
    }

    // Extract PV1 segment (Patient Visit)
    const pv1Segment = hl7Message.segments.find(s => s.segmentType === 'PV1');

    const patient = this.extractPatientDemographics(pidSegment);
    const visit = pv1Segment ? this.extractVisitInformation(pv1Segment) : {} as VisitInformation;

    const adtMessage: ADTMessage = {
      messageType: hl7Message.messageType,
      eventType,
      messageControlId: hl7Message.messageControlId,
      patientIdentifier: {
        patientId: patient.patientId,
      },
      visit,
      patient,
      timestamp: hl7Message.timestamp,
    };

    return adtMessage;
  }

  /**
   * Extract patient demographics from PID segment
   */
  private extractPatientDemographics(pidSegment: any): PatientDemographics {
    const patientId = this.parser.getField(pidSegment, 3);
    const patientName = this.parser.getField(pidSegment, 5);
    const nameComponents = patientName.split('^');

    return {
      patientId,
      familyName: nameComponents[0] || '',
      givenName: nameComponents[1] || '',
      middleName: nameComponents[2],
      dateOfBirth: this.parser.parseHL7Timestamp(this.parser.getField(pidSegment, 7)) || new Date(),
      gender: this.parser.getField(pidSegment, 8) as any || 'U',
      address: this.parseAddress(this.parser.getField(pidSegment, 11)),
      phoneNumbers: [this.parser.getField(pidSegment, 13), this.parser.getField(pidSegment, 14)].filter(Boolean),
      maritalStatus: this.parser.getField(pidSegment, 16),
      language: this.parser.getField(pidSegment, 15),
      accountNumber: this.parser.getField(pidSegment, 18),
    };
  }

  /**
   * Extract visit information from PV1 segment
   */
  private extractVisitInformation(pv1Segment: any): VisitInformation {
    return {
      visitNumber: this.parser.getField(pv1Segment, 19),
      patientClass: this.parser.getField(pv1Segment, 2) as any,
      admissionType: this.parser.getField(pv1Segment, 4),
      attendingDoctor: this.parser.getField(pv1Segment, 7),
      referringDoctor: this.parser.getField(pv1Segment, 8),
      admitDateTime: this.parser.parseHL7Timestamp(this.parser.getField(pv1Segment, 44)) || undefined,
      dischargeDateTime: this.parser.parseHL7Timestamp(this.parser.getField(pv1Segment, 45)) || undefined,
      bedNumber: this.parser.getField(pv1Segment, 3),
    };
  }

  /**
   * Parse address from HL7 format
   */
  private parseAddress(addressString: string): any {
    if (!addressString) return undefined;

    const components = addressString.split('^');
    return {
      street: components[0] || '',
      city: components[2] || '',
      state: components[3] || '',
      zipCode: components[4] || '',
      country: components[5] || 'Sudan',
    };
  }

  /**
   * Determine event type from message type
   */
  private getEventType(messageType: string): 'admission' | 'discharge' | 'transfer' | 'update' | 'cancel' {
    if (messageType.includes('A01')) return 'admission';
    if (messageType.includes('A03')) return 'discharge';
    if (messageType.includes('A02')) return 'transfer';
    if (messageType.includes('A08')) return 'update';
    if (messageType.includes('A11')) return 'cancel';
    return 'update';
  }
}

export default ADTService;

