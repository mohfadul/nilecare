/**
 * User role constants and permissions
 */

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  DOCTOR: 'doctor',
  NURSE: 'nurse',
  RECEPTIONIST: 'receptionist',
  LAB_TECHNICIAN: 'lab_technician',
  PHARMACIST: 'pharmacist',
  BILLING_CLERK: 'billing_clerk',
  PATIENT: 'patient',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

export const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: ['*'], // All permissions
  [ROLES.ADMIN]: [
    'users:read',
    'users:create',
    'users:update',
    'users:delete',
    'patients:*',
    'appointments:*',
    'billing:*',
    'reports:*',
  ],
  [ROLES.DOCTOR]: [
    'patients:read',
    'patients:update',
    'appointments:read',
    'appointments:update',
    'prescriptions:*',
    'medical_records:*',
  ],
  [ROLES.NURSE]: [
    'patients:read',
    'appointments:read',
    'appointments:update',
    'medical_records:read',
  ],
  [ROLES.RECEPTIONIST]: [
    'patients:read',
    'patients:create',
    'patients:update',
    'appointments:*',
    'billing:read',
  ],
  [ROLES.LAB_TECHNICIAN]: [
    'patients:read',
    'lab_tests:*',
    'lab_results:*',
  ],
  [ROLES.PHARMACIST]: [
    'patients:read',
    'prescriptions:read',
    'medications:*',
    'inventory:*',
  ],
  [ROLES.BILLING_CLERK]: [
    'patients:read',
    'billing:*',
    'payments:*',
    'invoices:*',
  ],
  [ROLES.PATIENT]: [
    'appointments:read',
    'appointments:create',
    'medical_records:read',
    'prescriptions:read',
    'invoices:read',
    'payments:create',
  ],
} as const;

export const hasPermission = (role: Role, permission: string): boolean => {
  const rolePerms = ROLE_PERMISSIONS[role] || [];
  
  // Super admin has all permissions
  if (rolePerms.includes('*')) return true;
  
  // Check exact match
  if (rolePerms.includes(permission)) return true;
  
  // Check wildcard match (e.g., patients:* matches patients:read)
  const [resource] = permission.split(':');
  return rolePerms.includes(`${resource}:*`);
};

