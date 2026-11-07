/**
 * Real bilingual scripture lookup.
 *
 * Provider: https://apibible.wbem.org — free, no API key.
 *  - English: NIV 2011 (`en/niv2011`) — matches the app's English default.
 *  - Vietnamese: Kinh Thánh 1925 (`vi/viet`) — the classic text most
 *    Vietnamese churches use, and the one verified correct on this provider.
 *
 * Do NOT use `vi/rvv11` (RVV11) on this provider: its data is globally
 * off-by-one chapter. Verified 2026-11-07:
 *  - Gen 1 -> 404, Gen 2 returns Gen 1, Ps 23 returns Ps 22,
 *    Rom 8 returns Rom 7, John 3 returns John 2.
 * Requesting chapter+1 would silently drop the last chapter of every book,
 * so RVV11 is unusable here. If RVV11 is ever needed, fetch it from a
 * different provider (e.g. HelloAO / Bolls) — never from apibible.
 *
 * The old implementation used bible-api.com (English-only) and then
 * machine-translated the English into Vietnamese. That is gone: both
 * languages now come from real Bible text, verse-for-verse.
 */

const API_BASE = 'https://apibible.wbem.org/api/bibles';
const FETCH_TIMEOUT_MS = 10_000;

export interface FetchScriptureResult {
  reference: string;
  referenceEn: string;
  referenceVi: string;
  /** Legacy single-text field: English text, kept for old callers. */
  verseText: string;
  verseTextEn: string;
  verseTextVi: string;
  /** Legacy single-translation field: English translation, kept for old callers. */
  translation: string;
  translationEn: string;
  translationVi: string;
}

interface BookInfo {
  en: string;
  vi: string;
  aliases: string[];
}

