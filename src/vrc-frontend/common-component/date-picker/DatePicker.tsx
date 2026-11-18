import React, { useId, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { Modal } from '../modal/Modal.tsx';
import { Button } from '../button/Button.tsx';
import { textFieldStyles } from '../text-field/TextField.styles.ts';
import { datePickerStyles as s } from './DatePicker.styles.ts';

// 'date' is a calendar day; 'datetime' is a day plus a time, in the
// same component — the time is an option, not a second component.
export type DatePickerMode = 'date' | 'datetime';

export interface DatePickerProps {
  label?: string;
  mode?: DatePickerMode;
  // 'date': a "YYYY-MM-DD" string (or null when empty).
  // 'datetime': an ISO string (or null when empty). The component
  // converts it to the device's local time for the picker and back
  // to ISO on change, so 9:00 AM stays 9:00 AM Phoenix no matter
  // what timezone the server runs in.
  value: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
  error?: string;
  required?: boolean;
  id?: string;
  // Bounds in the same shape as `value` (ISO for datetime,
  // "YYYY-MM-DD" for date). Days outside the bounds are greyed out
  // and untappable; in datetime mode the time selects on the bound
  // day also grey out the hours and minutes past the bound. An
  // earlier time on the same day is still the caller's own
  // validation, which shows the error and disables Save.
  min?: string | null;
  max?: string | null;
  // Let the picker empty the field: a Clear button appears in the
  // calendar footer and sends onChange(null). Only for fields whose
  // empty value means something — the announcement Start ("from
  // now") and End ("shows until turned off"). Dates a form requires
  // (event date, video date) omit it, so they can never be emptied.
  allowClear?: boolean;
}

const pad = (value: number) => String(value).padStart(2, '0');

// A local date → its "YYYY-MM-DD" day key. Never through UTC, so
// the day never shifts by timezone.
export const toDayKey = (date: Date): string =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

// A "YYYY-MM-DD" key → the local midnight date. Null when the key
// is not a real day.
export const parseDayKey = (key: string): Date | null => {
  const [year, month, day] = key.split('-').map(Number);
  if (!year || !month || !day || month > 12 || day > 31) return null;
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) || toDayKey(date) !== key ? null : date;
};

// A value in either shape (ISO for datetime, "YYYY-MM-DD" for
// date) → its day key plus minutes since midnight (null for date
// mode, where there is no time). Null or unparseable stays null.
export const splitValue = (
  value: string | null,
  mode: DatePickerMode,
): { dayKey: string | null; minutes: number | null } => {
  if (!value) return { dayKey: null, minutes: null };
  if (mode === 'date') {
    const day = parseDayKey(value);
    return { dayKey: day ? toDayKey(day) : null, minutes: null };
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { dayKey: null, minutes: null };
  return { dayKey: toDayKey(date), minutes: date.getHours() * 60 + date.getMinutes() };
};

// A day key plus minutes since midnight → one ISO string, parsed
// as local time so 10:57 AM stays 10:57 AM Phoenix. Null when the
// day is not real.
export const dayMinutesToIso = (dayKey: string, minutes: number): string | null => {
  const day = parseDayKey(dayKey);
  if (!day) return null;
  day.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return day.toISOString();
};

// The calendar grid for one month: six Monday-first weeks of seven
// days. Days outside the month are included (muted, untappable) so
// every week is full and the modal never changes height.
export interface CalendarDay {
  date: Date;
  dayKey: string;
  inMonth: boolean;
}

export const buildCalendarWeeks = (year: number, month: number): CalendarDay[][] => {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7; // Monday-first: Sunday lands last.
  const start = new Date(year, month, 1 - offset);
  const weeks: CalendarDay[][] = [];
  for (let week = 0; week < 6; week++) {
    const days: CalendarDay[] = [];
    for (let day = 0; day < 7; day++) {
      const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + week * 7 + day);
      days.push({ date, dayKey: toDayKey(date), inMonth: date.getMonth() === month });
    }
    weeks.push(days);
  }
  return weeks;
};

