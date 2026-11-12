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
  // 'sm': small pill buttons in a container (language pickers).
  // 'md': larger standalone buttons, dark active state (Tall/Wide).
  size?: 'sm' | 'md';
  ariaLabel?: string;
}

// Shared segmented control: a row of options where exactly one is
// selected. Replaces the hand-built two-button pickers in the
// Sermons admin form (Tall/Wide), the Events admin preview (language)
// and the Navbar desktop language pill. The caller owns the state —
// this only renders the row and reports the tap.
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  size = 'md',
  ariaLabel,
}: SegmentedControlProps<T>) {
  const isSmall = size === 'sm';
  return (
    <div
      className={isSmall ? segmentedControlStyles.containerSm : segmentedControlStyles.containerMd}
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
            className={
              isSmall
                ? `${segmentedControlStyles.btnSm} ${active ? segmentedControlStyles.btnSmActive : segmentedControlStyles.btnSmIdle}`
                : `${segmentedControlStyles.btnMd} ${active ? segmentedControlStyles.btnMdActive : segmentedControlStyles.btnMdIdle}`
            }
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
