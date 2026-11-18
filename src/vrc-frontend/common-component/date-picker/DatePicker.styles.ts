// Styles for the shared DatePicker. The picker itself is the shared
// TextField with a native date/datetime input inside, so the only
// style this component owns is its wrapper.
export const datePickerStyles = {
  container: 'w-full min-w-0',
  // Datetime mode: the date and time fields are STACKED, each full
  // width like every other field in the admin forms. Side by side
  // failed twice on iOS: first the flex gap rendered as 0 so the two
  // boxes touched, then the explicit margin and fixed time width did
  // not take effect live (the time box still overlapped the date
  // box). Stacked full-width fields need no flex sizing at all, so
  // there is nothing left to overlap. Spacing matches the form's own
  // rhythm (12px between fields).
  datetimeStack: 'space-y-3 w-full min-w-0',
};
