import React, { useEffect, useState } from 'react';
import { Edit3, Save, Sparkles, Trash2 } from 'lucide-react';
import { DailyVerse, ChurchInfo, DEFAULT_HEADER_VERSE } from '../../../../types/index.ts';
import { useLanguage } from '../../../../context/LanguageContext.tsx';
import { apiFetch } from '../../../../utils/api.ts';
import { getErrorMessage } from '../../../../utils/errors.ts';
import { NotificationClient } from '../../../../services/notificationClient.ts';
import { fetchScripture } from '../../../../services/scriptureApi.ts';
import { Button } from '../../../../common-component/index.ts';
import { versesTabStyles as s } from './VersesTab.styles.ts';

interface VersesTabProps {
  allVerses: DailyVerse[];
  initialVerse?: DailyVerse | null;
  // Which tab the parent is showing. The child stays mounted for the
  // whole portal session (returning null when its tab isn't active) so
  // a half-typed form or an in-progress edit survives switching to
  // another tab and back, exactly as before the split.
  activeTab: string;
  getToken: () => string | null;
  showFeedback: (type: 'success' | 'error', message: string) => void;
  onRefreshData: () => void;
  // The parent header shows "Edit Verse" vs "Add Verse" in focused mode,
  // so the child reports whether it is currently editing a verse.
  onEditingChange: (editing: boolean) => void;
  churchInfo?: ChurchInfo | null;
  onOpenHeaderVerseEditor?: () => void;
}

