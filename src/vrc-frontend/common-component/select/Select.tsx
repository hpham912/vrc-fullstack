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
  ariaLabel?: string;
  disabled?: boolean;
  className?: string;
}

export const Select: React.FC<SelectProps> = ({
  options,
  value,
  onChange,
  ariaLabel,
  disabled = false,
  className,
}) => {
  return (
    <div className={`${selectStyles.wrapper} ${className ?? ''}`}>
      <select
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
  );
};
