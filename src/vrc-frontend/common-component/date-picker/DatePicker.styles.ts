// Styles for the shared DatePicker. The picker itself is the shared
// TextField with a native date/datetime input inside, so the only
// style this component owns is its wrapper.
export const datePickerStyles = {
  container: 'w-full min-w-0',
  // Datetime mode: the date and time fields sit side by side, inputs
  // bottom-aligned so the row label (over the date half) does not
  // push the date input below the time one. Date takes twice the
  // time's width — "Nov 17, 2026" needs more room than "9:32 PM".
  // Both halves shrink below their content (min-w-0), so neither can
  // widen the form the way one long datetime-local value did.
  datetimeRow: 'flex items-end gap-2 w-full min-w-0',
  datePart: 'flex-[2] min-w-0',
  timePart: 'flex-1 min-w-0',
};
