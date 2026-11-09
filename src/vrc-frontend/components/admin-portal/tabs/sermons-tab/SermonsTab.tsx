import React, { useState } from 'react';
import { Save, Video } from 'lucide-react';
import { Sermon } from '../../../../types/index.ts';
import { useLanguage } from '../../../../context/LanguageContext.tsx';
import { apiFetch } from '../../../../utils/api.ts';
import { getErrorMessage } from '../../../../utils/errors.ts';
import { extractYouTubeVideoId, getYouTubeThumbnailUrl } from '../../../../../vrc-shared/utils/youtube.ts';
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
  getToken: () => string | null;
  showFeedback: (type: 'success' | 'error', message: string) => void;
  onRefreshData: () => void;
}

// Sermons (Bài Giảng): form + published list. The admin pastes a YouTube
// link — the video ID is extracted live and a thumbnail preview confirms
// it is the right video before saving. The video itself is never stored;
// only the link, bilingual title + description, and the Sunday date.
export const SermonsTab: React.FC<SermonsTabProps> = ({
  sermons,
  activeTab,
  getToken,
  showFeedback,
  onRefreshData,
}) => {
  const { t, language } = useLanguage();
  const [editingSermonId, setEditingSermonId] = useState<number | null>(null);
  const [sermonYoutubeUrl, setSermonYoutubeUrl] = useState('');
  const [sermonTitleVi, setSermonTitleVi] = useState('');
  const [sermonTitleEn, setSermonTitleEn] = useState('');
  const [sermonDescVi, setSermonDescVi] = useState('');
  const [sermonDescEn, setSermonDescEn] = useState('');
  const [sermonDate, setSermonDate] = useState(new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTargetSermon, setDeleteTargetSermon] = useState<Sermon | null>(null);
  const [deletingSermon, setDeletingSermon] = useState(false);

  // Live-extract the video ID from whatever link is pasted, so the
  // thumbnail preview and the save validation share one source of truth.
  const previewVideoId = extractYouTubeVideoId(sermonYoutubeUrl);
  const youtubeUrlInvalid = sermonYoutubeUrl.trim() !== '' && !previewVideoId;

  const resetSermonForm = () => {
    setEditingSermonId(null);
    setSermonYoutubeUrl('');
    setSermonTitleVi('');
    setSermonTitleEn('');
    setSermonDescVi('');
    setSermonDescEn('');
    setSermonDate(new Date().toISOString().split('T')[0]);
  };

  const handleEditSermon = (sermon: Sermon) => {
    setEditingSermonId(sermon.id);
    setSermonYoutubeUrl(sermon.youtubeUrl);
    setSermonTitleVi(sermon.titleVi);
    setSermonTitleEn(sermon.titleEn);
    setSermonDescVi(sermon.descriptionVi || '');
    setSermonDescEn(sermon.descriptionEn || '');
    setSermonDate(sermon.date);
  };

  const handleSaveSermon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!previewVideoId || !sermonTitleVi.trim() || !sermonTitleEn.trim() || !sermonDate) {
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
          youtubeUrl: sermonYoutubeUrl.trim(),
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
            value={sermonYoutubeUrl}
            onChange={(e) => setSermonYoutubeUrl(e.target.value)}
            className={s.input}
          />
          {youtubeUrlInvalid && (
            <p className={s.invalidMsg}>{t('adminSermonUrlInvalid')}</p>
          )}
          {previewVideoId && (
            <div className={s.previewBox}>
              <span className={s.previewLabel}>
                <Video className={s.previewIcon} />
                <span>{t('adminSermonPreview')}</span>
              </span>
              <img
                src={getYouTubeThumbnailUrl(previewVideoId)}
                alt=""
                className={s.previewThumb}
              />
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
            disabled={submitting}
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
            return (
              <div key={sermon.id} className={s.item}>
                <img
                  src={getYouTubeThumbnailUrl(sermon.videoId)}
                  alt=""
                  loading="lazy"
                  className={s.itemThumb}
                />
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
