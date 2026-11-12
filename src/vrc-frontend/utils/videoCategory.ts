import type { BadgeTone } from '../common-component/badge/Badge.tsx';
import type { TranslationKey } from '../context/translations.ts';

// Video categories: the four built-in ones plus any custom name an
// admin typed in the video form. Shared by the public Video tab (the
// filter row and the category badge on each card) and the admin video
// form (the category picker and the published list), so the label and
// the badge tone for a category can never drift apart between the
// two screens.
export const VIDEO_BUILTIN_CATEGORIES = ['sermon', 'singing', 'reel', 'other'] as const;

export type VideoBuiltinCategory = (typeof VIDEO_BUILTIN_CATEGORIES)[number];

// The picker value in the admin video form — the four built-ins plus
// 'custom', which opens the text input for the custom name.
export type VideoCategoryPicker = VideoBuiltinCategory | 'custom';

export function isBuiltinVideoCategory(category: string): category is VideoBuiltinCategory {
  return (VIDEO_BUILTIN_CATEGORIES as readonly string[]).includes(category);
}

// Translation key for a built-in category's label, or null for a
// custom category — custom names show exactly as the admin typed
// them, in both languages.
export function getVideoCategoryLabelKey(category: string): TranslationKey | null {
  switch (category) {
    case 'sermon':
      return 'videoCategorySermon';
    case 'singing':
      return 'videoCategorySinging';
    case 'reel':
      return 'videoCategoryReel';
    case 'other':
      return 'videoCategoryOther';
    default:
      return null;
  }
}

// Display label for a category in the current language: the
// translated label for a built-in category, the typed name for a
// custom one.
export function getVideoCategoryLabel(
  category: string,
  t: (key: TranslationKey) => string,
): string {
  const labelKey = getVideoCategoryLabelKey(category);
  return labelKey ? t(labelKey) : category;
}

// Badge tone for a category: sermon amber, singing emerald, reel
// violet, other stone, any custom category rose.
export function getVideoCategoryTone(category: string): BadgeTone {
  switch (category) {
    case 'sermon':
      return 'amber';
    case 'singing':
      return 'emerald';
    case 'reel':
      return 'violet';
    case 'other':
      return 'stone';
    default:
      return 'rose';
  }
}
