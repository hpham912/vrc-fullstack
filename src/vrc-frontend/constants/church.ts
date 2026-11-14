export const CHURCH_NAME = {
  vi: 'Hội Thánh Tin Lành Báp-tít Phục Hưng',
  en: 'Vietnamese Revival Baptist Church',
  address: '1565 E Warner Rd, Tempe AZ 85284'
} as const;

// Default address for a new event, and for an event with no specific
// address. Not a real street address — Directions buttons are hidden
// for it, and it is shown as the bilingual "contact the church
// board" text (see getDisplayAddress in utils/eventAddress.ts).
export const DEFAULT_EVENT_ADDRESS = 'Liên lạc Ban Chấp Hành Hội Thánh';

// Older saved events used the shorter placeholder; it means the same
// "no real address" as the current default (see isPlaceholderAddress).
export const LEGACY_DEFAULT_EVENT_ADDRESS = 'Liên hệ Hội Thánh';
