/**
 * NileCare Platform - Create Test Users Script
 * Programmatically creates test users via API
 */

const axios = require('axios');
const bcrypt = require('bcrypt');

const API_BASE_URL = process.env.API_URL || 'http://localhost:3000';
const DEFAULT_PASSWORD = 'TestPass123!';

// Test users configuration
const testUsers = [
  {
    email: 'admin@nilecare.sd',
    password: DEFAULT_PASSWORD,
    firstName: 'System',
    lastName: 'Administrator',
    role: 'admin',
    phone: '+249911000000',
    nationalId: '10000000001',
    dateOfBirth: '1980-01-01',
    gender: 'male'
  },
  {
    email: 'doctor@nilecare.sd',
    password: DEFAULT_PASSWORD,
    firstName: 'Ahmed',
    lastName: 'Hassan',
    role: 'doctor',
    specialty: 'General Practice',
    licenseNumber: 'MED-SD-12345',
    phone: '+249912345678',
    nationalId: '12345678901',
    dateOfBirth: '1985-05-15',
    gender: 'male'
  },
  {
    email: 'nurse@nilecare.sd',
    password: DEFAULT_PASSWORD,
    firstName: 'Sara',
    lastName: 'Osman',
    role: 'nurse',
    department: 'General Ward',
    licenseNumber: 'NUR-SD-45678',
    phone: '+249945678901',
    nationalId: '45678901234',
    dateOfBirth: '1990-03-25',
    gender: 'female'
  },
  {
    email: 'receptionist@nilecare.sd',
    password: DEFAULT_PASSWORD,
    firstName: 'Hanan',
    lastName: 'Ahmed',
    role: 'receptionist',
    department: 'Front Desk',
    phone: '+249967890123',
    nationalId: '67890123456',
    dateOfBirth: '1995-09-12',
    gender: 'female'
  },
  {
    email: 'pharmacist@nilecare.sd',
    password: DEFAULT_PASSWORD,
    firstName: 'Yousif',
    lastName: 'Hassan',
    role: 'pharmacist',
    department: 'Pharmacy',
    licenseNumber: 'PHM-SD-67890',
    phone: '+249978901234',
    nationalId: '78901234567',
    dateOfBirth: '1986-11-05',
    gender: 'male'
  },
  {
    email: 'lab-tech@nilecare.sd',
    password: DEFAULT_PASSWORD,
    firstName: 'Mariam',
    lastName: 'Suliman',
    role: 'lab_technician',
    department: 'Laboratory',
    licenseNumber: 'LAB-SD-78901',
    phone: '+249989012345',
    nationalId: '89012345678',
    dateOfBirth: '1992-04-30',
    gender: 'female'
  },
  {
    email: 'billing@nilecare.sd',
    password: DEFAULT_PASSWORD,
    firstName: 'Nadia',
    lastName: 'Mohamed',
    role: 'billing_clerk',
    department: 'Finance',
    phone: '+249990123456',
    nationalId: '90123456789',
    dateOfBirth: '1991-07-22',
    gender: 'female'
  },
  {
    email: 'manager@nilecare.sd',
    password: DEFAULT_PASSWORD,
    firstName: 'Khalid',
    lastName: 'Omer',
    role: 'facility_manager',
    department: 'Administration',
    phone: '+249991234567',
    nationalId: '91234567890',
    dateOfBirth: '1983-02-14',
    gender: 'male'
  }
];

// Test patients configuration
const testPatients = [
  {
    nationalId: '12345678901',
    firstName: 'Ahmed',
    lastName: 'Abdullah',
    dateOfBirth: '1985-03-15',
    gender: 'male',
    phone: '+249912345678',
    email: 'ahmed.abdullah@example.sd',
    bloodType: 'O+',
    medicalConditions: 'Hypertension, Diabetes Type 2'
  },
  {
    nationalId: '23456789012',
    firstName: 'Fatima',
    lastName: 'Hassan',
    dateOfBirth: '1990-07-22',
    gender: 'female',
    phone: '+249923456789',
    email: 'fatima.hassan@example.sd',
    bloodType: 'A+',
    allergies: 'Penicillin'
  },
  {
    nationalId: '34567890123',
    firstName: 'Mohamed',
    lastName: 'Ali',
    dateOfBirth: '2010-11-10',
    gender: 'male',
    phone: '+249934567890',
    email: 'parent@example.sd',
    bloodType: 'B+',
    medicalConditions: 'Asthma'
  }
];

