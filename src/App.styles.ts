export const appStyles = {
  pageWrapper:
    'min-h-screen bg-[#FDFCFB] dark:bg-[#0c0a09] text-stone-900 dark:text-stone-100 flex flex-col font-sans selection:bg-amber-100 selection:text-amber-900 pb-20 md:pb-6 w-full max-w-full overflow-x-hidden min-w-0',
  heroSection:
    'bg-white dark:bg-[#161412] border-b border-stone-200/60 dark:border-stone-800 pt-[calc(4.75rem+env(safe-area-inset-top,0px))] sm:pt-28 pb-6 sm:pb-9 px-4 sm:px-6',
  heroInner: 'max-w-4xl mx-auto text-center space-y-3 sm:space-y-3.5',
  locationPill:
    'inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 dark:bg-stone-900 text-stone-700 dark:text-stone-300 text-[11px] sm:text-xs font-semibold tracking-wide border border-stone-200/60 dark:border-stone-800',
  locationIcon: 'w-3.5 h-3.5 text-amber-600 dark:text-amber-400',
  titleWrapper: 'space-y-0.5 sm:space-y-1 pt-0.5',
  homeBannerImg: 'w-full h-auto object-contain',
  heroTitle:
    'text-xl sm:text-4xl lg:text-5xl font-serif font-bold text-stone-950 dark:text-stone-50 tracking-tight leading-tight',
  heroSubtitle: 'text-stone-700 dark:text-stone-300 font-medium text-xs sm:text-sm max-w-lg mx-auto leading-relaxed',
  heroVerseWrapper: 'relative max-w-xl mx-auto flex flex-col items-center justify-center gap-1.5 group px-3',
  heroVerseQuote:
    'font-serif italic text-stone-800 dark:text-stone-200 text-xs sm:text-sm leading-relaxed text-center break-words max-w-lg',
  heroVerseRef: 'block font-sans not-italic text-[11px] sm:text-xs font-semibold tracking-wide text-amber-800 dark:text-amber-400 text-center mt-1',
  heroVerseEditBtn:
    'inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 dark:text-amber-300 hover:text-amber-950 dark:hover:text-amber-200 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200/80 dark:border-amber-800/80 px-2.5 py-0.5 rounded-full transition-all mt-0.5 cursor-pointer active:scale-95 shadow-2xs',
  adminBtnWrapper: 'pt-1.5 sm:pt-2 flex items-center justify-center',
  adminBtn:
    'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-semibold text-xs shadow-xs transition-all cursor-pointer',
  adminBtnIcon: 'w-3.5 h-3.5 text-amber-200 flex-shrink-0',
  desktopNav:
    'hidden md:flex items-center w-fit mx-auto bg-stone-100/80 dark:bg-stone-900/80 p-1 rounded-2xl border border-stone-200/60 dark:border-stone-800 mt-2 sm:mt-3',
  desktopNavItemBase:
    'flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all',
  desktopNavItemActive: 'bg-white dark:bg-[#161412] text-stone-950 dark:text-stone-50 shadow-xs border border-stone-200/60 dark:border-stone-700',
  desktopNavItemInactive: 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100',
  desktopNavIcon: 'w-3.5 h-3.5 opacity-75',
  mainContent: 'flex-1 w-full max-w-full overflow-x-clip min-w-0',
  desktopFooter:
    'hidden md:block bg-white border-t border-stone-200/80 py-8 px-4 text-stone-600 text-xs font-medium',
  footerTopRow: 'max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4',
  footerBrandGroup: 'flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2',
  footerBrandEn: 'font-serif font-bold text-stone-900 text-sm flex items-center gap-1.5',
  footerBrandDivider: 'hidden sm:inline text-stone-400',
  footerBrandVi: 'text-stone-700 text-xs font-semibold',
  footerLinksGroup: 'flex items-center gap-4 text-xs font-semibold text-stone-700',
  footerLinkBtn: 'hover:text-stone-950 transition-colors',
  footerBottomRow:
    'max-w-4xl mx-auto mt-4 pt-4 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-stone-600 text-[11px] font-medium',
  footerMetaRight: 'flex items-center gap-2',
  footerDot: 'text-stone-300',
  footerVersion: 'text-stone-500 font-mono text-[10px]',
  mobileVersionBar: 'md:hidden py-3 text-center text-[10px] text-stone-500 font-mono select-none',
  floatingPrayerBtn:
    'fixed bottom-[84px] sm:bottom-10 right-3.5 sm:right-6 z-40 group flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-full bg-stone-900/65 hover:bg-stone-900/80 active:scale-95 text-amber-100 border border-white/20 backdrop-blur-md shadow-xl transition-all cursor-pointer select-none animate-in fade-in zoom-in-95 duration-200',
  floatingPrayerIconBox:
    'w-6 h-6 rounded-full bg-amber-500/25 flex items-center justify-center text-amber-300 group-hover:bg-amber-500/35 transition-colors',
  floatingPrayerIcon: 'w-3.5 h-3.5',
  floatingPrayerText: 'text-xs sm:text-sm font-bold tracking-tight text-white/95 drop-shadow-xs',
  lazyFallback: 'flex items-center justify-center py-16 text-sm font-semibold text-stone-500',
};
