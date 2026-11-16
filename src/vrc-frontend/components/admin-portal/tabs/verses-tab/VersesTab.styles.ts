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
  // Add / edit form.
  formHeader: 'flex flex-wrap items-center justify-between gap-2',
  // Bilingual field group — one topic in two languages: a topic
  // heading, then a labeled TextField per language ("Tiếng Việt" /
  // "English" via the TextField label prop).
  fieldGroup: 'space-y-1.5',
  fieldLabel: 'block text-xs font-bold text-stone-700 dark:text-stone-300',
  addRow: 'flex flex-col sm:flex-row items-stretch sm:items-end gap-2',
  addRowField: 'flex-1 min-w-0',
  addBtnRow: 'pt-1',
  // Fetched-verse preview — the EditHeaderVerseModal preview
  // treatment: muted stone card, white inner box, serif italic
  // quote, amber reference.
  previewCard: 'p-4 rounded-2xl bg-stone-100/80 dark:bg-stone-900/80 border border-stone-200/80 dark:border-stone-800 space-y-2',
  previewHeader: 'flex items-center justify-between text-xs font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider',
  previewBox: 'p-3.5 rounded-xl bg-white dark:bg-[#161412] border border-stone-200/60 dark:border-stone-800/60 text-center space-y-1',
  previewQuote: 'font-serif italic text-stone-900 dark:text-stone-100 text-xs sm:text-sm leading-relaxed whitespace-pre-line',
  previewRef: 'block text-xs font-semibold text-amber-700 dark:text-amber-400 mt-1',
  // Verse pool list head.
  poolHead: 'flex items-baseline justify-between gap-2',
  poolCount: 'text-xs font-bold text-stone-500 dark:text-stone-400',
  // Monthly upload section.
  uploadPreviewList:
    'max-h-64 overflow-y-auto rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 divide-y divide-stone-100 dark:divide-stone-800',
  uploadPreviewRow: 'px-3 py-2 space-y-0.5',
  uploadPreviewRef: 'text-sm font-semibold text-stone-900 dark:text-stone-50',
  uploadPreviewMeta: 'text-xs text-stone-500 dark:text-stone-400 leading-relaxed line-clamp-2',
  // One shared error Banner per bad row (dismissible, stays until
  // dismissed), stacked.
  uploadErrorStack: 'space-y-2',
  uploadBtnRow: 'pt-1 flex flex-col gap-2',
  // Add-area accordion headers — the icon sits inline with the
  // title (flex, vertically centered), and the month is pushed to
  // the right of the upload header, before the chevron.
  addHeader: 'flex items-center gap-1.5 min-w-0',
  addHeaderIcon: 'w-4 h-4 flex-shrink-0 text-amber-700 dark:text-amber-400',
  addHeaderTitle:
    'text-xs font-extrabold uppercase tracking-wider text-amber-800 dark:text-amber-400 truncate',
  // Month the upload is for, shown inside the upload body (not the
  // header) so the header stays short.
  uploadMonthLine: 'text-xs font-bold text-stone-500 dark:text-stone-400',
  // Cancel-edit button row at the top of the manual form (the title
  // lives in the accordion header now, so the button moved here).
  addCancelRow: 'flex justify-end',
  // Sample format table — shown in the sample modal. The 6-column
  // table scrolls horizontally on a narrow phone screen.
  // The modal body has no padding, so this wrapper supplies it
  // (p-6, same as the admin code modal) — otherwise the table runs
  // to the edges and is clipped by the rounded corner.
  uploadSampleModalBody: 'p-6 space-y-3',
  uploadSampleTable: 'overflow-x-auto rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900',
  uploadSampleHeaderRow:
    'grid grid-cols-[repeat(6,minmax(110px,1fr))] gap-px bg-stone-100 dark:bg-stone-800 text-[11px] font-bold uppercase tracking-wide text-stone-600 dark:text-stone-400 [&>span]:px-2 [&>span]:py-1.5 [&>span]:truncate',
  uploadSampleDataRow:
    'grid grid-cols-[repeat(6,minmax(110px,1fr))] gap-px text-xs text-stone-700 dark:text-stone-300 [&>span]:px-2 [&>span]:py-1.5 [&>span]:truncate',
};
