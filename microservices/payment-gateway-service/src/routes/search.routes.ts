/**
 * Advanced Search Routes
 * Multi-field search with complex filters
 */

import { Router, Request, Response } from 'express';
import mysql from 'mysql2/promise';

const router = Router();

const getConnection = async () => {
  return await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'nilecare',
  });
};

/**
 * POST /api/v1/search/patients
 * Advanced patient search with multiple filters
 */
router.post('/patients', async (req: Request, res: Response) => {
  const connection = await getConnection();
  
  try {
    const {
      searchTerm,
      gender,
      minAge,
      maxAge,
      bloodType,
      city,
      state,
      hasAllergies,
      hasMedicalConditions,
      dateFrom,
      dateTo,
      page = 1,
      limit = 10,
    } = req.body;

    let query = 'SELECT * FROM patients WHERE deleted_at IS NULL';
    const params: any[] = [];

    // Text search across multiple fields
    if (searchTerm) {
      query += ` AND (
        first_name LIKE ? OR 
        last_name LIKE ? OR 
        phone LIKE ? OR 
        email LIKE ? OR 
        national_id LIKE ?
      )`;
      const searchPattern = `%${searchTerm}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
    }

    // Gender filter
    if (gender) {
      query += ' AND gender = ?';
      params.push(gender);
    }

    // Age range filter
    if (minAge || maxAge) {
      const today = new Date();
      if (maxAge) {
        const minDate = new Date(today.getFullYear() - maxAge, today.getMonth(), today.getDate());
        query += ' AND date_of_birth >= ?';
        params.push(minDate.toISOString().split('T')[0]);
      }
      if (minAge) {
        const maxDate = new Date(today.getFullYear() - minAge, today.getMonth(), today.getDate());
        query += ' AND date_of_birth <= ?';
        params.push(maxDate.toISOString().split('T')[0]);
      }
    }

    // Blood type filter
    if (bloodType) {
      query += ' AND blood_type = ?';
      params.push(bloodType);
    }

    // City filter
    if (city) {
      query += ' AND city LIKE ?';
      params.push(`%${city}%`);
    }

    // State filter
    if (state) {
      query += ' AND state = ?';
      params.push(state);
    }

    // Allergies filter
    if (hasAllergies !== undefined) {
      if (hasAllergies) {
        query += ' AND allergies IS NOT NULL AND allergies != ""';
      } else {
        query += ' AND (allergies IS NULL OR allergies = "")';
      }
    }

    // Medical conditions filter
    if (hasMedicalConditions !== undefined) {
      if (hasMedicalConditions) {
        query += ' AND medical_conditions IS NOT NULL AND medical_conditions != ""';
      } else {
        query += ' AND (medical_conditions IS NULL OR medical_conditions = "")';
      }
    }

    // Date range filter (created date)
    if (dateFrom) {
      query += ' AND created_at >= ?';
      params.push(dateFrom);
    }

    if (dateTo) {
      query += ' AND created_at <= ?';
      params.push(dateTo + ' 23:59:59');
    }

    // Get total count
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
    const [countResult] = await connection.execute(countQuery, params);
    const total = (countResult as any[])[0].total;

    // Add pagination
    const offset = (page - 1) * limit;
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [patients] = await connection.execute(query, params);

    res.json({
      success: true,
      data: {
        patients: (patients as any[]).map(p => ({
          id: p.id,
          nationalId: p.national_id,
          firstName: p.first_name,
          lastName: p.last_name,
          dateOfBirth: p.date_of_birth,
          gender: p.gender,
          phoneNumber: p.phone,
          email: p.email,
          city: p.city,
          state: p.state,
          bloodType: p.blood_type,
          allergies: p.allergies,
          medicalConditions: p.medical_conditions,
          createdAt: p.created_at,
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'DB_ERROR', message: error.message },
    });
  } finally {
    await connection.end();
  }
});

/**
 * POST /api/v1/search/appointments
 * Advanced appointment search
 */
router.post('/appointments', async (req: Request, res: Response) => {
  const connection = await getConnection();
  
  try {
    const {
      searchTerm,
      patientId,
      providerId,
      status,
      statuses, // Array of statuses
      dateFrom,
      dateTo,
      duration,
      appointmentType,
      page = 1,
      limit = 10,
    } = req.body;

    let query = `
      SELECT 
        a.*, 
        p.first_name as patient_first_name, 
        p.last_name as patient_last_name,
        u.first_name as provider_first_name, 
        u.last_name as provider_last_name
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN users u ON a.provider_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    // Text search
    if (searchTerm) {
      query += ` AND (
        p.first_name LIKE ? OR 
        p.last_name LIKE ? OR 
        u.first_name LIKE ? OR 
        u.last_name LIKE ? OR 
        a.reason LIKE ?
      )`;
      const searchPattern = `%${searchTerm}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
    }

    // Patient filter
    if (patientId) {
      query += ' AND a.patient_id = ?';
      params.push(patientId);
    }

    // Provider filter
    if (providerId) {
      query += ' AND a.provider_id = ?';
      params.push(providerId);
    }

    // Status filter (single)
    if (status) {
      query += ' AND a.status = ?';
      params.push(status);
    }

    // Multiple statuses filter
    if (statuses && Array.isArray(statuses) && statuses.length > 0) {
      const placeholders = statuses.map(() => '?').join(',');
      query += ` AND a.status IN (${placeholders})`;
      params.push(...statuses);
    }

    // Date range filter
    if (dateFrom) {
      query += ' AND a.appointment_date >= ?';
      params.push(dateFrom);
    }

    if (dateTo) {
      query += ' AND a.appointment_date <= ?';
      params.push(dateTo);
    }

    // Duration filter
    if (duration) {
      query += ' AND a.duration = ?';
      params.push(duration);
    }

    // Appointment type filter
    if (appointmentType) {
      query += ' AND a.reason LIKE ?';
      params.push(`%${appointmentType}%`);
    }

    // Get total count
    const countQuery = query.replace('SELECT a.*, p.first_name as patient_first_name, p.last_name as patient_last_name, u.first_name as provider_first_name, u.last_name as provider_last_name', 'SELECT COUNT(*) as total');
    const [countResult] = await connection.execute(countQuery, params);
    const total = (countResult as any[])[0].total;

    // Add pagination
    const offset = (page - 1) * limit;
    query += ' ORDER BY a.appointment_date DESC, a.appointment_time DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [appointments] = await connection.execute(query, params);

    res.json({
      success: true,
      data: {
        appointments: (appointments as any[]).map(a => ({
          id: a.id,
          patientId: a.patient_id,
          patientName: `${a.patient_first_name} ${a.patient_last_name}`,
          providerId: a.provider_id,
          providerName: `Dr. ${a.provider_first_name} ${a.provider_last_name}`,
          appointmentDate: a.appointment_date,
          appointmentTime: a.appointment_time,
          duration: a.duration,
          status: a.status,
          reason: a.reason,
          appointmentType: a.reason,
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'DB_ERROR', message: error.message },
    });
  } finally {
    await connection.end();
  }
});

/**
 * POST /api/v1/search/users
 * Advanced user search
 */
router.post('/users', async (req: Request, res: Response) => {
  const connection = await getConnection();
  
  try {
    const {
      searchTerm,
      role,
      roles, // Array of roles
      status,
      specialty,
      department,
      page = 1,
      limit = 10,
    } = req.body;

    let query = 'SELECT * FROM users WHERE 1=1';
    const params: any[] = [];

    // Text search
    if (searchTerm) {
      query += ` AND (
        first_name LIKE ? OR 
        last_name LIKE ? OR 
        email LIKE ? OR 
        phone LIKE ?
      )`;
      const searchPattern = `%${searchTerm}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    // Role filter (single)
    if (role) {
      query += ' AND role = ?';
      params.push(role);
    }

    // Multiple roles filter
    if (roles && Array.isArray(roles) && roles.length > 0) {
      const placeholders = roles.map(() => '?').join(',');
      query += ` AND role IN (${placeholders})`;
      params.push(...roles);
    }

    // Status filter
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    // Specialty filter
    if (specialty) {
      query += ' AND specialty LIKE ?';
      params.push(`%${specialty}%`);
    }

    // Department filter
    if (department) {
      query += ' AND department = ?';
      params.push(department);
    }

    // Get total count
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
    const [countResult] = await connection.execute(countQuery, params);
    const total = (countResult as any[])[0].total;

    // Add pagination
    const offset = (page - 1) * limit;
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [users] = await connection.execute(query, params);

    res.json({
      success: true,
      data: {
        users: users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'DB_ERROR', message: error.message },
    });
  } finally {
    await connection.end();
  }
});

export default router;

