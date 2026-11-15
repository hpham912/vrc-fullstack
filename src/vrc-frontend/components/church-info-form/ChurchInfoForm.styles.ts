// Styles for the shared church-info form (sanctuary name, address,
// contact, Zoom, weekly services). Used by both the Edit Church Info
// modal and the AdminPortal Church Info tab — one form, one source
// of truth. Only the styles the form actually uses live here; the
// old modal-only styles (backdrop, dialog, header) are gone with the
// shared Modal.
export const churchInfoFormStyles = {
  form: "space-y-5 text-xs text-stone-700",
  sectionTitle: "font-serif font-bold text-stone-900 text-sm flex items-center gap-1.5",
  mapPinIcon: "w-4 h-4 text-amber-700 dark:text-amber-400",
  clockIcon: "w-4 h-4 text-indigo-600 dark:text-indigo-400",
  zoomIcon: "w-4 h-4 text-sky-600 dark:text-sky-400",
  hintText: "text-caption text-stone-500",
  fieldGroup: "space-y-1",
  // Bilingual field topic heading — one topic in two languages, then
  // a labeled TextField per language ("Tiếng Việt" / "English" via
  // the TextField label prop). The group wrapper reuses fieldGroup.
  fieldLabel: "block text-xs font-bold text-stone-700 dark:text-stone-300",
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
  subFieldGroup: "space-y-0.5",
  subLabel: "text-caption font-bold text-stone-500",
  serviceTextarea: "w-full px-2.5 py-1.5 bg-white rounded-lg border border-stone-300 text-xs leading-relaxed",

  footer: "pt-3 border-t border-stone-200 flex items-center justify-end gap-2.5",
};
