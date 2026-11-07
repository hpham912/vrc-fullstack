import { Router } from 'express';
import { db } from '../../vrc-db/index.ts';
import { dailyVerses } from '../../vrc-db/schema.ts';
import { eq, desc, sql } from 'drizzle-orm';
import { requireAdmin, AuthRequest } from '../middleware/authMiddleware.ts';
import { AppError } from '../middleware/errorHandler.ts';
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

// Shared upsert used by POST and PUT: save a verse by its date —
// update the row for that date if one exists, otherwise insert.
// NOTE: do NOT use .onConflictDoUpdate({ target: dailyVerses.date })
// here. The Drizzle schema declares date as .unique(), but the live
// daily_verses table was created without that unique constraint, so
// Postgres rejects ON CONFLICT (date) with "there is no unique or
// exclusion constraint matching the ON CONFLICT specification" — even
// for a brand-new date. Check-then-insert/update works with the
// table as it actually exists.
async function upsertVerseByDate(
  insertValues: typeof dailyVerses.$inferInsert,
  updateValues: Partial<typeof dailyVerses.$inferInsert>
): Promise<any[]> {
  const existingForDate = await db
    .select({ id: dailyVerses.id })
    .from(dailyVerses)
    .where(eq(dailyVerses.date, insertValues.date as string))
    .limit(1);

  if (existingForDate.length > 0) {
    return db
      .update(dailyVerses)
      .set(updateValues)
      .where(eq(dailyVerses.id, existingForDate[0].id))
      .returning();
  }

  try {
    return await db.insert(dailyVerses).values(insertValues).returning();
  } catch (insertErr: any) {
    const errStr = String(insertErr?.cause?.message || insertErr?.message || '');
    if (errStr.includes('daily_verses_pkey') || errStr.includes('duplicate key')) {
      await db.execute(
        sql`SELECT setval('daily_verses_id_seq', COALESCE((SELECT MAX(id) FROM daily_verses), 0) + 1, false)`
      );
      return db.insert(dailyVerses).values(insertValues).returning();
    }
    throw insertErr;
  }
}

// GET /api/verses/today - Get today's verse (or most recent verse) from PostgreSQL
router.get('/today', async (req, res, next) => {
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
    // Hand it to the shared error handler: it logs the real error and
    // sends the user a safe, accurate message instead of raw DB text.
    next(error);
  }
});

// GET /api/verses - List 10 most recent scriptures from PostgreSQL
router.get('/', async (req, res, next) => {
  try {
    await enforceMaxTenVerses();
    const list = await db
      .select()
      .from(dailyVerses)
      .orderBy(desc(dailyVerses.date))
      .limit(10);
    res.json(list);
  } catch (error: any) {
    next(error);
  }
});

// POST /api/verses - Create or update daily verse in PostgreSQL (Admin only)
router.post('/', requireAdmin, async (req: AuthRequest, res, next) => {
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
      throw new AppError(
        'Date, Vietnamese & English verse text, and references are required.',
        400,
        'VALIDATION_ERROR'
      );
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

    const inserted = await upsertVerseByDate(insertValues, updateValues);

    // Keep only the 10 latest verses in the DB so it never fills up:
    // adding a verse is the one path that grows the table, so prune
    // here (the list endpoint already prunes on read).
    await enforceMaxTenVerses();

    // Trigger push notification record in PostgreSQL
    await BackendNotificationService.recordNotification(
      `Scripture of the Day: ${finalRefEn}`,
      `"${finalVerseEn.slice(0, 100)}..."`,
      'verse',
      inserted[0].id
    );

    res.status(201).json(inserted[0]);
  } catch (error: any) {
    next(error);
  }
});

// PUT /api/verses/:id - Update daily verse by ID in PostgreSQL (Admin only)
router.put('/:id', requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      throw new AppError('Invalid verse ID', 400, 'VALIDATION_ERROR');
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

    // Same required-fields check as POST — without it, an edit with
    // empty text would silently save a blank verse.
    if (!date || !finalVerseEn || !finalVerseVi || !finalRefEn || !finalRefVi) {
      throw new AppError(
        'Date, Vietnamese & English verse text, and references are required.',
        400,
        'VALIDATION_ERROR'
      );
    }

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
      reflection: finalReflEn,
      reflectionVi: finalReflVi,
      reflectionEn: finalReflEn,
      prayer: finalPrayerEn,
      prayerVi: finalPrayerVi,
      prayerEn: finalPrayerEn,
      theme: theme ? String(theme).trim() : 'Daily Devotion',
      publishedByUid: null,
      createdBy: actorName,
      updatedBy: actorName,
    };

    const updateValues = {
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
    };

    let updated = await db
      .update(dailyVerses)
      .set(updateValues)
      .where(eq(dailyVerses.id, id))
      .returning();

    if (updated.length === 0) {
      // The row is gone — the verse was pruned or deleted after the
      // form was opened, or the id was never a DB row. Don't throw the
      // admin's edit away with a 404: save it by date instead, so an
      // edit always lands.
      updated = await upsertVerseByDate(insertValues, updateValues);
    }

    // A fallback insert grows the table, so prune like POST does.
    await enforceMaxTenVerses();

    res.json(updated[0]);
  } catch (error: any) {
    next(error);
  }
});

// DELETE /api/verses/:id - Delete daily verse from PostgreSQL (Admin only)
router.delete('/:id', requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      throw new AppError('Invalid verse ID', 400, 'VALIDATION_ERROR');
    }

    const deleted = await db.delete(dailyVerses).where(eq(dailyVerses.id, id)).returning();
    if (deleted.length === 0) {
      // The row is already gone — say so plainly instead of the bare
      // "Verse not found".
      throw new AppError('This verse was already deleted.', 404, 'VERSE_NOT_FOUND');
    }

    res.json({ message: 'Verse successfully deleted from database' });
  } catch (error: any) {
    next(error);
  }
});

export default router;
