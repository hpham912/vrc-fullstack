// Shared color picker — a swatch (native color input) plus a hex
// field. Colors use the index.css remap palette so dark mode converts
// for free; only the hex input's border (stone-300) is in the palette.
export const colorPickerStyles = {
  field: 'w-full min-w-0',
  label: 'block text-[11px] font-bold text-amber-800 dark:text-amber-400',
  row: 'flex items-center gap-2 mt-1',
  // The swatch: a rounded square filled with the current color. The
  // native color input sits on top, fully transparent, so tapping
  // anywhere on the square opens the system color picker.
  swatchWrap:
    'relative w-11 h-11 flex-shrink-0 rounded-[10px] border border-stone-300 overflow-hidden cursor-pointer',
  swatchInput: 'absolute inset-0 w-full h-full opacity-0 cursor-pointer',
  hexInput:
    'w-full max-w-full box-border min-w-0 h-11 px-3 border border-stone-300 rounded-[10px] text-sm bg-white text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-[#c9a227] focus:ring-2 focus:ring-[#c9a227]/25 disabled:opacity-50 disabled:bg-stone-50 uppercase',
};
