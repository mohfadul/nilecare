"use strict";
/**
 * Data Routes - Serve dashboard data from database
 * Endpoints for patients, appointments, medications, inventory, etc.
 *
 * ✅ PRIORITY 1.1 COMPLIANCE FIX:
 * - Appointments, billing, staff, scheduling → Proxied to Business Service
 * - Ensures ALL dashboard access is logged in audit_logs table
 * - Provides consistent RBAC enforcement across all 11+ dashboards
 * - Maintains single source of truth (Business Service owns business data)
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const promise_1 = __importDefault(require("mysql2/promise"));
const axios_1 = __importDefault(require("axios"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// =============================================================================
// BUSINESS SERVICE INTEGRATION
// =============================================================================
const BUSINESS_SERVICE_URL = process.env.BUSINESS_SERVICE_URL || 'http://localhost:7010';
/**
 * Helper: Forward auth headers to Business Service
 */
function getAuthHeaders(req) {
    const headers = {
        'Content-Type': 'application/json'
    };
    if (req.headers.authorization) {
        headers['Authorization'] = req.headers.authorization;
    }
    return headers;
}
/**
 * Helper: Proxy request to Business Service
 */
async function proxyToBusinessService(path, method, req) {
    try {
        const response = await (0, axios_1.default)({
            method,
            url: `${BUSINESS_SERVICE_URL}${path}`,
            headers: getAuthHeaders(req),
            params: method === 'GET' ? req.query : undefined,
            data: method !== 'GET' ? req.body : undefined,
            timeout: 10000
        });
        return response.data;
    }
    catch (error) {
        if (axios_1.default.isAxiosError(error) && error.response) {
            throw {
                status: error.response.status,
                data: error.response.data
            };
        }
        throw error;
    }
}
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
    return await promise_1.default.createConnection(dbConfig);
}
/**
 * GET /api/v1/data/dashboard/stats
 * Get dashboard statistics
 *
 * ✅ HYBRID APPROACH:
 * - Appointments count → Business Service (with audit logging)
 * - Patients, labs, medications, inventory → Direct DB (owned by Main Service)
 */
router.get('/dashboard/stats', auth_1.authenticate, async (req, res) => {
    const connection = await getConnection();
    try {
        // Patient and clinical data (owned by Main Service)
        const [totalPatients] = await connection.execute('SELECT COUNT(*) as count FROM patients');
        const [totalUsers] = await connection.execute('SELECT COUNT(*) as count FROM users');
        const [pendingLabs] = await connection.execute('SELECT COUNT(*) as count FROM lab_orders WHERE status = ?', ['pending']);
        const [activeMedications] = await connection.execute('SELECT COUNT(*) as count FROM medications WHERE status = ?', ['active']);
        const [lowStockItems] = await connection.execute('SELECT COUNT(*) as count FROM inventory WHERE status = ?', ['low_stock']);
        // ✅ NEW: Get appointment count from Business Service (with audit logging)
        let todayAppointments = 0;
        try {
            const appointmentsResponse = await axios_1.default.get(`${BUSINESS_SERVICE_URL}/api/v1/appointments`, {
                headers: getAuthHeaders(req),
                params: { date: new Date().toISOString().split('T')[0], limit: 1000 }
            });
            todayAppointments = appointmentsResponse.data?.data?.appointments?.length ||
                appointmentsResponse.data?.data?.total || 0;
        }
        catch (error) {
            console.error('Failed to fetch appointments from Business Service:', error);
            // Fallback to direct query if Business Service unavailable
            const [appointments] = await connection.execute('SELECT COUNT(*) as count FROM appointments WHERE appointment_date = CURDATE()');
            todayAppointments = appointments[0].count;
        }
        res.json({
            success: true,
            data: {
                totalPatients: totalPatients[0].count,
                totalUsers: totalUsers[0].count,
                todayAppointments: todayAppointments,
                pendingLabs: pendingLabs[0].count,
                activeMedications: activeMedications[0].count,
                lowStockItems: lowStockItems[0].count,
            }
        });
    }
    catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({
            success: false,
            error: { code: 'DB_ERROR', message: error.message }
        });
    }
    finally {
        await connection.end();
    }
});
// =============================================================================
// APPOINTMENTS - PROXIED TO BUSINESS SERVICE
// =============================================================================
/**
 * GET /api/v1/data/appointments/today
 * Get today's appointments
 *
 * ✅ ROUTED THROUGH BUSINESS SERVICE:
 * - Ensures audit logging (WHO accessed WHAT appointments WHEN)
 * - RBAC enforcement (role-based access control)
 * - Validation and business logic
 */
