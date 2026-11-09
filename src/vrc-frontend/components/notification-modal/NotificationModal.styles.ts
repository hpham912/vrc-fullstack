export const notificationModalStyles = {
  // Both backdrop and dialog end exactly at the top of the iOS tab bar
  // on mobile (bottom comes from the --notif-bottom variable, set to the
  // tab bar's measured height). The panel never covers the tab bar, and
  // the tab bar stays tappable. Desktop: full-screen backdrop, dropdown.
  backdrop: 'fixed inset-x-0 top-0 bottom-[var(--notif-bottom,0px)] md:inset-0 z-[90] bg-transparent',
  dialog:
    'fixed inset-x-0 top-0 bottom-[var(--notif-bottom,0px)] md:top-[86px] md:left-auto md:right-6 md:w-[420px] md:bottom-auto md:max-h-[min(650px,calc(100vh-110px))] z-[100] bg-white dark:bg-[#161412] text-stone-900 dark:text-stone-100 rounded-none md:rounded-3xl md:shadow-2xl border-0 md:border border-stone-200/90 dark:border-stone-800 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2 duration-200',
  header: 'px-5 py-3.5 border-b border-stone-200 dark:border-stone-800 bg-stone-900 dark:bg-stone-950 text-white flex items-center justify-between',
  headerLeft: 'flex items-center gap-2.5',
  headerIconBox:
    'w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400',
  headerTitle: 'font-serif font-bold text-sm sm:text-base leading-tight text-white',
  headerSub: 'text-stone-300 dark:text-stone-400 text-xs font-medium',
  closeIconBtn: 'hidden md:block p-1.5 rounded-full text-stone-300 hover:text-white hover:bg-stone-800 dark:hover:bg-stone-800 transition-colors',
  headerActions: 'flex items-center gap-1',
  addBtn: 'p-1.5 rounded-full text-stone-300 hover:text-white hover:bg-stone-800 transition-colors',
  addForm: 'p-3.5 border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/60 space-y-2.5',
  addInput:
    'w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50',
  addTextarea:
    'w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 min-h-[80px] resize-y',
  addFormActions: 'flex items-center gap-2 justify-end',
  addError: 'text-xs font-semibold text-rose-600 dark:text-rose-400',
  listContainer: 'flex-1 overflow-y-auto p-3.5 space-y-2.5',
  emptyBox: 'text-center py-10 px-4 space-y-2',
  emptyIconBox: 'w-10 h-10 rounded-2xl bg-stone-100 dark:bg-stone-800/80 border border-stone-200/60 dark:border-stone-700 mx-auto flex items-center justify-center text-stone-500 dark:text-stone-400',
  emptyTitle: 'text-stone-800 dark:text-stone-200 font-bold text-xs sm:text-sm',
  emptySub: 'text-stone-600 dark:text-stone-400 text-xs font-medium',
  notifItem:
    'p-3 rounded-2xl bg-stone-50/80 dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-800 hover:bg-white dark:hover:bg-stone-850 hover:border-amber-300 dark:hover:border-amber-500/50 hover:shadow-2xs transition-all text-left space-y-1.5 cursor-pointer group',
  notifItemTopRow: 'flex items-center justify-between gap-2',
  notifItemIconBox: 'w-6 h-6 rounded-lg bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-center flex-shrink-0',
  notifTypeBadgeBase: 'text-caption font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border',
  notifDateText: 'text-xs text-stone-600 dark:text-stone-400 font-semibold',
  notifTitle:
    'font-serif font-bold text-xs sm:text-sm text-stone-950 dark:text-stone-100 leading-snug group-hover:text-amber-900 dark:group-hover:text-amber-300 transition-colors',
  notifBody: 'text-xs text-stone-700 dark:text-stone-300 leading-relaxed line-clamp-2 font-medium',
  footer:
    'px-4 py-2.5 border-t border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/80 hidden md:flex items-center justify-between text-label text-stone-500 dark:text-stone-400',
  footerBrand: 'flex items-center gap-1 font-serif font-bold text-stone-700 dark:text-stone-300',
  footerCloseBtn:
    'px-3 py-1 rounded-lg bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-bold transition-colors text-label',
};
