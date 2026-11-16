import { Router } from 'express';
import multer from 'multer';
import { db } from '../../vrc-db/index.ts';
import { versePool } from '../../vrc-db/schema.ts';
import { eq, asc, count, isNull, or } from 'drizzle-orm';
import { requireAdmin, AuthRequest } from '../middleware/authMiddleware.ts';
import { AppError } from '../middleware/errorHandler.ts';
import {
  parseVerseFile,
  validateVerseRows,
  daysInMonth,
  type ValidatedVerse,
} from '../services/verseUploadService.ts';
import { pruneOldVerseHistory, currentVerseMonth } from '../services/versePruneService.ts';

const router = Router();

// The pool holds at most 40 verses PER MONTH (enforced here, and the
// admin UI disables Add at 40 for the shown month). A month has at
// most 31 days, and the extra room is for verses uploaded beyond the
// days in the month plus manual adds. A 41st add for the same month
// is rejected even if two admins add at the same time.
const POOL_MAX_PER_MONTH = 40;

// Upload limits. The file is parsed in memory only — never written
// to disk, never stored. 5 MB is far above any 30-verse document.
const UPLOAD_MAX_MB = 5;
const UPLOAD_MAX_BYTES = UPLOAD_MAX_MB * 1024 * 1024;
const UPLOAD_EXTENSIONS = ['.csv', '.txt', '.docx'] as const;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: UPLOAD_MAX_BYTES },
  fileFilter: (_req, file, callback) => {
    const extension = file.originalname.slice(file.originalname.lastIndexOf('.')).toLowerCase();
    if (!UPLOAD_EXTENSIONS.includes(extension as (typeof UPLOAD_EXTENSIONS)[number])) {
      callback(
        new AppError(
          'Chỉ chấp nhận tệp .csv, .txt hoặc .docx. / Only .csv, .txt or .docx files are accepted.',
          400,
          'VALIDATION_ERROR'
        )
      );
      return;
    }
    callback(null, true);
  },
});

