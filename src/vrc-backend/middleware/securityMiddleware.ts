import { Request, Response, NextFunction } from 'express';
import cors from 'cors';

// In-memory rate limiting cache
interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

export const rateLimiter = (options: { windowMs: number; max: number; message: string }) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const key = `${req.path}:${ip}`;
    const now = Date.now();

    const record = rateLimitStore.get(key);

    if (!record || now > record.resetTime) {
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + options.windowMs,
      });
      return next();
    }

    if (record.count >= options.max) {
      return res.status(429).json({ error: options.message });
    }

    record.count += 1;
    next();
  };
};

// Rate limiter for authentication (prevents brute-force credential stuffing)
export const authRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // max 15 login attempts per window
  message: 'Too many login attempts. Please wait 15 minutes before trying again.',
});

// Rate limiter for AI Devotional generation
export const aiRateLimiter = rateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: 'Devotional generator rate limit reached. Please wait a moment.',
});

// Only these origins may call the API. The native app runs on
// https://localhost (both Android and iOS use the https scheme), the
// website runs on my.vrcfamily.org / vrcfamily.org, and the localhost
// ports are for local development. Anything else gets no CORS headers,
// so a browser on a random website cannot call the API.
const ALLOWED_ORIGINS = [
  'https://my.vrcfamily.org',
  'https://vrcfamily.org',
  'https://localhost',
  'capacitor://localhost',
  'http://localhost:5173',
  'http://localhost:3000',
];

// Production-ready CORS configuration allowing iOS Capacitor, local simulators, and web preview
export const corsMiddleware = cors({
  origin: ALLOWED_ORIGINS,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'X-App-Env'],
});
