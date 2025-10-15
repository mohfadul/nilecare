import { v4 as uuidv4 } from 'uuid';
import { Pool } from 'pg';
import { logger } from '../utils/logger';
import { createError } from '../middleware/errorHandler';

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other' | 'unknown';
  phoneNumber: string;
  email?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  emergencyContact?: {
    name: string;
    relationship: string;
    phoneNumber: string;
  };
  medicalHistory?: string[];
  allergies?: string[];
  medications?: string[];
  organizationId: string;
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface CreatePatientData {
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other' | 'unknown';
  phoneNumber: string;
  email?: string;
  address?: any;
  emergencyContact?: any;
  medicalHistory?: string[];
  allergies?: string[];
  medications?: string[];
  organizationId: string;
  createdBy: string;
}

interface UpdatePatientData {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other' | 'unknown';
  phoneNumber?: string;
  email?: string;
  address?: any;
  emergencyContact?: any;
  medicalHistory?: string[];
  allergies?: string[];
  medications?: string[];
  organizationId: string;
  updatedBy: string;
}

interface PaginationOptions {
  organizationId: string;
  page: number;
  limit: number;
  search?: string;
  sort: string;
  order: 'asc' | 'desc';
}

export class PatientService {
  private db: Pool;

  constructor() {
    this.db = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'nilecare',
      user: process.env.DB_USER || 'nilecare',
      password: process.env.DB_PASSWORD || 'nilecare123',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }

