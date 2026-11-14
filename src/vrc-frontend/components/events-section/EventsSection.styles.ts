export const eventsSectionStyles = {
  section:
    'py-6 sm:py-12 px-3.5 max-sm:[.large-font_&]:px-2.5 sm:px-6 max-w-4xl mx-auto space-y-4 sm:space-y-6 animate-in fade-in duration-300 w-full min-w-0 overflow-x-clip box-border',
  headerRow: 'flex items-center justify-between gap-3 min-w-0 w-full',
  headerSubtitle: 'text-caption sm:text-label font-bold uppercase tracking-widest text-amber-700 block mb-0.5',
  headerTitle: 'text-2xl sm:text-3xl max-sm:[.large-font_&]:text-xl font-serif font-bold text-stone-900 break-words',
  labelFull: 'max-sm:[.large-font_&]:hidden',
  labelShort: 'hidden max-sm:[.large-font_&]:inline',
  addEventBtn:
    'w-8 h-8 rounded-xl bg-stone-950 hover:bg-stone-800 active:scale-95 text-amber-400 flex items-center justify-center shadow-xs transition-all flex-shrink-0',
  searchWrapper: 'relative w-full min-w-0',
  searchIcon: 'w-4 h-4 text-stone-500 dark:text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none',
  searchInput:
    'w-full max-w-full box-border pl-10 pr-4 py-2.5 bg-stone-100 hover:bg-stone-100/90 dark:bg-stone-900 dark:hover:bg-stone-850 border border-stone-300 dark:border-stone-700 rounded-2xl text-xs sm:text-sm text-stone-950 dark:text-stone-50 placeholder:text-stone-700 dark:placeholder:text-stone-400 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:bg-white dark:focus:bg-stone-850 transition-all shadow-2xs',
  emptyBox: 'py-12 sm:py-16 text-center bg-white dark:bg-[#161412] rounded-3xl border border-stone-200/70 dark:border-stone-800 p-8 shadow-sm',
  emptyTitle: 'font-serif font-bold text-stone-900 dark:text-stone-100 text-base',
  emptySub: 'text-stone-700 dark:text-stone-400 text-xs mt-1',
  listContainer: 'space-y-4',
  eventCardBase:
    'rounded-2xl p-3.5 max-sm:[.large-font_&]:p-3 sm:p-4 transition-all duration-150 space-y-2.5 w-full min-w-0 max-w-full overflow-hidden box-border cursor-pointer active:scale-[0.985] active:brightness-95 select-none shadow-sm',
  cardTopRow: 'flex flex-wrap items-center justify-between gap-1.5 min-w-0 w-full',
  badgeGroup: 'flex items-center gap-1.5 flex-wrap min-w-0',
  categoryBadgeBase: 'inline-flex items-center gap-1 text-label font-bold px-2.5 py-0.5 rounded-full',
  featuredBadge:
    'inline-flex items-center gap-1 text-label font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/60 shadow-2xs',
  adminActionRow: 'flex items-center gap-1.5 ml-auto',
  cardMainRow: 'flex items-start gap-3 max-sm:[.large-font_&]:gap-2.5 sm:gap-3.5 min-w-0 w-full max-w-full',
  dateBoxBase:
    'flex-shrink-0 w-14 max-sm:[.large-font_&]:w-12 sm:w-16 py-2 max-sm:[.large-font_&]:py-1.5 px-1 text-center rounded-2xl shadow-2xs border border-stone-900/10 dark:border-stone-700/60 flex flex-col items-center justify-center select-none bg-white/95 dark:bg-stone-900/90 relative self-start',
  dateBoxWeekday:
    'block text-label max-sm:[.large-font_&]:text-[11px] font-bold uppercase tracking-wide leading-tight whitespace-nowrap text-stone-700 dark:text-stone-300',
  dateBoxDay: 'block text-xl sm:text-2xl max-sm:[.large-font_&]:text-lg font-bold text-stone-950 dark:text-stone-50 leading-none my-1',
  dateBoxMonthBase: 'block text-caption sm:text-label max-sm:[.large-font_&]:text-[11px] font-semibold uppercase tracking-wider leading-tight',
  dateBoxStarPosition: 'absolute -top-2 -right-2 z-10',
  cardRightCol: 'flex-1 min-w-0 max-w-full flex flex-col gap-1',
  cardTitle: 'text-base sm:text-lg font-bold text-stone-950 dark:text-stone-50 leading-snug break-words',
  cardTimeRow: 'flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-stone-800 dark:text-stone-300',
  cardLocationRow: 'flex items-center gap-1.5 text-xs sm:text-sm font-medium text-stone-700 dark:text-stone-300 truncate',
  cardFooterRow: 'pt-2.5 border-t border-stone-900/10 dark:border-stone-800 flex flex-wrap items-center justify-end gap-2 min-w-0 w-full',
  pastSection:
    'pt-8 sm:pt-10 border-t border-stone-200 dark:border-stone-800 space-y-4 w-full min-w-0 max-w-full overflow-hidden',
  pastHeaderRow: 'flex flex-wrap items-center justify-between gap-2 min-w-0 w-full',
  pastLabel: 'inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-stone-800 dark:text-stone-400',
  pastSub: 'text-xs text-stone-700 dark:text-stone-400',
  pastCountBadge:
    'text-label font-bold px-2.5 py-1 rounded-full bg-stone-100 dark:bg-stone-850 text-stone-800 dark:text-stone-300 border border-stone-200 dark:border-stone-800 whitespace-nowrap',
  pastCard:
    'rounded-2xl p-3.5 max-sm:[.large-font_&]:p-3 sm:p-4 space-y-2.5 w-full min-w-0 max-w-full overflow-hidden box-border select-none border border-stone-200/80 dark:border-stone-800 bg-stone-100/70 dark:bg-[#161412] opacity-75 cursor-default',
  pastCategoryPill:
    'inline-flex items-center gap-1 text-label font-bold px-2.5 py-0.5 rounded-full bg-stone-200/80 dark:bg-stone-800 text-stone-700 dark:text-stone-300',
  concludedPill:
    'inline-flex items-center gap-1 text-label font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/50',
  pastDateBox:
    'flex-shrink-0 w-14 max-sm:[.large-font_&]:w-12 sm:w-16 py-2 max-sm:[.large-font_&]:py-1.5 px-1 text-center rounded-2xl shadow-2xs border border-stone-300/70 dark:border-stone-800 flex flex-col items-center justify-center select-none bg-stone-200/60 dark:bg-stone-900/90 self-start',
  pastDateBoxWeekday:
    'block text-label max-sm:[.large-font_&]:text-[11px] font-bold uppercase tracking-wide leading-tight whitespace-nowrap text-stone-700 dark:text-stone-400',
  pastDateBoxDay:
    'block text-xl sm:text-2xl max-sm:[.large-font_&]:text-lg font-bold text-stone-900 dark:text-stone-300 leading-none my-1',
  pastDateBoxMonth:
    'block text-caption sm:text-label max-sm:[.large-font_&]:text-[11px] font-semibold uppercase tracking-wider leading-tight text-stone-700 dark:text-stone-400',
  pastTitle: 'text-base sm:text-lg font-bold text-stone-900 dark:text-stone-300 leading-snug break-words',
  pastTimeRow: 'flex items-center gap-1.5 text-xs sm:text-sm font-medium text-stone-800 dark:text-stone-400',
  pastLocationRow: 'flex items-center gap-1.5 text-xs sm:text-sm font-medium text-stone-800 dark:text-stone-400 truncate',
  detailMetaCard: 'space-y-2.5 text-xs sm:text-sm text-stone-700 dark:text-stone-300 bg-stone-50 dark:bg-stone-900 p-4 rounded-2xl border border-stone-200/70 dark:border-stone-800',
  detailGoogleBtn:
    'inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 active:scale-95 text-white text-label font-bold shadow-2xs transition-all',
  detailAppleBtn:
    'inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-700 hover:bg-amber-800 active:scale-95 text-white text-label font-bold shadow-2xs transition-all',
  detailFooterGrid: 'pt-3 border-t border-stone-200 dark:border-stone-800 grid grid-cols-2 gap-2.5',
  detailGcalBtn:
    'inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-stone-950 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-all',
  detailIcalBtn:
    'inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 rounded-xl text-xs font-bold transition-all',
};