// Book order is canonical 1-66. `aliases` are matched after normalisation
// (lowercase, diacritics stripped, spaces/hyphens removed), so
// "Giăng", "giang", "1 Giăng", "1giang" and "1 John" all resolve.
const BOOKS: BookInfo[] = [
  { en: 'Genesis', vi: 'Sáng Thế Ký', aliases: ['gen', 'genesis'] },
  { en: 'Exodus', vi: 'Xuất Ê-díp-tô Ký', aliases: ['exod', 'exodus', 'ex'] },
  { en: 'Leviticus', vi: 'Lê-vi Ký', aliases: ['lev', 'leviticus'] },
  { en: 'Numbers', vi: 'Dân-số Ký', aliases: ['num', 'numbers'] },
  { en: 'Deuteronomy', vi: 'Phục-truyền Luật-lệ Ký', aliases: ['deut', 'deuteronomy'] },
  { en: 'Joshua', vi: 'Giô-suê', aliases: ['josh', 'joshua'] },
  { en: 'Judges', vi: 'Các Quan Xét', aliases: ['judg', 'judges'] },
  { en: 'Ruth', vi: 'Ru-tơ', aliases: ['ruth'] },
  { en: '1 Samuel', vi: '1 Sa-mu-ên', aliases: ['1sam', '1samuel'] },
  { en: '2 Samuel', vi: '2 Sa-mu-ên', aliases: ['2sam', '2samuel'] },
  { en: '1 Kings', vi: '1 Các Vua', aliases: ['1kgs', '1kings'] },
  { en: '2 Kings', vi: '2 Các Vua', aliases: ['2kgs', '2kings'] },
  { en: '1 Chronicles', vi: '1 Sử Ký', aliases: ['1chr', '1chronicles'] },
  { en: '2 Chronicles', vi: '2 Sử Ký', aliases: ['2chr', '2chronicles'] },
  { en: 'Ezra', vi: 'E-xơ-ra', aliases: ['ezra'] },
  { en: 'Nehemiah', vi: 'Nê-hê-mi', aliases: ['neh', 'nehemiah'] },
  { en: 'Esther', vi: 'Ê-xơ-tê', aliases: ['esth', 'esther'] },
  { en: 'Job', vi: 'Gióp', aliases: ['job'] },
  { en: 'Psalms', vi: 'Thi Thiên', aliases: ['ps', 'psa', 'psalm', 'psalms', 'thithien'] },
  { en: 'Proverbs', vi: 'Châm Ngôn', aliases: ['prov', 'proverbs'] },
  { en: 'Ecclesiastes', vi: 'Truyền Đạo', aliases: ['eccl', 'ecclesiastes'] },
  { en: 'Song of Solomon', vi: 'Nhã Ca', aliases: ['song', 'songofsolomon', 'sos'] },
  { en: 'Isaiah', vi: 'Ê-sai', aliases: ['isa', 'isaiah'] },
  { en: 'Jeremiah', vi: 'Giê-rê-mi', aliases: ['jer', 'jeremiah'] },
  { en: 'Lamentations', vi: 'Ca Thương', aliases: ['lam', 'lamentations'] },
  { en: 'Ezekiel', vi: 'Ê-xê-chi-ên', aliases: ['ezek', 'ezekiel'] },
  { en: 'Daniel', vi: 'Đa-ni-ên', aliases: ['dan', 'daniel'] },
  { en: 'Hosea', vi: 'Ô-sê', aliases: ['hos', 'hosea'] },
  { en: 'Joel', vi: 'Giô-ên', aliases: ['joel'] },
  { en: 'Amos', vi: 'A-mốt', aliases: ['amos'] },
  { en: 'Obadiah', vi: 'Áp-đia', aliases: ['obad', 'obadiah'] },
  { en: 'Jonah', vi: 'Giô-na', aliases: ['jonah'] },
  { en: 'Micah', vi: 'Mi-chê', aliases: ['mic', 'micah'] },
  { en: 'Nahum', vi: 'Na-hum', aliases: ['nah', 'nahum'] },
  { en: 'Habakkuk', vi: 'Ha-ba-cúc', aliases: ['hab', 'habakkuk'] },
  { en: 'Zephaniah', vi: 'Sô-phô-ni', aliases: ['zeph', 'zephaniah'] },
  { en: 'Haggai', vi: 'A-ghê', aliases: ['hag', 'haggai'] },
  { en: 'Zechariah', vi: 'Xa-cha-ri', aliases: ['zech', 'zechariah'] },
  { en: 'Malachi', vi: 'Ma-la-chi', aliases: ['mal', 'malachi'] },
  { en: 'Matthew', vi: 'Ma-thi-ơ', aliases: ['matt', 'mt', 'matthew'] },
  { en: 'Mark', vi: 'Mác', aliases: ['mark', 'mk'] },
  { en: 'Luke', vi: 'Lu-ca', aliases: ['luke', 'lk'] },
  { en: 'John', vi: 'Giăng', aliases: ['john', 'jn'] },
  { en: 'Acts', vi: 'Công Vụ', aliases: ['acts'] },
  { en: 'Romans', vi: 'Rô-ma', aliases: ['rom', 'romans'] },
  { en: '1 Corinthians', vi: '1 Cô-rinh-tô', aliases: ['1cor', '1corinthians'] },
  { en: '2 Corinthians', vi: '2 Cô-rinh-tô', aliases: ['2cor', '2corinthians'] },
  { en: 'Galatians', vi: 'Ga-la-ti', aliases: ['gal', 'galatians'] },
  { en: 'Ephesians', vi: 'Ê-phê-sô', aliases: ['eph', 'ephesians'] },
  { en: 'Philippians', vi: 'Phi-líp', aliases: ['phil', 'philippians'] },
  { en: 'Colossians', vi: 'Cô-lô-se', aliases: ['col', 'colossians'] },
  { en: '1 Thessalonians', vi: '1 Tê-sa-lô-ni-ca', aliases: ['1thess', '1thessalonians'] },
  { en: '2 Thessalonians', vi: '2 Tê-sa-lô-ni-ca', aliases: ['2thess', '2thessalonians'] },
  { en: '1 Timothy', vi: '1 Ti-mô-thê', aliases: ['1tim', '1timothy'] },
  { en: '2 Timothy', vi: '2 Ti-mô-thê', aliases: ['2tim', '2timothy'] },
  { en: 'Titus', vi: 'Tít', aliases: ['titus', 'tit'] },
  { en: 'Philemon', vi: 'Phi-lê-môn', aliases: ['phlm', 'philemon'] },
  { en: 'Hebrews', vi: 'Hê-bơ-rơ', aliases: ['heb', 'hebrews'] },
  { en: 'James', vi: 'Gia-cơ', aliases: ['jas', 'james'] },
  { en: '1 Peter', vi: '1 Phi-e-rơ', aliases: ['1pet', '1peter'] },
  { en: '2 Peter', vi: '2 Phi-e-rơ', aliases: ['2pet', '2peter'] },
  { en: '1 John', vi: '1 Giăng', aliases: ['1john', '1jn'] },
  { en: '2 John', vi: '2 Giăng', aliases: ['2john', '2jn'] },
  { en: '3 John', vi: '3 Giăng', aliases: ['3john', '3jn'] },
  { en: 'Jude', vi: 'Giu-đe', aliases: ['jude'] },
  { en: 'Revelation', vi: 'Khải Huyền', aliases: ['rev', 'revelation'] },
];

