import { Router } from 'express';
import { db } from '../../vrc-db/index.ts';
import { dailyVerses } from '../../vrc-db/schema.ts';
import { eq, desc } from 'drizzle-orm';
import { requireAdmin, AuthRequest } from '../middleware/authMiddleware.ts';
import { BackendNotificationService } from '../services/notificationService.ts';

const router = Router();

// GET /api/verses/today - Get today's verse
router.get('/today', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    let verseResult = await db.select().from(dailyVerses).where(eq(dailyVerses.date, today));

    if (verseResult.length === 0) {
      verseResult = await db.select().from(dailyVerses).orderBy(desc(dailyVerses.date)).limit(1);
    }

    if (verseResult.length === 0) {
      return res.json({
        id: 0,
        date: today,
        verseText: 'Nếu dân sự ta, là dân được gọi bằng danh ta, hạ mình xuống, cầu nguyện, tìm kiếm mặt ta và từ bỏ con đường tà, thì từ trên trời ta sẽ lắng nghe, tha thứ tội lỗi họ và chữa lành đất nước họ.',
        reference: '2 Chronicles 7:14 (2 Sử Ký 7:14)',
        translation: 'NIV',
        reflection: 'Lời hứa của Chúa về sự phục hưng bắt đầu khi dân sự Ngài hiệp một trong sự cầu nguyện và khiêm nhường.',
        prayer: 'Lạy Chúa, xin đem sự phục hưng đến trên hội thánh, gia đình và đời sống chúng con.',
        theme: 'Revival & Repentance',
      });
    }

    res.json(verseResult[0]);
  } catch (error: any) {
    console.error('Failed to fetch today verse:', error);
    res.status(500).json({ error: 'Failed to fetch daily verse' });
  }
});

// Helper function to keep strictly the 10 most recent scriptures
async function enforceMaxTenVerses() {
  try {
    const allVerses = await db
      .select({ id: dailyVerses.id, date: dailyVerses.date })
      .from(dailyVerses)
      .orderBy(desc(dailyVerses.date));

    if (allVerses.length > 10) {
      const surplus = allVerses.slice(10);
      for (const item of surplus) {
        await db.delete(dailyVerses).where(eq(dailyVerses.id, item.id));
      }
      console.log(`Pruned ${surplus.length} older scripture entries to keep exactly 10 most recent.`);
    }
  } catch (err) {
    console.warn('Scripture pruning warning:', err);
  }
}

// GET /api/verses - List 10 most recent scriptures
router.get('/', async (req, res) => {
  try {
    await enforceMaxTenVerses();
    const list = await db.select().from(dailyVerses).orderBy(desc(dailyVerses.date)).limit(10);
    res.json(list);
  } catch (error: any) {
    console.error('Failed to fetch verses:', error);
    res.status(500).json({ error: 'Failed to fetch scripture verses' });
  }
});


