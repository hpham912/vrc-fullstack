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
  // "YYYY-MM-DD" for date). The native picker greys out anything
  // outside them — e.g. an end field with min set to the start.
  min?: string | null;
  max?: string | null;
}

// ISO → the local "YYYY-MM-DDTHH:mm" string a datetime-local input
// holds. Empty or unparseable stays empty.
const toDatetimeLocalValue = (iso: string | null | undefined): string => {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
};

// A datetime-local value back to ISO. Empty stays null.
const fromDatetimeLocalValue = (local: string): string | null => {
  if (!local) return null;
  const date = new Date(local);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
};

// Shared DatePicker: one component for a date, with time as an
// option. It is the shared TextField with a native date/datetime
// input inside — no calendar library, so iOS shows the iOS picker,
// Android the Android one, and desktop the browser's. The label,
// error, and dark mode all come from TextField, so the picker can
// never drift away from the other form fields.
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
  const inputValue = isDatetime ? toDatetimeLocalValue(value) : value ?? '';
  const inputMin = isDatetime ? toDatetimeLocalValue(min) : min ?? undefined;
  const inputMax = isDatetime ? toDatetimeLocalValue(max) : max ?? undefined;

  return (
    <div className={datePickerStyles.container}>
      <TextField
        label={label}
        type={isDatetime ? 'datetime-local' : 'date'}
        value={inputValue}
        onChange={(next) => {
          if (isDatetime) {
            onChange(fromDatetimeLocalValue(next));
          } else {
            onChange(next === '' ? null : next);
          }
        }}
        disabled={disabled}
        error={error}
        required={required}
        id={id}
        min={inputMin}
        max={inputMax}
      />
    </div>
  );
};
