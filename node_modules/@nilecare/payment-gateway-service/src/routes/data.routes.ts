/**
 * Data Routes - Serve dashboard data from database
 * Endpoints for patients, appointments, medications, inventory, etc.
 */

import { Router, Request, Response } from 'express';
import mysql from 'mysql2/promise';

const router = Router();

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'nilecare',
};

// Get database connection
async function getConnection() {
  return await mysql.createConnection(dbConfig);
}

/**
 * GET /api/v1/data/dashboard/stats
 * Get dashboard statistics
 */
router.get('/dashboard/stats', async (req: Request, res: Response) => {
  const connection = await getConnection();
  
  try {
    const [totalPatients] = await connection.execute('SELECT COUNT(*) as count FROM patients');
    const [totalUsers] = await connection.execute('SELECT COUNT(*) as count FROM users');
    const [todayAppointments] = await connection.execute(
      'SELECT COUNT(*) as count FROM appointments WHERE appointment_date = CURDATE()'
    );
    const [pendingLabs] = await connection.execute(
      'SELECT COUNT(*) as count FROM lab_orders WHERE status = ?',
      ['pending']
    );
    const [activeMedications] = await connection.execute(
      'SELECT COUNT(*) as count FROM medications WHERE status = ?',
      ['active']
    );
    const [lowStockItems] = await connection.execute(
      'SELECT COUNT(*) as count FROM inventory WHERE status = ?',
      ['low_stock']
    );

    res.json({
      success: true,
      data: {
        totalPatients: (totalPatients as any)[0].count,
        totalUsers: (totalUsers as any)[0].count,
        todayAppointments: (todayAppointments as any)[0].count,
        pendingLabs: (pendingLabs as any)[0].count,
        activeMedications: (activeMedications as any)[0].count,
        lowStockItems: (lowStockItems as any)[0].count,
      }
    });
  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      error: { code: 'DB_ERROR', message: error.message }
    });
  } finally {
    await connection.end();
  }
});

/**
 * GET /api/v1/data/appointments/today
 * Get today's appointments
 */
router.get('/appointments/today', async (req: Request, res: Response) => {
  const connection = await getConnection();
  
  try {
    const [appointments] = await connection.execute(`
      SELECT 
        a.id, a.appointment_time, a.status, a.reason, a.duration,
        p.first_name as patient_first_name, p.last_name as patient_last_name,
        u.first_name as doctor_first_name, u.last_name as doctor_last_name
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN users u ON a.provider_id = u.id
      WHERE a.appointment_date = CURDATE()
      ORDER BY a.appointment_time
      LIMIT 50
    `);

    res.json({
      success: true,
      data: (appointments as any[]).map(apt => ({
        id: apt.id,
        patient: `${apt.patient_first_name} ${apt.patient_last_name}`,
        time: apt.appointment_time,
        doctor: `Dr. ${apt.doctor_first_name} ${apt.doctor_last_name}`,
        status: apt.status,
        type: apt.reason || 'Consultation', // Use reason as type
        duration: apt.duration,
        reason: apt.reason
      }))
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'DB_ERROR', message: error.message }
    });
  } finally {
    await connection.end();
  }
});

/**
 * GET /api/v1/data/patients/recent
 * Get recent patients
 */
router.get('/patients/recent', async (req: Request, res: Response) => {
  const connection = await getConnection();
  
  try {
    const [patients] = await connection.execute(`
      SELECT 
        id, first_name, last_name, phone, email, city, state,
        blood_type, medical_conditions, created_at
      FROM patients
      ORDER BY created_at DESC
      LIMIT 20
    `);

    res.json({
      success: true,
      data: patients
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'DB_ERROR', message: error.message }
    });
  } finally {
    await connection.end();
  }
});

/**
 * GET /api/v1/data/patients
 * Get all patients with pagination
 */
router.get('/patients', async (req: Request, res: Response) => {
  const connection = await getConnection();
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = (page - 1) * limit;
  
  try {
    const [patients] = await connection.execute(`
      SELECT * FROM patients
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `, [limit, offset]);

    const [total] = await connection.execute('SELECT COUNT(*) as count FROM patients');

    res.json({
      success: true,
      data: {
        patients,
        total: (total as any)[0].count,
        page,
        limit,
        pages: Math.ceil((total as any)[0].count / limit)
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'DB_ERROR', message: error.message }
    });
  } finally {
    await connection.end();
  }
});

