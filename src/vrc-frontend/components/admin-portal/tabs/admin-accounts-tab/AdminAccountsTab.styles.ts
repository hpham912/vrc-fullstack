export const adminAccountsTabStyles = {
  container: 'space-y-6 max-w-2xl mx-auto',
  createForm: 'p-5 bg-amber-50/50 rounded-2xl border border-amber-200/80 space-y-4',
  formTitle: 'font-serif font-bold text-stone-900 text-base flex items-center gap-2',
  titleIconAmber: 'w-4 h-4 text-amber-700 dark:text-amber-400',
  formDesc: 'text-xs text-stone-500 mt-0.5',
  formGrid: 'grid grid-cols-1 sm:grid-cols-2 gap-3',
  label: 'block text-xs font-bold text-stone-700 mb-1',
  input: 'w-full px-3 py-2 border border-stone-300 rounded-xl text-xs bg-white',
  submitRow: 'pt-1 text-right',
  createBtn:
    'px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors',
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
  // Temporary code shown after a reset. The code is big and centered so
  // the resetting admin can read it at a glance and share it.
  codeBody: 'p-6 space-y-4',
  codeMessage: 'text-sm text-stone-600',
  codeBox: 'text-center font-mono text-3xl font-bold tracking-widest text-stone-900 bg-stone-100 rounded-xl py-4',
  codeFooter: 'flex justify-end',
  passwordForm: 'p-5 bg-stone-50 rounded-2xl border border-stone-200 space-y-3',
  titleIconMuted: 'w-4 h-4 text-stone-600',
  labelSemibold: 'block text-xs font-semibold text-stone-700 mb-1',
  inputSm: 'w-full px-3 py-1.5 border border-stone-300 rounded-lg text-xs bg-white',
  submitRowRight: 'text-right pt-1',
  updateBtn:
    'px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-colors',
};
