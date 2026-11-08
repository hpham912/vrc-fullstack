export const loadingShimmerStyles = {
  // One shimmering skeleton block. The sweep is a highlight that travels
  // across it (see --animate-shimmer in src/index.css).
  block: 'relative overflow-hidden bg-stone-200 dark:bg-stone-800 rounded-xl',
  sweep:
    'absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/70 dark:via-white/10 to-transparent',
  // Card variant: mimics an event card (date box + title + meta + lines).
  cardWrap:
    'rounded-2xl border border-stone-200/80 dark:border-stone-800 bg-white dark:bg-stone-900/40 p-4 sm:p-5 space-y-3 w-full min-w-0 box-border',
  cardTopRow: 'flex items-center justify-between gap-2',
  cardMain: 'flex items-start gap-3.5',
  cardContent: 'min-w-0 flex-1 space-y-2 pt-0.5',
  // Hero variant: mimics the spotlight / home banner.
  heroWrap: 'space-y-3 w-full',
  // Lines variant: a stack of text-like lines.
  linesWrap: 'space-y-2 w-full',
  // Verse variant: mimics a verse card (centered).
  verseWrap:
    'rounded-2xl border border-stone-200/80 dark:border-stone-800 bg-white dark:bg-stone-900/40 p-5 sm:p-6 space-y-3 w-full text-center',
};
