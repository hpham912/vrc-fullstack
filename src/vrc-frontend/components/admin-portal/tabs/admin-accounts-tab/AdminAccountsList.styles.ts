export const adminAccountsListStyles = {
  listSection: 'space-y-3',
  sectionTitle: 'font-serif font-bold text-stone-900 text-sm flex items-center gap-2',
  titleIcon: 'w-4 h-4 text-stone-700',
  list: 'divide-y divide-stone-100 dark:divide-stone-800 border border-stone-200 rounded-2xl overflow-hidden bg-white',
  item: 'p-4 flex items-center justify-between gap-3',
  itemMeta: 'flex items-center gap-2',
  displayName: 'font-bold text-stone-900 text-xs sm:text-sm',
  usernameBadge: 'text-caption font-mono bg-stone-100 text-stone-600 px-2 py-0.5 rounded',
  selfBadge: 'text-caption font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded',
  email: 'text-label text-stone-500 mt-0.5',
  // Per-admin actions (reset password + delete). The reset uses an amber
  // key icon so it reads as a password action, not a second delete.
  itemActions: 'flex items-center gap-1 flex-shrink-0',
  resetBtn: 'p-1.5 text-stone-400 hover:text-amber-700 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/50 rounded-lg transition-colors',
  resetIcon: 'w-4 h-4',
  deleteBtn: 'p-1.5 text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors',
  deleteIcon: 'w-4 h-4',
};
