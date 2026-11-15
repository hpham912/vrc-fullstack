import { Router } from 'express';
import { db } from '../../vrc-db/index.ts';
import { dailyVerses, versePool } from '../../vrc-db/schema.ts';
import { eq, desc, sql, asc } from 'drizzle-orm';
import { requireAdmin, AuthRequest } from '../middleware/authMiddleware.ts';
import { AppError } from '../middleware/errorHandler.ts';
import { BackendNotificationService } from '../services/notificationService.ts';
import { DevotionalService } from '../services/devotionalService.ts';
import { getVerseDayString } from '../utils/verseDay.ts';

const router = Router();

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

// Picks a verse for a verse-day and saves it as that day's row.
//   poolVerseId — a specific pool verse (admin override), or null to
//     pick one at random.
//   actorName — who triggered the pick (the admin's name, or 'System'
//     for the lazy 6 AM pick on a public request).
//   force — true for the admin override (POST /today/pick): today's
//     row is replaced even if one already exists. False for the lazy
//     pick: an existing row for the day is returned as-is and never
//     overwritten by a second random pick.
// Returns { ok: true, row, created }: row is the verse-day's row,
// created is true only when this call saved it. Returns
// { ok: false, reason } when no verse could be picked — 'empty-pool'
// (no pool verses), 'verse-not-found' (the named pool verse is gone),
// or 'fetch-failed' (the Bible API fetch failed; the caller falls
// back and the pick is retried on the next request). No notification
// is recorded here; the caller decides (GET /today notifies only on
// a new row, the admin override notifies always).
type PickResult =
  | { ok: true; row: any; created: boolean }
  | { ok: false; reason: 'empty-pool' | 'verse-not-found' | 'fetch-failed' };
async function pickAndSaveVerseForDay(
  verseDay: string,
  poolVerseId: number | null,
  actorName: string,
  force = false
): Promise<PickResult> {
  // Lazy pick only: if a row for this verse-day already exists, return
  // it instead of overwriting today's verse with a second random pick.
  // (An override passes force=true and skips this check.)
  if (!force) {
    const existingForDay = await db
      .select()
      .from(dailyVerses)
      .where(eq(dailyVerses.date, verseDay))
      .orderBy(asc(dailyVerses.id))
      .limit(1);
    if (existingForDay.length > 0) {
      return { ok: true, row: existingForDay[0], created: false };
    }
  }

  // A specific pool verse (admin override) or a random one.
  // If the pool table cannot be read yet (the migration SQL has not
  // been run), treat it as an empty pool so the caller falls back to
  // the most recent verse instead of erroring.
  let poolRows: (typeof versePool.$inferSelect)[];
  try {
    poolRows =
      poolVerseId !== null
        ? await db.select().from(versePool).where(eq(versePool.id, poolVerseId)).limit(1)
        : await db.select().from(versePool).orderBy(sql`RANDOM()`).limit(1);
  } catch (poolErr) {
    console.error('Scripture pool pick: could not read verse_pool:', poolErr);
    return { ok: false, reason: 'empty-pool' };
  }
  if (poolRows.length === 0) {
    return { ok: false, reason: poolVerseId !== null ? 'verse-not-found' : 'empty-pool' };
  }
  const poolVerse = poolRows[0];

  // Fetch the verse text from the Bible API (NIV + 1925). The pool
  // stores only the reference + reflection + prayer — never the text.
  let fetched;
  try {
    const passage = poolVerse.referenceEn || poolVerse.referenceVi || poolVerse.reference;
    fetched = await DevotionalService.fetchScripture(passage);
  } catch (fetchErr) {
    // Do not overwrite anything: the caller falls back to the most
    // recent verse and the pick is retried on the next request.
    console.error('Scripture pool pick: Bible API fetch failed:', fetchErr);
    return { ok: false, reason: 'fetch-failed' };
  }

  const finalRefEn = fetched.referenceEn || poolVerse.referenceEn || poolVerse.reference;
  const finalRefVi = fetched.referenceVi || poolVerse.referenceVi || poolVerse.reference;
  const finalTextEn = fetched.verseTextEn;
  const finalTextVi = fetched.verseTextVi;
  // Reflection and prayer come from the pool entry and are optional.
  // No reflection → store "" (not the verse text): the daily card
  // hides an empty reflection section instead of showing the text twice.
  const finalReflEn = (poolVerse.reflectionEn || poolVerse.reflection || '').trim();
  const finalReflVi = (poolVerse.reflectionVi || poolVerse.reflection || '').trim();
  const finalPrayerEn = poolVerse.prayerEn
    ? poolVerse.prayerEn.trim()
    : poolVerse.prayer
      ? poolVerse.prayer.trim()
      : null;
  const finalPrayerVi = poolVerse.prayerVi
    ? poolVerse.prayerVi.trim()
    : poolVerse.prayer
      ? poolVerse.prayer.trim()
      : null;

  const insertValues = {
    date: verseDay,
    verseText: finalTextEn,
    verseTextVi: finalTextVi,
    verseTextEn: finalTextEn,
    reference: finalRefEn,
    referenceVi: finalRefVi,
    referenceEn: finalRefEn,
    translation: fetched.translationEn || 'NIV',
    translationVi: fetched.translationVi || '1925',
    translationEn: fetched.translationEn || 'NIV',
    reflection: finalReflEn,
    reflectionVi: finalReflVi,
    reflectionEn: finalReflEn,
    prayer: finalPrayerEn,
    prayerVi: finalPrayerVi,
    prayerEn: finalPrayerEn,
    theme: 'Daily Scripture',
    publishedByUid: null,
    createdBy: actorName,
    updatedBy: actorName,
  };
  const updateValues = {
    verseText: finalTextEn,
    verseTextVi: finalTextVi,
    verseTextEn: finalTextEn,
    reference: finalRefEn,
    referenceVi: finalRefVi,
    referenceEn: finalRefEn,
    translation: fetched.translationEn || 'NIV',
    translationVi: fetched.translationVi || '1925',
    translationEn: fetched.translationEn || 'NIV',
    reflection: finalReflEn,
    reflectionVi: finalReflVi,
    reflectionEn: finalReflEn,
    prayer: finalPrayerEn,
    prayerVi: finalPrayerVi,
    prayerEn: finalPrayerEn,
    theme: 'Daily Scripture',
    updatedBy: actorName,
    updatedAt: new Date(),
  };

  const saved = await upsertVerseByDate(insertValues, updateValues);
  // Re-read the verse-day's first row, so the caller always returns
  // one consistent row for the day. (Two first-requests racing right
  // after 6 AM can each pass the check above and both save — the
  // second upsert updates the first's row, and both may record a
  // notification. Same check-then-act race as the existing POST /,
  // and benign: a valid pool verse is shown either way.)
  const dayRows = await db
    .select()
    .from(dailyVerses)
    .where(eq(dailyVerses.date, verseDay))
    .orderBy(asc(dailyVerses.id));
  const firstRow = dayRows[0] || saved[0];
  const created = saved[0] !== undefined && firstRow.id === saved[0].id;
  return { ok: true, row: firstRow, created };
}

