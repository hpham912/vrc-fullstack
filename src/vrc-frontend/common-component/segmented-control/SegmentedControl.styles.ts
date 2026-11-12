// Shared segmented control (common-component/segmented-control):
// a row of options where exactly one is selected — the "pick one of
// two" pattern that used to be hand-built in three places (the
// Tall/Wide choice in the Sermons admin form, the preview-language
// picker in the Events admin form, and the desktop language pill in
// the Navbar). One copy here, so the look and the selected state can
// never drift apart.
//
// Two sizes: 'sm' is the small pill in a container (language
// pickers — white active pill, like the Navbar); 'md' is the larger
// standalone buttons (Tall/Wide — dark active button). The value is
// a string union ('vi' | 'en', 'tall' | 'wide'), so callers map it
// to their own state (a boolean for Tall/Wide, Language for the
// language pickers).
export const segmentedControlStyles = {
  // Small: a pill container holding small buttons.
  containerSm:
    'flex items-center bg-stone-100 dark:bg-stone-800 p-1 rounded-xl border border-stone-300 dark:border-stone-700 text-xs font-bold shadow-2xs',
  btnSm: 'px-2 py-1 rounded-lg transition-all flex items-center gap-1 text-label',
  btnSmActive: 'bg-white dark:bg-stone-950 text-stone-950 dark:text-white shadow-xs font-bold',
  btnSmIdle:
    'text-stone-600 dark:text-stone-400 hover:text-stone-950 dark:hover:text-white font-semibold',
  // Medium: larger standalone buttons with their own borders.
  // The base sets layout only — NO colors. The active and idle
  // states each set their own bg / text / border. If the base also
  // set bg-white + text-stone-700, those would fight the active
  // state's bg-stone-950 + text-white in the same class list, and
  // Tailwind's stylesheet order picks a winner per property — which
  // is how the active button ended up white-on-white (invisible
  // text) with a dark border. The small size already worked this
  // way, which is why the event language toggle looked right.
  containerMd: 'flex gap-2 w-full sm:w-2/3',
  btnMd: 'flex-1 px-3 py-2 rounded-lg border text-xs font-bold',
  btnMdActive: 'bg-stone-950 text-white border-stone-950 hover:border-stone-950',
  btnMdIdle: 'bg-white text-stone-700 border-stone-300 hover:border-stone-500',
};
