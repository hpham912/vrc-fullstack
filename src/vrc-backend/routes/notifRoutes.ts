import { Router } from 'express';
import { BackendNotificationService } from '../services/notificationService.ts';
import { requireAdmin, AuthRequest } from '../middleware/authMiddleware.ts';

const router = Router();

router.get('/recent', async (req, res) => {
  try {
    // No hardcoded samples: an empty table returns an empty list, and the
    // app shows the loading shimmer while fetching, then the empty state.
    const list = await BackendNotificationService.getRecent(10);
    res.json(list);
  } catch (error: any) {
    console.error('Failed to fetch notifications:', error);
    res.status(500).json({ error: 'Failed to retrieve notifications' });
  }
});

// Admin posts a notice for all users (announcement notification).
router.post('/', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { title, body } = req.body || {};
    const cleanTitle = typeof title === 'string' ? title.trim() : '';
    const cleanBody = typeof body === 'string' ? body.trim() : '';
    if (!cleanTitle || !cleanBody) {
      return res.status(400).json({ error: 'Title and body are required' });
    }

    const created = await BackendNotificationService.recordNotification(
      cleanTitle,
      cleanBody,
      'announcement'
    );
    if (!created) {
      return res.status(500).json({ error: 'Failed to save notification' });
    }
    res.status(201).json(created);
  } catch (error: any) {
    console.error('Failed to create notification:', error);
    res.status(500).json({ error: 'Failed to create notification' });
  }
});

// Admin clears all notifications.
router.delete('/', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const deletedCount = await BackendNotificationService.clearAll();
    if (deletedCount < 0) {
      return res.status(500).json({ error: 'Failed to clear notifications' });
    }
    res.json({ message: 'All notifications cleared', deletedCount });
  } catch (error: any) {
    console.error('Failed to clear notifications:', error);
    res.status(500).json({ error: 'Failed to clear notifications' });
  }
});

// Admin deletes one notification by id.
router.delete('/:id', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid notification id' });
    }
    const deleted = await BackendNotificationService.deleteById(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    res.json({ message: 'Notification deleted', id: deleted.id });
  } catch (error: any) {
    console.error('Failed to delete notification:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

export default router;