function isMonth(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

// Bilingual validation messages, VI first then EN — the frontend shows
// the backend's own message for VALIDATION_ERROR, so it has to read
// correctly in both languages (same pattern as the Bible fetch limit
// error in devotionalService.ts).
const poolFullError = (month: string): AppError =>
  new AppError(
    `Danh sách tháng ${month} đã đầy (${POOL_MAX_PER_MONTH} câu). Hãy xóa một câu trước khi thêm câu mới. / The verse pool for ${month} is full (${POOL_MAX_PER_MONTH} verses). Delete a verse before adding a new one.`,
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

// GET /api/verse-pool - List the pool, oldest first (Admin only).
// ?month=YYYY-MM filters to one month. Rows with no month yet
// (added before the month column existed) count as the current
// month, so they appear when the current month is requested.
router.get('/', requireAdmin, async (req, res, next) => {
  try {
    const month = typeof req.query.month === 'string' ? req.query.month : null;
    let pool;
    if (month && isMonth(month)) {
      const monthCondition =
        month === currentVerseMonth()
          ? or(eq(versePool.month, month), isNull(versePool.month))
          : eq(versePool.month, month);
      pool = await db
        .select()
        .from(versePool)
        .where(monthCondition)
        .orderBy(asc(versePool.id));
    } else {
      pool = await db.select().from(versePool).orderBy(asc(versePool.id));
    }
    res.json(pool);
  } catch (error: any) {
    next(error);
  }
});

// POST /api/verse-pool - Add a verse to the pool (Admin only)
// Body: reference, referenceVi, referenceEn, reflection, reflectionVi,
// reflectionEn, prayer, prayerVi, prayerEn, month (YYYY-MM, defaults
// to the current month), source ('manual' unless set). The frontend
// already fetched both references via fetchScripture for the preview,
// so the backend just validates they are present and stores them.
// The verse TEXT is never stored here — it is fetched from the Bible
// API when the verse is picked. The cap is per month (40).
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
      month,
      source,
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

    const targetMonth = isMonth(month) ? month : currentVerseMonth();
    const countRows = await db
      .select({ value: count() })
      .from(versePool)
      .where(
        targetMonth === currentVerseMonth()
          ? or(eq(versePool.month, targetMonth), isNull(versePool.month))
          : eq(versePool.month, targetMonth)
      );
    if (countRows[0].value >= POOL_MAX_PER_MONTH) {
      throw poolFullError(targetMonth);
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
        month: targetMonth,
        source: source === 'upload' ? 'upload' : 'manual',
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

// DELETE /api/verse-pool/:id - Remove a verse from the pool (Admin only).
// Only the pool row is deleted. Picked verses are already removed
// from the pool when they are picked, so a pool verse has no daily
// row — and deleting by reference here used to erase a past month's
// history when the same reference appeared there. History in
// daily_verses is never deleted by this endpoint; it is pruned only
// by the monthly prune (current + previous month are kept).
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

// POST /api/verse-pool/upload - Parse + validate a monthly verse
// file and return a PREVIEW (Admin only). Nothing is imported here.
// Multipart form: `file` (.csv, .txt or .docx) + `month` (YYYY-MM).
// All-or-nothing: if any row fails, the whole file is rejected with
// a per-row error list (400, { errors }) so the uploader can fix the
// file and re-upload. On success it returns the validated verses,
// any count warnings, and how many pool verses the month already has
// (so the frontend can ask about replacing them).
router.post('/upload', requireAdmin, (req, res, next) => {
  upload.single('file')(req, res, async (multerErr: unknown) => {
    try {
      if (multerErr) {
        if (
          multerErr instanceof multer.MulterError &&
          multerErr.code === 'LIMIT_FILE_SIZE'
        ) {
          throw new AppError(
            `Tệp quá lớn (tối đa ${UPLOAD_MAX_MB} MB). / The file is too large (max ${UPLOAD_MAX_MB} MB).`,
            400,
            'VALIDATION_ERROR'
          );
        }
        throw multerErr;
      }

      const month = typeof req.body?.month === 'string' ? req.body.month : '';
      if (!isMonth(month)) {
        throw new AppError(
          'Hãy chọn tháng (định dạng YYYY-MM). / Choose a month (YYYY-MM format).',
          400,
          'VALIDATION_ERROR'
        );
      }

      const file = (req as { file?: Express.Multer.File }).file;
      if (!file || !file.buffer || file.buffer.length === 0) {
        throw new AppError(
          'Không có tệp nào được tải lên. / No file was uploaded.',
          400,
          'VALIDATION_ERROR'
        );
      }

      const { rows, errors: parseErrors } = await parseVerseFile(file.buffer, file.originalname);
      if (parseErrors.length > 0) {
        return res.status(400).json({ errors: parseErrors });
      }

      const { verses, errors, warnings } = await validateVerseRows(rows, month);
      if (errors.length > 0) {
        return res.status(400).json({ errors });
      }
      if (verses.length === 0) {
        return res.status(400).json({
          errors: [{ row: 0, message: 'The file has no verses. Add at least one verse row.' }],
        });
      }
      if (verses.length > POOL_MAX_PER_MONTH) {
        return res.status(400).json({
          errors: [
            {
              row: 0,
              message: `Quá nhiều câu (${verses.length}). Một tháng chứa tối đa ${POOL_MAX_PER_MONTH} câu. / Too many verses (${verses.length}). A month holds at most ${POOL_MAX_PER_MONTH} verses.`,
            },
          ],
        });
      }

      const existingRows = await db
        .select({ value: count() })
        .from(versePool)
        .where(
          month === currentVerseMonth()
            ? or(eq(versePool.month, month), isNull(versePool.month))
            : eq(versePool.month, month)
        );
      const existingCount = existingRows[0]?.value ?? 0;

      res.json({
        month,
        daysInMonth: daysInMonth(month),
        verses,
        warnings,
        existingCount,
      });
    } catch (error: any) {
      next(error);
    }
  });
});

// POST /api/verse-pool/upload/confirm - Import a previewed file's
// verses into the pool (Admin only). Body: { month, verses, replace }.
// `verses` is the array returned by POST /upload (already validated
// against the Bible API there); this endpoint re-checks the structure
// and the per-month cap before inserting. If the month already has
// pool verses and `replace` is not true, it answers 409 with
// { needsReplace: true, existingCount } and imports nothing — the
// frontend then asks the admin to confirm Replace. Replace deletes
// only that month's remaining (unpicked) pool verses; daily_verses
// history is never touched.
router.post('/upload/confirm', requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const { month, verses, replace } = req.body as {
      month?: unknown;
      verses?: unknown;
      replace?: unknown;
    };

    if (!isMonth(month)) {
      throw new AppError(
        'Hãy chọn tháng (định dạng YYYY-MM). / Choose a month (YYYY-MM format).',
        400,
        'VALIDATION_ERROR'
      );
    }
    if (!Array.isArray(verses) || verses.length === 0) {
      throw new AppError(
        'Không có câu nào để nhập. / No verses to import.',
        400,
        'VALIDATION_ERROR'
      );
    }
    if (verses.length > POOL_MAX_PER_MONTH) {
      throw new AppError(
        `Quá nhiều câu (${verses.length}). Một tháng chứa tối đa ${POOL_MAX_PER_MONTH} câu. / Too many verses (${verses.length}). A month holds at most ${POOL_MAX_PER_MONTH} verses.`,
        400,
        'VALIDATION_ERROR'
      );
    }

    const cleanVerses: ValidatedVerse[] = [];
    const seen = new Set<string>();
    for (const item of verses as Array<Record<string, unknown>>) {
      const referenceEn = String(item?.referenceEn || '').trim();
      const referenceVi = String(item?.referenceVi || '').trim();
      if (!referenceEn || !referenceVi) {
        throw new AppError(
          'Mỗi câu cần có câu Kinh Thánh bằng tiếng Việt và tiếng Anh. / Every verse needs a Vietnamese and English reference.',
          400,
          'VALIDATION_ERROR'
        );
      }
      const normalized = referenceEn.toLowerCase().replace(/\s+/g, '');
      if (seen.has(normalized)) {
        throw new AppError(
          `Câu "${referenceEn}" bị trùng trong tệp. / Duplicate reference "${referenceEn}" in the file.`,
          400,
          'VALIDATION_ERROR'
        );
      }
      seen.add(normalized);
      cleanVerses.push({
        reference: String(item?.reference || referenceEn).trim(),
        referenceEn,
        referenceVi,
        reflection: String(item?.reflection || item?.reflectionEn || '').trim(),
        reflectionEn: String(item?.reflectionEn || item?.reflection || '').trim(),
        reflectionVi: String(item?.reflectionVi || item?.reflection || '').trim(),
        prayer: item?.prayer ? String(item.prayer).trim() : null,
        prayerEn: item?.prayerEn ? String(item.prayerEn).trim() : null,
        prayerVi: item?.prayerVi ? String(item.prayerVi).trim() : null,
      });
    }

    const monthCondition =
      month === currentVerseMonth()
        ? or(eq(versePool.month, month), isNull(versePool.month))
        : eq(versePool.month, month);
    const existingRows = await db
      .select({ value: count() })
      .from(versePool)
      .where(monthCondition);
    const existingCount = existingRows[0]?.value ?? 0;

    if (existingCount > 0 && replace !== true) {
      return res.status(409).json({ needsReplace: true, existingCount, month });
    }

    const actorName = req.adminUser?.displayName || req.adminUser?.username || 'Admin';
    if (replace === true && existingCount > 0) {
      await db.delete(versePool).where(monthCondition);
    }

    await db.insert(versePool).values(
      cleanVerses.map((verse) => ({
        reference: verse.referenceEn,
        referenceVi: verse.referenceVi,
        referenceEn: verse.referenceEn,
        reflection: verse.reflection || null,
        reflectionVi: verse.reflectionVi || null,
        reflectionEn: verse.reflectionEn || null,
        prayer: verse.prayer,
        prayerVi: verse.prayerVi,
        prayerEn: verse.prayerEn,
        month,
        source: 'upload',
        createdBy: actorName,
        updatedBy: actorName,
      }))
    );

    // Clean up old history now that a new month's verses are in.
    await pruneOldVerseHistory();

    res.status(201).json({ imported: cleanVerses.length, month });
  } catch (error: any) {
    next(error);
  }
});

export default router;
