import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { requireAdmin, AuthRequest } from '../middleware/authMiddleware.ts';

const router = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../../..', 'data');
const CHURCH_INFO_FILE = path.join(DATA_DIR, 'church-info.json');

export interface WeeklyService {
  id: string;
  titleVi: string;
  titleEn: string;
  time: string;
  descVi: string;
  descEn: string;
}

export interface ChurchInfoData {
  sanctuaryName: string;
  address: string;
  googleMapsUrl: string;
  phone: string;
  email: string;
  regionDescVi: string;
  regionDescEn: string;
  services: WeeklyService[];
  updatedAt: string;
}

const DEFAULT_CHURCH_INFO: ChurchInfoData = {
  sanctuaryName: 'Hội Thánh Phục Hưng Việt Nam • Tempe Sanctuary',
  address: 'Tempe, Arizona',
  googleMapsUrl: 'https://maps.google.com/?q=Tempe+Arizona',
  phone: '(480) 555-0199',
  email: 'contact@vnrevivalchurch.org',
  regionDescVi: 'Phục vụ cộng đồng người Việt tại Tempe, Phoenix, Mesa, Chandler & Gilbert',
  regionDescEn: 'Serving Vietnamese communities across Phoenix East Valley',
  services: [
    {
      id: 'sunday-worship',
      titleVi: 'Lễ Thờ Phượng Chúa Nhật',
      titleEn: 'Sunday Worship Service',
      time: 'Chúa Nhật • 3:00 PM – 5:00 PM',
      descVi: 'Tôn vinh Chúa, cầu nguyện và lắng nghe sứ điệp Lời Chúa gây dựng đức tin, phục hưng đời sống.',
      descEn: 'Bilingual worship, uplifting praise, gospel sermon and warm fellowship refreshments.',
    },
    {
      id: 'friday-youth',
      titleVi: 'Sinh Hoạt Giới Trẻ VRC Youth',
      titleEn: 'VRC Youth & Young Adults',
      time: 'Thứ Sáu • 6:30 PM – 8:30 PM',
      descVi: 'Sinh hoạt kết nối thanh thiếu niên, âm nhạc thờ phượng sôi động, thảo luận thực tế và thể thao.',
      descEn: 'Dynamic youth fellowship, contemporary praise, real-life discussion, games and snacks.',
    },
    {
      id: 'wednesday-prayer',
      titleVi: 'Học Kinh Thánh & Cầu Nguyện',
      titleEn: 'Midweek Bible Study & Prayer',
      time: 'Thứ Tư • 7:00 PM – 8:30 PM',
      descVi: 'Đào sâu Lời Chúa theo từng phân đoạn và cùng hiệp lòng cầu nguyện chữa lành, phục hưng cho hội thánh.',
      descEn: 'In-depth scripture study and united intercessory prayer for revival, families, and healings.',
    },
  ],
  updatedAt: new Date().toISOString(),
};

let inMemoryChurchInfo: ChurchInfoData = { ...DEFAULT_CHURCH_INFO };

function loadChurchInfo(): ChurchInfoData {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(CHURCH_INFO_FILE)) {
      const content = fs.readFileSync(CHURCH_INFO_FILE, 'utf-8');
      inMemoryChurchInfo = JSON.parse(content);
      return inMemoryChurchInfo;
    }
    fs.writeFileSync(CHURCH_INFO_FILE, JSON.stringify(DEFAULT_CHURCH_INFO, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error accessing church-info file:', err);
  }
  return inMemoryChurchInfo;
}

function saveChurchInfo(data: ChurchInfoData): void {
  inMemoryChurchInfo = { ...data, updatedAt: new Date().toISOString() };
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(CHURCH_INFO_FILE, JSON.stringify(inMemoryChurchInfo, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving church-info file:', err);
  }
}

// Initialize on startup
loadChurchInfo();

// GET /api/church-info - Get sanctuary address & weekly worship schedules
router.get('/', (req, res) => {
  try {
    const data = loadChurchInfo();
    res.json(data);
  } catch (err: any) {
    console.error('Failed to get church info:', err);
    res.json(inMemoryChurchInfo);
  }
});

// PUT /api/church-info - Update sanctuary address & worship schedules (Admin only)
router.put('/', requireAdmin, (req: AuthRequest, res) => {
  try {
    const { sanctuaryName, address, googleMapsUrl, phone, email, regionDescVi, regionDescEn, services } = req.body;

    if (!address || !sanctuaryName) {
      return res.status(400).json({ error: 'Sanctuary name and address are required.' });
    }

    const updated: ChurchInfoData = {
      sanctuaryName: String(sanctuaryName).trim(),
      address: String(address).trim(),
      googleMapsUrl: googleMapsUrl ? String(googleMapsUrl).trim() : `https://maps.google.com/?q=${encodeURIComponent(String(address).trim())}`,
      phone: phone ? String(phone).trim() : inMemoryChurchInfo.phone,
      email: email ? String(email).trim() : inMemoryChurchInfo.email,
      regionDescVi: regionDescVi ? String(regionDescVi).trim() : inMemoryChurchInfo.regionDescVi,
      regionDescEn: regionDescEn ? String(regionDescEn).trim() : inMemoryChurchInfo.regionDescEn,
      services: Array.isArray(services) && services.length > 0 ? services : inMemoryChurchInfo.services,
      updatedAt: new Date().toISOString(),
    };

    saveChurchInfo(updated);
    res.json(updated);
  } catch (err: any) {
    console.error('Failed to update church info:', err);
    res.status(500).json({ error: 'Failed to update church info' });
  }
});

export default router;
