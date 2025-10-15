/**
 * Template Controller
 * HTTP request handlers for templates
 */

import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import TemplateService from '../services/TemplateService';
import { CreateTemplateDto, UpdateTemplateDto } from '../models/Template';

const templateService = new TemplateService();

/**
 * List all templates
 */
export async function listTemplates(req: Request, res: Response): Promise<void> {
  try {
    const activeOnly = req.query.active === 'true';
    const channel = req.query.channel as string | undefined;

    let templates;

    if (activeOnly) {
      templates = await templateService.getActive();
    } else if (channel) {
      templates = await templateService.getByChannel(channel);
    } else {
      templates = await templateService.getActive(); // Default to active
    }

    res.json({
      success: true,
      data: templates,
      count: templates.length,
    });
  } catch (error: any) {
    logger.error('Failed to list templates', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'LIST_FAILED',
        message: error.message,
      },
    });
  }
}

/**
 * Get template by ID
 */
export async function getTemplate(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const template = await templateService.getById(id);

    if (!template) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Template not found',
        },
      });
      return;
    }

    res.json({
      success: true,
      data: template,
    });
  } catch (error: any) {
    logger.error('Failed to get template', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_FAILED',
        message: error.message,
      },
    });
  }
}

/**
 * Create template
 */
export async function createTemplate(req: Request, res: Response): Promise<void> {
  try {
    const data: CreateTemplateDto = {
      ...req.body,
      created_by: req.user?.userId,
    };

    const template = await templateService.create(data);

    res.status(201).json({
      success: true,
      data: template,
      message: 'Template created successfully',
    });
  } catch (error: any) {
    logger.error('Failed to create template', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_FAILED',
        message: error.message,
      },
    });
  }
}

/**
 * Update template
 */
export async function updateTemplate(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const data: UpdateTemplateDto = {
      ...req.body,
      updated_by: req.user?.userId,
    };

    const template = await templateService.update(id, data);

    if (!template) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Template not found',
        },
      });
      return;
    }

    res.json({
      success: true,
      data: template,
      message: 'Template updated successfully',
    });
  } catch (error: any) {
    logger.error('Failed to update template', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_FAILED',
        message: error.message,
      },
    });
  }
}

/**
 * Delete template
 */
export async function deleteTemplate(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const deleted = await templateService.delete(id);

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Template not found',
        },
      });
      return;
    }

    res.json({
      success: true,
      message: 'Template deleted successfully',
    });
  } catch (error: any) {
    logger.error('Failed to delete template', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'DELETE_FAILED',
        message: error.message,
      },
    });
  }
}

/**
 * Preview template rendering
 */
export async function previewTemplate(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const variables = req.body.variables || {};

    const rendered = await templateService.render(id, variables);

    res.json({
      success: true,
      data: rendered,
    });
  } catch (error: any) {
    logger.error('Failed to preview template', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'PREVIEW_FAILED',
        message: error.message,
      },
    });
  }
}

/**
 * Toggle template active status
 */
export async function toggleActive(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const template = await templateService.toggleActive(id);

    if (!template) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Template not found',
        },
      });
      return;
    }

    res.json({
      success: true,
      data: template,
      message: `Template ${template.is_active ? 'activated' : 'deactivated'}`,
    });
  } catch (error: any) {
    logger.error('Failed to toggle template status', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'TOGGLE_FAILED',
        message: error.message,
      },
    });
  }
}

export default {
  listTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  previewTemplate,
  toggleActive,
};

