// Shared Facebook video player (common-component/facebook-player): the
// modal player any screen can use to show a Facebook video. Same shape
// as the YouTube player (YouTubePlayer.styles.ts) so the two players
// look identical — body padding matches the other modals (p-6) so
// content never touches the modal edges. The frame is the wide 16:9
// frame for every Facebook video, like YouTube: a /reel/ link does
// NOT mean the video is vertical (a Reel can hold a landscape video),
// and a tall 9:16 frame then leaves a big black area under the video.
// The link, the embed and the page give no reliable way to tell a
// video's real orientation, so 16:9 is the safe frame for all of them.
// Only a Reel gets the bigger modal (max-w-4xl, set in the component);
// a landscape video uses the normal max-w-2xl modal.
export const facebookPlayerStyles = {
  body: 'p-6 space-y-3',
  frameVideo: 'w-full aspect-video rounded-xl bg-stone-950 border-0',
  desc: 'text-sm text-stone-700 dark:text-stone-300 leading-relaxed whitespace-pre-line break-words',
  meta: 'flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-stone-500 dark:text-stone-400',
  dateRow: 'flex items-center gap-1.5',
  dateIcon: 'w-3.5 h-3.5 text-amber-700 dark:text-amber-400 flex-shrink-0',
  watchLink:
    'inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-400 hover:text-amber-950 dark:hover:text-amber-300',
  watchIcon: 'w-3.5 h-3.5',
};