/**
 * GET /api/v1/data/medications/pending
 * Get pending medications
 */
router.get('/medications/pending', async (req: Request, res: Response) => {
  const connection = await getConnection();
  
  try {
    const [medications] = await connection.execute(`
      SELECT 
        m.id, m.medication_name, m.dosage, m.frequency, m.status,
        p.first_name as patient_first_name, p.last_name as patient_last_name,
        m.prescribed_date
      FROM medications m
      JOIN patients p ON m.patient_id = p.id
      WHERE m.status = 'active'
      ORDER BY m.prescribed_date DESC
      LIMIT 50
    `);

    res.json({
      success: true,
      data: medications
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'DB_ERROR', message: error.message }
    });
  } finally {
    await connection.end();
  }
});

/**
 * GET /api/v1/data/inventory/low-stock
 * Get low stock inventory items
 */
router.get('/inventory/low-stock', async (req: Request, res: Response) => {
  const connection = await getConnection();
  
  try {
    const [items] = await connection.execute(`
      SELECT * FROM inventory
      WHERE status = 'low_stock' OR quantity < reorder_level
      ORDER BY quantity ASC
      LIMIT 50
    `);

    res.json({
      success: true,
      data: items
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'DB_ERROR', message: error.message }
    });
  } finally {
    await connection.end();
  }
});

/**
 * GET /api/v1/data/lab-orders/pending
 * Get pending lab orders
 */
router.get('/lab-orders/pending', async (req: Request, res: Response) => {
  const connection = await getConnection();
  
  try {
    const [orders] = await connection.execute(`
      SELECT 
        l.id, l.test_name, l.test_type, l.priority, l.status, l.ordered_date,
        p.first_name as patient_first_name, p.last_name as patient_last_name,
        u.first_name as provider_first_name, u.last_name as provider_last_name
      FROM lab_orders l
      JOIN patients p ON l.patient_id = p.id
      JOIN users u ON l.provider_id = u.id
      WHERE l.status IN ('pending', 'in_progress')
      ORDER BY 
        CASE l.priority 
          WHEN 'stat' THEN 1
          WHEN 'urgent' THEN 2
          WHEN 'routine' THEN 3
        END,
        l.ordered_date DESC
      LIMIT 50
    `);

    res.json({
      success: true,
      data: orders
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'DB_ERROR', message: error.message }
    });
  } finally {
    await connection.end();
  }
});

/**
 * GET /api/v1/data/prescriptions/pending
 * Get pending prescriptions
 */
router.get('/prescriptions/pending', async (req: Request, res: Response) => {
  const connection = await getConnection();
  
  try {
    const [prescriptions] = await connection.execute(`
      SELECT 
        pr.id, pr.medication_name, pr.quantity, pr.refills, pr.status, pr.prescribed_date,
        p.first_name as patient_first_name, p.last_name as patient_last_name,
        u.first_name as provider_first_name, u.last_name as provider_last_name
      FROM prescriptions pr
      JOIN patients p ON pr.patient_id = p.id
      JOIN users u ON pr.provider_id = u.id
      WHERE pr.status = 'pending'
      ORDER BY pr.prescribed_date DESC
      LIMIT 50
    `);

    res.json({
      success: true,
      data: prescriptions
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'DB_ERROR', message: error.message }
    });
  } finally {
    await connection.end();
  }
});

/**
 * GET /api/v1/data/tasks/pending
 * Get pending tasks for user
 */
router.get('/tasks/pending', async (req: Request, res: Response) => {
  const connection = await getConnection();
  const userId = req.query.userId || 'user_1';
  
  try {
    const [tasks] = await connection.execute(`
      SELECT * FROM tasks
      WHERE user_id = ? AND status IN ('pending', 'in_progress')
      ORDER BY 
        CASE priority 
          WHEN 'urgent' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          WHEN 'low' THEN 4
        END,
        due_date ASC
      LIMIT 20
    `, [userId]);

    res.json({
      success: true,
      data: tasks
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'DB_ERROR', message: error.message }
    });
  } finally {
    await connection.end();
  }
});