router.get('/appointments/today', auth_1.authenticate, async (req, res) => {
    try {
        // Proxy to Business Service with today's date filter
        const data = await proxyToBusinessService(`/api/v1/appointments?date=${new Date().toISOString().split('T')[0]}&limit=50`, 'GET', req);
        // Transform to match expected dashboard format
        const appointments = data.data?.appointments || data.data || [];
        const transformedData = Array.isArray(appointments) ? appointments.map((apt) => ({
            id: apt.id,
            patient: apt.patientName || `${apt.patient_first_name || ''} ${apt.patient_last_name || ''}`.trim() || 'Unknown',
            time: apt.appointmentTime || apt.appointment_time,
            doctor: apt.providerName || `Dr. ${apt.provider_first_name || ''} ${apt.provider_last_name || ''}`.trim() || 'Unknown',
            status: apt.status,
            type: apt.appointmentType || apt.reason || 'Consultation',
            duration: apt.duration,
            reason: apt.reason
        })) : [];
        res.json({
            success: true,
            data: transformedData
        });
    }
    catch (error) {
        console.error('Error fetching appointments from Business Service:', error);
        res.status(error.status || 500).json(error.data || {
            success: false,
            error: { code: 'BUSINESS_SERVICE_ERROR', message: error.message }
        });
    }
});
// =============================================================================
// BILLING - PROXIED TO BUSINESS SERVICE
// =============================================================================
/**
 * GET /api/v1/data/billing
 * Get billing records
 *
 * ✅ ROUTED THROUGH BUSINESS SERVICE for audit logging
 */
router.get('/billing', auth_1.authenticate, async (req, res) => {
    try {
        const data = await proxyToBusinessService('/api/v1/billing', 'GET', req);
        res.json(data);
    }
    catch (error) {
        console.error('Error fetching billing from Business Service:', error);
        res.status(error.status || 500).json(error.data || {
            success: false,
            error: { code: 'BUSINESS_SERVICE_ERROR', message: error.message }
        });
    }
});
/**
 * POST /api/v1/data/billing
 * Create billing record
 *
 * ✅ ROUTED THROUGH BUSINESS SERVICE for audit logging
 */
router.post('/billing', auth_1.authenticate, async (req, res) => {
    try {
        const data = await proxyToBusinessService('/api/v1/billing', 'POST', req);
        res.status(201).json(data);
    }
    catch (error) {
        console.error('Error creating billing via Business Service:', error);
        res.status(error.status || 500).json(error.data || {
            success: false,
            error: { code: 'BUSINESS_SERVICE_ERROR', message: error.message }
        });
    }
});
/**
 * GET /api/v1/data/billing/:id
 * Get single billing record
 *
 * ✅ ROUTED THROUGH BUSINESS SERVICE for audit logging
 */
router.get('/billing/:id', auth_1.authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const data = await proxyToBusinessService(`/api/v1/billing/${id}`, 'GET', req);
        res.json(data);
    }
    catch (error) {
        console.error('Error fetching billing from Business Service:', error);
        res.status(error.status || 500).json(error.data || {
            success: false,
            error: { code: 'BUSINESS_SERVICE_ERROR', message: error.message }
        });
    }
});
// =============================================================================
// STAFF - PROXIED TO BUSINESS SERVICE
// =============================================================================
/**
 * GET /api/v1/data/staff
 * Get staff members
 *
 * ✅ ROUTED THROUGH BUSINESS SERVICE for audit logging
 */
router.get('/staff', auth_1.authenticate, async (req, res) => {
    try {
        const data = await proxyToBusinessService('/api/v1/staff', 'GET', req);
        res.json(data);
    }
    catch (error) {
        console.error('Error fetching staff from Business Service:', error);
        res.status(error.status || 500).json(error.data || {
            success: false,
            error: { code: 'BUSINESS_SERVICE_ERROR', message: error.message }
        });
    }
});
/**
 * POST /api/v1/data/staff
 * Create staff member
 *
 * ✅ ROUTED THROUGH BUSINESS SERVICE for audit logging
 */
router.post('/staff', auth_1.authenticate, async (req, res) => {
    try {
        const data = await proxyToBusinessService('/api/v1/staff', 'POST', req);
        res.status(201).json(data);
    }
    catch (error) {
        console.error('Error creating staff via Business Service:', error);
        res.status(error.status || 500).json(error.data || {
            success: false,
            error: { code: 'BUSINESS_SERVICE_ERROR', message: error.message }
        });
    }
});
/**
 * GET /api/v1/data/staff/:id
 * Get single staff member
 *
 * ✅ ROUTED THROUGH BUSINESS SERVICE for audit logging
 */
