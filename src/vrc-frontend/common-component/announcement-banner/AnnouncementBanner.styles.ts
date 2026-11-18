// Shared AnnouncementBanner: the global announcement pill under the
// header — a soft rose floating pill (Design A, colour 4, Hoang's
// pick Nov 2026), replacing the old flat red strip. The shape is
// fixed here; the text is the caller's job — pass the whole
// announcement list and the banner shows the newest row that is
// switched on AND inside its start/end window (nothing renders when
// none is showing). The message follows the app language:
// Vietnamese `content`, or English `contentEn` when the app is in
// English (falling back to `content` when the English text is empty).
// Light mode is a light rose pill with dark red text; dark mode is a
// translucent rose pill with light rose text, so it never turns into
// a hard red block at night.
export const announcementBannerStyles = {
  // Outer spacing around the pill — 12px on the sides and below.
  // The top clearance (fixed navbar + gap) comes from the page
  // wrapper, so the pill sits below the navbar with no extra offset
  // of its own. Carries the pull-to-refresh inline style from the
  // shell.
  wrapper: 'relative w-full px-3 pb-3',
  // The pill itself: fully rounded, soft shadow, thin rose border.
  pill:
    'flex items-center gap-2.5 rounded-full border border-[#fecaca] bg-[#fef2f2] py-[9px] pl-[9px] pr-3.5 text-[#991b1b] shadow-[0_6px_20px_rgba(220,38,38,0.14)] dark:border-[rgba(220,38,38,0.35)] dark:bg-[rgba(220,38,38,0.18)] dark:text-[#fecaca] dark:shadow-[0_6px_20px_rgba(0,0,0,0.4)]',
  // Megaphone chip: a fixed 30px circle that never shrinks, so the
  // icon stays round at any font size (including large-text mode).
  iconChip:
    'flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-[#fee2e2] text-[#dc2626] dark:bg-[rgba(220,38,38,0.3)] dark:text-[#fca5a5]',
  // The text area: whatever width is left after the icon chip. This
  // is what the overflow measurement runs against, so the marquee
  // decision is exact for the space the text actually has.
  textContainer: 'relative min-w-0 flex-1 overflow-hidden',
  // Short text: sits still, left-aligned next to the icon.
  staticText: 'text-sm font-semibold',
  // Long text, reduced motion on: wraps onto as many lines as needed
  // instead of scrolling, so the whole message is still readable.
  wrappedText: 'text-sm font-semibold leading-snug',
  // Marquee mode: the track holds two copies of the text side by side;
  // the animation slides it left by exactly one copy, so the loop has
  // no jump. `w-max` keeps the track as wide as its content, not the
  // text area, or the -50% shift would be wrong.
  track: 'flex w-max whitespace-nowrap will-change-transform',
  // The gap between the end of one copy and the start of the next.
  textCopy: 'pr-12 text-sm font-semibold',
  // Hidden single-copy span, used only to measure whether the text
  // overflows the text area. Absolutely positioned so it never affects
  // layout; `invisible` (not display:none) so it still has a width.
  measureText: 'invisible absolute whitespace-nowrap text-sm font-semibold',
};
