export const zoomButtonStyles = {
  // Zoom brand blue (#2D8CFF). Same in light and dark mode — the
  // explicit dark: twin states that, so the button never flips to a
  // remapped color. The button sits in the card footer next to the
  // calendar button (Hoang, 2026-11-10), so its height matches the
  // calendar button (py-1.5, sm:py-2) and its width is set by the
  // parent (flex-1 on the card, w-full in details / the preview).
  // Text is text-xs with a w-4 icon, per Hoang's request.
  zoomBtn: "inline-flex items-center justify-center gap-2 px-4 py-1.5 sm:py-2 rounded-xl bg-[#2D8CFF] hover:bg-[#1B7BF5] dark:bg-[#2D8CFF] dark:hover:bg-[#1B7BF5] text-white text-xs font-bold transition-all shadow-2xs active:scale-[0.98]",
  zoomIcon: "w-4 h-4 text-white flex-shrink-0",
  // Short label in large-text mode on mobile only: the full "Join
  // Zoom" / "Tham Gia Zoom" is too long at 22px root and gets cut
  // off, so it shortens to just "Zoom". The `large-font` class is
  // set on <html> by the Navbar when large text is on; `max-sm:`
  // keeps this mobile-only (below the sm breakpoint).
  labelFull: 'max-sm:[.large-font_&]:hidden',
  labelShort: 'hidden max-sm:[.large-font_&]:inline',
  modalIcon: "w-4 h-4",
  // The shared Modal body has no padding, so the content supplies it.
  infoBody: "p-6 space-y-4",
  infoMessage: "text-sm text-stone-600 leading-relaxed",
  infoFooter: "flex justify-end",
  // The passcode, shown big and centered so it is easy to read and
  // type into Zoom.
  codeBox: "rounded-2xl border border-stone-200 bg-stone-50 px-4 py-4 text-center space-y-1",
  codeLabel: "block text-caption font-bold uppercase tracking-wider text-stone-500",
  codeValue: "block font-mono text-3xl font-bold tracking-widest text-stone-950",
  joinFooter: "flex items-center justify-end gap-2",
};
