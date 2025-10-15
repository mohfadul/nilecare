-- ═══════════════════════════════════════════════════════════════
-- NileCare Notification Service - Database Schema
-- PostgreSQL 13+
-- ═══════════════════════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ───────────────────────────────────────────────────────────────
-- Table: notifications
-- Core notification records
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  channel VARCHAR(50) NOT NULL CHECK (channel IN ('email', 'sms', 'push', 'websocket')),
  type VARCHAR(100) NOT NULL,
  template_id UUID,
  subject VARCHAR(500),
  body TEXT NOT NULL,
  payload JSONB,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'read')),
  scheduled_at TIMESTAMP,
  sent_at TIMESTAMP,
  read_at TIMESTAMP,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_channel ON notifications(channel);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled_at ON notifications(scheduled_at) WHERE scheduled_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_template_id ON notifications(template_id) WHERE template_id IS NOT NULL;

-- ───────────────────────────────────────────────────────────────
-- Table: notification_templates
-- Message templates for notifications
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL UNIQUE,
  type VARCHAR(100) NOT NULL,
  channel VARCHAR(50) NOT NULL CHECK (channel IN ('email', 'sms', 'push', 'websocket')),
  subject_template VARCHAR(500),
  body_template TEXT NOT NULL,
  variables JSONB,
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT chk_subject_for_email CHECK (
    channel != 'email' OR subject_template IS NOT NULL
  )
);

-- Indexes for templates
CREATE INDEX IF NOT EXISTS idx_templates_name ON notification_templates(name);
CREATE INDEX IF NOT EXISTS idx_templates_type ON notification_templates(type);
CREATE INDEX IF NOT EXISTS idx_templates_channel ON notification_templates(channel);
CREATE INDEX IF NOT EXISTS idx_templates_is_active ON notification_templates(is_active) WHERE is_active = true;

-- ───────────────────────────────────────────────────────────────
-- Table: delivery_tracking
-- Track delivery status of notifications
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS delivery_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  notification_id UUID NOT NULL,
  channel VARCHAR(50) NOT NULL CHECK (channel IN ('email', 'sms', 'push', 'websocket')),
  provider VARCHAR(100),
  provider_message_id VARCHAR(500),
  status VARCHAR(50) NOT NULL CHECK (status IN ('queued', 'sent', 'delivered', 'failed', 'bounced', 'opened', 'clicked')),
  delivered_at TIMESTAMP,
  opened_at TIMESTAMP,
  clicked_at TIMESTAMP,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE
);

-- Indexes for delivery tracking
CREATE INDEX IF NOT EXISTS idx_delivery_notification_id ON delivery_tracking(notification_id);
CREATE INDEX IF NOT EXISTS idx_delivery_status ON delivery_tracking(status);
CREATE INDEX IF NOT EXISTS idx_delivery_channel ON delivery_tracking(channel);
CREATE INDEX IF NOT EXISTS idx_delivery_provider_message_id ON delivery_tracking(provider_message_id) WHERE provider_message_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_delivery_created_at ON delivery_tracking(created_at DESC);

-- ───────────────────────────────────────────────────────────────
-- Table: user_notification_subscriptions
-- User preferences for notification channels
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_notification_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  channel VARCHAR(50) NOT NULL CHECK (channel IN ('email', 'sms', 'push', 'websocket')),
  notification_type VARCHAR(100) NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  preferences JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, channel, notification_type)
);

-- Indexes for subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON user_notification_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_channel ON user_notification_subscriptions(channel);
CREATE INDEX IF NOT EXISTS idx_subscriptions_type ON user_notification_subscriptions(notification_type);
CREATE INDEX IF NOT EXISTS idx_subscriptions_enabled ON user_notification_subscriptions(is_enabled) WHERE is_enabled = true;

-- ───────────────────────────────────────────────────────────────
-- Functions and Triggers
-- ───────────────────────────────────────────────────────────────

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-update updated_at for notifications
CREATE TRIGGER trigger_notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Auto-update updated_at for templates
CREATE TRIGGER trigger_templates_updated_at
  BEFORE UPDATE ON notification_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Auto-update updated_at for subscriptions
