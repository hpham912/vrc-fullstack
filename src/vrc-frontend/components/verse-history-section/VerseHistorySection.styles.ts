// Member verse history (Scripture tab) — past daily verses for the
// current month and the previous month, grouped by month, newest
// first. Uses the remap palette so it auto-converts in dark mode.
export const verseHistorySectionStyles = {
  container: 'max-w-4xl mx-auto px-4 pb-12 w-full min-w-0 space-y-4',
  title: 'text-xs font-extrabold uppercase tracking-wider text-amber-800 dark:text-amber-400',
  monthTitle: 'text-xs font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider pt-2',
  emptyText: 'text-sm text-stone-500 dark:text-stone-400 text-center py-2',
  list: 'space-y-2',
  row: 'w-full text-left rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-3.5 py-3 space-y-1.5 transition-colors hover:border-amber-400 dark:hover:border-amber-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 dark:focus-visible:ring-amber-400',
  rowHead: 'flex items-baseline justify-between gap-2',
  rowDate: 'flex-shrink-0 text-xs font-bold text-stone-500 dark:text-stone-400',
  rowRef: 'text-sm font-semibold text-stone-900 dark:text-stone-50 min-w-0',
  rowChevron: 'w-4 h-4 flex-shrink-0 text-stone-400 dark:text-stone-500 transition-transform',
  rowChevronOpen: 'rotate-180',
  rowText: 'block text-sm leading-relaxed text-stone-700 dark:text-stone-300 whitespace-pre-line',
  rowExtraLabel:
    'block text-[11px] font-extrabold uppercase tracking-wider text-amber-800 dark:text-amber-400 pt-1',
  rowExtraText: 'block text-[13px] leading-relaxed text-stone-700 dark:text-stone-300 whitespace-pre-line',
};
