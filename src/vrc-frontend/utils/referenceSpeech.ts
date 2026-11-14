import type { Language } from '../context/LanguageContext.tsx';

// Normalize a book name for comparison: lowercase, strip diacritics
// ("Áp-đia" -> "apdia", "Phi-lê-môn" -> "philemon"), drop spaces
// and hyphens. "đ" is its own letter (not a "d" with a mark), so it
// is replaced explicitly. This makes the single-chapter check
// tolerant of spelling variants in the reference.
function normalizeBookKey(book: string): string {
  return book
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[\s-]/g, '');
}

// Books with exactly one chapter (verified against the live Bible
// API chapter counts: Obad 1, Phlm 1, 2John 1, 3John 1, Jude 1).
// A reference like "Giu-đe 5" (no colon) means verse 5 for these
// books, not chapter 5. Keys are normalized book names, including
// the leading number for 2/3 John.
const SINGLE_CHAPTER_BOOK_KEYS = new Set([
  'obadiah',
  'apdia',
  'obadia',
  'philemon',
  'jude',
  'giude',
  '2john',
  '2giang',
  '3john',
  '3giang',
]);

// True when the book has a single chapter, so a bare "Book N"
// reference is a verse, not a chapter.
function isSingleChapterBook(book: string): boolean {
  return SINGLE_CHAPTER_BOOK_KEYS.has(normalizeBookKey(book));
}

// Ordinal word for a leading book number (1, 2, 3).
// Vietnamese puts the ordinal AFTER the book name
// ("Cô-rinh-tô thứ nhất"); English puts it BEFORE
// ("First Corinthians").
function ordinalWord(num: string, language: Language): string {
  if (language === 'vi') {
    if (num === '1') return 'thứ nhất';
    if (num === '2') return 'thứ nhì';
    if (num === '3') return 'thứ ba';
  } else {
    if (num === '1') return 'First';
    if (num === '2') return 'Second';
    if (num === '3') return 'Third';
  }
  return num;
}

// Split a leading book number from the book name. Handles an Arabic
// numeral ("1 Cô-rinh-tô", "2 Giăng") and a Roman numeral
// ("I Cô-rinh-tô", "II Giăng", "III Giăng"). Returns [number, rest],
// or [null, book] when the book has no leading number.
function splitLeadingNumber(book: string): [string | null, string] {
  const arabic = book.match(/^([123])\s+(.+)$/);
  if (arabic) {
    return [arabic[1], arabic[2]];
  }
  const roman = book.match(/^(I{1,3})\s+(.+)$/i);
  if (roman) {
    const romanToArabic: Record<string, string> = { I: '1', II: '2', III: '3' };
    const num = romanToArabic[roman[1].toUpperCase()];
    if (num) {
      return [num, roman[2]];
    }
  }
  return [null, book];
}

// Format a book name for speech, converting a leading number to an
// ordinal word ("1 Cô-rinh-tô" -> "Cô-rinh-tô thứ nhất" /
// "First Corinthians"). A book with no leading number is unchanged.
function formatBookForSpeech(book: string, language: Language): string {
  const [num, rest] = splitLeadingNumber(book);
  if (!num) {
    return book;
  }
  const ordinal = ordinalWord(num, language);
  if (language === 'vi') {
    return `${rest} ${ordinal}`;
  }
  return `${ordinal} ${rest}`;
}

// Convert a display reference into spoken words, so the read-aloud
// voice says it the way people say it instead of reading the
// punctuation literally ("Giăng 3:16" would otherwise be read as
// "Giăng ba chấm mười sáu", and "1 Cô-rinh-tô" as "một Cô-rinh-tô").
//
// Vietnamese: "Giăng 3:16" -> "Giăng đoạn 3 câu 16"
//             "1 Cô-rinh-tô 13:4" -> "Cô-rinh-tô thứ nhất đoạn 13 câu 4"
// English:    "John 3:16"  -> "John chapter 3 verse 16"
//             "1 Corinthians 13:4" -> "First Corinthians chapter 13 verse 4"
// Ranges: "Giăng 3:16-18" -> "Giăng đoạn 3 câu 16 đến 18" /
//          "John chapter 3 verses 16 to 18"
// Chapter only: "Thi Thiên 23" -> "Thi Thiên đoạn 23" /
//          "Psalm chapter 23"
// A reference that does not match these shapes (e.g. a range that
// spans chapters) is returned unchanged.
export function formatReferenceForSpeech(
  reference: string,
  language: Language,
): string {
  const trimmed = (reference || '').trim();
  if (!trimmed) {
    return trimmed;
  }

  // "Book Chapter:Verse" or "Book Chapter:Start-End"
  const verseMatch = trimmed.match(/^(.*?)\s+(\d+):(\d+)(?:-(\d+))?$/);
  if (verseMatch) {
    const book = formatBookForSpeech(verseMatch[1].trim(), language);
    const chapter = verseMatch[2];
    const verseStart = verseMatch[3];
    const verseEnd = verseMatch[4];
    if (language === 'vi') {
      if (verseEnd) {
        return `${book} đoạn ${chapter} câu ${verseStart} đến ${verseEnd}`;
      }
      return `${book} đoạn ${chapter} câu ${verseStart}`;
    }
    if (verseEnd) {
      return `${book} chapter ${chapter} verses ${verseStart} to ${verseEnd}`;
    }
    return `${book} chapter ${chapter} verse ${verseStart}`;
  }

  // "Book Chapter" (no verse) — or "Book Verse" for a single-chapter
  // book (e.g. "Giu-đe 5" means Jude verse 5, not chapter 5).
  const chapterMatch = trimmed.match(/^(.*?)\s+(\d+)$/);
  if (chapterMatch) {
    const rawBook = chapterMatch[1].trim();
    const book = formatBookForSpeech(rawBook, language);
    const number = chapterMatch[2];
    if (isSingleChapterBook(rawBook)) {
      if (language === 'vi') {
        return `${book} câu ${number}`;
      }
      return `${book} verse ${number}`;
    }
    if (language === 'vi') {
      return `${book} đoạn ${number}`;
    }
    return `${book} chapter ${number}`;
  }

  return trimmed;
}
