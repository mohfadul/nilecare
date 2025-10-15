import bcrypt from 'bcryptjs';
import { logger } from '../utils/logger';
import { UserService } from './UserService';
import { User } from '../models/User';

export class AuthService {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  /**
   * Authenticate user with email and password
   */
  async authenticateUser(
    email: string,
    password: string
  ): Promise<{
    success: boolean;
    user?: User;
    message?: string;
  }> {
    try {
      // Find user
      const user = await this.userService.findByEmail(email);

      if (!user) {
        return {
          success: false,
          message: 'Invalid email or password'
        };
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);

      if (!isValidPassword) {
        // Increment failed attempts
        await this.userService.incrementFailedLoginAttempts(user.id);
        
        return {
          success: false,
          message: 'Invalid email or password'
        };
      }

      // Check if account is locked
      if (user.accountLockedUntil && new Date() < new Date(user.accountLockedUntil)) {
        return {
          success: false,
          message: 'Account is temporarily locked'
        };
      }

      // Check account status
      if (user.status !== 'active') {
        return {
          success: false,
          message: `Account is ${user.status}`
        };
      }

      return {
        success: true,
        user
      };
    } catch (error: any) {
      logger.error('Authentication error', { email, error: error.message });
      throw error;
    }
  }

  /**
   * OAuth2 callback handler
   */
  async oauth2Callback(
    profile: any,
    accessToken: string,
    refreshToken: string
  ): Promise<User | null> {
    try {
      // Extract user info from OAuth2 profile
      const email = profile.emails?.[0]?.value || profile.email;
      const username = profile.username || profile.displayName || email.split('@')[0];

      if (!email) {
        logger.error('OAuth2 profile missing email', { profile });
        return null;
      }

      // Find or create user
      let user = await this.userService.findByEmail(email);

      if (!user) {
        // Create new user from OAuth2 profile
        user = await this.userService.create({
          email,
          username,
          passwordHash: '', // OAuth users don't have passwords
          firstName: profile.name?.givenName,
          lastName: profile.name?.familyName,
          role: 'patient',
          status: 'active'
        });

        logger.info('New user created via OAuth2', { userId: user.id, email });
      }

      return user;
    } catch (error: any) {
      logger.error('OAuth2 callback error', { error: error.message });
      return null;
    }
  }

  /**
   * OpenID Connect callback handler
   */
  async oidcCallback(
    profile: any,
    accessToken: string,
    refreshToken: string
  ): Promise<User | null> {
    try {
      // OIDC profile has standardized claims
      const email = profile.email || profile.emails?.[0]?.value;
      const username = profile.preferred_username || profile.email?.split('@')[0];

      if (!email) {
        logger.error('OIDC profile missing email', { profile });
        return null;
      }

      // Find or create user
      let user = await this.userService.findByEmail(email);

      if (!user) {
        user = await this.userService.create({
          email,
          username,
          passwordHash: '', // OIDC users don't have passwords
          firstName: profile.given_name,
          lastName: profile.family_name,
          role: 'patient',
          status: 'active'
        });

        logger.info('New user created via OIDC', { userId: user.id, email });
      }

      return user;
    } catch (error: any) {
      logger.error('OIDC callback error', { error: error.message });
      return null;
    }
  }
}

export default AuthService;

