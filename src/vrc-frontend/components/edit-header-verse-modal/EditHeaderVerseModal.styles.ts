export const editHeaderVerseModalStyles = {
  container: 'p-4 sm:p-6 space-y-4 sm:space-y-5 text-stone-900 dark:text-stone-100 max-h-[80vh] overflow-y-auto',
  // Bilingual field group — one topic in two languages: a topic
  // heading, then a labeled TextField per language ("Tiếng Việt" /
  // "English" via the TextField label prop).
  fieldGroup: 'space-y-1.5',
  fieldLabel: 'block text-xs font-bold text-stone-700 dark:text-stone-300',
  apiCard:
    'p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 space-y-3',
  apiCardTitle: 'text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300 flex items-center gap-1.5',
  apiSearchRow: 'flex flex-col sm:flex-row items-stretch sm:items-center gap-2',
  previewCard:
    'p-4 rounded-2xl bg-stone-100/80 dark:bg-stone-900/80 border border-stone-200/80 dark:border-stone-800 space-y-2',
  previewHeader: 'flex items-center justify-between text-xs font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider',
  previewBox:
    'p-3.5 rounded-xl bg-white dark:bg-[#161412] border border-stone-200/60 dark:border-stone-800/60 text-center space-y-1',
  previewQuote:
    'font-serif italic text-stone-900 dark:text-stone-100 text-xs sm:text-sm leading-relaxed whitespace-pre-line',
  previewRef: 'block text-xs font-semibold text-amber-700 dark:text-amber-400 mt-1',
  footerRow:
    'pt-3 border-t border-stone-200 dark:border-stone-800 flex items-center justify-end gap-2 flex-wrap',
};