  async getAllPatients(options: PaginationOptions): Promise<{
    patients: Patient[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    const { organizationId, page, limit, search, sort, order } = options;
    const offset = (page - 1) * limit;

    try {
      // Build search condition
      let searchCondition = '';
      let queryParams: any[] = [organizationId, limit, offset];
      let paramIndex = 4;

      if (search) {
        searchCondition = `AND (p.first_name ILIKE $${paramIndex} OR p.last_name ILIKE $${paramIndex} OR p.email ILIKE $${paramIndex})`;
        queryParams.push(`%${search}%`);
        paramIndex++;
      }

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM patients p
        WHERE p.organization_id = $1 ${searchCondition}
      `;
      const countResult = await this.db.query(countQuery, queryParams.slice(0, -2));
      const total = parseInt(countResult.rows[0].total);

      // Get patients
      const patientsQuery = `
        SELECT 
          p.*,
          json_build_object(
            'street', p.address_street,
            'city', p.address_city,
            'state', p.address_state,
            'zipCode', p.address_zip_code,
            'country', p.address_country
          ) as address,
          json_build_object(
            'name', p.emergency_contact_name,
            'relationship', p.emergency_contact_relationship,
            'phoneNumber', p.emergency_contact_phone
          ) as emergency_contact,
          p.medical_history,
          p.allergies,
          p.medications
        FROM patients p
        WHERE p.organization_id = $1 ${searchCondition}
        ORDER BY p.${sort} ${order.toUpperCase()}
        LIMIT $2 OFFSET $3
      `;

      const result = await this.db.query(patientsQuery, queryParams);
      const patients = result.rows.map(this.mapRowToPatient);

      return {
        patients,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error getting patients:', error);
      throw createError('Failed to retrieve patients', 500);
    }
  }

  async getPatientById(id: string, organizationId: string): Promise<Patient | null> {
    try {
      const query = `
        SELECT 
          p.*,
          json_build_object(
            'street', p.address_street,
            'city', p.address_city,
            'state', p.address_state,
            'zipCode', p.address_zip_code,
            'country', p.address_country
          ) as address,
          json_build_object(
            'name', p.emergency_contact_name,
            'relationship', p.emergency_contact_relationship,
            'phoneNumber', p.emergency_contact_phone
          ) as emergency_contact,
          p.medical_history,
          p.allergies,
          p.medications
        FROM patients p
        WHERE p.id = $1 AND p.organization_id = $2
      `;

      const result = await this.db.query(query, [id, organizationId]);
      
      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToPatient(result.rows[0]);
    } catch (error) {
      logger.error(`Error getting patient ${id}:`, error);
      throw createError('Failed to retrieve patient', 500);
    }
  }

  async createPatient(data: CreatePatientData): Promise<Patient> {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');

      const patientId = uuidv4();
      const now = new Date();

      // Check if patient already exists with same phone number in organization
      const existingQuery = `
        SELECT id FROM patients 
        WHERE phone_number = $1 AND organization_id = $2
      `;
      const existing = await client.query(existingQuery, [data.phoneNumber, data.organizationId]);
      
      if (existing.rows.length > 0) {
        throw createError('Patient with this phone number already exists', 400);
      }

      const insertQuery = `
        INSERT INTO patients (
          id, first_name, last_name, date_of_birth, gender, phone_number, email,
          address_street, address_city, address_state, address_zip_code, address_country,
          emergency_contact_name, emergency_contact_relationship, emergency_contact_phone,
          medical_history, allergies, medications, organization_id, created_by, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22
        )
        RETURNING *
      `;

      const values = [
        patientId,
        data.firstName,
        data.lastName,
        data.dateOfBirth,
        data.gender,
        data.phoneNumber,
        data.email,
        data.address?.street,
        data.address?.city,
        data.address?.state,
        data.address?.zipCode,
        data.address?.country,
        data.emergencyContact?.name,
        data.emergencyContact?.relationship,
        data.emergencyContact?.phoneNumber,
        data.medicalHistory || [],
        data.allergies || [],
        data.medications || [],
        data.organizationId,
        data.createdBy,
        now,
        now
      ];

      const result = await client.query(insertQuery, values);
      await client.query('COMMIT');

      const patient = this.mapRowToPatient(result.rows[0]);
      logger.info(`Created patient ${patientId} for organization ${data.organizationId}`);
      
      return patient;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error creating patient:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async updatePatient(id: string, data: UpdatePatientData): Promise<Patient | null> {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');

      // Check if patient exists and belongs to organization
      const existingPatient = await this.getPatientById(id, data.organizationId);
      if (!existingPatient) {
        return null;
      }

      // Build dynamic update query
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      const fieldMappings = {
        firstName: 'first_name',
        lastName: 'last_name',
        dateOfBirth: 'date_of_birth',
        gender: 'gender',
        phoneNumber: 'phone_number',
        email: 'email',
        'address.street': 'address_street',
        'address.city': 'address_city',
        'address.state': 'address_state',
        'address.zipCode': 'address_zip_code',
        'address.country': 'address_country',
        'emergencyContact.name': 'emergency_contact_name',
        'emergencyContact.relationship': 'emergency_contact_relationship',
        'emergencyContact.phoneNumber': 'emergency_contact_phone',
        medicalHistory: 'medical_history',
        allergies: 'allergies',
        medications: 'medications'
      };

      Object.entries(data).forEach(([key, value]) => {
        if (key !== 'organizationId' && key !== 'updatedBy' && value !== undefined) {
          const dbField = fieldMappings[key as keyof typeof fieldMappings];
          if (dbField) {
            updateFields.push(`${dbField} = $${paramIndex}`);
            values.push(value);
            paramIndex++;
          }
        }
      });

      if (updateFields.length === 0) {
        return existingPatient;
      }

      updateFields.push(`updated_by = $${paramIndex}`);
      updateFields.push(`updated_at = $${paramIndex + 1}`);
      values.push(data.updatedBy, new Date());
      values.push(id, data.organizationId);

      const updateQuery = `
        UPDATE patients 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex + 2} AND organization_id = $${paramIndex + 3}
        RETURNING *
      `;

      const result = await client.query(updateQuery, values);
      await client.query('COMMIT');

      if (result.rows.length === 0) {
        return null;
      }

      const patient = this.mapRowToPatient(result.rows[0]);
      logger.info(`Updated patient ${id} for organization ${data.organizationId}`);
      
      return patient;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error(`Error updating patient ${id}:`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  async deletePatient(id: string, organizationId: string): Promise<boolean> {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');

      const deleteQuery = `
        DELETE FROM patients 
        WHERE id = $1 AND organization_id = $2
      `;

      const result = await client.query(deleteQuery, [id, organizationId]);
      await client.query('COMMIT');

      const deleted = result.rowCount > 0;
      if (deleted) {
        logger.info(`Deleted patient ${id} for organization ${organizationId}`);
      }
      
      return deleted;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error(`Error deleting patient ${id}:`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  async getPatientEncounters(patientId: string, options: { page: number; limit: number }): Promise<any[]> {
    try {
      const { page, limit } = options;
      const offset = (page - 1) * limit;

      const query = `
        SELECT * FROM encounters 
        WHERE patient_id = $1 
        ORDER BY start_date DESC 
        LIMIT $2 OFFSET $3
      `;

      const result = await this.db.query(query, [patientId, limit, offset]);
      return result.rows;
    } catch (error) {
      logger.error(`Error getting encounters for patient ${patientId}:`, error);
      throw createError('Failed to retrieve patient encounters', 500);
    }
  }

  private mapRowToPatient(row: any): Patient {
    return {
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      dateOfBirth: row.date_of_birth,
      gender: row.gender,
      phoneNumber: row.phone_number,
      email: row.email,
      address: row.address,
      emergencyContact: row.emergency_contact,
      medicalHistory: row.medical_history,
      allergies: row.allergies,
      medications: row.medications,
      organizationId: row.organization_id,
      createdBy: row.created_by,
      updatedBy: row.updated_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}
