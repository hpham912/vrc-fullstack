import React from 'react';
import { loadingShimmerStyles as s } from './LoadingShimmer.styles.ts';

export type LoadingShimmerVariant = 'card' | 'hero' | 'lines' | 'verse';

interface LoadingShimmerProps {
  /** Shape to mimic. Defaults to 'lines'. */
  variant?: LoadingShimmerVariant;
  /** Text lines for the 'lines' variant. Defaults to 3. */
  rows?: number;
  /** How many blocks to render (e.g. 3 event cards). Defaults to 1. */
  count?: number;
  /** Extra classes on the outer wrapper. */
  className?: string;
}

/** One shimmering skeleton block. */
const ShimmerBlock: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`${s.block} ${className}`.trim()} aria-hidden="true">
    <div className={s.sweep} />
  </div>
);

/**
 * Shared loading shimmer — the one skeleton every screen uses while its
 * data is loading. Pick the variant that matches the content being loaded
 * (event card, hero banner, text lines, verse card) and it renders in both
 * light and dark mode. The caller only decides the shape and how many.
 */
export const LoadingShimmer: React.FC<LoadingShimmerProps> = ({
  variant = 'lines',
  rows = 3,
  count = 1,
  className = '',
}) => {
  const renderOne = (key: number) => {
    if (variant === 'card') {
      return (
        <div key={key} className={s.cardWrap} aria-hidden="true">
          <div className={s.cardTopRow}>
            <ShimmerBlock className="h-5 w-20 rounded-full" />
            <ShimmerBlock className="h-3.5 w-16" />
          </div>
          <div className={s.cardMain}>
            <ShimmerBlock className="h-[4.5rem] w-14 flex-shrink-0" />
            <div className={s.cardContent}>
              <ShimmerBlock className="h-4 w-3/4" />
              <ShimmerBlock className="h-3 w-1/2" />
              <ShimmerBlock className="h-3 w-full" />
            </div>
          </div>
        </div>
      );
    }

    if (variant === 'hero') {
      return (
        <div key={key} className={s.heroWrap} aria-hidden="true">
          <ShimmerBlock className="h-36 sm:h-44 w-full" />
          <ShimmerBlock className="h-5 w-2/3 mx-auto" />
          <ShimmerBlock className="h-3.5 w-1/2 mx-auto" />
        </div>
      );
    }

    if (variant === 'verse') {
      return (
        <div key={key} className={s.verseWrap} aria-hidden="true">
          <ShimmerBlock className="h-4 w-3/4 mx-auto" />
          <ShimmerBlock className="h-4 w-1/2 mx-auto" />
          <ShimmerBlock className="h-3 w-24 mx-auto" />
        </div>
      );
    }

    // 'lines'
    const lineWidths = ['w-full', 'w-11/12', 'w-3/4', 'w-2/3', 'w-1/2'];
    return (
      <div key={key} className={s.linesWrap} aria-hidden="true">
        {Array.from({ length: Math.max(1, rows) }, (_, index) => (
          <ShimmerBlock
            key={index}
            className={`h-3.5 ${lineWidths[index % lineWidths.length]}`}
          />
        ))}
      </div>
    );
  };

  return (
    <div
      role="status"
      aria-label="Loading"
      className={`space-y-3 w-full min-w-0 ${className}`.trim()}
    >
      {Array.from({ length: Math.max(1, count) }, (_, index) => renderOne(index))}
    </div>
  );
};
