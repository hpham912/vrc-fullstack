// Shared Banner — one component for every success / error / info / warn
// message in the app. The caller picks the type (colors + icon) and the
// variant (layout); the message text is always bilingual via t().
//
// Variants:
// - card (default): rounded box with a full border — inline banners in
//   forms and modals, and the feedback at the top of a tab.
// - strip: full-width strip with only a bottom border — the feedback
//   banner at the top of AdminPortal.
// - text: no background or border, just colored text + icon, centered —
//   the success / error line shown below a save button on mobile.
//
// Dark mode: every type has an explicit dark: twin (these colors are
// outside the index.css remap palette, so they do not auto-convert).
export const bannerStyles = {
  base: 'flex items-center gap-2 text-xs font-semibold',
  variants: {
    card: 'p-3 rounded-2xl border',
    strip: 'p-3 px-6 border-b',
    text: 'mt-2 justify-center gap-1.5 p-0',
  },
  // Full color scheme for card / strip (background + text + border).
  types: {
    success:
      'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60',
    error:
      'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800/60',
    info: 'bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800/60',
    warn: 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60',
  },
  // Text-only colors for the text variant (no background or border).
  textTypes: {
    success: 'text-emerald-700 dark:text-emerald-400',
    error: 'text-rose-700 dark:text-rose-400',
    info: 'text-blue-700 dark:text-blue-400',
    warn: 'text-amber-700 dark:text-amber-400',
  },
  icons: {
    success: 'w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0',
    error: 'w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0',
    info: 'w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0',
    warn: 'w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0',
  },
  textIcons: {
    success: 'w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0',
    error: 'w-3.5 h-3.5 text-rose-600 dark:text-rose-400 flex-shrink-0',
    info: 'w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0',
    warn: 'w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0',
  },
  dismiss: 'flex-shrink-0 p-1 rounded-lg hover:bg-black/5',
  dismissIcon: 'w-4 h-4',
};
