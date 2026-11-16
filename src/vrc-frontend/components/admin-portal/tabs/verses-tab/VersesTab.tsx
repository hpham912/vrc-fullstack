import React, { useEffect, useRef, useState } from 'react';
import { Plus, Save, Sparkles, UploadCloud } from 'lucide-react';
import { DailyVerse, PoolVerse, ChurchInfo, DEFAULT_HEADER_VERSE } from '../../../../types/index.ts';
import { useLanguage } from '../../../../context/LanguageContext.tsx';
import { apiFetch } from '../../../../utils/api.ts';
import { getErrorMessage } from '../../../../utils/errors.ts';
import { fetchScripture, ScriptureResult } from '../../../../services/scriptureApi.ts';
import { Button, Banner, ConfirmModal, FilterBar, Loading, Select, TextField, Upload, Accordion, Modal } from '../../../../common-component/index.ts';
import { versesTabStyles } from './VersesTab.styles.ts';

// A verse validated by POST /api/verse-pool/upload (preview step),
// ready to import. The backend returns canonical references from
// the Bible API, so these are what gets stored on confirm.
interface UploadPreviewVerse {
  reference: string;
  referenceEn: string;
  referenceVi: string;
  reflection: string;
  reflectionEn: string;
  reflectionVi: string;
  prayer: string | null;
  prayerEn: string | null;
  prayerVi: string | null;
}

interface UploadPreview {
  month: string;
  daysInMonth: number;
  verses: UploadPreviewVerse[];
  warnings: Array<{ code: string; daysInMonth: number; count: number }>;
  existingCount: number;
}

interface UploadRowError {
  row: number;
  message: string;
}

