import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { filterBarStyles } from './FilterBar.styles.ts';

export interface FilterBarOption {
  value: string;
  label: string;
  icon?: LucideIcon;
}

export interface FilterBarProps {
  options: FilterBarOption[];
  value: string;
  onChange: (value: string) => void;
  ariaLabel?: string;
  className?: string;
}

// Shared FilterBar: a row of category pills (exactly one selected)
// that scrolls sideways when the options don't fit, instead of
// wrapping. The Events tab's filter is the model — the same pills
// now serve Events and Videos. The caller owns the state — this
// only renders the row and reports the tap. Pass className for
// layout around the row (e.g. a bottom margin); the row itself
// keeps its own scrolling and pill styles.
export const FilterBar: React.FC<FilterBarProps> = ({ options, value, onChange, ariaLabel, className }) => {
  return (
    <div className={`${filterBarStyles.row} ${className ?? ''}`} role="group" aria-label={ariaLabel}>
      {options.map((option) => {
        const isSelected = option.value === value;
        const Icon = option.icon;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={isSelected}
            className={`${filterBarStyles.pill} ${
              isSelected ? filterBarStyles.pillActive : filterBarStyles.pillInactive
            }`}
          >
            {Icon && (
              <Icon
                className={`${filterBarStyles.icon} ${
                  isSelected ? filterBarStyles.iconActive : filterBarStyles.iconInactive
                }`}
              />
            )}
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
};
