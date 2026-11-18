// Styles for the shared DatePicker. The field looks exactly like
// every other form field (same border, height, and radius as the
// shared TextField input); the calendar inside the modal is this
// component's own, with explicit dark: twins — the modal dialog is
// a dark surface of its own, so the remap palette alone is not
// enough for the day cells.
export const datePickerStyles = {
  container: 'w-full min-w-0',
  // The field is a button (it opens the picker), styled as an
  // input: same 44px height, border, radius, and background as
  // TextField. The focus ring draws around it like an input's.
  fieldButton:
    'flex h-11 w-full items-center justify-between gap-3 rounded-[10px] border border-stone-300 bg-white px-3 text-left text-sm text-stone-900 focus:outline-none focus:border-[#c9a227] focus:ring-2 focus:ring-[#c9a227]/25 disabled:bg-stone-50 disabled:opacity-50',
  fieldText: 'truncate',
  fieldPlaceholder: 'truncate text-stone-400',
  fieldIcon: 'h-4 w-4 shrink-0 text-stone-500',
  // Modal content — the shared Modal body has no padding, so this
  // supplies it.
  panel: 'p-6',
  monthHeader: 'flex items-center justify-between',
  monthLabel: 'text-sm font-bold text-stone-900',
  navButton:
    'flex h-9 w-9 items-center justify-center rounded-full text-stone-600 hover:bg-stone-100 focus:outline-none focus:ring-2 focus:ring-[#c9a227]/25 dark:text-stone-300 dark:hover:bg-white/10',
  navIcon: 'h-5 w-5',
  weekdayRow: 'mt-4 grid grid-cols-7 text-center',
  weekdayCell: 'py-1 text-[11px] font-bold text-stone-500 dark:text-stone-400',
  dayGrid: 'grid grid-cols-7 gap-y-1',
  dayCell:
    'mx-auto flex h-10 w-10 items-center justify-center rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#c9a227]/50',
  dayDefault: 'text-stone-900 hover:bg-stone-100 dark:hover:bg-white/10',
  dayToday: 'font-bold text-[#0d2d64] ring-1 ring-[#c9a227] dark:text-amber-300 dark:ring-amber-400',
  daySelected: 'bg-[#0d2d64] font-bold text-white hover:bg-[#0d2d64] dark:bg-[#2456a6] dark:hover:bg-[#2456a6]',
  dayDisabled: 'cursor-not-allowed text-stone-300 dark:text-stone-600',
  timeRow: 'mt-5 flex gap-2',
  timeField: 'min-w-0 flex-1',
  timeSelect:
    'h-11 w-full min-w-0 rounded-[10px] border border-stone-300 bg-white px-2 text-sm text-stone-900 focus:outline-none focus:border-[#c9a227] focus:ring-2 focus:ring-[#c9a227]/25',
  footer: 'mt-6 flex items-center justify-between gap-2',
  footerLeft: 'flex items-center gap-1',
  footerActions: 'flex gap-2',
};
