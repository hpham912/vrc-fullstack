import { Router } from 'express';
import { db } from '../../vrc-db/index.ts';
import { dailyVerses } from '../../vrc-db/schema.ts';
import { eq, desc, sql } from 'drizzle-orm';
import { requireAdmin, AuthRequest } from '../middleware/authMiddleware.ts';
import { BackendNotificationService } from '../services/notificationService.ts';

const router = Router();

// Helper to keep strictly the 10 most recent scriptures in PostgreSQL
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
      console.log(`Pruned ${surplus.length} older scripture entries in PostgreSQL.`);
    }
  } catch (err) {
    console.warn('Scripture pruning warning:', err);
  }
}

// GET /api/verses/today - Get today's verse (or most recent verse) from PostgreSQL
router.get('/today', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    let verseResult = await db
      .select()
      .from(dailyVerses)
      .where(eq(dailyVerses.date, today));

    if (verseResult.length === 0) {
      verseResult = await db
        .select()
        .from(dailyVerses)
        .orderBy(desc(dailyVerses.date))
        .limit(1);
    }

    if (verseResult.length === 0) {
      return res.json({
        id: 0,
        date: today,
        verseText:
          'If my people, who are called by my name, will humble themselves and pray and seek my face and turn from their wicked ways, then I will hear from heaven, and I will forgive their sin and will heal their land.',
        verseTextVi:
          'và nhược bằng dân sự ta, là dân gọi bằng danh ta, hạ mình xuống, cầu nguyện, tìm kiếm mặt ta, và trở lại, bỏ con đường tà, thì ta ở trên trời sẽ nghe, tha thứ tội chúng nó, và cứu xứ họ khỏi tai vạ.',
        verseTextEn:
          'If my people, who are called by my name, will humble themselves and pray and seek my face and turn from their wicked ways, then I will hear from heaven, and I will forgive their sin and will heal their land.',
        reference: '2 Chronicles 7:14 (2 Sử Ký 7:14)',
        referenceVi: '2 Sử Ký 7:14',
        referenceEn: '2 Chronicles 7:14',
        translation: 'NIV',
        translationVi: '1925',
        translationEn: 'NIV',
        reflection:
          'God’s promise of revival begins when His people unite in humility, sincere prayer, and wholehearted devotion.',
        reflectionVi:
          'Lời hứa của Chúa về sự phục hưng bắt đầu khi dân sự Ngài hiệp một trong sự cầu nguyện và khiêm nhường.',
        reflectionEn:
          'God’s promise of revival begins when His people unite in humility, sincere prayer, and wholehearted devotion.',
        prayer:
          'Lord, bring spiritual renewal and revival upon our church, our families, and our daily walk with You.',
        prayerVi:
          'Lạy Chúa, xin đem sự phục hưng đến trên hội thánh, gia đình và đời sống chúng con.',
        prayerEn:
          'Lord, bring spiritual renewal and revival upon our church, our families, and our daily walk with You.',
        theme: 'Revival & Repentance',
      });
    }

    res.json(verseResult[0]);
  } catch (error: any) {
    console.error('Failed to fetch today verse from PostgreSQL:', error);
    res.status(500).json({ error: error?.message || 'Failed to fetch daily verse from database' });
  }
});

// GET /api/verses - List 10 most recent scriptures from PostgreSQL
router.get('/', async (req, res) => {
  try {
    await enforceMaxTenVerses();
    const list = await db
      .select()
      .from(dailyVerses)
      .orderBy(desc(dailyVerses.date))
      .limit(10);
    res.json(list);
  } catch (error: any) {
    console.error('Failed to fetch verses from PostgreSQL:', error);
    res.status(500).json({ error: error?.message || 'Failed to fetch scripture verses from database' });
  }
});

