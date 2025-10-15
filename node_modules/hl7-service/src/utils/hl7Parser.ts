/**
 * HL7 v2.x Message Parser
 * Parses HL7 v2.5 messages into structured objects
 */

export interface HL7Message {
  messageType: string;
  messageControlId: string;
  segments: HL7Segment[];
  raw: string;
}

export interface HL7Segment {
  segmentType: string;
  fields: string[];
  raw: string;
}

export class HL7Parser {
  private readonly FIELD_SEPARATOR = '|';
  private readonly COMPONENT_SEPARATOR = '^';
  private readonly REPETITION_SEPARATOR = '~';
  private readonly ESCAPE_CHARACTER = '\\';
  private readonly SUBCOMPONENT_SEPARATOR = '&';

  /**
   * Parse HL7 message
   */
  parseMessage(hl7String: string): HL7Message {
    const lines = hl7String.split('\r').filter(line => line.trim().length > 0);
    const segments: HL7Segment[] = [];

    for (const line of lines) {
      const segment = this.parseSegment(line);
      segments.push(segment);
    }

    // Extract message header (MSH)
    const msh = segments.find(s => s.segmentType === 'MSH');
    if (!msh) {
      throw new Error('Invalid HL7 message: Missing MSH segment');
    }

    const messageType = this.getField(msh, 9); // MSH-9: Message Type
    const messageControlId = this.getField(msh, 10); // MSH-10: Message Control ID

    return {
      messageType,
      messageControlId,
      segments,
      raw: hl7String,
    };
  }

  /**
   * Parse HL7 segment
   */
  parseSegment(segmentString: string): HL7Segment {
    const fields = segmentString.split(this.FIELD_SEPARATOR);
    const segmentType = fields[0];

    return {
      segmentType,
      fields,
      raw: segmentString,
    };
  }

  /**
   * Get field value from segment
   */
  getField(segment: HL7Segment, fieldIndex: number): string {
    // MSH segment is special - field 1 is the field separator itself
    if (segment.segmentType === 'MSH') {
      fieldIndex++; // Adjust index for MSH
    }

    return segment.fields[fieldIndex] || '';
  }

  /**
   * Get component from field
   */
  getComponent(fieldValue: string, componentIndex: number): string {
    const components = fieldValue.split(this.COMPONENT_SEPARATOR);
    return components[componentIndex] || '';
  }

  /**
   * Get subcomponent from component
   */
  getSubcomponent(componentValue: string, subcomponentIndex: number): string {
    const subcomponents = componentValue.split(this.SUBCOMPONENT_SEPARATOR);
    return subcomponents[subcomponentIndex] || '';
  }

  /**
   * Get repetitions from field
   */
  getRepetitions(fieldValue: string): string[] {
    return fieldValue.split(this.REPETITION_SEPARATOR);
  }

  /**
   * Build HL7 segment from fields
   */
  buildSegment(segmentType: string, fields: string[]): string {
    return segmentType + this.FIELD_SEPARATOR + fields.join(this.FIELD_SEPARATOR);
  }

  /**
   * Build complete HL7 message
   */
  buildMessage(segments: string[]): string {
    return segments.join('\r') + '\r';
  }

  /**
   * Extract message type from HL7 string
   */
  getMessageType(hl7String: string): string {
    const mshLine = hl7String.split('\r')[0];
    const fields = mshLine.split(this.FIELD_SEPARATOR);
    
    // MSH-9 contains message type
    const messageTypeField = fields[9] || '';
    const components = messageTypeField.split(this.COMPONENT_SEPARATOR);
    
    return `${components[0]}_${components[1]}`; // e.g., "ADT_A01"
  }

  /**
   * Generate current timestamp in HL7 format (YYYYMMDDHHmmss)
   */
  getCurrentHL7Timestamp(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }

  /**
   * Parse HL7 timestamp to JavaScript Date
   */
  parseHL7Timestamp(hl7Timestamp: string): Date | null {
    if (!hl7Timestamp || hl7Timestamp.length < 8) {
      return null;
    }

    // HL7 format: YYYYMMDDHHmmss
    const year = parseInt(hl7Timestamp.substring(0, 4));
    const month = parseInt(hl7Timestamp.substring(4, 6)) - 1; // 0-indexed
    const day = parseInt(hl7Timestamp.substring(6, 8));
    const hours = hl7Timestamp.length >= 10 ? parseInt(hl7Timestamp.substring(8, 10)) : 0;
    const minutes = hl7Timestamp.length >= 12 ? parseInt(hl7Timestamp.substring(10, 12)) : 0;
    const seconds = hl7Timestamp.length >= 14 ? parseInt(hl7Timestamp.substring(12, 14)) : 0;

    return new Date(year, month, day, hours, minutes, seconds);
  }

  /**
   * Escape special characters in HL7 field
   */
  escapeField(value: string): string {
    return value
      .replace(/\\/g, '\\E\\')
      .replace(/\|/g, '\\F\\')
      .replace(/\^/g, '\\S\\')
      .replace(/&/g, '\\T\\')
      .replace(/~/g, '\\R\\');
  }

  /**
   * Unescape HL7 field
   */
  unescapeField(value: string): string {
    return value
      .replace(/\\E\\/g, '\\')
      .replace(/\\F\\/g, '|')
      .replace(/\\S\\/g, '^')
      .replace(/\\T\\/g, '&')
      .replace(/\\R\\/g, '~');
  }
}

export default HL7Parser;

