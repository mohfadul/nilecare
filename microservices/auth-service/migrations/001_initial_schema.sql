-- NileCare Auth Service - Initial Database Schema
-- PostgreSQL Database Migration
-- Version: 1.0.0

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(50),
  last_name VARCHAR(50),
  role VARCHAR(50) NOT NULL DEFAULT 'patient',
  status VARCHAR(50) NOT NULL DEFAULT 'pending_verification',
  
  -- MFA fields
  mfa_enabled BOOLEAN DEFAULT FALSE,
  mfa_secret VARCHAR(255),
  mfa_method VARCHAR(20),
  mfa_backup_codes TEXT[],
  
  -- Security fields
  failed_login_attempts INTEGER DEFAULT 0,
  last_failed_login TIMESTAMP,
  account_locked_until TIMESTAMP,
  last_login TIMESTAMP,
  last_login_ip VARCHAR(45),
  
  -- Password reset fields
  reset_token VARCHAR(255),
  reset_token_expires TIMESTAMP,
  
  -- Email verification fields
  email_verified BOOLEAN DEFAULT FALSE,
  email_verification_token VARCHAR(255),
  email_verification_expires TIMESTAMP,
  
  -- Organization/multi-tenancy
  organization_id UUID,
  
  -- Additional permissions beyond role
  permissions TEXT[],
  
  -- Audit fields
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID,
  updated_by UUID,
  
  -- Indexes
  CONSTRAINT check_status CHECK (status IN ('active', 'inactive', 'suspended', 'pending_verification'))
);

-- Refresh tokens table
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token VARCHAR(500) UNIQUE NOT NULL,
  token_id VARCHAR(100) NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMP NOT NULL,
  is_revoked BOOLEAN DEFAULT FALSE,
  revoked_at TIMESTAMP,
  revoked_reason VARCHAR(255),
  device_fingerprint VARCHAR(255),
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Devices table
CREATE TABLE IF NOT EXISTS devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  fingerprint VARCHAR(255) NOT NULL,
  name VARCHAR(100),
  last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45),
  user_agent TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, fingerprint)
);

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  permissions TEXT[],
  is_system BOOLEAN DEFAULT FALSE,
  organization_id UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  resource VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  description TEXT,
  is_system BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  email VARCHAR(255),
  action VARCHAR(100) NOT NULL,
  resource VARCHAR(100) NOT NULL,
  result VARCHAR(20) NOT NULL,
  reason VARCHAR(255),
  ip_address VARCHAR(45),
  user_agent TEXT,
  metadata JSONB,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT check_result CHECK (result IN ('success', 'failure'))
);

-- Login attempts table
CREATE TABLE IF NOT EXISTS login_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45) NOT NULL,
  user_agent TEXT,
  success BOOLEAN NOT NULL,
  reason VARCHAR(255),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- OAuth clients table (for OAuth2/OIDC server functionality)
CREATE TABLE IF NOT EXISTS oauth_clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id VARCHAR(100) UNIQUE NOT NULL,
  client_secret_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  redirect_uris TEXT[] NOT NULL,
  grant_types TEXT[] NOT NULL DEFAULT ARRAY['authorization_code', 'refresh_token'],
  scope TEXT[] DEFAULT ARRAY['openid', 'profile', 'email'],
  organization_id UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Authorization codes table (for OAuth2 authorization code flow)
