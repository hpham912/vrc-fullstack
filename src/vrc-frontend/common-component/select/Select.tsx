import React from 'react';
import { ChevronDown } from 'lucide-react';
import { selectStyles } from './Select.styles.ts';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  // Optional label above the dropdown, in the same style and with the
  // same label/control association as TextField's label. Omit it and
  // nothing renders above the dropdown — the dropdown is exactly as
  // before. Pass id with it so the label is associated with the
  // <select> for accessibility.
  label?: string;
  id?: string;
  ariaLabel?: string;
  disabled?: boolean;
  className?: string;
}

export const Select: React.FC<SelectProps> = ({
  options,
  value,
  onChange,
  label,
  id,
  ariaLabel,
  disabled = false,
  className,
}) => {
  return (
    <div className={`${selectStyles.field} ${className ?? ''}`}>
      {label && (
        <label htmlFor={id} className={selectStyles.label}>
          {label}
        </label>
      )}
      <div className={selectStyles.wrapper}>
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={ariaLabel}
          disabled={disabled}
          className={selectStyles.select}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className={selectStyles.chevron} aria-hidden="true" />
      </div>
    </div>
  );
};
