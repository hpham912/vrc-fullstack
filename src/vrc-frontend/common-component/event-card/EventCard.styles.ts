// Event-specific styles for the EventCard (the generic layout lives
// in DetailCard.styles.ts). Date box, badges, and title / time /
// location rows — including their muted past variants.
// event card styles — previously duplicated inline in EventsSection,
// HomeDashboard, and the EventsTab preview. The card has two variants:
export const eventCardStyles = {
  // Current/upcoming card: Design B tinted background (from
  // getCategoryTheme), clickable, with a press effect.
  // Same card, not clickable (no onClick): no pointer cursor, no press
  // effect.
  categoryBadgeBase: 'inline-flex items-center gap-1 text-label font-bold px-2.5 py-0.5 rounded-full',
  featuredBadge:
    'inline-flex items-center gap-1 text-label font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/60 shadow-2xs',
  featuredStar: 'w-3 h-3 fill-amber-400 text-amber-500',
  dateBoxBase:
    'flex-shrink-0 w-14 max-sm:[.large-font_&]:w-12 sm:w-16 py-2 max-sm:[.large-font_&]:py-1.5 px-1 text-center rounded-2xl shadow-2xs border flex flex-col items-center justify-center select-none relative self-start',
  dateBoxWeekday:
    'block text-label max-sm:[.large-font_&]:text-[11px] font-bold uppercase tracking-wide leading-tight whitespace-nowrap',
  dateBoxDay: 'block text-xl sm:text-2xl max-sm:[.large-font_&]:text-lg font-bold leading-none my-1',
  dateBoxMonthBase: 'block text-caption sm:text-label max-sm:[.large-font_&]:text-[11px] font-semibold uppercase tracking-wider leading-tight',
  cardTitle: 'text-base sm:text-lg font-bold text-stone-950 dark:text-stone-50 leading-snug break-words',
  cardTimeRow: 'flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-stone-800 dark:text-stone-300',
  cardLocationRow: 'flex items-center gap-1.5 text-xs sm:text-sm font-medium text-stone-700 dark:text-stone-300 truncate',
  cardDesc: 'text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed break-words',
  // Past card: muted, greyed, not clickable, no footer.
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
};
