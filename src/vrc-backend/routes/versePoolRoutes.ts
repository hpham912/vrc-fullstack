import { Router } from 'express';
import { db } from '../../vrc-db/index.ts';
import { versePool } from '../../vrc-db/schema.ts';
import { eq, asc, count } from 'drizzle-orm';
import { requireAdmin, AuthRequest } from '../middleware/authMiddleware.ts';
import { AppError } from '../middleware/errorHandler.ts';

const router = Router();

// The pool holds at most 20 verses. The cap is enforced here (and the
// admin UI disables Add at 20), so a 21st add is rejected even if two
// admins add at the same time.
const POOL_MAX = 20;

// Bilingual validation messages, VI first then EN — the frontend shows
// the backend's own message for VALIDATION_ERROR, so it has to read
// correctly in both languages (same pattern as the Bible fetch limit
// error in devotionalService.ts).
const poolFullError = (): AppError =>
  new AppError(
    'Danh sách đã đầy (20 câu). Hãy xóa một câu trước khi thêm câu mới. / The verse pool is full (20 verses). Delete a verse before adding a new one.',
    400,
    'VALIDATION_ERROR'
  );

// Empty string means "not provided" for the optional fields — store
// NULL, not "", so the daily card can tell "no reflection" from text.
function optionalText(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  return trimmed ? trimmed : null;
}

// GET /api/verse-pool - List the pool, oldest first (Admin only)
router.get('/', requireAdmin, async (_req, res, next) => {
  try {
    const pool = await db.select().from(versePool).orderBy(asc(versePool.id));
    res.json(pool);
  } catch (error: any) {
    next(error);
  }
});

// POST /api/verse-pool - Add a verse to the pool (Admin only)
// Body: reference, referenceVi, referenceEn, reflection, reflectionVi,
// reflectionEn, prayer, prayerVi, prayerEn. The frontend already
// fetched both references via fetchScripture for the preview, so the
// backend just validates they are present and stores them. The verse
// TEXT is never stored here — it is fetched from the Bible API when
// the verse is picked.
router.post('/', requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const {
      reference,
      referenceVi,
      referenceEn,
      reflection,
      reflectionVi,
      reflectionEn,
      prayer,
      prayerVi,
      prayerEn,
    } = req.body;

    const finalRefVi = String(referenceVi || reference || '').trim();
    const finalRefEn = String(referenceEn || reference || '').trim();
    if (!finalRefVi || !finalRefEn) {
      throw new AppError(
        'Cần có câu Kinh Thánh bằng tiếng Việt và tiếng Anh. / A Vietnamese and English reference are required.',
        400,
        'VALIDATION_ERROR'
      );
    }

    const countRows = await db.select({ value: count() }).from(versePool);
    if (countRows[0].value >= POOL_MAX) {
      throw poolFullError();
    }

    const actorName = req.adminUser?.displayName || req.adminUser?.username || 'Admin';
    const inserted = await db
      .insert(versePool)
      .values({
        reference: finalRefEn,
        referenceVi: finalRefVi,
        referenceEn: finalRefEn,
        reflection: optionalText(reflection),
        reflectionVi: optionalText(reflectionVi),
        reflectionEn: optionalText(reflectionEn),
        prayer: optionalText(prayer),
        prayerVi: optionalText(prayerVi),
        prayerEn: optionalText(prayerEn),
        createdBy: actorName,
        updatedBy: actorName,
      })
      .returning();

    res.status(201).json(inserted[0]);
  } catch (error: any) {
    next(error);
  }
});

// PUT /api/verse-pool/:id - Update a pool verse's reflection/prayer
// only (Admin only). The reference is fixed — it is what identifies
// the verse — so only the optional reflection and prayer fields change.
router.put('/:id', requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      throw new AppError('Invalid pool verse ID', 400, 'VALIDATION_ERROR');
    }

    const { reflection, reflectionVi, reflectionEn, prayer, prayerVi, prayerEn } = req.body;
    const actorName = req.adminUser?.displayName || req.adminUser?.username || 'Admin';

    const updated = await db
      .update(versePool)
      .set({
        reflection: optionalText(reflection),
        reflectionVi: optionalText(reflectionVi),
        reflectionEn: optionalText(reflectionEn),
        prayer: optionalText(prayer),
        prayerVi: optionalText(prayerVi),
        prayerEn: optionalText(prayerEn),
        updatedBy: actorName,
        updatedAt: new Date(),
      })
      .where(eq(versePool.id, id))
      .returning();

    if (updated.length === 0) {
      throw new AppError('This pool verse no longer exists.', 404, 'VERSE_NOT_FOUND');
    }

    res.json(updated[0]);
  } catch (error: any) {
    next(error);
  }
});

// DELETE /api/verse-pool/:id - Remove a verse from the pool (Admin only)
router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      throw new AppError('Invalid pool verse ID', 400, 'VALIDATION_ERROR');
    }

    const deleted = await db.delete(versePool).where(eq(versePool.id, id)).returning();
    if (deleted.length === 0) {
      throw new AppError('This pool verse no longer exists.', 404, 'VERSE_NOT_FOUND');
    }

    res.json({ message: 'Verse removed from the pool' });
  } catch (error: any) {
    next(error);
  }
});

export default router;