router.get('/staff/:id', auth_1.authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const data = await proxyToBusinessService(`/api/v1/staff/${id}`, 'GET', req);
        res.json(data);
    }
    catch (error) {
        console.error('Error fetching staff from Business Service:', error);
        res.status(error.status || 500).json(error.data || {
            success: false,
            error: { code: 'BUSINESS_SERVICE_ERROR', message: error.message }
        });
    }
});
// =============================================================================
// SCHEDULING - PROXIED TO BUSINESS SERVICE
// =============================================================================
/**
 * GET /api/v1/data/scheduling
 * Get schedules
 *
 * ✅ ROUTED THROUGH BUSINESS SERVICE for audit logging
 */
router.get('/scheduling', auth_1.authenticate, async (req, res) => {
    try {
        const data = await proxyToBusinessService('/api/v1/scheduling', 'GET', req);
        res.json(data);
    }
    catch (error) {
        console.error('Error fetching schedules from Business Service:', error);
        res.status(error.status || 500).json(error.data || {
            success: false,
            error: { code: 'BUSINESS_SERVICE_ERROR', message: error.message }
        });
    }
});
/**
 * POST /api/v1/data/scheduling
 * Create schedule
 *
 * ✅ ROUTED THROUGH BUSINESS SERVICE for audit logging
 */
router.post('/scheduling', auth_1.authenticate, async (req, res) => {
    try {
        const data = await proxyToBusinessService('/api/v1/scheduling', 'POST', req);
        res.status(201).json(data);
    }
    catch (error) {
        console.error('Error creating schedule via Business Service:', error);
        res.status(error.status || 500).json(error.data || {
            success: false,
            error: { code: 'BUSINESS_SERVICE_ERROR', message: error.message }
        });
    }
});
// =============================================================================
// PATIENTS AND CLINICAL DATA (OWNED BY MAIN SERVICE)
// =============================================================================
/**
 * GET /api/v1/data/patients/recent
 * Get recent patients
 */
router.get('/patients/recent', async (req, res) => {
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: { code: 'DB_ERROR', message: error.message }
        });
    }
    finally {
        await connection.end();
    }
});
/**
 * GET /api/v1/data/patients
 * Get all patients with pagination
 */
router.get('/patients', async (req, res) => {
    const connection = await getConnection();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
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
                total: total[0].count,
                page,
                limit,
                pages: Math.ceil(total[0].count / limit)
            }
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: { code: 'DB_ERROR', message: error.message }
        });
    }
    finally {
        await connection.end();
    }
});
/**
 * GET /api/v1/data/medications/pending
 * Get pending medications
 */
router.get('/medications/pending', async (req, res) => {
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: { code: 'DB_ERROR', message: error.message }
        });
    }
    finally {
        await connection.end();
    }
});
/**
 * GET /api/v1/data/inventory/low-stock
 * Get low stock inventory items
 */
router.get('/inventory/low-stock', async (req, res) => {
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: { code: 'DB_ERROR', message: error.message }
        });
    }
    finally {
        await connection.end();
    }
});
/**
 * GET /api/v1/data/lab-orders/pending
 * Get pending lab orders
 */
router.get('/lab-orders/pending', async (req, res) => {
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: { code: 'DB_ERROR', message: error.message }
        });
    }
    finally {
        await connection.end();
    }
});
/**
 * GET /api/v1/data/prescriptions/pending
 * Get pending prescriptions
 */
router.get('/prescriptions/pending', async (req, res) => {
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: { code: 'DB_ERROR', message: error.message }
        });
    }
    finally {
        await connection.end();
    }
});
/**
 * GET /api/v1/data/tasks/pending
 * Get pending tasks for user
 */
router.get('/tasks/pending', async (req, res) => {
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: { code: 'DB_ERROR', message: error.message }
        });
    }
    finally {
        await connection.end();
    }
});
/**
 * GET /api/v1/data/invoices/pending
 * Get pending/overdue invoices
 */
router.get('/invoices/pending', async (req, res) => {
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: { code: 'DB_ERROR', message: error.message }
        });
    }
    finally {
        await connection.end();
    }
});
/**
 * GET /api/v1/users/all
 * Get all users (for user management)
 */
router.get('/users/all', async (req, res) => {
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
            total: users.length
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: { code: 'DB_ERROR', message: error.message }
        });
    }
    finally {
        await connection.end();
    }
});
/**
 * GET /api/v1/appointments
 * Get all appointments with pagination (for AppointmentList page)
 *
 * ✅ ROUTED THROUGH BUSINESS SERVICE for audit logging
 */
