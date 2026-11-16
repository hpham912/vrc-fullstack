// Shared Upload (file upload) styles. The dropzone uses the remap
// palette (bg-white / bg-stone-50 / border-stone-200/300) so it
// auto-converts in dark mode; the amber drag-over accent and the red
// error text are outside that palette, so they carry explicit dark:
// twins on the same class string.
export const uploadStyles = {
  wrapper: 'w-full',
  dropzone:
    'w-full rounded-2xl border-2 border-dashed border-stone-300 dark:border-stone-600 bg-stone-50 dark:bg-stone-900/60 px-4 py-6 flex flex-col items-center justify-center gap-1.5 text-center cursor-pointer transition-colors hover:border-amber-600 dark:hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 dark:focus-visible:ring-amber-400',
  dropzoneDragOver:
    'border-amber-600 dark:border-amber-400 bg-amber-50 dark:bg-amber-950/40',
  dropzoneDisabled: 'opacity-50 cursor-not-allowed pointer-events-none',
  dropzoneIcon: 'w-8 h-8 text-stone-500 dark:text-stone-400',
  dropzoneTitle: 'text-sm font-semibold text-stone-800 dark:text-stone-100',
  dropzoneSubtitle: 'text-xs text-stone-600 dark:text-stone-400',
  chooseButton:
    'mt-1 inline-flex items-center gap-1.5 rounded-full border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 px-3.5 py-1.5 text-xs font-semibold text-stone-800 dark:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors',
  hint: 'mt-2 text-xs text-stone-600 dark:text-stone-400 text-center',
  fileChip:
    'mt-3 w-full flex items-center gap-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2.5 text-left',
  fileIcon: 'w-5 h-5 flex-shrink-0 text-amber-700 dark:text-amber-400',
  fileName: 'min-w-0 flex-1 text-sm font-medium text-stone-900 dark:text-stone-50 truncate',
  fileSize: 'flex-shrink-0 text-xs text-stone-500 dark:text-stone-400',
  removeButton:
    'flex-shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-full text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-800 dark:hover:text-stone-100 transition-colors',
  removeIcon: 'w-4 h-4',
  errorText: 'mt-2 text-xs font-medium text-red-700 dark:text-red-400 text-center',
};
