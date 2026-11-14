// Flip-clock countdown (Design F) — shared component.
// Dark tiles with big white numbers, like a digital clock. The
// flip-clock look is the built-in default; a caller can add its own
// classes via the component's className prop (layout, spacing).
// The fixed near-black/gold colors work on dark backgrounds; on a
// light background the caller should pass a wrapping className
// (e.g. a dark rounded card) around it.
export const countdownTimerStyles = {
  container: 'pt-1',
  // Small gold label above the tiles ("Bắt đầu sau" / "Starts in").
  label: 'text-label font-bold uppercase tracking-widest text-amber-300',
  row: 'flex items-start gap-1.5 max-sm:[.large-font_&]:gap-1 mt-2',
  // Near-black tile.
  tile: 'relative flex-1 overflow-hidden rounded-xl border border-white/15 bg-[#0c0a09] px-1 max-sm:[.large-font_&]:px-0.5 py-2.5 max-sm:[.large-font_&]:py-2 text-center',
  // The flip-clock seam: a faint line through the middle of the tile.
  tileSplit: 'absolute left-0 right-0 top-1/2 h-px bg-white/10',
  tileNumber: 'text-2xl sm:text-3xl max-sm:[.large-font_&]:text-xl font-bold text-white tabular-nums leading-none',
  tileUnit: 'mt-1.5 text-caption max-sm:[.large-font_&]:text-[10.5px] font-bold uppercase tracking-wider max-sm:[.large-font_&]:tracking-normal text-white/60 leading-none',
  colon: 'pt-2 max-sm:[.large-font_&]:pt-1.5 text-xl sm:text-2xl max-sm:[.large-font_&]:text-lg font-bold text-amber-400',
};
