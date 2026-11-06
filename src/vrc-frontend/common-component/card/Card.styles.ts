export const cardStyles = {
  base: "transition-all min-w-0 max-w-full",
  variants: {
    default: "bg-white rounded-2xl border border-stone-200/90 shadow-2xs",
    elevated: "bg-white rounded-3xl border border-stone-200/90 shadow-sm",
    warm: "bg-gradient-to-br from-amber-50/90 via-white to-stone-50 rounded-2xl border border-amber-200/80 shadow-xs",
    warmElevated: "bg-gradient-to-br from-amber-50/90 via-white to-stone-50 rounded-3xl border border-amber-200/80 shadow-sm",
    emeraldWarm: "bg-gradient-to-br from-emerald-50/80 via-white to-amber-50/40 rounded-3xl border border-emerald-200/70 shadow-2xs",
    subtle: "bg-stone-50/90 rounded-2xl border border-stone-200/80",
    dark: "bg-stone-900 text-white rounded-2xl border border-stone-800 shadow-sm",
    empty: "bg-white rounded-3xl border border-stone-200/80 text-center shadow-2xs",
    quickNav: "group bg-white hover:bg-amber-50/40 p-3.5 rounded-2xl border border-stone-200/80 hover:border-amber-300 transition-all text-left shadow-2xs flex flex-col justify-between gap-2 active:scale-95 cursor-pointer",
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
