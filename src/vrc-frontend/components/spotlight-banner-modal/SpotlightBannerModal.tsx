import React, { useState, useEffect, useRef } from 'react';
import { ChurchEvent, ChurchInfo, CustomTheme, CustomThemeStyle, SpotlightBannerConfig, SpotlightTheme } from '../../types/index.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { apiUrl, apiHeaders } from '../../utils/api.ts';
import { fetchScripture } from '../../services/scriptureApi.ts';
import { getErrorMessage } from '../../utils/errors.ts';
import { isValidHexColor } from '../../utils/customTheme.ts';
import {
  Sparkles,
  Save,
  Palette,
  Wheat,
  TreePine,
  Cross,
  Flame,
  Landmark,
  Plus,
  X,
  Pencil,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Modal, Button, Banner, TextField } from '../../common-component/index.ts';
import { spotlightBannerModalStyles as s } from './SpotlightBannerModal.styles.ts';
import { CustomThemeCreator, type CustomColorSlot, MAX_CUSTOM_COLORS } from './CustomThemeCreator.tsx';
import { SpotlightEventPicker } from './SpotlightEventPicker.tsx';

interface SpotlightBannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialConfig?: SpotlightBannerConfig | null;
  events?: ChurchEvent[];
  churchInfo?: ChurchInfo | null;
  onSaved: (updated: SpotlightBannerConfig) => void;
}

interface ThemeOption {
  key: SpotlightTheme;
  labelVi: string;
  labelEn: string;
  icon: LucideIcon;
  colorDot: string;
}

const THEME_OPTIONS: ThemeOption[] = [
  { key: 'thanksgiving', labelVi: 'Lễ Tạ Ơn (Thanksgiving)', labelEn: 'Thanksgiving', icon: Wheat, colorDot: 'bg-amber-500' },
  { key: 'christmas', labelVi: 'Lễ Giáng Sinh (Christmas)', labelEn: 'Christmas', icon: TreePine, colorDot: 'bg-red-600' },
  { key: 'easter', labelVi: 'Đại Lễ Phục Sinh (Easter)', labelEn: 'Easter', icon: Cross, colorDot: 'bg-purple-600' },
  { key: 'revival', labelVi: 'Đại Hội Bồi Linh (Revival)', labelEn: 'Revival', icon: Flame, colorDot: 'bg-blue-600' },
  { key: 'special', labelVi: 'Giới Trẻ (Youth)', labelEn: 'Youth', icon: Sparkles, colorDot: 'bg-emerald-600' },
  { key: 'default', labelVi: 'Cổ Điển (Classic)', labelEn: 'Classic', icon: Landmark, colorDot: 'bg-stone-700' },
];

const MAX_CUSTOM_THEMES = 10;
const DEFAULT_CUSTOM_COLORS = ['#991b1b', '#166534', '#d4af37'];

