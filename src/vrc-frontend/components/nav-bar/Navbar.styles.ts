export const navbarStyles = {
  header:
    'fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-b border-stone-200/60 transition-all pt-safe',
  container: 'max-w-4xl mx-auto px-3 sm:px-6',
  innerRow: 'flex items-center justify-between h-14 sm:h-20',
  logoBtn:
    'flex items-center gap-2.5 sm:gap-3 text-left group transition-transform active:scale-95 flex-shrink-0',
  logoImg:
    'h-9 sm:h-12 w-auto object-contain flex-shrink-0',
  rightControls: 'flex items-center gap-1.5 sm:gap-2',
  prayerBtn:
    'flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100/90 active:scale-95 border border-amber-200/90 text-amber-900 text-xs font-semibold shadow-2xs transition-all cursor-pointer',
  prayerIcon: 'w-3.5 h-3.5 text-amber-700 flex-shrink-0',
  prayerText: 'tracking-tight text-xs font-bold',
  notifBtnBase:
    'hidden sm:flex w-8 h-8 sm:w-9 sm:h-9 items-center justify-center rounded-xl active:scale-95 transition-all relative border',
  notifBtnActive: 'bg-amber-100 text-amber-900 border-amber-300 ring-2 ring-amber-400/30',
  notifBtnInactive: 'bg-stone-100/80 hover:bg-stone-200/70 text-stone-700 border-stone-200/70',
  notifDot: 'absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-600 ring-2 ring-white animate-pulse',
  mobileLangBtn:
    'sm:hidden px-2 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 active:scale-95 border border-stone-300 text-xs font-bold text-stone-900 flex items-center gap-1 shadow-2xs',
  mobileLangText: 'text-[13px] font-mono font-bold',
  desktopLangGroup:
    'hidden sm:flex items-center bg-stone-100 p-1 rounded-xl border border-stone-300 text-xs font-bold shadow-2xs',
  desktopLangBtnBase: 'px-2 py-1 rounded-lg transition-all flex items-center gap-1 text-[11px]',
  desktopLangBtnActive: 'bg-white text-stone-950 shadow-xs font-bold',
  desktopLangBtnInactive: 'text-stone-600 hover:text-stone-950 font-semibold',
  settingsWrapper: 'relative',
  settingsBtnBase:
    'w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl border transition-all active:scale-95 cursor-pointer',
  settingsBtnActive: 'bg-amber-100 text-amber-950 border-amber-400',
  settingsBtnInactive: 'bg-stone-100 hover:bg-stone-200 text-stone-800 border-stone-300',
  settingsBackdrop: 'fixed inset-0 z-40 bg-transparent cursor-pointer',
  settingsMenu:
    'absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-stone-200 shadow-xl py-1.5 z-50 text-xs overflow-hidden select-none',
  settingsToggleItem:
    'w-full px-3.5 py-2.5 text-left hover:bg-stone-50 flex items-center justify-between text-stone-800 font-semibold cursor-pointer transition-colors',
  settingsItemLeft: 'flex items-center gap-2.5',
  settingsItemIcon: 'w-4 h-4 text-amber-600 flex-shrink-0',
  settingsItemIconMuted: 'w-4 h-4 text-stone-600 flex-shrink-0',
  settingsFontItem:
    'w-full px-3.5 py-2.5 text-left hover:bg-stone-50 flex items-center justify-between text-stone-800 font-semibold cursor-pointer transition-colors',
  settingsFontBadgeBase: 'px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide transition-all',
  settingsFontBadgeOn: 'bg-amber-100 text-amber-950 font-bold',
  settingsFontBadgeOff: 'bg-stone-100 text-stone-500 font-medium',
  settingsDivider: 'my-1 border-t border-stone-100',
  settingsAdminItem:
    'w-full px-3.5 py-2.5 text-left hover:bg-amber-50 flex items-center gap-2.5 text-stone-900 font-semibold cursor-pointer transition-colors',
  settingsLogoutItem:
    'w-full px-3.5 py-2.5 text-left hover:bg-red-50 flex items-center gap-2.5 text-red-600 font-semibold cursor-pointer transition-colors',
  settingsLoginItem:
    'w-full px-3.5 py-2.5 text-left hover:bg-stone-50 flex items-center gap-2.5 text-stone-800 font-semibold cursor-pointer transition-colors',
};
