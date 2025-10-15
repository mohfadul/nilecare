/**
 * Authentication Routes (Development)
 * Simple auth for frontend testing
 */

import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const router = Router();

// Mock users database (in production, this would query a real database)
const mockUsers = [
  {
    id: '1',
    email: 'doctor@nilecare.sd',
    first_name: 'Ahmed',
    last_name: 'Hassan',
    username: 'Dr. Ahmed Hassan',
    password: '$2b$10$rQZ4Z4Z4Z4Z4Z4Z4Z4Z4Z.Z4Z4Z4Z4Z4Z4Z4Z4Z4Z4Z4Z4Z4Zu', // TestPass123!
    role: 'doctor',
    facilityId: 'facility_1',
    permissions: ['read:patients', 'write:patients', 'read:appointments', 'write:appointments']
  },
  {
    id: '2',
    email: 'nurse@nilecare.sd',
    first_name: 'Sarah',
    last_name: 'Ali',
    username: 'Nurse Sarah Ali',
    password: '$2b$10$rQZ4Z4Z4Z4Z4Z4Z4Z4Z4Z.Z4Z4Z4Z4Z4Z4Z4Z4Z4Z4Z4Z4Z4Zu', // TestPass123!
    role: 'nurse',
    facilityId: 'facility_1',
    permissions: ['read:patients', 'read:appointments']
  },
  {
    id: '3',
    email: 'admin@nilecare.sd',
    first_name: 'Admin',
    last_name: 'User',
    username: 'Admin User',
    password: '$2b$10$rQZ4Z4Z4Z4Z4Z4Z4Z4Z4Z.Z4Z4Z4Z4Z4Z4Z4Z4Z4Z4Z4Z4Z4Zu', // TestPass123!
    role: 'admin',
    facilityId: 'facility_1',
    permissions: ['*']
  },
  {
    id: '4',
    email: 'superadmin@nilecare.sd',
    first_name: 'Super',
    last_name: 'Admin',
    username: 'Super Admin',
    password: '$2b$10$rQZ4Z4Z4Z4Z4Z4Z4Z4Z4Z.Z4Z4Z4Z4Z4Z4Z4Z4Z4Z4Z4Z4Z4Zu', // TestPass123!
    role: 'super_admin',
    facilityId: 'system',
    permissions: ['*']
  },
  {
    id: '5',
    email: 'medicaldirector@nilecare.sd',
    first_name: 'Dr. Omar',
    last_name: 'Ibrahim',
    username: 'Dr. Omar Ibrahim',
    password: '$2b$10$rQZ4Z4Z4Z4Z4Z4Z4Z4Z4Z.Z4Z4Z4Z4Z4Z4Z4Z4Z4Z4Z4Z4Z4Zu', // TestPass123!
    role: 'medical_director',
    facilityId: 'facility_1',
    permissions: ['*']
  },
  {
    id: '6',
    email: 'compliance@nilecare.sd',
    first_name: 'Fatima',
    last_name: 'Ahmed',
    username: 'Fatima Ahmed',
    password: '$2b$10$rQZ4Z4Z4Z4Z4Z4Z4Z4Z4Z.Z4Z4Z4Z4Z4Z4Z4Z4Z4Z4Z4Z4Z4Zu', // TestPass123!
    role: 'compliance_officer',
    facilityId: 'facility_1',
    permissions: ['read:*', 'audit:*']
  },
  {
    id: '7',
    email: 'inspector@moh.gov.sd',
    first_name: 'Hassan',
    last_name: 'Mohamed',
    username: 'Hassan Mohamed',
    password: '$2b$10$rQZ4Z4Z4Z4Z4Z4Z4Z4Z4Z.Z4Z4Z4Z4Z4Z4Z4Z4Z4Z4Z4Z4Z4Zu', // TestPass123!
    role: 'sudan_health_inspector',
    facilityId: 'sudan_moh',
    permissions: ['read:*', 'inspect:*']
  }
];

/**
 * POST /api/v1/auth/login
 * Login endpoint
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    // Check if request was aborted
    if (req.aborted) {
      console.log('[Auth] Request aborted before processing');
      return;
    }

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Email and password are required'
        }
      });
    }

    // Find user
    const user = mockUsers.find(u => u.email === email);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      });
    }

    // For development, accept any password
    // In production, verify with bcrypt: await bcrypt.compare(password, user.password)
    const isValidPassword = password === 'TestPass123!';

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      });
    }

    // Generate JWT access token
    const accessToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        facilityId: user.facilityId
      },
      process.env.JWT_SECRET || 'dev-secret-key',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    // Generate refresh token (expires in 30 days)
    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-key',
      { expiresIn: '30d' }
    );

    // Return user data and token
    const userData = {
      id: user.id,
      email: user.email,
      username: user.username || `${user.first_name} ${user.last_name}`,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      facilityId: user.facilityId,
      permissions: user.permissions
    };

    // Set refresh token as HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    res.json({
      success: true,
      data: {
        user: userData,
        accessToken
      }
    });

  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred during login'
      }
    });
  }
});

/**
 * POST /api/v1/auth/logout
 * Logout endpoint
 */
