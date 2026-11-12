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
    'inline-flex items-center px-3 py-1 rounded-full backdrop-blur-md border text-label font-semibold max-w-[calc(100%-80px)] sm:max-w-none truncate',
  customizeBtn:
    'inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 hover:bg-white/30 active:scale-95 text-white rounded-xl text-xs font-bold border border-white/30 transition-all shadow-xs cursor-pointer z-20',
  heroTitleGroup: 'space-y-1.5',
  heroTitle: 'text-xl sm:text-3xl font-serif font-bold tracking-tight text-white leading-tight',
  heroSubtitleBox:
    'p-2.5 sm:p-3 rounded-2xl bg-black/35 border border-white/15 text-stone-100 text-xs sm:text-sm italic font-serif leading-relaxed max-w-2xl',
  heroDesc: 'text-xs sm:text-sm text-stone-100 font-medium leading-relaxed max-w-xl pt-0.5 whitespace-pre-line',
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
  quickGrid: 'grid grid-cols-3 gap-2.5 sm:gap-4',
  quickCard:
    'group flex flex-col items-center justify-center text-center p-3 sm:p-4 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#161412] border border-stone-200/80 dark:border-stone-800 shadow-2xs hover:shadow-xs hover:border-amber-300 dark:hover:border-amber-500/40 active:scale-95 transition-all cursor-pointer',
  quickIconEvents:
    'w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-800/40 flex items-center justify-center text-indigo-700 dark:text-indigo-400 mb-1 group-hover:scale-105 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-2xs',
  quickIconVerse:
    'w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-100 dark:border-amber-800/40 flex items-center justify-center text-amber-800 dark:text-amber-400 mb-1 group-hover:scale-105 group-hover:bg-amber-600 group-hover:text-white transition-all shadow-2xs',
  quickIconYouth:
    'w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-800/40 flex items-center justify-center text-emerald-700 dark:text-emerald-400 mb-1 group-hover:scale-105 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-2xs',
  quickIconSanctuary:
    'w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-stone-100 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/50 flex items-center justify-center text-stone-800 dark:text-stone-300 mb-1 group-hover:scale-105 group-hover:bg-stone-900 group-hover:text-white transition-all shadow-2xs',
  quickCardTitle: 'text-xs sm:text-sm font-bold text-stone-950 dark:text-stone-100 leading-snug tracking-tight',
  quickCardSub: 'text-caption sm:text-label text-stone-800 dark:text-stone-400 font-medium mt-0.5 line-clamp-1',
  upcomingSection: 'space-y-2.5',
  viewAllBtn: 'text-xs font-semibold text-amber-900 hover:text-amber-950 flex items-center gap-1',
  eventCardBase:
    'rounded-2xl p-3.5 sm:p-5 transition-all duration-150 space-y-3 w-full min-w-0 max-w-full overflow-hidden box-border cursor-pointer active:scale-[0.985] active:brightness-95 select-none',
  cardTopRow: 'flex flex-wrap items-center justify-between gap-1.5 min-w-0 w-full',
  badgeGroup: 'flex items-center gap-1.5 flex-wrap min-w-0',
  categoryBadgeBase: 'inline-flex items-center gap-1 text-label font-bold px-2.5 py-0.5 rounded-full',
  featuredBadge:
    'text-label font-bold uppercase tracking-wider text-amber-950 bg-amber-200/95 px-2.5 py-0.5 rounded-full',
  cardMainRow: 'flex items-start gap-3 sm:gap-3.5 min-w-0 w-full max-w-full',
  dateBoxBase:
    'flex-shrink-0 w-14 sm:w-16 py-2 px-1 text-center rounded-2xl shadow-2xs border border-stone-900/10 dark:border-stone-700/60 flex flex-col items-center justify-center select-none bg-white/95 dark:bg-stone-900/90 self-start',
  dateBoxWeekday:
    'block text-label font-bold uppercase tracking-wide leading-tight whitespace-nowrap text-stone-700 dark:text-stone-300',
  dateBoxDay: 'block text-xl sm:text-2xl font-bold text-stone-950 dark:text-stone-50 leading-none my-1',
  dateBoxMonthBase: 'block text-caption sm:text-label font-semibold uppercase tracking-wider leading-tight',
  cardTitleCol: 'flex-1 min-w-0 space-y-1.5 max-w-full',
  cardTitle: 'text-base sm:text-lg font-bold text-stone-950 dark:text-stone-50 leading-snug break-words',
  cardTimeRow: 'flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-stone-800 dark:text-stone-300',
  cardLocationRow: 'flex items-center gap-1.5 text-xs text-stone-700 dark:text-stone-400 font-medium',
  cardDesc: 'text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed font-normal pt-1 line-clamp-3 sm:line-clamp-4',
  cardFooterRow: 'pt-2.5 border-t border-stone-900/10 dark:border-stone-800 flex items-center justify-end gap-2 min-w-0 w-full',
  upcomingBtnsGroup: 'flex items-center gap-1.5 ml-auto',
  servicesCardHeader: 'flex items-center justify-between gap-2 pb-3 border-b border-stone-100 dark:border-stone-800',
  servicesUnifiedList:
    'divide-y divide-stone-100 sm:divide-y-0 sm:divide-x sm:grid sm:grid-cols-3 dark:divide-stone-800',
  serviceItemCol:
    'py-3 first:pt-0 last:pb-0 sm:py-0 sm:px-4 sm:first:pl-0 sm:last:pr-0 space-y-1.5',
  serviceCardTopRow: 'flex items-center justify-between gap-2 flex-wrap',
  serviceDayBadge:
    'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-500/30 text-amber-900 dark:text-amber-300 text-label font-bold',
  serviceHourText: 'text-xs font-bold text-stone-800 dark:text-stone-300',
  serviceTitle: 'text-sm font-serif font-bold text-stone-950 dark:text-stone-100 leading-snug pt-0.5',
  serviceDesc: 'text-xs text-stone-700 dark:text-stone-400 leading-relaxed font-medium',
  verseSection:
    'bg-gradient-to-r from-amber-50/70 via-stone-50 to-amber-50/40 dark:from-[#1b1510] dark:via-[#161310] dark:to-[#18140f] rounded-3xl border border-amber-200/60 dark:border-amber-500/25 p-4 sm:p-5 shadow-2xs space-y-2.5',
  verseLabel: 'text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-400 flex items-center gap-1.5',
  verseRef: 'text-xs sm:text-sm font-bold text-amber-950 dark:text-amber-300',
  verseQuote: 'font-serif italic text-xs sm:text-sm text-stone-900 dark:text-stone-100 leading-relaxed font-medium',
  verseFooter: 'pt-1 flex items-center justify-between',
  verseTrans: 'text-xs text-stone-700 dark:text-stone-400 font-semibold',
  verseReadBtn: 'text-xs font-bold text-amber-900 hover:text-amber-950 flex items-center gap-1',
  // Contact card (last card on Home): address, phone, email, worship hours, socials.
  contactCard: 'space-y-4',
  contactHeader: 'flex items-center justify-between gap-2',
  contactHeaderLabel:
    'text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-400 flex items-center gap-1.5',
  contactEditBtn:
    'p-1 rounded-lg text-stone-500 hover:text-amber-800 hover:bg-stone-100 dark:hover:text-amber-300 dark:hover:bg-stone-800 transition-colors cursor-pointer',
  contactList: 'space-y-3',
  contactRow: 'flex items-start gap-3 min-w-0',
  contactIconChip:
    'w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-500/25 flex items-center justify-center text-amber-700 dark:text-amber-400 flex-shrink-0',
  contactTextCol: 'min-w-0 space-y-0.5 flex-1',
  contactLabel: 'text-caption font-bold uppercase tracking-wider text-stone-700 dark:text-stone-400 block',
  contactValue: 'text-xs font-semibold text-stone-900 dark:text-stone-100 leading-snug break-words',
  contactValueLink:
    'text-xs font-semibold text-stone-900 dark:text-stone-100 leading-snug break-words hover:text-amber-800 dark:hover:text-amber-300 transition-colors',
  contactDirections: 'pt-1.5 flex flex-wrap items-center gap-2',
  contactDivider: 'border-t border-stone-100 dark:border-stone-800',
  contactSocials: 'space-y-2',
  contactSocialLabel: 'text-caption font-bold uppercase tracking-wider text-stone-700 dark:text-stone-400',
  socialCircles: 'flex items-center gap-2.5',
  socialCircleYoutube:
    'w-11 h-11 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-all active:scale-95 cursor-pointer flex-shrink-0',
  socialCircleFacebook:
    'w-11 h-11 rounded-full bg-[#1877F2] hover:bg-[#166fe5] flex items-center justify-center transition-all active:scale-95 cursor-pointer flex-shrink-0',
  socialCircleIcon: 'w-5 h-5 text-white flex-shrink-0',
};
