import { Router } from 'express';
import { requireAdmin, AuthRequest } from '../middleware/authMiddleware.ts';
import { ConfigService } from '../services/configService.ts';

const router = Router();

export interface SpotlightData {
  mode: 'auto' | 'event' | 'custom';
  selectedEventId: number | null;
  isActive: boolean;
  theme: 'christmas' | 'thanksgiving' | 'easter' | 'revival' | 'special' | 'default';
  badge: string;
  badgeVi?: string;
  badgeEn?: string;
  title: string;
  titleVi?: string;
  titleEn?: string;
  subtitle: string;
  subtitleVi?: string;
  subtitleEn?: string;
  description: string;
  descriptionVi?: string;
  descriptionEn?: string;
  dateTag: string;
  locationTag: string;
  locationTagVi?: string;
  locationTagEn?: string;
  customAddress?: string;
  primaryBtnText: string;
  primaryBtnAction: 'events' | 'youth' | 'verse' | 'schedule';
  secondaryBtnText: string;
  secondaryBtnUrl: string;
  updatedAt: string;
}

export const DEFAULT_SPOTLIGHT: SpotlightData = {
  mode: 'auto',
  selectedEventId: null,
  isActive: true,
  theme: 'thanksgiving',
  badge: 'Tempe, Arizona • Chúa Nhật 3:00 PM – 5:00 PM',
  title: 'Hội Thánh Phục Hưng Việt Nam',
  subtitle: 'Thi Thiên 100:4 - "Hãy cảm tạ mà vào các cửa Ngài, hãy ngợi khen mà vào các hành lang Ngài!"',
  description: 'Thân mời quý tôi con Chúa cùng gia quyến đến thờ phượng Chúa, gây dựng đức tin và kết nối thông công ấm áp.',
  dateTag: 'Chúa Nhật Hàng Tuần • 3:00 PM',
  locationTag: 'Tempe, Arizona • Main Sanctuary',
  customAddress: 'Tempe, Arizona',
  primaryBtnText: 'Xem Tất Cả Sự Kiện',
  primaryBtnAction: 'events',
  secondaryBtnText: 'Chỉ Đường Google Maps',
  secondaryBtnUrl: 'https://maps.google.com/?q=Tempe+Arizona',
  updatedAt: new Date().toISOString(),
};

let inMemorySpotlight: SpotlightData = { ...DEFAULT_SPOTLIGHT };

// GET /api/spotlight - Get current hero banner configuration
router.get('/', async (req, res) => {
  try {
    // Read from Postgres for the latest persistent state. The dev and
    // prod databases are separate, so there is no env split here.
    const storedData = await ConfigService.getSpotlight();
    if (storedData && storedData.title) {
      inMemorySpotlight = { ...DEFAULT_SPOTLIGHT, ...storedData };
      return res.json(inMemorySpotlight);
    }

    // Fallback to in-memory (defaults on a fresh database)
    res.json(inMemorySpotlight);
  } catch (err: any) {
    console.error('Failed to get spotlight:', err);
    res.json(inMemorySpotlight);
  }
});

// PUT /api/spotlight - Update hero banner configuration (Admin only)
router.put('/', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const {
      mode,
      selectedEventId,
      isActive,
      theme,
      badge,
      title,
      subtitle,
      subtitleVi,
      subtitleEn,
      description,
      dateTag,
      locationTag,
      customAddress,
      primaryBtnText,
      primaryBtnAction,
      secondaryBtnText,
      secondaryBtnUrl,
    } = req.body;

    const isAuto = mode === 'auto' || !selectedEventId;
    const cleanAddress = customAddress ? String(customAddress).trim() : 'Tempe, Arizona';
    const computedDirectionsUrl = secondaryBtnUrl
      ? String(secondaryBtnUrl).trim()
      : `https://maps.google.com/?q=${encodeURIComponent(cleanAddress)}`;

    const rawBadge = badge ? String(badge).trim() : '';
    const rawTitle = isAuto ? '' : (title ? String(title).trim() : '');
    const rawSubtitle = subtitle ? String(subtitle).trim() : '';
    // Per-language quotes: the admin fetch fills these separately (VI 1925 +
    // EN NIV). Fall back to the combined subtitle when a side is absent,
    // so older saves keep showing the same text in both languages.
    const rawSubtitleVi = subtitleVi ? String(subtitleVi).trim() : rawSubtitle;
    const rawSubtitleEn = subtitleEn ? String(subtitleEn).trim() : rawSubtitle;
    const rawDescription = isAuto ? '' : (description ? String(description).trim() : '');
    const rawLocationTag = locationTag ? String(locationTag).trim() : 'Tempe, Arizona';

    const updated: SpotlightData = {
      mode: isAuto ? 'auto' : 'event',
      selectedEventId: isAuto ? null : Number(selectedEventId),
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      theme: theme || 'thanksgiving',
      badge: rawBadge,
      badgeVi: rawBadge,
      badgeEn: rawBadge,
      title: rawTitle,
      titleVi: rawTitle,
      titleEn: rawTitle,
      subtitle: rawSubtitle,
      subtitleVi: rawSubtitleVi,
      subtitleEn: rawSubtitleEn,
      description: rawDescription,
      descriptionVi: rawDescription,
      descriptionEn: rawDescription,
      dateTag: isAuto ? '' : (dateTag ? String(dateTag).trim() : ''),
      locationTag: rawLocationTag,
      locationTagVi: rawLocationTag,
      locationTagEn: rawLocationTag,
      customAddress: cleanAddress,
      primaryBtnText: primaryBtnText ? String(primaryBtnText).trim() : 'Xem Tất Cả Sự Kiện',
      primaryBtnAction: primaryBtnAction || 'events',
      secondaryBtnText: secondaryBtnText ? String(secondaryBtnText).trim() : 'Chỉ Đường Google Maps',
      secondaryBtnUrl: computedDirectionsUrl,
      updatedAt: new Date().toISOString(),
    };

    inMemorySpotlight = updated;

    // Save to Postgres for permanent cross-instance persistence
    await ConfigService.saveSpotlight(updated);

    res.json(updated);
  } catch (err: any) {
    console.error('Failed to update spotlight:', err);
    res.status(500).json({ error: err.message || 'Failed to update spotlight banner' });
  }
});

export default router;
