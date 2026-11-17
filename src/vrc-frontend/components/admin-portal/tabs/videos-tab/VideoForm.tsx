import React from 'react';
import { Save, Video as VideoIcon } from 'lucide-react';
import { useLanguage } from '../../../../context/LanguageContext.tsx';
import { getYouTubeThumbnailUrl } from '../../../../../vrc-shared/utils/youtube.ts';
import type { VideoCategoryPicker } from '../../../../utils/videoCategory.ts';
import { Banner, Button, SegmentedControl, TextField } from '../../../../common-component/index.ts';
import { videoFormStyles } from './VideoForm.styles.ts';

// Form values, for dirty-checking: the Save button is only enabled
// while the form differs from the last loaded values (a fresh form,
// or the video being edited). The video link is one field — the
// platform (YouTube or Facebook) is detected from the pasted link.
// isVertical is the admin's Tall/Wide pick for a Facebook video.
// category is the picker value; customCategory is the typed name
// when the picker is 'custom' (a stored custom category loads back
// as picker 'custom' + the stored name).
export type VideoFormValues = {
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

interface VideoFormProps {
  // All form values, owned by the parent (VideosTab). The form is
  // controlled: every edit goes back up through onValuesChange.
  values: VideoFormValues;
  onValuesChange: (patch: Partial<VideoFormValues>) => void;
  // The video being edited, or null for a new one (drives the
  // Add/Edit title and the Cancel-edit button).
  editingVideoId: number | null;
  onCancelEdit: () => void;
  onSubmit: (e: React.FormEvent) => void;
  submitting: boolean;
  // Dirty-check, owned by the parent: the Save button is only
  // enabled while the form differs from the last loaded values.
  isDirty: boolean;
  // Save feedback shown below the save button (mobile only).
  saveSuccess: string | null;
  saveError: string | null;
  onDismissSaveError: () => void;
  // Platform detection, computed by the parent from the link (the
  // save validation shares the same source of truth).
  previewYouTubeId: string | null;
  previewFacebookUrl: string | null;
  previewPlatform: 'youtube' | 'facebook' | null;
  videoUrlInvalid: boolean;
}

// The video add/edit form. The admin pastes a YouTube or Facebook
// link — the platform is detected from the link and a preview
// confirms it is the right video before saving (a thumbnail for
// YouTube; a Facebook badge for Facebook, which gives no free
// thumbnail). The video itself is never stored; only the link,
// platform, bilingual title + description, the category, the
// presenter, and the date.
export const VideoForm: React.FC<VideoFormProps> = ({
  values,
  onValuesChange,
  editingVideoId,
  onCancelEdit,
  onSubmit,
  submitting,
  isDirty,
  saveSuccess,
  saveError,
  onDismissSaveError,
  previewYouTubeId,
  previewFacebookUrl,
  previewPlatform,
  videoUrlInvalid,
}) => {
  const { t } = useLanguage();

  return (
    <form onSubmit={onSubmit} className={videoFormStyles.form}>
      <div className={videoFormStyles.formHeader}>
        <div className={videoFormStyles.headerGroup}>
          <h3 className={videoFormStyles.formTitle}>
            {editingVideoId ? t('adminVideoEditTitle') : t('adminVideoAddTitle')}
          </h3>
          {editingVideoId && (
            <button type="button" onClick={onCancelEdit} className={videoFormStyles.cancelEditBtn}>
              {t('cancelEdit')}
            </button>
          )}
        </div>
      </div>

      <div className={videoFormStyles.field}>
        <label className={videoFormStyles.label}>{t('adminVideoUrlLabel')}</label>
        <input
          type="text"
          required
          placeholder={t('adminVideoUrlPlaceholder')}
          value={values.videoUrl}
          onChange={(e) => onValuesChange({ videoUrl: e.target.value })}
          className={videoFormStyles.input}
        />
        {videoUrlInvalid && (
          <p className={videoFormStyles.invalidMsg}>{t('adminVideoUrlInvalid')}</p>
        )}
        {previewYouTubeId && (
          <div className={videoFormStyles.previewBox}>
            <span className={videoFormStyles.previewLabel}>
              <VideoIcon className={videoFormStyles.previewIcon} />
              <span>{t('adminVideoPreview')}</span>
            </span>
            <img
              src={getYouTubeThumbnailUrl(previewYouTubeId)}
              alt=""
              className={videoFormStyles.previewThumb}
            />
          </div>
        )}
        {previewFacebookUrl && (
          <div className={videoFormStyles.previewBox}>
            <span className={videoFormStyles.previewLabel}>
              <VideoIcon className={videoFormStyles.previewIcon} />
              <span>{t('adminVideoPreviewFacebook')}</span>
            </span>
          </div>
        )}
      </div>

      {/* Category: the four built-ins, or Custom — which opens a
          text input for the custom name. The name is stored exactly
          as typed and shown as typed in both languages. */}
      <div className={videoFormStyles.field}>
        <label className={videoFormStyles.label}>{t('adminVideoCategoryLabel')}</label>
        <SegmentedControl
          options={[
            { value: 'sermon', label: t('videoCategorySermon') },
            { value: 'singing', label: t('videoCategorySinging') },
            { value: 'reel', label: t('videoCategoryReel') },
            { value: 'other', label: t('videoCategoryOther') },
            { value: 'custom', label: t('videoCategoryCustom') },
          ]}
          value={values.category}
          onChange={(next) => onValuesChange({ category: next })}
          ariaLabel={t('adminVideoCategoryLabel')}
        />
        {values.category === 'custom' && (
          <div className={videoFormStyles.customCategoryWrap}>
            <label className={videoFormStyles.label}>{t('adminVideoCustomCategoryLabel')}</label>
            <input
              type="text"
              value={values.customCategory}
              onChange={(e) => onValuesChange({ customCategory: e.target.value })}
              className={videoFormStyles.input}
            />
          </div>
        )}
      </div>

      {/* Tall / Wide: a Facebook link does not say whether the video
          is vertical or landscape (a /reel/ link can hold a
          landscape video), so the admin picks the shape and the
          player uses it for the frame and modal size. */}
      {previewPlatform === 'facebook' && (
        <div className={videoFormStyles.field}>
          <label className={videoFormStyles.label}>{t('adminVideoShape')}</label>
          <SegmentedControl
            options={[
              { value: 'tall', label: t('adminVideoShapeTall') },
              { value: 'wide', label: t('adminVideoShapeWide') },
            ]}
            value={values.isVertical ? 'tall' : 'wide'}
            onChange={(next) => onValuesChange({ isVertical: next === 'tall' })}
            ariaLabel={t('adminVideoShape')}
          />
        </div>
      )}

      <div className={videoFormStyles.fieldGroup}>
        <span className={videoFormStyles.fieldLabel}>{t('adminVideoTitleLabel')}</span>
        <TextField
          label={t('commonLangVi')}
          value={values.titleVi}
          onChange={(value) => onValuesChange({ titleVi: value })}
        />
        <TextField
          label={t('commonLangEn')}
          value={values.titleEn}
          onChange={(value) => onValuesChange({ titleEn: value })}
        />
      </div>

      <div className={videoFormStyles.fieldGroup}>
        <span className={videoFormStyles.fieldLabel}>{t('adminVideoDescLabel')}</span>
        <TextField
          label={t('commonLangVi')}
          value={values.descVi}
          onChange={(value) => onValuesChange({ descVi: value })}
          multiline
          rows={2}
        />
        <TextField
          label={t('commonLangEn')}
          value={values.descEn}
          onChange={(value) => onValuesChange({ descEn: value })}
          multiline
          rows={2}
        />
      </div>

      <div className={videoFormStyles.presenterDateRow}>
        <div className={videoFormStyles.presenterField}>
          <label className={videoFormStyles.label}>{t('adminVideoPresenterLabel')}</label>
          <input
            type="text"
            value={values.presenter}
            onChange={(e) => onValuesChange({ presenter: e.target.value })}
            className={videoFormStyles.input}
          />
        </div>
        <div className={videoFormStyles.dateField}>
          <label className={videoFormStyles.label}>{t('adminVideoDate')}</label>
          <input
            type="date"
            required
            value={values.date}
            onChange={(e) => onValuesChange({ date: e.target.value })}
            className={videoFormStyles.input}
          />
        </div>
      </div>

      <div className={videoFormStyles.submitRow}>
        <Button
          type="submit"
          variant="dark"
          size="md"
          loading={submitting}
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
    </form>
  );
};
