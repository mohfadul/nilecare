import { logger } from '../utils/logger';
import { getPool } from '../config/database';
import { Role, Permission } from '../models/User';

export class RoleService {
  /**
   * Create a new role
   */
  async createRole(roleData: {
    name: string;
    description?: string;
    permissions: string[];
    organizationId?: string;
  }): Promise<Role> {
    try {
      const pool = getPool();
      
      const [result]: any = await pool.query(
        `INSERT INTO auth_roles (id, name, description, permissions, organization_id)
         VALUES (UUID(), ?, ?, ?, ?)`,
        [
          roleData.name,
          roleData.description || null,
          JSON.stringify(roleData.permissions),
          roleData.organizationId || null
        ]
      );

      // Get the created role
      const [rows]: any = await pool.query(
        'SELECT * FROM auth_roles WHERE id = LAST_INSERT_ID()'
      );

      logger.info('Role created', { roleName: roleData.name });
      return this.mapToRole(rows[0]);
    } catch (error: any) {
      logger.error('Failed to create role', { error: error.message });
      throw error;
    }
  }

  /**
   * Get role by name
   */
  async getRoleByName(name: string): Promise<Role | null> {
    try {
      const pool = getPool();
      const [rows]: any = await pool.query(
        'SELECT * FROM auth_roles WHERE name = ?',
        [name]
      );

      if (!Array.isArray(rows) || rows.length === 0) {
        return null;
      }

      return this.mapToRole(rows[0]);
    } catch (error: any) {
      logger.error('Failed to get role', { name, error: error.message });
      return null;
    }
  }

  /**
   * Get role by ID
   */
  async getRoleById(roleId: string): Promise<Role | null> {
    try {
      const pool = getPool();
      const [rows]: any = await pool.query(
        'SELECT * FROM auth_roles WHERE id = ?',
        [roleId]
      );

      if (!Array.isArray(rows) || rows.length === 0) {
        return null;
      }

      return this.mapToRole(rows[0]);
    } catch (error: any) {
      logger.error('Failed to get role by ID', { roleId, error: error.message });
      return null;
    }
  }

  /**
   * List all roles
   */
  async listRoles(organizationId?: string): Promise<Role[]> {
    try {
      const pool = getPool();
      
      let query = 'SELECT * FROM auth_roles';
      const values: any[] = [];

      if (organizationId) {
        query += ' WHERE organization_id = ? OR organization_id IS NULL';
        values.push(organizationId);
      }

      query += ' ORDER BY name';

      const [rows]: any = await pool.query(query, values);
      if (!Array.isArray(rows)) {
        return [];
      }
      return rows.map(row => this.mapToRole(row));
    } catch (error: any) {
      logger.error('Failed to list roles', { error: error.message });
      return [];
    }
  }

  /**
   * Update role
   */
  async updateRole(
    roleId: string,
    updates: {
      description?: string;
      permissions?: string[];
    }
  ): Promise<Role> {
    try {
      const pool = getPool();
      
      const updateFields: string[] = [];
      const values: any[] = [];

      if (updates.description !== undefined) {
        updateFields.push(`description = ?`);
        values.push(updates.description);
      }

      if (updates.permissions !== undefined) {
        updateFields.push(`permissions = ?`);
        values.push(JSON.stringify(updates.permissions));
      }

      if (updateFields.length === 0) {
        throw new Error('No fields to update');
      }

      updateFields.push(`updated_at = NOW()`);
      values.push(roleId);

      const query = `
        UPDATE auth_roles
        SET ${updateFields.join(', ')}
        WHERE id = ? AND is_system = FALSE
      `;

      await pool.query(query, values);

      // Get updated role
      const [rows]: any = await pool.query(
        'SELECT * FROM auth_roles WHERE id = ?',
        [roleId]
      );

      if (!Array.isArray(rows) || rows.length === 0) {
        throw new Error('Role not found or is a system role');
      }

      logger.info('Role updated', { roleId });
      return this.mapToRole(rows[0]);
    } catch (error: any) {
      logger.error('Failed to update role', { roleId, error: error.message });
      throw error;
    }
  }

  /**
   * Delete role
   */
  async deleteRole(roleId: string): Promise<boolean> {
    try {
      const pool = getPool();
      
      const [result]: any = await pool.query(
        'DELETE FROM auth_roles WHERE id = ? AND is_system = FALSE',
        [roleId]
      );

      if (result.affectedRows > 0) {
        logger.info('Role deleted', { roleId });
        return true;
      }

      return false;
    } catch (error: any) {
      logger.error('Failed to delete role', { roleId, error: error.message });
      throw error;
    }
  }

