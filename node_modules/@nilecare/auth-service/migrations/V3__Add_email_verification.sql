-- ============================================================================
-- V3: Add Email Verification Support
-- ============================================================================
-- Author: NileCare Backend Team
-- Date: 2025-10-16
-- Purpose: Add email verification functionality for user accounts
-- ============================================================================

-- ============================================================================
-- ADD EMAIL VERIFICATION COLUMNS TO USERS TABLE
-- ============================================================================

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP NULL DEFAULT NULL;

-- ============================================================================
-- CREATE EMAIL VERIFICATION TOKENS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL,
  email VARCHAR(255) NOT NULL,
  token VARCHAR(128) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMP NULL,
  
  -- Foreign key
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  
  -- Indexes
  INDEX idx_token (token),
  INDEX idx_user_id (user_id),
  INDEX idx_expires_at (expires_at),
  INDEX idx_used (used),
  INDEX idx_created_at (created_at)
  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Email verification tokens for user account activation';

-- ============================================================================
-- CREATE INDEXES FOR EMAIL VERIFICATION QUERIES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified);
CREATE INDEX IF NOT EXISTS idx_users_email_verified_at ON users(email_verified_at);

-- ============================================================================
-- UPDATE EXISTING USERS (mark as verified if created before this migration)
-- ============================================================================

-- Optionally mark existing users as verified (backfill)
-- Uncomment if you want to grandfather existing users
-- UPDATE users 
-- SET email_verified = TRUE, email_verified_at = created_at 
-- WHERE email_verified = FALSE AND created_at < NOW();

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check tables exist
SHOW TABLES LIKE '%verification%';

-- Check columns added
DESC users;
DESC email_verification_tokens;

-- ============================================================================
-- CLEANUP PROCEDURE (Run periodically via cron)
-- ============================================================================

DELIMITER $$

CREATE PROCEDURE IF NOT EXISTS cleanup_expired_verification_tokens()
BEGIN
  DELETE FROM email_verification_tokens 
  WHERE expires_at < NOW();
  
  SELECT ROW_COUNT() as deleted_count;
END$$

DELIMITER ;

-- Schedule cleanup (optional - can also be done via cron/code)
-- CREATE EVENT IF NOT EXISTS cleanup_verification_tokens_daily
-- ON SCHEDULE EVERY 1 DAY
-- DO CALL cleanup_expired_verification_tokens();