// GET /api/verses/today - Get today's verse from PostgreSQL.
// The "day" is the verse-day: 6:00 AM to 6:00 AM Phoenix time. If no
// row exists for this verse-day yet, the first request after 6 AM
// lazily picks a pool verse at random, fetches its text, and saves it
// as today's row (no scheduler). If the pool is empty or the Bible
// API fetch fails, fall back to the most recent verse, then to the
// hardcoded verse below.
router.get('/today', async (req, res, next) => {
  try {
    const verseDay = getVerseDayString();
    let verseResult = await db
      .select()
      .from(dailyVerses)
      .where(eq(dailyVerses.date, verseDay))
      .orderBy(asc(dailyVerses.id));

    if (verseResult.length === 0) {
      const picked = await pickAndSaveVerseForDay(verseDay, null, 'System');
      if (picked.ok) {
        verseResult = [picked.row];
        // A new daily row was created by the pick — record it like
        // POST / does, so users get the new-verse notification.
        if (picked.created) {
          await BackendNotificationService.recordNotification(
            `Scripture of the Day: ${picked.row.referenceEn || picked.row.reference}`,
            `"${(picked.row.verseTextEn || '').slice(0, 100)}..."`,
            'verse',
            picked.row.id
          );
        }
      }
      // Pick failed (empty pool or Bible API down) — fall through to
      // the most recent verse below; the pick is retried next request.
    }

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
        date: verseDay,
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

// POST /api/verses/today/pick - Admin override: set today's verse.
// Body: { poolVerseId?: number | null }. A pool verse id displays that
// pool verse for the rest of today; null/absent picks a new random pool
// verse immediately. At 6 AM tomorrow the lazy pick takes over again
// and a random verse is chosen. (Admin only.)
router.post('/today/pick', requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const verseDay = getVerseDayString();
    const rawPoolVerseId = req.body?.poolVerseId;
    const poolVerseId =
      rawPoolVerseId === undefined || rawPoolVerseId === null
        ? null
        : Number(rawPoolVerseId);
    if (poolVerseId !== null && (isNaN(poolVerseId) || poolVerseId <= 0)) {
      throw new AppError('Invalid pool verse ID', 400, 'VALIDATION_ERROR');
    }

    const actorName = req.adminUser?.displayName || req.adminUser?.username || 'Admin';
    const picked = await pickAndSaveVerseForDay(verseDay, poolVerseId, actorName, true);
    if (!picked.ok) {
      if (picked.reason === 'verse-not-found') {
        throw new AppError('This pool verse no longer exists.', 404, 'VERSE_NOT_FOUND');
      }
      if (picked.reason === 'empty-pool') {
        throw new AppError(
          'Danh sách câu trống. Hãy thêm một câu vào danh sách trước. / The verse pool is empty. Add a verse to the pool first.',
          400,
          'VALIDATION_ERROR'
        );
      }
      // The Bible API fetch failed — nothing was overwritten.
      throw new AppError(
        'Không thể lấy nội dung Lời Chúa từ Kinh Thánh. Vui lòng thử lại. / Could not fetch the verse text from the Bible. Please try again.',
        400,
        'VALIDATION_ERROR'
      );
    }

    // The admin deliberately set today's verse — notify like POST /
    // does, whether this created the row or replaced it.
    await BackendNotificationService.recordNotification(
      `Scripture of the Day: ${picked.row.referenceEn || picked.row.reference}`,
      `"${(picked.row.verseTextEn || '').slice(0, 100)}..."`,
      'verse',
      picked.row.id
    );

    res.json(picked.row);
  } catch (error: any) {
    next(error);
  }
});

// GET /api/verses - List 10 most recent scriptures from PostgreSQL
router.get('/', async (req, res, next) => {
  try {
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
