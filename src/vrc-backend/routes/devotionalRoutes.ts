import { Router } from 'express';
import { DevotionalService } from '../services/devotionalService.ts';
import { requireAdmin, AuthRequest } from '../middleware/authMiddleware.ts';
import { aiRateLimiter } from '../middleware/securityMiddleware.ts';

const router = Router();

// POST /api/ai/generate-devotional - AI-generated pastoral devotional draft
router.post('/generate-devotional', requireAdmin, aiRateLimiter, async (req: AuthRequest, res) => {
  try {
    const { passage, theme } = req.body;
    if (!passage) {
      return res.status(400).json({ error: 'Scripture passage reference is required' });
    }

    const draft = await DevotionalService.generateDevotional(
      String(passage).trim(),
      theme ? String(theme).trim() : 'Faith & Revival'
    );

    res.json(draft);
  } catch (error: any) {
    console.error('Error in devotional generator:', error);
    res.status(500).json({ error: 'Failed to generate devotional draft' });
  }
});

export default router;
