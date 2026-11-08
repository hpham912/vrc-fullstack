export const cardStyles = {
  base: "transition-all min-w-0 max-w-full",
  variants: {
    default: "bg-white dark:bg-[#161412] rounded-2xl border border-stone-200/90 dark:border-stone-800 shadow-2xs",
    elevated: "bg-white dark:bg-[#161412] rounded-3xl border border-stone-200/90 dark:border-stone-800 shadow-sm",
    warm: "bg-gradient-to-br from-amber-50/90 via-white to-stone-50 dark:from-[#1c1611] dark:via-[#161310] dark:to-[#191410] rounded-2xl border border-amber-200/80 dark:border-amber-500/25 shadow-xs",
    warmElevated: "bg-gradient-to-br from-amber-50/90 via-white to-stone-50 dark:from-[#1c1611] dark:via-[#161310] dark:to-[#191410] rounded-3xl border border-amber-200/80 dark:border-amber-500/25 shadow-sm",
    emeraldWarm: "bg-gradient-to-br from-emerald-50/80 via-white to-amber-50/40 dark:from-[#0f1d16] dark:via-[#131714] dark:to-[#181410] rounded-3xl border border-emerald-200/70 dark:border-emerald-500/25 shadow-2xs",
    subtle: "bg-stone-50/90 dark:bg-stone-900/90 rounded-2xl border border-stone-200/80 dark:border-stone-800",
    dark: "bg-stone-900 text-white rounded-2xl border border-stone-800 shadow-sm",
    empty: "bg-white dark:bg-[#161412] rounded-3xl border border-stone-200/80 dark:border-stone-800 text-center shadow-2xs",
    quickNav: "group bg-white dark:bg-[#161412] hover:bg-amber-50/50 dark:hover:bg-amber-950/20 p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl border border-stone-200/80 dark:border-stone-800 hover:border-amber-400/60 dark:hover:border-amber-500/40 transition-all text-center shadow-2xs hover:shadow-xs flex flex-col items-center justify-center gap-1 active:scale-95 cursor-pointer",
  },
  paddings: {
    none: "",
    xs: "p-3",
    sm: "p-3.5 sm:p-4",
    md: "p-4 sm:p-5",
    lg: "p-5 sm:p-8",
    empty: "p-10",
  },
  interactive: "cursor-pointer hover:shadow-md hover:border-amber-300/80 active:scale-[0.99]",
};
