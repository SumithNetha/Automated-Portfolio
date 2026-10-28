import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AdminUser } from '../models/AdminUser';
import { config } from '../config';
import { requireAdmin, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

/**
 * POST /api/auth/login
 * Admin credentials login
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
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

    // Set HTTP-only secure cookie
    res.cookie('admin_token', token, {
      httpOnly: true,
      secure: config.isProduction,
      sameSite: 'lax',
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
router.post('/logout', (req: Request, res: Response) => {
  res.clearCookie('admin_token');
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

export default router;