/**
 * Create test users
 */
async function createTestUsers() {
  console.log('🚀 Creating test users...\n');

  let successCount = 0;
  let failCount = 0;

  for (const user of testUsers) {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/register`, user);
      
      if (response.status === 201) {
        console.log(`✅ Created user: ${user.email} (${user.role})`);
        successCount++;
      }
    } catch (error) {
      if (error.response?.status === 409) {
        console.log(`⚠️  User already exists: ${user.email}`);
      } else {
        console.log(`❌ Failed to create user: ${user.email}`);
        console.error(`   Error: ${error.message}`);
        failCount++;
      }
    }
  }

  console.log(`\n📊 Users: ${successCount} created, ${failCount} failed\n`);
}

/**
 * Create test patients
 */
async function createTestPatients() {
  console.log('🏥 Creating test patients...\n');

  // First, login as admin to get token
  let adminToken;
  try {
    const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email: 'admin@nilecare.sd',
      password: DEFAULT_PASSWORD
    });
    adminToken = loginResponse.data.token;
  } catch (error) {
    console.error('❌ Failed to login as admin. Cannot create patients.');
    return;
  }

  let successCount = 0;
  let failCount = 0;

  for (const patient of testPatients) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/patients`,
        patient,
        {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.status === 201) {
        console.log(`✅ Created patient: ${patient.firstName} ${patient.lastName}`);
        successCount++;
      }
    } catch (error) {
      if (error.response?.status === 409) {
        console.log(`⚠️  Patient already exists: ${patient.firstName} ${patient.lastName}`);
      } else {
        console.log(`❌ Failed to create patient: ${patient.firstName} ${patient.lastName}`);
        console.error(`   Error: ${error.message}`);
        failCount++;
      }
    }
  }

  console.log(`\n📊 Patients: ${successCount} created, ${failCount} failed\n`);
}

/**
 * Verify test users
 */
async function verifyTestUsers() {
  console.log('🔍 Verifying test users...\n');

  const testCredentials = [
    { email: 'admin@nilecare.sd', role: 'admin' },
    { email: 'doctor@nilecare.sd', role: 'doctor' },
    { email: 'nurse@nilecare.sd', role: 'nurse' }
  ];

  for (const cred of testCredentials) {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email: cred.email,
        password: DEFAULT_PASSWORD
      });
      
      if (response.status === 200 && response.data.token) {
        console.log(`✅ Verified: ${cred.email} - Login successful`);
      }
    } catch (error) {
      console.log(`❌ Verification failed: ${cred.email}`);
    }
  }
}

/**
 * Display quick reference
 */
function displayQuickReference() {
  console.log('\n' + '='.repeat(50));
  console.log('🎉 TEST USERS READY!');
  console.log('='.repeat(50));
  console.log('\n📝 Quick Login Reference:\n');
  console.log('  Admin:        admin@nilecare.sd / TestPass123!');
  console.log('  Doctor:       doctor@nilecare.sd / TestPass123!');
  console.log('  Nurse:        nurse@nilecare.sd / TestPass123!');
  console.log('  Receptionist: receptionist@nilecare.sd / TestPass123!');
  console.log('  Pharmacist:   pharmacist@nilecare.sd / TestPass123!');
  console.log('\n🌐 Login URL: http://localhost:5173/login');
  console.log('\n⚠️  Remember to change passwords in production!');
  console.log('='.repeat(50) + '\n');
}

/**
 * Main execution
 */
async function main() {
  console.log('\n' + '='.repeat(50));
  console.log('  NILECARE - TEST USER CREATION SCRIPT');
  console.log('='.repeat(50) + '\n');
  console.log(`API URL: ${API_BASE_URL}\n`);

  try {
    await createTestUsers();
    await createTestPatients();
    await verifyTestUsers();
    displayQuickReference();
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Script failed:', error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { createTestUsers, createTestPatients };

