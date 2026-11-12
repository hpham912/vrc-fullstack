import React, { useState, useEffect, useRef } from 'react';
import { ChurchInfo, DailyVerse, HeaderVerse, DEFAULT_HEADER_VERSE } from '../../types/index.ts';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { Modal } from '../../common-component/modal/Modal.tsx';
import { Button, SegmentedControl } from '../../common-component/index.ts';
import { fetchScripture } from '../../services/scriptureApi.ts';
import { apiUrl, apiHeaders } from '../../utils/api.ts';
import { Sparkles, Save, BookOpen, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { editHeaderVerseModalStyles as s } from './EditHeaderVerseModal.styles.ts';

interface EditHeaderVerseModalProps {
  isOpen: boolean;
  onClose: () => void;
  churchInfo?: ChurchInfo | null;
  allVerses?: DailyVerse[];
  onSaveSuccess?: () => void;
}

// Form values, for dirty-checking: the Save button is only enabled
// while the form differs from the header verse it opened with.
type HeaderVerseFormValues = {
  textVi: string;
  textEn: string;
  referenceVi: string;
  referenceEn: string;
  translationVi: string;
  translationEn: string;
};

const getHeaderVerseValues = (hv: HeaderVerse): HeaderVerseFormValues => ({
  textVi: hv.verseTextVi || '',
  textEn: hv.verseTextEn || '',
  referenceVi: hv.referenceVi || '',
  referenceEn: hv.referenceEn || '',
  translationVi: hv.translationVi || '1925',
  translationEn: hv.translationEn || 'NIV',
});

export const EditHeaderVerseModal: React.FC<EditHeaderVerseModalProps> = ({
  isOpen,
  onClose,
  churchInfo,
  allVerses = [],
  onSaveSuccess,
}) => {
  const { language, t } = useLanguage();
  const { getToken } = useAuth();

  const currentHeaderVerse: HeaderVerse = churchInfo?.headerVerse || DEFAULT_HEADER_VERSE;

  const [searchPassage, setSearchPassage] = useState('');
  const [fetchingApi, setFetchingApi] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [verseTextVi, setVerseTextVi] = useState(currentHeaderVerse.verseTextVi || '');
  const [verseTextEn, setVerseTextEn] = useState(currentHeaderVerse.verseTextEn || '');
  const [referenceVi, setReferenceVi] = useState(currentHeaderVerse.referenceVi || '');
  const [referenceEn, setReferenceEn] = useState(currentHeaderVerse.referenceEn || '');
  const [translationVi, setTranslationVi] = useState(currentHeaderVerse.translationVi || '1925');
  const [translationEn, setTranslationEn] = useState(currentHeaderVerse.translationEn || 'NIV');

  // Preview language toggle inside modal
  const [previewLang, setPreviewLang] = useState<'vi' | 'en'>(language);

  // Last loaded values — the Save button is enabled only while the
  // form differs from these.
  const baselineRef = useRef<HeaderVerseFormValues>(getHeaderVerseValues(currentHeaderVerse));

  // Sync state when modal opens or churchInfo updates
  useEffect(() => {
    if (isOpen) {
      const active = churchInfo?.headerVerse || DEFAULT_HEADER_VERSE;
      setVerseTextVi(active.verseTextVi || '');
      setVerseTextEn(active.verseTextEn || '');
      setReferenceVi(active.referenceVi || '');
      setReferenceEn(active.referenceEn || '');
      setTranslationVi(active.translationVi || '1925');
      setTranslationEn(active.translationEn || 'NIV');
      baselineRef.current = getHeaderVerseValues(active);
      setFeedback(null);
      setPreviewLang(language);
    }
  }, [isOpen, churchInfo, language]);

  if (!isOpen) return null;

  // Dirty-check: any field differs from the header verse it opened
  // with. Fetch-from-Bible and quick-pick count as changes, since
  // they write the text and reference fields.
  const baseline = baselineRef.current;
  const isDirty =
    verseTextVi !== baseline.textVi ||
    verseTextEn !== baseline.textEn ||
    referenceVi !== baseline.referenceVi ||
    referenceEn !== baseline.referenceEn ||
    translationVi !== baseline.translationVi ||
    translationEn !== baseline.translationEn;

  // Fetch via Bible API (apibible: NIV English + 1925 Vietnamese)
  const handleFetchFromBibleApi = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = searchPassage.trim();
    if (!query) {
      setFeedback({ type: 'error', message: t('adminFetchRefFirst') });
      return;
    }
    try {
      setFetchingApi(true);
      setFeedback(null);
      const token = getToken();
      const result = await fetchScripture(query, token);
      if (!result.verseTextVi && !result.verseTextEn) {
        throw new Error('No scripture found for: ' + query);
      }
      setVerseTextVi(result.verseTextVi || result.verseText);
      setVerseTextEn(result.verseTextEn || result.verseText);
      setReferenceVi(result.referenceVi || result.reference || query);
      setReferenceEn(result.referenceEn || result.reference || query);
      if (result.translationVi) setTranslationVi(result.translationVi);
      if (result.translationEn) setTranslationEn(result.translationEn);
      setFeedback({
        type: 'success',
        message: `${result.referenceEn || result.reference} loaded successfully via Bible API!`,
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to fetch verse from Bible API',
      });
    } finally {
      setFetchingApi(false);
    }
  };

  // Quick pick from recent daily verses
  const handleSelectRecentVerse = (verseIdStr: string) => {
    const id = parseInt(verseIdStr, 10);
    const selected = allVerses.find((v) => v.id === id);
    if (!selected) return;
    setVerseTextVi(selected.verseTextVi || selected.verseText || '');
    setVerseTextEn(selected.verseTextEn || selected.verseText || '');
    setReferenceVi(selected.referenceVi || selected.reference || '');
    setReferenceEn(selected.referenceEn || selected.reference || '');
    setTranslationVi(selected.translationVi || '1925');
    setTranslationEn(selected.translationEn || 'NIV');
    setFeedback({
      type: 'success',
      message: `Selected: ${selected.referenceVi || selected.reference}`,
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verseTextVi.trim() || !verseTextEn.trim() || !referenceVi.trim() || !referenceEn.trim()) {
      setFeedback({
        type: 'error',
        message: 'Please provide verse text and references in both Vietnamese and English.',
      });
      return;
    }

    try {
      setSaving(true);
      setFeedback(null);
      const token = getToken();
      const payload: HeaderVerse = {
        verseTextVi: verseTextVi.trim(),
        verseTextEn: verseTextEn.trim(),
        referenceVi: referenceVi.trim(),
        referenceEn: referenceEn.trim(),
        translationVi: translationVi.trim() || '1925',
        translationEn: translationEn.trim() || 'NIV',
      };

      const res = await fetch(apiUrl('/api/church-info/header-verse'), {
        method: 'PUT',
        headers: apiHeaders({
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        }),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || t('headerVerseSaveFailed'));
      }

      setFeedback({ type: 'success', message: t('headerVerseSavedSuccess') });
      onSaveSuccess?.();
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || t('headerVerseSaveFailed') });
    } finally {
      setSaving(false);
    }
  };

  const displayPreviewText = previewLang === 'vi' ? (verseTextVi || verseTextEn) : (verseTextEn || verseTextVi);
  const displayPreviewRef = previewLang === 'vi' ? (referenceVi || referenceEn) : (referenceEn || referenceVi);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('headerVerseModalTitle')}
      subtitle={t('headerVerseModalSubtitle')}
      maxWidthClass="max-w-2xl"
    >
      <form onSubmit={handleSave} className={s.container}>
        {/* Status Feedback */}
        {feedback && (
          <div className={feedback.type === 'success' ? s.feedbackSuccess : s.feedbackError}>
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Bible API Search & Auto-Fill Card */}
        <div className={s.apiCard}>
          <div className={s.apiCardTitle}>
            <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>{t('headerVerseSearchLabel')}</span>
          </div>

          <div className={s.apiSearchRow}>
            <input
              type="text"
              value={searchPassage}
              onChange={(e) => setSearchPassage(e.target.value)}
              placeholder={t('headerVerseSearchPlaceholder')}
              className={s.apiSearchInput}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleFetchFromBibleApi();
                }
              }}
            />
            <button
              type="button"
              disabled={fetchingApi || !searchPassage.trim()}
              onClick={() => handleFetchFromBibleApi()}
              className={s.apiFetchBtn}
            >
              {fetchingApi ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{t('headerVerseFetching')}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{t('headerVerseFetchBible')}</span>
                </>
              )}
            </button>
          </div>

          {/* Quick select from recent verses if available */}
          {allVerses.length > 0 && (
            <div className={s.recentPickerRow}>
              <span className={s.recentPickerLabel}>{t('headerVersePickRecent')}:</span>
              <select
                onChange={(e) => handleSelectRecentVerse(e.target.value)}
                defaultValue=""
                className={s.recentSelect}
              >
                <option value="" disabled>
                  {t('headerVerseSelectPlaceholder')}
                </option>
                {allVerses.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.referenceVi || v.reference} ({v.referenceEn || v.reference}) - "{v.verseText.slice(0, 45)}..."
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Live Preview Card */}
        <div className={s.previewCard}>
          <div className={s.previewHeader}>
            <span>{t('headerVersePreview')}</span>
            <SegmentedControl
              options={[
                { value: 'vi', label: 'Tiếng Việt' },
                { value: 'en', label: 'English' },
              ]}
              value={previewLang}
              onChange={setPreviewLang}
              size="sm"
            />
          </div>

          <div className={s.previewBox}>
            <p className={s.previewQuote}>
              "{displayPreviewText || (previewLang === 'vi' ? 'Nội dung câu gốc...' : 'Verse text goes here...')}"
              <span className={s.previewRef}>
                — {displayPreviewRef || (previewLang === 'vi' ? 'Địa chỉ phân đoạn' : 'Reference')}
              </span>
            </p>
          </div>
        </div>

        {/* Vietnamese Section */}
        <div className={s.formSection}>
          <div className={s.fieldGroup}>
            <label className={s.fieldLabel}>{t('headerVerseViRef')}</label>
            <input
              type="text"
              required
              value={referenceVi}
              onChange={(e) => setReferenceVi(e.target.value)}
              placeholder="Giăng 3:16"
              className={s.textInput}
            />
          </div>

          <div className={s.fieldGroup}>
            <label className={s.fieldLabel}>{t('headerVerseViText')}</label>
            <textarea
              rows={3}
              required
              value={verseTextVi}
              onChange={(e) => setVerseTextVi(e.target.value)}
              placeholder="Vì Đức Chúa Trời yêu thương thế gian..."
              className={s.textareaInput}
            />
          </div>
        </div>

        {/* English Section */}
        <div className={s.formSection}>
          <div className={s.fieldGroup}>
            <label className={s.fieldLabel}>{t('headerVerseEnRef')}</label>
            <input
              type="text"
              required
              value={referenceEn}
              onChange={(e) => setReferenceEn(e.target.value)}
              placeholder="John 3:16"
              className={s.textInput}
            />
          </div>

          <div className={s.fieldGroup}>
            <label className={s.fieldLabel}>{t('headerVerseEnText')}</label>
            <textarea
              rows={3}
              required
              value={verseTextEn}
              onChange={(e) => setVerseTextEn(e.target.value)}
              placeholder="For God so loved the world..."
              className={s.textareaInput}
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className={s.footerRow}>
          <button
            type="button"
            onClick={onClose}
            className={s.cancelBtn}
          >
            {t('commonCancel')}
          </button>
          <Button
            type="submit"
            variant="dark"
            size="md"
            disabled={saving || fetchingApi || !isDirty}
            leftIcon={
              saving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )
            }
          >
            <span>{saving ? t('commonSaving') : t('commonSaveChanges')}</span>
          </Button>
        </div>
      </form>
    </Modal>
  );
};