CREATE TRIGGER trigger_subscriptions_updated_at
  BEFORE UPDATE ON user_notification_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ───────────────────────────────────────────────────────────────
-- Views
-- ───────────────────────────────────────────────────────────────

-- View: Recent notifications with delivery status
CREATE OR REPLACE VIEW v_notifications_with_delivery AS
SELECT 
  n.*,
  dt.status as delivery_status,
  dt.provider,
  dt.delivered_at,
  dt.opened_at,
  dt.clicked_at
FROM notifications n
LEFT JOIN delivery_tracking dt ON n.id = dt.notification_id
ORDER BY n.created_at DESC;

-- View: Notification statistics by channel
CREATE OR REPLACE VIEW v_notification_stats_by_channel AS
SELECT 
  channel,
  status,
  COUNT(*) as count,
  DATE_TRUNC('day', created_at) as date
FROM notifications
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY channel, status, DATE_TRUNC('day', created_at);

-- ───────────────────────────────────────────────────────────────
-- Sample Data (Optional - for development)
-- ───────────────────────────────────────────────────────────────

-- Sample notification templates
INSERT INTO notification_templates (name, type, channel, subject_template, body_template, variables, is_active)
VALUES 
  (
    'appointment_reminder',
    'appointment',
    'email',
    'Appointment Reminder - {{appointment_date}}',
    'Dear {{patient_name}},\n\nThis is a reminder that you have an appointment on {{appointment_date}} at {{appointment_time}} with Dr. {{doctor_name}}.\n\nPlease arrive 15 minutes early.\n\nThank you,\nNileCare Healthcare',
    '["patient_name", "appointment_date", "appointment_time", "doctor_name"]'::jsonb,
    true
  ),
  (
    'lab_result_ready',
    'lab',
    'email',
    'Your Lab Results are Ready',
    'Dear {{patient_name}},\n\nYour lab results for {{test_name}} are now available. Please log in to view them or contact your healthcare provider.\n\nThank you,\nNileCare Healthcare',
    '["patient_name", "test_name"]'::jsonb,
    true
  ),
  (
    'appointment_reminder_sms',
    'appointment',
    'sms',
    NULL,
    'NileCare: Appointment reminder for {{appointment_date}} at {{appointment_time}} with Dr. {{doctor_name}}. Reply CONFIRM to confirm.',
    '["appointment_date", "appointment_time", "doctor_name"]'::jsonb,
    true
  )
ON CONFLICT (name) DO NOTHING;

-- ───────────────────────────────────────────────────────────────
-- Comments
-- ───────────────────────────────────────────────────────────────

COMMENT ON TABLE notifications IS 'Core notification records with delivery status';
COMMENT ON TABLE notification_templates IS 'Reusable templates for different notification types';
COMMENT ON TABLE delivery_tracking IS 'Track delivery status and events for notifications';
COMMENT ON TABLE user_notification_subscriptions IS 'User preferences for notification channels and types';

COMMENT ON COLUMN notifications.channel IS 'Delivery channel: email, sms, push, or websocket';
COMMENT ON COLUMN notifications.status IS 'Current status: pending, sent, failed, or read';
COMMENT ON COLUMN notifications.payload IS 'Additional data in JSON format';
COMMENT ON COLUMN notifications.retry_count IS 'Number of retry attempts for failed notifications';

COMMENT ON COLUMN notification_templates.variables IS 'List of template variables in JSON format';
COMMENT ON COLUMN notification_templates.body_template IS 'Template body using Handlebars/Mustache syntax';

COMMENT ON COLUMN delivery_tracking.provider IS 'External provider used (Twilio, SendGrid, Firebase, etc.)';
COMMENT ON COLUMN delivery_tracking.provider_message_id IS 'Provider-specific message ID for tracking';

-- ═══════════════════════════════════════════════════════════════
-- End of Schema
-- ═══════════════════════════════════════════════════════════════

