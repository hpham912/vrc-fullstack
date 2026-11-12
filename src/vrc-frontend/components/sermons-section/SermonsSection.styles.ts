// Sermons tab page (Bài Giảng): one uniform card color for every sermon
// — no per-item color variants like the event cards have.
export const sermonsSectionStyles = {
  page: 'max-w-4xl mx-auto px-3.5 sm:px-6 py-6 sm:py-12',
  headerRow: 'flex items-center justify-between gap-3 min-w-0 w-full mb-4',
  headerSubtitle: 'text-caption sm:text-label font-bold uppercase tracking-widest text-amber-700 block mb-0.5',
  headerTitle: 'text-2xl sm:text-3xl font-serif font-bold text-stone-900',
  listContainer: 'space-y-3',
  sermonCard:
    'flex items-start gap-3 sm:gap-4 rounded-2xl bg-white dark:bg-[#161412] border border-stone-200/90 dark:border-stone-800 shadow-sm p-3 sm:p-3.5 cursor-pointer transition-all active:scale-[0.99] hover:border-amber-300 dark:hover:border-amber-700/60 w-full min-w-0',
  thumbWrap:
    'relative flex-shrink-0 w-32 sm:w-44 aspect-video rounded-xl overflow-hidden bg-stone-100 dark:bg-stone-800',
  thumbImg: 'w-full h-full object-cover',
  platformBadge:
    'absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold',
  platformBadgeYt: 'bg-red-600 text-white',
  platformBadgeFb: 'bg-white text-[#1877f2] ring-1 ring-black/10',
  fbThumb:
    'w-full h-full bg-[#1877f2] flex flex-col items-center justify-center gap-0.5 text-white',
  fbThumbIcon: 'text-3xl font-extrabold leading-none',
  fbThumbLabel: 'text-[10px] font-semibold opacity-90',
  playBadge:
    'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-stone-950/70 flex items-center justify-center',
  playIcon: 'w-4 h-4 text-white fill-white ml-0.5',
  cardBody: 'flex-1 min-w-0',
  cardHeaderRow: 'flex items-start justify-between gap-2',
  cardTitle: 'flex-1 min-w-0 text-sm sm:text-base font-bold text-stone-950 dark:text-stone-50 leading-snug break-words line-clamp-2',
  cardDesc: 'text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-snug line-clamp-2 mt-1 break-words',
  cardDateRow: 'flex items-center gap-1.5 text-xs font-semibold text-stone-500 dark:text-stone-400 mt-1.5',
  cardDateIcon: 'w-3.5 h-3.5 text-amber-700 dark:text-amber-400 flex-shrink-0',
  adminActionRow: 'flex items-center gap-1 flex-shrink-0',
  emptyIcon: 'w-10 h-10 text-stone-300 mx-auto mb-3',
  emptyTitle: 'font-serif font-bold text-stone-900 dark:text-stone-100 text-base',
  emptySub: 'text-stone-500 dark:text-stone-400 text-xs mt-1',
};
