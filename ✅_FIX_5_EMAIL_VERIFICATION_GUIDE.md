# ✅ FIX #5: EMAIL VERIFICATION IMPLEMENTATION GUIDE

**Status:** 🟢 **READY TO IMPLEMENT**  
**Priority:** 🟡 MEDIUM  
**Time:** 2 hours  
**Complexity:** LOW

---

## 🎯 OBJECTIVE

Implement email verification flow for new user registrations.

---

## 🚀 IMPLEMENTATION (2 HOURS)

### STEP 1: Update Auth Service Database (15 min)

Check if columns exist:
```sql
-- Auth Service already has these columns from V1 migration!
-- email_verified BOOLEAN DEFAULT FALSE
-- email_verification_token VARCHAR(255)
-- email_verification_expires TIMESTAMP NULL

-- Verify:
DESCRIBE auth_users;
```

✅ **Already exists!** No migration needed.

###STEP 2: Add Verification Endpoints to Auth Service (30 min)

Create: `microservices/auth-service/src/routes/verification.routes.ts`

```typescript
import { Router } from 'express';
import crypto from 'crypto';
import { db } from '../config/database';
import { NileCareResponse } from '@nilecare/response-wrapper';
import { authenticate } from '../../../shared/middleware/auth';

const router = Router();

/**
 * Send email verification
 * POST /api/v1/auth/send-verification
 */
router.post('/send-verification', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await db.query('SELECT * FROM auth_users WHERE id = ?', [userId]);
    
    if (user.email_verified) {
      return res.json(new NileCareResponse(200, true, 'Email already verified'));
    }
    
    // Generate verification token
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    // Save token
    await db.query(`
      UPDATE auth_users 
      SET email_verification_token = ?,
          email_verification_expires = ?
      WHERE id = ?
    `, [token, expires, userId]);
    
    // Send email via Notification Service
    const notificationUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3002';
    await axios.post(`${notificationUrl}/api/v1/emails/send`, {
      to: user.email,
      subject: 'Verify Your Email - NileCare',
      template: 'email-verification',
      data: {
        first_name: user.first_name,
        verification_link: `${process.env.CLIENT_URL}/verify-email?token=${token}`
      }
    });
    
    res.json(new NileCareResponse(200, true, 'Verification email sent'));
  } catch (error) {
    res.status(500).json(new NileCareResponse(500, false, 'Failed to send verification email', null, {
      code: 'EMAIL_SEND_FAILED',
      details: error.message
    }));
  }
});

/**
 * Verify email with token
 * POST /api/v1/auth/verify-email
 */
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json(new NileCareResponse(400, false, 'Token required'));
    }
    
    // Find user by token
    const [user] = await db.query(`
      SELECT * FROM auth_users
      WHERE email_verification_token = ?
        AND email_verification_expires > NOW()
        AND email_verified = FALSE
    `, [token]);
    
    if (!user) {
      return res.status(400).json(new NileCareResponse(400, false, 'Invalid or expired verification token'));
    }
    
    // Update user
    await db.query(`
      UPDATE auth_users
      SET email_verified = TRUE,
          status = 'active',
          email_verification_token = NULL,
          email_verification_expires = NULL,
          updated_at = NOW()
      WHERE id = ?
    `, [user.id]);
    
    res.json(new NileCareResponse(200, true, 'Email verified successfully', {
      email: user.email,
      verified: true
    }));
  } catch (error) {
    res.status(500).json(new NileCareResponse(500, false, 'Verification failed', null, {
      code: 'VERIFICATION_FAILED',
      details: error.message
    }));
  }
});

/**
 * Check verification status
 * GET /api/v1/auth/verification-status
 */
router.get('/verification-status', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const [user] = await db.query('SELECT email_verified FROM auth_users WHERE id = ?', [userId]);
    
    res.json(new NileCareResponse(200, true, 'Verification status retrieved', {
      verified: user?.email_verified || false
    }));
  } catch (error) {
    res.status(500).json(new NileCareResponse(500, false, 'Failed to check status'));
  }
});

export default router;
```

### STEP 3: Add to Auth Service Index (5 min)

```typescript
// microservices/auth-service/src/index.ts

import verificationRoutes from './routes/verification.routes';

app.use('/api/v1/auth', verificationRoutes);
```

### STEP 4: Create Email Template (30 min)

Create: `microservices/notification-service/templates/email-verification.html`

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Verify Your Email - NileCare</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: #3498db; padding: 20px; text-align: center;">
      <h1 style="color: white; margin: 0;">NileCare</h1>
    </div>
    
    <div style="padding: 30px; background: #f9f9f9;">
      <h2>Welcome to NileCare!</h2>
      <p>Hi {{first_name}},</p>
      <p>Thank you for registering with NileCare. Please verify your email address to activate your account.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{verification_link}}" 
           style="display: inline-block; padding: 15px 30px; background-color: #3498db; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
          Verify Email Address
        </a>
      </div>
      
      <p>Or copy and paste this link:</p>
      <p style="background: #fff; padding: 10px; border: 1px solid #ddd; word-wrap: break-word;">
        {{verification_link}}
      </p>
      
      <p><strong>This link expires in 24 hours.</strong></p>
      
      <p>If you didn't create an account, please ignore this email.</p>
    </div>
    
    <div style="padding: 20px; text-align: center; color: #999; font-size: 12px;">
      <p>© 2025 NileCare Healthcare Platform. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
```

### STEP 5: Add Frontend Page (30 min)

Create: `nilecare-frontend/src/pages/VerifyEmail.tsx`

```typescript
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { authService } from '../services/auth.service';

export function VerifyEmailPage() {
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  useEffect(() => {
    async function verify() {
      if (!token) {
        setStatus('error');
        setMessage('No verification token provided');
        return;
      }
      
      try {
        await authService.verifyEmail(token);
        setStatus('success');
        setMessage('Email verified successfully!');
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } catch (error: any) {
        setStatus('error');
        setMessage(error.response?.data?.message || 'Verification failed');
      }
    }
    
    verify();
  }, [token, navigate]);
  
  return (
    <div style={{ textAlign: 'center', padding: '50px' }}>
      {status === 'verifying' && (
        <>
          <h2>Verifying your email...</h2>
          <p>Please wait...</p>
        </>
      )}
      
      {status === 'success' && (
        <>
          <h2 style={{ color: 'green' }}>✅ Email Verified!</h2>
          <p>{message}</p>
          <p>Redirecting to login...</p>
        </>
      )}
      
      {status === 'error' && (
        <>
          <h2 style={{ color: 'red' }}>❌ Verification Failed</h2>
          <p>{message}</p>
          <button onClick={() => navigate('/login')}>Go to Login</button>
        </>
      )}
    </div>
  );
}
```

### STEP 6: Update Auth Service (15 min)

Add route and test:

```typescript
// Add to auth service routes
app.use('/api/v1/auth', verificationRoutes);
```

---

## ✅ SUCCESS CRITERIA

- ✅ Verification endpoints created
- ✅ Email template created  
- ✅ Frontend page created
- ✅ Token generation and validation working
- ✅ 24-hour expiration enforced
- ✅ Email sent on registration

---

## 📈 PROGRESS

**Before:** 70% complete  
**After:** 80% complete (+10%)

**Remaining:** 2 fixes (5 hours)

---

**FIX #5 READY TO IMPLEMENT! 🚀**

