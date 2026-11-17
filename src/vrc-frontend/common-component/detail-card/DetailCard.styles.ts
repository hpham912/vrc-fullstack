// Styles for the generic DetailCard shell. Layout only — the content
// (date box, badges, title, meta rows) keeps its own styles in the
// wrapper that fills the slots (e.g. EventCard).
export const detailCardStyles = {
  // Clickable card shell (a background tint comes from the caller's
  // className, e.g. the Design B category tint).
  cardBase:
    'rounded-2xl p-3.5 max-sm:[.large-font_&]:p-3 sm:p-4 transition-all duration-150 space-y-2.5 w-full min-w-0 max-w-full overflow-hidden box-border cursor-pointer active:scale-[0.985] active:brightness-95 select-none shadow-sm',
  // Same card, not clickable (no onClick): no pointer cursor, no press
  // effect.
  cardStatic:
    'rounded-2xl p-3.5 max-sm:[.large-font_&]:p-3 sm:p-4 transition-all duration-150 space-y-2.5 w-full min-w-0 max-w-full overflow-hidden box-border select-none shadow-sm',
  topRow: 'flex flex-wrap items-center justify-between gap-1.5 min-w-0 w-full',
  badgeGroup: 'flex items-center gap-1.5 flex-wrap min-w-0',
  actionRow: 'flex items-center gap-1.5 ml-auto',
  mainRow: 'flex items-start gap-3 max-sm:[.large-font_&]:gap-2.5 sm:gap-3.5 min-w-0 w-full max-w-full',
  contentCol: 'flex-1 min-w-0 max-w-full flex flex-col gap-1',
  footerRow: 'pt-2.5 border-t border-stone-900/10 dark:border-stone-800 flex flex-wrap items-center justify-end gap-2 min-w-0 w-full',
  // Muted card: greyed, not clickable, no footer.
  pastCard:
    'rounded-2xl p-3.5 max-sm:[.large-font_&]:p-3 sm:p-4 space-y-2.5 w-full min-w-0 max-w-full overflow-hidden box-border select-none border border-stone-200/80 dark:border-stone-800 bg-stone-100/70 dark:bg-[#161412] opacity-75 cursor-default',
};
