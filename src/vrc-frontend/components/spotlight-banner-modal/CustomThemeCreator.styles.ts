export const customThemeCreatorStyles = {
  // Custom theme creator panel (opens under the theme grid): name,
  // style swatches, color pickers, live preview, actions.
  creatorPanel: "mt-3 p-4 rounded-2xl border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 space-y-4",
  creatorHeader: "flex items-center justify-between",
  creatorTitle: "font-serif font-bold text-xs sm:text-sm text-stone-900",
  creatorFieldGroup: "space-y-1.5",
  creatorFieldLabel: "block text-[11px] font-bold text-amber-800 dark:text-amber-400",
  styleGrid: "grid grid-cols-3 sm:grid-cols-5 gap-1.5",
  styleBtnBase: "flex flex-col items-center gap-1 px-1 py-2 rounded-xl border text-center transition-all active:scale-95 cursor-pointer",
  styleBtnSelected: "border-amber-600 ring-2 ring-amber-500 bg-white font-bold shadow-xs",
  styleBtnIdle: "border-stone-200 bg-white hover:bg-stone-50 text-stone-700 hover:border-stone-300",
  styleSwatch: "w-full h-6 rounded-md border border-stone-200",
  styleBtnText: "text-caption leading-tight",
  colorList: "space-y-2",
  colorRow: "flex items-start gap-1.5",
  previewBanner: "rounded-2xl border-2 p-4 space-y-1.5 flex flex-col items-start shadow-lg",
  previewBadge: "inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border",
  previewTitle: "font-serif font-bold text-sm sm:text-base text-white drop-shadow",
  previewSubtitle: "text-[11px] font-medium text-white/85",
  previewBtn: "inline-flex items-center text-[11px] font-bold px-3 py-1.5 rounded-full shadow",
  creatorActions: "flex items-center justify-end gap-2 pt-1",

  // Small round icon buttons (creator close X, per-color remove X).
  // Same strings as the modal's own customActionBtn — each styles
  // file stays self-contained.
  customActionBtn: "p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-200/70 transition-colors cursor-pointer",
  customActionIcon: "w-3.5 h-3.5",
  fieldHint: "text-caption text-stone-400",
  saveIcon: "w-3.5 h-3.5",
};
