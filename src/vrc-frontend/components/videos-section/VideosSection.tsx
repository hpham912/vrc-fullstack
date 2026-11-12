import React, { useMemo, useState } from 'react';
import { Video as VideoIcon, Play, Calendar } from 'lucide-react';
import { Video } from '../../types/index.ts';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { apiFetch } from '../../utils/api.ts';
import { Card, LoadingShimmer, AdminAddButton, AdminActionButtons, Badge, ConfirmModal, SegmentedControl, YouTubePlayer, FacebookPlayer } from '../../common-component/index.ts';
import { getYouTubeThumbnailUrl } from '../../../vrc-shared/utils/youtube.ts';
import { formatDateLocale } from '../../utils/dateFormatter.ts';
import { VIDEO_BUILTIN_CATEGORIES, getVideoCategoryLabel, getVideoCategoryTone, isBuiltinVideoCategory } from '../../utils/videoCategory.ts';
import { videosSectionStyles } from './VideosSection.styles.ts';

interface VideosSectionProps {
  videos: Video[];
  isLoading?: boolean;
  isAdmin?: boolean;
  onOpenAdminPortal?: (tab?: string, video?: Video | null) => void;
  onRefresh?: () => void;
}

// Full-page Video tab: sermon videos, singings, reels about the
// church, and any other video. The videos live on YouTube or
// Facebook — the app stores only the link, so each card shows
// YouTube's thumbnail (or a Facebook placeholder, since Facebook
// gives no free thumbnail) and tapping it opens the matching
// embedded player in a modal, inside the app. The filter row above
// the list is the shared SegmentedControl, with one option per
// category present in the loaded videos (All first, then the
// built-ins in picker order, then custom categories as typed).
export const VideosSection: React.FC<VideosSectionProps> = ({
  videos,
  isLoading = false,
  isAdmin = false,
  onOpenAdminPortal,
  onRefresh,
}) => {
  const { language, t } = useLanguage();
  const { getToken } = useAuth();
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [deleteTargetVideo, setDeleteTargetVideo] = useState<Video | null>(null);
  const [deletingVideo, setDeletingVideo] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Categories present in the loaded videos, built-ins first in
  // picker order, then custom categories in first-seen order. Rows
  // saved before categories existed have no category — they are
  // sermons.
  const presentCategories = useMemo(() => {
    const seen: string[] = [];
    for (const video of videos) {
      const category = video.category || 'sermon';
      if (!seen.includes(category)) seen.push(category);
    }
    const builtins = VIDEO_BUILTIN_CATEGORIES.filter((category) => seen.includes(category));
    const customs = seen.filter((category) => !isBuiltinVideoCategory(category));
    return [...builtins, ...customs];
  }, [videos]);

  // A filter whose category no longer exists (its last video was
  // deleted) falls back to All instead of showing an empty list.
  const effectiveFilter =
    categoryFilter === 'all' || presentCategories.includes(categoryFilter) ? categoryFilter : 'all';
  const filteredVideos =
    effectiveFilter === 'all'
      ? videos
      : videos.filter((video) => (video.category || 'sermon') === effectiveFilter);

  // Delete from the card, same as the Events page: a confirm modal,
  // then DELETE /api/videos/:id, then reload the list. The video
  // stays visible if the delete fails, so the failure is obvious.
  const handleConfirmDelete = async () => {
    if (!deleteTargetVideo) return;
    try {
      setDeletingVideo(true);
      const token = getToken();
      await apiFetch(`/api/videos/${deleteTargetVideo.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setDeleteTargetVideo(null);
      onRefresh?.();
    } catch (err) {
      console.error('Failed to delete video:', err);
      setDeleteTargetVideo(null);
    } finally {
      setDeletingVideo(false);
    }
  };

  const getVideoTitle = (video: Video) =>
    language === 'vi' ? video.titleVi || video.titleEn : video.titleEn || video.titleVi;
  const getVideoDescription = (video: Video) =>
    language === 'vi'
      ? video.descriptionVi || video.descriptionEn || ''
      : video.descriptionEn || video.descriptionVi || '';

  return (
    <div className={videosSectionStyles.page}>
      <div className={videosSectionStyles.headerRow}>
        <div className="min-w-0">
          <span className={videosSectionStyles.headerSubtitle}>{t('videoSubtitle')}</span>
          <h1 className={videosSectionStyles.headerTitle}>{t('videoTitle')}</h1>
        </div>

        {isAdmin && onOpenAdminPortal && (
          <AdminAddButton
            onClick={() => onOpenAdminPortal('videos')}
            title={t('adminVideoAddTitle')}
          />
        )}
      </div>

      {videos.length > 0 && (
        <div className={videosSectionStyles.filterRow}>
          <SegmentedControl
            options={[
              { value: 'all', label: t('videoCategoryAll') },
              ...presentCategories.map((category) => ({
                value: category,
                label: getVideoCategoryLabel(category, t),
              })),
            ]}
            value={effectiveFilter}
            onChange={setCategoryFilter}
            ariaLabel={t('videoCategoryAll')}
          />
        </div>
      )}

      {isLoading ? (
        <LoadingShimmer variant="card" count={3} />
      ) : videos.length === 0 ? (
        <Card variant="empty" padding="empty">
          <VideoIcon className={videosSectionStyles.emptyIcon} />
          <p className={videosSectionStyles.emptyTitle}>{t('videoEmpty')}</p>
          <p className={videosSectionStyles.emptySub}>{t('videoEmptySub')}</p>
        </Card>
      ) : (
        <div className={videosSectionStyles.listContainer}>
          {filteredVideos.map((video) => {
            const title = getVideoTitle(video);
            const description = getVideoDescription(video);
            // Rows saved before the Facebook column existed have no
            // platform — they are YouTube videos.
            const platform = video.platform || 'youtube';
            const isFacebook = platform === 'facebook';
            const category = video.category || 'sermon';
            return (
              <div
                key={video.id}
                onClick={() => setSelectedVideo(video)}
                className={videosSectionStyles.videoCard}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') setSelectedVideo(video);
                }}
              >
                <div className={videosSectionStyles.thumbWrap}>
                  {isFacebook ? (
                    <div className={videosSectionStyles.fbThumb} aria-label={title}>
                      <span className={videosSectionStyles.fbThumbIcon}>f</span>
                    </div>
                  ) : (
                    <img
                      src={video.videoId ? getYouTubeThumbnailUrl(video.videoId) : ''}
                      alt={title}
                      loading="lazy"
                      className={videosSectionStyles.thumbImg}
                    />
                  )}
                  <span className={videosSectionStyles.playBadge}>
                    <Play className={videosSectionStyles.playIcon} />
                  </span>
                  <span className={videosSectionStyles.platformBadgeOverlay}>
                    <Badge tone={isFacebook ? 'facebook' : 'youtube'}>
                      {isFacebook ? 'Facebook' : 'YouTube'}
                    </Badge>
                  </span>
                </div>

                <div className={videosSectionStyles.cardBody}>
                  <div className={videosSectionStyles.badgesRow}>
                    <Badge tone={getVideoCategoryTone(category)}>
                      {getVideoCategoryLabel(category, t)}
                    </Badge>
                  </div>
                  <div className={videosSectionStyles.cardHeaderRow}>
                    <h3 className={videosSectionStyles.cardTitle}>{title}</h3>
                    {isAdmin && (
                      <span
                        className={videosSectionStyles.adminActionRow}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <AdminActionButtons
                          onEdit={() => onOpenAdminPortal?.('videos', video)}
                          onDelete={() => setDeleteTargetVideo(video)}
                        />
                      </span>
                    )}
                  </div>
                  {description && <p className={videosSectionStyles.cardDesc}>{description}</p>}
                  <div className={videosSectionStyles.cardDateRow}>
                    <Calendar className={videosSectionStyles.cardDateIcon} />
                    <span>{formatDateLocale(video.date, language)}</span>
                    {video.presenter && <span>• {video.presenter}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Video player: the shared YouTubePlayer or FacebookPlayer modal,
          matching the video's platform. The video streams from its
          platform, so the app never downloads or stores it. */}
      {selectedVideo &&
        (selectedVideo.platform || 'youtube') === 'facebook' ? (
          <FacebookPlayer
            isOpen={Boolean(selectedVideo)}
            onClose={() => setSelectedVideo(null)}
            videoUrl={selectedVideo.videoUrl}
            title={getVideoTitle(selectedVideo)}
            description={getVideoDescription(selectedVideo)}
            date={selectedVideo.date}
            isVertical={selectedVideo.isVertical}
          />
        ) : (
          selectedVideo &&
          selectedVideo.videoId && (
            <YouTubePlayer
              isOpen={Boolean(selectedVideo)}
              onClose={() => setSelectedVideo(null)}
              videoId={selectedVideo.videoId}
              title={getVideoTitle(selectedVideo)}
              description={getVideoDescription(selectedVideo)}
              date={selectedVideo.date}
            />
          )
        )}
      {/* Common Confirmation Modal for Delete (same as the Events page) */}
      <ConfirmModal
        isOpen={Boolean(deleteTargetVideo)}
        title={t('adminVideoDeleteTitle')}
        message={
          deleteTargetVideo
            ? t('adminVideoDeleteConfirm', {
                title:
                  (language === 'vi'
                    ? deleteTargetVideo.titleVi
                    : deleteTargetVideo.titleEn) || '',
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
