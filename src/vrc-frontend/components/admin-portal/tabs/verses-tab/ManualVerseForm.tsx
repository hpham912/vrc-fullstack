import React from 'react';
import { Plus, Save, Sparkles } from 'lucide-react';
import { ScriptureResult } from '../../../../services/scriptureApi.ts';
import { useLanguage } from '../../../../context/LanguageContext.tsx';
import { Button, Banner, TextField } from '../../../../common-component/index.ts';
import { manualVerseFormStyles } from './ManualVerseForm.styles.ts';

interface ManualVerseFormProps {
  // The pool verse being edited (tap a pill), or null when adding.
  editingPoolId: number | null;
  referenceInput: string;
  onReferenceInputChange: (value: string) => void;
  // The verse fetched from the Bible API for the preview, or null
  // when nothing has been fetched yet (or the form is in edit mode).
  fetched: ScriptureResult | null;
  fetchingScripture: boolean;
  // True while the form still shows the exact reference the last
  // successful "Fetch from Bible" was for — the button stays disabled
  // until the reference is edited.
  isScriptureFetchedForCurrentRef: boolean;
  onFetchScripture: () => void;
  reflectionVi: string;
  onReflectionViChange: (value: string) => void;
  reflectionEn: string;
  onReflectionEnChange: (value: string) => void;
  prayerVi: string;
  onPrayerViChange: (value: string) => void;
  prayerEn: string;
  onPrayerEnChange: (value: string) => void;
  isPoolFull: boolean;
  submitting: boolean;
  onAddToPool: () => void;
  onSavePoolEdit: () => void;
  onCancelEdit: () => void;
  saveSuccess: string | null;
  saveError: string | null;
  onDismissSaveError: () => void;
  // Pick the current language's text, falling back to the other
  // language, then to the generic field — same helper as DailyVerseCard.
  pick: (vi?: string | null, en?: string | null, fallback?: string | null) => string;
}

// The manual "Add a Verse" form: reference + Fetch from Bible +
// fetched preview, reflection and prayer in both languages, then Add
// (or Save when editing a pool verse). All state and saving live in
// VersesTab; this child only renders the form and calls back.
export const ManualVerseForm: React.FC<ManualVerseFormProps> = ({
  editingPoolId,
  referenceInput,
  onReferenceInputChange,
  fetched,
  fetchingScripture,
  isScriptureFetchedForCurrentRef,
  onFetchScripture,
  reflectionVi,
  onReflectionViChange,
  reflectionEn,
  onReflectionEnChange,
  prayerVi,
  onPrayerViChange,
  prayerEn,
  onPrayerEnChange,
  isPoolFull,
  submitting,
  onAddToPool,
  onSavePoolEdit,
  onCancelEdit,
  saveSuccess,
  saveError,
  onDismissSaveError,
  pick,
}) => {
  const { t } = useLanguage();

  return (
    <>
      {editingPoolId && (
        <div className={manualVerseFormStyles.addCancelRow}>
          <Button type="button" variant="ghost" size="sm" onClick={onCancelEdit}>
            <span>{t('cancelEdit')}</span>
          </Button>
        </div>
      )}
      <div className={manualVerseFormStyles.addRow}>
        <div className={manualVerseFormStyles.addRowField}>
          <TextField
            label={t('poolRefLabel')}
            value={referenceInput}
            onChange={onReferenceInputChange}
            placeholder={t('poolRefPlaceholder')}
            disabled={editingPoolId !== null}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onFetchScripture();
              }
            }}
          />
        </div>
        {!editingPoolId && (
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={onFetchScripture}
            disabled={fetchingScripture || isScriptureFetchedForCurrentRef || !referenceInput.trim()}
            title={isScriptureFetchedForCurrentRef ? t('adminVerseFetchedHint') : t('adminVerseFetchHint')}
            leftIcon={<Sparkles className={manualVerseFormStyles.saveIcon} />}
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
        <div className={manualVerseFormStyles.previewCard}>
          <div className={manualVerseFormStyles.previewHeader}>
            <span>{t('poolPreviewTitle')}</span>
          </div>
          <div className={manualVerseFormStyles.previewBox}>
            <p className={manualVerseFormStyles.previewQuote}>
              “{pick(fetched.verseTextVi, fetched.verseTextEn, fetched.verseText)}”
              <span className={manualVerseFormStyles.previewRef}>
                — {pick(fetched.referenceVi, fetched.referenceEn, fetched.reference)} •{' '}
                {pick(fetched.translationVi, fetched.translationEn, fetched.translation)}
              </span>
            </p>
          </div>
        </div>
      )}

      <div className={manualVerseFormStyles.fieldGroup}>
        <span className={manualVerseFormStyles.fieldLabel}>{t('poolReflectionLabel')}</span>
        <TextField
          label={t('commonLangVi')}
          value={reflectionVi}
          onChange={onReflectionViChange}
          placeholder={t('poolReflectionViPlaceholder')}
          multiline
          rows={2}
        />
        <TextField
          label={t('commonLangEn')}
          value={reflectionEn}
          onChange={onReflectionEnChange}
          placeholder={t('poolReflectionEnPlaceholder')}
          multiline
          rows={2}
        />
      </div>

      <div className={manualVerseFormStyles.fieldGroup}>
        <span className={manualVerseFormStyles.fieldLabel}>{t('poolPrayerLabel')}</span>
        <TextField
          label={t('commonLangVi')}
          value={prayerVi}
          onChange={onPrayerViChange}
          placeholder={t('poolPrayerViPlaceholder')}
          multiline
          rows={2}
        />
        <TextField
          label={t('commonLangEn')}
          value={prayerEn}
          onChange={onPrayerEnChange}
          placeholder={t('poolPrayerEnPlaceholder')}
          multiline
          rows={2}
        />
      </div>

      {isPoolFull && !editingPoolId && (
        <Banner type="error" message={t('poolFull')} />
      )}

      <div className={manualVerseFormStyles.addBtnRow}>
        {editingPoolId ? (
          <Button
            type="button"
            variant="dark"
            size="md"
            fullWidth
            onClick={onSavePoolEdit}
            loading={submitting}
            disabled={submitting}
            leftIcon={<Save className={manualVerseFormStyles.saveIcon} />}
          >
            <span>{submitting ? t('commonSaving') : t('commonSaveChanges')}</span>
          </Button>
        ) : (
          <Button
            type="button"
            variant="dark"
            size="md"
            fullWidth
            onClick={onAddToPool}
            loading={submitting}
            disabled={submitting || !fetched || isPoolFull}
            leftIcon={<Plus className={manualVerseFormStyles.saveIcon} />}
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
            onDismiss={onDismissSaveError}
          />
        )}
      </div>
    </>
  );
};
