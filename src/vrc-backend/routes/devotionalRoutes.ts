import { Router } from 'express';
import { DevotionalService } from '../services/devotionalService.ts';
import { requireAdmin, AuthRequest } from '../middleware/authMiddleware.ts';
import { aiRateLimiter } from '../middleware/securityMiddleware.ts';

const router = Router();

// POST /api/ai/fetch-scripture - Fetch real scripture text from Bible API
router.post('/fetch-scripture', requireAdmin, aiRateLimiter, async (req: AuthRequest, res) => {
  try {
    const { passage } = req.body;
    if (!passage) {
      return res.status(400).json({ error: 'Scripture passage reference is required' });
    }

    const result = await DevotionalService.fetchScripture(String(passage).trim());
    res.json(result);
  } catch (error: any) {
    console.error('Error fetching scripture:', error);
    res.status(400).json({ error: error.message || 'Failed to fetch scripture' });
  }
});

// POST /api/ai/generate-devotional - Alias to fetchScripture
router.post('/generate-devotional', requireAdmin, aiRateLimiter, async (req: AuthRequest, res) => {
  try {
    const { passage } = req.body;
    if (!passage) {
      return res.status(400).json({ error: 'Scripture passage reference is required' });
    }

    const result = await DevotionalService.fetchScripture(String(passage).trim());
    res.json(result);
  } catch (error: any) {
    console.error('Error fetching scripture:', error);
    res.status(400).json({ error: error.message || 'Failed to fetch scripture' });
  }
});

export default router;
