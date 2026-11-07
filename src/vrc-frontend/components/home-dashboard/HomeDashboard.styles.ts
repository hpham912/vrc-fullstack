export const homeDashboardStyles = {
  container:
    'py-4 sm:py-8 px-3.5 sm:px-6 max-w-4xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-300',
  heroBannerBase:
    'relative overflow-hidden text-white rounded-3xl p-5 sm:p-8 transition-all',
  glowTopRight: 'absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 rounded-full blur-3xl pointer-events-none',
  glowBottomLeft: 'absolute bottom-0 left-0 -mb-8 -ml-8 w-48 h-48 rounded-full blur-3xl pointer-events-none',
  heroContent: 'relative z-10 space-y-3.5',
  heroTopRow: 'flex items-center justify-between gap-2',
  heroBadgeBase:
    'inline-flex items-center px-3 py-1 rounded-full backdrop-blur-md border text-[11px] font-semibold max-w-[calc(100%-80px)] sm:max-w-none truncate',
  customizeBtn:
    'inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 hover:bg-white/30 active:scale-95 text-white rounded-xl text-xs font-bold border border-white/30 transition-all shadow-xs cursor-pointer z-20',
  heroTitleGroup: 'space-y-1.5',
  heroTitle: 'text-xl sm:text-3xl font-serif font-bold tracking-tight text-white leading-tight',
  heroSubtitleBox:
    'p-2.5 sm:p-3 rounded-2xl bg-black/35 border border-white/15 text-stone-100 text-xs sm:text-sm italic font-serif leading-relaxed max-w-2xl',
  heroDesc: 'text-xs sm:text-sm text-stone-100 font-medium leading-relaxed max-w-xl pt-0.5',
  metaChipsRow: 'flex flex-wrap items-center gap-2 pt-0.5 text-xs text-stone-100 font-semibold',
  metaChip: 'inline-flex items-center gap-1.5 bg-black/30 px-3 py-1 rounded-xl border border-white/15',
  metaChipIcon: 'w-3.5 h-3.5 text-amber-400',
  actionBtnsRow: 'pt-2 flex flex-wrap items-center gap-2.5',
  primaryBtnBase:
    'inline-flex items-center gap-2 px-4 py-2.5 active:scale-95 text-xs font-bold rounded-xl transition-all shadow-md',
  secondaryBtn:
    'inline-flex items-center gap-2 px-4 py-2.5 bg-white/15 hover:bg-white/25 active:scale-95 text-white text-xs font-semibold rounded-xl border border-white/25 transition-all shadow-sm cursor-pointer',
  quickHubSection: 'space-y-3',
  sectionHeaderRow: 'flex items-center justify-between',
  sectionHeading: 'text-base sm:text-lg font-serif font-bold text-stone-950 flex items-center gap-2',
  sectionSubHint: 'text-xs text-stone-600 font-semibold',
  quickGrid: 'grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5',
  quickCard:
    'flex flex-col text-left p-3.5 sm:p-4 rounded-2xl bg-white border border-stone-200 shadow-2xs hover:shadow-xs hover:border-amber-300 active:scale-95 transition-all group cursor-pointer',
  quickIconEvents:
    'w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 mb-2.5 group-hover:bg-indigo-600 group-hover:text-white transition-colors',
  quickIconVerse:
    'w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-800 mb-2.5 group-hover:bg-amber-600 group-hover:text-white transition-colors',
  quickIconYouth:
    'w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 mb-2.5 group-hover:bg-emerald-600 group-hover:text-white transition-colors',
  quickIconSanctuary:
    'w-9 h-9 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-800 mb-2.5 group-hover:bg-stone-900 group-hover:text-white transition-colors',
  quickCardTitle: 'text-xs sm:text-sm font-bold text-stone-950 leading-snug',
  quickCardSub: 'text-xs text-stone-700 font-semibold mt-0.5 line-clamp-1',
  upcomingSection: 'space-y-2.5',
  viewAllBtn: 'text-xs font-semibold text-amber-800 hover:text-amber-900 flex items-center gap-1',
  eventCardBase:
    'rounded-2xl p-3.5 sm:p-4 transition-all duration-150 space-y-2.5 w-full min-w-0 max-w-full overflow-hidden box-border cursor-pointer active:scale-[0.985] active:brightness-95 select-none',
  cardTopRow: 'flex flex-wrap items-center justify-between gap-1.5 min-w-0 w-full',
  badgeGroup: 'flex items-center gap-1.5 flex-wrap min-w-0',
  categoryBadgeBase: 'inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full',
  featuredBadge:
    'text-[11px] font-bold uppercase tracking-wider text-amber-950 bg-amber-200/95 px-2.5 py-0.5 rounded-full',
  cardMainRow: 'flex items-center gap-3 sm:gap-3.5 min-w-0 w-full max-w-full',
  dateBoxBase:
    'flex-shrink-0 w-[5.5rem] px-2 py-1.5 text-center rounded-2xl shadow-2xs border border-stone-900/10 flex flex-col items-center justify-center select-none bg-white/95',
  dateBoxWeekday:
    'block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider leading-tight truncate w-full text-stone-700',
  dateBoxDay: 'block text-xl sm:text-2xl font-bold text-stone-950 leading-none my-0.5',
  dateBoxMonthBase: 'block text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider leading-tight',
  cardTitleCol: 'flex-1 min-w-0 space-y-1 max-w-full',
  cardTitle: 'text-base sm:text-lg font-bold text-stone-950 leading-snug break-words',
  cardTimeRow: 'flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-stone-800',
  cardLocationRow: 'flex items-center gap-1.5 text-xs text-stone-700 font-medium',
  cardFooterRow: 'pt-2 border-t border-stone-900/10 flex items-center justify-between gap-2 min-w-0 w-full flex-wrap',
  upcomingBtnsGroup: 'flex items-center gap-1.5 ml-auto',
  servicesCardHeader: 'flex items-center justify-between gap-2 pb-3 border-b border-stone-100',
  servicesUnifiedList:
    'divide-y divide-stone-100 sm:divide-y-0 sm:divide-x sm:grid sm:grid-cols-3',
  serviceItemCol:
    'py-3 first:pt-0 last:pb-0 sm:py-0 sm:px-4 sm:first:pl-0 sm:last:pr-0 space-y-1.5',
  serviceCardTopRow: 'flex items-center justify-between gap-2 flex-wrap',
  serviceDayBadge:
    'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200/80 text-amber-900 text-[11px] font-bold',
  serviceHourText: 'text-xs font-bold text-stone-800',
  serviceTitle: 'text-sm font-serif font-bold text-stone-950 leading-snug pt-0.5',
  serviceDesc: 'text-xs text-stone-700 leading-relaxed font-medium',
  verseSection:
    'bg-gradient-to-r from-amber-50/70 via-stone-50 to-amber-50/40 rounded-3xl border border-amber-200/60 p-4 sm:p-5 shadow-2xs space-y-2.5',
  verseLabel: 'text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5',
  verseRef: 'text-xs sm:text-sm font-bold text-amber-950',
  verseQuote: 'font-serif italic text-xs sm:text-sm text-stone-900 leading-relaxed font-medium',
  verseFooter: 'pt-1 flex items-center justify-between',
  verseTrans: 'text-xs text-stone-700 font-semibold',
  verseReadBtn: 'text-xs font-bold text-amber-800 hover:text-amber-950 flex items-center gap-1',
  sanctuaryCard: 'bg-white rounded-3xl border border-stone-200 p-4 sm:p-5 shadow-xs',
  sanctuaryRow: 'flex flex-col sm:flex-row sm:items-center justify-between gap-3',
  sanctuaryNameRow: 'flex items-center gap-2',
  sanctuaryTitle: 'font-serif font-bold text-base sm:text-lg text-stone-950 leading-tight',
  sanctuaryEditBtn:
    'p-1 rounded-lg text-stone-500 hover:text-amber-800 hover:bg-stone-100 transition-colors cursor-pointer',
  sanctuaryAddress: 'text-xs sm:text-sm text-stone-700 font-medium flex items-center gap-1.5',
  sanctuaryActions: 'flex items-center gap-2 self-start sm:self-auto flex-wrap',
  googleDirBtn:
    'inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-stone-900 hover:bg-stone-800 active:scale-95 text-white font-medium text-xs shadow-2xs transition-all',
  appleDirBtn:
    'inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-800 hover:to-amber-900 active:scale-95 text-white font-medium text-xs shadow-2xs transition-all',
  socialDivider: 'h-4 w-px bg-stone-200 mx-0.5 hidden sm:block',
  youtubeCircleBtn:
    'w-8 h-8 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-xs active:scale-90 transition-all cursor-pointer',
  facebookCircleBtn:
    'w-8 h-8 rounded-full bg-[#1877F2] hover:bg-[#166fe5] text-white flex items-center justify-center shadow-xs active:scale-90 transition-all cursor-pointer',
};
