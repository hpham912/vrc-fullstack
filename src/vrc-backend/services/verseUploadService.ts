// Monthly verse upload — parse and validate a CSV / TXT / DOCX file
// into pool verses, WITHOUT importing anything. The upload endpoint
// calls this first (preview step); the confirm endpoint imports the
// returned verses only after the admin reviews them. All-or-nothing:
// if any row fails validation, the whole file is rejected with a
// per-row error list so the uploader can fix the file and re-upload.
//
// File format (one format, three file types): a 6-column table.
//   reference_en, reference_vi, reflection_en, reflection_vi,
//   prayer_en, prayer_vi
// One row is one verse for one day of the month. The two reference
// columns are REQUIRED; reflection and prayer are optional (empty is
// fine). A header row with those column names is optional — if the
// first row looks like a header it is skipped, otherwise every row
// is treated as a verse (fixed column order).
//   .csv — the table as a CSV file (build in Excel/Sheets, export).
//   .txt — the exact same CSV text in a .txt file.
//   .docx — the same 6-column table inside Word (read via mammoth);
//     if the document has no table, its text is parsed as CSV lines.
//
// Security: the file is parsed in memory only — never written to
// disk, never stored. A .docx is opened only by the Word parser,
// which reads its text; macros cannot run and it is never extracted
// as an archive. The caller (multer) already rejected archives and
// executables before this runs. Parsed text is trimmed and length-
// capped before it is returned, so nothing unbounded reaches the DB.

import { parse as parseCsvSync } from 'csv-parse/sync';
import mammoth from 'mammoth';
import { DevotionalService } from './devotionalService.ts';

export interface RawVerseRow {
  referenceEn: string;
  referenceVi: string;
  reflectionEn: string;
  reflectionVi: string;
  prayerEn: string;
  prayerVi: string;
  rowNumber: number;
}

export interface ValidatedVerse {
  reference: string;
  referenceEn: string;
  referenceVi: string;
  reflection: string;
  reflectionEn: string;
  reflectionVi: string;
  prayer: string | null;
  prayerEn: string | null;
  prayerVi: string | null;
}

export interface VerseRowError {
  row: number;
  message: string;
}

export interface VerseUploadWarning {
  code: 'fewer-than-days' | 'more-than-days';
  daysInMonth: number;
  count: number;
}

const MAX_TEXT_LENGTH = 5000;

function cleanText(value: unknown): string {
  const text = String(value ?? '').trim();
  return text.length > MAX_TEXT_LENGTH ? text.slice(0, MAX_TEXT_LENGTH) : text;
}

function normalizeReference(value: string): string {
  return value.toLowerCase().replace(/\s+/g, '');
}

function isHeaderRow(cells: string[]): boolean {
  const first = (cells[0] || '').trim().toLowerCase();
  return first === 'reference_en' || first === 'reference' || first.includes('reference_en');
}

function rowsFromCells(allRows: string[][]): RawVerseRow[] {
  const hasHeader = allRows.length > 0 && isHeaderRow(allRows[0]);
  const rows: RawVerseRow[] = [];
  allRows.forEach((cells, index) => {
    // The header row (if any) is row 1 and is skipped; every other
    // row keeps its real file row number so error messages point at
    // the right line.
    if (index === 0 && hasHeader) return;
    if (cells.every((cell) => !String(cell || '').trim())) return;
    rows.push({
      referenceEn: cleanText(cells[0]),
      referenceVi: cleanText(cells[1]),
      reflectionEn: cleanText(cells[2]),
      reflectionVi: cleanText(cells[3]),
      prayerEn: cleanText(cells[4]),
      prayerVi: cleanText(cells[5]),
      rowNumber: index + 1,
    });
  });
  return rows;
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'");
}

function stripTags(html: string): string {
  return decodeHtmlEntities(html.replace(/<[^>]*>/g, '')).trim();
}

// Extract the first <table> from mammoth's HTML output as rows of
// cell text. Returns null when there is no table (the caller then
// falls back to parsing the document's raw text as CSV lines).
function extractTableRows(html: string): string[][] | null {
  const tableMatch = html.match(/<table[^>]*>([\s\S]*?)<\/table>/i);
  if (!tableMatch) return null;
  const tableHtml = tableMatch[1];
  const rowMatches = [...tableHtml.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];
  const rows: string[][] = [];
  for (const rowMatch of rowMatches) {
    const cellMatches = [...rowMatch[1].matchAll(/<(?:td|th)[^>]*>([\s\S]*?)<\/(?:td|th)>/gi)];
    if (cellMatches.length === 0) continue;
    rows.push(cellMatches.map((cellMatch) => stripTags(cellMatch[1])));
  }
  return rows.length > 0 ? rows : null;
}

export function daysInMonth(month: string): number {
  const [yearText, monthText] = month.split('-');
  const year = Number(yearText);
  const monthNumber = Number(monthText);
  if (!year || !monthNumber || monthNumber < 1 || monthNumber > 12) return 0;
  // Day 0 of the next month is the last day of this month.
  return new Date(year, monthNumber, 0).getDate();
}

