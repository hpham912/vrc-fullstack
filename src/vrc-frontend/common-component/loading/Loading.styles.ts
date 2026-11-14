// Shared loading indicator — the one spinner the whole app uses.
// Inline: a compact spinner + text that sits in place (cards, pull-to-refresh).
// Fullscreen: a fixed overlay covering the screen; pass blur to blur the
// background behind it, or leave it off for a plain dim background.
export const loadingStyles = {
  inlineWrap: 'flex items-center justify-center gap-2',
  inlineText: 'text-sm font-semibold text-stone-700 dark:text-stone-300',
  inlineSpinner: 'text-amber-700 dark:text-amber-400',
  fullscreenWrap: 'fixed inset-0 z-50 flex flex-col items-center justify-center gap-3',
  fullscreenDim: 'bg-stone-950/40',
  fullscreenBlur: 'bg-stone-950/30 backdrop-blur-sm',
  fullscreenText: 'text-sm font-semibold text-white',
  fullscreenSpinner: 'text-white',
  spinnerSm: 'w-4 h-4',
  spinnerMd: 'w-5 h-5',
  spinnerLg: 'w-8 h-8',
};
