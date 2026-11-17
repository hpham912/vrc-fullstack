export const spotlightBannerModalStyles = {
  backdrop: "fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto",
  dialog: "bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-stone-200 overflow-hidden my-auto max-h-[92vh] flex flex-col",
  header: "px-5 py-4 border-b border-stone-200 bg-stone-900 text-white flex items-center justify-between",
  headerLeft: "flex items-center gap-2.5",
  headerIcon: "w-5 h-5 text-amber-400",
  headerTitle: "font-serif font-bold text-base sm:text-lg",
  headerSubtitle: "text-stone-300 text-xs font-medium",
  closeBtn: "p-1.5 rounded-full text-stone-300 hover:text-white hover:bg-stone-800 transition-colors",
  closeIcon: "w-5 h-5",

  form: "flex-1 overflow-y-auto p-5 space-y-5 text-xs text-stone-700",
  stepBlock: "space-y-2",
  stepHeader: "flex items-center justify-between",
  stepLabel: "font-serif font-bold text-xs sm:text-sm text-stone-900 flex items-center gap-1.5",
  paletteIcon: "w-4 h-4 text-amber-700 dark:text-amber-400",
  themeGrid: "grid grid-cols-2 sm:grid-cols-3 gap-2 pt-0.5",
  themeBtnBase: "px-3 py-2.5 rounded-xl border text-left transition-all flex items-center justify-between gap-2 active:scale-95 cursor-pointer",
  themeBtnSelected: "border-amber-600 ring-2 ring-amber-500 bg-amber-50/90 text-amber-950 font-bold shadow-xs",
  themeBtnIdle: "border-stone-200 bg-stone-50/80 dark:bg-stone-800/80 hover:bg-white dark:hover:bg-stone-800 text-stone-800 hover:border-stone-300",
  themeBtnContent: "flex items-center gap-2 truncate",
  themeBtnIcon: "w-5 h-5 flex-shrink-0",
  themeBtnText: "text-xs truncate",
  colorDotBase: "w-2.5 h-2.5 rounded-full flex-shrink-0",
  colorDotSelected: "ring-2 ring-white shadow-xs",
  colorDotIdle: "opacity-60",

  // Saved custom theme buttons: two rows so the name always shows.
  // Top row is the icon + name; bottom row is the color strip (left)
  // and the edit/delete buttons (right). A single row squeezed the
  // name out entirely on a narrow phone (the dots + actions took all
  // the space).
  customThemeBtnBase: "px-3 py-2.5 rounded-xl border text-left transition-all flex flex-col gap-1.5 active:scale-95 cursor-pointer",
  customThemeBtnTop: "flex items-center gap-2 min-w-0",
  customThemeBtnBottom: "flex items-center justify-between gap-2",
  customColorStrip: "flex items-center gap-0.5 flex-shrink-0",
  customColorDot: "w-2.5 h-2.5 rounded-full border border-white/60 shadow-xs",
  customThemeActions: "flex items-center gap-0.5 flex-shrink-0",
  customActionBtn: "p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-200/70 transition-colors cursor-pointer",
  customActionIcon: "w-3.5 h-3.5",
  customCreateBtn: "border-dashed border-stone-300 text-stone-500 hover:border-amber-500 hover:text-amber-700",



  inputSectionDivider: "space-y-1.5 pt-1 border-t border-stone-100",
  fieldLabel: "block text-label font-bold text-stone-700",
  // Bilingual field group — two labeled TextFields (Vietnamese then
  // English). No topic heading here: the step heading above the
  // fields already serves as the label.
  fieldGroup: "space-y-1.5",
  fieldHint: "text-caption text-stone-400",
  quoteFetchRow: "flex items-center gap-2",
  quoteRefInput: "flex-1 min-w-0 px-3 py-2 bg-stone-50 rounded-xl border border-stone-300 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium",

  footer: "pt-3 border-t border-stone-200 flex items-center justify-end gap-2.5",
  cancelBtn: "px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs transition-colors",
  submitBtn: "px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all disabled:opacity-50",
  saveIcon: "w-3.5 h-3.5",
};
