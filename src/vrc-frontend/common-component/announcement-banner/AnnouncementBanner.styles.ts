// Shared AnnouncementBanner: the global red strip under the header.
// The shape is fixed here; the text is the caller's job — pass the
// whole announcement list and the banner shows the newest row that is
// switched on AND inside its start/end window (nothing renders when
// none is showing). The message follows the app language:
// Vietnamese `content`, or English `contentEn` when the app is in
// English (falling back to `content` when the English text is empty).
export const announcementBannerStyles = {
  // Full-width red strip, gold hairlines top and bottom (Blue & Gold).
  // The same red in light and dark mode — it is an alert strip, not a
  // card, so it never re-themes.
  banner:
    'relative w-full overflow-hidden border-y-2 border-[#c9a227] bg-[#c81e1e] py-2',
  // Short text: sits still, centered, one line.
  staticText: 'px-4 text-center text-sm font-bold text-white',
  // Long text, reduced motion on: wraps onto as many lines as needed
  // instead of scrolling, so the whole message is still readable.
  wrappedText: 'px-4 text-center text-sm font-bold leading-snug text-white',
  // Marquee mode: the track holds two copies of the text side by side;
  // the animation slides it left by exactly one copy, so the loop has
  // no jump. `w-max` keeps the track as wide as its content, not the
  // banner, or the -50% shift would be wrong.
  track: 'flex w-max whitespace-nowrap will-change-transform',
  // The gap between the end of one copy and the start of the next.
  textCopy: 'pr-12 text-sm font-bold text-white',
  // Hidden single-copy span, used only to measure whether the text
  // overflows the banner. Absolutely positioned so it never affects
  // layout; `invisible` (not display:none) so it still has a width.
  measureText: 'invisible absolute whitespace-nowrap text-sm font-bold',
};
