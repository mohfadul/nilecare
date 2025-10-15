import { HL7Service } from './HL7Service';
import { ADTService } from './ADTService';
import { ORMService } from './ORMService';
import { ORUService } from './ORUService';
import { logger } from '../utils/logger';

/**
 * Message Processor Service
 * Routes HL7 messages to appropriate processor based on type
 */

export class MessageProcessorService {
  private hl7Service: HL7Service;
  private adtService: ADTService;
  private ormService: ORMService;
  private oruService: ORUService;

  constructor() {
    this.hl7Service = new HL7Service();
    this.adtService = new ADTService();
    this.ormService = new ORMService();
    this.oruService = new ORUService();
  }

  /**
   * Process HL7 message - routes to appropriate processor
   */
  async processMessage(hl7String: string, facilityId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      // Parse message
      const parsed = await this.hl7Service.parseMessage(hl7String);
      
      // Store original message
      await this.hl7Service.storeMessage(parsed, facilityId);

      // Route to appropriate processor
      const category = this.hl7Service.getMessageCategory(parsed.messageType);
      let processedData: any;

      switch (category) {
        case 'ADT':
          processedData = await this.adtService.processADTMessage(parsed);
          // TODO: Send to Clinical Service for patient update
          break;

        case 'ORM':
          processedData = await this.ormService.processORMMessage(parsed);
          // TODO: Send to Lab Service for order creation
          break;

        case 'ORU':
          processedData = await this.oruService.processORUMessage(parsed);
          // TODO: Send to Lab Service for result creation
          break;

        default:
          logger.warn('Unsupported message type', { messageType: parsed.messageType });
          processedData = { messageType: parsed.messageType, raw: hl7String };
      }

      return {
        success: true,
        data: processedData,
      };

    } catch (error: any) {
      logger.error('Error processing HL7 message', {
        error: error.message,
        message: hl7String.substring(0, 200),
      });

      return {
        success: false,
        error: error.message,
      };
    }
  }
}

export default MessageProcessorService;

