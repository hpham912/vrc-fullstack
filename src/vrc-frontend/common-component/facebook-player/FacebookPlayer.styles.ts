// Shared Facebook video player (common-component/facebook-player): the
// modal player any screen can use to show a Facebook video. Same shape
// as the YouTube player (YouTubePlayer.styles.ts) so the two players
// look identical — body padding matches the other modals (p-6) so
// content never touches the modal edges. The frame follows the
// sermon's Tall/Wide choice (isVertical prop): a tall video gets the
// tall 9:16 frame and the bigger modal (max-w-4xl, set in the
// component), a wide video gets the wide 16:9 frame and the normal
// max-w-2xl modal. The shape is the admin's pick, not the link — a
// /reel/ link can hold a landscape video, and the link gives no
// reliable way to tell a video's real orientation.
export const facebookPlayerStyles = {
  body: 'p-6 max-sm:[.large-font_&]:p-4 space-y-3',
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
