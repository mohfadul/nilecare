/**
 * ORM Message Model
 * Order messages (ORM^O01 - General Order)
 */

export interface ORMMessage {
  messageType: string; // ORM^O01
  messageControlId: string;
  patientIdentifier: string;
  visitNumber?: string;
  order: OrderInformation;
  timestamp: Date;
}

export interface OrderInformation {
  orderId: string;
  placerOrderNumber: string;
  fillerOrderNumber?: string;
  orderControl: string; // NW=New, CA=Cancel, etc.
  orderStatus: string;
  orderDateTime: Date;
  orderingProvider: string;
  orderPriority?: 'S' | 'A' | 'R' | 'T'; // STAT, ASAP, Routine, Timing
  tests: OrderedTest[];
}

export interface OrderedTest {
  identifier: string;
  text: string;
  codingSystem?: string;
  alternateIdentifier?: string;
  quantity?: number;
  specimenSource?: string;
  observations?: string[];
}

export default ORMMessage;

