// Shared FilterBar: a row of category pills (exactly one selected)
// that scrolls sideways when the options don't fit, instead of
// wrapping. The Events tab's filter is the model — the same pills
// now serve Events and Videos, so the filters can never drift apart.
// The row hides its scrollbar (scrollbar-none) so the pills read as
// a clean strip; the pills never shrink or wrap (flex-shrink-0 +
// whitespace-nowrap), so a long list scrolls instead of squeezing.
export const filterBarStyles = {
  row: 'flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none py-1 px-0.5 w-full max-w-full',
  pill: 'flex items-center gap-1.5 py-1.5 px-3.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 active:scale-95 flex-shrink-0',
  pillActive:
    'bg-stone-950 text-white shadow-xs ring-2 ring-stone-950/20 dark:bg-amber-500 dark:text-stone-950 dark:ring-amber-500/30',
  pillInactive:
    'bg-white text-stone-700 hover:text-stone-950 border border-stone-300 shadow-2xs hover:bg-stone-50 dark:bg-stone-900/80 dark:text-stone-300 dark:border-stone-800 dark:hover:bg-stone-800 dark:hover:text-stone-100',
  icon: 'w-3.5 h-3.5',
  iconActive: 'text-amber-400',
  iconInactive: 'text-stone-600',
};