  /**
   * Check if user has permission
   */
  async hasPermission(userId: string, permission: string): Promise<boolean> {
    try {
      const pool = getPool();
      
      // Get user's role and permissions
      const [rows]: any = await pool.query(
        `SELECT r.permissions, u.permissions as user_permissions
         FROM auth_users u
         LEFT JOIN auth_roles r ON u.role = r.name
         WHERE u.id = ?`,
        [userId]
      );

      if (!Array.isArray(rows) || rows.length === 0) {
        return false;
      }

      const row = rows[0];
      // Parse JSON permissions
      let rolePermissions: string[] = [];
      let userPermissions: string[] = [];

      if (row.permissions) {
        try {
          rolePermissions = typeof row.permissions === 'string' 
            ? JSON.parse(row.permissions) 
            : row.permissions;
        } catch (e) {
          rolePermissions = [];
        }
      }

      if (row.user_permissions) {
        try {
          userPermissions = typeof row.user_permissions === 'string' 
            ? JSON.parse(row.user_permissions) 
            : row.user_permissions;
        } catch (e) {
          userPermissions = [];
        }
      }

      const allPermissions = [...rolePermissions, ...userPermissions];

      // Check for wildcard permission
      if (allPermissions.includes('*')) {
        return true;
      }

      // Check for exact permission
      if (allPermissions.includes(permission)) {
        return true;
      }

      // Check for wildcard resource (e.g., 'users:*' matches 'users:read')
      const [resource, action] = permission.split(':');
      if (allPermissions.includes(`${resource}:*`)) {
        return true;
      }

      return false;
    } catch (error: any) {
      logger.error('Failed to check permission', { userId, permission, error: error.message });
      return false;
    }
  }

  /**
   * Get user permissions
   */
  async getUserPermissions(userId: string): Promise<string[]> {
    try {
      const pool = getPool();
      
      const [rows]: any = await pool.query(
        `SELECT r.permissions, u.permissions as user_permissions
         FROM auth_users u
         LEFT JOIN auth_roles r ON u.role = r.name
         WHERE u.id = ?`,
        [userId]
      );

      if (!Array.isArray(rows) || rows.length === 0) {
        return [];
      }

      const row = rows[0];
      
      // Parse JSON permissions
      let rolePermissions: string[] = [];
      let userPermissions: string[] = [];

      if (row.permissions) {
        try {
          rolePermissions = typeof row.permissions === 'string' 
            ? JSON.parse(row.permissions) 
            : row.permissions;
        } catch (e) {
          rolePermissions = [];
        }
      }

      if (row.user_permissions) {
        try {
          userPermissions = typeof row.user_permissions === 'string' 
            ? JSON.parse(row.user_permissions) 
            : row.user_permissions;
        } catch (e) {
          userPermissions = [];
        }
      }
      
      // Merge and deduplicate
      return Array.from(new Set([...rolePermissions, ...userPermissions]));
    } catch (error: any) {
      logger.error('Failed to get user permissions', { userId, error: error.message });
      return [];
    }
  }

  /**
   * Assign role to user
   */
  async assignRole(userId: string, roleName: string): Promise<void> {
    try {
      const pool = getPool();
      
      // Verify role exists
      const role = await this.getRoleByName(roleName);
      if (!role) {
        throw new Error('Role not found');
      }

      await pool.query(
        'UPDATE auth_users SET role = ?, updated_at = NOW() WHERE id = ?',
        [roleName, userId]
      );

      logger.info('Role assigned to user', { userId, roleName });
    } catch (error: any) {
      logger.error('Failed to assign role', { userId, roleName, error: error.message });
      throw error;
    }
  }

  /**
   * Map database row to Role model
   */
  private mapToRole(row: any): Role {
    // Parse permissions JSON if it's a string
    let permissions: string[] = [];
    if (row.permissions) {
      try {
        permissions = typeof row.permissions === 'string' 
          ? JSON.parse(row.permissions) 
          : row.permissions;
      } catch (e) {
        permissions = [];
      }
    }

    return {
      id: row.id,
      name: row.name,
      description: row.description,
      permissions: permissions,
      isSystem: row.is_system,
      organizationId: row.organization_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}

export default RoleService;

