export const directionsModalStyles = {
  backdrop: 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200',
  dialog: 'bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-stone-200',
  header:
    'px-6 py-5 bg-gradient-to-r from-stone-900 via-stone-800 to-amber-950 text-white flex items-center justify-between',
  headerLeft: 'flex items-center gap-3',
  headerIconBox:
    'w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-amber-400 border border-white/10',
  headerTitle: 'font-serif font-bold text-lg text-white',
  headerSub: 'text-xs text-amber-200/80',
  closeBtn:
    'w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition-colors',
  body: 'p-6 max-sm:[.large-font_&]:p-4 space-y-5 max-sm:[.large-font_&]:space-y-3.5',
  destCard: 'p-4 max-sm:[.large-font_&]:p-3 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-2',
  destName: 'font-serif font-bold text-sm text-stone-900 truncate',
  destAddress: 'text-xs text-stone-800 mt-0.5 leading-relaxed font-medium break-words',
  destFooter: 'pt-2 border-t border-stone-200/60 flex flex-wrap items-center justify-between gap-2 text-xs text-stone-700 font-medium',
  copyBtn: 'inline-flex items-center gap-1 font-bold text-amber-800 hover:text-amber-950 active:scale-95 transition-all',
  promptText: 'text-xs text-stone-700 font-medium text-center',
  choicesGrid: 'grid grid-cols-1 sm:grid-cols-2 gap-3',
  googleBtn:
    'flex items-center justify-between p-3.5 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-medium text-xs shadow-md hover:shadow-lg transition-all active:scale-95 group border border-stone-800',
  googleIconBox:
    'w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform',
  appleBtn:
    'flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-800 hover:to-amber-900 text-white font-medium text-xs shadow-md hover:shadow-lg transition-all active:scale-95 group border border-amber-600/30',
  appleIconBox:
    'w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center text-white group-hover:scale-110 transition-transform',
  footer: 'px-6 max-sm:[.large-font_&]:px-4 py-3 bg-stone-50 border-t border-stone-100 flex justify-end',
  footerCloseBtn:
    'px-4 py-1.5 rounded-xl text-xs font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-200/60 transition-colors',
};
