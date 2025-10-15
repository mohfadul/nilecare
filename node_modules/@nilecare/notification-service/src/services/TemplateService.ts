/**
 * Template Service
 * Template rendering and management
 */

import Handlebars from 'handlebars';
import { logger } from '../utils/logger';
import { NotificationTemplate, CreateTemplateDto, UpdateTemplateDto, RenderedTemplate } from '../models/Template';
import TemplateRepository from '../repositories/template.repository';

export class TemplateService {
  private repository: TemplateRepository;

  constructor() {
    this.repository = new TemplateRepository();
    this.registerHelpers();
    logger.info('TemplateService initialized');
  }

  /**
   * Register Handlebars helpers
   */
  private registerHelpers(): void {
    // Date formatting helper
    Handlebars.registerHelper('formatDate', (date: string | Date) => {
      if (!date) return '';
      const d = new Date(date);
      return d.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    });

    // Time formatting helper
    Handlebars.registerHelper('formatTime', (time: string) => {
      if (!time) return '';
      return time;
    });

    // Uppercase helper
    Handlebars.registerHelper('uppercase', (str: string) => {
      return str ? str.toUpperCase() : '';
    });

    // Lowercase helper
    Handlebars.registerHelper('lowercase', (str: string) => {
      return str ? str.toLowerCase() : '';
    });
  }

  /**
   * Render template by ID
   */
  async render(templateId: string, variables: Record<string, any>): Promise<RenderedTemplate> {
    try {
      const template = await this.repository.findById(templateId);

      if (!template) {
        throw new Error(`Template not found: ${templateId}`);
      }

      if (!template.is_active) {
        throw new Error(`Template is not active: ${templateId}`);
      }

      logger.debug('Rendering template', { templateId, templateName: template.name });

      // Render subject (if exists)
      let renderedSubject: string | undefined;
      if (template.subject_template) {
        const subjectTemplate = Handlebars.compile(template.subject_template);
        renderedSubject = subjectTemplate(variables);
      }

      // Render body
      const bodyTemplate = Handlebars.compile(template.body_template);
      const renderedBody = bodyTemplate(variables);

      logger.info('Template rendered successfully', { templateId, templateName: template.name });

      return {
        subject: renderedSubject,
        body: renderedBody,
      };
    } catch (error: any) {
      logger.error('Failed to render template', { error: error.message, templateId });
      throw error;
    }
  }

  /**
   * Render template by name
   */
  async renderByName(templateName: string, variables: Record<string, any>): Promise<RenderedTemplate> {
    try {
      const template = await this.repository.findByName(templateName);

      if (!template) {
        throw new Error(`Template not found: ${templateName}`);
      }

      return this.render(template.id, variables);
    } catch (error: any) {
      logger.error('Failed to render template by name', { error: error.message, templateName });
      throw error;
    }
  }

  /**
   * Create template
   */
  async create(data: CreateTemplateDto): Promise<NotificationTemplate> {
    try {
      // Validate template syntax
      try {
        Handlebars.compile(data.body_template);
        if (data.subject_template) {
          Handlebars.compile(data.subject_template);
        }
      } catch (error: any) {
        throw new Error(`Invalid template syntax: ${error.message}`);
      }

      const template = await this.repository.create(data);
      logger.info('Template created', { id: template.id, name: template.name });
      return template;
    } catch (error: any) {
      logger.error('Failed to create template', { error: error.message, data });
      throw error;
    }
  }

  /**
   * Get template by ID
   */
  async getById(id: string): Promise<NotificationTemplate | null> {
    return this.repository.findById(id);
  }

  /**
   * Get template by name
   */
  async getByName(name: string): Promise<NotificationTemplate | null> {
    return this.repository.findByName(name);
  }

  /**
   * Get all active templates
   */
  async getActive(): Promise<NotificationTemplate[]> {
    return this.repository.findActive();
  }

  /**
   * Get templates by channel
   */
  async getByChannel(channel: string): Promise<NotificationTemplate[]> {
    return this.repository.findByChannel(channel);
  }

  /**
   * Update template
   */
  async update(id: string, data: UpdateTemplateDto): Promise<NotificationTemplate | null> {
    try {
      // Validate template syntax if provided
      if (data.body_template) {
        try {
          Handlebars.compile(data.body_template);
        } catch (error: any) {
          throw new Error(`Invalid body template syntax: ${error.message}`);
        }
      }
      if (data.subject_template) {
        try {
          Handlebars.compile(data.subject_template);
        } catch (error: any) {
          throw new Error(`Invalid subject template syntax: ${error.message}`);
        }
      }

      const template = await this.repository.update(id, data);
      logger.info('Template updated', { id });
      return template;
    } catch (error: any) {
      logger.error('Failed to update template', { error: error.message, id });
      throw error;
    }
  }

  /**
   * Delete template
   */
  async delete(id: string): Promise<boolean> {
    return this.repository.delete(id);
  }

  /**
   * Toggle template active status
   */
  async toggleActive(id: string): Promise<NotificationTemplate | null> {
    return this.repository.toggleActive(id);
  }
}

export default TemplateService;

