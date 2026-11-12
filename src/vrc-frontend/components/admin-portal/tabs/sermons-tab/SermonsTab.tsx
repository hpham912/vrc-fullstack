import React, { useEffect, useRef, useState } from 'react';
import { Save, Video } from 'lucide-react';
import { Sermon } from '../../../../types/index.ts';
import { useLanguage } from '../../../../context/LanguageContext.tsx';
import { apiFetch } from '../../../../utils/api.ts';
import { getErrorMessage } from '../../../../utils/errors.ts';
import { extractYouTubeVideoId, getYouTubeThumbnailUrl } from '../../../../../vrc-shared/utils/youtube.ts';
import { extractFacebookVideoUrl } from '../../../../../vrc-shared/utils/facebook.ts';
import { formatDateLocale } from '../../../../utils/dateFormatter.ts';
import { AdminActionButtons, Button, ConfirmModal } from '../../../../common-component/index.ts';
import { sermonsTabStyles as s } from './SermonsTab.styles.ts';

interface SermonsTabProps {
  sermons: Sermon[];
  // Which tab the parent is showing. The child stays mounted for the
  // whole portal session (returning null when its tab isn't active) so
  // a half-typed form or an in-progress edit survives switching to
  // another tab and back, exactly as before the split.
  activeTab: string;
  // A sermon to edit, when the portal was opened from a sermon card
  // on the public Bài Giảng page (same as initialEvent for events).
  initialSermon?: Sermon | null;
  getToken: () => string | null;
  showFeedback: (type: 'success' | 'error', message: string) => void;
  onRefreshData: () => void;
}

// Form values, for dirty-checking: the Save button is only enabled
// while the form differs from the last loaded values (a fresh form,
// or the sermon being edited). The video link is one field — the
// platform (YouTube or Facebook) is detected from the pasted link.
type SermonFormValues = {
  videoUrl: string;
  platform: 'youtube' | 'facebook';
  titleVi: string;
  titleEn: string;
  descVi: string;
  descEn: string;
  date: string;
};

const getTodayStr = () => new Date().toISOString().split('T')[0];

const getDefaultSermonValues = (): SermonFormValues => ({
  videoUrl: '',
  platform: 'youtube',
  titleVi: '',
  titleEn: '',
  descVi: '',
  descEn: '',
  date: getTodayStr(),
});

const getSermonValuesFromItem = (sermon: Sermon): SermonFormValues => {
  const platform = sermon.platform || 'youtube';
  return {
    videoUrl: sermon.videoUrl || '',
    platform,
    titleVi: sermon.titleVi,
    titleEn: sermon.titleEn,
    descVi: sermon.descriptionVi || '',
    descEn: sermon.descriptionEn || '',
    date: sermon.date,
  };
};

