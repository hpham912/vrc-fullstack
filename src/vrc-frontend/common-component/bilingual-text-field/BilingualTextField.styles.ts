// Bilingual text field styles — the Scripture Pool form's field
// group classes (VersesTab.styles.ts): a stacked group, a bold topic
// heading, and the smaller amber language sub-labels. These three
// classes live ONLY here; callers use the component, never these
// class names directly.
export const bilingualTextFieldStyles = {
  fieldGroup: 'space-y-1.5',
  fieldLabel: 'block text-xs font-bold text-stone-700 dark:text-stone-300',
  langLabel: 'block text-[11px] font-bold text-amber-800 dark:text-amber-400',
};
