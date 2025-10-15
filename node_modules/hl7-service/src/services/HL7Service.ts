import HL7Parser from '../utils/hl7Parser';
import { HL7Message } from '../models/HL7Message';
import { logHL7MessageReceived } from '../utils/logger';
import { Pool } from 'pg';
import { getPostgreSQLPool } from '../utils/database';
import { v4 as uuidv4 } from 'uuid';

/**
 * HL7 Service
 * Core HL7 v2.x message parsing and processing
 */

export class HL7Service {
  private parser: HL7Parser;
  private pool: Pool;

  constructor() {
    this.parser = new HL7Parser();
    this.pool = getPostgreSQLPool();
  }

  /**
   * Parse HL7 message
   */
  async parseMessage(hl7String: string): Promise<HL7Message> {
    const parsed = this.parser.parseMessage(hl7String);
    
    // Extract MSH segment
    const msh = parsed.segments.find(s => s.segmentType === 'MSH');
    if (!msh) {
      throw new Error('Invalid HL7 message: Missing MSH segment');
    }

    const message: HL7Message = {
      messageId: uuidv4(),
      messageType: parsed.messageType,
      messageControlId: parsed.messageControlId,
      sendingApplication: this.parser.getField(msh, 3),
      sendingFacility: this.parser.getField(msh, 4),
      receivingApplication: this.parser.getField(msh, 5),
      receivingFacility: this.parser.getField(msh, 6),
      timestamp: this.parser.parseHL7Timestamp(this.parser.getField(msh, 7)) || new Date(),
      messageStructure: this.parser.getField(msh, 9),
      version: this.parser.getField(msh, 12) || '2.5',
      segments: parsed.segments,
      raw: hl7String,
      processed: false,
    };

    return message;
  }

  /**
   * Store HL7 message
   */
  async storeMessage(message: HL7Message, facilityId: string): Promise<void> {
    const query = `
      INSERT INTO hl7_messages (
        message_id, message_type, message_control_id, sending_application,
        sending_facility, receiving_application, receiving_facility,
        message_timestamp, version, message_data, facility_id,
        processed, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
    `;

    await this.pool.query(query, [
      message.messageId,
      message.messageType,
      message.messageControlId,
      message.sendingApplication,
      message.sendingFacility,
      message.receivingApplication,
      message.receivingFacility,
      message.timestamp,
      message.version,
      JSON.stringify(message),
      facilityId,
      message.processed,
    ]);

    // Log message received
    logHL7MessageReceived({
      messageId: message.messageId,
      messageType: message.messageType,
      source: message.sendingApplication,
      facilityId,
    });
  }

  /**
   * Get message type category (ADT, ORM, ORU)
   */
  getMessageCategory(messageType: string): 'ADT' | 'ORM' | 'ORU' | 'OTHER' {
    if (messageType.startsWith('ADT')) return 'ADT';
    if (messageType.startsWith('ORM')) return 'ORM';
    if (messageType.startsWith('ORU')) return 'ORU';
    return 'OTHER';
  }

  /**
   * Extract patient ID from message
   */
  extractPatientId(message: HL7Message): string | null {
    const pid = message.segments.find(s => s.segmentType === 'PID');
    if (!pid) return null;
    
    return this.parser.getField(pid, 3); // PID-3: Patient Identifier List
  }

  /**
   * Extract visit number from message
   */
  extractVisitNumber(message: HL7Message): string | null {
    const pv1 = message.segments.find(s => s.segmentType === 'PV1');
    if (!pv1) return null;
    
    return this.parser.getField(pv1, 19); // PV1-19: Visit Number
  }
}

export default HL7Service;

