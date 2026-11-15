export const membersTabStyles = {
  container: 'space-y-6 max-w-2xl mx-auto',
  header: 'flex items-center gap-3',
  headerIconBox:
    'w-10 h-10 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold flex-shrink-0',
  headerTitle: 'font-serif font-bold text-stone-900 text-base',
  headerSub: 'text-xs text-stone-500 mt-0.5',
  empty: 'text-xs font-medium text-stone-500 text-center py-6',
  list: 'divide-y divide-stone-100 dark:divide-stone-800 border border-stone-200 rounded-2xl overflow-hidden bg-white',
  item: 'p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3',
  itemMain: 'min-w-0',
  itemName: 'font-bold text-stone-900 text-xs sm:text-sm',
  itemMeta: 'text-label text-stone-500 mt-0.5 break-words',
  itemActions: 'flex items-center gap-2 flex-shrink-0',
  // Temporary code shown after a reset. The code is big and centered so
  // the resetting admin can read it at a glance and share it.
  codeWrap: 'p-6 space-y-4',
  codeBox: 'text-center font-mono text-3xl font-bold tracking-widest text-stone-900 bg-stone-100 rounded-xl py-4',
  codeHint: 'text-xs font-medium text-stone-500 text-center',
};