export async function parseVerseFile(
  buffer: Buffer,
  filename: string
): Promise<{ rows: RawVerseRow[]; errors: VerseRowError[] }> {
  const extension = filename.slice(filename.lastIndexOf('.')).toLowerCase();
  try {
    if (extension === '.docx') {
      const { value: html } = await mammoth.convertToHtml({ buffer });
      const tableRows = extractTableRows(html);
      if (tableRows) {
        return { rows: rowsFromCells(tableRows), errors: [] };
      }
      const { value: text } = await mammoth.extractRawText({ buffer });
      const records = parseCsvSync(text, {
        trim: true,
        skip_empty_lines: true,
        relax_column_count: true,
      }) as string[][];
      return { rows: rowsFromCells(records), errors: [] };
    }
    if (extension === '.csv' || extension === '.txt') {
      const text = buffer.toString('utf-8').replace(/^\uFEFF/, '');
      const records = parseCsvSync(text, {
        trim: true,
        skip_empty_lines: true,
        relax_column_count: true,
      }) as string[][];
      return { rows: rowsFromCells(records), errors: [] };
    }
    return {
      rows: [],
      errors: [{ row: 0, message: 'Loại tệp không được hỗ trợ. Hãy dùng .csv, .txt hoặc .docx. / Unsupported file type. Use .csv, .txt or .docx.' }],
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not read the file.';
    return {
      rows: [],
      errors: [{ row: 0, message: `Không đọc được tệp: ${message} / Could not parse the file: ${message}` }],
    };
  }
}

// Validate every row against the Bible API. All-or-nothing: the
// caller rejects the whole upload when errors is non-empty. Each
// reference is fetched (EN first, VI as fallback) so a bad reference
// is caught here instead of breaking a day's verse later. The stored
// references are the canonical ones from the API, and the provided
// Vietnamese reference must match the canonical one (same verse, both
// languages) or the row is an error.
export async function validateVerseRows(
  rows: RawVerseRow[],
  month: string
): Promise<{
  verses: ValidatedVerse[];
  errors: VerseRowError[];
  warnings: VerseUploadWarning[];
}> {
  const errors: VerseRowError[] = [];
  const warnings: VerseUploadWarning[] = [];
  const verses: ValidatedVerse[] = [];

  if (rows.length === 0) {
    errors.push({ row: 0, message: 'Tệp không có câu nào. Hãy thêm ít nhất một dòng câu. / The file has no verses. Add at least one verse row.' });
    return { verses, errors, warnings };
  }

  const seenReferences = new Set<string>();
  // Validate in small batches so a 30-verse file does not hammer the
  // Bible API with 30 parallel requests, but does not take 30
  // sequential round trips either.
  const BATCH_SIZE = 5;
  for (let start = 0; start < rows.length; start += BATCH_SIZE) {
    const batch = rows.slice(start, start + BATCH_SIZE);
    const results = await Promise.all(
      batch.map(async (row) => {
        if (!row.referenceEn && !row.referenceVi) {
          return {
            row,
            error: 'Thiếu câu Kinh Thánh. Hãy ghi câu Kinh Thánh bằng tiếng Anh và tiếng Việt. / Missing scripture reference. Provide the reference in English and Vietnamese.',
            verse: null as ValidatedVerse | null,
          };
        }
        if (!row.referenceEn || !row.referenceVi) {
          return {
            row,
            error: 'Hãy ghi câu Kinh Thánh bằng cả tiếng Anh và tiếng Việt. / Provide the reference in both English and Vietnamese.',
            verse: null as ValidatedVerse | null,
          };
        }
        const normalized = normalizeReference(row.referenceEn);
        if (seenReferences.has(normalized)) {
          return {
            row,
            error: `Câu "${row.referenceEn}" bị trùng — mỗi câu chỉ xuất hiện một lần trong tháng. / Duplicate reference "${row.referenceEn}" — each verse should appear once per month.`,
            verse: null as ValidatedVerse | null,
          };
        }
        seenReferences.add(normalized);
        try {
          const fetched = await DevotionalService.fetchScripture(row.referenceEn);
          const canonicalVi = normalizeReference(fetched.referenceVi || '');
          if (canonicalVi && canonicalVi !== normalizeReference(row.referenceVi)) {
            return {
              row,
              error: `Câu tiếng Việt "${row.referenceVi}" không khớp với câu tiếng Anh "${row.referenceEn}" (đúng ra là "${fetched.referenceVi}"). / The Vietnamese reference "${row.referenceVi}" does not match the English one "${row.referenceEn}" (expected "${fetched.referenceVi}").`,
              verse: null as ValidatedVerse | null,
            };
          }
          const reflectionEn = row.reflectionEn || row.reflectionVi || '';
          const reflectionVi = row.reflectionVi || row.reflectionEn || '';
          const prayerEn = row.prayerEn || null;
          const prayerVi = row.prayerVi || null;
          return {
            row,
            error: null as string | null,
            verse: {
              reference: fetched.referenceEn,
              referenceEn: fetched.referenceEn,
              referenceVi: fetched.referenceVi,
              reflection: reflectionEn,
              reflectionEn,
              reflectionVi,
              prayer: prayerEn,
              prayerEn,
              prayerVi,
            } as ValidatedVerse,
          };
        } catch {
          return {
            row,
            error: `Không tìm thấy câu "${row.referenceEn}". Hãy kiểm tra lại câu Kinh Thánh rồi thử lại. / Scripture not found for "${row.referenceEn}". Check the reference and try again.`,
            verse: null as ValidatedVerse | null,
          };
        }
      })
    );
    for (const result of results) {
      if (result.error) {
        errors.push({ row: result.row.rowNumber, message: result.error });
      } else if (result.verse) {
        verses.push(result.verse);
      }
    }
  }

  const days = daysInMonth(month);
  if (days > 0 && verses.length > 0 && verses.length !== days) {
    warnings.push({
      code: verses.length < days ? 'fewer-than-days' : 'more-than-days',
      daysInMonth: days,
      count: verses.length,
    });
  }

  return { verses, errors, warnings };
}
