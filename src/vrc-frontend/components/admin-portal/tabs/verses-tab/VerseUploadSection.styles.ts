// "Upload Monthly Verses" section (VerseUploadSection). Styles moved
// out of VersesTab.styles.ts. The sample format table scrolls
// horizontally on a narrow phone screen; the modal body has no
// padding, so the wrapper supplies it (p-6, same as the admin code
// modal) — otherwise the table runs to the edges and is clipped by
// the rounded corner.
// Note: saveIcon, hint and sectionTitle are also in
// VersesTab.styles.ts (the parent still uses them) — the same class
// strings are repeated here so this child stays self-contained.
export const verseUploadSectionStyles = {
  saveIcon: 'w-3.5 h-3.5',
  hint: 'text-xs text-stone-500 dark:text-stone-400 leading-relaxed',
  sectionTitle: 'text-xs font-extrabold uppercase tracking-wider text-amber-800 dark:text-amber-400',
  formHeader: 'flex flex-wrap items-center justify-between gap-2',
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
  // Month the upload is for, shown inside the upload body (not the
  // header) so the header stays short.
  uploadMonthLine: 'text-xs font-bold text-stone-500 dark:text-stone-400',
  // Sample format table — shown in the sample modal.
  uploadSampleModalBody: 'p-6 space-y-3',
  uploadSampleTable: 'overflow-x-auto rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900',
  uploadSampleHeaderRow:
    'grid grid-cols-[repeat(6,minmax(110px,1fr))] gap-px bg-stone-100 dark:bg-stone-800 text-[11px] font-bold uppercase tracking-wide text-stone-600 dark:text-stone-400 [&>span]:px-2 [&>span]:py-1.5 [&>span]:truncate',
  uploadSampleDataRow:
    'grid grid-cols-[repeat(6,minmax(110px,1fr))] gap-px text-xs text-stone-700 dark:text-stone-300 [&>span]:px-2 [&>span]:py-1.5 [&>span]:truncate',
};
