import { Router } from 'express';
import { TranslationService } from '../services/translationService.ts';
import { requireAdmin, AuthRequest } from '../middleware/authMiddleware.ts';
import { aiRateLimiter } from '../middleware/securityMiddleware.ts';

const router = Router();

// POST /api/ai/translate - Translate church event, scripture, or announcement text
router.post('/translate', requireAdmin, aiRateLimiter, async (req: AuthRequest, res) => {
  try {
    const { text, sourceLang, targetLang, context } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text to translate is required' });
    }

    const result = await TranslationService.translate({
      text: text.trim(),
      sourceLang: sourceLang || 'auto',
      targetLang: targetLang || 'en',
      context: context || 'church',
    });

    res.json(result);
  } catch (error: any) {
    console.error('Translation error:', error);
    res.status(500).json({ error: 'Translation failed' });
  }
});

// POST /api/ai/translate-devotional - Translate scripture devotional fields (verse, reflection, prayer)
router.post('/translate-devotional', requireAdmin, aiRateLimiter, async (req: AuthRequest, res) => {
  try {
    const { fields, targetLang } = req.body;
    if (!fields || typeof fields !== 'object') {
      return res.status(400).json({ error: 'Devotional fields are required' });
    }

    const result = await TranslationService.translateDevotional(fields, targetLang || 'en');
    res.json(result);
  } catch (error: any) {
    console.error('Devotional translation error:', error);
    res.status(500).json({ error: 'Devotional translation failed' });
  }
});

export default router;
