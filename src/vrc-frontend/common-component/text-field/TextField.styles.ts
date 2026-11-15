// Shared text field — the app's common input, for single-line inputs
// and multiline textareas alike. Styled from the admin form look:
// 1px stone-300 border, rounded 10px, gold focus ring. Colors use the
// index.css remap palette (bg-white, border-stone-300, text-stone-900)
// so dark mode converts for free; only the rose error text (outside
// the palette) needs an explicit dark: twin.
export const textFieldStyles = {
  field: 'w-full min-w-0',
  label: 'block text-xs font-bold text-stone-700 mb-1',
  input:
    'w-full max-w-full box-border min-w-0 h-11 px-3 border border-stone-300 rounded-[10px] text-sm bg-white text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-[#c9a227] focus:ring-2 focus:ring-[#c9a227]/25 disabled:opacity-50 disabled:bg-stone-50',
  textarea:
    'w-full max-w-full box-border min-w-0 px-3 py-2.5 border border-stone-300 rounded-[10px] text-sm bg-white text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-[#c9a227] focus:ring-2 focus:ring-[#c9a227]/25 disabled:opacity-50 disabled:bg-stone-50 resize-y leading-relaxed',
  error: 'block text-xs font-semibold text-rose-600 dark:text-rose-400 mt-1',
};
