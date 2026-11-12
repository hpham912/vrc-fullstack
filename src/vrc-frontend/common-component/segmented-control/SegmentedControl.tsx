import React from 'react';
import { segmentedControlStyles } from './SegmentedControl.styles.ts';

export interface SegmentedControlOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel?: string;
}

// Shared segmented control: a row of options where exactly one is
// selected. Replaces the hand-built two-button pickers in the
// Sermons admin form (Tall/Wide), the Events admin preview (language),
// the header-verse editor preview (language) and the Navbar desktop
// language pill. The caller owns the state — this only renders the
// row and reports the tap. One look everywhere, so the pickers can
// never drift apart.
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: SegmentedControlProps<T>) {
  return (
    <div
      className={segmentedControlStyles.container}
      role="group"
      aria-label={ariaLabel}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={active}
            className={`${segmentedControlStyles.btn} ${
              active ? segmentedControlStyles.btnActive : segmentedControlStyles.btnIdle
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
