import React from 'react';
import { textFieldStyles } from './TextField.styles.ts';

export interface TextFieldProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  error?: string;
  // Optional leading icon (a lucide icon component) shown inside the
  // input on the left, e.g. icon={User}. Omit it and no icon renders —
  // the input is exactly as before. Single-line inputs only; ignored
  // for multiline.
  icon?: React.ComponentType<{ className?: string }>;
  required?: boolean;
  // Multiline mode renders a <textarea> instead of an <input> — same
  // look, same props. The pool form's reflection and prayer fields
  // use this; the reference field uses the single-line mode.
  multiline?: boolean;
  rows?: number;
  id?: string;
  autoComplete?: string;
  // Optional bounds for date/time inputs (e.g. a DatePicker passing
  // the start as the end field's min so earlier times are greyed out).
  // Ignored for other input types. Omit them and the input has no
  // bounds — the input is exactly as before.
  min?: string;
  max?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  // Optional accessible name for an input with no visible label —
  // e.g. the time half of a datetime pair, whose row label sits over
  // the date half. Omit it and the input has no aria-label, as before.
  ariaLabel?: string;
}

export const TextField: React.FC<TextFieldProps> = ({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  disabled = false,
  error,
  icon,
  required = false,
  multiline = false,
  rows = 3,
  id,
  autoComplete,
  min,
  max,
  onKeyDown,
  ariaLabel,
}) => {
  const Icon = icon;
  const inputClassName = Icon
    ? `${textFieldStyles.input} ${textFieldStyles.inputWithIcon}`
    : textFieldStyles.input;
  const inputElement = (
    <input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      autoComplete={autoComplete}
      aria-label={ariaLabel}
      min={min}
      max={max}
      className={inputClassName}
    />
  );
  return (
    <div className={textFieldStyles.field}>
      {label && (
        <label htmlFor={id} className={textFieldStyles.label}>
          {label}
        </label>
      )}
      {multiline ? (
        <textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          aria-label={ariaLabel}
          rows={rows}
          className={textFieldStyles.textarea}
        />
      ) : Icon ? (
        <div className={textFieldStyles.inputWrapper}>
          <Icon className={textFieldStyles.inputIcon} />
          {inputElement}
        </div>
      ) : (
        inputElement
      )}
      {error && <span className={textFieldStyles.error}>{error}</span>}
    </div>
  );
};
