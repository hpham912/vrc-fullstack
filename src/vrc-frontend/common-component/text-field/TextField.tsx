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
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
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
  onKeyDown,
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
