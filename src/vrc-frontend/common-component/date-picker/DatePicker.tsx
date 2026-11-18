import React from 'react';
import { TextField } from '../text-field/TextField.tsx';
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
}

const pad = (value: number) => String(value).padStart(2, '0');

// ISO → the local "YYYY-MM-DDTHH:mm" a datetime-local input holds.
// Empty or unparseable stays empty.
const toDatetimeLocal = (iso: string | null | undefined): string => {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

// A datetime-local value back to one ISO string. Empty stays null.
// The value parses as local time, so 10:25 AM stays 10:25 AM Phoenix
// no matter what timezone the server runs in.
const fromDatetimeLocal = (local: string): string | null => {
  if (!local) return null;
  const date = new Date(local);
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
// Datetime mode is ONE datetime-local input, not two fields. One
// tap opens the native sheet with the calendar and the time
// together, and the field shows the whole thing as one string
// ("Nov 18, 2026 at 10:25 AM"). The pair of separate date + time
// fields was tried twice and kept fighting the phone (the flex gap
// rendered as 0, then the margin + fixed width did not take effect
// live), and stacked they made the form too long on mobile.
//
// The field is sized to its content (fitContent), so it is only as
// wide as its string needs and never stretches past the modal:
// the long string is what made the single field look too wide
// before. `min`/`max` are full datetime-local values in this mode
// (an earlier time on the same day is still the caller's own
// validation, which shows the error and disables Save).
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
}) => {
  const isDatetime = mode === 'datetime';
  const inputValue = value ?? '';

  if (isDatetime) {
    return (
      <div className={datePickerStyles.container}>
        <TextField
          label={label}
          type="datetime-local"
          value={toDatetimeLocal(value)}
          onChange={(next) => onChange(fromDatetimeLocal(next))}
          disabled={disabled}
          error={error}
          required={required}
          id={id}
          min={toDatetimeLocal(min) || undefined}
          max={toDatetimeLocal(max) || undefined}
          fitContent
        />
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
