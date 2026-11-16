import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { AdminUser } from '../models/AdminUser';
import { config } from '../config';
import { requireAdmin, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

/**
 * Rate Limiter for Login Endpoint
 * Limits to 5 failed attempts per 15 minutes per IP
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true, // Counts only failed attempts against the rate limit
  message: {
    success: false,
    error: 'Too many failed login attempts from this IP, please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * POST /api/auth/login
 * Admin credentials login with rate limiting & cross-domain cookie hardening
 */
router.post('/login', loginLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, error: 'Email and password are required' });
      return;
    }

    const normalizedEmail = (email as string).trim().toLowerCase();
    const admin = await AdminUser.findOne({ email: normalizedEmail });

    if (!admin) {
      res.status(401).json({ success: false, error: 'Invalid administrator credentials' });
      return;
    }

    const isMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!isMatch) {
      res.status(401).json({ success: false, error: 'Invalid administrator credentials' });
      return;
    }

    admin.lastLoginAt = new Date();
    await admin.save();

    const token = jwt.sign(
      { id: admin._id, email: admin.email, role: admin.role },
      config.sessionSecret,
      { expiresIn: '7d' }
    );

    // Cross-Domain & Production-hardened cookie configuration
    const isProd = config.isProduction;
    res.cookie('admin_token', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      token,
      user: {
        email: admin.email,
        role: admin.role,
        lastLoginAt: admin.lastLoginAt,
      },
    });
  } catch (err: any) {
    console.error('[AuthRoute] Login error:', err);
    res.status(500).json({ success: false, error: 'Internal server error during authentication' });
  }
});

/**
 * POST /api/auth/logout
 */
router.post('/logout', (_req: Request, res: Response) => {
  const isProd = config.isProduction;
  res.clearCookie('admin_token', {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
  });
  res.json({ success: true, message: 'Logged out successfully' });
});

/**
 * GET /api/auth/me
 */
router.get('/me', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  res.json({
    success: true,
    user: req.adminUser,
  });
});

/**
 * POST /api/auth/change-password
 * Allow authenticated owner to update their password securely
 */
router.post('/change-password', requireAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      res.status(400).json({ success: false, error: 'Current password and new password are required' });
      return;
    }
    if (newPassword.length < 8) {
      res.status(400).json({ success: false, error: 'New password must be at least 8 characters long' });
      return;
    }

    const admin = await AdminUser.findById(req.adminUser?.id);
    if (!admin) {
      res.status(404).json({ success: false, error: 'Administrator user not found' });
      return;
    }

    const isMatch = await bcrypt.compare(currentPassword, admin.passwordHash);
    if (!isMatch) {
      res.status(401).json({ success: false, error: 'Current password is incorrect' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    admin.passwordHash = await bcrypt.hash(newPassword, salt);
    await admin.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to update password' });
  }
});

export default router;
