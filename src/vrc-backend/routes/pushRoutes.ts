import { Router } from 'express';
import { PushService } from '../services/pushService.ts';

const router = Router();

// POST /api/push/register - Register a phone's FCM token so it receives
// push notifications. Public: any app install can subscribe (it only
// opts that phone in to receiving pushes; it grants no admin access).
router.post('/register', async (req, res) => {
  try {
    const { token, platform } = req.body || {};
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Push token is required.' });
    }
    const ok = await PushService.registerToken(token, platform);
    if (!ok) {
      return res.status(500).json({ error: 'Failed to register push token.' });
    }
    res.json({ ok: true });
  } catch (err: any) {
    console.error('Failed to register push token:', err);
    res.status(500).json({ error: 'Failed to register push token.' });
  }
});

export default router;