// 24-hour hour ↔ 12-hour hour + AM/PM. Midnight is 12 AM, noon 12 PM.
export const hour24To12 = (hour24: number): { hour12: number; ampm: 'AM' | 'PM' } => ({
  hour12: hour24 % 12 === 0 ? 12 : hour24 % 12,
  ampm: hour24 < 12 ? 'AM' : 'PM',
});

export const hour12To24 = (hour12: number, ampm: 'AM' | 'PM'): number =>
  (hour12 % 12) + (ampm === 'PM' ? 12 : 0);

// Clamp minutes-since-midnight into the bound day's window (a null
// bound is no bound). Used when the picked day or the AM/PM flip
// lands the draft time outside the allowed range.
export const clampMinutes = (
  minutes: number,
  minMinutes: number | null,
  maxMinutes: number | null,
): number => {
  if (minMinutes != null && minutes < minMinutes) return minMinutes;
  if (maxMinutes != null && minutes > maxMinutes) return maxMinutes;
  return minutes;
};

// Is a whole hour unpickable on the bound day — every minute in it
// is outside the window?
export const isHourDisabled = (
  hour24: number,
  minMinutes: number | null,
  maxMinutes: number | null,
): boolean => {
  if (minMinutes != null && hour24 * 60 + 59 < minMinutes) return true;
  if (maxMinutes != null && hour24 * 60 > maxMinutes) return true;
  return false;
};

// Is one minute unpickable at the given hour on the bound day?
export const isMinuteDisabled = (
  hour24: number,
  minute: number,
  minMinutes: number | null,
  maxMinutes: number | null,
): boolean => {
  const total = hour24 * 60 + minute;
  if (minMinutes != null && total < minMinutes) return true;
  if (maxMinutes != null && total > maxMinutes) return true;
  return false;
};

// A "YYYY-MM-DD" day, formatted in the app language ("18 thg 11,
// 2026" in Vietnamese). Parsed as a local date, never through UTC.
// Empty or unparseable stays empty.
const formatDateDisplay = (value: string | null, locale: string): string => {
  if (!value) return '';
  const day = parseDayKey(value);
  if (!day) return '';
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(day);
};

// An ISO string, formatted in the app language ("18 thg 11, 2026
// lúc 10:57" in Vietnamese, "Nov 18, 2026 at 10:57 AM" in
// English). Built from a medium date plus a short time so the date
// always comes first in both languages — the combined
// dateStyle+timeStyle format puts the time first in Vietnamese.
// Empty or unparseable stays empty.
const formatDatetimeDisplay = (iso: string | null, locale: string, at: string): string => {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const day = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date);
  const time = new Intl.DateTimeFormat(locale, { timeStyle: 'short' }).format(date);
  return `${day} ${at} ${time}`;
};

// The picker itself: the month grid, the time selects (datetime
// mode), and the footer. Kept separate from the field so it can be
// rendered on its own in tests. The draft lives in the parent —
// this panel only reports picks, and Done/Cancel decide whether
// they reach the form.
interface CalendarPanelProps {
  mode: DatePickerMode;
  viewYear: number;
  viewMonth: number; // 0-11
  onViewChange: (year: number, month: number) => void;
  draftDayKey: string | null;
  onSelectDay: (dayKey: string) => void;
  draftHour24: number;
  draftMinute: number;
  onTimeChange: (hour24: number, minute: number) => void;
  minDayKey: string | null;
  maxDayKey: string | null;
  // Time bounds for the draft day only (null when the draft day has
  // no bound): minutes since midnight.
  minMinutes: number | null;
  maxMinutes: number | null;
  onDone: () => void;
  onCancel: () => void;
  // Empty the field: when provided, a Clear button appears in the
  // footer next to Today. The parent closes the picker and sends
  // onChange(null).
  onClear?: () => void;
  // Id prefix for the time selects, so two pickers on one form
  // never share an id.
  idPrefix: string;
}

