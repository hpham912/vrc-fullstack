import { Request, Response, NextFunction } from 'express';
import { AuthService, AuthPayload } from '../services/authService.ts';

export interface AuthRequest extends Request {
  adminUser?: AuthPayload;
  user?: AuthPayload;
}

function readPayload(req: Request): AuthPayload | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split('Bearer ')[1]?.trim();
  if (!token) return null;
  return AuthService.verifyToken(token);
}

// Admin only: a valid token whose role is 'admin'. Member tokens
// (role 'member') are rejected here — members can only view.
export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  const payload = readPayload(req);
  if (!payload) {
    return res.status(401).json({ error: 'Session expired or invalid. Please sign in again.' });
  }
  if (payload.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Administrator access required.' });
  }

  req.adminUser = payload;
  req.user = payload;
  next();
};

// Any logged-in user: a valid token of any role (admin or member).
// For future member-only endpoints; admin routes keep requireAdmin.
export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const payload = readPayload(req);
  if (!payload) {
    return res.status(401).json({ error: 'Session expired or invalid. Please sign in again.' });
  }

  req.user = payload;
  if (payload.role === 'admin') req.adminUser = payload;
  next();
};
