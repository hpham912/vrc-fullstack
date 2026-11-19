import type { TranslationKey } from '../context/translations.ts';
import type { SelectOption } from '../common-component/select/Select.tsx';

// Weekly event presets — one-tap quick-add for the recurring services.
// A preset fills only the fields that are the same every week (titles,
// category, times, location, Zoom). It never touches the date, the
// description, the address or the organizer: the Wednesday class, for
// example, is usually at the sanctuary but sometimes meets at a
// member's home, so the admin picks the preset and then edits the
// address. Everything a preset fills stays editable afterwards.
export type EventPresetId = 'sunday-worship' | 'wednesday-bible-class';

export interface EventPreset {
  id: EventPresetId;
  nameKey: TranslationKey;
  category: string;
  titleVi: string;
  titleEn: string;
  startTime: string;
  endTime: string;
  locationVi: string;
  locationEn: string;
  hasZoom: boolean;
}

export const EVENT_PRESETS: EventPreset[] = [
  {
    id: 'sunday-worship',
    nameKey: 'presetSundayWorship',
    category: 'Worship',
    titleVi: 'Lễ Thờ Phượng Chúa Nhật',
    titleEn: 'Sunday Worship Service',
    startTime: '03:00 PM',
    endTime: '05:00 PM',
    locationVi: 'Main Sanctuary',
    locationEn: 'Main Sanctuary',
    hasZoom: true,
  },
  {
    id: 'wednesday-bible-class',
    nameKey: 'presetWednesdayBible',
    category: 'Bible',
    titleVi: 'Học Kinh Thánh & Cầu Nguyện',
    titleEn: 'Midweek Bible Study & Prayer',
    startTime: '07:00 PM',
    endTime: '08:30 PM',
    locationVi: 'Main Sanctuary',
    locationEn: 'Main Sanctuary',
    hasZoom: false,
  },
];

export function getEventPreset(id: string | null | undefined): EventPreset | undefined {
  if (!id) return undefined;
  return EVENT_PRESETS.find((preset) => preset.id === id);
}

// Select options for the preset picker: the placeholder first, then
// one option per preset. The picker is a one-shot action — the caller
// keeps its value at '' so the placeholder shows again after a pick.
export function getEventPresetOptions(t: (key: TranslationKey) => string): SelectOption[] {
  return [
    { value: '', label: t('eventPresetPlaceholder') },
    ...EVENT_PRESETS.map((preset) => ({ value: preset.id, label: t(preset.nameKey) })),
  ];
}
