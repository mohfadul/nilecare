import crypto from 'crypto';
import https from 'https';
import { logger } from '../utils/logger';

/**
 * Password Breach Detection Service
 * Uses Have I Been Pwned API (k-anonymity model)
 * 
 * The password is never sent to HIBP. Only the first 5 characters of the SHA-1 hash
 * are sent, and the API returns all hashes starting with those characters.
 * This ensures privacy while checking if password has been compromised.
 */
export class PasswordBreachService {
  private readonly HIBP_API_URL = 'api.pwnedpasswords.com';
  private readonly HIBP_API_PATH = '/range/';
  private readonly MIN_BREACH_THRESHOLD = 1; // Password found in at least 1 breach

  /**
   * Check if password has been compromised in a data breach
   */
  async isPasswordBreached(password: string): Promise<{
    breached: boolean;
    breachCount: number;
  }> {
    try {
      // Generate SHA-1 hash of password
      const hash = crypto
        .createHash('sha1')
        .update(password)
        .digest('hex')
        .toUpperCase();

      // Use k-anonymity: send only first 5 chars of hash
      const hashPrefix = hash.substring(0, 5);
      const hashSuffix = hash.substring(5);

      // Query HIBP API
      const breaches = await this.queryHIBP(hashPrefix);

      // Check if our hash suffix is in the response
      const match = breaches.find(b => b.suffix === hashSuffix);

      if (match) {
        logger.warn('Password found in breach database', {
          breachCount: match.count,
          hashPrefix // Safe to log (k-anonymity)
        });

        return {
          breached: true,
          breachCount: match.count
        };
      }

      return {
        breached: false,
        breachCount: 0
      };
    } catch (error: any) {
      logger.error('Password breach check failed', { error: error.message });
      
      // Fail open: if service is unavailable, allow registration
      // but log the error for monitoring
      return {
        breached: false,
        breachCount: 0
      };
    }
  }

  /**
   * Query Have I Been Pwned API
   */
  private queryHIBP(hashPrefix: string): Promise<Array<{ suffix: string; count: number }>> {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: this.HIBP_API_URL,
        path: `${this.HIBP_API_PATH}${hashPrefix}`,
        method: 'GET',
        headers: {
          'User-Agent': 'NileCare-Auth-Service',
          'Add-Padding': 'true' // Request padding for additional privacy
        },
        timeout: 5000 // 5 second timeout
      };

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          if (res.statusCode !== 200) {
            reject(new Error(`HIBP API returned status ${res.statusCode}`));
            return;
          }

          try {
            // Parse response: each line is "SUFFIX:COUNT"
            const breaches = data
              .trim()
              .split('\n')
              .map(line => {
                const [suffix, count] = line.split(':');
                return {
                  suffix: suffix.trim(),
                  count: parseInt(count.trim(), 10)
                };
              })
              .filter(b => !isNaN(b.count));

            resolve(breaches);
          } catch (error) {
            reject(error);
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('HIBP API request timeout'));
      });

      req.end();
    });
  }

  /**
   * Check password strength and provide recommendations
   */
  checkPasswordStrength(password: string): {
    score: number; // 0-4 (weak to strong)
    feedback: string[];
    isStrong: boolean;
  } {
    const feedback: string[] = [];
    let score = 0;

    // Length check
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (password.length < 8) {
      feedback.push('Password should be at least 8 characters long');
    }

    // Complexity checks
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) {
      score++;
    } else {
      feedback.push('Include both uppercase and lowercase letters');
    }

    if (/\d/.test(password)) {
      score++;
    } else {
      feedback.push('Include at least one number');
    }

    if (/[@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      score++;
    } else {
      feedback.push('Include at least one special character');
    }

    // Common patterns
    if (/^(?=.*(.)\1{2,})/.test(password)) {
      score--;
      feedback.push('Avoid repeating characters');
    }

    if (/^(123|abc|qwerty|password)/i.test(password)) {
      score = 0;
      feedback.push('Avoid common patterns like "123" or "password"');
    }

    // Sequential characters
    if (/(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789)/i.test(password)) {
      feedback.push('Avoid sequential characters');
      score = Math.max(0, score - 1);
    }

    // Ensure score is 0-4
    score = Math.max(0, Math.min(4, score));

    return {
      score,
      feedback: feedback.length > 0 ? feedback : ['Strong password'],
      isStrong: score >= 3
    };
  }

  /**
   * Validate password meets requirements and is not breached
   */
  async validatePassword(password: string): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic requirements
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (password.length > 128) {
      errors.push('Password must not exceed 128 characters');
    }

    // Complexity requirements
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[@$!%*?&]/.test(password)) {
      errors.push('Password must contain at least one special character (@$!%*?&)');
    }

    // Return early if basic requirements not met
    if (errors.length > 0) {
      return { valid: false, errors, warnings };
    }

    // Check strength
    const strength = this.checkPasswordStrength(password);
    if (!strength.isStrong) {
      warnings.push(...strength.feedback);
    }

    // Check if breached
    const breachCheck = await this.isPasswordBreached(password);
    if (breachCheck.breached) {
      if (breachCheck.breachCount > 10) {
        // Commonly breached password - reject it
        errors.push(
          `This password has been found in ${breachCheck.breachCount} data breaches. ` +
          'Please choose a different password.'
        );
      } else {
        // Less common but still breached - warn but allow
        warnings.push(
          `This password has been found in ${breachCheck.breachCount} data breach(es). ` +
          'Consider choosing a more unique password.'
        );
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get password breach statistics (for monitoring/dashboard)
   */
  async getBreachStats(): Promise<{
    totalChecks: number;
    breachedPasswords: number;
    lastCheck: Date;
  }> {
    // This would typically query a local cache/database
    // For now, return mock data
    return {
      totalChecks: 0,
      breachedPasswords: 0,
      lastCheck: new Date()
    };
  }
}

export default PasswordBreachService;

