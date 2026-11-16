import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { X } from 'lucide-react';
import { filterBarStyles } from './FilterBar.styles.ts';

export interface FilterBarOption {
  value: string;
  label: string;
  icon?: LucideIcon;
  // Gold highlight (amber bg, gold border, gold dot) — an option that
  // deserves attention without being selected. The scripture pool
  // marks today's verse this way. Only shows while not selected.
  highlighted?: boolean;
}

export interface FilterBarProps {
  options: FilterBarOption[];
  value: string;
  onChange: (value: string) => void;
  // When provided, each pill renders an X that removes that option.
  // The X stops propagation so it never triggers onChange.
  onRemove?: (value: string) => void;
  // Accessible name for the X, given the option's label (e.g. the
  // pool passes "Remove {ref} from the pool"). Falls back to the
  // option label itself when omitted.
  removeLabel?: (label: string) => string;
  ariaLabel?: string;
  className?: string;
  // Wrap the pills onto multiple lines instead of scrolling sideways.
  // Opt-in — Events and Videos omit it and keep the scrolling strip.
  // The verse pool passes it so the admin can see every reference.
  wrap?: boolean;
}

// Shared FilterBar: a row of category pills (exactly one selected)
// that scrolls sideways when the options don't fit, instead of
// wrapping. The Events tab's filter is the model — the same pills
// now serve Events and Videos, so the filters can never drift apart.
// The caller owns the state — this only renders the row and reports
// the tap. Pass className for layout around the row (e.g. a bottom
// margin); the row itself keeps its own scrolling and pill styles.
//
// Two optional extensions, both backward compatible (Events/Videos
// pass neither, so nothing changes for them):
// - option.highlighted: a gold pill (amber bg, gold border, gold dot)
//   for an option that deserves attention without being selected —
//   the scripture pool marks today's verse this way. A selected pill
//   keeps the dark active style; highlighted only shows while the
//   pill is not selected.
// - onRemove: when provided, each pill renders an X that removes that
//   option (the scripture pool's remove-a-verse). The X stops
//   propagation so it never triggers onChange. It is a <span> with
//   role="button", not a nested <button> — buttons cannot nest —
//   with keyboard support (Enter/Space) so it stays reachable.
export const FilterBar: React.FC<FilterBarProps> = ({ options, value, onChange, onRemove, removeLabel, ariaLabel, className, wrap = false }) => {
  return (
    <div className={`${wrap ? filterBarStyles.rowWrap : filterBarStyles.row} ${className ?? ''}`} role="group" aria-label={ariaLabel}>
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
              isSelected
                ? filterBarStyles.pillActive
                : option.highlighted
                  ? filterBarStyles.pillHighlighted
                  : filterBarStyles.pillInactive
            }`}
          >
            {option.highlighted && !isSelected && <span aria-hidden="true" className={filterBarStyles.dot} />}
            {Icon && (
              <Icon
                className={`${filterBarStyles.icon} ${
                  isSelected ? filterBarStyles.iconActive : filterBarStyles.iconInactive
                }`}
              />
            )}
            <span>{option.label}</span>
            {onRemove && (
              <span
                role="button"
                tabIndex={0}
                aria-label={removeLabel ? removeLabel(option.label) : option.label}
                className={filterBarStyles.removeBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(option.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    onRemove(option.value);
                  }
                }}
              >
                <X className={filterBarStyles.removeIcon} />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
