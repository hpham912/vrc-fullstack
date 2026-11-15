// Shared text field — the app's common input, for single-line inputs
// and multiline textareas alike. Styled from the admin form look:
// 1px stone-300 border, rounded 10px, gold focus ring. Colors use the
// index.css remap palette (bg-white, border-stone-300, text-stone-900)
// so dark mode converts for free; only the rose error text (outside
// the palette) needs an explicit dark: twin.
export const textFieldStyles = {
  field: 'w-full min-w-0',
  // Label above the input — the small amber sub-label style (the
  // pool form's language sub-label). Any text can go here: callers
  // pass the label, e.g. t('commonLangVi') / t('commonLangEn') for a
  // bilingual pair. Omit it and nothing renders above the input.
  label: 'block text-[11px] font-bold text-amber-800 dark:text-amber-400',
  input:
    'w-full max-w-full box-border min-w-0 h-11 px-3 border border-stone-300 rounded-[10px] text-sm bg-white text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-[#c9a227] focus:ring-2 focus:ring-[#c9a227]/25 disabled:opacity-50 disabled:bg-stone-50',
  textarea:
    'w-full max-w-full box-border min-w-0 px-3 py-2.5 border border-stone-300 rounded-[10px] text-sm bg-white text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-[#c9a227] focus:ring-2 focus:ring-[#c9a227]/25 disabled:opacity-50 disabled:bg-stone-50 resize-y leading-relaxed',
  error: 'block text-xs font-semibold text-rose-600 dark:text-rose-400 mt-1',
  // Leading icon (single-line inputs only). The wrapper is relative so
  // the icon can sit inside the input on the left; the icon is
  // pointer-events-none so taps land on the input. inputWithIcon adds
  // the left padding that makes room for it. Omit the icon prop and
  // none of this renders — the input is exactly as before.
  inputWrapper: 'relative',
  inputIcon:
    'w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none',
  inputWithIcon: 'pl-9',
};
