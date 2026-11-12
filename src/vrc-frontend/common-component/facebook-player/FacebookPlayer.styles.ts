// Shared Facebook video player (common-component/facebook-player): the
// modal player any screen can use to show a Facebook video. Same shape
// as the YouTube player (YouTubePlayer.styles.ts) so the two players
// look identical — body padding matches the other modals (p-6) so
// content never touches the modal edges. The frame fits the video:
// a Reel is vertical 9:16, so it gets a tall centered frame (a wide
// 16:9 frame would shrink it to a narrow strip and hide the play
// button); any other Facebook video is landscape, so it gets the
// wide 16:9 frame like YouTube.
export const facebookPlayerStyles = {
  body: 'p-6 space-y-3',
  frameReel: 'mx-auto aspect-[9/16] h-[60vh] max-h-[560px] w-auto max-w-full rounded-xl bg-stone-950 border-0',
  frameVideo: 'w-full aspect-video rounded-xl bg-stone-950 border-0',
  desc: 'text-sm text-stone-700 dark:text-stone-300 leading-relaxed whitespace-pre-line break-words',
  meta: 'flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-stone-500 dark:text-stone-400',
  dateRow: 'flex items-center gap-1.5',
  dateIcon: 'w-3.5 h-3.5 text-amber-700 dark:text-amber-400 flex-shrink-0',
  watchLink:
    'inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-400 hover:text-amber-950 dark:hover:text-amber-300',
  watchIcon: 'w-3.5 h-3.5',
};