// Sermons (Bài Giảng): form + published list. The admin pastes a
// YouTube or Facebook link — the platform is detected from the link
// and a preview confirms it is the right video before saving (a
// thumbnail for YouTube; a Facebook badge for Facebook, which gives
// no free thumbnail). The video itself is never stored; only the
// link, platform, bilingual title + description, and the Sunday date.
export const SermonsTab: React.FC<SermonsTabProps> = ({
  sermons,
  activeTab,
  initialSermon,
  getToken,
  showFeedback,
  onRefreshData,
}) => {
  const { t, language } = useLanguage();
  const [editingSermonId, setEditingSermonId] = useState<number | null>(null);
  const [sermonVideoUrl, setSermonVideoUrl] = useState('');
  const [sermonTitleVi, setSermonTitleVi] = useState('');
  const [sermonTitleEn, setSermonTitleEn] = useState('');
  const [sermonDescVi, setSermonDescVi] = useState('');
  const [sermonDescEn, setSermonDescEn] = useState('');
  const [sermonDate, setSermonDate] = useState(getTodayStr());
  const [submitting, setSubmitting] = useState(false);
  const [deleteTargetSermon, setDeleteTargetSermon] = useState<Sermon | null>(null);
  const [deletingSermon, setDeletingSermon] = useState(false);

  // Last loaded values — the Save button is enabled only while the
  // form differs from these.
  const baselineRef = useRef<SermonFormValues>(getDefaultSermonValues());

  const applySermonValues = (values: SermonFormValues) => {
    setSermonVideoUrl(values.videoUrl);
    setSermonTitleVi(values.titleVi);
    setSermonTitleEn(values.titleEn);
    setSermonDescVi(values.descVi);
    setSermonDescEn(values.descEn);
    setSermonDate(values.date);
  };

  // Detect the platform from whatever link is pasted, so the preview
  // and the save validation share one source of truth. YouTube wins
  // when a link somehow matches both (it never does in practice).
  const previewYouTubeId = extractYouTubeVideoId(sermonVideoUrl);
  const previewFacebookUrl = !previewYouTubeId
    ? extractFacebookVideoUrl(sermonVideoUrl)
    : null;
  const previewPlatform: 'youtube' | 'facebook' | null = previewYouTubeId
    ? 'youtube'
    : previewFacebookUrl
    ? 'facebook'
    : null;
  const videoUrlInvalid = sermonVideoUrl.trim() !== '' && !previewPlatform;

  const resetSermonForm = () => {
    setEditingSermonId(null);
    const values = getDefaultSermonValues();
    applySermonValues(values);
    baselineRef.current = values;
  };

  const handleEditSermon = (sermon: Sermon) => {
    setEditingSermonId(sermon.id);
    const values = getSermonValuesFromItem(sermon);
    applySermonValues(values);
    baselineRef.current = values;
  };

  // Opened from a sermon card on the public Bài Giảng page: load
  // that sermon into the form for editing (same as initialEvent).
  useEffect(() => {
    if (initialSermon) {
      handleEditSermon(initialSermon);
    }
  }, [initialSermon]);

  // Dirty-check: any field differs from the last loaded values. The
  // platform is derived from the link, so it follows the URL.
  const baseline = baselineRef.current;
  const isDirty =
    sermonVideoUrl !== baseline.videoUrl ||
    sermonTitleVi !== baseline.titleVi ||
    sermonTitleEn !== baseline.titleEn ||
    sermonDescVi !== baseline.descVi ||
    sermonDescEn !== baseline.descEn ||
    sermonDate !== baseline.date;

  const handleSaveSermon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!previewPlatform || !sermonTitleVi.trim() || !sermonTitleEn.trim() || !sermonDate) {
      showFeedback('error', t('adminSermonFillRequired'));
      return;
    }

    try {
      setSubmitting(true);
      const token = getToken();
      const endpoint = editingSermonId ? `/api/sermons/${editingSermonId}` : '/api/sermons';
      const method = editingSermonId ? 'PUT' : 'POST';
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
          platform: previewPlatform,
          videoUrl: sermonVideoUrl.trim(),
          titleVi: sermonTitleVi.trim(),
          titleEn: sermonTitleEn.trim(),
          descriptionVi: sermonDescVi.trim() || null,
          descriptionEn: sermonDescEn.trim() || null,
          date: sermonDate,
        }),
      });

      showFeedback('success', editingSermonId ? t('adminSermonUpdated') : t('adminSermonSaved'));
      resetSermonForm();
      onRefreshData();
    } catch (err: any) {
      showFeedback('error', getErrorMessage(err, language, t('errSaveSermon')));
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetSermon) return;
    try {
      setDeletingSermon(true);
      const token = getToken();
      await apiFetch(`/api/sermons/${deleteTargetSermon.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      showFeedback('success', t('adminSermonDeleted'));
      setDeleteTargetSermon(null);
      onRefreshData();
    } catch (err: any) {
      showFeedback('error', getErrorMessage(err, language, t('errDeleteSermon')));
    } finally {
      setDeletingSermon(false);
    }
  };

  if (activeTab !== 'sermons') return null;

  return (
    <div className={s.container}>
      <form onSubmit={handleSaveSermon} className={s.form}>
        <div className={s.formHeader}>
          <div className={s.headerGroup}>
            <h3 className={s.formTitle}>
              {editingSermonId ? t('adminSermonEditTitle') : t('adminSermonAddTitle')}
            </h3>
            {editingSermonId && (
              <button type="button" onClick={resetSermonForm} className={s.cancelEditBtn}>
                {t('cancelEdit')}
              </button>
            )}
          </div>
        </div>

        <div className={s.field}>
          <label className={s.label}>{t('adminSermonUrlLabel')}</label>
          <input
            type="text"
            required
            placeholder={t('adminSermonUrlPlaceholder')}
            value={sermonVideoUrl}
            onChange={(e) => setSermonVideoUrl(e.target.value)}
            className={s.input}
          />
          {videoUrlInvalid && (
            <p className={s.invalidMsg}>{t('adminSermonUrlInvalid')}</p>
          )}
          {previewYouTubeId && (
            <div className={s.previewBox}>
              <span className={s.previewLabel}>
                <Video className={s.previewIcon} />
                <span>{t('adminSermonPreview')}</span>
              </span>
              <img
                src={getYouTubeThumbnailUrl(previewYouTubeId)}
                alt=""
                className={s.previewThumb}
              />
            </div>
          )}
          {previewFacebookUrl && (
            <div className={s.previewBox}>
              <span className={s.previewLabel}>
                <Video className={s.previewIcon} />
                <span>{t('adminSermonPreviewFacebook')}</span>
              </span>
            </div>
          )}
        </div>

        <div className={s.fieldGrid}>
          <div className={s.field}>
            <label className={s.label}>{t('adminSermonTitleVi')}</label>
            <input
              type="text"
              required
              value={sermonTitleVi}
              onChange={(e) => setSermonTitleVi(e.target.value)}
              className={s.input}
            />
          </div>
          <div className={s.field}>
            <label className={s.label}>{t('adminSermonTitleEn')}</label>
            <input
              type="text"
              required
              value={sermonTitleEn}
              onChange={(e) => setSermonTitleEn(e.target.value)}
              className={s.input}
            />
          </div>
        </div>

        <div className={s.fieldGrid}>
          <div className={s.field}>
            <label className={s.label}>{t('adminSermonDescVi')}</label>
            <textarea
              rows={2}
              value={sermonDescVi}
              onChange={(e) => setSermonDescVi(e.target.value)}
              className={s.textarea}
            />
          </div>
          <div className={s.field}>
            <label className={s.label}>{t('adminSermonDescEn')}</label>
            <textarea
              rows={2}
              value={sermonDescEn}
              onChange={(e) => setSermonDescEn(e.target.value)}
              className={s.textarea}
            />
          </div>
        </div>

        <div className={s.dateField}>
          <label className={s.label}>{t('adminSermonDate')}</label>
          <input
            type="date"
            required
            value={sermonDate}
            onChange={(e) => setSermonDate(e.target.value)}
            className={s.input}
          />
        </div>

        <div className={s.submitRow}>
          <Button
            type="submit"
            variant="dark"
            size="md"
            disabled={submitting || !isDirty}
            leftIcon={<Save className="w-3.5 h-3.5" />}
          >
            <span>
              {submitting
                ? t('commonSaving')
                : editingSermonId
                ? t('commonSaveChanges')
                : t('commonSave')}
            </span>
          </Button>
        </div>
      </form>

      {/* Published sermons list */}
      <div className={s.listSection}>
        <h4 className={s.listTitle}>
          {t('adminSermonPublished')} ({sermons.length})
        </h4>
        <div className={s.list}>
          {sermons.map((sermon) => {
            const title =
              language === 'vi' ? sermon.titleVi || sermon.titleEn : sermon.titleEn || sermon.titleVi;
            const isFacebook = (sermon.platform || 'youtube') === 'facebook';
            return (
              <div key={sermon.id} className={s.item}>
                {isFacebook ? (
                  <div className={`${s.itemThumb} ${s.itemThumbFb}`} aria-label={title}>
                    <span>f</span>
                  </div>
                ) : (
                  <img
                    src={sermon.videoId ? getYouTubeThumbnailUrl(sermon.videoId) : ''}
                    alt=""
                    loading="lazy"
                    className={s.itemThumb}
                  />
                )}
                <div className={s.itemBody}>
                  <span className={s.itemTitle}>{title}</span>
                  <span className={s.itemDate}>{formatDateLocale(sermon.date, language)}</span>
                </div>
                <div className={s.itemActions}>
                  <AdminActionButtons
                    onEdit={() => handleEditSermon(sermon)}
                    onDelete={() => setDeleteTargetSermon(sermon)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Shared confirmation modal for delete */}
      <ConfirmModal
        isOpen={Boolean(deleteTargetSermon)}
        title={t('adminSermonDeleteTitle')}
        message={
          deleteTargetSermon
            ? t('adminSermonDeleteConfirm', {
                title:
                  language === 'vi'
                    ? deleteTargetSermon.titleVi || deleteTargetSermon.titleEn
                    : deleteTargetSermon.titleEn || deleteTargetSermon.titleVi,
              })
            : ''
        }
        confirmText={t('commonDelete')}
        loading={deletingSermon}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTargetSermon(null)}
      />
    </div>
  );
};
