export const iosTabBarStyles = {
  nav: 'fixed bottom-0 left-0 right-0 md:hidden bg-white/95 backdrop-blur-2xl border-t border-stone-200/80 px-3 max-sm:[.large-font_&]:px-1 py-1 pb-[max(0.6rem,env(safe-area-inset-bottom))] max-sm:[.large-font_&]:pb-[max(0.45rem,env(safe-area-inset-bottom))] shadow-lg transition-all',
  grid: 'max-w-md mx-auto grid grid-cols-5 items-center gap-1 max-sm:[.large-font_&]:gap-0.5',
  tabBtnBase:
    'flex flex-col items-center justify-center py-1 rounded-2xl transition-all duration-200 active:scale-90 min-w-0',
  tabBtnActive: 'text-amber-900 font-bold',
  tabBtnInactive: 'text-stone-600 hover:text-stone-900 font-semibold',
  iconBoxBase: 'p-1.5 max-sm:[.large-font_&]:p-1 rounded-xl transition-all',
  iconBoxActive: 'bg-amber-100/90 text-amber-950 shadow-2xs scale-105',
  iconBase: 'w-5 h-5 max-sm:[.large-font_&]:w-4 max-sm:[.large-font_&]:h-4',
  iconActive: 'stroke-[2.5]',
  iconInactive: 'stroke-[2]',
  label:
    'text-label max-sm:[.large-font_&]:text-[11px] max-sm:[.large-font_&]:leading-tight mt-0.5 tracking-tight max-sm:[.large-font_&]:tracking-[-0.02em] whitespace-nowrap overflow-hidden text-ellipsis max-w-[76px] max-sm:[.large-font_&]:max-w-full font-semibold',
};
