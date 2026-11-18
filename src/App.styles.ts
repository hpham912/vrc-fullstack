export const appStyles = {
  // The fixed navbar sits on top of the page (out of flow), so the
  // page itself clears it once, here — 56px navbar + 20px gap on
  // mobile, 80px navbar + 32px on desktop, plus the notch safe area.
  // Every section below (banner, hero, tabs) just stacks under it.
  // Before this, the hero cleared the navbar with its own top
  // padding, so the banner — added above the hero — rendered at the
  // very top of the page, hidden behind the fixed navbar, and only
  // slid into view when the user pulled down to refresh.
  pageWrapper:
    'min-h-screen bg-[#FDFCFB] dark:bg-[#0c0a09] text-stone-900 dark:text-stone-100 flex flex-col font-sans selection:bg-amber-100 selection:text-amber-900 pb-20 md:pb-6 w-full max-w-full overflow-x-hidden min-w-0 pt-[calc(4.75rem+env(safe-area-inset-top,0px))] sm:pt-28',
  lazyFallback: 'flex items-center justify-center py-16 text-sm font-semibold text-stone-500',
};
