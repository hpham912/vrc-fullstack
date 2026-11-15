// The verse-day for the Scripture Pool: the "day" runs 6:00 AM to
// 6:00 AM Phoenix time (America/Phoenix, UTC-7, no DST). The verse-day
// date is the Phoenix date of the most recent 6:00 AM — before 6 AM
// Phoenix it is still yesterday's date; at/after 6 AM it is today's
// date. Computed with Intl and the IANA timezone name, never a
// hardcoded UTC-7 offset.

export function getVerseDayString(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Phoenix',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
  }).formatToParts(now);
  const getPart = (type: string): string =>
    parts.find((part) => part.type === type)?.value || '';
  const year = Number(getPart('year'));
  const month = Number(getPart('month'));
  const day = Number(getPart('day'));
  // Intl with hour12:false can return 24 for midnight — normalize it.
  let hour = Number(getPart('hour'));
  if (hour === 24) hour = 0;

  // Before 6 AM Phoenix, the verse-day is still yesterday.
  const verseDate = new Date(Date.UTC(year, month - 1, day));
  if (hour < 6) verseDate.setUTCDate(verseDate.getUTCDate() - 1);

  const verseYear = verseDate.getUTCFullYear();
  const verseMonth = String(verseDate.getUTCMonth() + 1).padStart(2, '0');
  const verseDay = String(verseDate.getUTCDate()).padStart(2, '0');
  return `${verseYear}-${verseMonth}-${verseDay}`;
}