CREATE TABLE IF NOT EXISTS authorization_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(255) UNIQUE NOT NULL,
  client_id VARCHAR(100) NOT NULL REFERENCES oauth_clients(client_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  redirect_uri VARCHAR(500) NOT NULL,
  scope TEXT[],
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  code_challenge VARCHAR(255),
  code_challenge_method VARCHAR(10),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_organization ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires ON refresh_tokens(expires_at);

CREATE INDEX IF NOT EXISTS idx_devices_user ON devices(user_id);
CREATE INDEX IF NOT EXISTS idx_devices_fingerprint ON devices(user_id, fingerprint);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_login_attempts_timestamp ON login_attempts(timestamp);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON login_attempts(ip_address);

CREATE INDEX IF NOT EXISTS idx_oauth_clients_client_id ON oauth_clients(client_id);
CREATE INDEX IF NOT EXISTS idx_authorization_codes_code ON authorization_codes(code);
CREATE INDEX IF NOT EXISTS idx_authorization_codes_user ON authorization_codes(user_id);

-- Insert default roles
INSERT INTO roles (name, description, permissions, is_system)
VALUES 
  ('admin', 'System Administrator', ARRAY['*'], TRUE),
  ('doctor', 'Healthcare Provider', ARRAY['patients:read', 'patients:write', 'appointments:read', 'appointments:write', 'records:read', 'records:write', 'prescriptions:write'], TRUE),
  ('nurse', 'Nursing Staff', ARRAY['patients:read', 'appointments:read', 'records:read', 'records:write', 'vitals:write'], TRUE),
  ('patient', 'Patient', ARRAY['appointments:read', 'appointments:write', 'records:read', 'prescriptions:read'], TRUE),
  ('receptionist', 'Front Desk Staff', ARRAY['patients:read', 'appointments:read', 'appointments:write', 'billing:read'], TRUE),
  ('lab_technician', 'Laboratory Technician', ARRAY['lab_tests:read', 'lab_tests:write', 'lab_results:write'], TRUE),
  ('pharmacist', 'Pharmacist', ARRAY['prescriptions:read', 'prescriptions:fulfill', 'medications:read'], TRUE)
ON CONFLICT (name) DO NOTHING;

-- Insert default permissions
INSERT INTO permissions (name, resource, action, description, is_system)
VALUES
  -- User management
  ('users:read', 'users', 'read', 'View user information', TRUE),
  ('users:write', 'users', 'write', 'Create and update users', TRUE),
  ('users:delete', 'users', 'delete', 'Delete users', TRUE),
  
  -- Patient management
  ('patients:read', 'patients', 'read', 'View patient information', TRUE),
  ('patients:write', 'patients', 'write', 'Create and update patient records', TRUE),
  
  -- Appointments
  ('appointments:read', 'appointments', 'read', 'View appointments', TRUE),
  ('appointments:write', 'appointments', 'write', 'Create and update appointments', TRUE),
  ('appointments:delete', 'appointments', 'delete', 'Cancel appointments', TRUE),
  
  -- Medical records
  ('records:read', 'records', 'read', 'View medical records', TRUE),
  ('records:write', 'records', 'write', 'Create and update medical records', TRUE),
  
  -- Prescriptions
  ('prescriptions:read', 'prescriptions', 'read', 'View prescriptions', TRUE),
  ('prescriptions:write', 'prescriptions', 'write', 'Create prescriptions', TRUE),
  ('prescriptions:fulfill', 'prescriptions', 'fulfill', 'Fulfill prescriptions', TRUE),
  
  -- Lab tests
  ('lab_tests:read', 'lab_tests', 'read', 'View lab tests', TRUE),
  ('lab_tests:write', 'lab_tests', 'write', 'Order lab tests', TRUE),
  ('lab_results:write', 'lab_results', 'write', 'Enter lab results', TRUE),
  
  -- Billing
  ('billing:read', 'billing', 'read', 'View billing information', TRUE),
  ('billing:write', 'billing', 'write', 'Create and update billing', TRUE),
  
  -- Admin
  ('roles:manage', 'roles', 'manage', 'Manage roles and permissions', TRUE),
  ('system:admin', 'system', 'admin', 'Full system access', TRUE)
ON CONFLICT (name) DO NOTHING;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roles_updated_at
  BEFORE UPDATE ON roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_oauth_clients_updated_at
  BEFORE UPDATE ON oauth_clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create a default admin user (password: Admin@123456)
-- WARNING: Change this password immediately after first login!
INSERT INTO users (
  email,
  username,
  password_hash,
  first_name,
  last_name,
  role,
  status,
  email_verified
)
VALUES (
  'admin@nilecare.sd',
  'admin',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqBp7YLGwC',
  'System',
  'Administrator',
  'admin',
  'active',
  TRUE
)
ON CONFLICT (email) DO NOTHING;

COMMENT ON TABLE users IS 'User accounts and authentication data';
COMMENT ON TABLE refresh_tokens IS 'JWT refresh tokens for session management';
COMMENT ON TABLE devices IS 'Trusted devices for enhanced security';
COMMENT ON TABLE roles IS 'User roles with associated permissions';
COMMENT ON TABLE permissions IS 'System permissions';
COMMENT ON TABLE audit_logs IS 'Security and compliance audit trail';
COMMENT ON TABLE login_attempts IS 'Login attempt tracking for security monitoring';
COMMENT ON TABLE oauth_clients IS 'OAuth2/OIDC registered clients';
COMMENT ON TABLE authorization_codes IS 'OAuth2 authorization codes';

