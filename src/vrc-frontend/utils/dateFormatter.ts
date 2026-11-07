/**
 * Date formatting utilities tailored for Vietnamese and English locales.
 * Enforces user requirements:
 * - Vietnamese: dd-mm-yyyy (e.g. 08-11-2026)
 * - English: mm-dd-yyyy (e.g. 11-08-2026)
 */

export const VI_WEEKDAYS = [
  'Chúa Nhật',
  'Thứ Hai',
  'Thứ Ba',
  'Thứ Tư',
  'Thứ Năm',
  'Thứ Sáu',
  'Thứ Bảy',
];

export const VI_WEEKDAYS_SHORT = [
  'CN',
  'T2',
  'T3',
  'T4',
  'T5',
  'T6',
  'T7',
];

export const EN_WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export const EN_WEEKDAYS_SHORT = [
  'Sun',
  'Mon',
  'Tue',
  'Wed',
  'Thu',
  'Fri',
  'Sat',
];

/**
 * Parses any date string or Date object safely into Date
 */
export const parseSafeDate = (input: string | Date | null | undefined): Date | null => {
  if (!input) return null;
  if (input instanceof Date) {
    return isNaN(input.getTime()) ? null : input;
  }
  if (typeof input === 'string') {
    const trimmed = input.trim();
    // YYYY-MM-DD
    const ymdMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (ymdMatch) {
      const year = parseInt(ymdMatch[1], 10);
      const month = parseInt(ymdMatch[2], 10) - 1;
      const day = parseInt(ymdMatch[3], 10);
      return new Date(year, month, day, 12, 0, 0);
    }
    const parsed = new Date(trimmed);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
};

/**
 * Formats date strictly according to locale:
 * - Vietnamese: dd-mm-yyyy (e.g., 08-11-2026)
 * - English: mm-dd-yyyy (e.g., 11-08-2026)
 */
export const formatDateLocale = (
  dateInput: string | Date | null | undefined,
  language: 'vi' | 'en' = 'vi'
): string => {
  if (!dateInput) return '';

  // Fast path for standard YYYY-MM-DD string
  if (typeof dateInput === 'string') {
    const ymdMatch = dateInput.trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (ymdMatch) {
      const yyyy = ymdMatch[1];
      const mm = ymdMatch[2].padStart(2, '0');
      const dd = ymdMatch[3].padStart(2, '0');
      return language === 'vi' ? `${dd}-${mm}-${yyyy}` : `${mm}-${dd}-${yyyy}`;
    }
  }

  const d = parseSafeDate(dateInput);
  if (!d) return typeof dateInput === 'string' ? dateInput : '';

  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = String(d.getFullYear());

  return language === 'vi' ? `${dd}-${mm}-${yyyy}` : `${mm}-${dd}-${yyyy}`;
};

/**
 * Returns full weekday name:
 * - Vietnamese: Chúa Nhật, Thứ Sáu, Thứ Bảy...
 * - English: Sunday, Friday, Saturday...
 */
export const getWeekdayName = (
  dateInput: string | Date | null | undefined,
  language: 'vi' | 'en' = 'vi'
): string => {
  const d = parseSafeDate(dateInput);
  if (!d) return '';
  const day = d.getDay();
  return language === 'vi' ? VI_WEEKDAYS[day] : EN_WEEKDAYS[day];
};

/**
 * Returns short weekday abbreviation:
 * - Vietnamese: CN, T6, T7...
 * - English: Sun, Fri, Sat...
 */
export const getWeekdayShort = (
  dateInput: string | Date | null | undefined,
  language: 'vi' | 'en' = 'vi'
): string => {
  const d = parseSafeDate(dateInput);
  if (!d) return '';
  const day = d.getDay();
  return language === 'vi' ? VI_WEEKDAYS_SHORT[day] : EN_WEEKDAYS_SHORT[day];
};

/**
 * Returns month text formatted for locale:
 * - Vietnamese: Tháng 11 (or Thg 11)
 * - English: Nov (or November)
 */
export const getMonthText = (
  dateInput: string | Date | null | undefined,
  language: 'vi' | 'en' = 'vi',
  short = true
): string => {
  const d = parseSafeDate(dateInput);
  if (!d) return '';
  const monthNum = d.getMonth() + 1;
  if (language === 'vi') {
    return short ? `Thg ${monthNum}` : `Tháng ${monthNum}`;
  }
  return d.toLocaleDateString('en-US', { month: short ? 'short' : 'long' });
};

/**
 * Returns day number string (padded or plain)
 */
export const getDayNumber = (dateInput: string | Date | null | undefined): string => {
  const d = parseSafeDate(dateInput);
  if (!d) return '';
  return String(d.getDate());
};

/**
 * Combined Weekday + Locale Date:
 * - Vietnamese: "Chúa Nhật, 08-11-2026"
 * - English: "Sunday, 11-08-2026"
 */
export const formatWeekdayAndDate = (
  dateInput: string | Date | null | undefined,
  language: 'vi' | 'en' = 'vi'
): string => {
  const weekday = getWeekdayName(dateInput, language);
  const formatted = formatDateLocale(dateInput, language);
  if (!weekday) return formatted;
  if (!formatted) return weekday;
  return `${weekday}, ${formatted}`;
};

/**
 * Format notification timestamp with date and time:
 * - Vietnamese: 08-11-2026 • 15:30
 * - English: 11-08-2026 • 3:30 PM
 */
export const formatNotificationDate = (
  dateInput: string | Date | null | undefined,
  language: 'vi' | 'en' = 'vi'
): string => {
  const d = parseSafeDate(dateInput);
  if (!d) return '';
  const dateFormatted = formatDateLocale(d, language);
  const timeFormatted = d.toLocaleTimeString(language === 'vi' ? 'vi-VN' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: language !== 'vi',
  });
  return `${dateFormatted} • ${timeFormatted}`;
};
