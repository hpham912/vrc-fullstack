// Styles for the Announcements tab shell (add/edit form + list).
// The tab is small on purpose: one form at the top, the list below
// it, all shared components (TextField, Button, Banner, Badge,
// AdminActionButtons, ConfirmModal). The on/off switch copies the
// event form's Zoom switch — one switch look in the whole admin.
export const announcementsTabStyles = {
  container: 'space-y-6 max-w-2xl mx-auto w-full min-w-0',
  form: 'space-y-3',
  formTitle: 'text-xs font-bold uppercase tracking-wider text-stone-500',
  // On/off switch (same as the event form's Zoom switch).
  switchRow: 'flex items-center gap-3 pt-1',
  switchLabel: 'min-w-0 flex-1 text-sm font-bold text-stone-950 dark:text-stone-50',
  switchHint: 'text-xs text-stone-600 dark:text-stone-400',
  switchBtn: 'relative h-7 w-12 flex-shrink-0 rounded-full transition-colors',
  switchOn: 'bg-[#2D8CFF] dark:bg-[#2D8CFF]',
  switchOff: 'bg-stone-300 dark:bg-stone-700',
  switchKnob: 'absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-[#ffffff] dark:bg-[#ffffff] shadow transition-transform',
  switchKnobOn: 'translate-x-5',
  submitRow: 'text-right pt-2 border-t border-stone-200',
  emptyState:
    'rounded-xl border border-dashed border-stone-300 dark:border-stone-700 px-4 py-6 text-center text-sm text-stone-600 dark:text-stone-400',
  listSection: 'space-y-2 w-full min-w-0',
  listTitle: 'text-xs font-bold uppercase tracking-wider text-stone-500',
  list: 'divide-y divide-stone-100 dark:divide-stone-800 border border-stone-200 rounded-xl overflow-hidden bg-white dark:bg-stone-900',
  item: 'p-3 flex items-start gap-3 text-xs',
  itemBody: 'min-w-0 flex-1',
  itemTitleRow: 'flex items-center gap-2 min-w-0',
  itemTitle: 'font-bold text-stone-950 dark:text-stone-50 truncate',
  itemText: 'mt-1 text-stone-700 dark:text-stone-300 line-clamp-2 break-words',
  itemDate: 'mt-1 text-stone-500 dark:text-stone-400',
  itemActions: 'flex items-center gap-1 flex-shrink-0',
};
