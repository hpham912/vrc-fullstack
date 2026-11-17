import { Router } from 'express';
import { requireAdmin, AuthRequest } from '../middleware/authMiddleware.ts';
import { ConfigService } from '../services/configService.ts';

const router = Router();

export type CustomThemeStyle = 'diagonal' | 'horizontal' | 'vertical' | 'radial' | 'bands';

// A custom banner theme saved by an admin (mirrors the frontend
// CustomTheme type). Stored in the spotlight JSONB doc, so no new
// table or migration is needed.
export interface CustomTheme {
  id: string;
  name: string;
  colors: string[];
  style: CustomThemeStyle;
  // Optional per-element overrides (null = auto, derived from colors).
  buttonColor?: string | null;
  badgeColor?: string | null;
  borderColor?: string | null;
}

export interface SpotlightData {
  mode: 'auto' | 'event' | 'custom';
  selectedEventId: number | null;
  isActive: boolean;
  theme: 'christmas' | 'thanksgiving' | 'easter' | 'revival' | 'special' | 'default' | 'custom';
  // Saved custom themes. When theme is 'custom', customThemeId names
  // which one is active.
  customThemes?: CustomTheme[];
  customThemeId?: string | null;
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
  customThemes: [],
  customThemeId: null,
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

const CUSTOM_THEME_STYLES: CustomThemeStyle[] = ['diagonal', 'horizontal', 'vertical', 'radial', 'bands'];
const MAX_CUSTOM_THEMES = 10;
const MAX_CUSTOM_COLORS = 5;

// A valid hex color (#rgb or #rrggbb). Anything else is dropped, so a
// bad value from the client can never break the banner gradient.
function isValidHexColor(value: unknown): value is string {
  return typeof value === 'string' && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value.trim());
}

// Sanitize the admin's saved custom themes: keep at most 10 themes,
// each with an id, a short name, 1-5 valid hex colors, and a known
// style. The per-element overrides (button/pill/border) are kept only
// when they are valid hex colors; anything else becomes null (auto).
// Returns the clean list plus the active id (null when the requested
// id does not name a kept theme).
function sanitizeCustomThemes(
  rawThemes: unknown,
  rawActiveId: unknown
): { customThemes: CustomTheme[]; customThemeId: string | null } {
  const cleanOverride = (value: unknown): string | null =>
    isValidHexColor(value) ? (value as string).trim() : null;
  const customThemes: CustomTheme[] = [];
  if (Array.isArray(rawThemes)) {
    for (const entry of rawThemes.slice(0, MAX_CUSTOM_THEMES)) {
      if (!entry || typeof entry !== 'object') continue;
      const rec = entry as Record<string, unknown>;
      const id = typeof rec.id === 'string' ? rec.id.trim() : '';
      if (!id) continue;
      const name = typeof rec.name === 'string' ? rec.name.trim().slice(0, 40) : '';
      if (!name) continue;
      const colors = Array.isArray(rec.colors)
        ? (rec.colors as unknown[]).filter(isValidHexColor).map((c) => (c as string).trim()).slice(0, MAX_CUSTOM_COLORS)
        : [];
      if (colors.length === 0) continue;
      const style =
        typeof rec.style === 'string' && (CUSTOM_THEME_STYLES as string[]).includes(rec.style)
          ? (rec.style as CustomThemeStyle)
          : 'diagonal';
      customThemes.push({
        id,
        name,
        colors,
        style,
        buttonColor: cleanOverride(rec.buttonColor),
        badgeColor: cleanOverride(rec.badgeColor),
        borderColor: cleanOverride(rec.borderColor),
      });
    }
  }
  const customThemeId =
    typeof rawActiveId === 'string' && customThemes.some((ct) => ct.id === rawActiveId)
      ? rawActiveId
      : null;
  return { customThemes, customThemeId };
}

// PUT /api/spotlight - Update hero banner configuration (Admin only)
router.put('/', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const {
      mode,
      selectedEventId,
      isActive,
      theme,
      customThemes,
      customThemeId,
      badge,
      badgeVi,
      badgeEn,
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
    // Per-language pill badge text: the editor sends these separately.
    // Fall back to the combined badge when a side is absent, so older
    // saves keep showing the same text in both languages.
    const rawBadgeVi = badgeVi ? String(badgeVi).trim() : rawBadge;
    const rawBadgeEn = badgeEn ? String(badgeEn).trim() : rawBadge;
    const rawTitle = isAuto ? '' : (title ? String(title).trim() : '');
    const rawSubtitle = subtitle ? String(subtitle).trim() : '';
    // Per-language quotes: the admin fetch fills these separately (VI 1925 +
    // EN NIV). Fall back to the combined subtitle when a side is absent,
    // so older saves keep showing the same text in both languages.
    const rawSubtitleVi = subtitleVi ? String(subtitleVi).trim() : rawSubtitle;
    const rawSubtitleEn = subtitleEn ? String(subtitleEn).trim() : rawSubtitle;
    const rawDescription = isAuto ? '' : (description ? String(description).trim() : '');
    const rawLocationTag = locationTag ? String(locationTag).trim() : 'Tempe, Arizona';

    // Custom themes: sanitize the admin's saved list and active id.
    // A theme of 'custom' with no matching saved theme falls back to
    // the first saved theme (or the default look when there is none).
    const cleanCustom = sanitizeCustomThemes(customThemes, customThemeId);
    const cleanTheme = theme || 'thanksgiving';

    const updated: SpotlightData = {
      mode: isAuto ? 'auto' : 'event',
      selectedEventId: isAuto ? null : Number(selectedEventId),
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      theme: cleanTheme,
      customThemes: cleanCustom.customThemes,
      customThemeId:
        cleanTheme === 'custom'
          ? (cleanCustom.customThemeId ?? cleanCustom.customThemes[0]?.id ?? null)
          : cleanCustom.customThemeId,
      badge: rawBadge,
      badgeVi: rawBadgeVi,
      badgeEn: rawBadgeEn,
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
