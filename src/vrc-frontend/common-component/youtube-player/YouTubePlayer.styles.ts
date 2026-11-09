// Shared YouTube video player (common-component/youtube-player): the
// modal player any screen can use to show a YouTube video. Body padding
// matches the other modals (p-6, same as DirectionsModal) so content
// never touches the modal edges.
export const youtubePlayerStyles = {
  body: 'p-6 space-y-3',
  frame: 'w-full aspect-video rounded-xl bg-stone-950 border-0',
  desc: 'text-sm text-stone-700 dark:text-stone-300 leading-relaxed whitespace-pre-line break-words',
  meta: 'flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-stone-500 dark:text-stone-400',
  dateRow: 'flex items-center gap-1.5',
  dateIcon: 'w-3.5 h-3.5 text-amber-700 dark:text-amber-400 flex-shrink-0',
  watchLink:
    'inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-400 hover:text-amber-950 dark:hover:text-amber-300',
  watchIcon: 'w-3.5 h-3.5',
};
