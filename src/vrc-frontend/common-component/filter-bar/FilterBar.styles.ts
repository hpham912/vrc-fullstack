// Shared FilterBar: a row of category pills (exactly one selected)
// that scrolls sideways when the options don't fit, instead of
// wrapping. The Events tab's filter is the model — the same pills
// now serve Events and Videos, so the filters can never drift apart.
// The row hides its scrollbar (scrollbar-none) so the pills read as
// a clean strip; the pills never shrink or wrap (flex-shrink-0 +
// whitespace-nowrap), so a long list scrolls instead of squeezing.
// The strip is the flex-1 child of the shell (chevron + clear
// buttons sit beside it), so it also needs min-w-0 to shrink.
export const filterBarStyles = {
  shell: 'flex items-center gap-1.5 sm:gap-2 w-full max-w-full',
  row: 'flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none py-1 px-0.5 flex-1 min-w-0',
  // Wrapped row (opt-in via the wrap prop): the pills flow onto
  // multiple lines instead of scrolling sideways. Used by the verse
  // pool so the admin can see every reference at a glance; Events
  // and Videos keep the scrolling strip.
  rowWrap: 'flex flex-wrap items-center gap-1.5 sm:gap-2 py-1 px-0.5 flex-1 min-w-0',
  // Chevron + clear buttons beside the strip. Round, pill-height,
  // same border/background as an inactive pill so they read as part
  // of the row. At the end of the strip the chevron fades out
  // (disabled + opacity-30) instead of disappearing, so the pills
  // never jump sideways while scrolling.
  sideBtn:
    'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-stone-300 bg-white text-stone-600 shadow-2xs hover:bg-stone-50 dark:bg-stone-900/80 dark:text-stone-300 dark:border-stone-800 dark:hover:bg-stone-800 dark:hover:text-stone-100 transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer',
  sideIcon: 'w-4 h-4',
  pill: 'flex items-center gap-1.5 py-1.5 px-3.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 active:scale-95 flex-shrink-0',
  pillActive:
    'bg-stone-950 text-white shadow-xs ring-2 ring-stone-950/20 dark:bg-amber-500 dark:text-stone-950 dark:ring-amber-500/30',
  // Gold highlight (today's verse in the scripture pool): amber bg,
  // gold border, gold dot. Amber-100 / amber-900 are in the remap
  // palette, so dark mode converts for free; the gold border and dot
  // stay gold in both modes. Only used while the pill is not
  // selected — a selected pill keeps the dark active style above.
  pillHighlighted:
    'bg-amber-100 text-amber-900 border border-[#c9a227] shadow-2xs dark:bg-amber-950/60 dark:text-amber-200 dark:border-[#c9a227]',
  pillInactive:
    'bg-white text-stone-700 hover:text-stone-950 border border-stone-300 shadow-2xs hover:bg-stone-50 dark:bg-stone-900/80 dark:text-stone-300 dark:border-stone-800 dark:hover:bg-stone-800 dark:hover:text-stone-100',
  icon: 'w-3.5 h-3.5',
  iconActive: 'text-amber-400',
  iconInactive: 'text-stone-600',
  // Gold dot marking a highlighted pill (today's verse).
  dot: 'w-1.5 h-1.5 rounded-full bg-[#c9a227] flex-shrink-0',
  // Remove X on a removable pill. A grey circle that turns rose on
  // hover (the pool preview's treatment); the -mr-1 keeps the pill's
  // right padding balanced. A <span role="button">, not a nested
  // <button> — see FilterBar.tsx.
  removeBtn:
    'flex items-center justify-center w-4 h-4 -mr-1 rounded-full bg-black/10 text-stone-600 hover:bg-rose-200 hover:text-rose-800 dark:bg-white/15 dark:text-stone-300 dark:hover:bg-rose-900/60 dark:hover:text-rose-200 transition-colors flex-shrink-0 cursor-pointer',
  removeIcon: 'w-3 h-3',
};