export const CalendarPanel: React.FC<CalendarPanelProps> = ({
  mode,
  viewYear,
  viewMonth,
  onViewChange,
  draftDayKey,
  onSelectDay,
  draftHour24,
  draftMinute,
  onTimeChange,
  minDayKey,
  maxDayKey,
  minMinutes,
  maxMinutes,
  onDone,
  onCancel,
  onClear,
  idPrefix,
}) => {
  const { language, t } = useLanguage();
  const locale = language === 'vi' ? 'vi-VN' : 'en-US';
  const isDatetime = mode === 'datetime';
  const isVietnamese = language === 'vi';

  const monthLabel = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(
    new Date(viewYear, viewMonth, 1),
  );
  // Monday-first weekday headers, from a known Monday-to-Sunday
  // week: "T2 T3 T4 T5 T6 T7 CN" in Vietnamese, "M T W T F S S".
  const weekdayNames = Array.from({ length: 7 }, (_, index) =>
    new Intl.DateTimeFormat(locale, { weekday: 'narrow' }).format(new Date(2026, 10, 2 + index)),
  );
  const weeks = buildCalendarWeeks(viewYear, viewMonth);
  const todayKey = toDayKey(new Date());

  const shiftMonth = (delta: number) => {
    const date = new Date(viewYear, viewMonth + delta, 1);
    onViewChange(date.getFullYear(), date.getMonth());
  };
  const goToday = () => {
    const now = new Date();
    onViewChange(now.getFullYear(), now.getMonth());
  };

  // The hour the selects show. Vietnamese uses 24 hours (the
  // display reads "22:57"); English uses 12 hours + AM/PM.
  const { hour12, ampm } = hour24To12(draftHour24);
  const hourOptions = isVietnamese
    ? Array.from({ length: 24 }, (_, hour) => hour)
    : Array.from({ length: 12 }, (_, index) => index + 1);

  return (
    <div className={s.panel}>
      <div className={s.monthHeader}>
        <button
          type="button"
          onClick={() => shiftMonth(-1)}
          className={s.navButton}
          aria-label={t('datePickerPrevMonth')}
        >
          <ChevronLeft className={s.navIcon} />
        </button>
        <span className={s.monthLabel}>{monthLabel}</span>
        <button
          type="button"
          onClick={() => shiftMonth(1)}
          className={s.navButton}
          aria-label={t('datePickerNextMonth')}
        >
          <ChevronRight className={s.navIcon} />
        </button>
      </div>

      <div className={s.weekdayRow}>
        {weekdayNames.map((name, index) => (
          <span key={index} className={s.weekdayCell}>
            {name}
          </span>
        ))}
      </div>
      <div className={s.dayGrid}>
        {weeks.flat().map((cell) => {
          const isSelected = cell.dayKey === draftDayKey;
          const isToday = cell.dayKey === todayKey;
          const isDisabled =
            !cell.inMonth ||
            (minDayKey != null && cell.dayKey < minDayKey) ||
            (maxDayKey != null && cell.dayKey > maxDayKey);
          const dayClass = isDisabled
            ? s.dayDisabled
            : isSelected
              ? s.daySelected
              : isToday
                ? s.dayToday
                : s.dayDefault;
          return (
            <button
              key={cell.dayKey}
              type="button"
              disabled={isDisabled}
              onClick={() => onSelectDay(cell.dayKey)}
              className={`${s.dayCell} ${dayClass}`}
              aria-label={new Intl.DateTimeFormat(locale, { dateStyle: 'full' }).format(cell.date)}
              aria-pressed={isSelected}
            >
              {cell.date.getDate()}
            </button>
          );
        })}
      </div>

      {isDatetime && (
        <div className={s.timeRow}>
          <div className={s.timeField}>
            <label htmlFor={`${idPrefix}-hour`} className={textFieldStyles.label}>
              {t('datePickerHour')}
            </label>
            <select
              id={`${idPrefix}-hour`}
              value={isVietnamese ? draftHour24 : hour12}
              onChange={(e) => {
                const nextHour = isVietnamese
                  ? Number(e.target.value)
                  : hour12To24(Number(e.target.value), ampm);
                onTimeChange(nextHour, draftMinute);
              }}
              className={s.timeSelect}
            >
              {hourOptions.map((hour) => {
                const hour24 = isVietnamese ? hour : hour12To24(hour, ampm);
                return (
                  <option key={hour} value={hour} disabled={isHourDisabled(hour24, minMinutes, maxMinutes)}>
                    {pad(hour)}
                  </option>
                );
              })}
            </select>
          </div>
          <div className={s.timeField}>
            <label htmlFor={`${idPrefix}-minute`} className={textFieldStyles.label}>
              {t('datePickerMinute')}
            </label>
            <select
              id={`${idPrefix}-minute`}
              value={draftMinute}
              onChange={(e) => onTimeChange(draftHour24, Number(e.target.value))}
              className={s.timeSelect}
            >
              {Array.from({ length: 60 }, (_, minute) => (
                <option
                  key={minute}
                  value={minute}
                  disabled={isMinuteDisabled(draftHour24, minute, minMinutes, maxMinutes)}
                >
                  {pad(minute)}
                </option>
              ))}
            </select>
          </div>
          {!isVietnamese && (
            <div className={s.timeField}>
              {/* The meridiem marker, not translated copy — in
                  Vietnamese mode there is no AM/PM select at all. */}
              <label htmlFor={`${idPrefix}-ampm`} className={textFieldStyles.label}>
                AM/PM
              </label>
              <select
                id={`${idPrefix}-ampm`}
                value={ampm}
                onChange={(e) => onTimeChange(hour12To24(hour12, e.target.value as 'AM' | 'PM'), draftMinute)}
                className={s.timeSelect}
              >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </div>
          )}
        </div>
      )}

      <div className={s.footer}>
        <div className={s.footerLeft}>
          <Button variant="linkAmber" size="sm" onClick={goToday}>
            {t('datePickerToday')}
          </Button>
          {onClear && (
            <Button variant="linkAmber" size="sm" onClick={onClear}>
              {t('datePickerClear')}
            </Button>
          )}
        </div>
        <div className={s.footerActions}>
          <Button variant="secondary" onClick={onCancel}>
            {t('datePickerCancel')}
          </Button>
          <Button variant="primary" onClick={onDone} disabled={draftDayKey == null}>
            {t('datePickerDone')}
          </Button>
        </div>
      </div>
    </div>
  );
};