/**
 * GET /api/v1/data/invoices/pending
 * Get pending/overdue invoices
 */
router.get('/invoices/pending', async (req: Request, res: Response) => {
  const connection = await getConnection();
  
  try {
    const [invoices] = await connection.execute(`
      SELECT 
        i.id, i.invoice_number, i.total_amount, i.paid_amount, i.status, i.due_date,
        p.first_name as patient_first_name, p.last_name as patient_last_name
      FROM invoices i
      JOIN patients p ON i.patient_id = p.id
      WHERE i.status IN ('pending', 'overdue')
      ORDER BY i.due_date ASC
      LIMIT 50
    `);

    res.json({
      success: true,
      data: invoices
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'DB_ERROR', message: error.message }
    });
  } finally {
    await connection.end();
  }
});

/**
 * GET /api/v1/users/all
 * Get all users (for user management)
 */
router.get('/users/all', async (req: Request, res: Response) => {
  const connection = await getConnection();
  
  try {
    const [users] = await connection.execute(`
      SELECT id, email, first_name, last_name, role, status, phone, national_id, specialty, department, created_at
      FROM users
      ORDER BY created_at DESC
    `);

    res.json({
      success: true,
      data: users,
      total: (users as any[]).length
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'DB_ERROR', message: error.message }
    });
  } finally {
    await connection.end();
  }
});

/**
 * GET /api/v1/appointments
 * Get all appointments with pagination (for AppointmentList page)
 */
router.get('/appointments', async (req: Request, res: Response) => {
  const connection = await getConnection();
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const offset = (page - 1) * limit;
  
  try {
    const [appointments] = await connection.execute(`
      SELECT 
        a.id, a.patient_id, a.provider_id, a.appointment_date, a.appointment_time, 
        a.status, a.reason, a.duration,
        p.first_name as patient_first_name, p.last_name as patient_last_name,
        u.first_name as provider_first_name, u.last_name as provider_last_name
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN users u ON a.provider_id = u.id
      ORDER BY a.appointment_date DESC, a.appointment_time DESC
      LIMIT ? OFFSET ?
    `, [limit, offset]);

    const [total] = await connection.execute('SELECT COUNT(*) as count FROM appointments');

    res.json({
      success: true,
      data: {
        appointments: (appointments as any[]).map(apt => ({
          id: apt.id,
          patientId: apt.patient_id || `patient_${apt.id}`,
          patientName: `${apt.patient_first_name} ${apt.patient_last_name}`,
          providerId: apt.provider_id || `provider_${apt.id}`,
          providerName: `Dr. ${apt.provider_first_name} ${apt.provider_last_name}`,
          appointmentDate: apt.appointment_date, // Keep as is for date formatting
          appointmentTime: apt.appointment_time,
          appointmentType: apt.reason || 'Consultation',
          status: apt.status,
          duration: apt.duration || 30,
          reason: apt.reason
        })),
        pagination: {
          total: (total as any)[0].count,
          page,
          limit,
          pages: Math.ceil((total as any)[0].count / limit)
        },
        total: (total as any)[0].count,
        page,
        limit,
        pages: Math.ceil((total as any)[0].count / limit)
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'DB_ERROR', message: error.message }
    });
  } finally {
    await connection.end();
  }
});

// ============================================================================
// CREATE OPERATIONS (POST)
// ============================================================================

/**
 * POST /api/v1/patients
 * Create a new patient
 */
