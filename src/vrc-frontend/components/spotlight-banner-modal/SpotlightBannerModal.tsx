import React, { useState, useEffect } from 'react';
import { ChurchEvent, ChurchInfo, SpotlightBannerConfig, SpotlightTheme } from '../../types/index.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { apiUrl, apiHeaders } from '../../utils/api.ts';
import { fetchScripture } from '../../services/scriptureApi.ts';
import { getErrorMessage } from '../../utils/errors.ts';
import {
  Sparkles,
  Save,
  CheckCircle2,
  AlertCircle,
  Calendar,
  MapPin,
  Palette,
  Zap,
  Check,
} from 'lucide-react';
import { Modal, Button } from '../../common-component/index.ts';
import { spotlightBannerModalStyles as s } from './SpotlightBannerModal.styles.ts';

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
  icon: string;
  colorDot: string;
}

const THEME_OPTIONS: ThemeOption[] = [
  { key: 'thanksgiving', labelVi: 'Lễ Tạ Ơn (Thanksgiving)', labelEn: 'Thanksgiving', icon: '🍂', colorDot: 'bg-amber-500' },
  { key: 'christmas', labelVi: 'Lễ Giáng Sinh (Christmas)', labelEn: 'Christmas', icon: '🎄', colorDot: 'bg-red-600' },
  { key: 'easter', labelVi: 'Đại Lễ Phục Sinh (Easter)', labelEn: 'Easter', icon: '✝️', colorDot: 'bg-purple-600' },
  { key: 'revival', labelVi: 'Đại Hội Bồi Linh (Revival)', labelEn: 'Revival', icon: '🔥', colorDot: 'bg-blue-600' },
  { key: 'special', labelVi: 'Giới Trẻ (Youth)', labelEn: 'Youth', icon: '✨', colorDot: 'bg-emerald-600' },
  { key: 'default', labelVi: 'Cổ Điển (Classic)', labelEn: 'Classic', icon: '🏛️', colorDot: 'bg-stone-700' },
];

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
  const [selectedEventId, setSelectedEventId] = useState<number | null>(
    initialConfig?.selectedEventId ?? null
  );
  const [badgeText, setBadgeText] = useState(initialConfig?.badge || '');
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

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const upcomingEvents = events
    .filter((e) => e.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));

  useEffect(() => {
    if (isOpen) {
      setTheme(initialConfig?.theme || 'thanksgiving');
      const existingId = initialConfig?.selectedEventId ?? null;
      const isPast = existingId ? events.some((e) => e.id === existingId && e.date < todayStr) : false;
      setSelectedEventId(isPast ? null : existingId);
      setBadgeText(initialConfig?.badge || '');
      const savedSubtitle = initialConfig?.subtitle || 'Thi Thiên 100:4 - "Hãy cảm tạ mà vào các cửa Ngài, hãy ngợi khen mà vào các hành lang Ngài!"';
      setSubtitle(savedSubtitle);
      setSubtitleVi(initialConfig?.subtitleVi || savedSubtitle);
      setSubtitleEn(initialConfig?.subtitleEn || savedSubtitle);
      const savedRef = savedSubtitle.split(' - ')[0]?.trim() || '';
      setQuoteRef(savedRef.includes(':') ? savedRef : '');
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

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);
      setFeedback(null);
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

      const cleanBadge = (badgeText || '').trim();

      const payload: SpotlightBannerConfig = {
        mode: isAuto ? 'auto' : 'event',
        selectedEventId: isAuto ? null : selectedEventId,
        isActive: true,
        theme,
        badge: cleanBadge,
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
          <div
            className={`${s.alertBase} ${
              feedback.type === 'success' ? s.alertSuccess : s.alertError
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className={s.alertIconSuccess} />
            ) : (
              <AlertCircle className={s.alertIconError} />
            )}
            <span>{feedback.message}</span>
          </div>
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
                      <span className={s.themeBtnIcon}>{opt.icon}</span>
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
            </div>
          </div>

          {/* STEP 2: Pick Event to Feature */}
          <div className={s.stepBlockDivider}>
            <div className={s.stepHeader}>
              <label className={s.stepLabel}>
                <Calendar className={s.calendarIcon} />
                <span>{t('spotEventStep')}</span>
              </label>
              <span className={s.stepHint}>
                {t('spotEventAuto')}
              </span>
            </div>

            <div className={s.eventList}>
              {/* Option: Auto Next Upcoming Event */}
              <div
                onClick={() => setSelectedEventId(null)}
                className={`${s.eventOptionBase} ${
                  selectedEventId === null ? s.eventOptionSelected : s.eventOptionIdle
                }`}
              >
                <div className={s.autoInfoGroup}>
                  <div className={s.autoBadgeWrap}>
                    <span className={s.autoBadge}>
                      <Zap className={s.zapIcon} />
                      <span>{t('spotAuto')}</span>
                    </span>
                  </div>
                  <p className={s.autoTitle}>
                    {t('spotAutoTitle')}
                  </p>
                  <p className={s.autoSubtitle}>
                    {t('spotAutoSub')}
                  </p>
                </div>
                <div
                  className={`${s.radioCircleBase} ${
                    selectedEventId === null ? s.radioCircleSelected : s.radioCircleIdle
                  }`}
                >
                  {selectedEventId === null && <Check className={s.checkIcon} />}
                </div>
              </div>

              {upcomingEvents.length === 0 ? (
                <div className={s.emptyEventsBox}>
                  <p className={s.emptyEventsTitle}>
                    {t('spotNoEvents')}
                  </p>
                  <p className={s.emptyEventsSubtitle}>
                    {t('spotNoEventsSub')}
                  </p>
                </div>
              ) : (
                upcomingEvents.map((evt) => {
                  const isSelected = selectedEventId === evt.id;
                  return (
                    <div
                      key={evt.id}
                      onClick={() => setSelectedEventId(evt.id)}
                      className={`${s.eventOptionBase} ${
                        isSelected ? s.eventOptionSelected : s.eventOptionIdle
                      }`}
                    >
                      <div className={s.eventItemLeft}>
                        <div className={s.eventMetaRow}>
                          <span className={s.eventCategoryBadge}>
                            {evt.category}
                          </span>
                          <span className={s.eventDateTime}>
                            {evt.date} • {evt.startTime}
                          </span>
                        </div>
                        <p className={s.eventItemTitle}>{evt.title}</p>
                        <p className={s.eventItemLocation}>
                          <MapPin className={s.mapPinSm} />
                          <span>{evt.location} {evt.address ? `• ${evt.address}` : ''}</span>
                        </p>
                      </div>

                      <div
                        className={`${s.radioCircleBase} ${
                          isSelected ? s.radioCircleSelected : s.radioCircleIdle
                        }`}
                      >
                        {isSelected && <Check className={s.checkIcon} />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

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
            <input
              type="text"
              value={badgeText}
              onChange={(e) => setBadgeText(e.target.value)}
              className={s.inputMedium}
              placeholder={t('spotBadgePlaceholder')}
            />
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
            <label className={s.fieldLabel}>
              {t('spotQuoteViLabel')}
            </label>
            <input
              type="text"
              value={subtitleVi}
              onChange={(e) => {
                setSubtitleVi(e.target.value);
                setSubtitle(e.target.value);
              }}
              className={s.inputItalicSerif}
              placeholder='Thi Thiên 100:4 - "Hãy cảm tạ mà vào các cửa Ngài, hãy ngợi khen mà vào các hành lang Ngài!"'
            />
            <label className={s.fieldLabel}>
              {t('spotQuoteEnLabel')}
            </label>
            <input
              type="text"
              value={subtitleEn}
              onChange={(e) => setSubtitleEn(e.target.value)}
              className={s.inputItalicSerif}
              placeholder='Psalm 100:4 - "Enter his gates with thanksgiving and his courts with praise!"'
            />
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
              variant="primary"
              disabled={saving}
              leftIcon={<Save className={s.saveIcon} />}
            >
              <span>{saving ? t('commonSaving') : t('spotSaveApply')}</span>
            </Button>
          </div>
        </form>
    </Modal>
  );
};
