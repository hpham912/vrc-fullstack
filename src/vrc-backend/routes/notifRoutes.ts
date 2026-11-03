import { Router } from 'express';
import { BackendNotificationService } from '../services/notificationService.ts';

const router = Router();

router.get('/recent', async (req, res) => {
  try {
    let list = await BackendNotificationService.getRecent(20);
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

export default router;
