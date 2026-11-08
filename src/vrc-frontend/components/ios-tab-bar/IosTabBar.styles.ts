export const iosTabBarStyles = {
  nav: 'fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/95 backdrop-blur-2xl border-t border-stone-200/80 px-3 py-1 pb-[max(0.6rem,env(safe-area-inset-bottom))] shadow-lg transition-all',
  grid: 'max-w-md mx-auto grid grid-cols-4 items-center gap-1',
  tabBtnBase:
    'flex flex-col items-center justify-center py-1 rounded-2xl transition-all duration-200 active:scale-90',
  tabBtnActive: 'text-amber-900 font-bold',
  tabBtnInactive: 'text-stone-600 hover:text-stone-900 font-semibold',
  iconBoxBase: 'p-1.5 rounded-xl transition-all',
  iconBoxActive: 'bg-amber-100/90 text-amber-950 shadow-2xs scale-105',
  iconBase: 'w-5 h-5',
  iconActive: 'stroke-[2.5]',
  iconInactive: 'stroke-[2]',
  notifDot: 'absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-amber-600 ring-2 ring-white animate-pulse',
  label:
    'text-label mt-0.5 tracking-tight whitespace-nowrap overflow-hidden text-ellipsis max-w-[76px] font-semibold',
};
