/**
 * User Notification Subscription Model
 * User preferences for notifications
 */

export interface UserNotificationSubscription {
  id: string;
  user_id: string;
  channel: 'email' | 'sms' | 'push' | 'websocket';
  notification_type: string;
  is_enabled: boolean;
  preferences?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface CreateSubscriptionDto {
  user_id: string;
  channel: 'email' | 'sms' | 'push' | 'websocket';
  notification_type: string;
  is_enabled?: boolean;
  preferences?: Record<string, any>;
}

export interface UpdateSubscriptionDto {
  is_enabled?: boolean;
  preferences?: Record<string, any>;
}

export interface UserPreferences {
  email?: boolean;
  sms?: boolean;
  push?: boolean;
  websocket?: boolean;
  quiet_hours?: {
    start: string; // HH:MM format
    end: string;   // HH:MM format
  };
}

