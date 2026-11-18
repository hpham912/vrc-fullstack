export const modalStyles = {
  // No z-index here — the component applies `zIndexClass`
  // (default z-[100]) so a modal that opens from inside another
  // modal can sit above it.
  backdropBase: "fixed inset-0 flex items-center justify-center p-4 max-sm:[.large-font_&]:p-2.5 bg-stone-950/60 backdrop-blur-xs transition-opacity duration-200",
  backdropVisible: "opacity-100",
  backdropHidden: "opacity-0",
  dialogBase: "bg-white dark:bg-[#161412] text-stone-900 dark:text-stone-100 rounded-3xl border border-stone-200 dark:border-stone-800 w-full shadow-2xl overflow-hidden max-h-[90vh] flex flex-col transition-all duration-200",
  dialogVisible: "opacity-100 scale-100 translate-y-0",
  dialogHidden: "opacity-0 scale-95 translate-y-2",
  header: "px-6 max-sm:[.large-font_&]:px-4 py-4 max-sm:[.large-font_&]:py-3 bg-stone-950 text-white flex items-center justify-between gap-3 flex-shrink-0",
  headerLeft: "flex items-center gap-2.5 min-w-0",
  iconWrap: "flex-shrink-0",
  titleGroup: "min-w-0",
  subtitle: "text-label font-bold uppercase tracking-wider text-amber-400 block truncate",
  title: "font-serif font-bold text-base sm:text-lg max-sm:[.large-font_&]:text-sm text-white line-clamp-2 break-words",
  closeBtn: "p-1.5 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors flex-shrink-0",
  closeIcon: "w-4 h-4",
  // Vertical scroll only: horizontal overflow is clipped, so a child
  // wider than the dialog can never make the whole modal sway
  // sideways while the user scrolls.
  body: "overflow-y-auto overflow-x-hidden overscroll-contain flex-1",
};
