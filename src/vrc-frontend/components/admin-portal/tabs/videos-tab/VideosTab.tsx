import React, { useEffect, useRef, useState } from 'react';
import { Save, Video as VideoIcon } from 'lucide-react';
import { Video } from '../../../../types/index.ts';
import { useLanguage } from '../../../../context/LanguageContext.tsx';
import { apiFetch } from '../../../../utils/api.ts';
import { getErrorMessage } from '../../../../utils/errors.ts';
import { extractYouTubeVideoId, getYouTubeThumbnailUrl } from '../../../../../vrc-shared/utils/youtube.ts';
import { extractFacebookVideoUrl } from '../../../../../vrc-shared/utils/facebook.ts';
import { formatDateLocale } from '../../../../utils/dateFormatter.ts';
import { getVideoCategoryLabel, isBuiltinVideoCategory, type VideoCategoryPicker } from '../../../../utils/videoCategory.ts';
import { AdminActionButtons, Button, ConfirmModal, SegmentedControl } from '../../../../common-component/index.ts';
import { videosTabStyles } from './VideosTab.styles.ts';

interface VideosTabProps {
  videos: Video[];
  // Which tab the parent is showing. The child stays mounted for the
  // whole portal session (returning null when its tab isn't active) so
  // a half-typed form or an in-progress edit survives switching to
  // another tab and back, exactly as before the split.
  activeTab: string;
  // A video to edit, when the portal was opened from a video card
  // on the public Video page (same as initialEvent for events).
  initialVideo?: Video | null;
  getToken: () => string | null;
  showFeedback: (type: 'success' | 'error', message: string) => void;
  onRefreshData: () => void;
}

// Form values, for dirty-checking: the Save button is only enabled
// while the form differs from the last loaded values (a fresh form,
// or the video being edited). The video link is one field — the
// platform (YouTube or Facebook) is detected from the pasted link.
// isVertical is the admin's Tall/Wide pick for a Facebook video.
// category is the picker value; customCategory is the typed name
// when the picker is 'custom' (a stored custom category loads back
// as picker 'custom' + the stored name).
type VideoFormValues = {
  videoUrl: string;
  platform: 'youtube' | 'facebook';
  isVertical: boolean;
  category: VideoCategoryPicker;
  customCategory: string;
  presenter: string;
  titleVi: string;
  titleEn: string;
  descVi: string;
  descEn: string;
  date: string;
};

const getTodayStr = () => new Date().toISOString().split('T')[0];

const getDefaultVideoValues = (): VideoFormValues => ({
  videoUrl: '',
  platform: 'youtube',
  isVertical: false,
  category: 'sermon',
  customCategory: '',
  presenter: '',
  titleVi: '',
  titleEn: '',
  descVi: '',
  descEn: '',
  date: getTodayStr(),
});

const getVideoValuesFromItem = (video: Video): VideoFormValues => {
  const platform = video.platform || 'youtube';
  const storedCategory = video.category || 'sermon';
  const isBuiltin = isBuiltinVideoCategory(storedCategory);
  return {
    videoUrl: video.videoUrl || '',
    platform,
    isVertical: platform === 'facebook' ? Boolean(video.isVertical) : false,
    category: isBuiltin ? storedCategory : 'custom',
    customCategory: isBuiltin ? '' : storedCategory,
    presenter: video.presenter || '',
    titleVi: video.titleVi,
    titleEn: video.titleEn,
    descVi: video.descriptionVi || '',
    descEn: video.descriptionEn || '',
    date: video.date,
  };
};

// The category stored on save: the picked built-in, or the typed
// custom name. A Custom pick with an empty name falls back to
// 'other' rather than storing a blank category.
const resolveCategory = (category: VideoCategoryPicker, customCategory: string): string =>
  category === 'custom' ? customCategory.trim() || 'other' : category;

