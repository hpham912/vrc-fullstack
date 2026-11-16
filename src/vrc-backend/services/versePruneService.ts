// Monthly verse history prune — keep only the current month and
// the previous month. Daily history older than the previous month is
// deleted from daily_verses, and pool verses for months before the
// current month are deleted from verse_pool (they can never be
// picked — the daily pick draws only from the current month).
// So when May is the current month, April's history is kept and
// March and everything before it is deleted.
//
// The prune is cheap and idempotent (it deletes zero rows most days).
// It runs when the daily pick starts a new month (the 1st) and after
// a monthly upload is imported. The member history view is always
// filtered to the current + previous month, so even before the prune
// runs, older months are never shown.

import { db } from '../../vrc-db/index.ts';
import { dailyVerses, versePool } from '../../vrc-db/schema.ts';
import { lt, sql } from 'drizzle-orm';

// The current month (YYYY-MM) in Phoenix time — the same clock the
// verse-day uses.
export function currentVerseMonth(): string {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Phoenix' }));
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

// The previous month (YYYY-MM), e.g. '2026-04' when now is May 2026.
export function previousVerseMonth(month: string): string {
  const [yearText, monthText] = month.split('-');
  const year = Number(yearText);
  const monthNumber = Number(monthText);
  if (!year || !monthNumber) return month;
  const date = new Date(year, monthNumber - 2, 1);
  const prevYear = date.getFullYear();
  const prevMonth = String(date.getMonth() + 1).padStart(2, '0');
  return `${prevYear}-${prevMonth}`;
}

export async function pruneOldVerseHistory(): Promise<{
  deletedDailyVerses: number;
  deletedPoolVerses: number;
}> {
  const currentMonth = currentVerseMonth();
  const previousMonth = previousVerseMonth(currentMonth);
  // Daily history: keep the current + previous month. A daily row's
  // date is YYYY-MM-DD, so "older than the previous month" is any
  // date before YYYY-MM-01 of the previous month.
  const cutoffDate = `${previousMonth}-01`;
  const deletedDaily = await db
    .delete(dailyVerses)
    .where(lt(dailyVerses.date, cutoffDate))
    .returning({ id: dailyVerses.id });
  // Pool: keep the current month and any future month (uploaded
  // ahead). Past months' unpicked verses can never be picked.
  const deletedPool = await db
    .delete(versePool)
    .where(sql`${versePool.month} IS NOT NULL AND ${versePool.month} < ${currentMonth}`)
    .returning({ id: versePool.id });
  return {
    deletedDailyVerses: deletedDaily.length,
    deletedPoolVerses: deletedPool.length,
  };
}
