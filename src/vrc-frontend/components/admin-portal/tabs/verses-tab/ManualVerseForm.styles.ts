// Manual "Add a Verse" form (ManualVerseForm). Styles moved out of
// VersesTab.styles.ts — the fetched-verse preview box follows the
// preview treatment in EditHeaderVerseModal (muted stone card + white
// inner box, serif italic quote, amber reference).
export const manualVerseFormStyles = {
  saveIcon: 'w-3.5 h-3.5',
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
  // Cancel-edit button row at the top of the manual form (the title
  // lives in the accordion header now, so the button moved here).
  addCancelRow: 'flex justify-end',
};
