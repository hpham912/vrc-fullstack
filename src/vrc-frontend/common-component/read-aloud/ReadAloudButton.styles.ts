// ReadAloudButton — the shared "Listen" button. Same look as the old
// Scripture Listen button (outline pill, amber speaker icon, amber
// filled + pulsing while speaking), so any screen can drop it in and
// it matches.
export const readAloudButtonStyles = {
  base: 'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors',
  active: 'bg-amber-600 text-white border-amber-600 animate-pulse',
  inactive: 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50',
  icon: 'w-3.5 h-3.5',
  iconIdle: 'w-3.5 h-3.5 text-amber-700',
};