router.post('/patients', async (req: Request, res: Response) => {
  const connection = await getConnection();
  
  try {
    // Accept both camelCase (from frontend) and snake_case (for compatibility)
    const {
      nationalId, national_id,
      firstName, first_name,
      lastName, last_name,
      dateOfBirth, date_of_birth,
      gender,
      phoneNumber, phone,
      email,
      address,
      city,
      state,
      bloodType, blood_type,
      allergies,
      medicalConditions, medical_conditions,
      medicalHistory,
      emergencyContact,
      emergencyContactName, emergency_contact_name,
      emergencyContactPhone, emergency_contact_phone
    } = req.body;

    // Generate patient ID
    const patient_id = `pat_${Date.now()}`;
    
    // Generate national_id if not provided
    const patientNationalId = nationalId || national_id || `NID${Date.now()}`;

    // Extract nested address fields if address is an object
    let addressStr = address;
    let cityStr = city;
    let stateStr = state;
    
    if (address && typeof address === 'object') {
      addressStr = address.street || null;
      cityStr = address.city || city || null;
      stateStr = address.state || state || null;
    }

    // Extract emergency contact from nested object
    let emergencyName = emergencyContactName || emergency_contact_name;
    let emergencyPhone = emergencyContactPhone || emergency_contact_phone;
    
    if (emergencyContact && typeof emergencyContact === 'object') {
      emergencyName = emergencyContact.name || emergencyName || null;
      emergencyPhone = emergencyContact.phoneNumber || emergencyContact.phone || emergencyPhone || null;
    }

    // Handle allergies (can be array or string)
    let allergiesStr = null;
    if (Array.isArray(allergies)) {
      allergiesStr = allergies.join(', ');
    } else if (typeof allergies === 'string') {
      allergiesStr = allergies;
    }

    // Handle medical conditions/history (can be array or string)
    let medicalConditionsStr = null;
    if (Array.isArray(medicalHistory)) {
      medicalConditionsStr = medicalHistory.join(', ');
    } else if (typeof medicalHistory === 'string') {
      medicalConditionsStr = medicalHistory;
    } else if (Array.isArray(medicalConditions)) {
      medicalConditionsStr = medicalConditions.join(', ');
    } else if (typeof medicalConditions === 'string') {
      medicalConditionsStr = medicalConditions;
    }

    await connection.execute(`
      INSERT INTO patients (id, national_id, first_name, last_name, date_of_birth, gender, phone, email, address, city, state, blood_type, allergies, medical_conditions, emergency_contact_name, emergency_contact_phone)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      patient_id, 
      patientNationalId,
      firstName || first_name, 
      lastName || last_name, 
      dateOfBirth || date_of_birth, 
      gender, 
      phoneNumber || phone || null, 
      email || null, 
      addressStr || null, 
      cityStr || null, 
      stateStr || null, 
      bloodType || blood_type || null, 
      allergiesStr || null, 
      medicalConditionsStr || null, 
      emergencyName || null, 
      emergencyPhone || null
    ]);

    res.status(201).json({
      success: true,
      data: { id: patient_id, message: 'Patient created successfully' }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'DB_ERROR', message: error.message }
    });
  } finally {
    await connection.end();
  }
});

/**
 * POST /api/v1/appointments
 * Create a new appointment
 */
router.post('/appointments', async (req: Request, res: Response) => {
  const connection = await getConnection();
  
  try {
    const { patient_id, provider_id, appointment_date, appointment_time, duration, reason } = req.body;

    const appointment_id = `apt_${Date.now()}`;
    const status = 'scheduled';

    await connection.execute(`
      INSERT INTO appointments (id, patient_id, provider_id, appointment_date, appointment_time, duration, status, reason)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [appointment_id, patient_id, provider_id, appointment_date, appointment_time, duration || 30, status, reason]);

    res.status(201).json({
      success: true,
      data: { id: appointment_id, message: 'Appointment created successfully' }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'DB_ERROR', message: error.message }
    });
  } finally {
    await connection.end();
  }
});

/**
 * POST /api/v1/users
 * Create a new user
 */
