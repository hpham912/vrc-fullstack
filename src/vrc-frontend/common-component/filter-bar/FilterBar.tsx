import React, { useEffect, useRef, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.tsx';
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
  // Row-level clear: an X after the right chevron that resets the
  // filter (the caller maps it to its "all" value). The caller
  // passes it only while a filter is active, so the X appears only
  // then — e.g. `value !== 'all' ? () => onChange('all') : undefined`.
  onClear?: () => void;
  ariaLabel?: string;
  className?: string;
  // Wrap the pills onto multiple lines instead of scrolling sideways.
  // Opt-in — Events and Videos omit it and keep the scrolling strip.
  // The verse pool passes it so the admin can see every reference.
  wrap?: boolean;
}

// The edge fade for the scrolling strip: the pills fade out on any
// side that still has more to scroll to, so the user can see there
// is more. Pure so the render test can check it without layout.
export const scrollFadeMask = (canScrollLeft: boolean, canScrollRight: boolean): string | undefined => {
  if (!canScrollLeft && !canScrollRight) return undefined;
  const fade = 28;
  return `linear-gradient(to right, ${canScrollLeft ? 'transparent' : 'black'} 0, black ${fade}px, black calc(100% - ${fade}px), ${canScrollRight ? 'transparent' : 'black'} 100%)`;
};

// Shared FilterBar: a row of category pills (exactly one selected)
// that scrolls sideways when the options don't fit, instead of
// wrapping. The Events tab's filter is the model — the same pills
// now serve Events and Videos, so the filters can never drift apart.
// The caller owns the state — this only renders the row and reports
// the tap. Pass className for layout around the row (e.g. a bottom
// margin); the row itself keeps its own scrolling and pill styles.
//
// When the strip overflows, chevron buttons appear at both ends
// (like a carousel): they scroll the row by most of a page, and the
// edge on any side with more to scroll to fades out. At the left
// edge the left chevron is faded out, at the right edge the right
// one is, and on a short row that fits, no chevron appears at all.
// The chevrons only exist in scroll mode — a wrapped row (the verse
// pool) never scrolls sideways, so it never gets them.
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
export const FilterBar: React.FC<FilterBarProps> = ({ options, value, onChange, onRemove, removeLabel, onClear, ariaLabel, className, wrap = false }) => {
  const { t } = useLanguage();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Measure after every render (no dep array): the strip's overflow
  // changes when the options, the language, or the font size change,
  // and none of those reliably fire a resize on the strip itself.
  // The setters bail out when the values are unchanged, so this is
  // just three property reads on most renders. The scroll listener
  // and ResizeObserver keep the chevrons right while scrolling and
  // while the viewport changes size.
  useEffect(() => {
    if (wrap) return;
    const el = scrollRef.current;
    if (!el) return;
    const update = () => {
      setCanScrollLeft(el.scrollLeft > 4);
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    };
    update();
    el.addEventListener('scroll', update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => {
      el.removeEventListener('scroll', update);
      observer.disconnect();
    };
  });

  const hasOverflow = canScrollLeft || canScrollRight;
  const scrollByPage = (direction: 1 | -1) => {
    const el = scrollRef.current;
    if (el) el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: 'smooth' });
  };
  const fadeMask = wrap ? undefined : scrollFadeMask(canScrollLeft, canScrollRight);

  return (
    <div className={`${filterBarStyles.shell} ${className ?? ''}`} role="group" aria-label={ariaLabel}>
      {!wrap && hasOverflow && (
        <button
          type="button"
          aria-label={t('filterScrollLeft')}
          disabled={!canScrollLeft}
          onClick={() => scrollByPage(-1)}
          className={filterBarStyles.sideBtn}
        >
          <ChevronLeft className={filterBarStyles.sideIcon} />
        </button>
      )}
      <div
        ref={scrollRef}
        className={wrap ? filterBarStyles.rowWrap : filterBarStyles.row}
        style={fadeMask ? { maskImage: fadeMask, WebkitMaskImage: fadeMask } : undefined}
      >
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
      {!wrap && hasOverflow && (
        <button
          type="button"
          aria-label={t('filterScrollRight')}
          disabled={!canScrollRight}
          onClick={() => scrollByPage(1)}
          className={filterBarStyles.sideBtn}
        >
          <ChevronRight className={filterBarStyles.sideIcon} />
        </button>
      )}
      {onClear && (
        <button
          type="button"
          aria-label={t('filterClear')}
          onClick={onClear}
          className={filterBarStyles.sideBtn}
        >
          <X className={filterBarStyles.sideIcon} />
        </button>
      )}
    </div>
  );
};
