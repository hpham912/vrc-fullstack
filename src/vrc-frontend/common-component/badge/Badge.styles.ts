// Shared Badge: one small pill. Every tone is a light tint with a
// dark label (plus an explicit dark: twin), so the badge stays
// readable in both modes and in the new theme — the amber tint is
// the only one the new-theme remap touches, and it maps to the gold
// tint there, which still reads as amber.
//
// youtube / facebook are SOLID platform badges, not tints: they sit
// on top of video thumbnails (photos and the bright blue Facebook
// placeholder), where a tint — especially the dark-mode /20
// translucent twin — washes out and turns unreadable. Solid in both
// modes, so they read the same on the thumbnail in light and dark.
// facebook is white with blue text, like the old Sermons badge.
export const badgeStyles = {
  badge: 'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold leading-tight whitespace-nowrap',
  amber: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300',
  emerald: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300',
  violet: 'bg-violet-100 text-violet-800 dark:bg-violet-500/20 dark:text-violet-300',
  stone: 'bg-stone-100 text-stone-700 dark:bg-stone-700/50 dark:text-stone-300',
  rose: 'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300',
  red: 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300',
  blue: 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300',
  youtube: 'bg-red-600 text-white',
  facebook: 'bg-white text-[#1877f2]',
};