// A unique id for a new custom theme or color slot (timestamp +
// random suffix).
function newCustomThemeId(): string {
  return `ct-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function toColorSlots(colors: string[]): CustomColorSlot[] {
  return colors.map((value) => ({ id: newCustomThemeId(), value }));
}

// Form values, for dirty-checking: the Save button is only enabled
// while the form differs from the banner it opened with.
type SpotlightFormValues = {
  theme: SpotlightTheme;
  customThemes: CustomTheme[];
  customThemeId: string | null;
  selectedEventId: number | null;
  badgeVi: string;
  badgeEn: string;
  subtitle: string;
  subtitleVi: string;
  subtitleEn: string;
  quoteRef: string;
};

const DEFAULT_SPOTLIGHT_SUBTITLE = 'Thi Thiên 100:4 - "Hãy cảm tạ mà vào các cửa Ngài, hãy ngợi khen mà vào các hành lang Ngài!"';

const getSpotlightValues = (
  initialConfig: SpotlightBannerConfig | null | undefined,
  events: ChurchEvent[],
  todayStr: string
): SpotlightFormValues => {
  const savedSubtitle = initialConfig?.subtitle || DEFAULT_SPOTLIGHT_SUBTITLE;
  const existingId = initialConfig?.selectedEventId ?? null;
  const isPast = existingId ? events.some((e) => e.id === existingId && e.date < todayStr) : false;
  const savedRef = savedSubtitle.split(' - ')[0]?.trim() || '';
  return {
    theme: initialConfig?.theme || 'thanksgiving',
    customThemes: initialConfig?.customThemes ?? [],
    customThemeId: initialConfig?.customThemeId ?? null,
    selectedEventId: isPast ? null : existingId,
    badgeVi: initialConfig?.badgeVi || initialConfig?.badge || '',
    badgeEn: initialConfig?.badgeEn || initialConfig?.badge || '',
    subtitle: savedSubtitle,
    subtitleVi: initialConfig?.subtitleVi || savedSubtitle,
    subtitleEn: initialConfig?.subtitleEn || savedSubtitle,
    quoteRef: savedRef.includes(':') ? savedRef : '',
  };
};

export const SpotlightBannerModal: React.FC<SpotlightBannerModalProps> = ({
  isOpen,
  onClose,
  initialConfig,
  events = [],
  churchInfo,
  onSaved,
}) => {
  const { getToken } = useAuth();
  const { language, t } = useLanguage();

  const [theme, setTheme] = useState<SpotlightTheme>(initialConfig?.theme || 'thanksgiving');
  // Saved custom themes and which one is active when theme is 'custom'.
  const [customThemes, setCustomThemes] = useState<CustomTheme[]>(
    initialConfig?.customThemes ?? []
  );
  const [customThemeId, setCustomThemeId] = useState<string | null>(
    initialConfig?.customThemeId ?? null
  );
  // Custom theme creator: open state, the theme being edited (null for
  // a new one), and the draft name / style / colors.
  const [creatorOpen, setCreatorOpen] = useState(false);
  const [editingCustomId, setEditingCustomId] = useState<string | null>(null);
  const [customName, setCustomName] = useState('');
  const [customStyle, setCustomStyle] = useState<CustomThemeStyle>('diagonal');
  const [customColors, setCustomColors] = useState<CustomColorSlot[]>(() =>
    toColorSlots(DEFAULT_CUSTOM_COLORS)
  );
  // Per-element color overrides (null = auto, derived from the theme
  // colors). The button is "View Events", the pill is the special
  // badge, and the border is the banner's border + ring.
  const [customButtonColor, setCustomButtonColor] = useState<string | null>(null);
  const [customBadgeColor, setCustomBadgeColor] = useState<string | null>(null);
  const [customBorderColor, setCustomBorderColor] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(
    initialConfig?.selectedEventId ?? null
  );
  // Per-language pill badge text. The combined `badge` stays as the
  // Vietnamese version for fallback.
  const [badgeVi, setBadgeVi] = useState(
    initialConfig?.badgeVi || initialConfig?.badge || ''
  );
  const [badgeEn, setBadgeEn] = useState(
    initialConfig?.badgeEn || initialConfig?.badge || ''
  );
  const [subtitle, setSubtitle] = useState(
    initialConfig?.subtitle || 'Thi Thiên 100:4 - "Hãy cảm tạ mà vào các cửa Ngài, hãy ngợi khen mà vào các hành lang Ngài!"'
  );
  // Per-language scripture quotes (filled by Fetch from Bible, editable).
  // The combined `subtitle` stays as the Vietnamese version for fallback.
  const [subtitleVi, setSubtitleVi] = useState(
    initialConfig?.subtitleVi || initialConfig?.subtitle || ''
  );
  const [subtitleEn, setSubtitleEn] = useState(
    initialConfig?.subtitleEn || initialConfig?.subtitle || ''
  );
  // Reference typed by admin to fetch (e.g. "Thi Thiên 100:4"). Prefilled
  // from the saved quote when it starts with a reference ("Ref - ...").
  const initialQuoteRef = (() => {
    const saved = (initialConfig?.subtitle || '').split(' - ')[0]?.trim() || '';
    return saved.includes(':') ? saved : '';
  })();
  const [quoteRef, setQuoteRef] = useState(initialQuoteRef);
  const [fetchingQuote, setFetchingQuote] = useState(false);
  const [fetchedQuoteKey, setFetchedQuoteKey] = useState<string | null>(null);
  const isQuoteFetchedForCurrentRef =
    fetchedQuoteKey !== null && fetchedQuoteKey === quoteRef.trim();

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  // Success message shown below the save button (mobile only) after a
  // save completes. The modal closes 900ms after a save, so this is
  // brief — it reinforces the save right where the admin tapped.
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  // Error message shown below the save button (mobile only) when a save
  // fails. Unlike success, it does NOT auto-hide.
  const [saveError, setSaveError] = useState<string | null>(null);
  const saveSuccessTimeout = useRef<number | null>(null);
  // Auto-clears the top feedback Banner after a "Use This Theme"
  // confirmation (same 4s as the save success message).
  const feedbackTimeout = useRef<number | null>(null);

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const upcomingEvents = events
    .filter((e) => e.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));

  // Last loaded values — the Save button is enabled only while the
  // form differs from these.
  const baselineRef = useRef<SpotlightFormValues>(getSpotlightValues(initialConfig, events, todayStr));

  useEffect(() => {
    if (isOpen) {
      const values = getSpotlightValues(initialConfig, events, todayStr);
      setTheme(values.theme);
      setCustomThemes(values.customThemes);
      setCustomThemeId(values.customThemeId);
      setCreatorOpen(false);
      setEditingCustomId(null);
      setSelectedEventId(values.selectedEventId);
      setBadgeVi(values.badgeVi);
      setBadgeEn(values.badgeEn);
      setSubtitle(values.subtitle);
      setSubtitleVi(values.subtitleVi);
      setSubtitleEn(values.subtitleEn);
      setQuoteRef(values.quoteRef);
      baselineRef.current = values;
      setFetchedQuoteKey(null);
    }
  }, [isOpen, initialConfig, events, todayStr]);

  // Fetch real EN + VI scripture text from POST /api/ai/fetch-scripture
  // (apibible: NIV English + Kinh Thánh 1925 Vietnamese) and fill both
  // quote fields in the exact display format: Ref - "verse text".
  // Reuses the shared fetchScripture helper (same as the verse form).
  const handleFetchQuote = async () => {
    const passage = quoteRef.trim();
    if (!passage) {
      setFeedback({ type: 'error', message: t('adminFetchRefFirst') });
      return;
    }
    try {
      setFetchingQuote(true);
      const data = await fetchScripture(passage, getToken());
      if (!data.verseTextEn || !data.verseTextVi) {
        throw new Error('Failed to fetch scripture');
      }
      const fetchedRefEn = data.referenceEn || data.reference || passage;
      const fetchedRefVi = data.referenceVi || data.reference || passage;
      const viQuote = `${fetchedRefVi} - "${data.verseTextVi}"`;
      const enQuote = `${fetchedRefEn} - "${data.verseTextEn}"`;
      setSubtitleVi(viQuote);
      setSubtitleEn(enQuote);
      setSubtitle(viQuote);
      setFetchedQuoteKey(passage);
      setFeedback({
        type: 'success',
        message: t('adminVerseFetched', { ref: data.referenceEn || passage }),
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: getErrorMessage(err, language, t('errFetchScripture')),
      });
    } finally {
      setFetchingQuote(false);
    }
  };

  // --- Custom themes ---

  // Open the creator: blank for a new theme, pre-filled when editing
  // an existing one.
  const openCustomCreator = (themeToEdit?: CustomTheme) => {
    if (themeToEdit) {
      setEditingCustomId(themeToEdit.id);
      setCustomName(themeToEdit.name);
      setCustomStyle(themeToEdit.style);
      setCustomColors(
        themeToEdit.colors.length > 0
          ? toColorSlots(themeToEdit.colors)
          : toColorSlots(DEFAULT_CUSTOM_COLORS)
      );
      setCustomButtonColor(themeToEdit.buttonColor ?? null);
      setCustomBadgeColor(themeToEdit.badgeColor ?? null);
      setCustomBorderColor(themeToEdit.borderColor ?? null);
    } else {
      setEditingCustomId(null);
      setCustomName('');
      setCustomStyle('diagonal');
      setCustomColors(toColorSlots(DEFAULT_CUSTOM_COLORS));
      setCustomButtonColor(null);
      setCustomBadgeColor(null);
      setCustomBorderColor(null);
    }
    setCreatorOpen(true);
  };

  const closeCustomCreator = () => {
    setCreatorOpen(false);
    setEditingCustomId(null);
  };

  // Save the draft into the list (add new, or update the edited one)
  // and select it. The modal's Save Changes still persists everything
  // to the server; this only updates the local list.
  const handleUseCustomTheme = () => {
    const name = customName.trim();
    if (!name) {
      setFeedback({ type: 'error', message: t('spotCustomNameRequired') });
      return;
    }
    if (customThemes.length >= MAX_CUSTOM_THEMES && !editingCustomId) {
      setFeedback({ type: 'error', message: t('spotCustomMaxThemes') });
      return;
    }
    const cleanColors = customColors
      .map((slot) => slot.value.trim())
      .filter((color) => isValidHexColor(color))
      .slice(0, MAX_CUSTOM_COLORS);
    if (cleanColors.length === 0) {
      setFeedback({ type: 'error', message: t('spotCustomNeedColor') });
      return;
    }
    const id = editingCustomId ?? newCustomThemeId();
    const saved: CustomTheme = {
      id,
      name,
      colors: cleanColors,
      style: customStyle,
      buttonColor: customButtonColor && isValidHexColor(customButtonColor) ? customButtonColor.trim() : null,
      badgeColor: customBadgeColor && isValidHexColor(customBadgeColor) ? customBadgeColor.trim() : null,
      borderColor: customBorderColor && isValidHexColor(customBorderColor) ? customBorderColor.trim() : null,
    };
    setCustomThemes((prev) => {
      const exists = prev.some((customTheme) => customTheme.id === id);
      return exists
        ? prev.map((customTheme) => (customTheme.id === id ? saved : customTheme))
        : [...prev, saved];
    });
    setTheme('custom');
    setCustomThemeId(id);
    // Confirm the theme was added/updated, and remind the admin it is
    // only in the list until the modal's Save Changes persists it.
    // Clears after 4s, like the save success message.
    if (feedbackTimeout.current) {
      window.clearTimeout(feedbackTimeout.current);
      feedbackTimeout.current = null;
    }
    setFeedback({
      type: 'success',
      message: t(editingCustomId ? 'spotCustomUpdated' : 'spotCustomAdded', { name }),
    });
    feedbackTimeout.current = window.setTimeout(() => setFeedback(null), 4000);
    closeCustomCreator();
  };

  // Select a saved custom theme from the grid.
  const handleSelectCustomTheme = (id: string) => {
    setTheme('custom');
    setCustomThemeId(id);
  };

  // Delete a saved custom theme. If it was the active one, fall back
  // to the first remaining theme (or the Classic preset when none are
  // left). Nothing is persisted until the modal's Save Changes.
  const handleDeleteCustomTheme = (id: string) => {
    setCustomThemes((prev) => {
      const remaining = prev.filter((customTheme) => customTheme.id !== id);
      if (customThemeId === id) {
        if (remaining.length > 0) {
          setCustomThemeId(remaining[0].id);
        } else {
          setCustomThemeId(null);
          setTheme('thanksgiving');
        }
      }
      return remaining;
    });
  };

  const handleAddCustomColor = () => {
    if (customColors.length >= MAX_CUSTOM_COLORS) return;
    setCustomColors((prev) => [...prev, { id: newCustomThemeId(), value: '#c9a227' }]);
  };

  const handleRemoveCustomColor = (id: string) => {
    if (customColors.length <= 1) return;
    setCustomColors((prev) => prev.filter((slot) => slot.id !== id));
  };

  const handleCustomColorChange = (id: string, value: string) => {
    setCustomColors((prev) =>
      prev.map((slot) => (slot.id === id ? { ...slot, value } : slot))
    );
  };

  if (!isOpen) return null;

  // Dirty-check: any saved field differs from the banner it opened
  // with. Fetch-from-Bible counts as a change, since it writes the
  // quote fields. The quote reference is only a fetch input (it is
  // not saved), so changing it alone does not enable Save. The custom
  // theme list is compared by value (order + content).
  const baseline = baselineRef.current;
  const isDirty =
    theme !== baseline.theme ||
    JSON.stringify(customThemes) !== JSON.stringify(baseline.customThemes) ||
    customThemeId !== baseline.customThemeId ||
    selectedEventId !== baseline.selectedEventId ||
    badgeVi !== baseline.badgeVi ||
    badgeEn !== baseline.badgeEn ||
    subtitle !== baseline.subtitle ||
    subtitleVi !== baseline.subtitleVi ||
    subtitleEn !== baseline.subtitleEn;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);
      setFeedback(null);
      setSaveSuccess(null);
      setSaveError(null);
      if (saveSuccessTimeout.current) {
        window.clearTimeout(saveSuccessTimeout.current);
        saveSuccessTimeout.current = null;
      }
      if (feedbackTimeout.current) {
        window.clearTimeout(feedbackTimeout.current);
        feedbackTimeout.current = null;
      }
      const token = getToken();

      const isAuto = selectedEventId === null;
      const pickedEvt = !isAuto
        ? upcomingEvents.find((e) => e.id === selectedEventId)
        : null;

      const defaultChurchAddress = (churchInfo?.address || 'Tempe, Arizona').trim();
      const defaultChurchMapsUrl = churchInfo?.googleMapsUrl || `https://maps.google.com/?q=${encodeURIComponent(defaultChurchAddress)}`;

      const eventHasCustomAddress = Boolean(pickedEvt?.address?.trim()) &&
        pickedEvt!.address!.trim().toLowerCase() !== defaultChurchAddress.toLowerCase();

      const cleanAddress = eventHasCustomAddress ? pickedEvt!.address!.trim() : defaultChurchAddress;
      const cleanDirectionsUrl = eventHasCustomAddress
        ? `https://maps.google.com/?q=${encodeURIComponent(cleanAddress)}`
        : defaultChurchMapsUrl;

      const cleanBadge = (badgeVi || '').trim();

      const payload: SpotlightBannerConfig = {
        mode: isAuto ? 'auto' : 'event',
        selectedEventId: isAuto ? null : selectedEventId,
        isActive: true,
        theme,
        customThemes,
        customThemeId,
        badge: cleanBadge,
        badgeVi: (badgeVi || '').trim(),
        badgeEn: (badgeEn || '').trim(),
        subtitle: (subtitle || '').trim(),
        subtitleVi: (subtitleVi || '').trim(),
        subtitleEn: (subtitleEn || '').trim(),
        title: isAuto ? '' : (pickedEvt ? pickedEvt.title : ''),
        description: isAuto ? '' : (pickedEvt ? pickedEvt.description : ''),
        dateTag: isAuto ? '' : (pickedEvt ? `${pickedEvt.date} • ${pickedEvt.startTime}` : ''),
        locationTag: isAuto ? '' : (pickedEvt ? (pickedEvt.location || defaultChurchAddress) : defaultChurchAddress),
        customAddress: cleanAddress,
        primaryBtnText: 'Xem Sự Kiện',
        primaryBtnAction: 'events',
        secondaryBtnText: 'Chỉ Đường',
        secondaryBtnUrl: cleanDirectionsUrl,
        updatedAt: new Date().toISOString(),
      };

      try {
        localStorage.setItem('vrc_cached_spotlight', JSON.stringify(payload));
      } catch (cacheErr) {
        console.warn('Local cache warning:', cacheErr);
      }

      if (!token) {
        setFeedback({
          type: 'error',
          message: t('spotLoginFirst'),
        });
        onSaved(payload);
        return;
      }

      const res = await fetch(apiUrl('/api/spotlight'), {
        method: 'PUT',
        headers: apiHeaders({
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        }),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || t('spotUpdateFailed'));
      }

      const updated: SpotlightBannerConfig = await res.json();
      try {
        localStorage.setItem('vrc_cached_spotlight', JSON.stringify(updated));
      } catch (e) {}

      setFeedback({
        type: 'success',
        message: t('spotSaved'),
      });
      setSaveSuccess(t('spotSaved'));
      saveSuccessTimeout.current = window.setTimeout(() => setSaveSuccess(null), 4000);
      onSaved(updated);
      setTimeout(() => {
        onClose();
      }, 900);
    } catch (err: any) {
      console.error('Error saving spotlight:', err);
      const isNetworkLoadFailed = String(err?.message || '').toLowerCase().includes('load failed') || String(err?.message || '').toLowerCase().includes('failed to fetch');
      const friendlyMsg = isNetworkLoadFailed
        ? t('spotOfflineSaved')
        : (err.message || t('spotSaveFailed'));

      setFeedback({
        type: 'error',
        message: friendlyMsg,
      });
      setSaveError(friendlyMsg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidthClass="max-w-xl"
      icon={<Sparkles className={s.headerIcon} />}
      subtitle={t('spotSubtitle')}
      title={t('spotTitle')}
    >
      {/* Feedback message */}
        {feedback && (
          <Banner
            type={feedback.type}
            message={feedback.message}
            className="mx-5 mt-4"
          />
        )}

        {/* Form Body */}
        <form onSubmit={handleSave} className={s.form}>
          {/* STEP 1: Select Theme */}
          <div className={s.stepBlock}>
            <div className={s.stepHeader}>
              <label className={s.stepLabel}>
                <Palette className={s.paletteIcon} />
                <span>{t('spotThemeStep')}</span>
              </label>
            </div>

            <div className={s.themeGrid}>
              {THEME_OPTIONS.map((opt) => {
                const isSelected = theme === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setTheme(opt.key)}
                    className={`${s.themeBtnBase} ${
                      isSelected ? s.themeBtnSelected : s.themeBtnIdle
                    }`}
                  >
                    <div className={s.themeBtnContent}>
                      <opt.icon className={s.themeBtnIcon} />
                      <span className={s.themeBtnText}>
                        {language === 'vi' ? opt.labelVi : opt.labelEn}
                      </span>
                    </div>
                    <div
                      className={`${s.colorDotBase} ${opt.colorDot} ${
                        isSelected ? s.colorDotSelected : s.colorDotIdle
                      }`}
                    />
                  </button>
                );
              })}

              {/* Saved custom themes: each shows its name + color strip.
                  Tapping selects it; the pencil edits it, the x deletes
                  it (nothing is persisted until Save Changes). */}
              {customThemes.map((customTheme) => {
                const isSelected = theme === 'custom' && customThemeId === customTheme.id;
                return (
                  <div
                    key={customTheme.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleSelectCustomTheme(customTheme.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') handleSelectCustomTheme(customTheme.id);
                    }}
                    className={`${s.customThemeBtnBase} ${
                      isSelected ? s.themeBtnSelected : s.themeBtnIdle
                    }`}
                  >
                    <div className={s.customThemeBtnTop}>
                      <Palette className={s.themeBtnIcon} />
                      <span className={s.themeBtnText}>{customTheme.name}</span>
                    </div>
                    <div className={s.customThemeBtnBottom}>
                      <div className={s.customColorStrip}>
                        {customTheme.colors.map((color, colorIndex) => (
                          <span
                            key={`${customTheme.id}-c${colorIndex}`}
                            className={s.customColorDot}
                            style={{ background: color }}
                          />
                        ))}
                      </div>
                      <div className={s.customThemeActions}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openCustomCreator(customTheme);
                          }}
                          className={s.customActionBtn}
                          title={t('spotCustomEdit')}
                          aria-label={`${t('spotCustomEdit')}: ${customTheme.name}`}
                        >
                          <Pencil className={s.customActionIcon} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCustomTheme(customTheme.id);
                          }}
                          className={s.customActionBtn}
                          title={t('spotCustomDelete')}
                          aria-label={`${t('spotCustomDelete')}: ${customTheme.name}`}
                        >
                          <X className={s.customActionIcon} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Create a new custom theme (up to 10 saved). */}
              {customThemes.length < MAX_CUSTOM_THEMES && (
                <button
                  type="button"
                  onClick={() => openCustomCreator()}
                  className={`${s.themeBtnBase} ${s.customCreateBtn}`}
                >
                  <div className={s.themeBtnContent}>
                    <Plus className={s.themeBtnIcon} />
                    <span className={s.themeBtnText}>{t('spotCustomCreate')}</span>
                  </div>
                </button>
              )}
            </div>

            {/* Custom theme creator: name, style, up to 5 colors, and a
                live preview of the banner in the draft theme. The parent
                owns all draft state; the creator only renders it. */}
            {creatorOpen && (
              <CustomThemeCreator
                editingCustomId={editingCustomId}
                name={customName}
                onNameChange={setCustomName}
                style={customStyle}
                onStyleChange={setCustomStyle}
                colors={customColors}
                onColorChange={handleCustomColorChange}
                onAddColor={handleAddCustomColor}
                onRemoveColor={handleRemoveCustomColor}
                buttonColor={customButtonColor}
                onButtonColorChange={setCustomButtonColor}
                badgeColor={customBadgeColor}
                onBadgeColorChange={setCustomBadgeColor}
                borderColor={customBorderColor}
                onBorderColorChange={setCustomBorderColor}
                badgeText={badgeVi}
                onCancel={closeCustomCreator}
                onUse={handleUseCustomTheme}
              />
            )}
          </div>

          {/* STEP 2: Pick Event to Feature. The parent owns the
              selection; the picker only renders it. */}
          <SpotlightEventPicker
            events={upcomingEvents}
            selectedEventId={selectedEventId}
            onSelect={setSelectedEventId}
          />

          {/* STEP 3: Customizable Pill Tag Text */}
          <div className={s.inputSectionDivider}>
            <div className={s.stepHeader}>
              <label className={s.fieldLabel}>
                {t('spotBadgeStep')}
              </label>
              <span className={s.fieldHint}>
                {t('spotBadgeHint')}
              </span>
            </div>
            <div className={s.fieldGroup}>
              <TextField
                label={t('commonLangVi')}
                value={badgeVi}
                onChange={setBadgeVi}
                placeholder={t('spotBadgePlaceholder')}
              />
              <TextField
                label={t('commonLangEn')}
                value={badgeEn}
                onChange={setBadgeEn}
                placeholder={t('spotBadgePlaceholder')}
              />
            </div>
            <p className={s.fieldHint}>
              {t('spotBadgeNote')}
            </p>
          </div>

          {/* STEP 4: Optional Scripture Quote / Subtitle */}
          <div className={s.inputSectionDivider}>
            <label className={s.fieldLabel}>
              {t('spotQuoteStep')}
            </label>
            <label className={s.fieldLabel}>
              {t('spotQuoteRefLabel')}
            </label>
            <div className={s.quoteFetchRow}>
              <input
                type="text"
                value={quoteRef}
                onChange={(e) => {
                  setQuoteRef(e.target.value);
                  setFetchedQuoteKey(null);
                }}
                className={s.quoteRefInput}
                placeholder={t('spotQuoteRefPlaceholder')}
              />
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleFetchQuote}
                disabled={fetchingQuote || isQuoteFetchedForCurrentRef || !quoteRef.trim()}
                title={
                  isQuoteFetchedForCurrentRef
                    ? t('adminVerseFetchedHint')
                    : t('adminVerseFetchHint')
                }
                leftIcon={<Sparkles className={s.saveIcon} />}
              >
                <span>
                  {fetchingQuote
                    ? t('commonFetching')
                    : isQuoteFetchedForCurrentRef
                      ? t('adminVerseFetchedBadge')
                      : t('adminVerseFetch')}
                </span>
              </Button>
            </div>
            <div className={s.fieldGroup}>
              <TextField
                label={t('commonLangVi')}
                value={subtitleVi}
                onChange={(value) => {
                  setSubtitleVi(value);
                  setSubtitle(value);
                }}
                placeholder='Thi Thiên 100:4 - "Hãy cảm tạ mà vào các cửa Ngài, hãy ngợi khen mà vào các hành lang Ngài!"'
              />
              <TextField
                label={t('commonLangEn')}
                value={subtitleEn}
                onChange={setSubtitleEn}
                placeholder='Psalm 100:4 - "Enter his gates with thanksgiving and his courts with praise!"'
              />
            </div>
            <p className={s.fieldHint}>
              {t('spotQuoteNote')}
            </p>
          </div>

          {/* Footer Submit Buttons */}
          <div className={s.footer}>
            <Button type="button" variant="secondary" onClick={onClose}>
              {t('commonCancel')}
            </Button>
            <Button
              type="submit"
              variant="dark"
              loading={saving}
              disabled={saving || !isDirty}
              leftIcon={<Save className={s.saveIcon} />}
            >
              <span>{saving ? t('commonSaving') : t('commonSaveChanges')}</span>
            </Button>
          </div>
          {saveSuccess && (
            <Banner type="success" message={saveSuccess} className="md:hidden mt-2" />
          )}
          {saveError && (
            <Banner
              type="error"
              message={saveError}
              className="md:hidden mt-2"
              onDismiss={() => setSaveError(null)}
            />
          )}
        </form>
    </Modal>
  );
};
