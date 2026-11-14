export const featuredBannerStyles = {
  heroBannerBase:
    'relative overflow-hidden text-white rounded-3xl p-5 max-sm:[.large-font_&]:p-4 sm:p-8 transition-all',
  glowTopRight: 'absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 rounded-full blur-3xl pointer-events-none',
  glowBottomLeft: 'absolute bottom-0 left-0 -mb-8 -ml-8 w-48 h-48 rounded-full blur-3xl pointer-events-none',
  heroContent: 'relative z-10 space-y-3.5 max-sm:[.large-font_&]:space-y-3',
  heroTopRow: 'flex items-center justify-between gap-2',
  heroTitleGroup: 'space-y-1.5',
  heroTitle: 'text-2xl sm:text-3xl max-sm:[.large-font_&]:text-xl font-serif font-bold tracking-tight text-white leading-tight break-words',
  heroSubtitleBox:
    'p-2.5 sm:p-3 rounded-2xl bg-black/35 border border-white/15 text-stone-100 text-xs sm:text-sm italic font-serif leading-relaxed max-w-2xl',
  heroDesc: 'text-xs sm:text-sm text-stone-100 font-medium leading-relaxed max-w-xl pt-0.5 whitespace-pre-line',
  metaChipsRow: 'flex flex-wrap items-center gap-2 pt-0.5 text-xs text-stone-100 font-semibold',
  metaChip: 'inline-flex items-center gap-1.5 max-w-full bg-black/30 px-3 max-sm:[.large-font_&]:px-2.5 py-1 rounded-xl border border-white/15 whitespace-normal break-words text-left max-sm:[.large-font_&]:text-[13.5px]',
  metaChipIcon: 'w-3.5 h-3.5 text-amber-400 flex-shrink-0',
  labelFull: 'max-sm:[.large-font_&]:hidden',
  labelShort: 'hidden max-sm:[.large-font_&]:inline',
  actionBtnsRow: 'pt-2 flex flex-wrap items-center gap-2.5',
};
