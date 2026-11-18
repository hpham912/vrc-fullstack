// Styles for the shared DatePicker. The picker itself is the shared
// TextField with a native date/datetime input inside, so the only
// style this component owns is its wrapper.
export const datePickerStyles = {
  container: 'w-full min-w-0',
  // Datetime mode: the date and time fields sit side by side, inputs
  // bottom-aligned so the row label (over the date half) does not
  // push the date input below the time one. The separation is an
  // explicit margin on the time half, not a flex gap — on iOS the two
  // boxes rendered touching with gap-2 (the shared middle border
  // measured as one line), so the gap cannot be trusted here. The
  // time half is a fixed 128px: "10:00 PM" needs that much at large
  // font, and a ratio share squeezed it into the date half. The date
  // half takes the rest and can shrink below its content.
  datetimeRow: 'flex items-end w-full min-w-0',
  datePart: 'flex-1 min-w-0',
  timePart: 'flex-none w-32 min-w-0 ml-3',
};
