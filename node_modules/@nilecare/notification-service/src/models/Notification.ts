/**
 * Notification Model
 * Represents a notification record
 */

export interface Notification {
  id: string;
  user_id: string;
  channel: 'email' | 'sms' | 'push' | 'websocket';
  type: string;
  template_id?: string;
  subject?: string;
  body: string;
  payload?: Record<string, any>;
  status: 'pending' | 'sent' | 'failed' | 'read';
  scheduled_at?: Date;
  sent_at?: Date;
  read_at?: Date;
  error_message?: string;
  retry_count: number;
  created_by?: string;
  updated_by?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateNotificationDto {
  user_id: string;
  channel: 'email' | 'sms' | 'push' | 'websocket';
  type: string;
  template_id?: string;
  subject?: string;
  body: string;
  payload?: Record<string, any>;
  scheduled_at?: Date;
  created_by?: string;
}

export interface UpdateNotificationDto {
  status?: 'pending' | 'sent' | 'failed' | 'read';
  sent_at?: Date;
  read_at?: Date;
  error_message?: string;
  retry_count?: number;
  updated_by?: string;
}

export type NotificationStatus = Notification['status'];
export type NotificationChannel = Notification['channel'];

