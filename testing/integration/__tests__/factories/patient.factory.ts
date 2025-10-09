/**
 * Patient Test Data Factory
 * 
 * Provides factory methods for creating patient test data
 */

interface Address {
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

interface MedicalHistory {
  allergies: string[];
  chronicConditions: string[];
  medications: string[];
  bloodType: string;
}

export interface PatientData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  phone: string;
  email: string;
  address?: Address;
  emergencyContact?: EmergencyContact;
  medicalHistory?: MedicalHistory;
}

/**
 * Factory for creating patient test data
 * 
 * @example
 * const patient = PatientFactory.create({ firstName: 'Ahmed' });
 * const patientWithHistory = PatientFactory.createWithCompleteHistory();
 * const patients = PatientFactory.createBatch(10);
 */
export class PatientFactory {
  private static counter = 0;

  /**
   * Creates a basic patient data object
   */
  static create(overrides: Partial<PatientData> = {}): PatientData {
    this.counter++;
    
    return {
      firstName: 'Test',
      lastName: `Patient${this.counter}`,
      dateOfBirth: '1990-01-01',
      gender: 'male',
      phone: `+24912345${String(this.counter).padStart(4, '0')}`,
      email: `patient${this.counter}.${Date.now()}@test.com`,
      ...overrides,
    };
  }

  /**
   * Creates a patient with complete medical history
   */
  static createWithCompleteHistory(overrides: Partial<PatientData> = {}): PatientData {
    return {
      ...this.create(overrides),
      address: {
        street: '123 Nile Street',
        city: 'Khartoum',
        state: 'Khartoum State',
        country: 'Sudan',
        postalCode: '11111',
      },
      emergencyContact: {
        name: 'Emergency Contact',
        relationship: 'spouse',
        phone: '+249987654321',
      },
      medicalHistory: {
        allergies: ['Penicillin', 'Peanuts'],
        chronicConditions: ['Diabetes Type 2', 'Hypertension'],
        medications: ['Metformin 500mg', 'Lisinopril 10mg'],
        bloodType: 'O+',
      },
    };
  }

  /**
   * Creates a patient with specific medical conditions
   */
  static createWithConditions(
    conditions: string[],
    overrides: Partial<PatientData> = {}
  ): PatientData {
    return {
      ...this.create(overrides),
      medicalHistory: {
        allergies: [],
        chronicConditions: conditions,
        medications: [],
        bloodType: 'O+',
      },
    };
  }

  /**
   * Creates a patient with specific allergies
   */
  static createWithAllergies(
    allergies: string[],
    overrides: Partial<PatientData> = {}
  ): PatientData {
    return {
      ...this.create(overrides),
      medicalHistory: {
        allergies,
        chronicConditions: [],
        medications: [],
        bloodType: 'O+',
      },
    };
  }

  /**
   * Creates a batch of patients
   */
  static createBatch(count: number, overrides: Partial<PatientData> = {}): PatientData[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }

  /**
   * Creates test data for edge case testing
   */
  static createEdgeCases(): PatientData[] {
    return [
      // Very long names
      this.create({
        firstName: 'A'.repeat(100),
        lastName: 'B'.repeat(100),
      }),
      // Special characters
      this.create({
        firstName: 'أحمد',
        lastName: 'محمد',
      }),
      // Minimum age
      this.create({
        dateOfBirth: new Date(Date.now() - 18 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      }),
      // Senior patient
      this.create({
        dateOfBirth: '1940-01-01',
      }),
    ];
  }

  /**
   * Resets the counter (useful between test suites)
   */
  static reset(): void {
    this.counter = 0;
  }
}