// The current month (YYYY-MM) in Phoenix time — the same clock the
// verse-day uses.
function currentMonthString(): string {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Phoenix' }));
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

// Add `offset` months to a YYYY-MM string (offset 0 = the same month).
function addMonths(month: string, offset: number): string {
  const [yearText, monthText] = month.split('-');
  const date = new Date(Number(yearText), Number(monthText) - 1 + offset, 1);
  const year = date.getFullYear();
  const monthNumber = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${monthNumber}`;
}

const EN_MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function formatMonthLabel(month: string, language: 'vi' | 'en'): string {
  const [yearText, monthText] = month.split('-');
  const year = Number(yearText);
  const monthNumber = Number(monthText);
  if (!year || !monthNumber) return month;
  if (language === 'vi') return `Tháng ${monthNumber}, ${year}`;
  return `${EN_MONTH_NAMES[monthNumber - 1]} ${year}`;
}

interface VersesTabProps {
  // Today's verse (from GET /api/verses/today) — the pool manager
  // shows it and lets the admin override which pool verse displays.
  todayVerse?: DailyVerse | null;
  // Which tab the parent is showing. The child stays mounted for the
  // whole portal session (returning null when its tab isn't active) so
  // a half-typed form or an in-progress edit survives switching to
  // another tab and back, exactly as before the split.
  activeTab: string;
  getToken: () => string | null;
  showFeedback: (type: 'success' | 'error', message: string) => void;
  onRefreshData: () => void;
  // The parent header shows "Edit Verse" vs "Add Verse" in focused mode,
  // so the child reports whether it is currently editing a pool verse.
  onEditingChange: (editing: boolean) => void;
  churchInfo?: ChurchInfo | null;
  onOpenHeaderVerseEditor?: () => void;
}

// The pool holds at most 40 verses PER MONTH (enforced by the API
// too). A month has at most 31 days; the extra room is for verses
// uploaded beyond the days in the month plus manual adds.
const POOL_MAX_PER_MONTH = 40;

// Scripture pool manager: today's verse + "display for today" picker,
// add-a-verse (fetch from Bible + optional reflection/prayer), and the
// pool list (FilterBar pills — tap to edit, X to remove). Add/remove/
// override save immediately; there is no Save button and no
// dirty-checking for the pool actions. The pool is fetched by this
// tab from GET /api/verse-pool whenever the tab becomes active.
export const VersesTab: React.FC<VersesTabProps> = ({
  todayVerse,
  activeTab,
  getToken,
  showFeedback,
  onRefreshData,
  onEditingChange,
  churchInfo,
  onOpenHeaderVerseEditor,
}) => {
  const { t, language } = useLanguage();
  const [pool, setPool] = useState<PoolVerse[] | null>(null);
  const [loadingPool, setLoadingPool] = useState(false);
  const [referenceInput, setReferenceInput] = useState('');
  const [fetched, setFetched] = useState<ScriptureResult | null>(null);
  const [fetchingScripture, setFetchingScripture] = useState(false);
  // The reference the last successful "Fetch from Bible" was for.
  // While the form still shows that exact reference the button stays
  // disabled; editing the reference re-enables it.
  const [fetchedScriptureKey, setFetchedScriptureKey] = useState<string | null>(null);
  const isScriptureFetchedForCurrentRef =
    fetchedScriptureKey !== null && fetchedScriptureKey === referenceInput.trim();
  const [reflectionVi, setReflectionVi] = useState('');
  const [reflectionEn, setReflectionEn] = useState('');
  const [prayerVi, setPrayerVi] = useState('');
  const [prayerEn, setPrayerEn] = useState('');
  // The pool verse being edited (tap a pill), or null when adding.
  const [editingPoolId, setEditingPoolId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // Success message shown below the Add/Save button (mobile only)
  // after a verse is added or edited. Clears after 4s, matching the
  // feedback banner.
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  // Error message shown below the Add/Save button (mobile only) when
  // adding or editing fails. Unlike success, it does NOT auto-hide.
  const [saveError, setSaveError] = useState<string | null>(null);
  const saveSuccessTimeout = useRef<number | null>(null);
  const [pickingToday, setPickingToday] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<PoolVerse | null>(null);
  const [removingPool, setRemovingPool] = useState(false);
  // The month being managed (pool list + upload target). Defaults to
  // the current month — that is the pool the daily pick draws from.
  // The admin changes it to upload for a future month.
  const [viewMonth, setViewMonth] = useState<string>(() => currentMonthString());
  const currentMonth = currentMonthString();
  // Monthly upload state.
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<UploadPreview | null>(null);
  const [uploadErrors, setUploadErrors] = useState<UploadRowError[]>([]);
  const [uploadChecking, setUploadChecking] = useState(false);
  const [uploadImporting, setUploadImporting] = useState(false);
  const [showReplaceConfirm, setShowReplaceConfirm] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const uploadSuccessTimeout = useRef<number | null>(null);
  // The sample format opens in a modal (not inline). It opens
  // automatically when an upload fails, so the admin can see the
  // expected format and fix the file; the admin can also open it
  // any time from the "See the sample format" button.
  const [showSampleModal, setShowSampleModal] = useState(false);
  // Which add option is open in the accordion: the manual add form
  // (open by default), the monthly upload (collapsed until the admin
  // expands it), or null when both are collapsed. Single-open —
  // opening one closes the other, and tapping the open one closes it,
  // same as the member verse history.
  const [openAddSection, setOpenAddSection] = useState<'manual' | 'upload' | null>('manual');

  // Month options: the current month plus the next 5, so the admin
  // can upload ahead. Past months are not offered — their pool is
  // pruned and cannot be picked.
  const monthOptions = Array.from({ length: 6 }, (_, index) => {
    const month = addMonths(currentMonth, index);
    return { value: month, label: formatMonthLabel(month, language) };
  });

  // Pick the current language's text, falling back to the other
  // language, then to the generic field — same helper as DailyVerseCard.
  const pick = (vi?: string | null, en?: string | null, fallback?: string | null) => {
    const direct = language === 'vi' ? vi : en;
    if (direct && direct.trim()) return direct.trim();
    return fallback || '';
  };
  const pickRef = (poolVerse: PoolVerse) =>
    language === 'vi'
      ? poolVerse.referenceVi || poolVerse.reference
      : poolVerse.referenceEn || poolVerse.reference;

  const isPoolFull = (pool?.length ?? 0) >= POOL_MAX_PER_MONTH;

  // Today's verse as a pool verse, matched by reference (there is no
  // foreign key between daily_verses and verse_pool — the pick copies
  // the pool verse's references into the daily row, so they match).
  // Null when today's verse is not from the pool (the hardcoded
  // fallback, or a verse saved before the pool existed).
  const todayPoolId = (() => {
    if (!todayVerse || !pool) return null;
    const match = pool.find(
      (poolVerse) =>
        (todayVerse.referenceEn &&
          poolVerse.referenceEn &&
          todayVerse.referenceEn === poolVerse.referenceEn) ||
        (todayVerse.referenceVi &&
          poolVerse.referenceVi &&
          todayVerse.referenceVi === poolVerse.referenceVi) ||
        todayVerse.reference === poolVerse.reference
    );
    return match ? match.id : null;
  })();

  const loadPool = async (month: string) => {
    setLoadingPool(true);
    try {
      const token = getToken();
      const data = await apiFetch<PoolVerse[]>(`/api/verse-pool?month=${month}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPool(Array.isArray(data) ? data : []);
    } catch (err: any) {
      showFeedback('error', getErrorMessage(err, language, t('errPoolLoad')));
      setPool([]);
    } finally {
      setLoadingPool(false);
    }
  };

  // Refetch whenever the tab becomes active or the viewed month
  // changes, so the list is fresh after another admin (or this admin,
  // on another tab) changed it.
  useEffect(() => {
    if (activeTab === 'verses') {
      loadPool(viewMonth);
    }
  }, [activeTab, viewMonth]);

  useEffect(() => {
    onEditingChange(editingPoolId !== null);
  }, [editingPoolId, onEditingChange]);

  const resetForm = () => {
    setEditingPoolId(null);
    setReferenceInput('');
    setFetched(null);
    setFetchedScriptureKey(null);
    setReflectionVi('');
    setReflectionEn('');
    setPrayerVi('');
    setPrayerEn('');
  };

  // Fetch real EN + VI scripture text from POST /api/ai/fetch-scripture
  // (apibible: NIV English + Kinh Thánh 1925 Vietnamese) for the
  // preview. Never machine-translate scripture here — both texts come
  // from the Bible API, verse-for-verse.
  const handleFetchScriptureForVerse = async () => {
    const passage = referenceInput.trim();
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
      setFetched(data);
      setFetchedScriptureKey(passage);
      showFeedback('success', t('adminVerseFetched', { ref: data.referenceEn || passage }));
    } catch (err: any) {
      showFeedback('error', getErrorMessage(err, language, t('errFetchScripture')));
    } finally {
      setFetchingScripture(false);
    }
  };

  const handleAddToPool = async () => {
    if (!fetched) return;
    try {
      setSubmitting(true);
      setSaveSuccess(null);
      setSaveError(null);
      if (saveSuccessTimeout.current) {
        window.clearTimeout(saveSuccessTimeout.current);
        saveSuccessTimeout.current = null;
      }
      const token = getToken();
      await apiFetch('/api/verse-pool', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reference: fetched.referenceEn || fetched.reference,
          referenceVi: fetched.referenceVi || fetched.reference,
          referenceEn: fetched.referenceEn || fetched.reference,
          reflection: reflectionEn.trim() || null,
          reflectionVi: reflectionVi.trim() || null,
          reflectionEn: reflectionEn.trim() || null,
          prayer: prayerEn.trim() || null,
          prayerVi: prayerVi.trim() || null,
          prayerEn: prayerEn.trim() || null,
          month: viewMonth,
          source: 'manual',
        }),
      });
      const addedMessage = t('poolAdded', { ref: fetched.referenceEn || fetched.reference });
      showFeedback('success', addedMessage);
      setSaveSuccess(addedMessage);
      saveSuccessTimeout.current = window.setTimeout(() => setSaveSuccess(null), 4000);
      resetForm();
      await loadPool(viewMonth);
    } catch (err: any) {
      const addErrorMessage = getErrorMessage(err, language, t('errPoolAdd'));
      showFeedback('error', addErrorMessage);
      setSaveError(addErrorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Tap a pill to edit that pool verse's reflection / prayer. The
  // reference is shown disabled — it never changes after the add.
  const handleEditPoolVerse = (poolVerse: PoolVerse) => {
    // Tapping the verse already being edited must not reset the form
    // and lose unsaved reflection/prayer edits.
    if (poolVerse.id === editingPoolId) return;
    setEditingPoolId(poolVerse.id);
    setReferenceInput(pickRef(poolVerse));
    setReflectionVi(poolVerse.reflectionVi || poolVerse.reflection || '');
    setReflectionEn(poolVerse.reflectionEn || poolVerse.reflection || '');
    setPrayerVi(poolVerse.prayerVi || poolVerse.prayer || '');
    setPrayerEn(poolVerse.prayerEn || poolVerse.prayer || '');
    setFetched(null);
    setFetchedScriptureKey(null);
    // The edit form lives in the manual accordion section — open it
    // so the form is visible (the admin may have had Upload open).
    setOpenAddSection('manual');
  };

  const handleSavePoolEdit = async () => {
    if (!editingPoolId) return;
    try {
      setSubmitting(true);
      setSaveSuccess(null);
      setSaveError(null);
      if (saveSuccessTimeout.current) {
        window.clearTimeout(saveSuccessTimeout.current);
        saveSuccessTimeout.current = null;
      }
      const token = getToken();
      await apiFetch(`/api/verse-pool/${editingPoolId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reflection: reflectionEn.trim() || null,
          reflectionVi: reflectionVi.trim() || null,
          reflectionEn: reflectionEn.trim() || null,
          prayer: prayerEn.trim() || null,
          prayerVi: prayerVi.trim() || null,
          prayerEn: prayerEn.trim() || null,
        }),
      });
      const updatedMessage = t('poolUpdated', { ref: referenceInput });
      showFeedback('success', updatedMessage);
      setSaveSuccess(updatedMessage);
      saveSuccessTimeout.current = window.setTimeout(() => setSaveSuccess(null), 4000);
      resetForm();
      await loadPool(viewMonth);
    } catch (err: any) {
      const updateErrorMessage = getErrorMessage(err, language, t('errPoolUpdate'));
      showFeedback('error', updateErrorMessage);
      setSaveError(updateErrorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemovePoolVerse = async () => {
    if (!removeTarget) return;
    try {
      setRemovingPool(true);
      const token = getToken();
      await apiFetch(`/api/verse-pool/${removeTarget.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      showFeedback('success', t('poolRemoved', { ref: pickRef(removeTarget) }));
      if (editingPoolId === removeTarget.id) resetForm();
      setRemoveTarget(null);
      await loadPool(viewMonth);
      // No refresh of today's verse: a pool verse was never picked,
      // so removing it cannot change what is showing today. History
      // in daily_verses is never deleted by a pool remove.
    } catch (err: any) {
      showFeedback('error', getErrorMessage(err, language, t('errPoolRemove')));
    } finally {
      setRemovingPool(false);
    }
  };

  // "Display for today" — pick a pool verse (or Random for an
  // immediate new random pick) to show until 6:00 AM tomorrow, when
  // the server resumes picking at random.
  const handlePickToday = async (value: string) => {
    const poolVerseId = value === 'random' ? null : Number(value);
    try {
      setPickingToday(true);
      const token = getToken();
      const picked = await apiFetch<DailyVerse>('/api/verses/today/pick', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ poolVerseId }),
      });
      const pickedRef =
        language === 'vi' ? picked.referenceVi || picked.reference : picked.referenceEn || picked.reference;
      showFeedback(
        'success',
        poolVerseId === null
          ? t('poolRandomPicked', { ref: pickedRef })
          : t('poolPickedToday', { ref: pickedRef })
      );
      onRefreshData();
    } catch (err: any) {
      showFeedback('error', getErrorMessage(err, language, t('errPoolPick')));
    } finally {
      setPickingToday(false);
    }
  };

  // Monthly upload — step 1: check the file. Parses + validates it
  // on the server and returns a preview; nothing is imported yet.
  // All-or-nothing: any bad row rejects the whole file with a
  // per-row error list.
  const handleUploadFileChange = (file: File | null) => {
    setUploadFile(file);
    setUploadPreview(null);
    setUploadErrors([]);
    setUploadSuccess(null);
  };

  const handleCheckUploadFile = async () => {
    if (!uploadFile) {
      showFeedback('error', t('poolUploadNoFile'));
      return;
    }
    try {
      setUploadChecking(true);
      setUploadErrors([]);
      setUploadPreview(null);
      const token = getToken();
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('month', viewMonth);
      const preview = await apiFetch<UploadPreview>('/api/verse-pool/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      setUploadPreview(preview);
    } catch (err: any) {
      const details = (err as { details?: { errors?: UploadRowError[] } })?.details;
      if (details && Array.isArray(details.errors) && details.errors.length > 0) {
        setUploadErrors(details.errors);
        // Open the sample format modal so the admin can see what the
        // file should look like and fix it.
        setShowSampleModal(true);
      } else {
        showFeedback('error', getErrorMessage(err, language, t('errPoolUpload')));
      }
    } finally {
      setUploadChecking(false);
    }
  };

  // Monthly upload — step 2: import the previewed verses. If the
  // month already has pool verses and replace was not confirmed, the
  // server answers 409 and the Replace confirm modal opens instead.
  const handleImportUpload = async (replace: boolean) => {
    if (!uploadPreview) return;
    try {
      setUploadImporting(true);
      const token = getToken();
      const result = await apiFetch<{ imported: number; month: string }>(
        '/api/verse-pool/upload/confirm',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            month: uploadPreview.month,
            verses: uploadPreview.verses,
            replace,
          }),
        }
      );
      const importedMessage = t('poolUploadImported', {
        count: result.imported,
        month: formatMonthLabel(result.month, language),
      });
      showFeedback('success', importedMessage);
      setUploadSuccess(importedMessage);
      if (uploadSuccessTimeout.current) {
        window.clearTimeout(uploadSuccessTimeout.current);
      }
      uploadSuccessTimeout.current = window.setTimeout(() => setUploadSuccess(null), 4000);
      setUploadPreview(null);
      setUploadFile(null);
      setUploadErrors([]);
      setShowReplaceConfirm(false);
      await loadPool(viewMonth);
      onRefreshData();
    } catch (err: any) {
      const details = (err as { details?: { needsReplace?: boolean; existingCount?: number } })
        ?.details;
      const status = (err as { status?: number })?.status;
      if (status === 409 && details?.needsReplace) {
        setShowReplaceConfirm(true);
      } else {
        showFeedback('error', getErrorMessage(err, language, t('errPoolUpload')));
      }
    } finally {
      setUploadImporting(false);
    }
  };

  if (activeTab !== 'verses') return null;

  const todayReflection = todayVerse
    ? pick(todayVerse.reflectionVi, todayVerse.reflectionEn, todayVerse.reflection)
    : '';
  const todayPrayer = todayVerse ? pick(todayVerse.prayerVi, todayVerse.prayerEn, todayVerse.prayer) : '';
  // Today's verse text, computed once so the card can skip the quoted
  // line entirely when the text is empty — otherwise it renders as
  // two empty quotes ("").
  const todayText = todayVerse ? pick(todayVerse.verseTextVi, todayVerse.verseTextEn, todayVerse.verseText) : '';

  const displayOptions = [
    { value: 'random', label: t('poolRandomDefault') },
    ...(pool ?? []).map((poolVerse) => ({ value: String(poolVerse.id), label: pickRef(poolVerse) })),
  ];
  const displayValue = todayPoolId ? String(todayPoolId) : 'random';

  const poolOptions = (pool ?? []).map((poolVerse) => ({
    value: String(poolVerse.id),
    label: pickRef(poolVerse),
    highlighted: poolVerse.id === todayPoolId,
  }));

  return (
    <div className={versesTabStyles.container}>
      {/* Header Subtitle Verse Quick Management Banner */}
      {onOpenHeaderVerseEditor && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
          <div className="space-y-1 min-w-0 flex-1">
            <span className="text-label font-bold uppercase tracking-wider text-amber-900 dark:text-amber-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t('headerVerseModalTitle')}</span>
            </span>
            <p className="font-serif italic text-xs sm:text-sm text-stone-800 dark:text-stone-200 line-clamp-2">
              "{language === 'vi' ? (churchInfo?.headerVerse?.verseTextVi || DEFAULT_HEADER_VERSE.verseTextVi) : (churchInfo?.headerVerse?.verseTextEn || DEFAULT_HEADER_VERSE.verseTextEn)}"
            </p>
            <span className="block text-label font-bold text-amber-800 dark:text-amber-400">
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

      {/* Today's Scripture */}
      <section className={versesTabStyles.section}>
        <h3 className={versesTabStyles.sectionTitle}>{t('poolTodayTitle')}</h3>
        {todayVerse ? (
          <>
            <div className={versesTabStyles.todayCard}>
              <div className={versesTabStyles.todayLabel}>{t('poolTodayShowing')}</div>
              {todayText ? (
                <p className={versesTabStyles.todayText}>“{todayText}”</p>
              ) : null}
              <div className={versesTabStyles.todayRef}>
                {pick(todayVerse.referenceVi, todayVerse.referenceEn, todayVerse.reference)} •{' '}
                {pick(todayVerse.translationVi, todayVerse.translationEn, todayVerse.translation)}
              </div>
            </div>
            {todayReflection && (
              <div className={versesTabStyles.todayExtra}>
                <div className={versesTabStyles.todayExtraLabel}>{t('reflectionTitle')}</div>
                <p className={versesTabStyles.todayExtraText}>{todayReflection}</p>
              </div>
            )}
            {todayPrayer && (
              <div className={versesTabStyles.todayExtra}>
                <div className={versesTabStyles.todayExtraLabel}>{t('prayerTitle')}</div>
                <p className={versesTabStyles.todayExtraText}>{todayPrayer}</p>
              </div>
            )}
          </>
        ) : (
          <p className={versesTabStyles.emptyText}>{t('verseEmpty')}</p>
        )}

        <Select
          options={displayOptions}
          value={displayValue}
          onChange={handlePickToday}
          label={t('poolDisplayToday')}
          ariaLabel={t('poolDisplayToday')}
          disabled={pickingToday || !pool || pool.length === 0 || viewMonth !== currentMonth}
        />
        <p className={versesTabStyles.hint}>
          {viewMonth !== currentMonth
            ? t('poolDisplayOtherMonth')
            : !loadingPool && pool && pool.length === 0
              ? t('poolDisplayEmpty')
              : t('poolDisplayHint')}
        </p>
      </section>

      {/* Verse Pool */}
      <section className={versesTabStyles.section}>
        <div className={versesTabStyles.poolHead}>
          <h3 className={versesTabStyles.sectionTitle}>{t('poolListTitle')}</h3>
          <span className={versesTabStyles.poolCount}>{t('poolCount', { count: pool?.length ?? 0 })}</span>
        </div>
        <Select
          options={monthOptions}
          value={viewMonth}
          onChange={setViewMonth}
          label={t('poolUploadMonthFilter')}
          ariaLabel={t('poolUploadMonthFilter')}
        />
        {loadingPool ? (
          <Loading text={t('loading')} />
        ) : pool && pool.length > 0 ? (
          <FilterBar
            options={poolOptions}
            value={editingPoolId ? String(editingPoolId) : ''}
            onChange={(value) => {
              const found = pool.find((poolVerse) => String(poolVerse.id) === value);
              if (found) handleEditPoolVerse(found);
            }}
            onRemove={(value) => {
              const found = pool.find((poolVerse) => String(poolVerse.id) === value);
              if (found) setRemoveTarget(found);
            }}
            removeLabel={(label) => t('poolRemoveAria', { ref: label })}
            ariaLabel={t('poolListTitle')}
            wrap
          />
        ) : (
          <p className={versesTabStyles.emptyText}>{t('poolEmpty')}</p>
        )}
        {!loadingPool && pool && pool.length === 0 && (
          <Banner
            type="info"
            message={t('poolUploadEmptyMonth', { month: formatMonthLabel(viewMonth, language) })}
          />
        )}
      </section>

      {/* Add a verse — two options: add one manually, or upload a
          whole month's verses. The upload stays collapsed until the
          admin expands it. */}
      <section className={versesTabStyles.section}>
        <Accordion
          openId={openAddSection}
          onToggle={(id) => {
            // Tapping the open section collapses it; tapping the
            // closed one opens it (and closes the other).
            setOpenAddSection(openAddSection === id ? null : (id as 'manual' | 'upload'));
          }}
          items={[
            {
              id: 'manual',
              header: (
                <span className={versesTabStyles.addHeader}>
                  <Plus className={versesTabStyles.addHeaderIcon} aria-hidden="true" />
                  <span className={versesTabStyles.addHeaderTitle}>
                    {editingPoolId ? t('poolEditTitle') : t('poolAddTitle')}
                  </span>
                </span>
              ),
              children: (
                <>
                  {editingPoolId && (
                    <div className={versesTabStyles.addCancelRow}>
                      <Button type="button" variant="ghost" size="sm" onClick={resetForm}>
                        <span>{t('cancelEdit')}</span>
                      </Button>
                    </div>
                  )}
                  <div className={versesTabStyles.addRow}>
                    <div className={versesTabStyles.addRowField}>
                      <TextField
                        label={t('poolRefLabel')}
                        value={referenceInput}
                        onChange={setReferenceInput}
                        placeholder={t('poolRefPlaceholder')}
                        disabled={editingPoolId !== null}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleFetchScriptureForVerse();
                          }
                        }}
                      />
                    </div>
                    {!editingPoolId && (
                      <Button
                        type="button"
                        variant="primary"
                        size="md"
                        onClick={handleFetchScriptureForVerse}
                        disabled={fetchingScripture || isScriptureFetchedForCurrentRef || !referenceInput.trim()}
                        title={isScriptureFetchedForCurrentRef ? t('adminVerseFetchedHint') : t('adminVerseFetchHint')}
                        leftIcon={<Sparkles className={versesTabStyles.saveIcon} />}
                      >
                        <span>
                          {fetchingScripture
                            ? t('commonFetching')
                            : isScriptureFetchedForCurrentRef
                              ? t('adminVerseFetchedBadge')
                              : t('adminVerseFetch')}
                        </span>
                      </Button>
                    )}
                  </div>

                  {/* Fetched preview — the EditHeaderVerseModal preview treatment
                      (muted stone card + white inner box, serif italic quote). */}
                  {fetched && !editingPoolId && (
                    <div className={versesTabStyles.previewCard}>
                      <div className={versesTabStyles.previewHeader}>
                        <span>{t('poolPreviewTitle')}</span>
                      </div>
                      <div className={versesTabStyles.previewBox}>
                        <p className={versesTabStyles.previewQuote}>
                          “{pick(fetched.verseTextVi, fetched.verseTextEn, fetched.verseText)}”
                          <span className={versesTabStyles.previewRef}>
                            — {pick(fetched.referenceVi, fetched.referenceEn, fetched.reference)} •{' '}
                            {pick(fetched.translationVi, fetched.translationEn, fetched.translation)}
                          </span>
                        </p>
                      </div>
                    </div>
                  )}

                  <div className={versesTabStyles.fieldGroup}>
                    <span className={versesTabStyles.fieldLabel}>{t('poolReflectionLabel')}</span>
                    <TextField
                      label={t('commonLangVi')}
                      value={reflectionVi}
                      onChange={setReflectionVi}
                      placeholder={t('poolReflectionViPlaceholder')}
                      multiline
                      rows={2}
                    />
                    <TextField
                      label={t('commonLangEn')}
                      value={reflectionEn}
                      onChange={setReflectionEn}
                      placeholder={t('poolReflectionEnPlaceholder')}
                      multiline
                      rows={2}
                    />
                  </div>

                  <div className={versesTabStyles.fieldGroup}>
                    <span className={versesTabStyles.fieldLabel}>{t('poolPrayerLabel')}</span>
                    <TextField
                      label={t('commonLangVi')}
                      value={prayerVi}
                      onChange={setPrayerVi}
                      placeholder={t('poolPrayerViPlaceholder')}
                      multiline
                      rows={2}
                    />
                    <TextField
                      label={t('commonLangEn')}
                      value={prayerEn}
                      onChange={setPrayerEn}
                      placeholder={t('poolPrayerEnPlaceholder')}
                      multiline
                      rows={2}
                    />
                  </div>

                  {isPoolFull && !editingPoolId && (
                    <Banner type="error" message={t('poolFull')} />
                  )}

                  <div className={versesTabStyles.addBtnRow}>
                    {editingPoolId ? (
                      <Button
                        type="button"
                        variant="dark"
                        size="md"
                        fullWidth
                        onClick={handleSavePoolEdit}
                        loading={submitting}
                        disabled={submitting}
                        leftIcon={<Save className={versesTabStyles.saveIcon} />}
                      >
                        <span>{submitting ? t('commonSaving') : t('commonSaveChanges')}</span>
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="dark"
                        size="md"
                        fullWidth
                        onClick={handleAddToPool}
                        loading={submitting}
                        disabled={submitting || !fetched || isPoolFull}
                        leftIcon={<Plus className={versesTabStyles.saveIcon} />}
                      >
                        <span>{submitting ? t('commonSaving') : t('poolAddToPool')}</span>
                      </Button>
                    )}
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
                  </div>
                </>
              ),
            },
            {
              id: 'upload',
              header: (
                <span className={versesTabStyles.addHeader}>
                  <UploadCloud className={versesTabStyles.addHeaderIcon} aria-hidden="true" />
                  <span className={versesTabStyles.addHeaderTitle}>{t('poolUploadTitle')}</span>
                </span>
              ),
              children: (
                <>
                  <p className={versesTabStyles.uploadMonthLine}>
                    {t('poolUploadMonthFilter')} {formatMonthLabel(viewMonth, language)}
                  </p>
                  <p className={versesTabStyles.hint}>{t('poolUploadHint')}</p>
                  <div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowSampleModal(true)}
                    >
                      <span>{t('poolUploadShowSample')}</span>
                    </Button>
                  </div>
                  <Upload
                    accept={['.csv', '.txt', '.docx']}
                    maxSizeMB={5}
                    file={uploadFile}
                    onFileChange={handleUploadFileChange}
                    disabled={uploadChecking || uploadImporting}
                  />
                  <div className={versesTabStyles.uploadBtnRow}>
                    <Button
                      type="button"
                      variant="dark"
                      size="md"
                      fullWidth
                      onClick={handleCheckUploadFile}
                      loading={uploadChecking}
                      disabled={uploadChecking || uploadImporting || !uploadFile}
                      leftIcon={<UploadCloud className={versesTabStyles.saveIcon} />}
                    >
                      <span>{uploadChecking ? t('poolUploadChecking') : t('poolUploadCheckFile')}</span>
                    </Button>
                  </div>

                  {uploadErrors.length > 0 && (
                    <div className={versesTabStyles.uploadErrorStack}>
                      {uploadErrors.map((uploadError, index) => (
                        <Banner
                          key={`${uploadError.row}-${index}`}
                          type="error"
                          message={t('poolUploadRowError', { row: uploadError.row, message: uploadError.message })}
                          onDismiss={() =>
                            setUploadErrors(uploadErrors.filter((_, errorIndex) => errorIndex !== index))
                          }
                        />
                      ))}
                    </div>
                  )}

                  {uploadPreview && (
                    <>
                      <div className={versesTabStyles.formHeader}>
                        <h4 className={versesTabStyles.sectionTitle}>
                          {t('poolUploadPreviewTitle', {
                            count: uploadPreview.verses.length,
                            month: formatMonthLabel(uploadPreview.month, language),
                          })}
                        </h4>
                      </div>
                      {uploadPreview.warnings.map((warning) => (
                        <Banner
                          key={warning.code}
                          type="info"
                          message={
                            warning.code === 'fewer-than-days'
                              ? t('poolUploadCountWarning', {
                                  month: formatMonthLabel(uploadPreview.month, language),
                                  days: warning.daysInMonth,
                                  count: warning.count,
                                })
                              : t('poolUploadCountExtra', {
                                  month: formatMonthLabel(uploadPreview.month, language),
                                  days: warning.daysInMonth,
                                  count: warning.count,
                                })
                          }
                        />
                      ))}
                      <div className={versesTabStyles.uploadPreviewList}>
                        {uploadPreview.verses.map((previewVerse) => (
                          <div key={previewVerse.referenceEn} className={versesTabStyles.uploadPreviewRow}>
                            <p className={versesTabStyles.uploadPreviewRef}>
                              {pick(previewVerse.referenceVi, previewVerse.referenceEn, previewVerse.reference)}
                            </p>
                            {(pick(previewVerse.reflectionVi, previewVerse.reflectionEn, previewVerse.reflection) ||
                              pick(previewVerse.prayerVi, previewVerse.prayerEn, previewVerse.prayer)) && (
                              <p className={versesTabStyles.uploadPreviewMeta}>
                                {pick(previewVerse.reflectionVi, previewVerse.reflectionEn, previewVerse.reflection) ||
                                  pick(previewVerse.prayerVi, previewVerse.prayerEn, previewVerse.prayer)}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                      <div className={versesTabStyles.uploadBtnRow}>
                        <Button
                          type="button"
                          variant="primary"
                          size="md"
                          fullWidth
                          onClick={() => handleImportUpload(false)}
                          loading={uploadImporting}
                          disabled={uploadImporting}
                          leftIcon={<Plus className={versesTabStyles.saveIcon} />}
                        >
                          <span>
                            {uploadImporting
                              ? t('poolUploadImporting')
                              : t('poolUploadImport', { count: uploadPreview.verses.length })}
                          </span>
                        </Button>
                      </div>
                    </>
                  )}

                  {uploadSuccess && <Banner type="success" message={uploadSuccess} />}
                </>
              ),
            },
          ]}
        />
      </section>

      {/* Sample format modal — opened from the upload section, and
          automatically when an upload fails. */}
      <Modal
        isOpen={showSampleModal}
        onClose={() => setShowSampleModal(false)}
        title={t('poolUploadSampleTitle')}
        maxWidthClass="max-w-lg"
      >
        <div className={versesTabStyles.uploadSampleModalBody}>
          <div className={versesTabStyles.uploadSampleTable}>
            <div className={versesTabStyles.uploadSampleHeaderRow}>
              <span>reference_en</span>
              <span>reference_vi</span>
              <span>reflection_en</span>
              <span>reflection_vi</span>
              <span>prayer_en</span>
              <span>prayer_vi</span>
            </div>
            <div className={versesTabStyles.uploadSampleDataRow}>
              <span>John 3:16</span>
              <span>Giăng 3:16</span>
              <span>God loved the world…</span>
              <span>Đức Chúa Trời yêu thế gian…</span>
              <span>Thank You Lord…</span>
              <span>Lạy Chúa, cảm tạ Ngài…</span>
            </div>
          </div>
          <p className={versesTabStyles.hint}>{t('poolUploadSampleNote')}</p>
        </div>
      </Modal>

      {/* Common Confirmation Modal for Remove */}
      <ConfirmModal
        isOpen={Boolean(removeTarget)}
        title={t('poolRemoveTitle')}
        message={removeTarget ? t('poolRemoveConfirm', { ref: pickRef(removeTarget) }) : ''}
        confirmText={t('commonDelete')}
        loading={removingPool}
        onConfirm={handleRemovePoolVerse}
        onCancel={() => setRemoveTarget(null)}
      />

      {/* Replace confirm — uploading for a month that already has verses */}
      <ConfirmModal
        isOpen={showReplaceConfirm}
        title={t('poolUploadReplaceTitle', { count: uploadPreview?.existingCount ?? 0 })}
        message={
          uploadPreview
            ? t('poolUploadReplaceBody', {
                month: formatMonthLabel(uploadPreview.month, language),
                count: uploadPreview.existingCount,
              })
            : ''
        }
        confirmText={t('poolUploadReplaceConfirm')}
        cancelText={t('poolUploadCancel')}
        loading={uploadImporting}
        onConfirm={() => handleImportUpload(true)}
        onCancel={() => setShowReplaceConfirm(false)}
      />
    </div>
  );
};
