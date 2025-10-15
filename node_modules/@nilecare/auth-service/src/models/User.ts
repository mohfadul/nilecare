export interface User {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
  firstName?: string;
  lastName?: string;
  role: string;
  status: 'active' | 'inactive' | 'suspended' | 'pending_verification';
  
  // MFA fields
  mfaEnabled: boolean;
  mfaSecret?: string;
  mfaMethod?: 'totp' | 'sms' | 'email';
  mfaBackupCodes?: string[];
  
  // Security fields
  failedLoginAttempts: number;
  lastFailedLogin?: Date;
  accountLockedUntil?: Date;
  lastLogin?: Date;
  lastLoginIp?: string;
  
  // Password reset fields
  resetToken?: string;
  resetTokenExpires?: Date;
  
  // Verification fields
  emailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  
  // Session management
  refreshTokens: RefreshToken[];
  devices: Device[];
  
  // Audit fields
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
  
  // Organization/tenant
  organizationId?: string;
  
  // Permissions
  permissions: string[];
}

export interface RefreshToken {
  id: string;
  token: string;
  tokenId: string; // jti claim
  userId: string;
  expiresAt: Date;
  isRevoked: boolean;
  revokedAt?: Date;
  revokedReason?: string;
  createdAt: Date;
  deviceFingerprint?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface Device {
  id: string;
  userId: string;
  fingerprint: string;
  name?: string;
  lastUsed: Date;
  ipAddress?: string;
  userAgent?: string;
  isVerified: boolean;
  createdAt: Date;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  isSystem: boolean;
  organizationId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description?: string;
  isSystem: boolean;
  createdAt: Date;
}

export interface AuditLog {
  id: string;
  userId?: string;
  email?: string;
  action: string;
  resource: string;
  result: 'success' | 'failure';
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

export interface LoginAttempt {
  id: string;
  email: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  reason?: string;
  timestamp: Date;
}

