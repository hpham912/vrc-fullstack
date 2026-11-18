import React from 'react';
import { TextField } from '../text-field/TextField.tsx';
import { textFieldStyles } from '../text-field/TextField.styles.ts';
import { datePickerStyles } from './DatePicker.styles.ts';

// 'date' is a calendar day; 'datetime' is a day plus a time, in the
// same component — the time is an option, not a second component.
export type DatePickerMode = 'date' | 'datetime';

export interface DatePickerProps {
  label?: string;
  mode?: DatePickerMode;
  // 'date': a "YYYY-MM-DD" string (or null when empty).
  // 'datetime': an ISO string (or null when empty). The component
  // converts it to the device's local time for the native picker and
  // back to ISO on change, so 9:00 AM stays 9:00 AM Phoenix no matter
  // what timezone the server runs in.
  value: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
  error?: string;
  required?: boolean;
  id?: string;
  // Bounds in the same shape as `value` (ISO for datetime,
  // "YYYY-MM-DD" for date). In datetime mode the bound applies to the
  // date half — the native picker greys out earlier days; an earlier
  // time on the same day is the form's own validation, which already
  // shows the error and disables Save.
  min?: string | null;
  max?: string | null;
  // Visible label for the time field in datetime mode (same
  // language as `label`; the caller owns the copy).
  timeLabel?: string;
}

const pad = (value: number) => String(value).padStart(2, '0');

// ISO → the local date part "YYYY-MM-DD" a date input holds. Empty
// or unparseable stays empty.
const toDatePart = (iso: string | null | undefined): string => {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

// ISO → the local time part "HH:mm" a time input holds. Empty or
// unparseable stays empty.
const toTimePart = (iso: string | null | undefined): string => {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

// Today's local date part, for a time picked before any date —
// picking a time on its own means today, the same as a native
// datetime picker that starts on the current day.
const todayDatePart = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

// Date + time parts back to one ISO string. Both empty stays null;
// a date with no time means the start of that day (00:00).
const combineDateTime = (datePart: string, timePart: string): string | null => {
  if (!datePart && !timePart) return null;
  const date = new Date(`${datePart || todayDatePart()}T${timePart || '00:00'}`);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
};

// Shared DatePicker: one component for a date, with time as an
// option. It is the shared TextField with a native date/time input
// inside — no calendar library, so iOS shows the iOS picker,
// Android the Android one, and desktop the browser's. The label,
// error, and dark mode all come from TextField, so the picker can
// never drift away from the other form fields.
//
// Datetime mode is TWO fields, not one datetime-local input: iOS
// renders datetime-local as one long string ("Nov 17, 2026 at 9:32
// PM") that overflows a narrow admin form and makes the whole modal
// sway sideways when scrolling. A date field ("Nov 17, 2026") plus
// a time field ("9:32 PM") are both short native fields, the same
// look as the Events tab's date field, and each one fits. The pair
// still takes and returns one ISO string, so callers do not change.
//
// The two fields are STACKED, each full width, each with its own
// visible label. They used to sit side by side and failed twice on
// iOS: the flex gap rendered as 0 so the boxes touched, then an
// explicit margin + fixed time width did not take effect live, so
// the time box overlapped the date box. Stacked full-width fields
// need no flex sizing at all, and match every other field in the
// admin forms. Do not put them side by side again.
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
  timeLabel,
}) => {
  const isDatetime = mode === 'datetime';
  const inputValue = value ?? '';
  const datePart = isDatetime ? toDatePart(value) : value ?? '';
  const timePart = isDatetime ? toTimePart(value) : '';
  const dateMin = isDatetime ? toDatePart(min) : min ?? undefined;
  const dateMax = isDatetime ? toDatePart(max) : max ?? undefined;

  if (isDatetime) {
    return (
      <div className={datePickerStyles.datetimeStack}>
        <TextField
          label={label}
          type="date"
          value={datePart}
          onChange={(next) =>
            onChange(next === '' ? null : combineDateTime(next, timePart))
          }
          disabled={disabled}
          required={required}
          id={id}
          min={dateMin || undefined}
          max={dateMax || undefined}
        />
        <TextField
          label={timeLabel}
          type="time"
          value={timePart}
          onChange={(next) => onChange(combineDateTime(datePart, next))}
          disabled={disabled}
          id={id ? `${id}-time` : undefined}
        />
        {error && <span className={textFieldStyles.error}>{error}</span>}
      </div>
    );
  }

  return (
    <div className={datePickerStyles.container}>
      <TextField
        label={label}
        type="date"
        value={inputValue}
        onChange={(next) => {
          onChange(next === '' ? null : next);
        }}
        disabled={disabled}
        error={error}
        required={required}
        id={id}
        min={min ?? undefined}
        max={max ?? undefined}
      />
    </div>
  );
};
