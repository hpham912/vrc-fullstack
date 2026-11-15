// Shared Select — the app's common dropdown. Styled from the admin
// input look so it matches the TextField: 1px stone-300 border,
// rounded 10px, gold focus ring, h-11. Colors use the index.css
// remap palette (bg-white, border-stone-300, text-stone-900) so dark
// mode converts for free. The native arrow is hidden
// (appearance-none) and a ChevronDown is drawn instead, so the
// dropdown reads the same in every browser.
//
// The three existing hand-built <select> elements (EventsTab
// category, EventsSection filter, EditHeaderVerseModal recent-verse)
// were NOT refactored to this in the scripture-pool build — migrating
// them is a follow-up, so they keep working exactly as they are.
export const selectStyles = {
  wrapper: 'relative w-full min-w-0',
  select:
    'w-full max-w-full box-border min-w-0 h-11 pl-3 pr-9 border border-stone-300 rounded-[10px] text-sm bg-white text-stone-900 focus:outline-none focus:border-[#c9a227] focus:ring-2 focus:ring-[#c9a227]/25 disabled:opacity-50 disabled:bg-stone-50 appearance-none cursor-pointer',
  chevron:
    'absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none flex-shrink-0',
};
