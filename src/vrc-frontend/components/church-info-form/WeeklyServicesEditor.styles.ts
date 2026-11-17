// Styles for the weekly services editor (the weekly worship services
// section of the church-info form). Moved out of
// ChurchInfoForm.styles.ts when the section became its own component.
// The sectionTitle / fieldGroup / plusIconSm keys are shared with the
// parent form's other sections, so the same class strings live in both
// files and each component stays self-contained.
export const weeklyServicesEditorStyles = {
  servicesSection: "space-y-3",
  servicesHeader: "flex items-center justify-between",
  sectionTitle: "font-serif font-bold text-stone-900 text-sm flex items-center gap-1.5",
  clockIcon: "w-4 h-4 text-indigo-600 dark:text-indigo-400",
  emptyServicesText: "text-xs font-medium text-stone-600",
  plusIconSm: "w-3.5 h-3.5",
  fieldGroup: "space-y-1",
  // Bilingual field topic heading — one topic in two languages, then
  // a labeled TextField per language ("Tiếng Việt" / "English" via
  // the TextField label prop). The group wrapper reuses fieldGroup.
  fieldLabel: "block text-xs font-bold text-stone-700 dark:text-stone-300",
  serviceCardHeader: "flex items-center justify-between",
  serviceCardTitle: "font-bold text-xs text-stone-900 flex items-center gap-1.5",
  serviceCrossIcon: "w-3.5 h-3.5 text-amber-600 dark:text-amber-400",
  subFieldGroup: "space-y-0.5",
  subLabel: "text-caption font-bold text-stone-500",
  serviceTextarea: "w-full px-2.5 py-1.5 bg-white rounded-lg border border-stone-300 text-xs leading-relaxed",
};
