import HL7Parser from '../utils/hl7Parser';
import { HL7Message } from '../models/HL7Message';
import { ORMMessage, OrderInformation } from '../models/ORMMessage';

/**
 * ORM Service  
 * Processes Order messages (lab orders, medication orders)
 */

export class ORMService {
  private parser: HL7Parser;

  constructor() {
    this.parser = new HL7Parser();
  }

  /**
   * Process ORM message
   */
  async processORMMessage(hl7Message: HL7Message): Promise<ORMMessage> {
    const pidSegment = hl7Message.segments.find(s => s.segmentType === 'PID');
    const pv1Segment = hl7Message.segments.find(s => s.segmentType === 'PV1');
    const orcSegment = hl7Message.segments.find(s => s.segmentType === 'ORC');
    const obrSegment = hl7Message.segments.find(s => s.segmentType === 'OBR');

    if (!pidSegment) {
      throw new Error('ORM message missing PID segment');
    }

    if (!orcSegment) {
      throw new Error('ORM message missing ORC segment');
    }

    const patientIdentifier = this.parser.getField(pidSegment, 3);
    const visitNumber = pv1Segment ? this.parser.getField(pv1Segment, 19) : undefined;
    const order = this.extractOrderInformation(orcSegment, obrSegment);

    const ormMessage: ORMMessage = {
      messageType: hl7Message.messageType,
      messageControlId: hl7Message.messageControlId,
      patientIdentifier,
      visitNumber,
      order,
      timestamp: hl7Message.timestamp,
    };

    return ormMessage;
  }

  /**
   * Extract order information from ORC/OBR segments
   */
  private extractOrderInformation(orcSegment: any, obrSegment?: any): OrderInformation {
    const orderControl = this.parser.getField(orcSegment, 1);
    const placerOrderNumber = this.parser.getField(orcSegment, 2);
    const fillerOrderNumber = this.parser.getField(orcSegment, 3);
    const orderStatus = this.parser.getField(orcSegment, 5);
    const orderDateTime = this.parser.parseHL7Timestamp(this.parser.getField(orcSegment, 9)) || new Date();
    const orderingProvider = this.parser.getField(orcSegment, 12);
    const orderPriority = this.parser.getField(orcSegment, 7) as any;

    const tests: any[] = [];
    
    if (obrSegment) {
      const universalServiceId = this.parser.getField(obrSegment, 4);
      const components = universalServiceId.split('^');
      
      tests.push({
        identifier: components[0],
        text: components[1] || components[0],
        codingSystem: components[2],
      });
    }

    return {
      orderId: placerOrderNumber,
      placerOrderNumber,
      fillerOrderNumber,
      orderControl,
      orderStatus,
      orderDateTime,
      orderingProvider,
      orderPriority,
      tests,
    };
  }
}

export default ORMService;