// Daily verses: form + published list. Owns all verse form state, the
// fetch-from-Bible flow, save/edit/delete, and its own submitting flag.
// Prefills from initialVerse when the portal is opened to edit a verse.
export const VersesTab: React.FC<VersesTabProps> = ({
  allVerses,
  initialVerse,
  activeTab,
  getToken,
  showFeedback,
  onRefreshData,
  onEditingChange,
  churchInfo,
  onOpenHeaderVerseEditor,
}) => {
  const { t, language } = useLanguage();
  const [editingVerseId, setEditingVerseId] = useState<number | null>(null);
  const [verseDate, setVerseDate] = useState(new Date().toISOString().split('T')[0]);
  const [verseReferenceVi, setVerseReferenceVi] = useState('');
  const [verseReferenceEn, setVerseReferenceEn] = useState('');
  const [verseTranslationVi, setVerseTranslationVi] = useState('1925');
  const [verseTranslationEn, setVerseTranslationEn] = useState('NIV');
  const [verseTextVi, setVerseTextVi] = useState('');
  const [verseTextEn, setVerseTextEn] = useState('');
  const [verseReflectionVi, setVerseReflectionVi] = useState('');
  const [verseReflectionEn, setVerseReflectionEn] = useState('');
  const [versePrayerVi, setVersePrayerVi] = useState('');
  const [versePrayerEn, setVersePrayerEn] = useState('');
  const [verseTheme, setVerseTheme] = useState('Revival & Faith');
  const [fetchingScripture, setFetchingScripture] = useState(false);
  // Reference the last successful "Fetch from Bible" was for, as
  // "referenceEn|referenceVi". While the form still shows that exact
  // reference the button stays disabled; editing either reference
  // changes the key and re-enables it.
  const [fetchedScriptureKey, setFetchedScriptureKey] = useState<string | null>(null);
  const isScriptureFetchedForCurrentRef =
    fetchedScriptureKey !== null &&
    fetchedScriptureKey === `${verseReferenceEn.trim()}|${verseReferenceVi.trim()}`;
  const [editingVerseAudit, setEditingVerseAudit] = useState<{
    createdBy?: string | null;
    createdAt?: string;
    updatedBy?: string | null;
    updatedAt?: string | null;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const resetVerseForm = () => {
    setEditingVerseId(null);
    setVerseDate(new Date().toISOString().split('T')[0]);
    setVerseReferenceVi('');
    setVerseReferenceEn('');
    setVerseTranslationVi('1925');
    setVerseTranslationEn('NIV');
    setVerseTextVi('');
    setVerseTextEn('');
    setVerseReflectionVi('');
    setVerseReflectionEn('');
    setVersePrayerVi('');
    setVersePrayerEn('');
    setVerseTheme('Revival & Faith');
    setFetchedScriptureKey(null);
    setEditingVerseAudit(null);
  };

  const handleEditVerse = (v: DailyVerse) => {
    // id 0 is the built-in fallback verse shown when the DB is empty —
    // it is not a DB row, so editing it starts a NEW verse (null id
    // makes the save POST instead of PUT /api/verses/0, which would
    // 404). Don't rely on 0 being falsy here.
    setEditingVerseId(v.id > 0 ? v.id : null);
    setVerseDate(v.date);
    setVerseReferenceVi(v.referenceVi || v.reference || '');
    setVerseReferenceEn(v.referenceEn || v.reference || '');
    setVerseTranslationVi(v.translationVi || '1925');
    setVerseTranslationEn(v.translationEn || v.translation || 'NIV');
    setVerseTextVi(v.verseTextVi || v.verseText || '');
    setVerseTextEn(v.verseTextEn || v.verseText || '');
    setVerseReflectionVi(v.reflectionVi || v.reflection || '');
    setVerseReflectionEn(v.reflectionEn || v.reflection || '');
    setVersePrayerVi(v.prayerVi || v.prayer || '');
    setVersePrayerEn(v.prayerEn || v.prayer || '');
    setVerseTheme(v.theme || 'Revival & Faith');
    setFetchedScriptureKey(null);
    setEditingVerseAudit({
      createdBy: v.createdBy,
      createdAt: v.createdAt,
      updatedBy: v.updatedBy,
      updatedAt: v.updatedAt,
    });
  };

  // Fetch real EN + VI scripture text from POST /api/ai/fetch-scripture
  // (apibible: NIV English + Kinh Thánh 1925 Vietnamese) and fill both
  // sides of the form. Never machine-translate scripture here — both
  // texts come from the Bible API, verse-for-verse.
  const handleFetchScriptureForVerse = async () => {
    const passage = verseReferenceEn.trim() || verseReferenceVi.trim();
    if (!passage) {
      showFeedback('error', t('adminFetchRefFirst'));
      return;
    }
    try {
      setFetchingScripture(true);
      const data = await fetchScripture(passage, getToken());
      if (!data.verseTextEn || !data.verseTextVi) {
        throw new Error('Failed to fetch scripture');
      }
      const fetchedRefEn = data.referenceEn || data.reference || passage;
      const fetchedRefVi = data.referenceVi || data.reference || passage;
      setVerseReferenceEn(fetchedRefEn);
      setVerseReferenceVi(fetchedRefVi);
      setVerseTextEn(data.verseTextEn);
      setVerseTextVi(data.verseTextVi);
      // Bible versions come from the API response (NIV + 1925), so the
      // version fields fill themselves — no typing needed.
      setVerseTranslationEn(data.translationEn || data.translation || 'NIV');
      setVerseTranslationVi(data.translationVi || '1925');
      setFetchedScriptureKey(`${fetchedRefEn.trim()}|${fetchedRefVi.trim()}`);
      showFeedback('success', t('adminVerseFetched', { ref: data.referenceEn || passage }));
    } catch (err: any) {
      showFeedback('error', getErrorMessage(err, language, t('errFetchScripture')));
    } finally {
      setFetchingScripture(false);
    }
  };

  const handleSaveVerse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verseDate || !verseReferenceVi.trim() || !verseReferenceEn.trim() || !verseTextVi.trim() || !verseTextEn.trim()) {
      showFeedback('error', t('adminVerseFillBoth'));
      return;
    }

    try {
      setSubmitting(true);
      const token = getToken();
      const endpoint = editingVerseId ? `/api/verses/${editingVerseId}` : '/api/verses';
      const method = editingVerseId ? 'PUT' : 'POST';
      // apiFetch throws a structured ApiError (status + backend code) on
      // failure, so the catch below can turn it into an accurate message
      // via getErrorMessage instead of showing raw text.
      await apiFetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          date: verseDate,
          reference: verseReferenceEn.trim(),
          referenceVi: verseReferenceVi.trim(),
          referenceEn: verseReferenceEn.trim(),
          translation: verseTranslationEn.trim() || 'NIV',
          translationVi: verseTranslationVi.trim() || '1925',
          translationEn: verseTranslationEn.trim() || 'NIV',
          verseText: verseTextEn.trim(),
          verseTextVi: verseTextVi.trim(),
          verseTextEn: verseTextEn.trim(),
          reflection: verseReflectionEn.trim() || verseTextEn.trim(),
          reflectionVi: verseReflectionVi.trim() || verseTextVi.trim(),
          reflectionEn: verseReflectionEn.trim() || verseTextEn.trim(),
          prayer: versePrayerEn.trim() || null,
          prayerVi: versePrayerVi.trim() || null,
          prayerEn: versePrayerEn.trim() || null,
          theme: verseTheme.trim() || 'Daily Scripture',
        }),
      });

      showFeedback('success', editingVerseId ? t('adminVerseUpdated') : t('adminVerseSaved'));

      if (!editingVerseId) {
        NotificationClient.triggerNotification(
          `Scripture of the Day: ${verseReferenceEn.trim()}`,
          `"${verseTextEn.slice(0, 100)}..."`
        );
      }

      resetVerseForm();
      onRefreshData();
    } catch (err: any) {
      showFeedback('error', getErrorMessage(err, language, t('errSaveVerse')));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteVerse = async (id: number) => {
    if (!window.confirm(t('adminVerseDeleteConfirm'))) return;
    try {
      const token = getToken();
      await apiFetch(`/api/verses/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      showFeedback('success', t('adminVerseDeleted'));
      onRefreshData();
    } catch (err: any) {
      showFeedback('error', getErrorMessage(err, language, t('errDeleteVerse')));
    }
  };

  useEffect(() => {
    if (initialVerse) {
      handleEditVerse(initialVerse);
    }
  }, [initialVerse]);

  useEffect(() => {
    onEditingChange(editingVerseId !== null);
  }, [editingVerseId, onEditingChange]);

  if (activeTab !== 'verses') return null;

  return (
    <div className={s.container}>
      {/* Header Subtitle Verse Quick Management Banner */}
      {onOpenHeaderVerseEditor && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
          <div className="space-y-1 min-w-0 flex-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 dark:text-amber-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t('headerVerseModalTitle')}</span>
            </span>
            <p className="font-serif italic text-xs sm:text-sm text-stone-800 dark:text-stone-200 line-clamp-2">
              "{language === 'vi' ? (churchInfo?.headerVerse?.verseTextVi || DEFAULT_HEADER_VERSE.verseTextVi) : (churchInfo?.headerVerse?.verseTextEn || DEFAULT_HEADER_VERSE.verseTextEn)}"
            </p>
            <span className="block text-[11px] font-bold text-amber-800 dark:text-amber-400">
              — {language === 'vi' ? (churchInfo?.headerVerse?.referenceVi || DEFAULT_HEADER_VERSE.referenceVi) : (churchInfo?.headerVerse?.referenceEn || DEFAULT_HEADER_VERSE.referenceEn)}
            </span>
          </div>

          <Button
            type="button"
            variant="amberLight"
            size="sm"
            onClick={onOpenHeaderVerseEditor}
            leftIcon={<Sparkles className="w-3.5 h-3.5 text-amber-600" />}
            className="flex-shrink-0"
          >
            <span>{t('headerVerseEditBtn')}</span>
          </Button>
        </div>
      )}

      <form onSubmit={handleSaveVerse} className={s.form}>
        <div className={s.formHeader}>
          <div className={s.headerGroup}>
            <h3 className={s.formTitle}>
              {editingVerseId
                ? t('adminVerseEditTitle')
                : t('adminVersePostTitle')}
            </h3>
            {editingVerseId && (
              <button
                type="button"
                onClick={resetVerseForm}
                className={s.cancelEditBtn}
              >
                {t('cancelEdit')}
              </button>
            )}
          </div>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleFetchScriptureForVerse}
            disabled={fetchingScripture || isScriptureFetchedForCurrentRef || (!verseReferenceEn.trim() && !verseReferenceVi.trim())}
            title={
              isScriptureFetchedForCurrentRef
                ? t('adminVerseFetchedHint')
                : t('adminVerseFetchHint')
            }
            leftIcon={<Sparkles className={s.saveIcon} />}
          >
            <span>
              {fetchingScripture
                ? t('commonFetching')
                : isScriptureFetchedForCurrentRef
                  ? t('adminVerseFetchedBadge')
                  : t('adminVerseFetch')}
            </span>
          </Button>
        </div>

        {editingVerseId && editingVerseAudit && (
          <div className={s.auditBox}>
            {editingVerseAudit.createdBy && (
              <span>
                <strong>{t('commonCreatedBy')}</strong> {editingVerseAudit.createdBy}
                {editingVerseAudit.createdAt ? ` (${new Date(editingVerseAudit.createdAt).toLocaleString()})` : ''}
              </span>
            )}
            {editingVerseAudit.updatedBy && (
              <span>
                <strong>{t('commonUpdatedBy')}</strong> {editingVerseAudit.updatedBy}
                {editingVerseAudit.updatedAt ? ` (${new Date(editingVerseAudit.updatedAt).toLocaleString()})` : ''}
              </span>
            )}
          </div>
        )}

        <div className={s.dateField}>
          <label className={s.label}>{t('adminVerseDate')}</label>
          <input
            type="date"
            required
            value={verseDate}
            onChange={(e) => setVerseDate(e.target.value)}
            className={s.input}
          />
        </div>

        <div className={s.fieldGrid}>
          <div className={s.field}>
            <label className={s.label}>{t('adminVerseRefVi')}</label>
            <input
              type="text"
              required
              placeholder="Ví dụ: Giăng 3:16"
              value={verseReferenceVi}
              onChange={(e) => setVerseReferenceVi(e.target.value)}
              className={s.input}
            />
          </div>
          <div className={s.field}>
            <label className={s.label}>{t('adminVerseRefEn')}</label>
            <input
              type="text"
              required
              placeholder="e.g. John 3:16"
              value={verseReferenceEn}
              onChange={(e) => setVerseReferenceEn(e.target.value)}
              className={s.input}
            />
          </div>
        </div>

        <div className={s.fieldGrid}>
          <div className={s.field}>
            <label className={s.label}>{t('adminVerseVersionVi')}</label>
            <input
              type="text"
              required
              placeholder="1925"
              value={verseTranslationVi}
              onChange={(e) => setVerseTranslationVi(e.target.value)}
              className={s.input}
            />
          </div>
          <div className={s.field}>
            <label className={s.label}>{t('adminVerseVersionEn')}</label>
            <input
              type="text"
              required
              placeholder="e.g. NIV, ESV, KJV"
              value={verseTranslationEn}
              onChange={(e) => setVerseTranslationEn(e.target.value)}
              className={s.input}
            />
          </div>
        </div>

        <div className={s.fieldGrid}>
          <div className={s.field}>
            <label className={s.label}>{t('adminVerseTextVi')}</label>
            <textarea
              rows={3}
              required
              placeholder="Nhập câu gốc Lời Chúa bằng tiếng Việt..."
              value={verseTextVi}
              onChange={(e) => setVerseTextVi(e.target.value)}
              className={s.textarea}
            />
          </div>
          <div className={s.field}>
            <label className={s.label}>{t('adminVerseTextEn')}</label>
            <textarea
              rows={3}
              required
              placeholder="Enter the scripture verse text in English..."
              value={verseTextEn}
              onChange={(e) => setVerseTextEn(e.target.value)}
              className={s.textarea}
            />
          </div>
        </div>

        <div className={s.fieldGrid}>
          <div className={s.field}>
            <label className={s.label}>{t('adminVerseReflectionVi')}</label>
            <textarea
              rows={2}
              placeholder="Nội dung suy gẫm..."
              value={verseReflectionVi}
              onChange={(e) => setVerseReflectionVi(e.target.value)}
              className={s.textarea}
            />
          </div>
          <div className={s.field}>
            <label className={s.label}>{t('adminVerseReflectionEn')}</label>
            <textarea
              rows={2}
              placeholder="Pastoral reflection in English..."
              value={verseReflectionEn}
              onChange={(e) => setVerseReflectionEn(e.target.value)}
              className={s.textarea}
            />
          </div>
        </div>

        <div className={s.fieldGrid}>
          <div className={s.field}>
            <label className={s.label}>{t('adminVersePrayerVi')}</label>
            <input
              type="text"
              placeholder="Lạy Chúa, xin dẫn dắt chúng con..."
              value={versePrayerVi}
              onChange={(e) => setVersePrayerVi(e.target.value)}
              className={s.input}
            />
          </div>
          <div className={s.field}>
            <label className={s.label}>{t('adminVersePrayerEn')}</label>
            <input
              type="text"
              placeholder="Lord, guide our steps..."
              value={versePrayerEn}
              onChange={(e) => setVersePrayerEn(e.target.value)}
              className={s.input}
            />
          </div>
        </div>

        <div className={s.submitRow}>
          <button
            type="submit"
            disabled={submitting}
            className={s.saveBtn}
          >
            <Save className={s.saveIcon} />
            <span>
              {submitting
                ? t('commonSaving')
                : editingVerseId
                ? t('adminVerseUpdate')
                : t('adminVerseSave')}
            </span>
          </button>
        </div>
      </form>

      {/* Published verses list */}
      <div className={s.listSection}>
        <h4 className={s.listTitle}>
          {t('adminVersePublished')} ({allVerses.length})
        </h4>
        <div className={s.list}>
          {allVerses.map((v) => (
            <div key={v.id} className={s.item}>
              <div className={s.itemBody}>
                <span className={s.itemRef}>{v.reference}</span>
                <span className={s.itemDate}>{v.date}</span>
                <p className={s.itemSnippet}>"{v.verseText}"</p>
              </div>
              <div className={s.itemActions}>
                <button
                  type="button"
                  onClick={() => handleEditVerse(v)}
                  className={s.editBtn}
                  title="Edit"
                >
                  <Edit3 className={s.saveIcon} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteVerse(v.id)}
                  className={s.deleteBtn}
                  title="Delete"
                >
                  <Trash2 className={s.saveIcon} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