router.post('/logout', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      message: 'Logged out successfully'
    }
  });
});

/**
 * POST /api/v1/auth/register
 * Registration endpoint - Creates new user account
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, first_name, last_name, role, phone, national_id, specialty } = req.body;

    // Validation
    if (!email || !password || !first_name || !last_name || !role) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email, password, first name, last name, and role are required'
        }
      });
    }

    // Password strength validation
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'WEAK_PASSWORD',
          message: 'Password must be at least 8 characters long'
        }
      });
    }

    // Import database connection
    const mysql = require('mysql2/promise');
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'nilecare'
    });

    try {
      // Check if user already exists
      const [existingUsers] = await connection.execute(
        'SELECT id FROM users WHERE email = ?',
        [email]
      );

      if ((existingUsers as any[]).length > 0) {
        await connection.end();
        return res.status(409).json({
          success: false,
          error: {
            code: 'USER_EXISTS',
            message: 'A user with this email already exists'
          }
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Generate user ID
      const user_id = `user_${Date.now()}`;

      // Insert new user
      await connection.execute(`
        INSERT INTO users (id, email, password, first_name, last_name, role, status, phone, national_id, specialty)
        VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?, ?)
      `, [user_id, email, hashedPassword, first_name, last_name, role, phone || null, national_id || null, specialty || null]);

      // Generate JWT token
      const accessToken = jwt.sign(
        {
          userId: user_id,
          email: email,
          role: role
        },
        process.env.JWT_SECRET || 'dev-secret-key',
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );

      // Generate refresh token (expires in 30 days)
      const refreshToken = jwt.sign(
        { userId: user_id },
        process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-key',
        { expiresIn: '30d' }
      );

      // Return user data and tokens
      const userData = {
        id: user_id,
        email: email,
        username: `${first_name} ${last_name}`,
        first_name: first_name,
        last_name: last_name,
        role: role,
        permissions: []
      };

      // Set refresh token as HTTP-only cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
      });

      await connection.end();

      res.status(201).json({
        success: true,
        data: {
          user: userData,
          accessToken,
          message: 'User registered successfully'
        }
      });

    } catch (dbError: any) {
      await connection.end();
      throw dbError;
    }

  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred during registration',
        details: error.message
      }
    });
  }
});

/**
 * POST /api/v1/auth/refresh-token
 * Refresh token endpoint - Issues new access token using refresh token
 */
router.post('/refresh-token', async (req: Request, res: Response) => {
  try {
    // Get refresh token from cookie or body
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'NO_REFRESH_TOKEN',
          message: 'Refresh token not provided'
        }
      });
    }

    try {
      // Verify refresh token
      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-key'
      ) as any;

      // Import database connection
      const mysql = require('mysql2/promise');
      const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'nilecare'
      });

      try {
        // Get user from database
        const [users] = await connection.execute(
          'SELECT id, email, first_name, last_name, role, status FROM users WHERE id = ?',
          [decoded.userId]
        );

        await connection.end();

        if ((users as any[]).length === 0) {
          return res.status(404).json({
            success: false,
            error: {
              code: 'USER_NOT_FOUND',
              message: 'User not found'
            }
          });
        }

        const user = (users as any[])[0];

        // Check if user is active
        if (user.status !== 'active') {
          return res.status(403).json({
            success: false,
            error: {
              code: 'USER_INACTIVE',
              message: 'User account is inactive'
            }
          });
        }

        // Generate new access token
        const accessToken = jwt.sign(
          {
            userId: user.id,
            email: user.email,
            role: user.role
          },
          process.env.JWT_SECRET || 'dev-secret-key',
          { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );

        // Return new access token
        res.json({
          success: true,
          data: {
            accessToken,
            user: {
              id: user.id,
              email: user.email,
              username: `${user.first_name} ${user.last_name}`,
              first_name: user.first_name,
              last_name: user.last_name,
              role: user.role
            }
          }
        });

      } catch (dbError: any) {
        await connection.end();
        throw dbError;
      }

    } catch (jwtError: any) {
      // Invalid or expired refresh token
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_REFRESH_TOKEN',
          message: 'Invalid or expired refresh token'
        }
      });
    }

  } catch (error: any) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred during token refresh',
        details: error.message
      }
    });
  }
});

/**
 * GET /api/v1/auth/me
 * Get current user info
 */
router.get('/me', (req: Request, res: Response) => {
  // Extract token from header
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'No token provided'
      }
    });
  }

  try {
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-key') as any;
    
    const user = mockUsers.find(u => u.id === decoded.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    const userData = {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      facilityId: user.facilityId,
      permissions: user.permissions
    };

    res.json({
      success: true,
      data: userData
    });

  } catch (error) {
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired token'
      }
    });
  }
});

export default router;

