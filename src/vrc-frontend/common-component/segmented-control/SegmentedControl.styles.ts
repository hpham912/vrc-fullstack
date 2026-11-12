// Shared segmented control (common-component/segmented-control):
// a row of options where exactly one is selected — the "pick one of
// two" pattern that used to be hand-built in four places (the
// Tall/Wide choice in the Sermons admin form, the preview-language
// picker in the Events admin form and the header-verse editor, and
// the desktop language pill in the Navbar). One copy here, one look
// everywhere, so the pickers can never drift apart.
//
// A single small-pill style: a container holding small buttons, the
// selected one a white pill. There used to be a second, larger "md"
// style (dark active button) for Tall/Wide, but two looks for the
// same component made the pickers inconsistent — the sermon one
// looked off next to the event one — so the sizes were dropped and
// every picker uses this one style. The base button sets layout only
// (no colors); the active and idle states each set their own bg /
// text, so no two colors fight in one class list (that fight is how
// the old Tall/Wide active button ended up white-on-white, invisible).
export const segmentedControlStyles = {
  container:
    'flex w-fit items-center bg-stone-100 dark:bg-stone-800 p-1 rounded-xl border border-stone-300 dark:border-stone-700 text-xs font-bold shadow-2xs',
  btn: 'px-2 py-1 rounded-lg transition-all flex items-center gap-1 text-label',
  btnActive: 'bg-white dark:bg-stone-950 text-stone-950 dark:text-white shadow-xs font-bold',
  btnIdle:
    'text-stone-600 dark:text-stone-400 hover:text-stone-950 dark:hover:text-white font-semibold',
};
