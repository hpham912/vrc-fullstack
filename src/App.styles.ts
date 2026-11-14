export const appStyles = {
  pageWrapper:
    'min-h-screen bg-[#FDFCFB] dark:bg-[#0c0a09] text-stone-900 dark:text-stone-100 flex flex-col font-sans selection:bg-amber-100 selection:text-amber-900 pb-20 md:pb-6 w-full max-w-full overflow-x-hidden min-w-0',
  // Pull-to-refresh bar: the shared Loading (spinner + refresh text)
  // shown in the gap below the fixed header while the user drags the
  // content down. It stays fixed there; the content sliding down is
  // what reveals it.
  pullRefreshBar:
    'fixed left-0 right-0 top-[calc(3.5rem+env(safe-area-inset-top,0px))] z-40 flex items-center justify-center py-3 pointer-events-none',
  heroSection:
    'border-b border-stone-200/60 dark:border-stone-800 pt-[calc(4.75rem+env(safe-area-inset-top,0px))] sm:pt-28 pb-6 max-sm:[.large-font_&]:pb-5 sm:pb-9 px-4 max-sm:[.large-font_&]:px-3 sm:px-6',
  // Nav-only hero (non-Home tab, no admin): on mobile it is just enough
  // top padding to clear the fixed header (56px + safe area) — no extra
  // gap, and the content is not cut off under the header. On desktop it
  // keeps the full padding so the segmented nav sits below the header.
  heroSectionNavOnly:
    'sm:border-b sm:border-stone-200/60 dark:sm:border-stone-800 px-4 max-sm:[.large-font_&]:px-3 sm:px-6 pt-[calc(3.5rem+env(safe-area-inset-top,0px))] pb-0 sm:pt-28 sm:pb-9',
  heroInner: 'max-w-4xl mx-auto text-center space-y-3 max-sm:[.large-font_&]:space-y-2.5 sm:space-y-3.5',
  locationPill:
    'inline-flex flex-wrap items-center justify-center gap-1.5 max-w-full px-3 max-sm:[.large-font_&]:px-2.5 py-1 rounded-full bg-stone-100 dark:bg-stone-900 text-stone-700 dark:text-stone-300 text-label max-sm:[.large-font_&]:text-[13px] sm:text-xs font-semibold tracking-wide border border-stone-200/60 dark:border-stone-800 text-center',
  locationIcon: 'w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0',
  labelFull: 'max-sm:[.large-font_&]:hidden',
  labelShort: 'hidden max-sm:[.large-font_&]:inline',
  titleWrapper: 'space-y-0.5 sm:space-y-1 pt-0.5',
  homeBannerImg: 'w-full h-auto object-contain',
  heroTitle:
    'text-xl sm:text-4xl lg:text-5xl font-serif font-bold text-stone-950 dark:text-stone-50 tracking-tight leading-tight',
  heroSubtitle: 'text-stone-700 dark:text-stone-300 font-medium text-xs sm:text-sm max-w-lg mx-auto leading-relaxed',
  heroVerseWrapper: 'relative max-w-xl mx-auto flex flex-col items-center justify-center gap-1.5 group px-3',
  heroVerseQuote:
    'font-serif italic text-stone-800 dark:text-stone-200 text-xs sm:text-sm leading-relaxed text-center break-words max-w-lg',
  heroVerseRef: 'block font-sans not-italic text-label sm:text-xs font-semibold tracking-wide text-amber-800 dark:text-amber-400 text-center mt-1',
  heroVerseEditBtn:
    'inline-flex items-center gap-1 text-label font-semibold text-amber-800 dark:text-amber-300 hover:text-amber-950 dark:hover:text-amber-200 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200/80 dark:border-amber-800/80 px-2.5 py-0.5 rounded-full transition-all mt-0.5 cursor-pointer active:scale-95 shadow-2xs',
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
    'hidden md:block border-t border-stone-200/80 py-8 px-4 text-stone-600 text-xs font-medium',
  footerTopRow: 'max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4',
  footerBrandGroup: 'flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2',
  footerBrandEn: 'font-serif font-bold text-stone-900 text-sm flex items-center gap-1.5',
  footerBrandDivider: 'hidden sm:inline text-stone-400',
  footerBrandVi: 'text-stone-700 text-xs font-semibold',
  footerLinksGroup: 'flex items-center gap-4 text-xs font-semibold text-stone-700',
  footerLinkBtn: 'hover:text-stone-950 transition-colors',
  footerBottomRow:
    'max-w-4xl mx-auto mt-4 pt-4 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-stone-800 text-label font-medium',
  footerMetaRight: 'flex items-center gap-2',
  footerVersion: 'text-stone-700 font-mono text-caption',
  mobileVersionBar: 'md:hidden py-3 text-center text-caption text-stone-700 font-mono select-none',
  floatingPrayerBtn:
    'fixed bottom-[100px] sm:bottom-14 right-3.5 sm:right-6 z-40 group flex items-center gap-2 max-sm:[.large-font_&]:gap-1.5 px-3.5 py-2 max-sm:[.large-font_&]:px-3 max-sm:[.large-font_&]:py-1.5 sm:px-4 sm:py-2.5 rounded-full bg-stone-900/65 hover:bg-stone-900/80 active:scale-95 text-amber-100 border border-white/20 backdrop-blur-md shadow-xl transition-all cursor-pointer select-none animate-in fade-in zoom-in-95 duration-200',
  floatingPrayerIconBox:
    'w-6 h-6 rounded-full bg-amber-500/25 flex items-center justify-center text-amber-300 group-hover:bg-amber-500/35 transition-colors',
  floatingPrayerIcon: 'w-3.5 h-3.5',
  floatingPrayerText: 'text-xs sm:text-sm max-sm:[.large-font_&]:text-[13px] font-bold tracking-tight text-white/95 drop-shadow-xs',
  lazyFallback: 'flex items-center justify-center py-16 text-sm font-semibold text-stone-500',
};
