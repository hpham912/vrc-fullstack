import { Request, Response, NextFunction } from 'express';
import { AuthService, AuthPayload } from '../services/authService.ts';

export interface AuthRequest extends Request {
  adminUser?: AuthPayload;
}

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Administrator authentication required.' });
  }

  const token = authHeader.split('Bearer ')[1]?.trim();
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Missing session token.' });
  }

  const payload = AuthService.verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Session expired or invalid. Please sign in again.' });
  }

  req.adminUser = payload;
  next();
};

export const requireAuth = requireAdmin;
