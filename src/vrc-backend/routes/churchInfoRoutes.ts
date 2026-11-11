import { Router } from 'express';
import { requireAdmin, AuthRequest } from '../middleware/authMiddleware.ts';
import { ConfigService } from '../services/configService.ts';

const router = Router();

export interface WeeklyService {
  id: string;
  titleVi: string;
  titleEn: string;
  time: string;
  timeEn?: string;
  descVi: string;
  descEn: string;
}

export interface HeaderVerseData {
  verseTextVi: string;
  verseTextEn: string;
  referenceVi: string;
  referenceEn: string;
  translationVi?: string;
  translationEn?: string;
}

export const DEFAULT_HEADER_VERSE: HeaderVerseData = {
  verseTextVi: 'Vì Đức Chúa Trời yêu thương thế gian, đến nỗi đã ban Con một của Ngài, hầu cho hễ ai tin Con ấy không bị hư mất mà được sự sống đời đời.',
  verseTextEn: 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.',
  referenceVi: 'Giăng 3:16',
  referenceEn: 'John 3:16',
  translationVi: '1925',
  translationEn: 'NIV',
};

export interface ChurchInfoData {
  sanctuaryName: string;
  address: string;
  googleMapsUrl: string;
  phone: string;
  email: string;
  regionDescVi: string;
  regionDescEn: string;
  headerVerse?: HeaderVerseData;
  services: WeeklyService[];
  // Church default Zoom meeting (used by the shared Zoom button on
  // events). Optional — older saved church info has neither field.
  // Never rendered anywhere in the app; only the admin edit form
  // shows them so the admin can set them.
  zoomMeetingId?: string;
  zoomPasscode?: string;
  updatedAt: string;
}

export const DEFAULT_CHURCH_INFO: ChurchInfoData = {
  sanctuaryName: 'Hội Thánh Tin Lành Báp-tít Phục Hưng',
  address: '1565 E Warner Rd, Tempe AZ 85284',
  googleMapsUrl: 'https://maps.google.com/?q=1565+E+Warner+Rd,+Tempe+AZ+85284',
  phone: '(480) 555-0199',
  email: 'htph@vrcfamily.org',
  regionDescVi: 'Phục vụ cộng đồng người Việt tại Tempe, Phoenix, Mesa, Chandler & Gilbert',
  regionDescEn: 'Serving Vietnamese communities across Phoenix East Valley',
  headerVerse: DEFAULT_HEADER_VERSE,
  services: [
    {
      id: 'sunday-worship',
      titleVi: 'Lễ Thờ Phượng Chúa Nhật',
      titleEn: 'Sunday Worship Service',
      time: 'Chúa Nhật • 3:00 PM – 5:00 PM',
      timeEn: 'Sunday • 3:00 PM – 5:00 PM',
      descVi: 'Tôn vinh Chúa, cầu nguyện và lắng nghe sứ điệp Lời Chúa gây dựng đức tin, phục hưng đời sống.',
      descEn: 'Bilingual worship, uplifting praise, gospel sermon and warm fellowship refreshments.',
    },
    {
      id: 'friday-youth',
      titleVi: 'Sinh Hoạt Giới Trẻ VRC Youth',
      titleEn: 'VRC Youth & Young Adults',
      time: 'Thứ Sáu • 6:30 PM – 8:30 PM',
      timeEn: 'Friday • 6:30 PM – 8:30 PM',
      descVi: 'Sinh hoạt kết nối thanh thiếu niên, âm nhạc thờ phượng sôi động, thảo luận thực tế và thể thao.',
      descEn: 'Dynamic youth fellowship, contemporary praise, real-life discussion, games and snacks.',
    },
    {
      id: 'wednesday-prayer',
      titleVi: 'Học Kinh Thánh & Cầu Nguyện',
      titleEn: 'Midweek Bible Study & Prayer',
      time: 'Thứ Tư • 7:00 PM – 8:30 PM',
      timeEn: 'Wednesday • 7:00 PM – 8:30 PM',
      descVi: 'Đào sâu Lời Chúa theo từng phân đoạn và cùng hiệp lòng cầu nguyện chữa lành, phục hưng cho hội thánh.',
      descEn: 'In-depth scripture study and united intercessory prayer for revival, families, and healings.',
    },
  ],
  updatedAt: new Date().toISOString(),
};

let inMemoryChurchInfo: ChurchInfoData = { ...DEFAULT_CHURCH_INFO };

// GET /api/church-info - Get sanctuary address & weekly worship schedules
router.get('/', async (req, res) => {
  try {
    // Read from Postgres for the latest persistent state. The dev and
    // prod databases are separate, so there is no env split here.
    const storedData = await ConfigService.getChurchInfo();
    if (storedData && storedData.sanctuaryName) {
      const sanitizedAddress = (!storedData.address || storedData.address.toLowerCase().includes('tempe, arizona') || storedData.address.toLowerCase() === 'tempe, az' || storedData.address.toLowerCase() === 'tempe az')
        ? DEFAULT_CHURCH_INFO.address
        : storedData.address;
      inMemoryChurchInfo = {
        ...DEFAULT_CHURCH_INFO,
        ...storedData,
        address: sanitizedAddress,
        googleMapsUrl: sanitizedAddress === DEFAULT_CHURCH_INFO.address ? DEFAULT_CHURCH_INFO.googleMapsUrl : (storedData.googleMapsUrl || DEFAULT_CHURCH_INFO.googleMapsUrl),
        services: Array.isArray(storedData.services) && storedData.services.length > 0
          ? storedData.services
          : inMemoryChurchInfo.services,
      };
      return res.json(inMemoryChurchInfo);
    }

    // Fallback to in-memory (defaults on a fresh database)
    res.json(inMemoryChurchInfo);
  } catch (err: any) {
    console.error('Failed to get church info:', err);
    res.json(inMemoryChurchInfo);
  }
});

