// Scripture pool manager (VersesTab). Sections follow the approved
// design v3; the fetched-verse preview box follows the preview
// treatment in EditHeaderVerseModal (muted stone card + white inner
// box, serif italic quote, amber reference) — see previewCard /
// previewBox / previewQuote / previewRef below.
export const versesTabStyles = {
  container: 'space-y-6 max-w-2xl mx-auto w-full min-w-0',
  section: 'space-y-3 w-full min-w-0',
  sectionTitle: 'text-xs font-extrabold uppercase tracking-wider text-amber-800 dark:text-amber-400',
  hint: 'text-xs text-stone-500 dark:text-stone-400 leading-relaxed',
  emptyText: 'text-sm text-stone-500 dark:text-stone-400',
  saveIcon: 'w-3.5 h-3.5',
  // Today's Scripture — navy card from design v3 (150deg gradient),
  // with the gold label and reference.
  todayCard: 'rounded-xl p-4 text-white bg-[linear-gradient(150deg,#143a75,#0d2d64_60%,#081f47)] space-y-1.5',
  todayLabel: 'text-[10px] font-bold uppercase tracking-[0.14em] text-[#e3b93b]',
  todayText: 'text-sm font-medium leading-relaxed',
  todayRef: 'text-xs font-extrabold text-[#e3b93b]',
  // Reflection / prayer under today's card (design v3 today-extra).
  todayExtra: 'p-3 rounded-[10px] bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-1',
  todayExtraLabel: 'text-[11px] font-extrabold uppercase tracking-wider text-amber-800 dark:text-amber-400',
  todayExtraText: 'text-[13px] leading-relaxed text-stone-700 dark:text-stone-300',
  // Display-for-today picker row.
  pickRow: 'flex items-center gap-2',
  pickLabel: 'text-xs font-semibold text-stone-700 dark:text-stone-300 whitespace-nowrap',
  pickSelect: 'flex-1 min-w-0',
  // Add / edit form.
  formHeader: 'flex flex-wrap items-center justify-between gap-2',
  addRow: 'flex items-end gap-2',
  addRowField: 'flex-1 min-w-0',
  fieldGroup: 'space-y-1.5',
  fieldLabel: 'block text-xs font-bold text-stone-700 dark:text-stone-300',
  langLabel: 'block text-[11px] font-bold text-amber-800 dark:text-amber-400',
  addBtnRow: 'pt-1',
  // Fetched-verse preview — the EditHeaderVerseModal preview
  // treatment: muted stone card, white inner box, serif italic
  // quote, amber reference.
  previewCard: 'p-4 rounded-2xl bg-stone-100/80 dark:bg-stone-900/80 border border-stone-200/80 dark:border-stone-800 space-y-2',
  previewHeader: 'flex items-center justify-between text-xs font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider',
  previewBox: 'p-3.5 rounded-xl bg-white dark:bg-[#161412] border border-stone-200/60 dark:border-stone-800/60 text-center space-y-1',
  previewQuote: 'font-serif italic text-stone-900 dark:text-stone-100 text-xs sm:text-sm leading-relaxed whitespace-pre-line',
  previewRef: 'block text-xs font-semibold text-amber-700 dark:text-amber-400 mt-1',
  // Pool-full notice (design v3 max-notice).
  fullNotice: 'p-3 rounded-[10px] bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs sm:text-sm font-semibold leading-relaxed',
  // Verse pool list head.
  poolHead: 'flex items-baseline justify-between gap-2',
  poolCount: 'text-xs font-bold text-stone-500 dark:text-stone-400',
};
