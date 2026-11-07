export const eventsSectionStyles = {
  section:
    'py-4 sm:py-8 px-3.5 sm:px-6 max-w-4xl mx-auto space-y-4 sm:space-y-6 animate-in fade-in duration-300 w-full min-w-0 max-w-full overflow-x-clip box-border',
  headerRow: 'flex items-center justify-between gap-3 min-w-0 w-full',
  headerSubtitle: 'text-xs font-bold uppercase tracking-wider text-amber-800 block',
  headerTitle: 'text-xl sm:text-3xl font-serif font-bold text-stone-950 tracking-tight truncate',
  addEventBtn:
    'w-8 h-8 rounded-xl bg-stone-950 hover:bg-stone-800 active:scale-95 text-amber-400 flex items-center justify-center shadow-xs transition-all flex-shrink-0',
  searchWrapper: 'relative w-full min-w-0',
  searchIcon: 'w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none',
  searchInput:
    'w-full max-w-full box-border pl-10 pr-4 py-2.5 bg-stone-100 hover:bg-stone-100/90 border border-stone-300 rounded-2xl text-xs sm:text-sm text-stone-950 placeholder:text-stone-500 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:bg-white transition-all shadow-2xs',
  filterRow: 'flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none py-1 px-0.5 w-full max-w-full',
  filterPillBase:
    'flex items-center gap-1.5 py-1.5 px-3.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 active:scale-95 flex-shrink-0',
  filterPillActive: 'bg-stone-950 text-white shadow-xs ring-2 ring-stone-950/20',
  filterPillInactive: 'bg-white text-stone-700 hover:text-stone-950 border border-stone-300 shadow-2xs hover:bg-stone-50',
  emptyBox: 'py-12 sm:py-16 text-center bg-white rounded-3xl border border-stone-200/70 p-8 shadow-xs',
  emptyTitle: 'font-serif font-bold text-stone-900 text-base',
  emptySub: 'text-stone-500 text-xs mt-1',
  listContainer: 'space-y-4',
  eventCardBase:
    'rounded-2xl p-3.5 sm:p-4 transition-all duration-150 space-y-2.5 w-full min-w-0 max-w-full overflow-hidden box-border cursor-pointer active:scale-[0.985] active:brightness-95 select-none',
  cardTopRow: 'flex flex-wrap items-center justify-between gap-1.5 min-w-0 w-full',
  badgeGroup: 'flex items-center gap-1.5 flex-wrap min-w-0',
  categoryBadgeBase: 'inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full',
  adminActionRow: 'flex items-center gap-1.5 ml-auto',
  cardMainRow: 'flex items-stretch gap-3 sm:gap-3.5 min-w-0 w-full max-w-full',
  dateBoxBase:
    'flex-shrink-0 px-2 py-1.5 text-center rounded-2xl shadow-2xs border border-stone-900/10 flex flex-col items-center justify-center select-none bg-white/95 relative self-stretch',
  dateBoxWeekday:
    'block text-xs font-bold uppercase tracking-wider leading-tight whitespace-nowrap text-stone-700',
  dateBoxDay: 'block text-3xl font-bold text-stone-950 leading-none my-0.5',
  dateBoxMonthBase: 'block text-xs font-semibold uppercase tracking-wider leading-tight',
  dateBoxStarPosition: 'absolute -top-2 -right-2 z-10',
  cardRightCol: 'flex-1 min-w-0 max-w-full flex flex-col gap-1',
  cardMenuRow: 'mt-auto pt-2 flex items-center justify-end',
  cardTitle: 'text-base sm:text-lg font-bold text-stone-950 leading-snug break-words',
  cardTimeRow: 'flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-stone-800',
  cardFooterRow: 'pt-2 border-t border-stone-900/10 flex items-center justify-end gap-2 min-w-0 w-full',
  pastSection:
    'pt-8 sm:pt-10 border-t border-stone-200 space-y-4 w-full min-w-0 max-w-full overflow-hidden',
  pastHeaderRow: 'flex flex-wrap items-center justify-between gap-2 min-w-0 w-full',
  pastLabel: 'inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-stone-600',
  pastSub: 'text-xs text-stone-500',
  pastCountBadge:
    'text-[11px] font-bold px-2.5 py-1 rounded-full bg-stone-100 text-stone-600 border border-stone-200 whitespace-nowrap',
  pastCard:
    'rounded-2xl border border-stone-200 bg-stone-50/80 p-4 sm:p-5 space-y-2.5 transition-all opacity-85 hover:opacity-100 hover:bg-stone-50 w-full min-w-0 max-w-full overflow-hidden box-border',
  pastCategoryPill:
    'inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-200 text-stone-700',
  concludedPill:
    'inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200',
  pastDateBox:
    'flex-shrink-0 px-2 py-1.5 text-center rounded-2xl border border-stone-200 bg-white shadow-2xs flex flex-col items-center justify-center select-none',
  pastTitle: 'text-sm sm:text-base font-bold text-stone-800 leading-snug break-words',
  pastDescBox:
    'text-xs text-stone-600 leading-relaxed bg-white/70 p-2.5 rounded-xl border border-stone-200/50 min-w-0 max-w-full overflow-hidden',
  detailModalBody: 'p-6 space-y-4',
  detailMetaCard: 'space-y-2.5 text-xs sm:text-sm text-stone-700 bg-stone-50 p-4 rounded-2xl border border-stone-200/70',
  detailGoogleBtn:
    'inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 active:scale-95 text-white text-[11px] font-bold shadow-2xs transition-all',
  detailAppleBtn:
    'inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-700 hover:bg-amber-800 active:scale-95 text-white text-[11px] font-bold shadow-2xs transition-all',
  detailFooterGrid: 'pt-3 border-t border-stone-200 grid grid-cols-2 gap-2.5',
  detailGcalBtn:
    'inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-stone-950 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-all',
  detailIcalBtn:
    'inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold transition-all',
};
