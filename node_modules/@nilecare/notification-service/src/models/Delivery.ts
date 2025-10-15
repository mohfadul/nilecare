/**
 * Delivery Tracking Model
 * Tracks notification delivery status
 */

export interface DeliveryTracking {
  id: string;
  notification_id: string;
  channel: 'email' | 'sms' | 'push' | 'websocket';
  provider?: string;
  provider_message_id?: string;
  status: 'queued' | 'sent' | 'delivered' | 'failed' | 'bounced' | 'opened' | 'clicked';
  delivered_at?: Date;
  opened_at?: Date;
  clicked_at?: Date;
  metadata?: Record<string, any>;
  created_at: Date;
}

export interface CreateDeliveryTrackingDto {
  notification_id: string;
  channel: 'email' | 'sms' | 'push' | 'websocket';
  provider?: string;
  provider_message_id?: string;
  status: 'queued' | 'sent' | 'delivered' | 'failed' | 'bounced';
  metadata?: Record<string, any>;
}

export interface UpdateDeliveryTrackingDto {
  status?: 'sent' | 'delivered' | 'failed' | 'bounced' | 'opened' | 'clicked';
  delivered_at?: Date;
  opened_at?: Date;
  clicked_at?: Date;
  metadata?: Record<string, any>;
}

export type DeliveryStatus = DeliveryTracking['status'];