// Shared DatePicker: one component for a date, with time as an
// option. It is a fully custom picker — no native date input, no
// calendar library — so the whole thing follows the app language:
// the field, the month, the weekdays, and the time. A native date
// input renders in the device language no matter what the page
// says, and the iOS picker sheet that opens from it belongs to the
// OS; both were verified live 2026-11-18 (app in Vietnamese, field
// still "Nov 18, 2026 at 10:57 AM"). Tapping the field opens the
// shared Modal with a month calendar; datetime mode adds time
// selects below it (24 hours in Vietnamese, 12 hours + AM/PM in
// English, matching how each language displays the time). The pick
// is a draft until Done — closing the modal any other way discards
// it, so a cancelled pick never dirties the form.
export const DatePicker: React.FC<DatePickerProps> = ({
  label,
  mode = 'date',
  value,
  onChange,
  disabled = false,
  error,
  required = false,
  id,
  min,
  max,
  allowClear = false,
}) => {
  const { language, t } = useLanguage();
  const isDatetime = mode === 'datetime';
  const locale = language === 'vi' ? 'vi-VN' : 'en-US';
  // One id per picker instance, so the field and its time selects
  // never collide with another picker on the same form.
  const autoId = useId();
  const controlId = id ?? autoId;

  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth());
  const [draftDayKey, setDraftDayKey] = useState<string | null>(null);
  const [draftHour24, setDraftHour24] = useState(() => new Date().getHours());
  const [draftMinute, setDraftMinute] = useState(() => new Date().getMinutes());

  const displayValue = isDatetime
    ? formatDatetimeDisplay(value, locale, t('dateTimeAt'))
    : formatDateDisplay(value, locale);
  const placeholder = t(isDatetime ? 'dateTimePlaceholder' : 'datePlaceholder');

  const minBound = splitValue(min ?? null, mode);
  const maxBound = splitValue(max ?? null, mode);

  // Time bounds for one day: the bound's minutes, but only when the
  // day is the bound day — any other day has no time bound.
  const minutesForDay = (dayKey: string | null, bound: { dayKey: string | null; minutes: number | null }) =>
    dayKey != null && bound.dayKey === dayKey ? bound.minutes : null;
  const minMinutes = minutesForDay(draftDayKey, minBound);
  const maxMinutes = minutesForDay(draftDayKey, maxBound);

  const openPicker = () => {
    const now = new Date();
    const current = splitValue(value, mode);
    setDraftDayKey(current.dayKey);
    setDraftHour24(current.minutes != null ? Math.floor(current.minutes / 60) : now.getHours());
    setDraftMinute(current.minutes != null ? current.minutes % 60 : now.getMinutes());
    const viewDay = current.dayKey ? parseDayKey(current.dayKey) : null;
    setViewYear(viewDay ? viewDay.getFullYear() : now.getFullYear());
    setViewMonth(viewDay ? viewDay.getMonth() : now.getMonth());
    setOpen(true);
  };

  const selectDay = (dayKey: string) => {
    setDraftDayKey(dayKey);
    // A new day can land the draft time outside the bound day's
    // window — clamp it so Done can never emit an invalid time.
    const clamped = clampMinutes(
      draftHour24 * 60 + draftMinute,
      minutesForDay(dayKey, minBound),
      minutesForDay(dayKey, maxBound),
    );
    setDraftHour24(Math.floor(clamped / 60));
    setDraftMinute(clamped % 60);
  };

  const changeTime = (hour24: number, minute: number) => {
    const clamped = clampMinutes(hour24 * 60 + minute, minMinutes, maxMinutes);
    setDraftHour24(Math.floor(clamped / 60));
    setDraftMinute(clamped % 60);
  };

  const confirm = () => {
    if (draftDayKey == null) return;
    if (isDatetime) {
      const iso = dayMinutesToIso(draftDayKey, draftHour24 * 60 + draftMinute);
      if (iso) onChange(iso);
    } else {
      onChange(draftDayKey);
    }
    setOpen(false);
  };

  return (
    <div className={s.container}>
      {label && (
        <label htmlFor={controlId} className={textFieldStyles.label}>
          {label}
        </label>
      )}
      <button
        type="button"
        id={controlId}
        onClick={openPicker}
        disabled={disabled}
        aria-label={label}
        aria-required={required || undefined}
        className={s.fieldButton}
        style={
          isDatetime
            ? { width: 'fit-content', maxWidth: '100%', minWidth: 0 }
            : undefined
        }
      >
        <span className={displayValue ? s.fieldText : s.fieldPlaceholder}>
          {displayValue || placeholder}
        </span>
        <Calendar className={s.fieldIcon} />
      </button>
      {error && <span className={textFieldStyles.error}>{error}</span>}
      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title={label}
        icon={<Calendar className="h-5 w-5" />}
        zIndexClass="z-[120]"
      >
        <CalendarPanel
          mode={mode}
          viewYear={viewYear}
          viewMonth={viewMonth}
          onViewChange={(year, month) => {
            setViewYear(year);
            setViewMonth(month);
          }}
          draftDayKey={draftDayKey}
          onSelectDay={selectDay}
          draftHour24={draftHour24}
          draftMinute={draftMinute}
          onTimeChange={changeTime}
          minDayKey={minBound.dayKey}
          maxDayKey={maxBound.dayKey}
          minMinutes={minMinutes}
          maxMinutes={maxMinutes}
          onDone={confirm}
          onCancel={() => setOpen(false)}
          onClear={
            allowClear && value != null
              ? () => {
                  onChange(null);
                  setOpen(false);
                }
              : undefined
          }
          idPrefix={controlId}
        />
      </Modal>
    </div>
  );
};
