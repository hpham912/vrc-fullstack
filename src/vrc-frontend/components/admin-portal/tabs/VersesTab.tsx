import React, { useEffect, useState } from 'react';
import { Edit3, Save, Sparkles, Trash2 } from 'lucide-react';
import { DailyVerse } from '../../../types/index.ts';
import { useLanguage } from '../../../context/LanguageContext.tsx';
import { apiFetch } from '../../../utils/api.ts';
import { getErrorMessage } from '../../../utils/errors.ts';
import { NotificationClient } from '../../../services/notificationClient.ts';
import { fetchScripture } from '../../../services/scriptureApi.ts';
import { Button } from '../../../common-component/index.ts';

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
    <div className="space-y-6 max-w-2xl mx-auto w-full min-w-0">
      <form onSubmit={handleSaveVerse} className="p-5 bg-stone-50 rounded-2xl border border-stone-200 space-y-3.5 w-full min-w-0 box-border">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-stone-200">
          <div className="flex items-center gap-2">
            <h3 className="font-serif font-bold text-stone-900 text-sm">
              {editingVerseId
                ? t('adminVerseEditTitle')
                : t('adminVersePostTitle')}
            </h3>
            {editingVerseId && (
              <button
                type="button"
                onClick={resetVerseForm}
                className="text-xs text-stone-500 hover:text-stone-800 underline"
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
            leftIcon={<Sparkles className="w-3.5 h-3.5" />}
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
          <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/80 text-xs text-stone-700 flex flex-wrap gap-x-4 gap-y-1">
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

        <div className="w-full sm:w-1/3 min-w-0">
          <label className="block text-xs font-bold text-stone-700 mb-1">{t('adminVerseDate')}</label>
          <input
            type="date"
            required
            value={verseDate}
            onChange={(e) => setVerseDate(e.target.value)}
            className="w-full max-w-full box-border min-w-0 px-3 py-1.5 border border-stone-300 rounded-lg text-xs bg-white"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full min-w-0">
          <div className="w-full min-w-0">
            <label className="block text-xs font-bold text-stone-700 mb-1">{t('adminVerseRefVi')}</label>
            <input
              type="text"
              required
              placeholder="Ví dụ: Giăng 3:16"
              value={verseReferenceVi}
              onChange={(e) => setVerseReferenceVi(e.target.value)}
              className="w-full max-w-full box-border min-w-0 px-3 py-1.5 border border-stone-300 rounded-lg text-xs bg-white"
            />
          </div>
          <div className="w-full min-w-0">
            <label className="block text-xs font-bold text-stone-700 mb-1">{t('adminVerseRefEn')}</label>
            <input
              type="text"
              required
              placeholder="e.g. John 3:16"
              value={verseReferenceEn}
              onChange={(e) => setVerseReferenceEn(e.target.value)}
              className="w-full max-w-full box-border min-w-0 px-3 py-1.5 border border-stone-300 rounded-lg text-xs bg-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full min-w-0">
          <div className="w-full min-w-0">
            <label className="block text-xs font-bold text-stone-700 mb-1">{t('adminVerseVersionVi')}</label>
            <input
              type="text"
              required
              placeholder="1925"
              value={verseTranslationVi}
              onChange={(e) => setVerseTranslationVi(e.target.value)}
              className="w-full max-w-full box-border min-w-0 px-3 py-1.5 border border-stone-300 rounded-lg text-xs bg-white"
            />
          </div>
          <div className="w-full min-w-0">
            <label className="block text-xs font-bold text-stone-700 mb-1">{t('adminVerseVersionEn')}</label>
            <input
              type="text"
              required
              placeholder="e.g. NIV, ESV, KJV"
              value={verseTranslationEn}
              onChange={(e) => setVerseTranslationEn(e.target.value)}
              className="w-full max-w-full box-border min-w-0 px-3 py-1.5 border border-stone-300 rounded-lg text-xs bg-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full min-w-0">
          <div className="w-full min-w-0">
            <label className="block text-xs font-bold text-stone-700 mb-1">{t('adminVerseTextVi')}</label>
            <textarea
              rows={3}
              required
              placeholder="Nhập câu gốc Lời Chúa bằng tiếng Việt..."
              value={verseTextVi}
              onChange={(e) => setVerseTextVi(e.target.value)}
              className="w-full max-w-full box-border min-w-0 px-3 py-1.5 border border-stone-300 rounded-lg text-xs bg-white resize-none"
            />
          </div>
          <div className="w-full min-w-0">
            <label className="block text-xs font-bold text-stone-700 mb-1">{t('adminVerseTextEn')}</label>
            <textarea
              rows={3}
              required
              placeholder="Enter the scripture verse text in English..."
              value={verseTextEn}
              onChange={(e) => setVerseTextEn(e.target.value)}
              className="w-full max-w-full box-border min-w-0 px-3 py-1.5 border border-stone-300 rounded-lg text-xs bg-white resize-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full min-w-0">
          <div className="w-full min-w-0">
            <label className="block text-xs font-bold text-stone-700 mb-1">{t('adminVerseReflectionVi')}</label>
            <textarea
              rows={2}
              placeholder="Nội dung suy gẫm..."
              value={verseReflectionVi}
              onChange={(e) => setVerseReflectionVi(e.target.value)}
              className="w-full max-w-full box-border min-w-0 px-3 py-1.5 border border-stone-300 rounded-lg text-xs bg-white resize-none"
            />
          </div>
          <div className="w-full min-w-0">
            <label className="block text-xs font-bold text-stone-700 mb-1">{t('adminVerseReflectionEn')}</label>
            <textarea
              rows={2}
              placeholder="Pastoral reflection in English..."
              value={verseReflectionEn}
              onChange={(e) => setVerseReflectionEn(e.target.value)}
              className="w-full max-w-full box-border min-w-0 px-3 py-1.5 border border-stone-300 rounded-lg text-xs bg-white resize-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full min-w-0">
          <div className="w-full min-w-0">
            <label className="block text-xs font-bold text-stone-700 mb-1">{t('adminVersePrayerVi')}</label>
            <input
              type="text"
              placeholder="Lạy Chúa, xin dẫn dắt chúng con..."
              value={versePrayerVi}
              onChange={(e) => setVersePrayerVi(e.target.value)}
              className="w-full max-w-full box-border min-w-0 px-3 py-1.5 border border-stone-300 rounded-lg text-xs bg-white"
            />
          </div>
          <div className="w-full min-w-0">
            <label className="block text-xs font-bold text-stone-700 mb-1">{t('adminVersePrayerEn')}</label>
            <input
              type="text"
              placeholder="Lord, guide our steps..."
              value={versePrayerEn}
              onChange={(e) => setVersePrayerEn(e.target.value)}
              className="w-full max-w-full box-border min-w-0 px-3 py-1.5 border border-stone-300 rounded-lg text-xs bg-white"
            />
          </div>
        </div>

        <div className="text-right pt-2 border-t border-stone-200">
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
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
      <div className="space-y-2 w-full min-w-0">
        <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
          {t('adminVersePublished')} ({allVerses.length})
        </h4>
        <div className="divide-y divide-stone-100 border border-stone-200 rounded-xl overflow-hidden bg-white">
          {allVerses.map((v) => (
            <div key={v.id} className="p-3 flex items-center justify-between gap-3 text-xs">
              <div className="min-w-0 flex-1">
                <span className="font-serif font-bold text-stone-950">{v.reference}</span>
                <span className="text-stone-600 font-semibold ml-2">{v.date}</span>
                <p className="text-stone-700 line-clamp-1 mt-0.5 font-medium">"{v.verseText}"</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => handleEditVerse(v)}
                  className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
                  title="Edit"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteVerse(v.id)}
                  className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
