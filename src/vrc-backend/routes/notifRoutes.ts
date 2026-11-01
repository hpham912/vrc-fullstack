import { Router } from 'express';
import { BackendNotificationService } from '../services/notificationService.ts';

const router = Router();

// GET /api/notifications/recent - List recent notifications
router.get('/recent', async (req, res) => {
  try {
    const list = await BackendNotificationService.getRecent(20);
    res.json(list);
  } catch (error: any) {
    console.error('Failed to fetch notifications:', error);
    res.status(500).json({ error: 'Failed to retrieve notifications' });
  }
});

export default router;