// POST /api/verses - Create or update daily verse in PostgreSQL (Admin only)
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
    const finalTransVi = String(translationVi || translation || '1925').trim();
    const finalReflEn = String(reflectionEn || reflection || reflectionVi || '').trim();
    const finalReflVi = String(reflectionVi || reflection || reflectionEn || '').trim();
    const finalPrayerEn =
      prayerEn !== undefined
        ? prayerEn
          ? String(prayerEn).trim()
          : null
        : prayer
        ? String(prayer).trim()
        : null;
    const finalPrayerVi =
      prayerVi !== undefined
        ? prayerVi
          ? String(prayerVi).trim()
          : null
        : prayer
        ? String(prayer).trim()
        : null;

    if (!date || !finalVerseEn || !finalVerseVi || !finalRefEn || !finalRefVi) {
      return res.status(400).json({
        error: 'Date, Vietnamese & English verse text, and references are required.',
      });
    }

    const actorName = req.adminUser?.displayName || req.adminUser?.username || 'Admin';

    const insertValues = {
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
      createdBy: actorName,
      updatedBy: actorName,
    };

    const updateValues = {
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
      updatedBy: actorName,
      updatedAt: new Date(),
    };

    let inserted: any[];
    try {
      inserted = await db
        .insert(dailyVerses)
        .values(insertValues)
        .onConflictDoUpdate({
          target: dailyVerses.date,
          set: updateValues,
        })
        .returning();
    } catch (insertErr: any) {
      const errStr = String(insertErr?.cause?.message || insertErr?.message || '');
      if (errStr.includes('daily_verses_pkey') || errStr.includes('duplicate key')) {
        await db.execute(sql`SELECT setval('daily_verses_id_seq', COALESCE((SELECT MAX(id) FROM daily_verses), 0) + 1, false)`);
        inserted = await db
          .insert(dailyVerses)
          .values(insertValues)
          .onConflictDoUpdate({
            target: dailyVerses.date,
            set: updateValues,
          })
          .returning();
      } else {
        throw insertErr;
      }
    }

    // Trigger push notification record in PostgreSQL
    await BackendNotificationService.recordNotification(
      `Scripture of the Day: ${finalRefEn}`,
      `"${finalVerseEn.slice(0, 100)}..."`,
      'verse',
      inserted[0].id
    );

    res.status(201).json(inserted[0]);
  } catch (error: any) {
    console.error('Failed to save daily verse in PostgreSQL:', error);
    const detail = error?.cause?.detail || error?.cause?.message || error?.message || 'Failed to save daily scripture verse in database';
    res.status(500).json({ error: detail });
  }
});

// PUT /api/verses/:id - Update daily verse by ID in PostgreSQL (Admin only)
router.put('/:id', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid verse ID' });
    }

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
    const finalTransVi = String(translationVi || translation || '1925').trim();
    const finalReflEn = String(reflectionEn || reflection || reflectionVi || finalVerseEn).trim();
    const finalReflVi = String(reflectionVi || reflection || reflectionEn || finalVerseVi).trim();
    const finalPrayerEn =
      prayerEn !== undefined
        ? prayerEn
          ? String(prayerEn).trim()
          : null
        : prayer
        ? String(prayer).trim()
        : null;
    const finalPrayerVi =
      prayerVi !== undefined
        ? prayerVi
          ? String(prayerVi).trim()
          : null
        : prayer
        ? String(prayer).trim()
        : null;
    const actorName = req.adminUser?.displayName || req.adminUser?.username || 'Admin';

    const updated = await db
      .update(dailyVerses)
      .set({
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
        reflection: finalReflEn,
        reflectionVi: finalReflVi,
        reflectionEn: finalReflEn,
        prayer: finalPrayerEn,
        prayerVi: finalPrayerVi,
        prayerEn: finalPrayerEn,
        theme: theme ? String(theme).trim() : 'Daily Devotion',
        updatedBy: actorName,
        updatedAt: new Date(),
      })
      .where(eq(dailyVerses.id, id))
      .returning();

    if (updated.length === 0) {
      return res.status(404).json({ error: 'Verse not found' });
    }

    res.json(updated[0]);
  } catch (error: any) {
    console.error('Failed to update verse in PostgreSQL:', error);
    res.status(500).json({ error: error?.message || 'Failed to update daily scripture verse in database' });
  }
});

// DELETE /api/verses/:id - Delete daily verse from PostgreSQL (Admin only)
router.delete('/:id', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid verse ID' });
    }

    const deleted = await db.delete(dailyVerses).where(eq(dailyVerses.id, id)).returning();
    if (deleted.length === 0) {
      return res.status(404).json({ error: 'Verse not found' });
    }

    res.json({ message: 'Verse successfully deleted from database' });
  } catch (error: any) {
    console.error('Failed to delete verse from PostgreSQL:', error);
    res.status(500).json({ error: error?.message || 'Failed to delete scripture verse from database' });
  }
});

export default router;
