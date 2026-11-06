export const appStyles = {
  pageWrapper:
    'min-h-screen bg-[#FDFCFB] text-stone-900 flex flex-col font-sans selection:bg-amber-100 selection:text-amber-900 pb-20 md:pb-6 w-full max-w-full overflow-x-hidden min-w-0',
  heroSection:
    'bg-white border-b border-stone-200/60 pt-[calc(4.75rem+env(safe-area-inset-top,0px))] sm:pt-28 pb-6 sm:pb-9 px-4 sm:px-6',
  heroInner: 'max-w-4xl mx-auto text-center space-y-3 sm:space-y-3.5',
  locationPill:
    'inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 text-stone-700 text-[11px] sm:text-xs font-semibold tracking-wide',
  locationIcon: 'w-3.5 h-3.5 text-amber-600',
  titleWrapper: 'space-y-0.5 sm:space-y-1 pt-0.5',
  heroTitle:
    'text-xl sm:text-4xl lg:text-5xl font-serif font-bold text-stone-950 tracking-tight leading-tight',
  heroSubtitle: 'text-stone-700 font-medium text-xs sm:text-sm max-w-lg mx-auto leading-relaxed',
  adminBtnWrapper: 'pt-1.5 sm:pt-2 flex items-center justify-center',
  adminBtn:
    'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-semibold text-xs shadow-xs transition-all cursor-pointer',
  adminBtnIcon: 'w-3.5 h-3.5 text-amber-200 flex-shrink-0',
  desktopNav:
    'hidden md:flex items-center w-fit mx-auto bg-stone-100/80 p-1 rounded-2xl border border-stone-200/60 mt-2 sm:mt-3',
  desktopNavItemBase:
    'flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all',
  desktopNavItemActive: 'bg-white text-stone-950 shadow-xs',
  desktopNavItemInactive: 'text-stone-600 hover:text-stone-900',
  desktopNavIcon: 'w-3.5 h-3.5 opacity-75',
  mainContent: 'flex-1 w-full max-w-full overflow-x-clip min-w-0',
  desktopFooter:
    'hidden md:block bg-white border-t border-stone-200/80 py-8 px-4 text-stone-600 text-xs font-medium',
  footerTopRow: 'max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4',
  footerBrandGroup: 'flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2',
  footerBrandEn: 'font-serif font-bold text-stone-900 text-sm flex items-center gap-1.5',
  footerBrandDivider: 'hidden sm:inline text-stone-400',
  footerBrandVi: 'text-stone-700 text-xs font-semibold',
  footerLinksGroup: 'flex items-center gap-4 text-xs font-semibold text-stone-700',
  footerLinkBtn: 'hover:text-stone-950 transition-colors',
  footerBottomRow:
    'max-w-4xl mx-auto mt-4 pt-4 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-stone-600 text-[11px] font-medium',
  footerMetaRight: 'flex items-center gap-2',
  footerDot: 'text-stone-300',
  footerVersion: 'text-stone-500 font-mono text-[10px]',
  mobileVersionBar: 'md:hidden py-3 text-center text-[10px] text-stone-500 font-mono select-none',
};