function normalizeKey(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

const BOOK_LOOKUP = new Map<string, number>();
BOOKS.forEach((book, index) => {
  const bookNumber = index + 1;
  BOOK_LOOKUP.set(normalizeKey(book.en), bookNumber);
  BOOK_LOOKUP.set(normalizeKey(book.vi), bookNumber);
  for (const alias of book.aliases) {
    BOOK_LOOKUP.set(normalizeKey(alias), bookNumber);
  }
});

interface ParsedPassage {
  bookNumber: number;
  chapter: number;
  verseStart?: number;
  verseEnd?: number | 'end';
}

function parsePassage(passage: string): ParsedPassage {
  const cleaned = passage.trim().replace(/\s+/g, ' ');
  // "John 3:16", "John 3:16-18", "Giăng 3:16", "Psalm 23", "Genesis 1"
  const match = cleaned.match(/^(.+?)\s+(\d+)(?:\s*:\s*(\d+)(?:\s*[-–—]\s*(\d+|end))?)?\s*$/i);
  if (!match) {
    throw new Error(
      `Could not understand "${passage}". Try e.g. "John 3:16" or "Giăng 3:16".`
    );
  }
  const [, bookName, chapterStr, verseStartStr, verseEndStr] = match;
  const bookNumber = BOOK_LOOKUP.get(normalizeKey(bookName));
  if (!bookNumber) {
    throw new Error(
      `Unknown book "${bookName}" in "${passage}". Try e.g. "John 3:16" or "Giăng 3:16".`
    );
  }
  const chapter = Number(chapterStr);
  const verseStart = verseStartStr ? Number(verseStartStr) : undefined;
  let verseEnd: number | 'end' | undefined;
  if (verseEndStr) {
    verseEnd = verseEndStr.toLowerCase() === 'end' ? 'end' : Number(verseEndStr);
  }
  if (verseStart !== undefined && verseEnd !== undefined && verseEnd !== 'end' && verseEnd < verseStart) {
    throw new Error(`Invalid verse range in "${passage}".`);
  }
  return { bookNumber, chapter, verseStart, verseEnd };
}

function cleanText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

async function fetchChapter(
  lang: 'en' | 'vi',
  code: string,
  bookNumber: number,
  chapter: number
): Promise<string[]> {
  const url = `${API_BASE}/${lang}/${code}/${bookNumber}/${chapter}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      throw new Error(`Bible API returned HTTP ${res.status} for ${url}`);
    }
    const data: unknown = await res.json();
    const verses = (data as { verses?: unknown })?.verses;
    if (!Array.isArray(verses) || verses.length === 0) {
      throw new Error(`No verses returned for that chapter.`);
    }
    return verses.map((v) => cleanText(String(v)));
  } finally {
    clearTimeout(timeout);
  }
}

function selectVerses(
  verses: string[],
  verseStart?: number,
  verseEnd?: number | 'end'
): string {
  if (verseStart === undefined) {
    return verses.join(' ');
  }
  const startIndex = verseStart - 1;
  if (startIndex < 0 || startIndex >= verses.length) {
    throw new Error(`Verse ${verseStart} does not exist in this chapter.`);
  }
  const endIndex =
    verseEnd === undefined
      ? startIndex
      : verseEnd === 'end'
        ? verses.length - 1
        : Math.min(verseEnd - 1, verses.length - 1);
  return verses.slice(startIndex, endIndex + 1).join(' ');
}

function formatReference(
  bookName: string,
  chapter: number,
  verseStart?: number,
  verseEnd?: number | 'end'
): string {
  if (verseStart === undefined) return `${bookName} ${chapter}`;
  if (verseEnd === undefined) return `${bookName} ${chapter}:${verseStart}`;
  if (verseEnd === 'end') return `${bookName} ${chapter}:${verseStart}-end`;
  return `${bookName} ${chapter}:${verseStart}-${verseEnd}`;
}

export const DevotionalService = {
  async fetchScripture(passage: string): Promise<FetchScriptureResult> {
    const parsed = parsePassage(passage);
    const book = BOOKS[parsed.bookNumber - 1];

    // Fetch both languages in parallel from the same provider so the
    // verse numbers always line up.
    const [versesEn, versesVi] = await Promise.all([
      fetchChapter('en', 'niv2011', parsed.bookNumber, parsed.chapter),
      fetchChapter('vi', 'viet', parsed.bookNumber, parsed.chapter),
    ]).catch((err: unknown) => {
      const message = err instanceof Error ? err.message : 'Bible lookup failed';
      throw new Error(
        `Scripture not found for "${passage}". ${message} Try e.g. "John 3:16" or "Giăng 3:16".`
      );
    });

    let verseTextEn: string;
    let verseTextVi: string;
    try {
      verseTextEn = selectVerses(versesEn, parsed.verseStart, parsed.verseEnd);
      verseTextVi = selectVerses(versesVi, parsed.verseStart, parsed.verseEnd);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid verse';
      throw new Error(`Scripture not found for "${passage}". ${message}`);
    }

    if (!verseTextEn || !verseTextVi) {
      throw new Error(`No verse text returned for "${passage}".`);
    }

    const referenceEn = formatReference(book.en, parsed.chapter, parsed.verseStart, parsed.verseEnd);
    const referenceVi = formatReference(book.vi, parsed.chapter, parsed.verseStart, parsed.verseEnd);

    return {
      reference: referenceEn,
      referenceEn,
      referenceVi,
      verseText: verseTextEn,
      verseTextEn,
      verseTextVi,
      translation: 'NIV',
      translationEn: 'NIV',
      // Actual text source is Kinh Thánh 1925, not RVV11 (see header note).
      translationVi: '1925',
    };
  },
};
