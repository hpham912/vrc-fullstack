import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { requireAdmin, AuthRequest } from '../middleware/authMiddleware.ts';

const router = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../../..', 'data');
const SPOTLIGHT_FILE = path.join(DATA_DIR, 'spotlight.json');

export interface SpotlightData {
  mode: 'auto' | 'event' | 'custom';
  selectedEventId: number | null;
  isActive: boolean;
  theme: 'christmas' | 'thanksgiving' | 'easter' | 'revival' | 'special' | 'default';
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  dateTag: string;
  locationTag: string;
  customAddress?: string;
  primaryBtnText: string;
  primaryBtnAction: 'events' | 'youth' | 'verse' | 'schedule';
  secondaryBtnText: string;
  secondaryBtnUrl: string;
  updatedAt: string;
}

const DEFAULT_SPOTLIGHT: SpotlightData = {
  mode: 'auto',
  selectedEventId: null,
  isActive: true,
  theme: 'default',
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

function loadSpotlight(): SpotlightData {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(SPOTLIGHT_FILE)) {
      const content = fs.readFileSync(SPOTLIGHT_FILE, 'utf-8');
      inMemorySpotlight = JSON.parse(content);
      return inMemorySpotlight;
    }
    fs.writeFileSync(SPOTLIGHT_FILE, JSON.stringify(DEFAULT_SPOTLIGHT, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error accessing spotlight storage file:', err);
  }
  return inMemorySpotlight;
}

function saveSpotlight(data: SpotlightData): void {
  inMemorySpotlight = { ...data, updatedAt: new Date().toISOString() };
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(SPOTLIGHT_FILE, JSON.stringify(inMemorySpotlight, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing spotlight storage file:', err);
  }
}

// Initialize on startup
loadSpotlight();

// GET /api/spotlight - Get current hero banner configuration
router.get('/', (req, res) => {
  try {
    const data = loadSpotlight();
    res.json(data);
  } catch (err: any) {
    console.error('Failed to get spotlight:', err);
    res.json(inMemorySpotlight);
  }
});

// PUT /api/spotlight - Update hero banner configuration (Admin only)
router.put('/', requireAdmin, (req: AuthRequest, res) => {
  try {
    const {
      mode,
      selectedEventId,
      isActive,
      theme,
      badge,
      title,
      subtitle,
      description,
      dateTag,
      locationTag,
      customAddress,
      primaryBtnText,
      primaryBtnAction,
      secondaryBtnText,
      secondaryBtnUrl,
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required.' });
    }

    const cleanAddress = customAddress ? String(customAddress).trim() : 'Tempe, Arizona';
    const computedDirectionsUrl = secondaryBtnUrl
      ? String(secondaryBtnUrl).trim()
      : `https://maps.google.com/?q=${encodeURIComponent(cleanAddress)}`;

    const updated: SpotlightData = {
      mode: mode || 'auto',
      selectedEventId: selectedEventId ? Number(selectedEventId) : null,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      theme: theme || 'default',
      badge: badge ? String(badge).trim() : 'Vietnamese Revival Church',
      title: String(title).trim(),
      subtitle: subtitle ? String(subtitle).trim() : '',
      description: String(description).trim(),
      dateTag: dateTag ? String(dateTag).trim() : '',
      locationTag: locationTag ? String(locationTag).trim() : 'Tempe, Arizona',
      customAddress: cleanAddress,
      primaryBtnText: primaryBtnText ? String(primaryBtnText).trim() : 'Xem Tất Cả Sự Kiện',
      primaryBtnAction: primaryBtnAction || 'events',
      secondaryBtnText: secondaryBtnText ? String(secondaryBtnText).trim() : 'Chỉ Đường Google Maps',
      secondaryBtnUrl: computedDirectionsUrl,
      updatedAt: new Date().toISOString(),
    };

    saveSpotlight(updated);
    res.json(updated);
  } catch (err: any) {
    console.error('Failed to update spotlight:', err);
    res.status(500).json({ error: 'Failed to update spotlight banner' });
  }
});


export default router;
