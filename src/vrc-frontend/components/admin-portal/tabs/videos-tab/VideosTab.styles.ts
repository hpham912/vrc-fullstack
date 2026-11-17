// Styles for the Videos tab shell (published videos list + delete
// modal). The form's keys live in VideoForm.styles.ts.
export const videosTabStyles = {
  container: 'space-y-6 max-w-2xl mx-auto w-full min-w-0',
  listSection: 'space-y-2 w-full min-w-0',
  listTitle: 'text-xs font-bold uppercase tracking-wider text-stone-500',
  list: 'divide-y divide-stone-100 dark:divide-stone-800 border border-stone-200 rounded-xl overflow-hidden bg-white',
  item: 'p-3 flex items-center gap-3 text-xs',
  itemThumb: 'w-20 aspect-video rounded-lg object-cover border border-stone-200 flex-shrink-0',
  itemThumbFb:
    'bg-[#1877f2] text-white flex items-center justify-center text-2xl font-extrabold',
  itemBody: 'min-w-0 flex-1',
  itemTitle: 'font-serif font-bold text-stone-950 line-clamp-1 block',
  itemDate: 'text-stone-600 font-semibold',
  itemActions: 'flex items-center gap-1 flex-shrink-0',
};
