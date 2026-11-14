export const adminLoginModalStyles = {
  backdrop:
    'fixed inset-0 z-50 overflow-y-auto bg-stone-950/65 backdrop-blur-xs flex items-center justify-center p-4 max-sm:[.large-font_&]:p-2.5',
  dialog:
    'relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in duration-150',
  header: 'p-6 max-sm:[.large-font_&]:p-4 bg-stone-950 text-white flex items-center justify-between gap-2',
  headerLeft: 'flex items-center gap-3',
  headerIconBox:
    'w-10 h-10 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold',
  headerTitle: 'font-serif font-bold text-lg text-white',
  headerSub: 'text-xs text-stone-300 font-medium',
  closeBtn: 'p-1.5 text-stone-300 hover:text-white rounded-lg transition-colors',
  form: 'p-6 max-sm:[.large-font_&]:p-4 space-y-4',
  errorBox: 'p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-300 text-xs rounded-xl flex items-center gap-2',
  label: 'block text-xs font-bold text-stone-900 mb-1.5',
  inputWrapper: 'relative',
  inputIcon: 'w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2',
  input:
    'w-full pl-9 pr-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-base sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all font-medium text-stone-950 placeholder:text-stone-500',
  footerRow: 'pt-2 flex flex-wrap items-center justify-end gap-3',
  cancelBtn: 'px-4 py-2 text-stone-600 hover:text-stone-900 text-xs font-semibold',
  submitBtn:
    'px-6 py-2.5 bg-stone-950 hover:bg-stone-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors disabled:opacity-50 active:scale-95',
};
