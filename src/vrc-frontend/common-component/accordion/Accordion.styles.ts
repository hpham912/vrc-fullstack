// Shared Accordion — one collapsible section open at a time.
// Matches the verse-history row look (rounded card, stone border,
// amber hover/focus), so the history and the admin add area share
// the same collapsible treatment.
export const accordionStyles = {
  container: 'space-y-2',
  item: 'rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 overflow-hidden',
  header:
    'w-full flex items-center gap-2 px-3.5 py-3 text-left transition-colors hover:border-amber-400 dark:hover:border-amber-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 dark:focus-visible:ring-amber-400',
  headerContent: 'flex-1 min-w-0',
  chevron: 'w-4 h-4 flex-shrink-0 text-stone-400 dark:text-stone-500 transition-transform',
  chevronOpen: 'rotate-180',
  body: 'px-3.5 pb-3.5 space-y-2',
};
