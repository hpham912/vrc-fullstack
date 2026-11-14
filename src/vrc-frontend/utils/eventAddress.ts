import {
  DEFAULT_EVENT_ADDRESS,
  LEGACY_DEFAULT_EVENT_ADDRESS,
} from '../constants/church.ts';
import type { TranslationKey } from '../context/translations.ts';

// An event with no real street address stores a placeholder instead
// of a blank line. The placeholder is the Vietnamese "contact the
// church board" text (current default) or the older shorter one —
// both mean the same thing: there is nothing to route to.
export function isPlaceholderAddress(address: string | null | undefined): boolean {
  const trimmed = (address || '').trim();
  return (
    !trimmed ||
    trimmed === DEFAULT_EVENT_ADDRESS ||
    trimmed === LEGACY_DEFAULT_EVENT_ADDRESS
  );
}

// Display text for an event address. A real street address is shown
// as-is; an empty address (or either placeholder value) shows the
// "contact the church board" text in the current language, so
// English mode never shows the Vietnamese placeholder.
export function getDisplayAddress(
  address: string | null | undefined,
  t: (key: TranslationKey) => string,
): string {
  if (isPlaceholderAddress(address)) {
    return t('eventAddressContactBoard');
  }
  return (address || '').trim();
}
