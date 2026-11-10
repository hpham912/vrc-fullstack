// Styles for the shared church-info form (sanctuary name, address,
// contact, Zoom, weekly services). Used by both the Edit Church Info
// modal and the AdminPortal Church Info tab — one form, one source
// of truth. Only the styles the form actually uses live here; the
// old modal-only styles (backdrop, dialog, header) are gone with the
// shared Modal.
export const churchInfoFormStyles = {
  alertBase: "p-3 rounded-2xl flex items-center gap-2 text-xs font-semibold",
  alertSuccess: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60",
  alertError: "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60",
  alertIconSuccess: "w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0",
  alertIconError: "w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0",
  alertDismiss: "flex-shrink-0 p-1 rounded-lg hover:bg-black/5",
  alertDismissIcon: "w-4 h-4",

  form: "space-y-5 text-xs text-stone-700",
  sectionTitle: "font-serif font-bold text-stone-900 text-sm flex items-center gap-1.5",
  mapPinIcon: "w-4 h-4 text-amber-700 dark:text-amber-400",
  clockIcon: "w-4 h-4 text-indigo-600 dark:text-indigo-400",
  zoomIcon: "w-4 h-4 text-sky-600 dark:text-sky-400",
  hintText: "text-caption text-stone-500",
  fieldGroup: "space-y-1",
  label: "block text-label font-bold text-stone-600",
  labelWithRow: "block text-label font-bold text-stone-600 flex items-center justify-between",
  mapLinksGroup: "flex items-center gap-2 text-caption",
  googleMapLink: "text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-0.5 font-semibold",
  appleMapLink: "text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-0.5 font-semibold",
  externalIcon: "w-2.5 h-2.5",
  inputMedium: "w-full px-3 py-2 bg-white rounded-xl border border-stone-300 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium",
  inputRegular: "w-full px-3 py-2 bg-white rounded-xl border border-stone-300 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500",
  gridTwoCols: "grid grid-cols-1 sm:grid-cols-2 gap-3",
  gridTwoColsPt1: "grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1",

  servicesSection: "space-y-3",
  servicesHeader: "flex items-center justify-between",
  emptyServicesText: "text-xs font-medium text-stone-600",
  plusIconSm: "w-3.5 h-3.5",

  serviceCardHeader: "flex items-center justify-between",
  serviceCardTitle: "font-bold text-xs text-stone-900 flex items-center gap-1.5",
  serviceCrossIcon: "w-3.5 h-3.5 text-amber-600 dark:text-amber-400",
  serviceGrid: "grid grid-cols-1 sm:grid-cols-2 gap-2.5",
  serviceGridPt1: "grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1",
  subFieldGroup: "space-y-0.5",
  subLabel: "text-caption font-bold text-stone-500",
  serviceInputSemibold: "w-full px-2.5 py-1.5 bg-white rounded-lg border border-stone-300 text-xs font-semibold",
  serviceInputAmber: "w-full px-2.5 py-1.5 bg-white rounded-lg border border-stone-300 text-xs font-semibold text-amber-800",
  serviceInputRegular: "w-full px-2.5 py-1.5 bg-white rounded-lg border border-stone-300 text-xs",
  serviceInputIndigo: "w-full px-2.5 py-1.5 bg-white rounded-lg border border-stone-300 text-xs font-semibold text-indigo-700 dark:text-indigo-400",
  serviceTextarea: "w-full px-2.5 py-1.5 bg-white rounded-lg border border-stone-300 text-xs leading-relaxed",

  footer: "pt-3 border-t border-stone-200 flex items-center justify-end gap-2.5",
};