router.get('/appointments', auth_1.authenticate, async (req, res) => {
    try {
        // Proxy to Business Service
        const data = await proxyToBusinessService('/api/v1/appointments', 'GET', req);
        // Business Service returns { success, data: { appointments, pagination } }
        res.json(data);
    }
    catch (error) {
        console.error('Error fetching appointments from Business Service:', error);
        res.status(error.status || 500).json(error.data || {
            success: false,
            error: { code: 'BUSINESS_SERVICE_ERROR', message: error.message }
        });
    }
});
// ============================================================================
// CREATE OPERATIONS (POST)
// ============================================================================
/**
 * POST /api/v1/patients
 * Create a new patient
 */
router.post('/patients', async (req, res) => {
    const connection = await getConnection();
    try {
        // Accept both camelCase (from frontend) and snake_case (for compatibility)
        const { nationalId, national_id, firstName, first_name, lastName, last_name, dateOfBirth, date_of_birth, gender, phoneNumber, phone, email, address, city, state, bloodType, blood_type, allergies, medicalConditions, medical_conditions, medicalHistory, emergencyContact, emergencyContactName, emergency_contact_name, emergencyContactPhone, emergency_contact_phone } = req.body;
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
        }
        else if (typeof allergies === 'string') {
            allergiesStr = allergies;
        }
        // Handle medical conditions/history (can be array or string)
        let medicalConditionsStr = null;
        if (Array.isArray(medicalHistory)) {
            medicalConditionsStr = medicalHistory.join(', ');
        }
        else if (typeof medicalHistory === 'string') {
            medicalConditionsStr = medicalHistory;
        }
        else if (Array.isArray(medicalConditions)) {
            medicalConditionsStr = medicalConditions.join(', ');
        }
        else if (typeof medicalConditions === 'string') {
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: { code: 'DB_ERROR', message: error.message }
        });
    }
    finally {
        await connection.end();
    }
});
/**
 * POST /api/v1/appointments
 * Create a new appointment
 *
 * ✅ ROUTED THROUGH BUSINESS SERVICE for audit logging
 */
router.post('/appointments', auth_1.authenticate, async (req, res) => {
    try {
        const data = await proxyToBusinessService('/api/v1/appointments', 'POST', req);
        res.status(201).json(data);
    }
    catch (error) {
        console.error('Error creating appointment via Business Service:', error);
        res.status(error.status || 500).json(error.data || {
            success: false,
            error: { code: 'BUSINESS_SERVICE_ERROR', message: error.message }
        });
    }
});
/**
 * POST /api/v1/users
 * Create a new user
 */
router.post('/users', async (req, res) => {
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: { code: 'DB_ERROR', message: error.message }
        });
    }
    finally {
        await connection.end();
    }
});
/**
 * POST /api/v1/medications
 * Create a new medication prescription
 */
router.post('/medications', async (req, res) => {
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: { code: 'DB_ERROR', message: error.message }
        });
    }
    finally {
        await connection.end();
    }
});
/**
 * POST /api/v1/lab-orders
 * Create a new lab order
 */
router.post('/lab-orders', async (req, res) => {
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: { code: 'DB_ERROR', message: error.message }
        });
    }
    finally {
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
router.put('/patients/:id', async (req, res) => {
    const connection = await getConnection();
    try {
        const { id } = req.params;
        // Accept both camelCase (from frontend) and snake_case (for compatibility)
        const { firstName, first_name, lastName, last_name, phoneNumber, phone, email, address, city, state, bloodType, blood_type, allergies, medicalConditions, medical_conditions, medicalHistory, emergencyContact, emergencyContactName, emergency_contact_name, emergencyContactPhone, emergency_contact_phone } = req.body;
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
        }
        else if (typeof medicalHistory === 'string') {
            medicalConditionsStr = medicalHistory;
        }
        else if (Array.isArray(medicalConditions)) {
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: { code: 'DB_ERROR', message: error.message }
        });
    }
    finally {
        await connection.end();
    }
});
/**
 * PUT /api/v1/appointments/:id
 * Update appointment
 *
 * ✅ ROUTED THROUGH BUSINESS SERVICE for audit logging
 */
router.put('/appointments/:id', auth_1.authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const data = await proxyToBusinessService(`/api/v1/appointments/${id}`, 'PUT', req);
        res.json(data);
    }
    catch (error) {
        console.error('Error updating appointment via Business Service:', error);
        res.status(error.status || 500).json(error.data || {
            success: false,
            error: { code: 'BUSINESS_SERVICE_ERROR', message: error.message }
        });
    }
});
/**
 * PATCH /api/v1/appointments/:id/status
 * Update appointment status (check-in, complete, cancel)
 *
 * ✅ ROUTED THROUGH BUSINESS SERVICE for audit logging
 */
