import { Router } from 'express';
import { BackendNotificationService } from '../services/notificationService.ts';
import { requireAdmin, AuthRequest } from '../middleware/authMiddleware.ts';

const router = Router();

router.get('/recent', async (req, res) => {
  try {
    let list = await BackendNotificationService.getRecent(10);
    if (!list || list.length === 0) {
      list = [
        {
          id: 1,
          title: 'Lễ Thờ Phượng Chúa Nhật • Sunday Worship',
          body: 'Thân mời quý tôi con Chúa cùng gia quyến đến thờ phượng Chúa lúc 3:00 PM tại Tempe Sanctuary.',
          type: 'event',
          createdAt: new Date().toISOString(),
        },
        {
          id: 2,
          title: 'Sinh Hoạt Giới Trẻ VRC Youth • Friday Fellowship',
          body: 'Chương trình sinh hoạt và kết nối đức tin cho giới trẻ Thứ Sáu hàng tuần lúc 6:30 PM.',
          type: 'event',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: 3,
          title: 'Câu Gốc & Lời Chúa Mỗi Ngày',
          body: 'Đức Giê-hô-va là Đấng chăn giữ tôi; tôi sẽ chẳng thiếu thốn gì. (Thi Thiên 23:1)',
          type: 'verse',
          createdAt: new Date(Date.now() - 172800000).toISOString(),
        },
      ] as any;
    }
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

export default router;