router.post('/users', async (req: Request, res: Response) => {
  const connection = await getConnection();
  
  try {
    const { email, password, first_name, last_name, role, phone, national_id, specialty } = req.body;

    const user_id = `user_${Date.now()}`;
    const status = 'active';

    await connection.execute(`
      INSERT INTO users (id, email, password, first_name, last_name, role, status, phone, national_id, specialty)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [user_id, email, password, first_name, last_name, role, status, phone || null, national_id || null, specialty || null]);

    res.status(201).json({
      success: true,
      data: { id: user_id, message: 'User created successfully' }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'DB_ERROR', message: error.message }
    });
  } finally {
    await connection.end();
  }
});

/**
 * POST /api/v1/medications
 * Create a new medication prescription
 */
router.post('/medications', async (req: Request, res: Response) => {
  const connection = await getConnection();
  
  try {
    const { patient_id, provider_id, medication_name, dosage, frequency, duration_days, instructions } = req.body;

    const medication_id = `med_${Date.now()}`;

    await connection.execute(`
      INSERT INTO medications (id, patient_id, provider_id, medication_name, dosage, frequency, duration_days, instructions, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')
    `, [medication_id, patient_id, provider_id, medication_name, dosage, frequency, duration_days, instructions]);

    res.status(201).json({
      success: true,
      data: { id: medication_id, message: 'Medication prescribed successfully' }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'DB_ERROR', message: error.message }
    });
  } finally {
    await connection.end();
  }
});

/**
 * POST /api/v1/lab-orders
 * Create a new lab order
 */
router.post('/lab-orders', async (req: Request, res: Response) => {
  const connection = await getConnection();
  
  try {
    const { patient_id, provider_id, test_name, test_type, priority } = req.body;

    const lab_order_id = `lab_${Date.now()}`;

    await connection.execute(`
      INSERT INTO lab_orders (id, patient_id, provider_id, test_name, test_type, priority, status)
      VALUES (?, ?, ?, ?, ?, ?, 'pending')
    `, [lab_order_id, patient_id, provider_id, test_name, test_type, priority || 'routine']);

    res.status(201).json({
      success: true,
      data: { id: lab_order_id, message: 'Lab order created successfully' }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'DB_ERROR', message: error.message }
    });
  } finally {
    await connection.end();
  }
});

// ============================================================================
// UPDATE OPERATIONS (PUT/PATCH)
// ============================================================================

/**
 * PUT /api/v1/patients/:id
 * Update patient information
 */
router.put('/patients/:id', async (req: Request, res: Response) => {
  const connection = await getConnection();
  
  try {
    const { id } = req.params;
    
    // Accept both camelCase (from frontend) and snake_case (for compatibility)
    const {
      firstName, first_name,
      lastName, last_name,
      phoneNumber, phone,
      email,
      address,
      city,
      state,
      bloodType, blood_type,
      allergies,
      medicalConditions, medical_conditions,
      medicalHistory,
      emergencyContact,
      emergencyContactName, emergency_contact_name,
      emergencyContactPhone, emergency_contact_phone
    } = req.body;

    // Extract nested address fields if address is an object
    let addressStr = address;
    let cityStr = city;
    let stateStr = state;
    
    if (address && typeof address === 'object') {
      addressStr = address.street || null;
      cityStr = address.city || city || null;
      stateStr = address.state || state || null;
    }

    // Extract emergency contact from nested object
    let emergencyName = emergencyContactName || emergency_contact_name;
    let emergencyPhone = emergencyContactPhone || emergency_contact_phone;
    
    if (emergencyContact && typeof emergencyContact === 'object') {
      emergencyName = emergencyContact.name || emergencyName || null;
      emergencyPhone = emergencyContact.phoneNumber || emergencyContact.phone || emergencyPhone || null;
    }

    // Handle allergies (can be array or string)
    let allergiesStr = allergies;
    if (Array.isArray(allergies)) {
      allergiesStr = allergies.join(', ');
    }

    // Handle medical conditions/history (can be array or string)
    let medicalConditionsStr = medicalConditions || medical_conditions;
    if (Array.isArray(medicalHistory)) {
      medicalConditionsStr = medicalHistory.join(', ');
    } else if (typeof medicalHistory === 'string') {
      medicalConditionsStr = medicalHistory;
    } else if (Array.isArray(medicalConditions)) {
      medicalConditionsStr = medicalConditions.join(', ');
    }

    await connection.execute(`
      UPDATE patients 
      SET first_name = ?, last_name = ?, phone = ?, email = ?, address = ?, city = ?, state = ?,
          blood_type = ?, allergies = ?, medical_conditions = ?, emergency_contact_name = ?, emergency_contact_phone = ?
      WHERE id = ?
    `, [
      firstName || first_name,
      lastName || last_name,
      phoneNumber || phone || null,
      email || null,
      addressStr || null,
      cityStr || null,
      stateStr || null,
      bloodType || blood_type || null,
      allergiesStr || null,
      medicalConditionsStr || null,
      emergencyName || null,
      emergencyPhone || null,
      id
    ]);

    res.json({
      success: true,
      data: { message: 'Patient updated successfully' }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'DB_ERROR', message: error.message }
    });
  } finally {
    await connection.end();
  }
});

/**
 * PUT /api/v1/appointments/:id
 * Update appointment
 */
router.put('/appointments/:id', async (req: Request, res: Response) => {
  const connection = await getConnection();
  
  try {
    const { id } = req.params;
    const { appointment_date, appointment_time, duration, status, reason } = req.body;

    await connection.execute(`
      UPDATE appointments 
      SET appointment_date = ?, appointment_time = ?, duration = ?, status = ?, reason = ?
      WHERE id = ?
    `, [appointment_date, appointment_time, duration, status, reason, id]);

    res.json({
      success: true,
      data: { message: 'Appointment updated successfully' }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'DB_ERROR', message: error.message }
    });
  } finally {
    await connection.end();
  }
});

/**
 * PATCH /api/v1/appointments/:id/status
 * Update appointment status (check-in, complete, cancel)
 */
router.patch('/appointments/:id/status', async (req: Request, res: Response) => {
  const connection = await getConnection();
  
  try {
    const { id } = req.params;
    const { status } = req.body;

    await connection.execute(`
      UPDATE appointments 
      SET status = ?
      WHERE id = ?
    `, [status, id]);

    res.json({
      success: true,
      data: { message: `Appointment ${status} successfully` }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'DB_ERROR', message: error.message }
    });
  } finally {
    await connection.end();
  }
});

/**
 * PATCH /api/v1/appointments/:id/confirm
 * Confirm an appointment (convenience endpoint)
 */
router.patch('/appointments/:id/confirm', async (req: Request, res: Response) => {
  const connection = await getConnection();
  
  try {
    const { id } = req.params;

    await connection.execute(`
      UPDATE appointments 
      SET status = 'confirmed'
      WHERE id = ?
    `, [id]);

    res.json({
      success: true,
      data: { message: 'Appointment confirmed successfully' }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'DB_ERROR', message: error.message }
    });
  } finally {
    await connection.end();
  }
});

/**
 * PATCH /api/v1/appointments/:id/complete
 * Complete an appointment (convenience endpoint)
 */
router.patch('/appointments/:id/complete', async (req: Request, res: Response) => {
  const connection = await getConnection();
  
  try {
    const { id } = req.params;
    const { notes } = req.body;

    await connection.execute(`
      UPDATE appointments 
      SET status = 'completed'
      WHERE id = ?
    `, [id]);

    res.json({
      success: true,
      data: { message: 'Appointment completed successfully' }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'DB_ERROR', message: error.message }
    });
  } finally {
    await connection.end();
  }
});

/**
 * PUT /api/v1/users/:id
 * Update user information
 */
router.put('/users/:id', async (req: Request, res: Response) => {
  const connection = await getConnection();
  
  try {
    const { id } = req.params;
    const { first_name, last_name, phone, specialty, department, role, status } = req.body;

    await connection.execute(`
      UPDATE users 
      SET first_name = ?, last_name = ?, phone = ?, specialty = ?, department = ?, role = ?, status = ?
      WHERE id = ?
    `, [first_name, last_name, phone || null, specialty || null, department || null, role, status, id]);

    res.json({
      success: true,
      data: { message: 'User updated successfully' }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'DB_ERROR', message: error.message }
    });
  } finally {
    await connection.end();
  }
});

// ============================================================================
// DELETE OPERATIONS
// ============================================================================

/**
 * DELETE /api/v1/patients/:id
 * Delete (soft delete) a patient
 */
router.delete('/patients/:id', async (req: Request, res: Response) => {
  const connection = await getConnection();
  
  try {
    const { id } = req.params;

    // Soft delete - set deleted_at timestamp
    await connection.execute(`
      UPDATE patients 
      SET deleted_at = NOW()
      WHERE id = ?
    `, [id]);

    res.json({
      success: true,
      data: { message: 'Patient deleted successfully' }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'DB_ERROR', message: error.message }
    });
  } finally {
    await connection.end();
  }
});

/**
 * DELETE /api/v1/appointments/:id
 * Cancel an appointment
 */
router.delete('/appointments/:id', async (req: Request, res: Response) => {
  const connection = await getConnection();
  
  try {
    const { id } = req.params;

    await connection.execute(`
      UPDATE appointments 
      SET status = 'cancelled'
      WHERE id = ?
    `, [id]);

    res.json({
      success: true,
      data: { message: 'Appointment cancelled successfully' }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'DB_ERROR', message: error.message }
    });
  } finally {
    await connection.end();
  }
});

/**
 * DELETE /api/v1/users/:id
 * Deactivate a user
 */
router.delete('/users/:id', async (req: Request, res: Response) => {
  const connection = await getConnection();
  
  try {
    const { id } = req.params;

    await connection.execute(`
      UPDATE users 
      SET status = 'inactive'
      WHERE id = ?
    `, [id]);

    res.json({
      success: true,
      data: { message: 'User deactivated successfully' }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'DB_ERROR', message: error.message }
    });
  } finally {
    await connection.end();
  }
});

/**
 * GET /api/v1/patients/:id
 * Get single patient by ID
 */
router.get('/patients/:id', async (req: Request, res: Response) => {
  const connection = await getConnection();
  
  try {
    const { id } = req.params;

    const [patients] = await connection.execute(`
      SELECT * FROM patients WHERE id = ? AND deleted_at IS NULL
    `, [id]);

    if ((patients as any[]).length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Patient not found' }
      });
    }

    const patient = (patients as any[])[0];

    // Map database fields to frontend expected format (camelCase with nested objects)
    const mappedPatient = {
      id: patient.id,
      nationalId: patient.national_id,
      firstName: patient.first_name,
      lastName: patient.last_name,
      dateOfBirth: patient.date_of_birth,
      gender: patient.gender,
      phoneNumber: patient.phone,
      email: patient.email,
      
      // Nested address object (for PatientForm compatibility)
      address: {
        street: patient.address,
        city: patient.city,
        state: patient.state,
        zipCode: patient.postal_code,
        country: 'Sudan'
      },
      
      // Nested emergency contact object
      emergencyContact: {
        name: patient.emergency_contact_name,
        relationship: '', // Not stored in DB yet
        phoneNumber: patient.emergency_contact_phone
      },
      
      // Keep flat fields for backward compatibility
      city: patient.city,
      state: patient.state,
      postalCode: patient.postal_code,
      bloodType: patient.blood_type,
      
      // Parse allergies and medical conditions as arrays if comma-separated
      allergies: patient.allergies ? patient.allergies.split(',').map((s: string) => s.trim()) : [],
      medicalHistory: patient.medical_conditions ? patient.medical_conditions.split(',').map((s: string) => s.trim()) : [],
      medicalConditions: patient.medical_conditions,
      
      emergencyContactName: patient.emergency_contact_name,
      emergencyContactPhone: patient.emergency_contact_phone,
      createdAt: patient.created_at,
      updatedAt: patient.updated_at
    };

    res.json({
      success: true,
      data: mappedPatient
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'DB_ERROR', message: error.message }
    });
  } finally {
    await connection.end();
  }
});

/**
 * GET /api/v1/appointments/:id
 * Get single appointment by ID
 */
router.get('/appointments/:id', async (req: Request, res: Response) => {
  const connection = await getConnection();
  
  try {
    const { id } = req.params;

    const [appointments] = await connection.execute(`
      SELECT 
        a.*, 
        p.first_name as patient_first_name, p.last_name as patient_last_name,
        u.first_name as provider_first_name, u.last_name as provider_last_name
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN users u ON a.provider_id = u.id
      WHERE a.id = ?
    `, [id]);

    if ((appointments as any[]).length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Appointment not found' }
      });
    }

    const apt = (appointments as any[])[0];
    res.json({
      success: true,
      data: {
        id: apt.id,
        patientId: apt.patient_id,
        patientName: `${apt.patient_first_name} ${apt.patient_last_name}`,
        providerId: apt.provider_id,
        providerName: `Dr. ${apt.provider_first_name} ${apt.provider_last_name}`,
        appointmentDate: apt.appointment_date,
        appointmentTime: apt.appointment_time,
        duration: apt.duration,
        status: apt.status,
        reason: apt.reason
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'DB_ERROR', message: error.message }
    });
  } finally {
    await connection.end();
  }
});

export default router;

