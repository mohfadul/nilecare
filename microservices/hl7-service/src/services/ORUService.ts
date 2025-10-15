import HL7Parser from '../utils/hl7Parser';
import { HL7Message } from '../models/HL7Message';
import { ORUMessage, ResultOrderInfo, ObservationResult } from '../models/ORUMessage';

/**
 * ORU Service
 * Processes Observation Result messages (lab results)
 */

export class ORUService {
  private parser: HL7Parser;

  constructor() {
    this.parser = new HL7Parser();
  }

  /**
   * Process ORU message
   */
  async processORUMessage(hl7Message: HL7Message): Promise<ORUMessage> {
    const pidSegment = hl7Message.segments.find(s => s.segmentType === 'PID');
    const pv1Segment = hl7Message.segments.find(s => s.segmentType === 'PV1');
    const obrSegment = hl7Message.segments.find(s => s.segmentType === 'OBR');
    const obxSegments = hl7Message.segments.filter(s => s.segmentType === 'OBX');

    if (!pidSegment) {
      throw new Error('ORU message missing PID segment');
    }

    if (!obrSegment) {
      throw new Error('ORU message missing OBR segment');
    }

    const patientIdentifier = this.parser.getField(pidSegment, 3);
    const visitNumber = pv1Segment ? this.parser.getField(pv1Segment, 19) : undefined;
    const orderInfo = this.extractOrderInfo(obrSegment);
    const observations = obxSegments.map((obx, index) => this.extractObservation(obx, index + 1));

    const oruMessage: ORUMessage = {
      messageType: hl7Message.messageType,
      messageControlId: hl7Message.messageControlId,
      patientIdentifier,
      visitNumber,
      orderInfo,
      observations,
      timestamp: hl7Message.timestamp,
    };

    return oruMessage;
  }

  /**
   * Extract order information from OBR segment
   */
  private extractOrderInfo(obrSegment: any): ResultOrderInfo {
    const placerOrderNumber = this.parser.getField(obrSegment, 2);
    const fillerOrderNumber = this.parser.getField(obrSegment, 3);
    const universalServiceId = this.parser.getField(obrSegment, 4);
    const observationDateTime = this.parser.parseHL7Timestamp(this.parser.getField(obrSegment, 7)) || new Date();
    const resultsStatus = this.parser.getField(obrSegment, 25) as any || 'F';

    return {
      placerOrderNumber,
      fillerOrderNumber,
      universalServiceId,
      observationDateTime,
      resultsStatus,
    };
  }

  /**
   * Extract observation from OBX segment
   */
  private extractObservation(obxSegment: any, setId: number): ObservationResult {
    const valueType = this.parser.getField(obxSegment, 2) as any;
    const observationIdentifier = this.parser.getField(obxSegment, 3);
    const observationComponents = observationIdentifier.split('^');
    const observationValue = this.parser.getField(obxSegment, 5);
    const units = this.parser.getField(obxSegment, 6);
    const referenceRange = this.parser.getField(obxSegment, 7);
    const abnormalFlags = this.parser.getField(obxSegment, 8).split('~').filter(Boolean);
    const observationResultStatus = this.parser.getField(obxSegment, 11) as any || 'F';
    const observationDateTime = this.parser.parseHL7Timestamp(this.parser.getField(obxSegment, 14)) || new Date();

    return {
      setId,
      valueType,
      observationIdentifier: observationComponents[0],
      observationName: observationComponents[1] || observationComponents[0],
      observationValue: valueType === 'NM' ? parseFloat(observationValue) : observationValue,
      units,
      referenceRange,
      abnormalFlags,
      observationResultStatus,
      observationDateTime,
    };
  }
}

export default ORUService;

