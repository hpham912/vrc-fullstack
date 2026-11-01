import { Request, Response, NextFunction } from 'express';
import { verifyToken, AuthPayload } from '../lib/auth-util.ts';

export interface AuthRequest extends Request {
  adminUser?: AuthPayload;
}

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Please log in as an administrator.' });
  }

  const token = authHeader.split('Bearer ')[1];
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Session expired or invalid. Please sign in again.' });
  }

  req.adminUser = payload;
  next();
};

export const requireAuth = requireAdmin;
