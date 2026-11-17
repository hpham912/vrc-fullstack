export const appHeroStyles = {
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
  heroVerseWrapper: 'relative max-w-xl mx-auto flex flex-col items-center justify-center gap-1.5 group px-3',
  heroVerseQuote:
    'font-serif italic text-stone-800 dark:text-stone-200 text-xs sm:text-sm leading-relaxed text-center break-words max-w-lg',
  heroVerseRef: 'block font-sans not-italic text-label sm:text-xs font-semibold tracking-wide text-amber-800 dark:text-amber-400 text-center mt-1',
  heroVerseEditBtn:
    'inline-flex items-center gap-1 text-label font-semibold text-amber-800 dark:text-amber-300 hover:text-amber-950 dark:hover:text-amber-200 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200/80 dark:border-amber-800/80 px-2.5 py-0.5 rounded-full transition-all mt-0.5 cursor-pointer active:scale-95 shadow-2xs',
  adminBtnWrapper: 'pt-1.5 sm:pt-2 flex items-center justify-center',
  adminBtnIcon: 'w-3.5 h-3.5 text-amber-200 flex-shrink-0',
  desktopNav:
    'hidden md:flex items-center w-fit mx-auto bg-stone-100/80 dark:bg-stone-900/80 p-1 rounded-2xl border border-stone-200/60 dark:border-stone-800 mt-2 sm:mt-3',
  desktopNavItemBase:
    'flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all',
  desktopNavItemActive: 'bg-white dark:bg-[#161412] text-stone-950 dark:text-stone-50 shadow-xs border border-stone-200/60 dark:border-stone-700',
  desktopNavItemInactive: 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100',
  desktopNavIcon: 'w-3.5 h-3.5 opacity-75',
};
