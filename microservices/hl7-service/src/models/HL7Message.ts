/**
 * HL7 Message Models
 * Base interfaces for HL7 v2.x messages
 */

export interface HL7Message {
  messageId: string;
  messageType: string;
  messageControlId: string;
  sendingApplication: string;
  sendingFacility: string;
  receivingApplication: string;
  receivingFacility: string;
  timestamp: Date;
  messageStructure: string;
  version: string;
  segments: HL7Segment[];
  raw: string;
  processed: boolean;
  processedAt?: Date;
  ackStatus?: 'AA' | 'AE' | 'AR'; // Application Accept, Error, Reject
  errorMessage?: string;
}

export interface HL7Segment {
  segmentType: string;
  sequenceNumber: number;
  fields: HL7Field[];
  raw: string;
}

export interface HL7Field {
  fieldNumber: number;
  value: string;
  components?: HL7Component[];
}

export interface HL7Component {
  componentNumber: number;
  value: string;
  subcomponents?: string[];
}

export interface MessageHeader {
  fieldSeparator: string;
  encodingCharacters: string;
  sendingApplication: string;
  sendingFacility: string;
  receivingApplication: string;
  receivingFacility: string;
  messageDateTime: string;
  security?: string;
  messageType: string;
  messageControlId: string;
  processingId: string;
  versionId: string;
}

export default HL7Message;