// POST /api/verses - Create or update daily verse (Admin only)
router.post('/', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const {
      date,
      verseText,
      verseTextVi,
      verseTextEn,
      reference,
      referenceVi,
      referenceEn,
      translation,
      translationVi,
      translationEn,
      reflection,
      reflectionVi,
      reflectionEn,
      prayer,
      prayerVi,
      prayerEn,
      theme,
    } = req.body;

    const finalVerseEn = String(verseTextEn || verseText || verseTextVi || '').trim();
    const finalVerseVi = String(verseTextVi || verseText || verseTextEn || '').trim();
    const finalRefEn = String(referenceEn || reference || referenceVi || '').trim();
    const finalRefVi = String(referenceVi || reference || referenceEn || '').trim();
    const finalTransEn = String(translationEn || translation || 'NIV').trim();
    const finalTransVi = String(translationVi || translation || 'RVV11').trim();
    const finalReflEn = String(reflectionEn || reflection || reflectionVi || '').trim();
    const finalReflVi = String(reflectionVi || reflection || reflectionEn || '').trim();
    const finalPrayerEn = prayerEn !== undefined ? (prayerEn ? String(prayerEn).trim() : null) : (prayer ? String(prayer).trim() : null);
    const finalPrayerVi = prayerVi !== undefined ? (prayerVi ? String(prayerVi).trim() : null) : (prayer ? String(prayer).trim() : null);

    if (!date || !finalVerseEn || !finalVerseVi || !finalRefEn || !finalRefVi) {
      return res.status(400).json({ error: 'Date, Vietnamese & English verse text, and references are required.' });
    }

    const inserted = await db
      .insert(dailyVerses)
      .values({
        date,
        verseText: finalVerseEn,
        verseTextVi: finalVerseVi,
        verseTextEn: finalVerseEn,
        reference: finalRefEn,
        referenceVi: finalRefVi,
        referenceEn: finalRefEn,
        translation: finalTransEn,
        translationVi: finalTransVi,
        translationEn: finalTransEn,
        reflection: finalReflEn || finalVerseEn,
        reflectionVi: finalReflVi || finalVerseVi,
        reflectionEn: finalReflEn || finalVerseEn,
        prayer: finalPrayerEn,
        prayerVi: finalPrayerVi,
        prayerEn: finalPrayerEn,
        theme: theme ? String(theme).trim() : 'Daily Scripture',
        publishedByUid: null,
        createdBy: req.adminUser?.displayName || req.adminUser?.username || 'Admin',
        updatedBy: req.adminUser?.displayName || req.adminUser?.username || 'Admin',
      })
      .onConflictDoUpdate({
        target: dailyVerses.date,
        set: {
          verseText: finalVerseEn,
          verseTextVi: finalVerseVi,
          verseTextEn: finalVerseEn,
          reference: finalRefEn,
          referenceVi: finalRefVi,
          referenceEn: finalRefEn,
          translation: finalTransEn,
          translationVi: finalTransVi,
          translationEn: finalTransEn,
          reflection: finalReflEn || finalVerseEn,
          reflectionVi: finalReflVi || finalVerseVi,
          reflectionEn: finalReflEn || finalVerseEn,
          prayer: finalPrayerEn,
          prayerVi: finalPrayerVi,
          prayerEn: finalPrayerEn,
          theme: theme ? String(theme).trim() : 'Daily Scripture',
          updatedBy: req.adminUser?.displayName || req.adminUser?.username || 'Admin',
          updatedAt: new Date(),
        },
      })
      .returning();

    // Trigger push notification record
    await BackendNotificationService.recordNotification(
      `Scripture of the Day: ${reference.trim()}`,
      `"${verseText.trim().slice(0, 100)}..."`,
      'verse',
      inserted[0].id
    );

    res.status(201).json(inserted[0]);
  } catch (error: any) {
    console.error('Failed to save daily verse:', error);
    res.status(500).json({ error: 'Failed to save daily scripture verse' });
  }
});

// PUT /api/verses/:id - Update daily verse by ID (Admin only)
router.put('/:id', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const { date, verseText, reference, translation, reflection, prayer, theme } = req.body;
    const updated = await db
      .update(dailyVerses)
      .set({
        date,
        verseText: String(verseText).trim(),
        reference: String(reference).trim(),
        translation: translation || 'NIV',
        reflection: String(reflection).trim(),
        prayer: prayer ? String(prayer).trim() : null,
        theme: theme ? String(theme).trim() : 'Daily Devotion',
      })
      .where(eq(dailyVerses.id, id))
      .returning();

    if (updated.length === 0) {
      return res.status(404).json({ error: 'Verse not found' });
    }
    res.json(updated[0]);
  } catch (error: any) {
    console.error('Failed to update verse:', error);
    res.status(500).json({ error: 'Failed to update daily scripture verse' });
  }
});

// DELETE /api/verses/:id - Delete daily verse (Admin only)
router.delete('/:id', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const deleted = await db.delete(dailyVerses).where(eq(dailyVerses.id, id)).returning();
    if (deleted.length === 0) {
      return res.status(404).json({ error: 'Verse not found' });
    }
    res.json({ message: 'Verse successfully deleted' });
  } catch (error: any) {
    console.error('Failed to delete verse:', error);
    res.status(500).json({ error: 'Failed to delete scripture verse' });
  }
});

export default router;