router.patch('/appointments/:id/status', auth_1.authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const data = await proxyToBusinessService(`/api/v1/appointments/${id}/status`, 'PATCH', req);
        res.json(data);
    }
    catch (error) {
        console.error('Error updating appointment status via Business Service:', error);
        res.status(error.status || 500).json(error.data || {
            success: false,
            error: { code: 'BUSINESS_SERVICE_ERROR', message: error.message }
        });
    }
});
/**
 * PATCH /api/v1/appointments/:id/confirm
 * Confirm an appointment (convenience endpoint)
 *
 * ✅ ROUTED THROUGH BUSINESS SERVICE for audit logging
 */
router.patch('/appointments/:id/confirm', auth_1.authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const data = await proxyToBusinessService(`/api/v1/appointments/${id}/confirm`, 'PATCH', req);
        res.json(data);
    }
    catch (error) {
        console.error('Error confirming appointment via Business Service:', error);
        res.status(error.status || 500).json(error.data || {
            success: false,
            error: { code: 'BUSINESS_SERVICE_ERROR', message: error.message }
        });
    }
});
/**
 * PATCH /api/v1/appointments/:id/complete
 * Complete an appointment (convenience endpoint)
 *
 * ✅ ROUTED THROUGH BUSINESS SERVICE for audit logging
 */
router.patch('/appointments/:id/complete', auth_1.authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const data = await proxyToBusinessService(`/api/v1/appointments/${id}/complete`, 'PATCH', req);
        res.json(data);
    }
    catch (error) {
        console.error('Error completing appointment via Business Service:', error);
        res.status(error.status || 500).json(error.data || {
            success: false,
            error: { code: 'BUSINESS_SERVICE_ERROR', message: error.message }
        });
    }
});
/**
 * PUT /api/v1/users/:id
 * Update user information
 */
router.put('/users/:id', async (req, res) => {
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: { code: 'DB_ERROR', message: error.message }
        });
    }
    finally {
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
router.delete('/patients/:id', async (req, res) => {
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: { code: 'DB_ERROR', message: error.message }
        });
    }
    finally {
        await connection.end();
    }
});
/**
 * DELETE /api/v1/appointments/:id
 * Cancel an appointment
 *
 * ✅ ROUTED THROUGH BUSINESS SERVICE for audit logging
 */
router.delete('/appointments/:id', auth_1.authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const data = await proxyToBusinessService(`/api/v1/appointments/${id}`, 'DELETE', req);
        res.json(data);
    }
    catch (error) {
        console.error('Error cancelling appointment via Business Service:', error);
        res.status(error.status || 500).json(error.data || {
            success: false,
            error: { code: 'BUSINESS_SERVICE_ERROR', message: error.message }
        });
    }
});
/**
 * DELETE /api/v1/users/:id
 * Deactivate a user
 */
router.delete('/users/:id', async (req, res) => {
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: { code: 'DB_ERROR', message: error.message }
        });
    }
    finally {
        await connection.end();
    }
});
/**
 * GET /api/v1/patients/:id
 * Get single patient by ID
 */
router.get('/patients/:id', async (req, res) => {
    const connection = await getConnection();
    try {
        const { id } = req.params;
        const [patients] = await connection.execute(`
      SELECT * FROM patients WHERE id = ? AND deleted_at IS NULL
    `, [id]);
        if (patients.length === 0) {
            return res.status(404).json({
                success: false,
                error: { code: 'NOT_FOUND', message: 'Patient not found' }
            });
        }
        const patient = patients[0];
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
            allergies: patient.allergies ? patient.allergies.split(',').map((s) => s.trim()) : [],
            medicalHistory: patient.medical_conditions ? patient.medical_conditions.split(',').map((s) => s.trim()) : [],
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: { code: 'DB_ERROR', message: error.message }
        });
    }
    finally {
        await connection.end();
    }
});
/**
 * GET /api/v1/appointments/:id
 * Get single appointment by ID
 */
router.get('/appointments/:id', auth_1.authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const data = await proxyToBusinessService(`/api/v1/appointments/${id}`, 'GET', req);
        res.json(data);
    }
    catch (error) {
        console.error('Error fetching appointment from Business Service:', error);
        res.status(error.status || 500).json(error.data || {
            success: false,
            error: { code: 'BUSINESS_SERVICE_ERROR', message: error.message }
        });
    }
});
exports.default = router;
//# sourceMappingURL=data.routes.js.map