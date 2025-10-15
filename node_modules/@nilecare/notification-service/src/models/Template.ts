/**
 * Notification Template Model
 * Represents a message template
 */

export interface NotificationTemplate {
  id: string;
  name: string;
  type: string;
  channel: 'email' | 'sms' | 'push' | 'websocket';
  subject_template?: string;
  body_template: string;
  variables: string[];
  is_active: boolean;
  created_by?: string;
  updated_by?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateTemplateDto {
  name: string;
  type: string;
  channel: 'email' | 'sms' | 'push' | 'websocket';
  subject_template?: string;
  body_template: string;
  variables: string[];
  is_active?: boolean;
  created_by?: string;
}

export interface UpdateTemplateDto {
  name?: string;
  subject_template?: string;
  body_template?: string;
  variables?: string[];
  is_active?: boolean;
  updated_by?: string;
}

export interface RenderTemplateInput {
  template_id: string;
  variables: Record<string, any>;
}

export interface RenderedTemplate {
  subject?: string;
  body: string;
}

