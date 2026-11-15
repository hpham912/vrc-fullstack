import React, { useEffect, useState } from 'react';
import { Plus, Save, Sparkles } from 'lucide-react';
import { DailyVerse, PoolVerse, ChurchInfo, DEFAULT_HEADER_VERSE } from '../../../../types/index.ts';
import { useLanguage } from '../../../../context/LanguageContext.tsx';
import { apiFetch } from '../../../../utils/api.ts';
import { getErrorMessage } from '../../../../utils/errors.ts';
import { fetchScripture, ScriptureResult } from '../../../../services/scriptureApi.ts';
import { Button, ConfirmModal, FilterBar, Loading, Select, TextField } from '../../../../common-component/index.ts';
import { versesTabStyles } from './VersesTab.styles.ts';

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

// The pool holds at most 20 verses (enforced by the API too).
const POOL_MAX = 20;

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
  const [pickingToday, setPickingToday] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<PoolVerse | null>(null);
  const [removingPool, setRemovingPool] = useState(false);

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

  const isPoolFull = (pool?.length ?? 0) >= POOL_MAX;

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

  const loadPool = async () => {
    setLoadingPool(true);
    try {
      const token = getToken();
      const data = await apiFetch<PoolVerse[]>('/api/verse-pool', {
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

  // Refetch whenever the tab becomes active, so the list is fresh
  // after another admin (or this admin, on another tab) changed it.
  useEffect(() => {
    if (activeTab === 'verses') {
      loadPool();
    }
  }, [activeTab]);

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
        }),
      });
      showFeedback('success', t('poolAdded', { ref: fetched.referenceEn || fetched.reference }));
      resetForm();
      await loadPool();
    } catch (err: any) {
      showFeedback('error', getErrorMessage(err, language, t('errPoolAdd')));
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
  };

  const handleSavePoolEdit = async () => {
    if (!editingPoolId) return;
    try {
      setSubmitting(true);
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
      showFeedback('success', t('poolUpdated', { ref: referenceInput }));
      resetForm();
      await loadPool();
    } catch (err: any) {
      showFeedback('error', getErrorMessage(err, language, t('errPoolUpdate')));
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
      await loadPool();
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

  if (activeTab !== 'verses') return null;

  const todayReflection = todayVerse
    ? pick(todayVerse.reflectionVi, todayVerse.reflectionEn, todayVerse.reflection)
    : '';
  const todayPrayer = todayVerse ? pick(todayVerse.prayerVi, todayVerse.prayerEn, todayVerse.prayer) : '';

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
              <p className={versesTabStyles.todayText}>
                “{pick(todayVerse.verseTextVi, todayVerse.verseTextEn, todayVerse.verseText)}”
              </p>
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

        <div className={versesTabStyles.pickRow}>
          <label className={versesTabStyles.pickLabel}>{t('poolDisplayToday')}</label>
          <Select
            options={displayOptions}
            value={displayValue}
            onChange={handlePickToday}
            ariaLabel={t('poolDisplayToday')}
            disabled={pickingToday || !pool || pool.length === 0}
            className={versesTabStyles.pickSelect}
          />
        </div>
        <p className={versesTabStyles.hint}>
          {!loadingPool && pool && pool.length === 0 ? t('poolDisplayEmpty') : t('poolDisplayHint')}
        </p>
      </section>

      {/* Add a Verse / Edit a pool verse */}
      <section className={versesTabStyles.section}>
        <div className={versesTabStyles.formHeader}>
          <h3 className={versesTabStyles.sectionTitle}>
            {editingPoolId ? t('poolEditTitle') : t('poolAddTitle')}
          </h3>
          {editingPoolId && (
            <Button type="button" variant="ghost" size="sm" onClick={resetForm}>
              <span>{t('cancelEdit')}</span>
            </Button>
          )}
        </div>

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
          <div className={versesTabStyles.fullNotice}>{t('poolFull')}</div>
        )}

        <div className={versesTabStyles.addBtnRow}>
          {editingPoolId ? (
            <Button
              type="button"
              variant="dark"
              size="md"
              fullWidth
              onClick={handleSavePoolEdit}
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
              disabled={submitting || !fetched || isPoolFull}
              leftIcon={<Plus className={versesTabStyles.saveIcon} />}
            >
              <span>{submitting ? t('commonSaving') : t('poolAddToPool')}</span>
            </Button>
          )}
        </div>
      </section>

      {/* Verse Pool */}
      <section className={versesTabStyles.section}>
        <div className={versesTabStyles.poolHead}>
          <h3 className={versesTabStyles.sectionTitle}>{t('poolListTitle')}</h3>
          <span className={versesTabStyles.poolCount}>{t('poolCount', { count: pool?.length ?? 0 })}</span>
        </div>
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
          />
        ) : (
          <p className={versesTabStyles.emptyText}>{t('poolEmpty')}</p>
        )}
      </section>

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
    </div>
  );
};
