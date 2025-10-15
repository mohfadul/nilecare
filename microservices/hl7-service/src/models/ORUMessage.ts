/**
 * ORU Message Model
 * Observation Result messages (ORU^R01 - Unsolicited Observation)
 */

export interface ORUMessage {
  messageType: string; // ORU^R01
  messageControlId: string;
  patientIdentifier: string;
  visitNumber?: string;
  orderInfo: ResultOrderInfo;
  observations: ObservationResult[];
  timestamp: Date;
}

export interface ResultOrderInfo {
  placerOrderNumber: string;
  fillerOrderNumber: string;
  universalServiceId: string;
  observationDateTime: Date;
  resultsStatus: 'P' | 'F' | 'C' | 'X'; // Preliminary, Final, Corrected, Cancelled
  resultCopiesTo?: string[];
}

export interface ObservationResult {
  setId: number;
  valueType: 'NM' | 'ST' | 'TX' | 'CE'; // Numeric, String, Text, Coded
  observationIdentifier: string;
  observationName: string;
  observationValue: string | number;
  units?: string;
  referenceRange?: string;
  abnormalFlags?: string[]; // L, H, LL, HH, <, >, N, A
  observationResultStatus: 'P' | 'F' | 'C' | 'X';
  observationDateTime: Date;
  producerId?: string;
  responsibleObserver?: string;
  notes?: string[];
}

export default ORUMessage;

