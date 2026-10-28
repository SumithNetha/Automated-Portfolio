import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { AdminUser } from '../models/AdminUser';

export interface AuthenticatedRequest extends Request {
  adminUser?: {
    id: string;
    email: string;
    role: string;
  };
}

export async function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    let token = '';

    // Check Authorization header: "Bearer <token>"
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    } else if (req.cookies && req.cookies.admin_token) {
      token = req.cookies.admin_token;
    }

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Authentication required. Please log in as administrator.',
      });
      return;
    }

    const decoded = jwt.verify(token, config.sessionSecret) as {
      id: string;
      email: string;
      role: string;
    };

    req.adminUser = decoded;
    next();
  } catch (err) {
    res.status(401).json({
      success: false,
      error: 'Invalid or expired session. Please log in again.',
    });
  }
}
