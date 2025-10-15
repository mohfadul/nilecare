/**
 * ADT Message Model
 * Admission, Discharge, Transfer messages (ADT^A01, ADT^A03, ADT^A08, etc.)
 */

export interface ADTMessage {
  messageType: string; // ADT^A01, ADT^A03, etc.
  eventType: 'admission' | 'discharge' | 'transfer' | 'update' | 'cancel';
  messageControlId: string;
  patientIdentifier: PatientIdentifier;
  visit: VisitInformation;
  patient: PatientDemographics;
  nextOfKin?: NextOfKin;
  timestamp: Date;
}

export interface PatientIdentifier {
  patientId: string;
  assigningAuthority?: string;
  identifierType?: string;
  facilityId?: string;
}

export interface PatientDemographics {
  patientId: string;
  familyName: string;
  givenName: string;
  middleName?: string;
  dateOfBirth: Date;
  gender: 'M' | 'F' | 'O' | 'U';
  race?: string;
  address?: Address;
  phoneNumbers?: string[];
  maritalStatus?: string;
  language?: string;
  accountNumber?: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface VisitInformation {
  visitNumber: string;
  patientClass: 'I' | 'O' | 'E' | 'R'; // Inpatient, Outpatient, Emergency, Recurring
  admissionType?: string;
  attendingDoctor?: string;
  referringDoctor?: string;
  admitDateTime?: Date;
  dischargeDateTime?: Date;
  location?: Location;
  bedNumber?: string;
}

export interface Location {
  pointOfCare?: string;
  room?: string;
  bed?: string;
  facility?: string;
  locationStatus?: string;
  personLocationType?: string;
  building?: string;
  floor?: string;
}

export interface NextOfKin {
  name: string;
  relationship: string;
  phoneNumber?: string;
  address?: Address;
}

export default ADTMessage;