// PUT /api/church-info - Update sanctuary address & worship schedules (Admin only)
router.put('/', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { sanctuaryName, address, googleMapsUrl, phone, email, regionDescVi, regionDescEn, services, headerVerse, zoomMeetingId, zoomPasscode } = req.body;

    if (!address || !sanctuaryName) {
      return res.status(400).json({ error: 'Sanctuary name and address are required.' });
    }

    // Clean and validate services list
    const cleanedServices: WeeklyService[] = Array.isArray(services)
      ? services.map((s: any, idx: number) => ({
          id: s.id || `service-${idx + 1}-${Date.now()}`,
          titleVi: String(s.titleVi || '').trim(),
          titleEn: String(s.titleEn || s.titleVi || '').trim(),
          time: String(s.time || '').trim(),
          timeEn: s.timeEn ? String(s.timeEn).trim() : undefined,
          descVi: String(s.descVi || '').trim(),
          descEn: String(s.descEn || s.descVi || '').trim(),
        }))
      : inMemoryChurchInfo.services;

    const cleanedHeaderVerse: HeaderVerseData = headerVerse ? {
      verseTextVi: String(headerVerse.verseTextVi || inMemoryChurchInfo.headerVerse?.verseTextVi || DEFAULT_HEADER_VERSE.verseTextVi).trim(),
      verseTextEn: String(headerVerse.verseTextEn || inMemoryChurchInfo.headerVerse?.verseTextEn || DEFAULT_HEADER_VERSE.verseTextEn).trim(),
      referenceVi: String(headerVerse.referenceVi || inMemoryChurchInfo.headerVerse?.referenceVi || DEFAULT_HEADER_VERSE.referenceVi).trim(),
      referenceEn: String(headerVerse.referenceEn || inMemoryChurchInfo.headerVerse?.referenceEn || DEFAULT_HEADER_VERSE.referenceEn).trim(),
      translationVi: headerVerse.translationVi ? String(headerVerse.translationVi).trim() : (inMemoryChurchInfo.headerVerse?.translationVi || '1925'),
      translationEn: headerVerse.translationEn ? String(headerVerse.translationEn).trim() : (inMemoryChurchInfo.headerVerse?.translationEn || 'NIV'),
    } : (inMemoryChurchInfo.headerVerse || DEFAULT_HEADER_VERSE);

    const updated: ChurchInfoData = {
      sanctuaryName: String(sanctuaryName).trim(),
      address: String(address).trim(),
      googleMapsUrl: googleMapsUrl ? String(googleMapsUrl).trim() : `https://maps.google.com/?q=${encodeURIComponent(String(address).trim())}`,
      phone: phone ? String(phone).trim() : inMemoryChurchInfo.phone,
      email: email ? String(email).trim() : inMemoryChurchInfo.email,
      regionDescVi: regionDescVi ? String(regionDescVi).trim() : inMemoryChurchInfo.regionDescVi,
      regionDescEn: regionDescEn ? String(regionDescEn).trim() : inMemoryChurchInfo.regionDescEn,
      headerVerse: cleanedHeaderVerse,
      services: cleanedServices,
      // Zoom meeting ID is digits only ("599 7518611" -> "5997518611").
      // An empty value clears the field; an absent field keeps the
      // stored one. Never a hardcoded default here.
      zoomMeetingId: zoomMeetingId !== undefined ? String(zoomMeetingId).replace(/\D/g, '') : (inMemoryChurchInfo.zoomMeetingId ?? ''),
      zoomPasscode: zoomPasscode !== undefined ? String(zoomPasscode).trim() : (inMemoryChurchInfo.zoomPasscode ?? ''),
      updatedAt: new Date().toISOString(),
    };

    inMemoryChurchInfo = updated;

    // Save to Postgres for permanent cross-instance persistence
    await ConfigService.saveChurchInfo(updated);

    res.json(updated);
  } catch (err: any) {
    console.error('Failed to update church info:', err);
    res.status(500).json({ error: 'Failed to update church info' });
  }
});

// PUT /api/church-info/header-verse - Dedicated endpoint to update subtitle scripture below church name
router.put('/header-verse', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { verseTextVi, verseTextEn, referenceVi, referenceEn, translationVi, translationEn } = req.body;

    if (!verseTextVi || !verseTextEn || !referenceVi || !referenceEn) {
      return res.status(400).json({ error: 'Verse text and reference are required in both languages.' });
    }

    const newHeaderVerse: HeaderVerseData = {
      verseTextVi: String(verseTextVi).trim(),
      verseTextEn: String(verseTextEn).trim(),
      referenceVi: String(referenceVi).trim(),
      referenceEn: String(referenceEn).trim(),
      translationVi: translationVi ? String(translationVi).trim() : '1925',
      translationEn: translationEn ? String(translationEn).trim() : 'NIV',
    };

    inMemoryChurchInfo = {
      ...inMemoryChurchInfo,
      headerVerse: newHeaderVerse,
      updatedAt: new Date().toISOString(),
    };

    await ConfigService.saveChurchInfo(inMemoryChurchInfo);

    res.json(inMemoryChurchInfo);
  } catch (err: any) {
    console.error('Failed to update header verse:', err);
    res.status(500).json({ error: 'Failed to update header verse' });
  }
});

export default router;