// Videos: form + published list. The admin pastes a YouTube or
// Facebook link — the platform is detected from the link and a
// preview confirms it is the right video before saving (a thumbnail
// for YouTube; a Facebook badge for Facebook, which gives no free
// thumbnail). The video itself is never stored; only the link,
// platform, bilingual title + description, the category, the
// presenter, and the date.
export const VideosTab: React.FC<VideosTabProps> = ({
  videos,
  activeTab,
  initialVideo,
  getToken,
  showFeedback,
  onRefreshData,
}) => {
  const { t, language } = useLanguage();
  const [editingVideoId, setEditingVideoId] = useState<number | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoIsVertical, setVideoIsVertical] = useState(false);
  const [videoCategory, setVideoCategory] = useState<VideoCategoryPicker>('sermon');
  const [videoCustomCategory, setVideoCustomCategory] = useState('');
  const [videoPresenter, setVideoPresenter] = useState('');
  const [videoTitleVi, setVideoTitleVi] = useState('');
  const [videoTitleEn, setVideoTitleEn] = useState('');
  const [videoDescVi, setVideoDescVi] = useState('');
  const [videoDescEn, setVideoDescEn] = useState('');
  const [videoDate, setVideoDate] = useState(getTodayStr());
  const [submitting, setSubmitting] = useState(false);
  const [deleteTargetVideo, setDeleteTargetVideo] = useState<Video | null>(null);
  const [deletingVideo, setDeletingVideo] = useState(false);

  // Last loaded values — the Save button is enabled only while the
  // form differs from these.
  const baselineRef = useRef<VideoFormValues>(getDefaultVideoValues());

  const applyVideoValues = (values: VideoFormValues) => {
    setVideoUrl(values.videoUrl);
    setVideoIsVertical(values.isVertical);
    setVideoCategory(values.category);
    setVideoCustomCategory(values.customCategory);
    setVideoPresenter(values.presenter);
    setVideoTitleVi(values.titleVi);
    setVideoTitleEn(values.titleEn);
    setVideoDescVi(values.descVi);
    setVideoDescEn(values.descEn);
    setVideoDate(values.date);
  };

  // Detect the platform from whatever link is pasted, so the preview
  // and the save validation share one source of truth. YouTube wins
  // when a link somehow matches both (it never does in practice).
  const previewYouTubeId = extractYouTubeVideoId(videoUrl);
  const previewFacebookUrl = !previewYouTubeId
    ? extractFacebookVideoUrl(videoUrl)
    : null;
  const previewPlatform: 'youtube' | 'facebook' | null = previewYouTubeId
    ? 'youtube'
    : previewFacebookUrl
    ? 'facebook'
    : null;
  const videoUrlInvalid = videoUrl.trim() !== '' && !previewPlatform;

  const resetVideoForm = () => {
    setEditingVideoId(null);
    const values = getDefaultVideoValues();
    applyVideoValues(values);
    baselineRef.current = values;
  };

  const handleEditVideo = (video: Video) => {
    setEditingVideoId(video.id);
    const values = getVideoValuesFromItem(video);
    applyVideoValues(values);
    baselineRef.current = values;
  };

  // Opened from a video card on the public Video page: load that
  // video into the form for editing (same as initialEvent).
  useEffect(() => {
    if (initialVideo) {
      handleEditVideo(initialVideo);
    }
  }, [initialVideo]);

  // Dirty-check: any field differs from the last loaded values. The
  // platform is derived from the link, so it follows the URL.
  const baseline = baselineRef.current;
  const isDirty =
    videoUrl !== baseline.videoUrl ||
    videoIsVertical !== baseline.isVertical ||
    videoCategory !== baseline.category ||
    videoCustomCategory !== baseline.customCategory ||
    videoPresenter !== baseline.presenter ||
    videoTitleVi !== baseline.titleVi ||
    videoTitleEn !== baseline.titleEn ||
    videoDescVi !== baseline.descVi ||
    videoDescEn !== baseline.descEn ||
    videoDate !== baseline.date;

  const handleSaveVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!previewPlatform || !videoTitleVi.trim() || !videoTitleEn.trim() || !videoDate) {
      showFeedback('error', t('adminVideoFillRequired'));
      return;
    }

    try {
      setSubmitting(true);
      const token = getToken();
      const endpoint = editingVideoId ? `/api/videos/${editingVideoId}` : '/api/videos';
      const method = editingVideoId ? 'PUT' : 'POST';
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
          videoUrl: videoUrl.trim(),
          isVertical: previewPlatform === 'facebook' ? videoIsVertical : false,
          category: resolveCategory(videoCategory, videoCustomCategory),
          presenter: videoPresenter.trim() || null,
          titleVi: videoTitleVi.trim(),
          titleEn: videoTitleEn.trim(),
          descriptionVi: videoDescVi.trim() || null,
          descriptionEn: videoDescEn.trim() || null,
          date: videoDate,
        }),
      });

      showFeedback('success', editingVideoId ? t('adminVideoUpdated') : t('adminVideoSaved'));
      resetVideoForm();
      onRefreshData();
    } catch (err: any) {
      showFeedback('error', getErrorMessage(err, language, t('errSaveVideo')));
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetVideo) return;
    try {
      setDeletingVideo(true);
      const token = getToken();
      await apiFetch(`/api/videos/${deleteTargetVideo.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      showFeedback('success', t('adminVideoDeleted'));
      setDeleteTargetVideo(null);
      onRefreshData();
    } catch (err: any) {
      showFeedback('error', getErrorMessage(err, language, t('errDeleteVideo')));
    } finally {
      setDeletingVideo(false);
    }
  };

  if (activeTab !== 'videos') return null;

  return (
    <div className={videosTabStyles.container}>
      <form onSubmit={handleSaveVideo} className={videosTabStyles.form}>
        <div className={videosTabStyles.formHeader}>
          <div className={videosTabStyles.headerGroup}>
            <h3 className={videosTabStyles.formTitle}>
              {editingVideoId ? t('adminVideoEditTitle') : t('adminVideoAddTitle')}
            </h3>
            {editingVideoId && (
              <button type="button" onClick={resetVideoForm} className={videosTabStyles.cancelEditBtn}>
                {t('cancelEdit')}
              </button>
            )}
          </div>
        </div>

        <div className={videosTabStyles.field}>
          <label className={videosTabStyles.label}>{t('adminVideoUrlLabel')}</label>
          <input
            type="text"
            required
            placeholder={t('adminVideoUrlPlaceholder')}
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            className={videosTabStyles.input}
          />
          {videoUrlInvalid && (
            <p className={videosTabStyles.invalidMsg}>{t('adminVideoUrlInvalid')}</p>
          )}
          {previewYouTubeId && (
            <div className={videosTabStyles.previewBox}>
              <span className={videosTabStyles.previewLabel}>
                <VideoIcon className={videosTabStyles.previewIcon} />
                <span>{t('adminVideoPreview')}</span>
              </span>
              <img
                src={getYouTubeThumbnailUrl(previewYouTubeId)}
                alt=""
                className={videosTabStyles.previewThumb}
              />
            </div>
          )}
          {previewFacebookUrl && (
            <div className={videosTabStyles.previewBox}>
              <span className={videosTabStyles.previewLabel}>
                <VideoIcon className={videosTabStyles.previewIcon} />
                <span>{t('adminVideoPreviewFacebook')}</span>
              </span>
            </div>
          )}
        </div>

        {/* Category: the four built-ins, or Custom — which opens a
            text input for the custom name. The name is stored exactly
            as typed and shown as typed in both languages. */}
        <div className={videosTabStyles.field}>
          <label className={videosTabStyles.label}>{t('adminVideoCategoryLabel')}</label>
          <SegmentedControl
            options={[
              { value: 'sermon', label: t('videoCategorySermon') },
              { value: 'singing', label: t('videoCategorySinging') },
              { value: 'reel', label: t('videoCategoryReel') },
              { value: 'other', label: t('videoCategoryOther') },
              { value: 'custom', label: t('videoCategoryCustom') },
            ]}
            value={videoCategory}
            onChange={setVideoCategory}
            ariaLabel={t('adminVideoCategoryLabel')}
          />
          {videoCategory === 'custom' && (
            <div className={videosTabStyles.customCategoryWrap}>
              <label className={videosTabStyles.label}>{t('adminVideoCustomCategoryLabel')}</label>
              <input
                type="text"
                value={videoCustomCategory}
                onChange={(e) => setVideoCustomCategory(e.target.value)}
                className={videosTabStyles.input}
              />
            </div>
          )}
        </div>

        {/* Tall / Wide: a Facebook link does not say whether the video
            is vertical or landscape (a /reel/ link can hold a
            landscape video), so the admin picks the shape and the
            player uses it for the frame and modal size. */}
        {previewPlatform === 'facebook' && (
          <div className={videosTabStyles.field}>
            <label className={videosTabStyles.label}>{t('adminVideoShape')}</label>
            <SegmentedControl
              options={[
                { value: 'tall', label: t('adminVideoShapeTall') },
                { value: 'wide', label: t('adminVideoShapeWide') },
              ]}
              value={videoIsVertical ? 'tall' : 'wide'}
              onChange={(next) => setVideoIsVertical(next === 'tall')}
              ariaLabel={t('adminVideoShape')}
            />
          </div>
        )}

        <div className={videosTabStyles.fieldGrid}>
          <div className={videosTabStyles.field}>
            <label className={videosTabStyles.label}>{t('adminVideoTitleVi')}</label>
            <input
              type="text"
              required
              value={videoTitleVi}
              onChange={(e) => setVideoTitleVi(e.target.value)}
              className={videosTabStyles.input}
            />
          </div>
          <div className={videosTabStyles.field}>
            <label className={videosTabStyles.label}>{t('adminVideoTitleEn')}</label>
            <input
              type="text"
              required
              value={videoTitleEn}
              onChange={(e) => setVideoTitleEn(e.target.value)}
              className={videosTabStyles.input}
            />
          </div>
        </div>

        <div className={videosTabStyles.fieldGrid}>
          <div className={videosTabStyles.field}>
            <label className={videosTabStyles.label}>{t('adminVideoDescVi')}</label>
            <textarea
              rows={2}
              value={videoDescVi}
              onChange={(e) => setVideoDescVi(e.target.value)}
              className={videosTabStyles.textarea}
            />
          </div>
          <div className={videosTabStyles.field}>
            <label className={videosTabStyles.label}>{t('adminVideoDescEn')}</label>
            <textarea
              rows={2}
              value={videoDescEn}
              onChange={(e) => setVideoDescEn(e.target.value)}
              className={videosTabStyles.textarea}
            />
          </div>
        </div>

        <div className={videosTabStyles.presenterDateRow}>
          <div className={videosTabStyles.presenterField}>
            <label className={videosTabStyles.label}>{t('adminVideoPresenterLabel')}</label>
            <input
              type="text"
              value={videoPresenter}
              onChange={(e) => setVideoPresenter(e.target.value)}
              className={videosTabStyles.input}
            />
          </div>
          <div className={videosTabStyles.dateField}>
            <label className={videosTabStyles.label}>{t('adminVideoDate')}</label>
            <input
              type="date"
              required
              value={videoDate}
              onChange={(e) => setVideoDate(e.target.value)}
              className={videosTabStyles.input}
            />
          </div>
        </div>

        <div className={videosTabStyles.submitRow}>
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
                : editingVideoId
                ? t('commonSaveChanges')
                : t('commonSave')}
            </span>
          </Button>
        </div>
      </form>

      {/* Published videos list */}
      <div className={videosTabStyles.listSection}>
        <h4 className={videosTabStyles.listTitle}>
          {t('adminVideoPublished')} ({videos.length})
        </h4>
        <div className={videosTabStyles.list}>
          {videos.map((video) => {
            const title =
              language === 'vi' ? video.titleVi || video.titleEn : video.titleEn || video.titleVi;
            const isFacebook = (video.platform || 'youtube') === 'facebook';
            return (
              <div key={video.id} className={videosTabStyles.item}>
                {isFacebook ? (
                  <div className={`${videosTabStyles.itemThumb} ${videosTabStyles.itemThumbFb}`} aria-label={title}>
                    <span>f</span>
                  </div>
                ) : (
                  <img
                    src={video.videoId ? getYouTubeThumbnailUrl(video.videoId) : ''}
                    alt=""
                    loading="lazy"
                    className={videosTabStyles.itemThumb}
                  />
                )}
                <div className={videosTabStyles.itemBody}>
                  <span className={videosTabStyles.itemTitle}>{title}</span>
                  <span className={videosTabStyles.itemDate}>
                    {getVideoCategoryLabel(video.category || 'sermon', t)} • {formatDateLocale(video.date, language)}
                  </span>
                </div>
                <div className={videosTabStyles.itemActions}>
                  <AdminActionButtons
                    onEdit={() => handleEditVideo(video)}
                    onDelete={() => setDeleteTargetVideo(video)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Shared confirmation modal for delete */}
      <ConfirmModal
        isOpen={Boolean(deleteTargetVideo)}
        title={t('adminVideoDeleteTitle')}
        message={
          deleteTargetVideo
            ? t('adminVideoDeleteConfirm', {
                title:
                  language === 'vi'
                    ? deleteTargetVideo.titleVi || deleteTargetVideo.titleEn
                    : deleteTargetVideo.titleEn || deleteTargetVideo.titleVi,
              })
            : ''
        }
        confirmText={t('commonDelete')}
        loading={deletingVideo}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTargetVideo(null)}
      />
    </div>
  );
};
