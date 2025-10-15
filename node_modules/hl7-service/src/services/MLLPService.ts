import * as net from 'net';
import HL7Parser from '../utils/hl7Parser';
import { logger, logHL7MessageSent } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * MLLP Service
 * Minimal Lower Layer Protocol for HL7 v2.x
 */

export class MLLPService {
  private parser: HL7Parser;
  
  // MLLP frame markers
  private readonly START_BLOCK = String.fromCharCode(0x0B); // VT
  private readonly END_BLOCK = String.fromCharCode(0x1C); // FS
  private readonly CARRIAGE_RETURN = String.fromCharCode(0x0D); // CR

  constructor() {
    this.parser = new HL7Parser();
  }

  /**
   * Process incoming MLLP message
   */
  async processMessage(hl7Message: string): Promise<{ success: boolean; messageId: string; error?: string }> {
    try {
      const messageId = uuidv4();
      
      // Parse message
      const parsed = this.parser.parseMessage(hl7Message);
      
      // TODO: Route to appropriate message processor (ADT, ORM, ORU)
      
      return {
        success: true,
        messageId,
      };
    } catch (error: any) {
      logger.error('Error processing MLLP message', {
        error: error.message,
        message: hl7Message.substring(0, 200),
      });

      return {
        success: false,
        messageId: '',
        error: error.message,
      };
    }
  }

  /**
   * Generate ACK (Acknowledgment) message
   */
  generateACK(originalMessage: string, ackCode: 'AA' | 'AE' | 'AR'): string {
    // Extract message control ID from original message
    let messageControlId = 'UNKNOWN';
    let sendingApp = 'NILECARE';
    let sendingFacility = 'NILECARE_HL7';
    let receivingApp = 'EXTERNAL';
    let receivingFacility = 'EXTERNAL_FACILITY';

    if (originalMessage) {
      try {
        const parsed = this.parser.parseMessage(originalMessage);
        messageControlId = parsed.messageControlId;
        
        const msh = parsed.segments.find(s => s.segmentType === 'MSH');
        if (msh) {
          // Swap sender and receiver for ACK
          receivingApp = this.parser.getField(msh, 3);
          receivingFacility = this.parser.getField(msh, 4);
          sendingApp = this.parser.getField(msh, 5) || 'NILECARE';
          sendingFacility = this.parser.getField(msh, 6) || 'NILECARE_HL7';
        }
      } catch (error) {
        // Use defaults if parsing fails
      }
    }

    const timestamp = this.parser.getCurrentHL7Timestamp();

    // Build ACK message
    const mshSegment = this.parser.buildSegment('MSH', [
      '^~\\&', // Encoding characters
      sendingApp,
      sendingFacility,
      receivingApp,
      receivingFacility,
      timestamp,
      '',
      'ACK',
      uuidv4(),
      'P',
      '2.5',
    ]);

    const msaSegment = this.parser.buildSegment('MSA', [
      ackCode, // AA=Application Accept, AE=Application Error, AR=Application Reject
      messageControlId,
      ackCode === 'AA' ? 'Message accepted' : 'Message rejected',
    ]);

    const ackMessage = this.parser.buildMessage([mshSegment, msaSegment]);

    return ackMessage;
  }

  /**
   * Send HL7 message via MLLP to external system
   */
  async sendMessage(hl7Message: string, host: string, port: number): Promise<{ success: boolean; ack?: string; error?: string }> {
    return new Promise((resolve) => {
      const socket = net.createConnection({ host, port }, () => {
        // Wrap message with MLLP framing
        const mllpMessage = this.START_BLOCK + hl7Message + this.END_BLOCK + this.CARRIAGE_RETURN;
        socket.write(mllpMessage);
      });

      let buffer = '';

      socket.on('data', (data) => {
        buffer += data.toString();

        // Check for complete ACK
        if (buffer.includes(this.END_BLOCK + this.CARRIAGE_RETURN)) {
          const startIndex = buffer.indexOf(this.START_BLOCK);
          const endIndex = buffer.indexOf(this.END_BLOCK + this.CARRIAGE_RETURN);

          if (startIndex !== -1 && endIndex !== -1) {
            const ack = buffer.substring(startIndex + 1, endIndex);
            
            logHL7MessageSent({
              messageId: uuidv4(),
              messageType: this.parser.getMessageType(hl7Message),
              destination: `${host}:${port}`,
              success: true,
              facilityId: 'system',
            });

            socket.end();
            resolve({ success: true, ack });
          }
        }
      });

      socket.on('error', (error) => {
        logger.error('MLLP socket error', {
          error: error.message,
          host,
          port,
        });

        logHL7MessageSent({
          messageId: uuidv4(),
          messageType: this.parser.getMessageType(hl7Message),
          destination: `${host}:${port}`,
          success: false,
          facilityId: 'system',
        });

        resolve({ success: false, error: error.message });
      });

      socket.on('timeout', () => {
        socket.end();
        resolve({ success: false, error: 'Connection timeout' });
      });

      socket.setTimeout(10000); // 10 second timeout
    });
  }

  /**
   * Validate HL7 message structure
   */
  validateMessage(hl7Message: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    try {
      const parsed = this.parser.parseMessage(hl7Message);

      // Check for required MSH segment
      if (!parsed.segments.find(s => s.segmentType === 'MSH')) {
        errors.push('Missing required MSH segment');
      }

      // Validate message type
      if (!parsed.messageType) {
        errors.push('Invalid or missing message type');
      }

      // Validate message control ID
      if (!parsed.messageControlId) {
        errors.push('Missing message control ID');
      }

    } catch (error: any) {
      errors.push(`Parse error: ${error.message}`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export default MLLPService;

