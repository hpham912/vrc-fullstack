export const notificationModalStyles = {
  backdrop: 'fixed inset-0 z-[90] bg-transparent',
  dialog:
    'fixed top-[60px] sm:top-[86px] inset-x-2.5 sm:left-auto sm:right-6 sm:w-[420px] bottom-[72px] md:bottom-auto md:max-h-[min(650px,calc(100vh-110px))] z-[100] bg-white dark:bg-[#161412] text-stone-900 dark:text-stone-100 rounded-3xl shadow-2xl border border-stone-200/90 dark:border-stone-800 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2 duration-200',
  header: 'px-5 py-3.5 border-b border-stone-200 dark:border-stone-800 bg-stone-900 dark:bg-stone-950 text-white flex items-center justify-between',
  headerLeft: 'flex items-center gap-2.5',
  headerIconBox:
    'w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400',
  headerTitle: 'font-serif font-bold text-sm sm:text-base leading-tight text-white',
  headerSub: 'text-stone-300 dark:text-stone-400 text-xs font-medium',
  closeIconBtn: 'p-1.5 rounded-full text-stone-300 hover:text-white hover:bg-stone-800 dark:hover:bg-stone-800 transition-colors',
  listContainer: 'flex-1 overflow-y-auto p-3.5 space-y-2.5',
  emptyBox: 'text-center py-10 px-4 space-y-2',
  emptyIconBox: 'w-10 h-10 rounded-2xl bg-stone-100 dark:bg-stone-800/80 border border-stone-200/60 dark:border-stone-700 mx-auto flex items-center justify-center text-stone-500 dark:text-stone-400',
  emptyTitle: 'text-stone-800 dark:text-stone-200 font-bold text-xs sm:text-sm',
  emptySub: 'text-stone-600 dark:text-stone-400 text-xs font-medium',
  notifItem:
    'p-3 rounded-2xl bg-stone-50/80 dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-800 hover:bg-white dark:hover:bg-stone-850 hover:border-amber-300 dark:hover:border-amber-500/50 hover:shadow-2xs transition-all text-left space-y-1.5 cursor-pointer group',
  notifItemTopRow: 'flex items-center justify-between gap-2',
  notifItemIconBox: 'w-6 h-6 rounded-lg bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-center flex-shrink-0',
  notifTypeBadgeBase: 'text-[0.56rem] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border',
  notifDateText: 'text-xs text-stone-600 dark:text-stone-400 font-semibold',
  notifTitle:
    'font-serif font-bold text-xs sm:text-sm text-stone-950 dark:text-stone-100 leading-snug group-hover:text-amber-900 dark:group-hover:text-amber-300 transition-colors',
  notifBody: 'text-xs text-stone-700 dark:text-stone-300 leading-relaxed line-clamp-2 font-medium',
  footer:
    'px-4 py-2.5 border-t border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/80 flex items-center justify-between text-[0.61rem] text-stone-500 dark:text-stone-400',
  footerBrand: 'flex items-center gap-1 font-serif font-bold text-stone-700 dark:text-stone-300',
  footerCloseBtn:
    'px-3 py-1 rounded-lg bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-bold transition-colors text-[0.61rem]',
};
