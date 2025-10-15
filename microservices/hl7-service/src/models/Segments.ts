/**
 * HL7 Segment Definitions
 * Common HL7 v2.x segments
 */

// MSH - Message Header
export interface MSH {
  fieldSeparator: string;
  encodingCharacters: string;
  sendingApplication: string;
  sendingFacility: string;
  receivingApplication: string;
  receivingFacility: string;
  dateTimeOfMessage: string;
  security?: string;
  messageType: string;
  messageControlId: string;
  processingId: string;
  versionId: string;
}

// PID - Patient Identification
export interface PID {
  setId?: string;
  patientId: string;
  patientIdentifierList: string[];
  alternatePatientId?: string;
  patientName: string;
  mothersMaidenName?: string;
  dateTimeOfBirth: string;
  administrativeSex: string;
  patientAlias?: string;
  race?: string;
  patientAddress: string[];
  countyCode?: string;
  phoneNumberHome?: string[];
  phoneNumberBusiness?: string[];
  primaryLanguage?: string;
  maritalStatus?: string;
  religion?: string;
  patientAccountNumber?: string;
  ssnNumber?: string;
  driversLicenseNumber?: string;
}

// PV1 - Patient Visit
export interface PV1 {
  setId?: string;
  patientClass: string;
  assignedPatientLocation?: string;
  admissionType?: string;
  preadmitNumber?: string;
  priorPatientLocation?: string;
  attendingDoctor: string[];
  referringDoctor?: string[];
  consultingDoctor?: string[];
  hospitalService?: string;
  temporaryLocation?: string;
  preadmitTestIndicator?: string;
  readmissionIndicator?: string;
  admitSource?: string;
  ambulatoryStatus?: string[];
  vipIndicator?: string;
  admittingDoctor?: string[];
  patientType?: string;
  visitNumber: string;
  financialClass?: string[];
  chargePriceIndicator?: string;
  courtesyCode?: string;
  creditRating?: string;
  contractCode?: string[];
  contractEffectiveDate?: string[];
  contractAmount?: string[];
  contractPeriod?: string[];
  interestCode?: string;
  transferToBadDebtCode?: string;
  transferToBadDebtDate?: string;
  badDebtAgencyCode?: string;
  badDebtTransferAmount?: string;
  badDebtRecoveryAmount?: string;
  deleteAccountIndicator?: string;
  deleteAccountDate?: string;
  dischargeDisposition?: string;
  dischargedToLocation?: string;
  dietType?: string;
  servicingFacility?: string;
  bedStatus?: string;
  accountStatus?: string;
  pendingLocation?: string;
  priorTemporaryLocation?: string;
  admitDateTime?: string;
  dischargeDateTime?: string;
}

// OBX - Observation Result
export interface OBX {
  setId: string;
  valueType: string;
  observationIdentifier: string;
  observationSubId?: string;
  observationValue: string[];
  units?: string;
  referencesRange?: string;
  abnormalFlags?: string[];
  probability?: string;
  natureOfAbnormalTest?: string[];
  observationResultStatus: string;
  effectiveDateOfReferenceRange?: string;
  userDefinedAccessChecks?: string;
  dateTimeOfObservation: string;
  producerId?: string;
  responsibleObserver?: string;
}

// ORC - Common Order
export interface ORC {
  orderControl: string;
  placerOrderNumber: string;
  fillerOrderNumber?: string;
  placerGroupNumber?: string;
  orderStatus?: string;
  responseFlag?: string;
  quantityTiming?: string[];
  parent?: string;
  dateTimeOfTransaction?: string;
  enteredBy?: string[];
  verifiedBy?: string[];
  orderingProvider: string[];
  enterersLocation?: string;
  callBackPhoneNumber?: string[];
  orderEffectiveDateTime?: string;
  orderControlCodeReason?: string;
  enteringOrganization?: string;
  enteringDevice?: string;
  actionBy?: string[];
}

export default {
  MSH,
  PID,
  PV1,
  OBX,
  ORC,
};

