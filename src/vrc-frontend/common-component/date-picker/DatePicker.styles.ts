// Styles for the shared DatePicker. The picker itself is the shared
// TextField with a native date/datetime input inside, so the only
// style this component owns is its wrapper.
import type { CSSProperties } from 'react';

export const datePickerStyles = {
  container: 'w-full min-w-0',
};

// Datetime mode: the date and time fields sit side by side, each
// with its own visible label. The layout is INLINE styles, not
// Tailwind classes — deliberately. The pair failed twice live as
// classes: first the flex gap rendered as 0 so the boxes touched,
// then the explicit margin + fixed width never took effect, so the
// time box overlapped the date box. Inline styles travel with the
// JS bundle, so the gap and widths cannot go missing from the
// generated CSS file. Do not move this layout back to classes.
// The time width is in rem so it grows with large text: "11:06 PM"
// needs about 8rem at the large font size. The date half takes the
// rest and can shrink below its content.
export const datePickerInlineStyles: {
  datetimeRow: CSSProperties;
  datePart: CSSProperties;
  timePart: CSSProperties;
} = {
  datetimeRow: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '12px',
    width: '100%',
    minWidth: 0,
  },
  datePart: { flex: '1 1 0%', minWidth: 0 },
  timePart: { flex: 'none', width: '8rem', minWidth: 0 },
};
