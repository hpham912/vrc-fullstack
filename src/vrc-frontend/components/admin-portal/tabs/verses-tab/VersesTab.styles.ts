// Scripture pool manager (VersesTab). The shell keeps today's verse,
// the pool list and the add-area accordion headers; the manual form
// lives in ManualVerseForm.styles.ts and the upload section in
// VerseUploadSection.styles.ts.
// Note: hint and sectionTitle are also in
// VerseUploadSection.styles.ts (the upload child uses them) — the
// same class strings are repeated there so that child stays
// self-contained.
export const versesTabStyles = {
  container: 'space-y-6 max-w-2xl mx-auto w-full min-w-0',
  section: 'space-y-3 w-full min-w-0',
  sectionTitle: 'text-xs font-extrabold uppercase tracking-wider text-amber-800 dark:text-amber-400',
  hint: 'text-xs text-stone-500 dark:text-stone-400 leading-relaxed',
  emptyText: 'text-sm text-stone-500 dark:text-stone-400',
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
  // Verse pool list head.
  poolHead: 'flex items-baseline justify-between gap-2',
  poolCount: 'text-xs font-bold text-stone-500 dark:text-stone-400',
  // Add-area accordion headers — the icon sits inline with the
  // title (flex, vertically centered), and the month is pushed to
  // the right of the upload header, before the chevron.
  addHeader: 'flex items-center gap-1.5 min-w-0',
  addHeaderIcon: 'w-4 h-4 flex-shrink-0 text-amber-700 dark:text-amber-400',
  addHeaderTitle:
    'text-xs font-extrabold uppercase tracking-wider text-amber-800 dark:text-amber-400 truncate',
};
