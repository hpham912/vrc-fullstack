export const zoomButtonStyles = {
  // Zoom brand blue (#2D8CFF). Same in light and dark mode — the
  // explicit dark: twin states that, so the button never flips to a
  // remapped color. Design A (Hoang, 2026-11-10): a full-width bar,
  // taller with bigger text and icon, on its own row above the
  // calendar footer — the button's own design, impossible to miss.
  zoomBtn: "inline-flex w-full items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#2D8CFF] hover:bg-[#1B7BF5] dark:bg-[#2D8CFF] dark:hover:bg-[#1B7BF5] text-white text-sm font-bold transition-all shadow-2xs active:scale-[0.98]",
  zoomIcon: "w-5 h-5 text-white flex-shrink-0",
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
